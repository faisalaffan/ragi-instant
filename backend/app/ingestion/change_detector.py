import asyncio
import difflib
import logging
from uuid import UUID

import instructor
from pydantic import BaseModel
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.llm_client import get_openai_client
from app.models.document import Document

logger = logging.getLogger(__name__)

CHANGE_DETECTION_PROMPT = """You analyze changes between two versions of Indonesian financial regulatory documents.

Below is the diff between the OLD and NEW version of the document.
Identify significant changes that affect compliance.

ONLY report changes that ACTUALLY EXIST in the diff.
Do not fabricate or infer beyond the diff.
Group by impact: HIGH, MEDIUM, LOW.

Diff:
{diff}"""


class RegulationChange(BaseModel):
    category: str = Field(description="new_addition | modification | removal | renumbering")
    impact: str = Field(description="HIGH | MEDIUM | LOW")
    summary: str = Field(description="Brief description of the change")
    old_text: str | None = Field(default=None, description="Old version text if relevant")
    new_text: str | None = Field(default=None, description="New version text")
    affected_sections: list[str] = Field(default_factory=list)


class ChangeReport(BaseModel):
    old_document_title: str = ""
    new_document_title: str = ""
    summary: str = Field(description="Change summary in 1-3 sentences")
    changes: list[RegulationChange] = Field(default_factory=list)
    unchanged_core: str | None = Field(
        default=None,
        description="Core sections that remain unchanged (optional)"
    )


async def detect_changes(
    db: AsyncSession,
    old_doc_id: UUID,
    new_doc_id: UUID,
) -> ChangeReport:
    old_doc = await _get_document(db, old_doc_id)
    new_doc = await _get_document(db, new_doc_id)

    if not old_doc or not new_doc:
        raise ValueError("One or both documents not found")

    old_text = _build_full_text(db, old_doc)
    new_text = _build_full_text(db, new_doc)

    diff_text = _generate_diff(old_text, new_text,
                               old_doc.title, new_doc.title)

    if not diff_text.strip():
        return ChangeReport(
            old_document_title=old_doc.title,
            new_document_title=new_doc.title,
            summary="No changes detected between the two versions.",
            changes=[],
        )

    report = await _analyze_diff_with_llm(diff_text, old_doc, new_doc)
    logger.info(
        "Change detection: %s vs %s → %d changes",
        old_doc.title, new_doc.title, len(report.changes),
    )
    return report


def _build_full_text(db: AsyncSession, doc: Document) -> str:
    """Gabungkan semua chunk jadi full text untuk diff."""
    chunks = sorted(doc.chunks, key=lambda c: c.sequence)
    return "\n\n".join(c.content for c in chunks)


def _generate_diff(
    old_text: str, new_text: str, old_title: str, new_title: str
) -> str:
    old_lines = old_text.splitlines(keepends=True)
    new_lines = new_text.splitlines(keepends=True)

    differ = difflib.unified_diff(
        old_lines, new_lines,
        fromfile=f"VERSI LAMA: {old_title}",
        tofile=f"VERSI BARU: {new_title}",
        lineterm="",
    )

    diff_lines = list(differ)
    max_context = 300
    if len(diff_lines) > max_context:
        logger.warning(
            "Diff too large (%d lines), truncating to %d",
            len(diff_lines), max_context,
        )
        diff_lines = diff_lines[:max_context]
        diff_lines.append(f"\n... (truncated {len(diff_lines) - max_context} more lines)")

    return "\n".join(diff_lines)


async def _analyze_diff_with_llm(
    diff_text: str, old_doc: Document, new_doc: Document
) -> ChangeReport:
    try:
        client = instructor.from_openai(
            get_openai_client()
        )

        prompt = CHANGE_DETECTION_PROMPT.format(diff=diff_text)

        response = await asyncio.to_thread(
            lambda: client.chat.completions.create(
                model=settings.generation_model,
                response_model=ChangeReport,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=2000,
            )
        )

        response.old_document_title = old_doc.title
        response.new_document_title = new_doc.title
        return response

    except Exception:
        logger.exception("LLM change analysis failed")
        return ChangeReport(
            old_document_title=old_doc.title,
            new_document_title=new_doc.title,
            summary="Change analysis failed. Review the diff manually.",
            changes=[],
        )


async def _get_document(db: AsyncSession, doc_id: UUID) -> Document | None:
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .where(Document.id == doc_id)
        .options(selectinload(Document.chunks))
    )
    return result.scalar_one_or_none()
