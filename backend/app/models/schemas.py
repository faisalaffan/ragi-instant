from datetime import datetime
from uuid import UUID

from pydantic import BaseModel
from pydantic import Field


class DocumentUpload(BaseModel):
    title: str | None = None


class DocumentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    title: str
    source_type: str
    source_path: str
    status: str
    error_message: str | None = None
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class ChunkResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    document_id: UUID
    sequence: int
    content: str
    section: str | None = None
    page: int | None = None
    meta: dict = Field(default_factory=dict)


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
