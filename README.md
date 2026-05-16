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
  <strong>RAG System that is simple and fast. Like ragi to make Indonesian bread.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-draft-orange.svg" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/platform-Python%20%7C%20Go%20%7C%20TypeScript-lightgrey.svg" alt="Platform"></a>
</p>

---

**Ragi-Instant** is a RAG (Retrieval-Augmented Generation) library designed for simplicity and speed. Like instant yeast that you just add to dough, Ragi-Instant integrates into your existing AI project — immediately enabling document indexing, semantic search, and context retrieval to augment LLM responses.

> _"Why should RAG be so complicated? Instant yeast just needs to be added, and it rises."_

## Philosophy

### Three Principles of Ragi

**1. Simple like a sachet**  
Instant yeast comes in sachets — open, add, done. No complex activation. Ragi-Instant is the same: one install, minimal config, RAG ready to go.

**2. Fast like instant**  
Instant yeast works faster than regular yeast. Ragi-Instant is built for fast indexing, fast retrieval, and response times that don't keep users waiting.

**3. Rises like yeast**  
Yeast transforms flat dough into risen bread — adding volume, texture, and value. RAG transforms simple queries into context-rich answers — adding depth, accuracy, and relevance.

### Core Values

| Value          | Meaning                                        |
| -------------- | ---------------------------------------------- |
| **Simple**     | Minimal setup, running in 10 minutes           |
| **Fast**       | Indexing and retrieval optimized from the start |
| **Flexible**   | Support for various vector stores and LLM providers |
| **Indonesian** | Built with local context and needs             |

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

# Initialize with default settings
ragi = Ragi()

# Index your documents
ragi.index("path/to/documents")

# Search
results = ragi.search("What is fermentation?")
```

## Roadmap

- [ ] Python SDK
- [ ] Go SDK
- [ ] TypeScript SDK
- [ ] Built-in vector store adapters
- [ ] Multi-provider LLM support

## License

MIT © [Muhammad Faisal Affan](https://github.com/faisalaffan)
