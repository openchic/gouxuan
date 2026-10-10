import argparse
import asyncio
import getpass
import sys
from datetime import UTC, datetime
from uuid import UUID

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.auth import Account, AuthError, password_hasher
from app.database import check_database, engine, session_factory
from app.models import AuthSession, User


def normalize_email(email: str) -> str:
    return str(TypeAdapter(EmailStr).validate_python(email.strip().lower()))


async def create_account(
    database: AsyncSession,
    email: str,
    password: str,
    role: str = 'user',
    *,
    initialize: bool = False,
) -> tuple[Account, bool]:
    """Create an account; first-admin initialization never changes existing credentials."""
    email = normalize_email(email)
    if role not in ('user', 'admin'):
        raise AuthError('INVALID_ROLE', '角色只能为 user 或 admin', 400)
    if not 12 <= len(password) <= 1024:
        raise AuthError('INVALID_PASSWORD', '密码长度必须为 12 到 1024 个字符', 400)
    password_hash = await run_in_threadpool(password_hasher.hash, password)
    try:
        async with database.begin():
            if initialize:
                # Serialize initializers even before any account row exists.
                await database.execute(text('SELECT pg_advisory_xact_lock(17489001)'))
                existing = await database.scalar(
                    select(User).where(User.role == 'admin').order_by(User.created_at)
                )
                if existing:
                    return Account.model_validate(existing), False
            user = User(
                email=email,
                password_hash=password_hash,
                role='admin' if initialize else role,
            )
            database.add(user)
            await database.flush()
            account = Account.model_validate(user)
    except IntegrityError:
        raise AuthError('ACCOUNT_EXISTS', '邮箱已存在，未修改原账号', 409) from None
    return account, True


async def update_account(
    database: AsyncSession, email: str, *, password: str | None = None
) -> Account:
    """Reset a password or deactivate an account and revoke all its device sessions."""
    email = normalize_email(email)
    if password is not None and not 12 <= len(password) <= 1024:
        raise AuthError('INVALID_PASSWORD', '密码长度必须为 12 到 1024 个字符', 400)
    password_hash = (
        await run_in_threadpool(password_hasher.hash, password)
        if password is not None
        else None
    )
    async with database.begin():
        user = await database.scalar(
            select(User).where(User.email == email).with_for_update()
        )
        if not user:
            raise AuthError('ACCOUNT_NOT_FOUND', '账号不存在', 404)
        if password is None:
            user.is_active = False
        else:
            assert password_hash is not None
            user.password_hash = password_hash
        await database.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
            .values(
                revoked_at=datetime.now(UTC),
                revoked_reason='account_disabled'
                if password is None
                else 'password_reset',
            )
        )
        return Account.model_validate(user)


async def revoke_session(database: AsyncSession, session_id: UUID) -> None:
    """Revoke a specific device through the operator-only CLI."""
    async with database.begin():
        user_id = await database.scalar(
            select(AuthSession.user_id).where(AuthSession.id == session_id)
        )
        if user_id is None:
            raise AuthError('SESSION_NOT_FOUND', '设备会话不存在', 404)
        await database.scalar(select(User).where(User.id == user_id).with_for_update())
        await database.execute(
            update(AuthSession)
            .where(AuthSession.id == session_id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(UTC), revoked_reason='device_revoked')
        )


def read_password(from_stdin: bool) -> str:
    if from_stdin:
        return sys.stdin.readline().rstrip('\r\n')
    password = getpass.getpass('密码（至少 12 个字符）：')
    if password != getpass.getpass('再次输入密码：'):
        raise AuthError('PASSWORD_MISMATCH', '两次输入的密码不一致', 400)
    return password


async def run(args: argparse.Namespace) -> None:
    try:
        await check_database()
        async with session_factory() as database:
            if args.command in ('init-admin', 'create-user'):
                account, created = await create_account(
                    database,
                    args.email,
                    read_password(args.password_stdin),
                    args.role if args.command == 'create-user' else 'admin',
                    initialize=args.command == 'init-admin',
                )
                print('账号已创建' if created else '管理员已存在，账号和密码保持不变')
                print(account.model_dump_json())
            elif args.command in ('deactivate', 'reset-password'):
                account = await update_account(
                    database,
                    args.email,
                    password=read_password(args.password_stdin)
                    if args.command == 'reset-password'
                    else None,
                )
                print(account.model_dump_json())
            else:
                await revoke_session(database, args.session_id)
                print('设备会话已撤销')
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description='钩玄受控账号管理（仅运维入口）')
    commands = parser.add_subparsers(dest='command', required=True)
    for command in ('init-admin', 'create-user', 'reset-password', 'deactivate'):
        subparser = commands.add_parser(command)
        subparser.add_argument('--email', required=True)
        if command != 'deactivate':
            subparser.add_argument('--password-stdin', action='store_true')
        if command == 'create-user':
            subparser.add_argument('--role', choices=('user', 'admin'), default='user')
    revoke = commands.add_parser('revoke-session')
    revoke.add_argument('--session-id', required=True, type=UUID)
    try:
        asyncio.run(run(parser.parse_args()))
    except (AuthError, ValidationError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
