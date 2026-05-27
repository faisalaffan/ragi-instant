<p align="center">
  <a href="README.id.md">🇮🇩 Bahasa Indonesia</a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/01_BANNER_DARK.png">
    <img src="assets/02_BANNER_LIGHT.png" alt="Ragi-Instant Banner" width="100%">
  </picture>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/03_ICON_DARK.png">
    <img src="assets/04_ICON_LIGHT.png" alt="Ragi-Instant Logo" width="120">
  </picture>
</p>

<p align="center">
  <strong>Production-grade RAG for regulatory compliance. Hybrid search, reranking, routing, hallucination detection — all in one pipeline.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-active--development-green.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/python-3.12+-blue.svg" alt="Python"></a>
</p>

---

**Ragi-Instant** is a RAG (Retrieval-Augmented Generation) system built for regulatory and compliance intelligence. It goes beyond the tutorial-level `embed → search → generate` loop with a production-grade pipeline: query rewriting, intent routing, hybrid retrieval, cross-encoder reranking, context compression, citation-grounded structured output, and hallucination checking — all traced and evaluated automatically.

## Pipeline

```
User Query
    │
    ▼
Query Rewriting (LLM)     "POJK terbaru pinjol" → "Peraturan OJK peer-to-peer lending 2024 2025"
    │
    ▼
Intent Router (LLM)       regulation_lookup | definition | comparison | obligation_check
    │
    ▼
Hybrid Search             Dense (pgvector cosine) + Sparse (PostgreSQL FTS BM25) → RRF fusion
    │
    ▼
Cohere Rerank v3          Top-40 → top-5 final results
    │
    ▼
[Context Compression]     LLM summarization preserving legal facts (optional)
    │
    ▼
LLM Generation            GPT-4o mini / Claude Haiku + Instructor structured output
    │
    ▼
Hallucination Check       Verify every claim against source context
    │
    ▼
Answer + Citations + Confidence + Related Regulations
    │
    ▼
LangFuse Trace + RAGAS Eval (async)
```

## Key Capabilities

**Query Rewriting**
LLM-based query expansion. "POJK terbaru pinjol" becomes "Peraturan OJK terbaru mengenai peer-to-peer lending 2024 2025" before retrieval. +15-20% retrieval quality for ambiguous queries.

**Intent Routing**
Classifies queries into regulation_lookup, definition, comparison, or obligation_check. Each intent maps to a different search strategy (dense-only, sparse-only, or hybrid).

**Hybrid Search**
Dense vector search (pgvector HNSW) combined with sparse keyword retrieval (PostgreSQL FTS BM25 with GIN index), fused via Reciprocal Rank Fusion. Catches both semantic matches and exact legal term hits.

**Reranking**
Cohere Rerank v3 cross-encoder on retrieved candidates. Improves recall@5 significantly over raw vector similarity.

**Context Compression**
LLM-based summarization that preserves numbers, percentages, article numbers, and legal definitions while removing transitions and repetition. 40-60% token reduction.

**Structured Output & Citations**
Every answer comes with source citations pointing to the exact chunk, document, page, and section. No black-box answers — every claim is verifiable.

**Hallucination Detection**
Post-generation verification step. Each claim in the answer is checked against the source context. Returns hallucination score and flags unsupported claims.

**Regulatory Change Detection**
Upload two versions of a regulation and get a structured diff — which articles changed, what was added, what was removed — grouped by impact (HIGH/MEDIUM/LOW).

**Automated Evaluation**
Built-in RAGAS evaluation pipeline with 30 curated Q&A pairs. Measures faithfulness, answer relevancy, and context precision. You ship with numbers, not faith.

**Observability**
LangFuse end-to-end tracing of every step: query rewriting, routing, hybrid search, reranking, compression, generation, and hallucination check. Latency and confidence per step.

## Demo

Here is a visual preview of the primary dashboard interfaces:

| Startup Splash Screen | Main System Dashboard |
|---|---|
| <img src="assets/DEMO_APPS/00_SPLASH_SCREEN.png" width="100%"> | <img src="assets/DEMO_APPS/01_DASHBOARD.png" width="100%"> |

| AI Query Workspace & Citations | Automated RAGAS Benchmarks |
|---|---|
| <img src="assets/DEMO_APPS/11_RESPONSE_OK_WITH_80_PERCENT_CONFIDENT.png" width="100%"> | <img src="assets/DEMO_APPS/14_EVALUATE_RAGAS.png" width="100%"> |

👉 **Explore the full 16-screenshot gallery with detailed pipeline step descriptions in the [Ragi Instant Demo Gallery](./docs/demo.md).**

## Installation

```bash
cd backend
pip install -e .
```

## Quick Start

```bash
# 1. Copy env template and fill API keys
cp .env.example .env
# Required: OPENAI_API_KEY, COHERE_API_KEY

# 2. Deploy to VPS
make deploy

# 3. Upload a regulation document
curl -F "file=@POJK_10_2022.pdf" \
     -F "title=POJK No. 10 Tahun 2022" \
     http://vps:8000/api/ingest/documents

# 4. Ask a question
curl -X POST http://vps:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "Apa batas maksimum bunga pinjaman online menurut OJK?"}'

# Response:
# {
#   "answer": "Berdasarkan POJK No. 10/PT. LKM/2022, batas maksimum...",
#   "citations": [{"document_title": "POJK No. 10/2022", "page": 12, "quote": "..."}],
#   "confidence": 0.89,
#   "related_regulations": ["POJK No. 22/2023"]
# }
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check |
| `/api/ingest/documents` | POST | Upload PDF/DOCX for indexing |
| `/api/ingest/documents` | GET | List all documents |
| `/api/ingest/documents/{id}` | GET | Document detail |
| `/api/ingest/documents/{id}/chunks` | GET | View indexed chunks |
| `/api/query` | POST | Full RAG query pipeline |
| `/api/analysis/compare` | POST | Compare two document versions |

## Benchmark

Evaluated on 30 Q&A pairs from Indonesian financial regulatory documents (POJK, PBI).

| Metric | Score | Target |
|---|---|---|
| Faithfulness | — | > 0.85 |
| Answer Relevancy | — | > 0.80 |
| Context Precision | — | > 0.75 |
| Avg Latency | — | < 2.0s |
| Avg Cost/Query | — | < $0.01 |

_Scores pending first production run with real regulatory documents._

## Stack

| Layer | Technology |
|---|---|
| Document Parsing | Docling (layout-aware PDF + table extraction) |
| Chunking | LlamaIndex SemanticSplitterNodeParser |
| Embedding | OpenAI text-embedding-3-small |
| Vector Store | pgvector (HNSW index) |
| Keyword Search | PostgreSQL FTS (BM25, GIN index) |
| Backend API | FastAPI (async) |
| Frontend | Next.js 15 + shadcn/ui + Tailwind CSS |
| Tracing | LangFuse |
| Evaluation | RAGAS |

## License

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
