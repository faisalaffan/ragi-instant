import asyncio
import logging

import cohere

from app.config import settings
from app.retrieval.searcher import SearchResult

logger = logging.getLogger(__name__)

TOP_K = 5


async def rerank(query: str, results: list[SearchResult]) -> list[SearchResult]:
    if not results:
        return results

    try:
        client = cohere.Client(api_key=settings.cohere_api_key)

        documents = [r.content for r in results]
        response = await asyncio.to_thread(
            lambda: client.rerank(
                model="rerank-v3.5",
                query=query,
                documents=documents,
                top_n=min(TOP_K, len(documents)),
            )
        )

        reranked: list[SearchResult] = []
        for item in response.results:
            result = results[item.index]
            result.score = round(item.relevance_score, 4)
            reranked.append(result)

        logger.info("Reranked %d → %d results", len(results), len(reranked))
        return reranked

    except Exception:
        logger.exception("Reranking failed, returning original results")
        return results[:TOP_K]
