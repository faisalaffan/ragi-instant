import asyncio
import logging

from openai import OpenAI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
DENSE_TOP_K = 20
SPARSE_TOP_K = 20
RRF_K = 60


class SearchResult:
    def __init__(self, chunk_id: str, content: str, score: float,
                 document_title: str, section: str | None, page: int | None,
                 meta: dict) -> None:
        self.chunk_id = chunk_id
        self.content = content
        self.score = score
        self.document_title = document_title
        self.section = section
        self.page = page
        self.meta = meta


async def hybrid_search(db: AsyncSession, query: str) -> list[SearchResult]:
    client = OpenAI(api_key=settings.openai_api_key)

    embedding_resp = await asyncio.to_thread(
        lambda: client.embeddings.create(model=EMBEDDING_MODEL, input=query)
    )
    query_embedding = embedding_resp.data[0].embedding

    dense_results, sparse_results = await asyncio.gather(
        _dense_search(db, query_embedding),
        _sparse_search(db, query),
    )

    return _reciprocal_rank_fusion(dense_results, sparse_results)


async def _dense_search(
    db: AsyncSession, embedding: list[float]
) -> list[SearchResult]:
    result = await db.execute(
        text("""
            SELECT c.id, c.content, 1 - (c.embedding <=> :embedding) AS score,
                   d.title, c.section, c.page, c.meta
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'ready'
            ORDER BY c.embedding <=> :embedding
            LIMIT :limit
        """),
        {"embedding": embedding, "limit": DENSE_TOP_K},
    )
    return [_row_to_result(row) for row in result.fetchall()]


async def _sparse_search(
    db: AsyncSession, query: str
) -> list[SearchResult]:
    result = await db.execute(
        text("""
            SELECT c.id, c.content,
                   ts_rank(
                       c.search_vector,
                       plainto_tsquery('indonesian', :query)
                   ) AS score,
                   d.title, c.section, c.page, c.meta
            FROM chunks c
            JOIN documents d ON c.document_id = d.id
            WHERE d.status = 'ready'
              AND c.search_vector @@ plainto_tsquery('indonesian', :query)
            ORDER BY score DESC
            LIMIT :limit
        """),
        {"query": query, "limit": SPARSE_TOP_K},
    )
    return [_row_to_result(row) for row in result.fetchall()]


def _reciprocal_rank_fusion(
    dense: list[SearchResult],
    sparse: list[SearchResult],
) -> list[SearchResult]:
    rrf_scores: dict[str, tuple[SearchResult, float]] = {}

    for rank, result in enumerate(dense, start=1):
        rrf_scores[result.chunk_id] = (result, 1.0 / (RRF_K + rank))

    for rank, result in enumerate(sparse, start=1):
        rrf_score = 1.0 / (RRF_K + rank)
        if result.chunk_id in rrf_scores:
            existing, existing_score = rrf_scores[result.chunk_id]
            rrf_scores[result.chunk_id] = (existing, existing_score + rrf_score)
        else:
            rrf_scores[result.chunk_id] = (result, rrf_score)

    merged = sorted(rrf_scores.values(), key=lambda x: x[1], reverse=True)
    combined: list[SearchResult] = []
    for result, rrf_score in merged:
        result.score = round(rrf_score, 4)
        combined.append(result)

    logger.info(
        "Hybrid search: %d dense + %d sparse → %d after RRF",
        len(dense), len(sparse), len(combined),
    )
    return combined


def _row_to_result(row) -> SearchResult:
    return SearchResult(
        chunk_id=str(row[0]),
        content=row[1],
        score=round(float(row[2]), 4) if row[2] is not None else 0.0,
        document_title=row[3] or "",
        section=row[4],
        page=row[5],
        meta=row[6] or {},
    )
