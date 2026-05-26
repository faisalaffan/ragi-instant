from datetime import datetime
from uuid import UUID
from uuid import uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import Computed
from sqlalchemy import DateTime
from sqlalchemy import Enum
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from app.db import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(1024))
    source_type: Mapped[str] = mapped_column(
        Enum("pdf", "docx", "url", "text", name="source_type_enum")
    )
    source_path: Mapped[str] = mapped_column(String(2048))
    status: Mapped[str] = mapped_column(
        Enum("pending", "parsing", "chunking", "indexing", "ready", "error",
             name="doc_status_enum"),
        default="pending",
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    chunks: Mapped[list["Chunk"]] = relationship(
        "Chunk", back_populates="document", cascade="all, delete-orphan"
    )


class Chunk(Base):
    __tablename__ = "chunks"
    __table_args__ = (
        Index("ix_chunks_document_id", "document_id"),
        Index(
            "ix_chunks_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 200},
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
        Index(
            "ix_chunks_fts_gin",
            "search_vector",
            postgresql_using="gin",
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE")
    )
    sequence: Mapped[int] = mapped_column()
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(1536))
    section: Mapped[str | None] = mapped_column(String(512), nullable=True)
    page: Mapped[int | None] = mapped_column(nullable=True)
    search_vector: Mapped[str] = mapped_column(
        TSVECTOR,
        Computed("to_tsvector('indonesian', content)", persisted=True),
        nullable=True,
    )
    meta: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    document: Mapped["Document"] = relationship("Document", back_populates="chunks")
