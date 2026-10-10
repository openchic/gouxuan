import asyncio

from alembic import context
from sqlalchemy import Connection, pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.models import Base
from app.settings import settings

config = context.config


def run_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=Base.metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_with_connection(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_online() -> None:
    engine = async_engine_from_config(
        {'sqlalchemy.url': settings.database_url},
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
        hide_parameters=True,
    )
    async with engine.connect() as connection:
        await connection.run_sync(run_with_connection)
    await engine.dispose()


if context.is_offline_mode():
    run_offline()
else:
    asyncio.run(run_online())
