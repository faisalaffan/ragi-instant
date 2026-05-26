from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import async_sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _make_async_url(url: str) -> str:
    return url.replace("postgresql://", "postgresql+asyncpg://")


engine = create_async_engine(
    _make_async_url(settings.database_url),
    pool_size=5,
    max_overflow=10,
    echo=False,
)

async_session = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
