import logging
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.retrieval.compressor import compress_context
from app.retrieval.generator import AnswerResponse
from app.retrieval.generator import generate
from app.retrieval.reranker import rerank
from app.retrieval.rewriter import rewrite_query
from app.retrieval.router import route_query
from app.retrieval.searcher import hybrid_search

logger = logging.getLogger(__name__)


def _langfuse_enabled() -> bool:
    return bool(settings.langfuse_public_key and settings.langfuse_secret_key)


def _format_step_input(name: str, *args) -> str:
    if name in ("query-rewriting", "query-routing"):
        return str(args[0])[:500] if args else ""
    if name == "hybrid-search":
        return str(args[1])[:500] if len(args) > 1 else ""  # skip db session
    if name == "reranking":
        return f"query={str(args[0])[:200]}, results={len(args[1])}" if len(args) > 1 else ""
    if name == "generation":
        return f"query={str(args[0])[:200]}, context_chunks={len(args[1])}" if len(args) > 1 else ""
    return str(args)[:500]


def _format_step_output(name: str, result) -> str:
    if name == "reranking":
        items = [{"chunk_id": r.chunk_id[:8], "score": r.score, "title": r.document_title[:50]} for r in result]
        return str(items)[:2000]
    if name == "hybrid-search":
        return f"{len(result)} results, top score: {result[0].score if result else 'N/A'}"
    if name == "generation":
        return str(result)[:2000]
    return str(result)[:500]


class QueryPipeline:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def query(
        self, user_query: str, compress: bool = False
    ) -> AnswerResponse:
        if not _langfuse_enabled():
            return await self._run_query(user_query, compress)

        import langfuse
        lf = langfuse.Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host or None,
        )

        with lf.start_as_current_observation(
            name="ragi-instant-query",
            as_type="span",
            input=user_query,
        ) as root_span:
            response = await self._run_query(
                user_query, compress, lf=lf,
            )
            root_span.update(
                output=response.model_dump(mode="json"),
                metadata={"confidence": response.confidence},
            )
            lf.flush()
            return response

    async def _run_query(
        self, user_query: str, compress: bool = False, lf=None,
    ) -> AnswerResponse:
        start = time.perf_counter()

        rewritten = await self._step(lf, "query-rewriting", rewrite_query, user_query)
        route_result = await self._step(lf, "query-routing", route_query, rewritten)
        search_results = await self._step(lf, "hybrid-search", hybrid_search, self.db, rewritten)
        reranked = await self._step(lf, "reranking", rerank, user_query, search_results)

        if compress and len(reranked) > 2:
            compressed = await self._step(
                lf, "context-compression", compress_context, user_query, reranked,
            )
        else:
            compressed = reranked

        response = await self._step(lf, "generation", generate, user_query, compressed)

        if lf:
            lf.flush()

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "Query complete in %.0fms: intent=%s %d→%d conf=%.2f",
            elapsed_ms, route_result.intent,
            len(search_results), len(reranked), response.confidence,
        )
        return response

    async def _step(self, lf, name: str, fn, *args):
        if lf is None:
            return await fn(*args)

        as_type = "generation" if name in ("generation",) else "span"
        span_input = _format_step_input(name, *args)
        with lf.start_as_current_observation(
            name=name, as_type=as_type, input=span_input,
        ) as span:
            try:
                result = await fn(*args)
                span.update(output=_format_step_output(name, result))
                return result
            except Exception as e:
                span.update(level="ERROR", status_message=str(e)[:1000])
                raise
