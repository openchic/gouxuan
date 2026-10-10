import asyncio
import os
from collections.abc import AsyncIterator, Iterator
from pathlib import Path
from typing import Annotated
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import make_url, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app import auth, main
from app.database import check_database, get_database
from app.settings import settings


@pytest.fixture
def database_url(monkeypatch: pytest.MonkeyPatch) -> Iterator[str]:
    base_url = os.getenv('GOUXUAN_TEST_DATABASE_URL')
    if not base_url:
        pytest.skip(
            'Set GOUXUAN_TEST_DATABASE_URL to run isolated Postgres integration tests'
        )
    schema = f'gouxuan_test_{uuid4().hex}'
    root_engine = create_async_engine(
        base_url, poolclass=NullPool, hide_parameters=True
    )

    async def create_schema() -> None:
        async with root_engine.begin() as connection:
            await connection.execute(text(f'CREATE SCHEMA {schema}'))

    async def drop_schema() -> None:
        async with root_engine.begin() as connection:
            await connection.execute(text(f'DROP SCHEMA {schema} CASCADE'))
        await root_engine.dispose()

    asyncio.run(create_schema())
    url = (
        make_url(base_url)
        .update_query_dict({'options': f'-csearch_path={schema}'})
        .render_as_string(hide_password=False)
    )
    monkeypatch.setattr(settings, 'database_url', url)
    try:
        command.upgrade(
            Config(str(Path(__file__).resolve().parents[1] / 'alembic.ini')), 'head'
        )
        yield url
    finally:
        asyncio.run(drop_schema())


@pytest.fixture
def database_factory(database_url: str) -> Iterator[async_sessionmaker[AsyncSession]]:
    engine = create_async_engine(database_url, poolclass=NullPool, hide_parameters=True)
    yield async_sessionmaker(engine, expire_on_commit=False)
    asyncio.run(engine.dispose())


@pytest.fixture
def api_client(
    database_factory: async_sessionmaker[AsyncSession], monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    application = main.create_app()

    async def test_database() -> AsyncIterator[AsyncSession]:
        async with database_factory() as database:
            yield database

    async def ready() -> None:
        engine = database_factory.kw['bind']
        await check_database(engine)

    application.dependency_overrides[get_database] = test_database
    monkeypatch.setattr(main, 'check_database', ready)

    # Exercise authorization without publishing a placeholder management endpoint.
    @application.get('/__tests/admin')
    async def admin(
        identity: Annotated[auth.Identity, Depends(auth.require_admin)],
    ) -> dict[str, str]:
        return {'role': identity.account.role}

    with TestClient(application) as client:
        yield client
