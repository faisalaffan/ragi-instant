import asyncio
import logging

import instructor
from openai import OpenAI
from pydantic import BaseModel
from pydantic import Field

from app.config import settings
from app.retrieval.searcher import SearchResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Kamu adalah asisten kepatuhan regulasi keuangan Indonesia.
Aturan mutlak:
1. HANYA jawab berdasarkan konteks/kutipan yang diberikan
2. Jika informasi TIDAK ADA dalam konteks, katakan "Informasi tidak ditemukan dalam dokumen regulasi yang tersedia."
3. JANGAN mengarang, menyimpulkan di luar konteks, atau menggunakan pengetahuan umum
4. Setiap klaim HARUS disertai kutipan dari konteks
5. Jawab dalam Bahasa Indonesia yang jelas dan terstruktur
6. Sebutkan nomor dan pasal regulasi jika ada dalam konteks"""


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
            answer="Informasi tidak ditemukan dalam dokumen regulasi yang tersedia.",
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

    user_prompt = f"""Konteks regulasi:

{context}

---

Pertanyaan: {query}

Jawab berdasarkan konteks di atas. Sertakan referensi ke nomor konteks [1], [2], dst."""

    try:
        model = settings.generation_model

        if model == "claude-haiku":
            response = await _generate_anthropic(user_prompt)
        else:
            response = await _generate_openai(user_prompt)

        response.confidence = _compute_confidence(results, response.citations)
        logger.info(
            "Generated answer (%s): %d citations, confidence=%.2f",
            model, len(response.citations), response.confidence,
        )
        return response

    except Exception:
        logger.exception("Generation failed")
        return AnswerResponse(
            answer="Gagal menghasilkan jawaban. Silakan coba lagi.",
            citations=[],
            confidence=0.0,
            related_regulations=[],
        )


async def _generate_openai(user_prompt: str) -> AnswerResponse:
    client = instructor.from_openai(OpenAI(api_key=settings.openai_api_key))
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
