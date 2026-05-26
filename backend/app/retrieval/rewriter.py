import asyncio
import logging

from app.config import settings
from app.llm_client import get_openai_client

logger = logging.getLogger(__name__)

REWRITE_PROMPT = """You are a query rewriter for an Indonesian financial regulation search system (OJK, BI, POJK, PBI, SEOJK).

Rewrite user queries to be more specific and searchable. Rules:
- Expand abbreviations (POJK → Peraturan Otoritas Jasa Keuangan, BI → Bank Indonesia)
- Add synonyms and related terms
- Add year context if missing (2023, 2024, 2025)
- Preserve the user's original intent
- Output ONLY the rewritten query, no explanation

Query: {query}
Rewritten query:"""


async def rewrite_query(query: str) -> str:
    if not query.strip():
        return query

    try:
        client = get_openai_client()
        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model=settings.generation_model,
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
