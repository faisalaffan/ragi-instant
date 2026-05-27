import logging
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ingestion.chunker import ChunkResult
from app.ingestion.chunker import get_embed_model
from app.models.document import Chunk
from app.models.document import Document

logger = logging.getLogger(__name__)


async def embed_and_index(
    db: AsyncSession,
    document: Document,
    chunks: list[ChunkResult],
) -> int:
    embed_model = get_embed_model()

    texts = [c.text for c in chunks]
    logger.info("Embedding %d chunks for document %s", len(texts), document.id)

    embeddings = embed_model.get_text_embedding_batch(texts)

    chunk_objs: list[Chunk] = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        chunk_objs.append(Chunk(
            document_id=document.id,
            sequence=i,
            content=chunk.text,
            embedding=embedding,
            section=chunk.metadata.get("section"),
            page=chunk.metadata.get("page"),
            meta={
                k: v for k, v in chunk.metadata.items()
                if k not in ("section", "page")
            },
        ))

    db.add_all(chunk_objs)
    await db.flush()

    document.status = "ready"
    await db.commit()

    logger.info(
        "Indexed %d chunks for document %s", len(chunk_objs), document.id
    )
    return len(chunk_objs)


async def delete_document_chunks(db: AsyncSession, document_id: UUID) -> None:
    await db.execute(
        text("DELETE FROM chunks WHERE document_id = :doc_id"),
        {"doc_id": document_id},
    )
    await db.commit()
