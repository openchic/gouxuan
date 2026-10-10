from collections.abc import AsyncIterator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine as sqlalchemy_create_async_engine

from app.settings import settings

SCHEMA_REVISION = '0001_account_access'


def create_engine(url: str) -> AsyncEngine:
    """Create the shared Postgres engine without logging SQL parameters or secrets."""
    return sqlalchemy_create_async_engine(
        url,
        pool_pre_ping=True,
        hide_parameters=True,
        connect_args={'connect_timeout': 5},
    )


engine = create_engine(settings.database_url)
session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_database() -> AsyncIterator[AsyncSession]:
    """Provide a request-local session; business operations own their transactions."""
    async with session_factory() as database:
        yield database


async def check_database(database_engine: AsyncEngine = engine) -> None:
    """Require the deployed schema before accepting business traffic."""
    async with database_engine.connect() as connection:
        revision = await connection.scalar(
            text('SELECT version_num FROM alembic_version')
        )
        if revision != SCHEMA_REVISION:
            raise RuntimeError('数据库迁移版本不匹配，请先执行 alembic upgrade head')
