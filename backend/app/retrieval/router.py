import asyncio
import json
import logging

from pydantic import BaseModel
from pydantic import Field

from app.config import settings
from app.llm_client import get_openai_client

logger = logging.getLogger(__name__)

ROUTER_PROMPT = """Kamu adalah query router untuk sistem pencarian regulasi keuangan Indonesia.

Klasifikasikan query user ke salah satu intent berikut:
- regulation_lookup: mencari isi/pasal/ketentuan spesifik dalam regulasi
- definition: menanyakan definisi/arti istilah keuangan/regulasi
- comparison: membandingkan dua regulasi, dua versi, atau dua ketentuan
- obligation_check: mengecek kewajiban/sanksi/batasan yang berlaku
- general: pertanyaan umum yang tidak masuk kategori di atas

Return JSON dengan format:
{
  "intent": "...",
  "keywords": ["kata", "kunci", "dari", "query"],
  "search_strategy": "dense_only" | "sparse_only" | "hybrid",
  "reasoning": "alasan singkat"
}

Aturan search_strategy:
- regulation_lookup → hybrid (butuh exact match pasal + semantic similarity)
- definition → dense_only (definisi bisa diparafrase, perlu semantic)
- comparison → hybrid (butuh dua sisi perbandingan)
- obligation_check → sparse_only (butuh exact match angka/sanksi)
- general → hybrid

Query: {query}
JSON response:"""


class RouterResult(BaseModel):
    intent: str = Field(description="regulation_lookup | definition | comparison | obligation_check | general")
    keywords: list[str]
    search_strategy: str = Field(description="dense_only | sparse_only | hybrid")
    reasoning: str


async def route_query(query: str) -> RouterResult:
    if not query.strip():
        return RouterResult(
            intent="general",
            keywords=[],
            search_strategy="hybrid",
            reasoning="Empty query, defaulting to general/hybrid",
        )

    try:
        client = get_openai_client()

        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": ROUTER_PROMPT.format(query=query)}],
                temperature=0.0,
                max_tokens=300,
                response_format={"type": "json_object"},
            )
        )

        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)
        result = RouterResult(**data)

        logger.info(
            "Routed: %s → intent=%s, strategy=%s",
            query[:80], result.intent, result.search_strategy,
        )
        return result

    except Exception:
        logger.exception("Routing failed, defaulting to general/hybrid")
        return RouterResult(
            intent="general",
            keywords=[],
            search_strategy="hybrid",
            reasoning="Routing fallback",
        )
