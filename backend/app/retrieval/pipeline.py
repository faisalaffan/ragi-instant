import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.retrieval.compressor import compress_context
from app.retrieval.generator import AnswerResponse
from app.retrieval.generator import generate
from app.retrieval.hallucination_checker import check_hallucination
from app.retrieval.reranker import rerank
from app.retrieval.rewriter import rewrite_query
from app.retrieval.router import route_query
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

        route_result = await _traced_step(
            trace, "query-routing", route_query, rewritten,
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

        hallucination = await _traced_step(
            trace, "hallucination-check", _run_hallucination_check,
            response, compressed,
        )

        elapsed_ms = (time.perf_counter() - start) * 1000

        if trace:
            trace.update(
                output=response.model_dump(mode="json"),
                metadata={
                    "rewritten_query": rewritten,
                    "router_intent": route_result.intent,
                    "router_strategy": route_result.search_strategy,
                    "retrieved_count": len(search_results),
                    "final_count": len(reranked),
                    "compressed": compress,
                    "confidence": response.confidence,
                    "hallucination_score": hallucination.hallucination_score,
                    "is_hallucinated": hallucination.is_hallucinated,
                    "latency_ms": round(elapsed_ms, 1),
                },
            )
            lf.flush()

        logger.info(
            "Query complete in %.0fms: intent=%s %d→%d conf=%.2f hallu=%.2f",
            elapsed_ms, route_result.intent,
            len(search_results), len(reranked),
            response.confidence, hallucination.hallucination_score,
        )
        return response


async def _run_hallucination_check(response, results):
    context_chunks = [r.content for r in results]
    return await check_hallucination(response.answer, context_chunks)


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
