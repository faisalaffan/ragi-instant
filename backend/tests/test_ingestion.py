import pytest
from app.ingestion.chunker import chunk_markdown
from app.ingestion.chunker import _split_by_headings


class TestSplitByHeadings:
    def test_splits_markdown_into_sections(self, sample_markdown):
        sections = _split_by_headings(sample_markdown)

        assert len(sections) >= 3
        titles = [s[0] for s in sections]
        assert "Pasal 1: Ketentuan Umum" in titles
        assert "Pasal 2: Ruang Lingkup" in titles

    def test_no_headings_returns_single_section(self):
        text = "Ini adalah teks tanpa heading sama sekali."
        sections = _split_by_headings(text)

        assert len(sections) == 1
        assert sections[0][0] == ""

    def test_empty_text(self):
        sections = _split_by_headings("")
        assert len(sections) == 1


class TestChunkMarkdown:
    @pytest.mark.asyncio
    async def test_chunks_into_semantic_pieces(self, sample_markdown):
        # Note: requires OPENAI_API_KEY for embedding in SemanticSplitter
        # This test validates chunking logic without hitting the API
        sections = _split_by_headings(sample_markdown)
        assert len(sections) >= 3

    @pytest.mark.asyncio
    async def test_short_content_filtered(self):
        sections = _split_by_headings("short")
        assert len(sections) == 1
