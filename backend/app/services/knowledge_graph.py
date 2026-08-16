"""Knowledge Graph Service using Neo4j."""

import uuid
from typing import Any, Dict, List, Optional

from neo4j import AsyncGraphDatabase

from app.config import get_settings
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class KnowledgeGraphService:
    """
    Manages the product knowledge graph in Neo4j.
    Models: Products, Categories, Attributes, Suppliers, Certifications
    Relationships: belongs_to, has_attribute, manufactured_by, compatible_with, etc.
    """

    def __init__(self):
        self.driver = None

    async def _get_driver(self):
        """Lazy-init Neo4j async driver."""
        if self.driver is None:
            self.driver = AsyncGraphDatabase.driver(
                settings.neo4j_uri,
                auth=(settings.neo4j_user, settings.neo4j_password),
            )
        return self.driver

    async def close(self):
        """Close Neo4j driver."""
        if self.driver:
            await self.driver.close()
            self.driver = None

    async def init_schema(self) -> None:
        """Create constraints and indexes in Neo4j."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            # Constraints
            await session.run(
                "CREATE CONSTRAINT product_id IF NOT EXISTS "
                "FOR (p:Product) REQUIRE p.id IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT category_name IF NOT EXISTS "
                "FOR (c:Category) REQUIRE c.name IS UNIQUE"
            )
            await session.run(
                "CREATE CONSTRAINT supplier_name IF NOT EXISTS "
                "FOR (s:Supplier) REQUIRE s.name IS UNIQUE"
            )
            # Indexes
            await session.run(
                "CREATE INDEX product_sku IF NOT EXISTS "
                "FOR (p:Product) ON (p.sku)"
            )
            await session.run(
                "CREATE INDEX product_name IF NOT EXISTS "
                "FOR (p:Product) ON (p.name)"
            )
        logger.info("Neo4j schema initialized")

    async def create_product_node(self, product: Any) -> None:
        """Create or update a product node in the graph."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            await session.run(
                """
                MERGE (p:Product {id: $id})
                SET p.sku = $sku,
                    p.name = $name,
                    p.description = $description,
                    p.category = $category,
                    p.brand = $brand,
                    p.manufacturer = $manufacturer,
                    p.quality_score = $quality_score,
                    p.updated_at = datetime()
                RETURN p
                """,
                id=str(product.id),
                sku=product.sku,
                name=product.name,
                description=product.description or "",
                category=product.category or "",
                brand=product.brand or "",
                manufacturer=product.manufacturer or "",
                quality_score=product.quality_score or 0.0,
            )
        
        # Create relationships
        if product.category:
            await self._link_category(str(product.id), product.category)
        if product.brand:
            await self._link_brand(str(product.id), product.brand)
        if product.manufacturer:
            await self._link_manufacturer(str(product.id), product.manufacturer)

    async def _link_category(self, product_id: str, category: str) -> None:
        """Link product to category node."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            await session.run(
                """
                MATCH (p:Product {id: $product_id})
                MERGE (c:Category {name: $category})
                MERGE (p)-[:BELONGS_TO]->(c)
                """,
                product_id=product_id,
                category=category,
            )

    async def _link_brand(self, product_id: str, brand: str) -> None:
        """Link product to brand node."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            await session.run(
                """
                MATCH (p:Product {id: $product_id})
                MERGE (b:Brand {name: $brand})
                MERGE (p)-[:BRANDED_AS]->(b)
                """,
                product_id=product_id,
                brand=brand,
            )

    async def _link_manufacturer(self, product_id: str, manufacturer: str) -> None:
        """Link product to manufacturer/supplier node."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            await session.run(
                """
                MATCH (p:Product {id: $product_id})
                MERGE (s:Supplier {name: $manufacturer})
                MERGE (p)-[:MANUFACTURED_BY]->(s)
                """,
                product_id=product_id,
                manufacturer=manufacturer,
            )

    async def create_relationship(
        self,
        source_id: str,
        target_id: str,
        relationship_type: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Create a relationship between two products."""
        rel_type = relationship_type.upper().replace(" ", "_")
        props = properties or {}
        
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            query = f"""
                MATCH (a:Product {{id: $source_id}})
                MATCH (b:Product {{id: $target_id}})
                MERGE (a)-[r:{rel_type}]->(b)
                SET r += $props
                RETURN r
            """
            await session.run(query, source_id=source_id, target_id=target_id, props=props)

    async def get_product_neighbors(
        self,
        product_id: str,
        relationship_type: Optional[str] = None,
        depth: int = 1,
    ) -> List[Dict[str, Any]]:
        """Get neighboring products in the graph."""
        driver = await self._get_driver()
        
        if relationship_type:
            rel_filter = f"TYPE(r) = '{relationship_type.upper()}'"
        else:
            rel_filter = "TRUE"
        
        query = f"""
            MATCH (p:Product {{id: $product_id}})-[r*1..{depth}]-(neighbor:Product)
            WHERE {rel_filter}
            RETURN DISTINCT neighbor, 
                   [rel IN r | {{type: TYPE(rel), props: properties(rel)}}] as relationships
            LIMIT 50
        """
        
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(query, product_id=product_id)
            records = await result.data()
        
        neighbors = []
        for record in records:
            node = record["neighbor"]
            rels = record["relationships"]
            neighbors.append({
                "product_id": node.get("id"),
                "sku": node.get("sku"),
                "name": node.get("name"),
                "category": node.get("category"),
                "relationships": rels,
            })
        
        return neighbors

    async def search_products(
        self,
        query: str,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search products in the knowledge graph."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(
                """
                CALL db.index.fulltext.queryNodes('productSearch', $query)
                YIELD node, score
                RETURN node, score
                LIMIT $limit
                """,
                query=query,
                limit=limit,
            )
            records = await result.data()
        
        return [
            {
                "product_id": r["node"].get("id"),
                "sku": r["node"].get("sku"),
                "name": r["node"].get("name"),
                "score": r["score"],
            }
            for r in records
        ]

    async def infer_relationships(self, product_id: str) -> List[Dict[str, Any]]:
        """Use graph algorithms to infer potential product relationships."""
        driver = await self._get_driver()
        
        # Find products in same category with similar attributes
        async with driver.session(database=settings.neo4j_database) as session:
            result = await session.run(
                """
                MATCH (p:Product {id: $product_id})-[:BELONGS_TO]->(c:Category)
                MATCH (other:Product)-[:BELONGS_TO]->(c)
                WHERE other.id <> $product_id
                OPTIONAL MATCH (p)-[:MANUFACTURED_BY]->(s:Supplier)<-[:MANUFACTURED_BY]-(other)
                WITH other, 
                     CASE WHEN s IS NOT NULL THEN 0.3 ELSE 0 END as same_mfg_bonus
                RETURN other.id as product_id,
                       other.sku as sku,
                       other.name as name,
                       0.5 + same_mfg_bonus as confidence
                LIMIT 20
                """,
                product_id=product_id,
            )
            records = await result.data()
        
        return records

    async def get_graph_stats(self) -> Dict[str, Any]:
        """Get statistics about the knowledge graph."""
        driver = await self._get_driver()
        
        async with driver.session(database=settings.neo4j_database) as session:
            # Node counts
            node_result = await session.run(
                """
                MATCH (n)
                RETURN labels(n)[0] as label, count(n) as count
                """
            )
            nodes = await node_result.data()
            
            # Relationship counts
            rel_result = await session.run(
                """
                MATCH ()-[r]->()
                RETURN type(r) as type, count(r) as count
                """
            )
            relationships = await rel_result.data()
        
        return {
            "nodes": {n["label"]: n["count"] for n in nodes},
            "relationships": {r["type"]: r["count"] for r in relationships},
        }

    async def delete_product(self, product_id: str) -> None:
        """Remove a product and its relationships from the graph."""
        driver = await self._get_driver()
        async with driver.session(database=settings.neo4j_database) as session:
            await session.run(
                """
                MATCH (p:Product {id: $product_id})
                DETACH DELETE p
                """,
                product_id=product_id,
            )
