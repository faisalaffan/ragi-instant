from typing import Annotated
from uuid import UUID

from fastapi import APIRouter
from fastapi import Depends
from fastapi import File
from fastapi import Form
from fastapi import HTTPException
from fastapi import Query
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.ingestion.pipeline import IngestionPipeline
from app.models.schemas import ChunkResponse
from app.models.schemas import DocumentListResponse
from app.models.schemas import DocumentResponse

router = APIRouter(prefix="/ingest", tags=["ingestion"])


@router.post("/documents", response_model=DocumentResponse, status_code=202)
async def upload_document(
    file: Annotated[UploadFile, File()],
    title: Annotated[str | None, Form()] = None,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    content = await file.read()
    if not content:
        raise HTTPException(400, "Empty file")

    pipeline = IngestionPipeline(db)
    try:
        doc = await pipeline.ingest(content, file.filename or "unknown", title)
    except ValueError as e:
        raise HTTPException(400, str(e))

    return _doc_to_response(doc)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    pipeline = IngestionPipeline(db)
    docs, total = await pipeline.list_documents(limit, offset)
    return DocumentListResponse(
        documents=[_doc_to_response(d) for d in docs],
        total=total,
    )


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    pipeline = IngestionPipeline(db)
    doc = await pipeline.get_document(UUID(doc_id))
    if doc is None:
        raise HTTPException(404, "Document not found")
    return _doc_to_response(doc)


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> None:
    pipeline = IngestionPipeline(db)
    deleted = await pipeline.delete_document(UUID(doc_id))
    if not deleted:
        raise HTTPException(404, "Document not found")


@router.get("/documents/{doc_id}/chunks", response_model=list[ChunkResponse])
async def get_chunks(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[ChunkResponse]:
    pipeline = IngestionPipeline(db)
    chunks = await pipeline.get_chunks(UUID(doc_id))
    return [_chunk_to_response(c) for c in chunks]


def _doc_to_response(doc) -> DocumentResponse:
    try:
        chunk_count = len(doc.chunks)
    except Exception:
        chunk_count = 0

    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        source_type=doc.source_type,
        source_path=doc.source_path,
        status=doc.status,
        error_message=doc.error_message,
        chunk_count=chunk_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _chunk_to_response(chunk) -> ChunkResponse:
    return ChunkResponse(
        id=chunk.id,
        document_id=chunk.document_id,
        sequence=chunk.sequence,
        content=chunk.content,
        section=chunk.section,
        page=chunk.page,
        meta=chunk.meta,
    )
