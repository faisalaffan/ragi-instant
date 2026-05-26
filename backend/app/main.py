from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analysis import router as analysis_router
from app.api.ingestion import router as ingestion_router
from app.api.query import router as query_router
from app.config import settings
from app.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await init_db()
    if settings.langfuse_public_key and settings.langfuse_secret_key:
        import langfuse
        langfuse.langfuse = langfuse.Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host or None,
        )
    yield


app = FastAPI(
    title="Ragi Instant",
    description="Regulatory & Compliance Intelligence RAG",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://vps:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
