import asyncio
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import func, inspect, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app import auth
from app.admin_cli import create_account, revoke_session, update_account
from app.models import AuthSession, Base, RefreshToken, User

PASSWORD = 'Test-Only-Password-2026'
EMAIL = 'admin@example.com'
DatabaseFactory = async_sessionmaker[AsyncSession]


def create_user(
    factory: DatabaseFactory, email: str = EMAIL, role: str = 'admin'
) -> None:
    async def run() -> None:
        async with factory() as database:
            await create_account(database, email, PASSWORD, role)

    asyncio.run(run())


def login(client: TestClient, email: str = EMAIL, password: str = PASSWORD) -> dict:
    response = client.post(
        '/v1/auth/login', json={'email': email, 'password': password}
    )
    assert response.status_code == 200, response.json()
    assert response.json()['code'] == 'OK'
    return response.json()['data']


def headers(credentials: dict) -> dict[str, str]:
    return {'Authorization': f'Bearer {credentials["access_token"]}'}


def change_session(
    factory: DatabaseFactory, credentials: dict, **values: object
) -> None:
    async def run() -> None:
        async with factory() as database, database.begin():
            await database.execute(
                update(AuthSession)
                .where(AuthSession.id == UUID(credentials['session_id']))
                .values(**values)
            )

    asyncio.run(run())


def test_migration_creates_only_auth_tables_and_matches_models(
    database_factory: DatabaseFactory,
) -> None:
    command.upgrade(
        Config(str(Path(__file__).resolve().parents[1] / 'alembic.ini')), 'head'
    )

    async def run() -> None:
        async with database_factory() as database:
            connection = await database.connection()
            names = await connection.run_sync(
                lambda connection: inspect(connection).get_table_names()
            )
            assert set(names) == {
                'alembic_version',
                'users',
                'auth_sessions',
                'refresh_tokens',
            }
            differences = await connection.run_sync(
                lambda connection: compare_metadata(
                    MigrationContext.configure(connection), Base.metadata
                )
            )
            assert differences == []

    asyncio.run(run())


