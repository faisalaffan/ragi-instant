## RAG yang "Benar-Benar Oke" — Bukan Sekedar Demo

Dulu saya bilang "pakai semua tools = over-engineered". Itu tetap berlaku. Tapi untuk RAG spesifik, ada subset tools yang memang **perlu** untuk disebut production-grade.

---

## Apa yang membedakan RAG biasa vs RAG yang impressive

```
RAG biasa (tutorial level):
query → embed → cosine similarity → top-k → LLM → answer

RAG impressive (production level):
query → [query rewriting] → [routing] → hybrid search
     → [reranking] → [context compression] → LLM
     → [hallucination check] → answer + citations + confidence
     + eval pipeline yang jalan otomatis
```

---

## Study Case Terkuat untuk RAG: **Regulatory & Compliance Intelligence**

### Problem

> "Saya compliance officer / legal / fintech founder. Regulasi OJK, BI, POJK berubah terus. Saya butuh: apakah regulasi X mempengaruhi produk saya? Apa yang berubah dari versi lama ke baru?"

### Kenapa ini winning study case:

- **Domain yang ada uangnya** — compliance di fintech bukan nice-to-have, ini wajib
- **Data yang challenging** — PDF regulasi, tabel, cross-reference antar dokumen
- **Kamu punya konteks** — background BTPN Syariah, IAG, BI-Fast = credible
- **Non-trivial technically** — multi-document reasoning, change detection, citation wajib akurat

---

## Stack RAG yang Worth (tidak lebay, tidak kurang)

### Tier 1 — Wajib ada

| Komponen             | Tool pilihan                                   | Alasan                                              |
| -------------------- | ---------------------------------------------- | --------------------------------------------------- |
| **Document parsing** | Docling                                        | Layout-aware, handle PDF tabel dengan benar         |
| **Chunking**         | LlamaIndex `SemanticChunker`                   | Bukan fixed-size, paham batas semantik              |
| **Embedding**        | `text-embedding-3-small` (OpenAI) atau Jina v3 | Proven quality, multilingual                        |
| **Vector store**     | pgvector                                       | Pragmatis, satu DB, cukup untuk < 5M vectors        |
| **Keyword search**   | PostgreSQL FTS (BM25)                          | Sudah ada di Postgres, tidak perlu Elasticsearch    |
| **Hybrid search**    | RRF (Reciprocal Rank Fusion)                   | Combine vector + keyword tanpa tuning parameter     |
| **Reranking**        | Cohere Rerank v3                               | Signifikan improve recall@5, terbukti di production |
| **Generation**       | Claude Haiku / GPT-4o mini                     | Balance cost vs quality                             |
| **Observability**    | LangFuse                                       | Trace setiap retrieval + generation                 |
| **Eval**             | RAGAS                                          | Faithfulness + answer relevancy otomatis            |

### Tier 2 — Tambahkan jika ada waktu

| Komponen                  | Tool                  | Impact                                            |
| ------------------------- | --------------------- | ------------------------------------------------- |
| **Query rewriting**       | LLM (1 call)          | +15–20% retrieval quality untuk ambiguous query   |
| **Hypothetical document** | HyDE technique        | Boost recall untuk abstract queries               |
| **Context compression**   | LLMLingua atau manual | Kurangi token, turunkan cost                      |
| **Structured output**     | Instructor            | Return citation dengan chunk_id, bukan hanya text |

### Tier 3 — Skip untuk portofolio

| Tool                       | Kenapa skip                                  |
| -------------------------- | -------------------------------------------- |
| Weaviate, Pinecone, Milvus | pgvector sudah cukup, complexity tidak worth |
| LangChain                  | LlamaIndex lebih focused untuk RAG           |
| Elasticsearch              | Overkill, BM25 via Postgres sudah sufficient |
| Fine-tuning embedding      | Butuh labeled data yang tidak ada            |

---

## Arsitektur Lengkap

```
INGESTION PIPELINE
─────────────────
PDF / URL / DOCX
      │
      ▼
Docling (parse + extract tables + layout)
      │
      ▼
SemanticChunker (LlamaIndex)
  ├── Chunk by semantic boundary
  ├── Metadata: doc_id, page, section, date
  └── Overlap: 10% antar chunk
      │
      ▼
Dual indexing:
  ├── pgvector (dense embedding)
  └── PostgreSQL FTS (sparse / BM25)
      │
      ▼
LangFuse: log ingestion metrics


QUERY PIPELINE
──────────────
User query
      │
      ▼
[Optional] Query rewriting
  └── "POJK terbaru soal pinjol" →
      "Peraturan OJK terbaru mengenai peer-to-peer lending 2024 2025"
      │
      ▼
Parallel retrieval:
  ├── Dense: pgvector similarity (top-20)
  └── Sparse: PostgreSQL FTS (top-20)
      │
      ▼
RRF (Reciprocal Rank Fusion) → top-40 combined
      │
      ▼
Cohere Rerank → top-5 final
      │
      ▼
Context assembly + Instructor schema:
  {
    context_chunks: [...],
    source_metadata: [...],
    estimated_relevance: float
  }
      │
      ▼
LLM generation (dengan system prompt ketat:
  "Hanya jawab berdasarkan konteks. Jika tidak ada, katakan tidak tahu.")
      │
      ▼
Structured response (Instructor):
  {
    answer: string,
    citations: [{ chunk_id, doc_name, page, quote }],
    confidence: float,
    related_regulations: [...]
  }
      │
      ▼
LangFuse trace + RAGAS eval (async)
```

---

## Eval Pipeline — Ini yang paling sering diabaikan

Yang bikin RAG portofolio terlihat serius adalah **kamu punya angka**.

```python
# Contoh eval dataset (buat 20-30 Q&A pairs manual)
eval_set = [
    {
        "question": "Apa batas maksimum bunga pinjol per bulan menurut OJK?",
        "ground_truth": "0.4% per hari sesuai POJK No. 10/2022",
        "contexts": [...]  # retrieved chunks
    },
    ...
]

# Run RAGAS
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

results = evaluate(eval_set, metrics=[
    faithfulness,          # apakah answer didukung context?
    answer_relevancy,      # apakah answer relevan dengan question?
    context_precision,     # apakah retrieved chunks memang relevan?
])

# Target: faithfulness > 0.85, answer_relevancy > 0.80
```

Di README / portfolio, tampilkan tabel ini. Itu yang interviewer ingat.

---

## MVP Scope (3 minggu realistis)

```
Week 1:
✅ Docling: ingest PDF regulasi OJK/BI
✅ pgvector + FTS dual index
✅ Basic retrieval (hybrid RRF)
✅ FastAPI endpoint

Week 2:
✅ Cohere Rerank
✅ LangFuse tracing
✅ Structured output dengan Instructor
✅ Citation di response

Week 3:
✅ RAGAS eval pipeline + angka di README
✅ Simple Next.js UI
✅ Query rewriting (opsional tapi impressive)
✅ Docker Compose untuk easy run
```

---

## Yang harus ada di README untuk impressive

```markdown
## Benchmark

| Metric            | Score  |
| ----------------- | ------ |
| Faithfulness      | 0.89   |
| Answer Relevancy  | 0.83   |
| Context Precision | 0.76   |
| Avg latency       | 1.2s   |
| Avg cost/query    | $0.003 |

Tested on 30 Q&A pairs dari dokumen POJK dan PBI.
```

Ini yang membedakan "saya build RAG" vs "saya build RAG dan tahu seberapa bagus performanya."
