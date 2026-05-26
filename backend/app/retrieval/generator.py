import asyncio
import logging

import instructor
from pydantic import BaseModel
from pydantic import Field

from app.config import settings
from app.llm_client import get_openai_client
from app.retrieval.searcher import SearchResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an Indonesian financial regulatory compliance assistant.
Strict rules:
1. ONLY answer based on the provided context/quotes
2. If information is NOT in the context, say "Information not found in the available regulatory documents."
3. DO NOT fabricate, infer beyond context, or use general knowledge
4. Every claim MUST include a citation from the context
5. Answer in clear, structured Indonesian
6. Mention article numbers and regulation names if present in the context"""


class Citation(BaseModel):
    chunk_id: str
    document_title: str
    page: int | None = None
    section: str | None = None
    quote: str = Field(description="Kutipan persis dari konteks yang mendukung jawaban")


class AnswerResponse(BaseModel):
    answer: str
    citations: list[Citation]
    confidence: float = Field(description="reranker_score × citation_coverage (0-1)")
    related_regulations: list[str] = Field(default_factory=list)


async def generate(
    query: str, results: list[SearchResult]
) -> AnswerResponse:
    if not results:
        return AnswerResponse(
            answer="Information not found in the available regulatory documents.",
            citations=[],
            confidence=0.0,
            related_regulations=[],
        )

    context_parts: list[str] = []
    for i, r in enumerate(results):
        source = f"[{i+1}] {r.document_title}"
        if r.section:
            source += f" — {r.section}"
        if r.page is not None:
            source += f" (hal. {r.page})"
        context_parts.append(f"{source}\n{r.content}")

    context = "\n\n---\n\n".join(context_parts)

    user_prompt = f"""Regulatory context:

{context}

---

Question: {query}

Answer based on the context above. Include references to context numbers [1], [2], etc."""

    try:
        provider = settings.llm_provider

        if provider == "anthropic":
            response = await _generate_anthropic(user_prompt)
        else:
            response = await _generate_openai(user_prompt)

        response.confidence = _compute_confidence(results, response.citations)
        logger.info(
            "Generated answer (%s/%s): %d citations, confidence=%.2f",
            provider, settings.generation_model,
            len(response.citations), response.confidence,
        )
        return response

    except Exception:
        logger.exception("Generation failed")
        return AnswerResponse(
            answer="Failed to generate answer. Please try again.",
            citations=[],
            confidence=0.0,
            related_regulations=[],
        )


async def _generate_openai(user_prompt: str) -> AnswerResponse:
    client = instructor.from_openai(get_openai_client())
    return await asyncio.to_thread(
        lambda: client.chat.completions.create(
            model=settings.generation_model,
            response_model=AnswerResponse,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=1500,
        )
    )


async def _generate_anthropic(user_prompt: str) -> AnswerResponse:
    from anthropic import Anthropic

    client = instructor.from_anthropic(
        Anthropic(api_key=settings.anthropic_api_key)
    )
    return await asyncio.to_thread(
        lambda: client.messages.create(
            model="claude-3-5-haiku-latest",
            max_tokens=1500,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            response_model=AnswerResponse,
        )
    )


def _compute_confidence(
    results: list[SearchResult], citations: list[Citation]
) -> float:
    if not results:
        return 0.0

    avg_score = sum(r.score for r in results) / len(results)

    cited_ids = {c.chunk_id for c in citations}
    cited_count = sum(1 for r in results if r.chunk_id in cited_ids)
    coverage = cited_count / len(results) if results else 0.0

    return round(avg_score * coverage, 2)
