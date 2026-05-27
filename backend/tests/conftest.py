import os
import pytest


@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setattr("app.config.settings.database_url", "postgresql://test@localhost/test")
    monkeypatch.setattr("app.config.settings.openai_api_key", "test-key")
    monkeypatch.setattr("app.config.settings.anthropic_api_key", "test-key")
    monkeypatch.setattr("app.config.settings.langfuse_public_key", "")
    monkeypatch.setattr("app.config.settings.langfuse_secret_key", "")
    monkeypatch.setattr("app.config.settings.llm_provider", "openai")
    monkeypatch.setattr("app.config.settings.generation_model", "gpt-4o-mini")
    monkeypatch.setattr("app.config.settings.openai_base_url", "https://api.deepseek.com")


@pytest.fixture
def sample_markdown():
    return """# Pasal 1: Ketentuan Umum

Dalam Peraturan Otoritas Jasa Keuangan ini yang dimaksud dengan:

1. Peer-to-Peer Lending adalah layanan pinjam meminjam uang berbasis teknologi informasi.
2. Penyelenggara adalah badan hukum Indonesia yang menyediakan layanan P2P lending.

## Pasal 2: Ruang Lingkup

Ruang lingkup Peraturan OJK ini meliputi seluruh penyelenggara layanan pinjam meminjam uang berbasis teknologi informasi yang terdaftar di OJK.

### Pasal 3: Batas Maksimum

Batas maksimum manfaat ekonomi sebesar 0,4% per hari dari nilai pendanaan yang tercantum dalam perjanjian."""


@pytest.fixture
def sample_chunk_texts():
    return [
        "Batas maksimum manfaat ekonomi sebesar 0,4% per hari dari nilai pendanaan.",
        "Peer-to-Peer Lending adalah layanan pinjam meminjam uang berbasis teknologi informasi.",
        "Ruang lingkup Peraturan OJK ini meliputi seluruh penyelenggara.",
    ]


@pytest.fixture
def sample_answer():
    return "Berdasarkan POJK No. 10/PT. LKM/2022, batas maksimum bunga pinjaman online adalah 0,4% per hari dari nilai pendanaan."


@pytest.fixture
def sample_context_chunks():
    return [
        "Pasal 3 Ayat 1: Batas maksimum manfaat ekonomi sebesar 0,4% per hari dari nilai pendanaan yang tercantum dalam perjanjian.",
        "Pasal 5 Ayat 2: Penyelenggara wajib memenuhi ketentuan batas maksimum manfaat ekonomi.",
    ]
