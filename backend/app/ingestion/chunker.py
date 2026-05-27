import logging
import re

from llama_index.core import Document
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding

from app.config import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1024
CHUNK_OVERLAP = 128


class ChunkResult:
    def __init__(self, text: str, metadata: dict) -> None:
        self.text = text
        self.metadata = metadata


_embed_model = None


def _is_real_openai() -> bool:
    """Only use OpenAI embeddings if pointing to actual OpenAI, not DeepSeek/etc."""
    key = settings.openai_api_key
    if not key or key in ("", "sk-...", "..."):
        return False
    base = settings.openai_base_url
    if base and "openai.com" not in base:
        return False  # DeepSeek / other compatible API — no embeddings
    return True


def get_embed_model():
    global _embed_model
    if _embed_model is not None:
        return _embed_model

    if _is_real_openai():
        logger.info("Using OpenAI embeddings (text-embedding-3-small)")
        _embed_model = OpenAIEmbedding(
            model="text-embedding-3-small",
            api_key=settings.openai_api_key,
        )
    else:
        logger.info("Using local HuggingFace embeddings (all-MiniLM-L6-v2)")
        _embed_model = HuggingFaceEmbedding(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
        )
    return _embed_model


def _build_splitter() -> SemanticSplitterNodeParser:
    embed_model = get_embed_model()
    return SemanticSplitterNodeParser(
        embed_model=embed_model,
        buffer_size=1,
        breakpoint_percentile_threshold=95,
    )


def chunk_markdown(markdown: str, doc_metadata: dict) -> list[ChunkResult]:
    sections = _split_by_headings(markdown)
    splitter = _build_splitter()

    chunks: list[ChunkResult] = []
    for section_title, section_text in sections:
        nodes = splitter.get_nodes_from_documents([Document(text=section_text)])
        for node in nodes:
            text = node.text.strip()
            if not text or len(text) < 50:
                continue
            chunks.append(ChunkResult(
                text=text,
                metadata={
                    **doc_metadata,
                    "section": section_title or None,
                },
            ))

    logger.info("Chunked into %d chunks from %d sections", len(chunks), len(sections))
    return chunks


def _split_by_headings(markdown: str) -> list[tuple[str, str]]:
    heading_re = re.compile(r"^#{1,4}\s+(.+)$", re.MULTILINE)

    matches = list(heading_re.finditer(markdown))
    if not matches:
        return [("", markdown.strip())]

    sections: list[tuple[str, str]] = []
    for i, match in enumerate(matches):
        title = match.group(1)
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        body = markdown[start:end]
        sections.append((title, body))

    last = matches[-1]
    sections.append((last.group(1), markdown[last.start():].strip()))

    return sections
