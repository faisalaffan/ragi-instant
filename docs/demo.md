# 📷 Ragi Instant App Gallery & Interface Demo

This document showcases the full suite of interfaces, pages, and interactive features of **Ragi Instant — Regulatory Intelligence Dashboard**.

---

## 🚀 1. Application Startup & Dashboard

### Native-like Startup Splash Screen
When the application first loads, a cinematic startup splash screen greets the user with an animated glowing ambient backdrop and high-resolution brand banner.

<p align="center">
  <img src="../assets/DEMO_APPS/00_SPLASH_SCREEN.png" alt="Splash Screen" width="80%">
</p>

### Main System Dashboard
The home page features a modern glassmorphic dashboard showcasing vital statistics, indexing health metrics, historical latency charts, and recent document ingestion streams.

<p align="center">
  <img src="../assets/DEMO_APPS/01_DASHBOARD.png" alt="Dashboard" width="90%">
</p>

---

## 📂 2. Document & Ingestion Management

### Regulatory Document Library
A unified repository page listing all indexed POJK, PBI, and other financial regulations with active search, category filtering, and ingestion state badges.

<p align="center">
  <img src="../assets/DEMO_APPS/02_DOCS_REGULATION.png" alt="Document Library" width="90%">
</p>

### Deep Ingestion & Semantic Chunk Inspector
Inspect specific documents at a granular level. View semantic chunks, layout-aware parses (tables, sections), metadata maps, and embedding vectors.

<p align="center">
  <img src="../assets/DEMO_APPS/03_DETAIL_DOCS_REGULATION.png" alt="Document Inspector" width="90%">
</p>

### Drag-and-Drop Document Uploader
A premium card interface allowing legal and compliance officers to drop multi-page PDF or DOCX regulations directly into the ingestion pipeline.

<p align="center">
  <img src="../assets/DEMO_APPS/04_UPLOAD_DOCS.png" alt="Uploader Interface" width="90%">
</p>

### Real-Time Pipeline Progress Tracing
The document ingestion process visualizes progress in real-time, showing steps from layout parsing (Docling) to semantic chunking (LlamaIndex) and pgvector embedding generation.

| Phase 1: Layout Parsing | Phase 2: Embedding Generation | Ingestion Complete |
|---|---|---|
| <img src="../assets/DEMO_APPS/05_UPLOAD_PROCESS.png" width="100%"> | <img src="../assets/DEMO_APPS/06_UPLOAD_PROCESS_2.png" width="100%"> | <img src="../assets/DEMO_APPS/07_UPLOAD_SUCCESS.png" width="100%"> |

---

## 💬 3. AI Regulatory Q&A System

### AI Query Workspace
An interactive, distraction-free playground where compliance officers can query complex regulations, featuring pre-set prompt ideas.

<p align="center">
  <img src="../assets/DEMO_APPS/08_ASK_FOR_REGULATION.png" alt="Q&A Playground" width="90%">
</p>

### Comprehensive Hybrid Search Answers
Ragi Instant combines dense pgvector semantic matches and sparse PostgreSQL keyword FTS to yield incredibly precise answers with legal claim citations, confidence, and hallucination scores.

<p align="center">
  <img src="../assets/DEMO_APPS/11_RESPONSE_OK_WITH_80_PERCENT_CONFIDENT.png" alt="High Confidence Q&A Answer" width="90%">
</p>

### Verifiable Citation Tooltips
hovering over claims highlights the exact article, page number, and quote inside the source regulation, ensuring black-box-free trust.

<p align="center">
  <img src="../assets/DEMO_APPS/10_RESPONSE_OK_WITH_80_PERCENT_CONFIDENT_CITATION.png.png" alt="Citation Inspection" width="90%">
</p>

### Robust Fallback Handling
When information does not exist in the uploaded regulations, the system displays clean alerts without hallucinating.

| Low Confidence Disclaimer | No Matching Context Found |
|---|---|
| <img src="../assets/DEMO_APPS/12_RESPONSE_OK_WITH_NO_CONFIDENT.png" width="100%"> | <img src="../assets/DEMO_APPS/09_RESPONSE_NOT_FOUND.png" width="100%"> |

---

## ⚖️ 4. Advanced Analytics & Operations

### Regulatory Version Comparison
Upload two different versions of a regulation (e.g. POJK 2022 vs 2024 update) and get a structured, side-by-side legal diff highlighting modifications classified by impact.

<p align="center">
  <img src="../assets/DEMO_APPS/13_COMPARE_REGULATION.png" alt="Regulation Diff" width="90%">
</p>

### Automated RAGAS Evaluation Dashboard
Shipped with numerical benchmarks. Automatically runs RAGAS evaluations over a curated golden Q&A dataset to measure Context Precision, Faithfulness, and Answer Relevancy.

<p align="center">
  <img src="../assets/DEMO_APPS/14_EVALUATE_RAGAS.png" alt="RAGAS Evaluation" width="90%">
</p>

### System & Connection Settings
Configure backend API connection, adjust model hyperparameters (temperature, max tokens), edit default system prompts, or reset databases.

<p align="center">
  <img src="../assets/DEMO_APPS/15_SETTINGS.png" alt="Settings Interface" width="90%">
</p>
