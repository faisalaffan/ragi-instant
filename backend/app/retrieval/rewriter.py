import asyncio
import logging

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

REWRITE_PROMPT = """Kamu adalah query rewriter untuk sistem pencarian regulasi keuangan Indonesia (OJK, BI, POJK, PBI, SEOJK).

Ubah query user menjadi query pencarian yang lebih spesifik dan mudah dicari. Aturan:
- Expand singkatan (POJK → Peraturan Otoritas Jasa Keuangan, BI → Bank Indonesia)
- Tambahkan sinonim dan istilah terkait
- Tambahkan konteks tahun jika tidak ada (2023, 2024, 2025)
- Pertahankan maksud asli user
- Output HANYA query yang sudah di-rewrite, tanpa penjelasan

Query: {query}
Rewritten query:"""


async def rewrite_query(query: str) -> str:
    if not query.strip():
        return query

    try:
        client = OpenAI(api_key=settings.openai_api_key)
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": REWRITE_PROMPT.format(query=query)}],
                temperature=0.1,
                max_tokens=200,
            )
        )
        rewritten = response.choices[0].message.content.strip()
        logger.info("Rewritten: %s → %s", query, rewritten)
        return rewritten
    except Exception:
        logger.exception("Query rewriting failed, returning original")
        return query
