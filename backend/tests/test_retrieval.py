import pytest
from unittest.mock import AsyncMock
from unittest.mock import MagicMock
from unittest.mock import patch

from app.retrieval.generator import _compute_confidence
from app.retrieval.generator import AnswerResponse
from app.retrieval.generator import Citation
from app.retrieval.hallucination_checker import HallucinationResult
from app.retrieval.hallucination_checker import check_hallucination
from app.retrieval.router import RouterResult
from app.retrieval.router import route_query
from app.retrieval.searcher import SearchResult
from app.retrieval.searcher import _reciprocal_rank_fusion


class TestReciprocalRankFusion:
    def test_merges_dense_and_sparse_results(self):
        dense = [
            SearchResult("a", "content a", 0.9, "Doc1", None, 1, {}),
            SearchResult("b", "content b", 0.7, "Doc1", None, 2, {}),
        ]
        sparse = [
            SearchResult("b", "content b", 0.8, "Doc1", None, 2, {}),
            SearchResult("c", "content c", 0.6, "Doc2", None, 1, {}),
        ]

        merged = _reciprocal_rank_fusion(dense, sparse)

        assert len(merged) == 3
        # Chunk b appears in both → higher RRF score
        assert merged[0].chunk_id == "a" or merged[0].chunk_id == "b"

    def test_empty_inputs(self):
        merged = _reciprocal_rank_fusion([], [])
        assert merged == []

    def test_single_list(self):
        dense = [SearchResult("a", "content", 0.9, "Doc", None, 1, {})]
        merged = _reciprocal_rank_fusion(dense, [])
        assert len(merged) == 1
        assert merged[0].chunk_id == "a"


class TestComputeConfidence:
    def test_full_citation_coverage(self):
        results = [
            SearchResult("c1", "text", 0.9, "Doc", None, 1, {}),
            SearchResult("c2", "text", 0.8, "Doc", None, 1, {}),
        ]
        citations = [
            Citation(chunk_id="c1", document_title="Doc", quote="..."),
            Citation(chunk_id="c2", document_title="Doc", quote="..."),
        ]
        confidence = _compute_confidence(results, citations)
        # avg(0.9, 0.8) × (2/2) = 0.85
        assert confidence == 0.85

    def test_partial_coverage(self):
        results = [
            SearchResult("c1", "text", 0.9, "Doc", None, 1, {}),
            SearchResult("c2", "text", 0.8, "Doc", None, 1, {}),
            SearchResult("c3", "text", 0.7, "Doc", None, 1, {}),
        ]
        citations = [
            Citation(chunk_id="c1", document_title="Doc", quote="..."),
        ]
        confidence = _compute_confidence(results, citations)
        # avg(0.9, 0.8, 0.7) = 0.8 × (1/3) = 0.27
        assert confidence == 0.27

    def test_empty_results(self):
        confidence = _compute_confidence([], [])
        assert confidence == 0.0


class TestRouter:
    @pytest.mark.asyncio
    async def test_routes_regulation_lookup(self):
        with patch("app.retrieval.router.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = (
                '{"intent":"regulation_lookup","keywords":["batas","bunga","pinjol"],'
                '"search_strategy":"hybrid","reasoning":"Mencari ketentuan spesifik"}'
            )
            mock_client.chat.completions.create.return_value = mock_response

            result = await route_query("Apa batas maksimum bunga pinjol?")

            assert result.intent == "regulation_lookup"
            assert result.search_strategy == "hybrid"
            assert len(result.keywords) == 3

    @pytest.mark.asyncio
    async def test_routes_definition_query(self):
        with patch("app.retrieval.router.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = (
                '{"intent":"definition","keywords":["definisi","peer-to-peer"],'
                '"search_strategy":"dense_only","reasoning":"Mencari definisi istilah"}'
            )
            mock_client.chat.completions.create.return_value = mock_response

            result = await route_query("Apa itu peer-to-peer lending?")

            assert result.intent == "definition"
            assert result.search_strategy == "dense_only"

    @pytest.mark.asyncio
    async def test_fallback_on_error(self):
        with patch("app.retrieval.router.OpenAI") as mock_openai:
            mock_openai.side_effect = Exception("API error")

            result = await route_query("test query")

            assert result.intent == "general"
            assert result.search_strategy == "hybrid"

    @pytest.mark.asyncio
    async def test_empty_query_defaults(self):
        result = await route_query("")
        assert result.intent == "general"
        assert result.search_strategy == "hybrid"


class TestHallucinationChecker:
    @pytest.mark.asyncio
    async def test_detects_supported_answer(self):
        with patch("app.retrieval.hallucination_checker.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = (
                '{"is_hallucinated":false,"hallucination_score":0.0,'
                '"supported_claims":["Batas maksimum 0.4% sesuai Pasal 3"],'
                '"unsupported_claims":[],'
                '"verification_notes":"Semua klaim didukung konteks"}'
            )
            mock_client.chat.completions.create.return_value = mock_response

            result = await check_hallucination(
                "Batas maksimum 0.4% per hari.",
                ["Pasal 3: Batas maksimum manfaat ekonomi sebesar 0,4% per hari."],
            )

            assert result.is_hallucinated is False
            assert result.hallucination_score == 0.0

    @pytest.mark.asyncio
    async def test_detects_unsupported_claim(self):
        with patch("app.retrieval.hallucination_checker.OpenAI") as mock_openai:
            mock_client = MagicMock()
            mock_openai.return_value = mock_client

            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = (
                '{"is_hallucinated":true,"hallucination_score":0.5,'
                '"supported_claims":["Klaim A didukung"],'
                '"unsupported_claims":["Klaim B tidak ada di konteks"],'
                '"verification_notes":"1 dari 2 klaim tidak didukung"}'
            )
            mock_client.chat.completions.create.return_value = mock_response

            result = await check_hallucination(
                "Klaim A. Klaim B.",
                ["Konteks hanya mendukung Klaim A."],
            )

            assert result.is_hallucinated is True
            assert result.hallucination_score == 0.5

    @pytest.mark.asyncio
    async def test_empty_answer(self):
        result = await check_hallucination("", ["Konteks apa saja."])
        assert result.is_hallucinated is False
        assert result.hallucination_score == 0.0

    @pytest.mark.asyncio
    async def test_no_context_marks_hallucinated(self):
        result = await check_hallucination("Beberapa klaim.", [])
        assert result.is_hallucinated is True
        assert result.hallucination_score == 1.0
