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
  <strong>RAG System yang sederhana dan cepat. Seperti ragi untuk membuat roti khas Indonesia.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-draft-orange.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Python%20%7C%20Go%20%7C%20TypeScript-lightgrey.svg" alt="Platform"></a>
</p>

---

**Ragi-Instant** adalah library RAG (Retrieval-Augmented Generation) yang dirancang untuk kemudahan dan kecepatan implementasi. Seperti ragi instant yang tinggal ditambahkan ke adonan, Ragi-Instant tinggal diintegrasikan ke project AI yang sudah ada — langsung bisa melakukan document indexing, semantic search, dan context retrieval untuk augmentasi LLM response.

> _"Kenapa RAG harus serumit itu? Ragi instant saja tinggal tambah, langsung mengembang."_

## Filosofi

### Tiga Prinsip Ragi

**1. Sederhana seperti sachet**  
Ragi instant datang dalam sachet — buka, tambahkan, selesai. Tidak perlu aktivasi rumit. Ragi-Instant juga demikian: satu install, minimal config, langsung bisa RAG.

**2. Cepat seperti instant**  
Ragi instant bekerja lebih cepat dari ragi biasa. Ragi-Instant dirancang untuk indexing cepat, retrieval cepat, dan response time yang tidak membuat user menunggu.

**3. Mengembangkan seperti yeast**  
Ragi mengubah adonan datar menjadi roti yang mengembang — menambahkan volume, tekstur, dan nilai. RAG mengubah query sederhana menjadi jawaban yang kaya konteks — menambahkan kedalaman, akurasi, dan relevansi.

### Nilai Inti

| Nilai          | Makna                                          |
| -------------- | ---------------------------------------------- |
| **Simple**     | Setup minimal, bisa jalan dalam 10 menit       |
| **Fast**       | Indexing dan retrieval dioptimalkan dari awal  |
| **Flexible**   | Support berbagai vector store dan LLM provider |
| **Indonesian** | Dibangun dengan konteks dan kebutuhan lokal    |

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

# Inisialisasi dengan pengaturan default
ragi = Ragi()

# Index dokumen kamu
ragi.index("path/to/documents")

# Cari
results = ragi.search("Apa itu fermentasi?")
```

## Roadmap

- [ ] Python SDK
- [ ] Go SDK
- [ ] TypeScript SDK
- [ ] Built-in vector store adapters
- [ ] Multi-provider LLM support

## Dokumentasi

Dokumen kebutuhan produk dan rationale desain lengkap: [docs/PRD.md](docs/PRD.md)

## Lisensi

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
