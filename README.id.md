<p align="center">
  <a href="README.md">🇬🇧 English</a>
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
  <strong>RAG production-grade untuk kepatuhan regulasi. Hybrid search, reranking, routing, deteksi halusinasi — dalam satu pipeline.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-active--development-green.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/python-3.12+-blue.svg" alt="Python"></a>
</p>

---

**Ragi-Instant** adalah sistem RAG (Retrieval-Augmented Generation) yang dibangun untuk regulatory & compliance intelligence. Melampaui siklus `embed → search → generate` ala tutorial dengan pipeline production-grade: query rewriting, intent routing, hybrid retrieval, cross-encoder reranking, context compression, structured output dengan kutipan, dan pengecekan halusinasi — semuanya ditracing dan dievaluasi otomatis.

## Pipeline

```
Pertanyaan User
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
Cohere Rerank v3          Top-40 → top-5 final
    │
    ▼
[Context Compression]     Ringkasan LLM mempertahankan fakta legal (opsional)
    │
    ▼
LLM Generation            GPT-4o mini / Claude Haiku + Instructor structured output
    │
    ▼
Hallucination Check       Verifikasi setiap klaim terhadap konteks sumber
    │
    ▼
Jawaban + Kutipan + Confidence + Regulasi Terkait
    │
    ▼
LangFuse Trace + RAGAS Eval (async)
```

## Kemampuan Utama

**Query Rewriting**
Ekspansi kueri berbasis LLM. "POJK terbaru pinjol" menjadi "Peraturan OJK terbaru mengenai peer-to-peer lending 2024 2025" sebelum retrieval. +15-20% kualitas retrieval untuk kueri ambigu.

**Intent Routing**
Mengklasifikasikan kueri ke regulation_lookup, definition, comparison, atau obligation_check. Setiap intent dipetakan ke strategi pencarian yang berbeda (dense-only, sparse-only, atau hybrid).

**Hybrid Search**
Pencarian vektor dense (pgvector HNSW) dikombinasikan dengan pencarian kata kunci sparse (PostgreSQL FTS BM25 dengan GIN index), difusikan melalui Reciprocal Rank Fusion. Menangkap kecocokan semantik dan istilah hukum eksak.

**Reranking**
Cohere Rerank v3 cross-encoder pada kandidat hasil retrieval. Meningkatkan recall@5 secara signifikan dibanding raw vector similarity.

**Context Compression**
Ringkasan berbasis LLM yang mempertahankan angka, persentase, nomor pasal, dan definisi hukum sambil menghapus transisi dan pengulangan. Pengurangan token 40-60%.

**Structured Output & Kutipan**
Setiap jawaban disertai kutipan sumber yang menunjuk ke chunk, dokumen, halaman, dan pasal yang tepat. Bukan jawaban black-box — setiap klaim bisa diverifikasi.

**Deteksi Halusinasi**
Langkah verifikasi pasca-generasi. Setiap klaim dalam jawaban diperiksa terhadap konteks sumber. Menghasilkan skor halusinasi dan menandai klaim yang tidak didukung.

**Deteksi Perubahan Regulasi**
Unggah dua versi regulasi dan dapatkan diff terstruktur — pasal mana yang berubah, apa yang ditambahkan, apa yang dihapus — dikelompokkan berdasarkan dampak (HIGH/MEDIUM/LOW).

**Evaluasi Otomatis**
Pipeline evaluasi RAGAS bawaan dengan 30 pasangan Q&A yang dikurasi. Mengukur faithfulness, answer relevancy, dan context precision. Anda rilis dengan angka, bukan asumsi.

**Observabilitas**
LangFuse tracing end-to-end setiap langkah: query rewriting, routing, hybrid search, reranking, compression, generation, dan hallucination check. Latency dan confidence per langkah.

## Demo Aplikasi

Berikut adalah pratinjau visual dari antarmuka dashboard utama:

| Startup Splash Screen | Dashboard Sistem Utama |
|---|---|
| <img src="assets/DEMO_APPS/00_SPLASH_SCREEN.png" width="100%"> | <img src="assets/DEMO_APPS/01_DASHBOARD.png" width="100%"> |

| AI Query Workspace & Kutipan | Benchmark Evaluasi RAGAS |
|---|---|
| <img src="assets/DEMO_APPS/11_RESPONSE_OK_WITH_80_PERCENT_CONFIDENT.png" width="100%"> | <img src="assets/DEMO_APPS/14_EVALUATE_RAGAS.png" width="100%"> |

👉 **Jelajahi galeri lengkap berisi 16 tangkapan layar dengan penjelasan detail setiap langkah pipeline di [Galeri Demo Ragi Instant](./docs/demo.md).**

## Instalasi

```bash
cd backend
pip install -e .
```

## Mulai Cepat

```bash
# 1. Salin template env dan isi API keys
cp .env.example .env
# Wajib: OPENAI_API_KEY, COHERE_API_KEY

# 2. Deploy ke VPS
make deploy

# 3. Unggah dokumen regulasi
curl -F "file=@POJK_10_2022.pdf" \
     -F "title=POJK No. 10 Tahun 2022" \
     http://vps:8000/api/ingest/documents

# 4. Tanya regulasi
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

| Endpoint | Method | Deskripsi |
|---|---|---|
| `/health` | GET | Health check |
| `/api/ingest/documents` | POST | Unggah PDF/DOCX untuk indexing |
| `/api/ingest/documents` | GET | Daftar semua dokumen |
| `/api/ingest/documents/{id}` | GET | Detail dokumen |
| `/api/ingest/documents/{id}/chunks` | GET | Lihat chunk hasil indeks |
| `/api/query` | POST | Pipeline RAG lengkap |
| `/api/analysis/compare` | POST | Bandingkan dua versi dokumen |

## Benchmark

Diuji pada 30 pasangan Q&A dari dokumen regulasi keuangan Indonesia (POJK, PBI).

| Metrik | Skor | Target |
|---|---|---|
| Faithfulness | **0.89** | > 0.85 |
| Answer Relevancy | **0.83** | > 0.80 |
| Context Precision | **0.76** | > 0.75 |
| Avg Latency | **1.27d** | < 2.0d |
| Avg Cost/Query | **<$0.01** | < $0.01 |

*Skor dievaluasi menggunakan GPT-4o sebagai evaluator pada dataset patokan POJK & PBI.*

## Stack

| Layer | Teknologi |
|---|---|
| Document Parsing | Docling (layout-aware PDF + ekstraksi tabel) |
| Chunking | LlamaIndex SemanticSplitterNodeParser |
| Embedding | OpenAI text-embedding-3-small |
| Vector Store | pgvector (HNSW index) |
| Keyword Search | PostgreSQL FTS (BM25, GIN index) |
| Backend API | FastAPI (async) |
| Frontend | Next.js 15 + shadcn/ui + Tailwind CSS |
| Tracing | LangFuse |
| Evaluasi | RAGAS |

## Lisensi

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
