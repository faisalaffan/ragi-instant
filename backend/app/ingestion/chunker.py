import logging
import re

from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.openai import OpenAIEmbedding

from app.config import settings

logger = logging.getLogger(__name__)

CHUNK_SIZE = 1024
CHUNK_OVERLAP = 128


class ChunkResult:
    def __init__(self, text: str, metadata: dict) -> None:
        self.text = text
        self.metadata = metadata


def chunk_markdown(markdown: str, doc_metadata: dict) -> list[ChunkResult]:
    sections = _split_by_headings(markdown)

    embed_model = OpenAIEmbedding(
        model="text-embedding-3-small",
        api_key=settings.openai_api_key,
    )
    splitter = SemanticSplitterNodeParser(
        embed_model=embed_model,
        buffer_size=1,
        breakpoint_percentile_threshold=95,
    )

    chunks: list[ChunkResult] = []
    for section_title, section_text in sections:
        nodes = splitter.get_nodes_from_text(section_text)
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
