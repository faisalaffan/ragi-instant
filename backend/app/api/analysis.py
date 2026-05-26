from typing import Annotated
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import HTTPException
from pydantic import BaseModel
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.ingestion.change_detector import ChangeReport
from app.ingestion.change_detector import detect_changes

router = APIRouter(prefix="/analysis", tags=["analysis"])


class CompareRequest(BaseModel):
    old_document_id: str = Field(description="UUID dokumen versi lama")
    new_document_id: str = Field(description="UUID dokumen versi baru")


class CompareResponse(BaseModel):
    old_document_title: str
    new_document_title: str
    summary: str
    changes: list[dict]
    unchanged_core: str | None = None


@router.post("/compare", response_model=CompareResponse)
async def compare_documents(
    body: CompareRequest,
    db: AsyncSession = Depends(get_db),
) -> CompareResponse:
    try:
        old_id = UUID(body.old_document_id)
        new_id = UUID(body.new_document_id)
    except ValueError:
        raise HTTPException(400, "Invalid UUID format")

    try:
        report = await detect_changes(db, old_id, new_id)
    except ValueError as e:
        raise HTTPException(404, str(e))

    return CompareResponse(
        old_document_title=report.old_document_title,
        new_document_title=report.new_document_title,
        summary=report.summary,
        changes=[c.model_dump() for c in report.changes],
        unchanged_core=report.unchanged_core,
    )
