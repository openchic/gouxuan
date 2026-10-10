import hashlib
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID, uuid4

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.database import get_database
from app.models import AuthSession, RefreshToken, User
from app.settings import settings

password_hasher = PasswordHasher()
dummy_password_hash = password_hasher.hash(secrets.token_urlsafe(32))
bearer = HTTPBearer(auto_error=False)
Database = Annotated[AsyncSession, Depends(get_database)]


class AuthError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 401):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class Account(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    role: str


class Credentials(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = 'Bearer'
    access_expires_at: datetime
    refresh_expires_at: datetime
    session_id: UUID
    account: Account


@dataclass(frozen=True)
class Identity:
    account: Account
    session_id: UUID


def hash_token(token: str) -> bytes:
    return hashlib.sha256(token.encode()).digest()


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return password_hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


async def issue_credentials(
    database: AsyncSession, user: User, device: AuthSession, now: datetime
) -> Credentials:
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    device.idle_expires_at = min(
        now + timedelta(seconds=settings.session_idle_seconds),
        device.absolute_expires_at,
    )
    device.access_token_hash = hash_token(access_token)
    device.access_expires_at = min(
        now + timedelta(seconds=settings.access_token_seconds),
        device.idle_expires_at,
    )
    device.last_refreshed_at = now
    await database.flush()
    database.add(
        RefreshToken(
            session_id=device.id, token_hash=hash_token(refresh_token), issued_at=now
        )
    )
    await database.flush()
    return Credentials(
        access_token=access_token,
        refresh_token=refresh_token,
        access_expires_at=device.access_expires_at,
        refresh_expires_at=device.idle_expires_at,
        session_id=device.id,
        account=Account.model_validate(user),
    )


async def login(
    database: AsyncSession, email: str, password: str, device_name: str
) -> Credentials:
    """Persist a new device and hashed credentials atomically after password verification."""
    async with database.begin():
        record = (
            await database.execute(
                select(User.id, User.password_hash, User.is_active).where(
                    User.email == email.strip().lower()
                )
            )
        ).one_or_none()
    valid = await run_in_threadpool(
        verify_password,
        record.password_hash if record else dummy_password_hash,
        password,
    )
    if not record or not valid or not record.is_active:
        raise AuthError('LOGIN_FAILED', '邮箱或密码错误，或账号已停用')
    new_hash = (
        await run_in_threadpool(password_hasher.hash, password)
        if password_hasher.check_needs_rehash(record.password_hash)
        else None
    )
    async with database.begin():
        user = await database.scalar(
            select(User).where(User.id == record.id).with_for_update()
        )
        if not user or not user.is_active or user.password_hash != record.password_hash:
            raise AuthError('LOGIN_FAILED', '邮箱或密码错误，或账号已停用')
        if new_hash:
            user.password_hash = new_hash
        now = datetime.now(UTC)
        device = AuthSession(
            id=uuid4(),
            user_id=user.id,
            device_name=device_name,
            absolute_expires_at=now
            + timedelta(seconds=settings.session_absolute_seconds),
            created_at=now,
        )
        database.add(device)
        credentials = await issue_credentials(database, user, device, now)
    return credentials


async def lock_session(
    database: AsyncSession, session_id: UUID, user_id: UUID
) -> tuple[User, AuthSession]:
    # A consistent account -> device lock order also serializes password resets and login.
    user = await database.scalar(
        select(User).where(User.id == user_id).with_for_update()
    )
    device = await database.scalar(
        select(AuthSession).where(AuthSession.id == session_id).with_for_update()
    )
    if not user or not device or not user.is_active or device.revoked_at:
        raise AuthError('SESSION_REVOKED', '登录会话已撤销，请重新登录')
    return user, device


async def refresh(database: AsyncSession, refresh_token: str) -> Credentials:
    """Rotate a refresh token once; commit device revocation before reporting replay."""
    credentials = None
    replay = False
    async with database.begin():
        record = (
            await database.execute(
                select(RefreshToken.session_id, AuthSession.user_id)
                .join(AuthSession, AuthSession.id == RefreshToken.session_id)
                .where(RefreshToken.token_hash == hash_token(refresh_token))
            )
        ).one_or_none()
        if not record:
            raise AuthError('REFRESH_TOKEN_INVALID', '刷新凭据无效，请重新登录')
        user, device = await lock_session(database, record.session_id, record.user_id)
        token = await database.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == hash_token(refresh_token)
            )
        )
        assert token is not None
        now = datetime.now(UTC)
        if token.consumed_at:
            device.revoked_at = now
            device.revoked_reason = 'token_replay'
            replay = True
        elif device.idle_expires_at <= now or device.absolute_expires_at <= now:
            raise AuthError('REFRESH_TOKEN_EXPIRED', '刷新凭据已过期，请重新登录')
        else:
            token.consumed_at = now
            # Free the partial unique index before inserting the next token.
            await database.flush()
            credentials = await issue_credentials(database, user, device, now)
    if replay:
        raise AuthError('REFRESH_TOKEN_REPLAYED', '刷新凭据已使用，登录会话已撤销')
    assert credentials is not None
    return credentials


async def authenticate(database: AsyncSession, access_token: str) -> Identity:
    async with database.begin():
        record = (
            await database.execute(
                select(AuthSession, User)
                .join(User, User.id == AuthSession.user_id)
                .where(AuthSession.access_token_hash == hash_token(access_token))
            )
        ).one_or_none()
        if not record:
            raise AuthError('ACCESS_TOKEN_INVALID', '访问凭据无效')
        device, user = record
        if device.revoked_at or not user.is_active:
            raise AuthError('SESSION_REVOKED', '登录会话已撤销，请重新登录')
        now = datetime.now(UTC)
        if device.idle_expires_at <= now or device.absolute_expires_at <= now:
            raise AuthError('REFRESH_TOKEN_EXPIRED', '登录会话已过期，请重新登录')
        if device.access_expires_at <= now:
            raise AuthError('ACCESS_TOKEN_EXPIRED', '访问凭据已过期，请续期')
        return Identity(Account.model_validate(user), device.id)


async def current_identity(
    database: Database,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> Identity:
    """Authenticate a Bearer token for protected routes."""
    if not credentials:
        raise AuthError('AUTH_REQUIRED', '请先登录')
    return await authenticate(database, credentials.credentials)


async def require_admin(
    identity: Annotated[Identity, Depends(current_identity)],
) -> Identity:
    """Require a server-verified administrator for knowledge management routes."""
    if identity.account.role != 'admin':
        raise AuthError('PERMISSION_DENIED', '需要管理员权限', 403)
    return identity


async def logout(database: AsyncSession, identity: Identity) -> None:
    async with database.begin():
        _, device = await lock_session(
            database, identity.session_id, identity.account.id
        )
        device.revoked_at = datetime.now(UTC)
        device.revoked_reason = 'logout'
