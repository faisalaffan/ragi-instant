import asyncio
import json
import logging

from pydantic import BaseModel
from pydantic import Field

from app.config import settings
from app.llm_client import get_openai_client

logger = logging.getLogger(__name__)

CHECK_PROMPT = """You are a fact verifier for an Indonesian financial regulation system.

Task: verify whether each claim in the ANSWER is supported by the given CONTEXT.

Available context:
{context}

Answer to verify:
{answer}

Return JSON:
{{
  "is_hallucinated": true/false,
  "hallucination_score": 0.0-1.0,
  "supported_claims": ["claims supported by context"],
  "unsupported_claims": ["claims NOT supported by context"],
  "verification_notes": "verification notes"
}}

Guidelines:
- If a claim mentions numbers/percentages/dates, ensure the exact number exists in context
- If a claim mentions articles/clauses, ensure they are referenced in context
- If a claim is too vague to verify, treat it as unsupported
- hallucination_score = unsupported count / total claims
- is_hallucinated = true if any significant claim is unsupported

JSON response:"""


class HallucinationResult(BaseModel):
    is_hallucinated: bool
    hallucination_score: float = Field(ge=0.0, le=1.0)
    supported_claims: list[str] = Field(default_factory=list)
    unsupported_claims: list[str] = Field(default_factory=list)
    verification_notes: str = ""


async def check_hallucination(
    answer: str, context_chunks: list[str]
) -> HallucinationResult:
    if not answer.strip():
        return HallucinationResult(
            is_hallucinated=False,
            hallucination_score=0.0,
            supported_claims=[],
            unsupported_claims=[],
            verification_notes="Empty answer, nothing to verify."
        )

    if not context_chunks:
        return HallucinationResult(
            is_hallucinated=True,
            hallucination_score=1.0,
            supported_claims=[],
            unsupported_claims=["No context available — cannot verify any claims."],
            verification_notes="No context provided. All claims unverifiable.",
        )

    context = "\n\n---\n\n".join(
        f"[{i+1}] {chunk}" for i, chunk in enumerate(context_chunks)
    )

    try:
        client = get_openai_client()

        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model=settings.generation_model,
                messages=[{
                    "role": "user",
                    "content": CHECK_PROMPT.format(
                        context=context[:8000], answer=answer[:3000]
                    ),
                }],
                temperature=0.0,
                max_tokens=800,
                response_format={"type": "json_object"},
            )
        )

        raw = response.choices[0].message.content.strip()
        data = json.loads(raw)
        result = HallucinationResult(**data)

        logger.info(
            "Hallucination check: score=%.2f, hallucinated=%s, unsupported=%d claims",
            result.hallucination_score, result.is_hallucinated,
            len(result.unsupported_claims),
        )
        return result

    except Exception:
        logger.exception("Hallucination check failed")
        return HallucinationResult(
            is_hallucinated=False,
            hallucination_score=0.0,
            supported_claims=[],
            unsupported_claims=[],
            verification_notes="Verification skipped due to error.",
        )