def test_initial_admin_is_idempotent_without_changing_any_account(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    async def run() -> None:
        async with database_factory() as database:
            first, created = await create_account(
                database, ' ADMIN@example.com ', PASSWORD, initialize=True
            )
            assert created
            repeated, created = await create_account(
                database,
                'another@example.com',
                'Another-Password-2026',
                initialize=True,
            )
            assert not created and first == repeated
            async with database.begin():
                assert (
                    await database.scalar(select(func.count()).select_from(User)) == 1
                )

    asyncio.run(run())
    assert login(api_client)['account']['role'] == 'admin'


def test_email_unique_and_existing_user_is_not_promoted(
    database_factory: DatabaseFactory,
) -> None:
    create_user(database_factory, role='user')

    async def run() -> None:
        async with database_factory() as database:
            with pytest.raises(auth.AuthError, match='邮箱已存在'):
                await create_account(
                    database, ' ADMIN@example.com ', PASSWORD, initialize=True
                )
            async with database.begin():
                user = await database.scalar(select(User))
                assert user is not None and user.role == 'user'

    asyncio.run(run())


@pytest.mark.parametrize('role', ['user', 'admin'])
def test_login_and_current_account_for_both_roles(
    api_client: TestClient, database_factory: DatabaseFactory, role: str
) -> None:
    create_user(database_factory, role=role)
    credentials = login(api_client, ' ADMIN@example.com ')
    assert credentials['account']['email'] == EMAIL
    assert credentials['account']['role'] == role
    assert (
        api_client.get('/v1/auth/me', headers=headers(credentials)).json()['data']
        == credentials['account']
    )
    access = datetime.fromisoformat(credentials['access_expires_at'])
    idle = datetime.fromisoformat(credentials['refresh_expires_at'])
    assert 899 <= (access - datetime.now(UTC)).total_seconds() <= 900
    assert 30 * 86400 - 2 <= (idle - datetime.now(UTC)).total_seconds() <= 30 * 86400


def test_failed_login_is_uniform_and_validation_does_not_echo_secrets(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    missing = api_client.post(
        '/v1/auth/login', json={'email': 'missing@example.com', 'password': PASSWORD}
    )
    wrong = api_client.post(
        '/v1/auth/login', json={'email': EMAIL, 'password': 'wrong'}
    )
    assert missing.status_code == wrong.status_code == 401
    assert missing.json() == wrong.json()
    invalid = api_client.post(
        '/v1/auth/login', json={'email': EMAIL, 'password': PASSWORD, 'role': 'admin'}
    )
    assert invalid.status_code == 422 and PASSWORD not in invalid.text
    assert (
        api_client.post(
            '/v1/auth/register', json={'email': EMAIL, 'role': 'admin'}
        ).status_code
        == 404
    )


def test_passwords_and_tokens_are_only_persisted_as_hashes(
    api_client: TestClient,
    database_factory: DatabaseFactory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    create_user(database_factory)
    credentials = login(api_client)

    async def run() -> None:
        async with database_factory() as database:
            user = await database.scalar(select(User))
            session = await database.scalar(select(AuthSession))
            token = await database.scalar(select(RefreshToken))
            assert user is not None and user.password_hash.startswith('$argon2id$')
            assert auth.verify_password(user.password_hash, PASSWORD)
            assert not auth.verify_password(user.password_hash, 'wrong')
            assert session is not None and session.access_token_hash == auth.hash_token(
                credentials['access_token']
            )
            assert token is not None and token.token_hash == auth.hash_token(
                credentials['refresh_token']
            )

    asyncio.run(run())
    assert all(
        secret not in caplog.text
        for secret in (
            PASSWORD,
            credentials['access_token'],
            credentials['refresh_token'],
        )
    )


def test_protected_routes_require_identity_and_role(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    assert api_client.get('/v1/auth/me').json()['code'] == 'AUTH_REQUIRED'
    assert (
        api_client.get(
            '/v1/auth/me', headers={'Authorization': 'Bearer invalid'}
        ).json()['code']
        == 'ACCESS_TOKEN_INVALID'
    )
    create_user(database_factory, role='user')
    assert (
        api_client.get('/__tests/admin', headers=headers(login(api_client))).status_code
        == 403
    )
    create_user(database_factory, 'other@example.com')
    assert (
        api_client.get(
            '/__tests/admin', headers=headers(login(api_client, 'other@example.com'))
        ).status_code
        == 200
    )


def test_refresh_extends_idle_window_and_rotates_both_tokens(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    shortened_idle = datetime.now(UTC) + timedelta(days=1)
    change_session(database_factory, first, idle_expires_at=shortened_idle)
    response = api_client.post(
        '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
    )
    assert response.status_code == 200
    second = response.json()['data']
    assert (
        first['access_token'] != second['access_token']
        and first['refresh_token'] != second['refresh_token']
    )
    assert datetime.fromisoformat(
        second['refresh_expires_at']
    ) > shortened_idle + timedelta(days=28)
    assert api_client.get('/v1/auth/me', headers=headers(first)).status_code == 401
    assert api_client.get('/v1/auth/me', headers=headers(second)).status_code == 200


def test_access_expiration_can_be_refreshed(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    change_session(
        database_factory,
        first,
        access_expires_at=datetime.now(UTC) - timedelta(seconds=1),
    )
    assert (
        api_client.get('/v1/auth/me', headers=headers(first)).json()['code']
        == 'ACCESS_TOKEN_EXPIRED'
    )
    assert (
        api_client.post(
            '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
        ).status_code
        == 200
    )


def test_idle_expiration_cannot_be_revived(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    expired = datetime.now(UTC) - timedelta(seconds=1)
    change_session(
        database_factory, first, access_expires_at=expired, idle_expires_at=expired
    )
    response = api_client.post(
        '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
    )
    assert (
        response.status_code == 401
        and response.json()['code'] == 'REFRESH_TOKEN_EXPIRED'
    )


def test_absolute_expiration_caps_refresh_and_cannot_be_extended(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    absolute = datetime.now(UTC) + timedelta(hours=1)
    change_session(
        database_factory, first, idle_expires_at=absolute, absolute_expires_at=absolute
    )
    second = api_client.post(
        '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
    ).json()['data']
    assert datetime.fromisoformat(second['refresh_expires_at']) == absolute
    expired = datetime.now(UTC) - timedelta(seconds=1)
    change_session(
        database_factory,
        second,
        access_expires_at=expired,
        idle_expires_at=expired,
        absolute_expires_at=expired,
    )
    assert (
        api_client.post(
            '/v1/auth/refresh', json={'refresh_token': second['refresh_token']}
        ).json()['code']
        == 'REFRESH_TOKEN_EXPIRED'
    )


def test_refresh_replay_commits_revocation(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    second = api_client.post(
        '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
    ).json()['data']
    replay = api_client.post(
        '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
    )
    assert replay.json()['code'] == 'REFRESH_TOKEN_REPLAYED'
    assert (
        api_client.get('/v1/auth/me', headers=headers(second)).json()['code']
        == 'SESSION_REVOKED'
    )
    assert (
        api_client.post(
            '/v1/auth/refresh', json={'refresh_token': second['refresh_token']}
        ).json()['code']
        == 'SESSION_REVOKED'
    )


def test_concurrent_refresh_only_succeeds_once(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)

    def request_refresh(_: int):
        return api_client.post(
            '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
        )

    with ThreadPoolExecutor(max_workers=2) as executor:
        responses = list(executor.map(request_refresh, range(2)))
    assert sorted(response.status_code for response in responses) == [200, 401]
    successful = next(
        response.json()['data'] for response in responses if response.status_code == 200
    )
    assert (
        api_client.get('/v1/auth/me', headers=headers(successful)).json()['code']
        == 'SESSION_REVOKED'
    )


def test_logout_revokes_only_current_device(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first, other = login(api_client), login(api_client)
    assert api_client.post('/v1/auth/logout', headers=headers(first)).status_code == 200
    assert (
        api_client.get('/v1/auth/me', headers=headers(first)).json()['code']
        == 'SESSION_REVOKED'
    )
    assert (
        api_client.post(
            '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
        ).json()['code']
        == 'SESSION_REVOKED'
    )
    assert api_client.get('/v1/auth/me', headers=headers(other)).status_code == 200


def test_password_reset_revokes_existing_sessions(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)
    new_password = 'New-Test-Password-2026'

    async def run() -> None:
        async with database_factory() as database:
            await update_account(database, EMAIL, password=new_password)

    asyncio.run(run())
    assert (
        api_client.get('/v1/auth/me', headers=headers(first)).json()['code']
        == 'SESSION_REVOKED'
    )
    assert (
        api_client.post(
            '/v1/auth/refresh', json={'refresh_token': first['refresh_token']}
        ).json()['code']
        == 'SESSION_REVOKED'
    )
    assert login(api_client, password=new_password)['account']['email'] == EMAIL
    assert (
        api_client.post(
            '/v1/auth/login', json={'email': EMAIL, 'password': PASSWORD}
        ).status_code
        == 401
    )


def test_deactivation_revokes_sessions_and_rejects_login(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)

    async def run() -> None:
        async with database_factory() as database:
            await update_account(database, EMAIL)

    asyncio.run(run())
    assert (
        api_client.get('/v1/auth/me', headers=headers(first)).json()['code']
        == 'SESSION_REVOKED'
    )
    assert (
        api_client.post(
            '/v1/auth/login', json={'email': EMAIL, 'password': PASSWORD}
        ).json()['code']
        == 'LOGIN_FAILED'
    )


def test_operator_revoke_targets_one_session(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first, other = login(api_client), login(api_client)

    async def run() -> None:
        async with database_factory() as database:
            await revoke_session(database, UUID(first['session_id']))

    asyncio.run(run())
    assert api_client.get('/v1/auth/me', headers=headers(first)).status_code == 401
    assert api_client.get('/v1/auth/me', headers=headers(other)).status_code == 200


def test_failed_login_transaction_leaves_no_usable_credentials(
    api_client: TestClient,
    database_factory: DatabaseFactory,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    create_user(database_factory)
    original = auth.issue_credentials
    issued: list[auth.Credentials] = []

    async def fail(
        database: AsyncSession, user: User, device: AuthSession, now: datetime
    ) -> auth.Credentials:
        issued.append(await original(database, user, device, now))
        raise RuntimeError('simulated failure before commit')

    monkeypatch.setattr(auth, 'issue_credentials', fail)
    with pytest.raises(RuntimeError, match='simulated failure'):
        api_client.post('/v1/auth/login', json={'email': EMAIL, 'password': PASSWORD})

    async def run() -> None:
        async with database_factory() as database:
            assert (
                await database.scalar(select(func.count()).select_from(AuthSession))
                == 0
            )
            assert (
                await database.scalar(select(func.count()).select_from(RefreshToken))
                == 0
            )

    asyncio.run(run())
    assert (
        api_client.get(
            '/v1/auth/me', headers={'Authorization': f'Bearer {issued[0].access_token}'}
        ).status_code
        == 401
    )


def test_database_rejects_two_unconsumed_refresh_tokens(
    api_client: TestClient, database_factory: DatabaseFactory
) -> None:
    create_user(database_factory)
    first = login(api_client)

    async def run() -> None:
        with pytest.raises(IntegrityError):
            async with database_factory() as database, database.begin():
                database.add(
                    RefreshToken(
                        token_hash=auth.hash_token('another token'),
                        session_id=UUID(first['session_id']),
                    )
                )

    asyncio.run(run())


def test_admin_cli_reads_password_from_stdin_and_is_idempotent(
    database_url: str, api_client: TestClient
) -> None:
    environment = {**os.environ, 'GOUXUAN_DATABASE_URL': database_url}
    command = [
        sys.executable,
        '-m',
        'app.admin_cli',
        'init-admin',
        '--email',
        EMAIL,
        '--password-stdin',
    ]
    first = subprocess.run(
        command,
        input=PASSWORD + '\n',
        text=True,
        capture_output=True,
        env=environment,
        check=True,
    )
    second = subprocess.run(
        command,
        input='Different-Password-2026\n',
        text=True,
        capture_output=True,
        env=environment,
        check=True,
    )
    assert '账号已创建' in first.stdout and '管理员已存在' in second.stdout
    assert PASSWORD not in first.stdout + first.stderr
    assert login(api_client)['account']['role'] == 'admin'
