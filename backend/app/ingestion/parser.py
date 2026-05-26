import logging
from pathlib import Path

from docling.datamodel.base_models import InputFormat
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
        "format": result.document.origin.format if result.document.origin else None,
    }

    logger.info(
        "Parsed %s: %d chars, %d pages",
        original_name, len(markdown), metadata["pages"]
    )

    return ParseResult(markdown=markdown, metadata=metadata)
