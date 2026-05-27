import asyncio
import logging
import tempfile
from pathlib import Path
from uuid import UUID

from sqlalchemy import func
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import async_session as _async_session_factory
from app.ingestion.chunker import chunk_markdown
from app.ingestion.indexer import delete_document_chunks
from app.ingestion.indexer import embed_and_index
from app.ingestion.parser import parse_document
from app.models.document import Chunk
from app.models.document import Document

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


class IngestionPipeline:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def ingest(
        self, content: bytes, filename: str, title: str | None = None
    ) -> Document:
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
            )

        doc_title = title or Path(filename).stem
        doc = Document(
            title=doc_title,
            source_type="pdf" if ext == ".pdf" else "docx" if ext == ".docx" else "text",
            source_path=filename,
            status="pending",
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)

        asyncio.create_task(self._run(doc, content, filename))
        return doc

    async def _run(self, doc: Document, content: bytes, filename: str) -> None:
        doc_id = doc.id
        async with _async_session_factory() as session:
            try:
                doc = await session.merge(doc)
                doc.status = "parsing"
                await session.commit()

                with tempfile.NamedTemporaryFile(
                    suffix=Path(filename).suffix, delete=False
                ) as tmp:
                    tmp.write(content)
                    tmp_path = Path(tmp.name)

                try:
                    parsed = parse_document(tmp_path, filename)
                finally:
                    tmp_path.unlink()

                doc.status = "chunking"
                doc.meta = parsed.metadata
                await session.commit()

                chunks = chunk_markdown(parsed.markdown, parsed.metadata)

                doc.status = "indexing"
                await session.commit()

                await embed_and_index(session, doc, chunks)

            except Exception as exc:
                logger.exception("Ingestion failed for %s", doc_id)
                await session.rollback()
                doc = await session.merge(Document(id=doc_id))
                doc.status = "error"
                doc.error_message = str(exc)
                await session.commit()

    async def get_document(self, doc_id: UUID) -> Document | None:
        result = await self.db.execute(
            select(Document).where(Document.id == doc_id).options(selectinload(Document.chunks))
        )
        return result.scalar_one_or_none()

    async def list_documents(self, limit: int = 20, offset: int = 0) -> tuple[list[Document], int]:
        result = await self.db.execute(
            select(Document).order_by(Document.created_at.desc()).limit(limit).offset(offset).options(selectinload(Document.chunks))
        )
        docs = result.scalars().all()

        count_result = await self.db.execute(
            select(func.count()).select_from(Document)
        )
        total: int = count_result.scalar_one()

        return list(docs), total

    async def delete_document(self, doc_id: UUID) -> bool:
        doc = await self.get_document(doc_id)
        if doc is None:
            return False
        await self.db.delete(doc)
        await self.db.commit()
        logger.info("Deleted document %s", doc_id)
        return True

    async def get_chunks(self, doc_id: UUID) -> list[Chunk]:
        result = await self.db.execute(
            select(Chunk)
            .where(Chunk.document_id == doc_id)
            .order_by(Chunk.sequence)
        )
        return list(result.scalars().all())
