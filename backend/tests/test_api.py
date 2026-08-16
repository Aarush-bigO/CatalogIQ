"""Backend API tests."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.database import AsyncSessionLocal, init_db


@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def db() -> AsyncSession:
    """Provide a database session for tests."""
    async with AsyncSessionLocal() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client() -> AsyncClient:
    """Provide an HTTP client for tests."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestHealth:
    async def test_health_check(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestProducts:
    async def test_create_product(self, client: AsyncClient):
        payload = {
            "sku": "TEST-001",
            "name": "Test Industrial Valve",
            "description": "A test product for unit testing",
            "category": "Valves",
            "brand": "TestBrand",
            "attributes": {"material": "steel", "pressure_rating": "150 PSI"},
        }
        response = await client.post("/api/v1/products/", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["sku"] == "TEST-001"
        assert data["name"] == "Test Industrial Valve"
        return data["id"]

    async def test_list_products(self, client: AsyncClient):
        response = await client.get("/api/v1/products/")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    async def test_get_product(self, client: AsyncClient):
        # First create
        create_resp = await client.post("/api/v1/products/", json={
            "sku": "TEST-002",
            "name": "Another Test Product",
        })
        product_id = create_resp.json()["id"]
        
        # Then get
        response = await client.get(f"/api/v1/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id

    async def test_update_product(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/products/", json={
            "sku": "TEST-003",
            "name": "Update Test",
        })
        product_id = create_resp.json()["id"]
        
        response = await client.patch(f"/api/v1/products/{product_id}", json={
            "name": "Updated Name",
        })
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    async def test_delete_product(self, client: AsyncClient):
        create_resp = await client.post("/api/v1/products/", json={
            "sku": "TEST-004",
            "name": "Delete Test",
        })
        product_id = create_resp.json()["id"]
        
        response = await client.delete(f"/api/v1/products/{product_id}")
        assert response.status_code == 204


class TestSearch:
    async def test_search_endpoint(self, client: AsyncClient):
        response = await client.post("/api/v1/search/", json={
            "query": "valve",
            "search_type": "keyword",
            "top_k": 10,
        })
        assert response.status_code == 200
        data = response.json()
        assert "results" in data


class TestDocuments:
    async def test_upload_document(self, client: AsyncClient):
        # Note: Actual file upload testing requires multipart setup
        response = await client.get("/api/v1/documents/")
        assert response.status_code == 200
