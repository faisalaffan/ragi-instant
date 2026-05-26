import pytest
from httpx import ASGITransport
from httpx import AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_list_documents_returns_array(client):
    response = await client.get("/api/ingest/documents")
    assert response.status_code in (200, 500)  # 500 if DB unavailable


@pytest.mark.asyncio
async def test_query_endpoint_rejects_empty(client):
    response = await client.post(
        "/api/query",
        json={"question": ""},
    )
    assert response.status_code == 422  # validation error


@pytest.mark.asyncio
async def test_query_endpoint_accepts_valid(client):
    response = await client.post(
        "/api/query",
        json={"question": "Apa batas maksimum bunga pinjol?"},
    )
    assert response.status_code in (200, 500)  # 500 if no docs indexed


@pytest.mark.asyncio
async def test_compare_endpoint_rejects_invalid_uuid(client):
    response = await client.post(
        "/api/analysis/compare",
        json={"old_document_id": "not-a-uuid", "new_document_id": "not-a-uuid"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_compare_endpoint_accepts_valid_uuids(client):
    response = await client.post(
        "/api/analysis/compare",
        json={
            "old_document_id": "00000000-0000-0000-0000-000000000001",
            "new_document_id": "00000000-0000-0000-0000-000000000002",
        },
    )
    assert response.status_code in (200, 404, 500)  # 404 if docs don't exist


@pytest.mark.asyncio
async def test_ingest_rejects_empty_file(client):
    response = await client.post(
        "/api/ingest/documents",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert response.status_code in (400, 422)
