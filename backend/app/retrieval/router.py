import asyncio
import json
import logging

from pydantic import BaseModel
from pydantic import Field

from app.config import settings
from app.llm_client import get_openai_client

logger = logging.getLogger(__name__)

ROUTER_PROMPT = """You are a query router for an Indonesian financial regulation search system.

Classify user queries into one of these intents:
- regulation_lookup: searching for specific articles/provisions/clauses in regulations
- definition: asking for the definition/meaning of financial/regulatory terms
- comparison: comparing two regulations, two versions, or two provisions
- obligation_check: checking applicable obligations/sanctions/limits
- general: general questions not fitting the above categories

Return JSON with format:
{{
  "intent": "...",
  "keywords": ["key", "terms", "from", "query"],
  "search_strategy": "dense_only" | "sparse_only" | "hybrid",
  "reasoning": "brief reason"
}}

Search strategy rules:
- regulation_lookup → hybrid (needs exact article match + semantic similarity)
- definition → dense_only (definitions may be paraphrased, needs semantic)
- comparison → hybrid (needs both sides of comparison)
- obligation_check → sparse_only (needs exact number/sanction match)
- general → hybrid

Query: {query}
JSON response:"""


class RouterResult(BaseModel):
    intent: str = Field(description="regulation_lookup | definition | comparison | obligation_check | general")
    keywords: list[str] = Field(default_factory=list)
    search_strategy: str = Field(description="dense_only | sparse_only | hybrid")
    reasoning: str = ""


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
                model=settings.generation_model,
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
