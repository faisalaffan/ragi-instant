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
  <strong>Library RAG production-grade. Hybrid search, reranking, structured output, evaluasi otomatis — dalam satu pipeline.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-active--development-green.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Python%20%7C%20Go%20%7C%20TypeScript-lightgrey.svg" alt="Platform"></a>
</p>

---

**Ragi-Instant** adalah library RAG (Retrieval-Augmented Generation) yang melampaui siklus `embed → search → generate` ala tutorial. Library ini mengemas pipeline production-grade — hybrid retrieval, cross-encoder reranking, structured output dengan kutipan, dan evaluasi otomatis — dalam satu library yang bisa diintegrasikan dalam hitungan menit.

## Kemampuan Utama

**Hybrid Search**
Pencarian vektor dense dikombinasikan dengan pencarian kata kunci sparse (BM25) yang difusikan melalui Reciprocal Rank Fusion. Menangkap kecocokan semantik dan kata kunci eksak yang terlewat oleh embedding saja.

**Reranking**
Cross-encoder reranking pada kandidat hasil retrieval. Meningkatkan recall@5 secara signifikan dibanding raw vector similarity — beda antara konteks yang "cukup relevan" dan "benar-benar berguna."

**Structured Output & Kutipan**
Setiap jawaban disertai kutipan sumber yang menunjuk ke chunk, dokumen, dan halaman yang tepat. Bukan jawaban black-box — pengguna bisa memverifikasi setiap klaim.

**Evaluasi Otomatis**
Pipeline evaluasi bawaan yang mengukur faithfulness, answer relevancy, dan context precision. Anda rilis dengan angka, bukan asumsi.

**Observabilitas**
Tracing end-to-end setiap langkah retrieval dan generasi. Tahu persis chunk mana yang memengaruhi bagian mana dari jawaban, berapa lama setiap langkah, dan di mana kualitas menurun.

## Instalasi

```bash
# Python
pip install ragi-instant

# Go
go get github.com/faisalaffan/ragi-instant

# TypeScript
npm install ragi-instant
```

## Mulai Cepat

```python
from ragi_instant import Ragi

ragi = Ragi()

# Indeks dokumen dengan hybrid search
ragi.index("path/to/documents")

# Cari di indeks dense + sparse
results = ragi.search(
    "Apa regulasi OJK terbaru tentang peer-to-peer lending?",
    top_k=5,
    rerank=True,
    citations=True
)

# Respons terstruktur
print(results.answer)
for cite in results.citations:
    print(f"  [{cite.chunk_id}] {cite.doc_name}, h.{cite.page}")
```

## Arsitektur

```
Ingestion:
  PDF/DOCX → Parsing sadar-tata-letak → Semantic chunking
           → Indeks ganda (dense vector + sparse BM25)
           → Metadata melekat (doc_id, halaman, seksi, tanggal)

Query:
  Pertanyaan → Retrieval paralel (dense + sparse)
             → Fusi RRF → Cross-encoder reranking
             → Penyusunan konteks → Generasi terstruktur
             → Jawaban + kutipan + skor keyakinan

Evaluasi (async):
  Setiap query → Lacak semua langkah → Jalankan eval → Catat metrik
```

## Studi Kasus: Regulatory & Compliance Intelligence

Ragi-Instant dibangun untuk domain dokumen berisiko tinggi di mana akurasi lebih penting daripada kecepatan:

- **Multi-document reasoning** — referensi silang regulasi antar dokumen dan versi
- **Deteksi perubahan** — lacak apa yang berubah antara revisi regulasi
- **Jawaban dengan kutipan** — setiap klaim didukung sumber, halaman, dan kutipan yang tepat
- **Output terstruktur** — jawaban dengan skor keyakinan, regulasi terkait, dan provenance tingkat chunk

Ideal untuk legal, compliance, fintech, dan domain apa pun di mana halusinasi tidak bisa ditoleransi.

## Target Benchmark

Angka sebenarnya dirilis bersama MVP. Ini adalah target yang kami kejar:

| Metrik            | Target |
| ----------------- | ------ |
| Faithfulness      | > 0.85 |
| Answer Relevancy  | > 0.80 |
| Context Precision | > 0.75 |
| Avg latency        | < 2d   |

Diuji pada 30+ pasangan Q&A dari dokumen regulasi nyata.

## Roadmap

- [ ] **Python SDK** — Integrasi FastAPI, async indexing, batch ingestion
- [ ] **Go SDK** — High-throughput ingestion, concurrent retrieval
- [ ] **TypeScript SDK** — Dukungan browser dan edge runtime
- [ ] **Docker Compose** — Stack lokal satu perintah (Postgres + pgvector + API)
- [ ] **Dashboard eval** — Visualisasi faithfulness, relevancy, dan precision dari waktu ke waktu
- [ ] **Query rewriting** — Ekspansi kueri berbasis LLM untuk input ambigu

## Lisensi

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
