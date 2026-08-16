// Initialize Neo4j Knowledge Graph schema

// Create constraints
CREATE CONSTRAINT product_id IF NOT EXISTS
  FOR (p:Product) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT category_name IF NOT EXISTS
  FOR (c:Category) REQUIRE c.name IS UNIQUE;

CREATE CONSTRAINT brand_name IF NOT EXISTS
  FOR (b:Brand) REQUIRE b.name IS UNIQUE;

CREATE CONSTRAINT supplier_name IF NOT EXISTS
  FOR (s:Supplier) REQUIRE s.name IS UNIQUE;

// Create indexes
CREATE INDEX product_sku IF NOT EXISTS
  FOR (p:Product) ON (p.sku);

CREATE INDEX product_name IF NOT EXISTS
  FOR (p:Product) ON (p.name);

// Seed sample taxonomy (industrial categories)
MERGE (c1:Category {name: "Valves"})
  SET c1.code = "40151500", c1.description = "Industrial valves for fluid control";

MERGE (c2:Category {name: "Pumps"})
  SET c2.code = "40151501", c2.description = "Industrial pumps for fluid transfer";

MERGE (c3:Category {name: "Motors"})
  SET c3.code = "26101600", c3.description = "Electric motors and drives";

MERGE (c4:Category {name: "Sensors"})
  SET c4.code = "41111900", c4.description = "Industrial sensors and transducers";

MERGE (c5:Category {name: "Bearings"})
  SET c5.code = "31171500", c5.description = "Ball and roller bearings";

MERGE (c6:Category {name: "Fasteners"})
  SET c6.code = "31160000", c6.description = "Screws, bolts, nuts, and washers";

MERGE (c7:Category {name: "Seals & Gaskets"})
  SET c7.code = "40151502", c7.description = "Mechanical seals and gaskets";

MERGE (c8:Category {name: "Hoses & Fittings"})
  SET c8.code = "40142000", c8.description = "Industrial hoses and pipe fittings";

// Create category hierarchy
MERGE (c1)-[:HAS_SUBCATEGORY]->(sub1:Category {name: "Ball Valves"});
MERGE (c1)-[:HAS_SUBCATEGORY]->(sub2:Category {name: "Butterfly Valves"});
MERGE (c1)-[:HAS_SUBCATEGORY]->(sub3:Category {name: "Gate Valves"});

MERGE (c2)-[:HAS_SUBCATEGORY]->(sub4:Category {name: "Centrifugal Pumps"});
MERGE (c2)-[:HAS_SUBCATEGORY]->(sub5:Category {name: "Positive Displacement Pumps"});

// Create relationship type constraints documentation
// COMPATIBLE_WITH: Products that work together
// REPLACES: Product substitution relationships  
// ACCESSORY_FOR: Add-on products
// BUNDLE_WITH: Products frequently sold together
// VARIANT_OF: Different versions of same product
