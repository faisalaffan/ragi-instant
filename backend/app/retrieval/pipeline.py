import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.retrieval.compressor import compress_context
from app.retrieval.generator import AnswerResponse
from app.retrieval.generator import generate
from app.retrieval.reranker import rerank
from app.retrieval.rewriter import rewrite_query
from app.retrieval.searcher import hybrid_search
from app.retrieval.searcher import SearchResult

logger = logging.getLogger(__name__)


def _langfuse_enabled() -> bool:
    return bool(settings.langfuse_public_key and settings.langfuse_secret_key)


def _get_langfuse():
    import langfuse
    return langfuse.Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        host=settings.langfuse_host or None,
    )


class QueryPipeline:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def query(
        self, user_query: str, compress: bool = False
    ) -> AnswerResponse:
        lf = _get_langfuse() if _langfuse_enabled() else None
        trace = lf.trace(name="ragi-instant-query") if lf else None

        start = time.perf_counter()

        rewritten = await _traced_step(
            trace, "query-rewriting", rewrite_query, user_query,
        )

        search_results = await _traced_step(
            trace, "hybrid-search", hybrid_search, self.db, rewritten,
        )

        reranked = await _traced_step(
            trace, "reranking", rerank, user_query, search_results,
        )

        if compress and len(reranked) > 2:
            compressed = await _traced_step(
                trace, "context-compression", compress_context,
                user_query, reranked,
            )
        else:
            compressed = reranked

        response = await _traced_step(
            trace, "generation", generate, user_query, compressed,
        )

        elapsed_ms = (time.perf_counter() - start) * 1000

        if trace:
            trace.update(
                output=response.model_dump(mode="json"),
                metadata={
                    "rewritten_query": rewritten,
                    "retrieved_count": len(search_results),
                    "final_count": len(reranked),
                    "compressed": compress,
                    "confidence": response.confidence,
                    "latency_ms": round(elapsed_ms, 1),
                },
            )
            lf.flush()

        logger.info(
            "Query complete in %.0fms: %d → %d → conf=%.2f",
            elapsed_ms, len(search_results), len(reranked), response.confidence,
        )
        return response


async def _traced_step(trace, name: str, fn, *args):
    span = trace.span(name=name) if trace else None
    try:
        result = await fn(*args)
        if span:
            span.end()
        return result
    except Exception:
        if span:
            span.end()
        raise
