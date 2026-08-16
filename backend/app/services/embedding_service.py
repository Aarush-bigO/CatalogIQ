"""Embedding service for vector search and semantic retrieval."""

import asyncio
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class EmbeddingService:
    """
    Generates and manages text embeddings for semantic search.
    Supports OpenAI, HuggingFace, and local embedding models.
    """

    def __init__(self):
        self.provider = self._detect_provider()
        self._openai_client = None
        self._hf_model = None
        self._chroma_client = None

    def _detect_provider(self) -> str:
        """Auto-detect best available embedding provider."""
        if settings.openai_api_key:
            return "openai"
        return "huggingface"

    def _get_openai_client(self):
        """Lazy-load OpenAI client."""
        if self._openai_client is None:
            import openai
            self._openai_client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        return self._openai_client

    def _get_hf_model(self):
        """Lazy-load HuggingFace sentence transformer."""
        if self._hf_model is None:
            from sentence_transformers import SentenceTransformer
            self._hf_model = SentenceTransformer(settings.hf_embedding_model)
            logger.info(f"Loaded HF embedding model: {settings.hf_embedding_model}")
        return self._hf_model

    def _get_chroma_collection(self):
        """Lazy-load ChromaDB collection."""
        if self._chroma_client is None:
            import chromadb
            from chromadb.config import Settings
            
            chroma_settings = Settings(
                chroma_server_host=settings.chroma_host,
                chroma_server_http_port=settings.chroma_port,
                anonymized_telemetry=False,
            )
            self._chroma_client = chromadb.HttpClient(settings=chroma_settings)
            
            # Create/get collection
            self._collection = self._chroma_client.get_or_create_collection(
                name=settings.pinecone_index_name,
                metadata={"hnsw:space": "cosine"},
            )
            logger.info(f"Connected to ChromaDB collection: {settings.pinecone_index_name}")
        return self._collection

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector for a single text."""
        if self.provider == "openai":
            return await self._embed_openai(text)
        return await self._embed_hf(text)

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        if self.provider == "openai":
            return await self._embed_openai_batch(texts)
        return await self._embed_hf_batch(texts)

    async def _embed_openai(self, text: str) -> List[float]:
        """Embed using OpenAI API."""
        client = self._get_openai_client()
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=text,
        )
        return response.data[0].embedding

    async def _embed_openai_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embed using OpenAI API."""
        client = self._get_openai_client()
        response = await client.embeddings.create(
            model=settings.openai_embedding_model,
            input=texts,
        )
        return [d.embedding for d in response.data]

    async def _embed_hf(self, text: str) -> List[float]:
        """Embed using HuggingFace model (runs in thread pool)."""
        loop = asyncio.get_event_loop()
        model = self._get_hf_model()
        embedding = await loop.run_in_executor(None, model.encode, text)
        return embedding.tolist()

    async def _embed_hf_batch(self, texts: List[str]) -> List[List[float]]:
        """Batch embed using HuggingFace model."""
        loop = asyncio.get_event_loop()
        model = self._get_hf_model()
        embeddings = await loop.run_in_executor(None, model.encode, texts)
        return embeddings.tolist()

    def _product_to_text(self, product: Any) -> str:
        """Convert a product object to searchable text."""
        parts = [
            f"SKU: {product.sku}",
            f"Name: {product.name}",
        ]
        if product.description:
            parts.append(f"Description: {product.description}")
        if product.category:
            parts.append(f"Category: {product.category}")
        if product.brand:
            parts.append(f"Brand: {product.brand}")
        if product.manufacturer:
            parts.append(f"Manufacturer: {product.manufacturer}")
        if product.specifications:
            for k, v in product.specifications.items():
                parts.append(f"{k}: {v}")
        if product.attributes:
            for k, v in product.attributes.items():
                parts.append(f"{k}: {v}")
        return "\n".join(parts)

    async def index_product(self, product: Any) -> None:
        """Index a product into the vector store."""
        try:
            collection = self._get_chroma_collection()
            text = self._product_to_text(product)
            embedding = await self.embed_text(text)
            
            collection.upsert(
                ids=[str(product.id)],
                embeddings=[embedding],
                documents=[text],
                metadatas=[{
                    "sku": product.sku,
                    "name": product.name,
                    "category": product.category or "",
                    "brand": product.brand or "",
                    "status": product.status.value if product.status else "",
                }],
            )
            logger.info(f"Indexed product {product.id} in vector store")
        except Exception as e:
            logger.error(f"Failed to index product {product.id}: {e}")

    async def delete_product_index(self, product_id: str) -> None:
        """Remove a product from the vector store."""
        try:
            collection = self._get_chroma_collection()
            collection.delete(ids=[product_id])
            logger.info(f"Deleted product {product_id} from vector store")
        except Exception as e:
            logger.error(f"Failed to delete product {product_id} from index: {e}")

    async def search_similar(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Semantic search across indexed products."""
        try:
            collection = self._get_chroma_collection()
            embedding = await self.embed_text(query)
            
            where_filter = None
            if filters:
                where_filter = filters
            
            results = collection.query(
                query_embeddings=[embedding],
                n_results=top_k,
                where=where_filter,
                include=["documents", "metadatas", "distances"],
            )
            
            matches = []
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    distance = results["distances"][0][i]
                    # Convert distance to similarity score (cosine)
                    similarity = 1 - distance
                    matches.append({
                        "product_id": doc_id,
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": round(similarity, 4),
                    })
            
            return matches
            
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    async def find_similar_products(
        self,
        product_id: str,
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Find products similar to a given product ID."""
        try:
            collection = self._get_chroma_collection()
            
            # Get the product's embedding
            result = collection.get(
                ids=[product_id],
                include=["embeddings"],
            )
            
            if not result["embeddings"]:
                return []
            
            embedding = result["embeddings"][0]
            
            # Search for similar
            results = collection.query(
                query_embeddings=[embedding],
                n_results=top_k + 1,  # +1 to exclude self
                include=["documents", "metadatas", "distances"],
            )
            
            matches = []
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    if doc_id == product_id:
                        continue
                    distance = results["distances"][0][i]
                    similarity = 1 - distance
                    matches.append({
                        "product_id": doc_id,
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i],
                        "score": round(similarity, 4),
                    })
            
            return matches[:top_k]
            
        except Exception as e:
            logger.error(f"Similar product search failed: {e}")
            return []
