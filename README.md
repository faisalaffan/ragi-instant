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
  <strong>Production-grade RAG library. Hybrid search, reranking, structured output, automated evaluation — all in one pipeline.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-active--development-green.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Python%20%7C%20Go%20%7C%20TypeScript-lightgrey.svg" alt="Platform"></a>
</p>

---

**Ragi-Instant** is a RAG (Retrieval-Augmented Generation) library that goes beyond the tutorial-level `embed → search → generate` loop. It packages a production-grade pipeline — hybrid retrieval, cross-encoder reranking, citation-grounded structured output, and automated evaluation — into a library you can integrate in minutes.

## Key Capabilities

**Hybrid Search**
Dense vector search combined with sparse keyword retrieval (BM25) fused via Reciprocal Rank Fusion. Catches both semantic matches and exact keyword hits that embeddings alone miss.

**Reranking**
Cross-encoder reranking on retrieved candidates. Improves recall@5 significantly over raw vector similarity — the difference between "mostly relevant" and "actually useful" context.

**Structured Output & Citations**
Every answer comes with source citations pointing to the exact chunk, document, and page. No black-box answers — users can verify every claim.

**Automated Evaluation**
Built-in evaluation pipeline that measures faithfulness, answer relevancy, and context precision. You ship with numbers, not faith.

**Observability**
End-to-end tracing of every retrieval and generation step. Know exactly which chunk influenced which part of the answer, how long each step took, and where quality degrades.

## Installation

```bash
# Python
pip install ragi-instant

# Go
go get github.com/faisalaffan/ragi-instant

# TypeScript
npm install ragi-instant
```

## Quick Start

```python
from ragi_instant import Ragi

ragi = Ragi()

# Index documents with hybrid search
ragi.index("path/to/documents")

# Search across dense + sparse indices
results = ragi.search(
    "What are the latest OJK regulations on peer-to-peer lending?",
    top_k=5,
    rerank=True,
    citations=True
)

# Structured response
print(results.answer)
for cite in results.citations:
    print(f"  [{cite.chunk_id}] {cite.doc_name}, p.{cite.page}")
```

## Architecture

```
Ingestion:
  PDF/DOCX → Layout-aware parsing → Semantic chunking
           → Dual index (dense vector + sparse BM25)
           → Metadata attached (doc_id, page, section, date)

Query:
  User question → Parallel retrieval (dense + sparse)
                → RRF fusion → Cross-encoder reranking
                → Context assembly → Structured generation
                → Answer + citations + confidence score

Evaluation (async):
  Each query → Trace all steps → Run evals → Log metrics
```

## Study Case: Regulatory & Compliance Intelligence

Ragi-Instant is built for high-stakes document domains where accuracy matters more than speed:

- **Multi-document reasoning** — cross-reference regulations across documents and versions
- **Change detection** — track what changed between regulation revisions
- **Citation-grounded answers** — every claim backed by exact source, page, and quote
- **Structured output** — answers with confidence scores, related regulations, and chunk-level provenance

Ideal for legal, compliance, fintech, and any domain where hallucination is not an option.

## Benchmark Targets

Real numbers ship with the MVP. These are the targets we're building toward:

| Metric            | Target |
| ----------------- | ------ |
| Faithfulness      | > 0.85 |
| Answer Relevancy  | > 0.80 |
| Context Precision | > 0.75 |
| Avg latency        | < 2s   |

Evaluated on 30+ Q&A pairs sourced from real regulatory documents.

## Roadmap

- [ ] **Python SDK** — FastAPI integration, async indexing, batch ingestion
- [ ] **Go SDK** — High-throughput ingestion, concurrent retrieval
- [ ] **TypeScript SDK** — Browser and edge runtime support
- [ ] **Docker Compose** — One-command local stack (Postgres + pgvector + API)
- [ ] **Eval dashboard** — Visualize faithfulness, relevancy, and precision trends over time
- [ ] **Query rewriting** — LLM-based query expansion for ambiguous inputs

## License

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
