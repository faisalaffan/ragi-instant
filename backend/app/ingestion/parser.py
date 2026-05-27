import logging
import os
from pathlib import Path

os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

from docling.document_converter import DocumentConverter

logger = logging.getLogger(__name__)

_converter: DocumentConverter | None = None


def _get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    return _converter


class ParseResult:
    def __init__(self, markdown: str, metadata: dict) -> None:
        self.markdown = markdown
        self.metadata = metadata


def parse_document(file_path: Path, original_name: str) -> ParseResult:
    converter = _get_converter()
    result = converter.convert(file_path)

    if result.status.name != "SUCCESS":
        raise RuntimeError(f"Docling conversion failed: {result.status}")

    markdown = result.document.export_to_markdown()

    metadata = {
        "original_name": original_name,
        "pages": len(result.document.pages) if result.document.pages else 0,
        "mimetype": result.document.origin.mimetype if result.document.origin else None,
    }

    logger.info(
        "Parsed %s: %d chars, %d pages",
        original_name, len(markdown), metadata["pages"]
    )

    return ParseResult(markdown=markdown, metadata=metadata)
