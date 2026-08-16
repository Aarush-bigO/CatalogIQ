"""Database seeder — populates the DB with realistic industrial product data for demo."""

import uuid
from datetime import datetime, timedelta
from typing import List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.models.document import SourceDocument
from app.models.enrichment import EnrichmentRun, ProductValidation


def _ago(days: int) -> datetime:
    return datetime.utcnow() - timedelta(days=days)


def _id() -> str:
    return str(uuid.uuid4())


async def seed_if_empty(db: AsyncSession) -> None:
    """Seed the database only if it's empty."""
    count = await db.execute(select(func.count()).select_from(Product))
    if count.scalar() > 0:
        return  # Already seeded

    print("🌱 Seeding database with demo data...")

    products = _build_products()
    for p in products:
        db.add(p)
    await db.flush()

    documents = _build_documents()
    for d in documents:
        db.add(d)
    await db.flush()

    enrichment_jobs = _build_enrichment_jobs(products)
    for j in enrichment_jobs:
        db.add(j)
    await db.flush()

    validation_items = _build_validation_items(products)
    for v in validation_items:
        db.add(v)

    await db.commit()
    print(f"✅ Seeded: {len(products)} products, {len(documents)} documents, "
          f"{len(enrichment_jobs)} enrichment jobs, {len(validation_items)} validation items")


def _build_products() -> List[Product]:
    """Build the 24 realistic industrial products."""
    data = [
        ("IND-BRG-7210", "SKF 7210 BEP Angular Contact Ball Bearing", "High-precision angular contact bearing for machine-tool spindles. 50×90×20 mm, single row, 40° contact angle.", "Bearings", "Angular Contact", "SKF", "SKF Group", "USD", 124.5, 78.2, {"bore_diameter": "50 mm", "outer_diameter": "90 mm", "width": "20 mm", "contact_angle": "40°"}, {"dynamic_load": "35.1 kN", "static_load": "24.0 kN", "limiting_speed": "11000 rpm"}, "published", 96, 94, 98, "SKF Master Catalog 2024", 45),
        ("IND-VLV-4032", "Parker D1VW020BNJW Directional Control Valve", "Solenoid-operated, 4-way 2-position directional control valve. NG6 / CETOP 03, 350 bar max.", "Hydraulics", "Directional Valves", "Parker Hannifin", "Parker Hannifin Corp.", "USD", 489.0, 312.0, {"size": "NG6", "max_pressure": "350 bar", "flow_rate": "60 L/min"}, {"mounting": "Subplate", "response_time": "35 ms"}, "validated", 91, 89, 94, "Parker Industrial Hydraulics", 38),
        ("IND-MTR-5520", "Siemens 1LE1 Series 3-Phase Induction Motor, 15 kW", "IE3 premium efficiency motor, B3 foot mount, 1465 rpm, IP55 / IC411, frame 160M.", "Electric Motors", "Induction Motors", "Siemens", "Siemens AG", "EUR", 1780.0, 1120.0, {"power": "15 kW", "speed": "1465 rpm", "frame": "160M"}, {"weight": "95 kg", "protection": "IP55"}, "published", 93, 92, 96, "Siemens SIMOTICS GP", 60),
        ("IND-PMP-8814", "Grundfos CR 15-3 Vertical Multistage Pump", "Stainless steel vertical multistage centrifugal pump. Flow 15 m³/h, head up to 37 m, 3 kW.", "Pumps", "Centrifugal Pumps", "Grundfos", "Grundfos Holding A/S", "USD", 3250.0, 2100.0, {"flow_rate": "15 m³/h", "head": "37 m", "motor_power": "3 kW"}, {"inlet": "DN 50", "outlet": "DN 50", "max_temperature": "120°C"}, "published", 89, 87, 92, "Grundfos Product Center", 30),
        ("IND-SEN-2201", "Sick WTB27-3P2461 Proximity Sensor", "Photoelectric proximity sensor, background suppression, PNP, range 30-200 mm, M12 connector.", "Sensors", "Photoelectric", "SICK", "SICK AG", "EUR", 215.0, 142.0, {"sensing_range": "30-200 mm", "output": "PNP", "connection": "M12"}, {"response_time": "1 ms", "protection": "IP67"}, "enriching", 72, 68, 75, "SICK Product Finder", 12),
        ("IND-GRB-1100", "Festo DSBC-63-200-PPVA-N3 Pneumatic Cylinder", "ISO 15552 standards-based cylinder, 63 mm bore, 200 mm stroke, cushioned both ends.", "Pneumatics", "Cylinders", "Festo", "Festo SE & Co. KG", "EUR", 342.0, 220.0, {"bore": "63 mm", "stroke": "200 mm", "operating_pressure": "1-12 bar"}, {"cushioning": "PPV", "mounting": "Foot/Flange"}, "pending_validation", 78, 74, 80, "Festo Online Shop", 8),
        ("IND-CNC-9901", "Mitsubishi M80 CNC Control Unit", "High-performance CNC controller for machining centers. 4-axis simultaneous control, 15\" touchscreen HMI.", "CNC Controls", "Controllers", "Mitsubishi Electric", "Mitsubishi Electric Corp.", "USD", 28500.0, 19200.0, {"axes": "4-axis", "display": "15\" TFT", "memory": "2 GB"}, {"communication": "Ethernet/PROFINET", "program_capacity": "1 GB"}, "published", 95, 93, 97, "Mitsubishi Factory Automation", 90),
        ("IND-FLT-3340", "Hydac 0660 R 010 BN4HC Return Line Filter", "Hydraulic return line filter element. 10 µm Beta filtration, 660 mm length, Borosilicate glass fiber.", "Filtration", "Hydraulic Filters", "HYDAC", "HYDAC International GmbH", "EUR", 186.0, 115.0, {"filtration_rating": "10 µm", "media": "BN4HC", "length": "660 mm"}, {"flow_rate": "120 L/min"}, "validated", 85, 82, 88, "HYDAC Product Catalog", 22),
        ("IND-PLM-6750", "Igus DryLin W Linear Guide Rail WS-10-40", "Self-lubricating polymer linear guide. Corrosion-free, maintenance-free, 40 mm rail width.", "Linear Motion", "Linear Guides", "igus", "igus GmbH", "EUR", 92.0, 58.0, {"rail_width": "40 mm", "material": "Hard anodized aluminum"}, {"max_load": "2500 N", "max_speed": "5 m/s"}, "draft", 45, 40, 52, None, 3),
        ("IND-GRD-0088", "ABB ACS580-01-026A-4 Variable Frequency Drive", "General-purpose VFD, 11 kW, 26 A, 3-phase 380-480 V, built-in EMC filter, Modbus/TCP.", "Drives & VFDs", "AC Drives", "ABB", "ABB Ltd", "USD", 2150.0, 1480.0, {"power": "11 kW", "current": "26 A", "voltage": "380-480 V"}, {"efficiency": "98%", "protection": "IP21"}, "published", 92, 90, 95, "ABB Product Guide", 55),
        ("IND-WLD-4411", "Lincoln Electric Power MIG 260 Welder", "MIG welding machine, 260 A output, dual-voltage input 208/230 V.", "Welding", "MIG Welders", "Lincoln Electric", "Lincoln Electric Holdings", "USD", 3480.0, 2390.0, {"output_current": "260 A", "input_voltage": "208/230 V"}, {"weight": "42 kg", "welding_wire": "0.6-1.2 mm"}, "pending_validation", 68, 62, 70, "Lincoln Electric Catalog", 15),
        ("IND-CMP-7720", "Atlas Copco GA 37+ Oil-Injected Rotary Screw Compressor", "Energy-efficient rotary screw compressor, 37 kW, FAD 106 l/s at 7.5 bar.", "Compressors", "Rotary Screw", "Atlas Copco", "Atlas Copco AB", "EUR", 18500.0, 13200.0, {"power": "37 kW", "fad": "106 l/s", "max_pressure": "13 bar"}, {"weight": "710 kg", "control": "Elektronikon Touch"}, "published", 97, 95, 99, "Atlas Copco Industrial Air", 120),
        ("IND-CTL-1580", "Allen-Bradley 1769-L33ER CompactLogix PLC", "Mid-range programmable logic controller, 2 MB memory, dual Ethernet/IP, 16 I/O modules max.", "PLCs", "Compact PLCs", "Allen-Bradley", "Rockwell Automation", "USD", 4200.0, 2950.0, {"memory": "2 MB", "io_modules": "16 max", "communication": "Ethernet/IP"}, {"scan_time": "0.04 ms/kWord", "power": "24 VDC"}, "enriching", 74, 70, 76, "Rockwell Automation Selection Guide", 18),
        ("IND-FAS-2200", "Hilti HIT-RE 500 V4 Injectable Mortar Anchor", "High-performance epoxy-based injectable mortar for heavy-duty fastenings in concrete.", "Fasteners", "Chemical Anchors", "Hilti", "Hilti Corporation", "USD", 78.5, 48.0, {"volume": "500 ml", "base_material": "Concrete / Masonry"}, {"working_temp": "-40°C to +80°C", "shelf_life": "18 months"}, "validated", 88, 85, 90, "Hilti Online", 25),
        ("IND-TLS-9340", "Sandvik Coromant CoroMill 390 Milling Cutter", "Shoulder milling cutter, 50 mm cutting diameter, 4 inserts, lightweight aluminium body.", "Cutting Tools", "Milling Cutters", "Sandvik Coromant", "Sandvik AB", "EUR", 620.0, 410.0, {"cutting_diameter": "50 mm", "inserts": "4", "arbor": "Coromant Capto C5"}, {"material": "Aluminum body", "coating": "PVD TiAlN"}, "draft", 55, 50, 60, None, 5),
        ("IND-HOS-6610", "Gates Megaflex 4SH-16 Hydraulic Hose", "Ultra-high pressure hydraulic hose, 4-wire spiral reinforcement, 1\" ID, 420 bar WP.", "Hydraulics", "Hoses & Fittings", "Gates", "Gates Corporation", "USD", 42.0, 26.0, {"inner_diameter": "1\"", "working_pressure": "420 bar"}, {"temperature_range": "-40°C to +100°C"}, "published", 87, 84, 90, "Gates Industrial Power", 40),
        ("IND-ENC-4451", "Heidenhain ROD 486 Incremental Rotary Encoder", "High-resolution incremental encoder, 18000 lines, shaft diameter 6 mm.", "Encoders", "Incremental", "HEIDENHAIN", "Dr. Johannes Heidenhain GmbH", "EUR", 890.0, 610.0, {"resolution": "18000 lines", "shaft": "6 mm", "output": "TTL 11 µApp"}, {"accuracy": "±5\"", "max_speed": "12000 rpm"}, "validated", 90, 88, 93, "HEIDENHAIN Encoders Catalog", 50),
        ("IND-SAF-7780", "Pilz PNOZ s7 Safety Relay Module", "Configurable safety relay for E-STOP and safety gate monitoring, SIL 3 / PL e.", "Safety", "Safety Relays", "Pilz", "Pilz GmbH & Co. KG", "EUR", 310.0, 198.0, {"safety_level": "SIL 3 / PL e / Cat 4", "contacts": "2 N/O + 1 N/C"}, {"supply_voltage": "24 VDC", "width": "22.5 mm"}, "published", 94, 92, 96, "Pilz Safety Solutions", 75),
        ("IND-BLT-3300", "Optibelt SUPER TX M=S 5V/15N Power V-Belt", "Heavy-duty raw edge cogged V-belt for industrial drives.", "Power Transmission", "V-Belts", "Optibelt", "Arntz Optibelt GmbH", "EUR", 34.0, 19.0, {"profile": "5V / 15N", "type": "Raw Edge Cogged"}, {"temperature_range": "-30°C to +80°C"}, "draft", 38, 32, 42, None, 2),
        ("IND-GAS-9050", "Bosch Rexroth IndraDrive Cs HCS02.1E-W0028", "Compact servo drive, 0.75 kW, single-axis, EtherCAT communication, STO safety function.", "Drives & VFDs", "Servo Drives", "Bosch Rexroth", "Bosch Rexroth AG", "EUR", 1450.0, 980.0, {"power": "0.75 kW", "communication": "EtherCAT", "safety": "STO (SIL 3)"}, {"current": "2.8 A rms", "dc_bus": "200-460 VDC"}, "enriching", 65, 60, 68, "Rexroth IndraDrive", 10),
        ("IND-TRN-4420", "Flender FLENDER ONE Helical Gear Unit, Size 6", "Premium helical gear unit, 15 kW, ratio 31.5:1, foot-mounted.", "Gearboxes", "Helical Gear Units", "Flender", "Flender GmbH (Siemens)", "EUR", 4800.0, 3250.0, {"power": "15 kW", "ratio": "31.5:1", "output_torque": "4700 Nm"}, {"efficiency": ">96%", "weight": "135 kg"}, "pending_validation", 71, 67, 73, "Flender Gear Units Catalog", 14),
        ("IND-LBR-0550", "Mobil SHC 630 Synthetic Bearing & Gear Oil", "Fully synthetic PAO-based lubricant, ISO VG 220, for bearings and enclosed gears.", "Lubricants", "Synthetic Oils", "Mobil", "ExxonMobil", "USD", 285.0, 185.0, {"viscosity_grade": "ISO VG 220", "base_oil": "PAO Synthetic"}, {"flash_point": "266°C", "density": "0.855 kg/L"}, "published", 86, 83, 89, "ExxonMobil PDS Library", 65),
        ("IND-RBT-1100", "FANUC CRX-10iA/L Collaborative Robot", "Lightweight cobot, 10 kg payload, 1418 mm reach, 6-axis, hand-guided teaching.", "Robotics", "Collaborative Robots", "FANUC", "FANUC Corporation", "USD", 42000.0, 31500.0, {"payload": "10 kg", "reach": "1418 mm", "axes": "6"}, {"weight": "40 kg", "ip_rating": "IP67 (wrist)", "max_speed": "1000 mm/s"}, "published", 98, 97, 99, "FANUC CRX Series", 100),
        ("IND-CAB-0220", "Lapp ÖLFLEX CLASSIC 110 Control Cable 7G1.5", "Flexible PVC control cable, 7 cores × 1.5 mm², numbered cores, oil-resistant.", "Cables", "Control Cables", "Lapp", "Lapp Group", "EUR", 4.2, 2.6, {"cores": "7 × 1.5 mm²", "outer_diameter": "10.5 mm"}, {"temperature_range": "-15°C to +80°C", "approval": "CE / UL / CSA"}, "validated", 82, 80, 85, "Lapp ÖLFLEX Catalog", 35),
    ]

    products = []
    for row in data:
        sku, name, desc, cat, subcat, brand, mfg, cur, lp, cp, attrs, specs, status, qs, cs, coms, src, days = row
        products.append(Product(
            id=_id(), sku=sku, name=name, description=desc,
            category=cat, subcategory=subcat, brand=brand, manufacturer=mfg,
            currency=cur, list_price=lp, cost_price=cp,
            attributes=attrs, specifications=specs,
            status=status, quality_score=qs, confidence_score=cs,
            completeness_score=coms, source_catalog=src,
            created_at=_ago(days), updated_at=_ago(max(0, days - 5)),
        ))
    return products


def _build_documents() -> List[SourceDocument]:
    data = [
        ("SKF_Bearings_Master_Catalog_2024.pdf", "pdf", "completed", 14_200_000, 342, 45),
        ("Parker_Hydraulics_D1VW_Datasheet.pdf", "pdf", "completed", 2_800_000, 12, 38),
        ("Siemens_SIMOTICS_GP_Brochure.pdf", "pdf", "completed", 8_500_000, 86, 60),
        ("grundfos_cr_pump_selection_chart.xlsx", "excel", "completed", 1_200_000, None, 30),
        ("SICK_WTB27_Specification_Sheet.pdf", "pdf", "extracting", 3_100_000, 6, 12),
        ("festo_cylinder_technical_drawing.png", "image", "ai_analyzing", 4_500_000, None, 8),
        ("Sandvik_Coromant_ToolGuide_2024.pdf", "pdf", "completed", 22_000_000, 580, 50),
        ("ABB_ACS580_Installation_Manual.pdf", "pdf", "completed", 6_700_000, 156, 55),
        ("competitor_bearing_prices_q3.csv", "csv", "completed", 380_000, None, 20),
        ("atlas_copco_ga37_nameplate.jpg", "image", "ocr_running", 2_100_000, None, 1),
        ("FANUC_CRX_Safety_Assessment.pdf", "pdf", "pending", 9_400_000, 78, 0),
        ("Lapp_OLFLEX_Data_Sheets.pdf", "pdf", "completed", 5_600_000, 64, 35),
    ]
    docs = []
    for fn, dt, st, size, pages, days in data:
        docs.append(SourceDocument(
            id=_id(), filename=fn, original_filename=fn,
            file_path=f"./uploads/{fn}", file_size_bytes=size,
            mime_type="application/pdf" if dt == "pdf" else f"application/{dt}",
            doc_type=dt, status=st, page_count=pages,
            created_at=_ago(days), updated_at=_ago(days),
        ))
    return docs


def _build_enrichment_jobs(products: List[Product]) -> List[EnrichmentRun]:
    jobs_data = [
        (4, "specifications", "running", "gpt-4o", ["sensing_range", "response_time"], {"sensing_range": 0.92, "response_time": 0.88}, 0),
        (12, "full", "running", "gpt-4o", ["programming", "io_modules"], {"programming": 0.85, "io_modules": 0.9}, 0),
        (19, "description", "running", "claude-3.5-sonnet", [], {}, 0),
        (0, "full", "completed", "gpt-4o", ["description", "specifications", "attributes", "category"], {"description": 0.96, "specifications": 0.94, "attributes": 0.93, "category": 0.99}, 3),
        (1, "specifications", "completed", "gpt-4o", ["flow_rate", "response_time", "mounting"], {"flow_rate": 0.91, "response_time": 0.87, "mounting": 0.95}, 5),
        (2, "cross_reference", "completed", "claude-3.5-sonnet", ["compatible_drives", "replacement_models"], {"compatible_drives": 0.88, "replacement_models": 0.82}, 7),
        (3, "pricing", "completed", "gpt-4-turbo", ["list_price", "market_price_range"], {"list_price": 0.78, "market_price_range": 0.72}, 8),
        (8, "full", "queued", "gpt-4o", [], {}, None),
        (14, "description", "queued", "gpt-4o", [], {}, None),
        (18, "attributes", "queued", "claude-3.5-sonnet", [], {}, None),
        (7, "full", "completed", "gpt-4o", ["description", "specifications", "category"], {"description": 0.93, "specifications": 0.89, "category": 0.97}, 10),
        (10, "specifications", "failed", "gpt-4-turbo", [], {}, 2),
        (5, "cross_reference", "completed", "gpt-4o", ["compatible_accessories", "mounting_options"], {"compatible_accessories": 0.91, "mounting_options": 0.86}, 4),
        (9, "full", "completed", "gpt-4o", ["description", "specifications", "attributes", "pricing"], {"description": 0.95, "specifications": 0.92, "attributes": 0.94, "pricing": 0.8}, 12),
        (20, "description", "partial", "claude-3.5-sonnet", ["description"], {"description": 0.76}, 1),
    ]
    jobs = []
    for pi, etype, st, model, fields, conf, days in jobs_data:
        jobs.append(EnrichmentRun(
            id=_id(), product_id=products[pi].id,
            enrichment_type=etype, status=st, ai_model=model,
            fields_enriched=fields, confidence_scores=conf,
            started_at=_ago(days) if days is not None else None,
            completed_at=_ago(days) if days is not None and st in ("completed", "failed", "partial") else None,
            created_at=_ago(days if days is not None else 0),
        ))
    return jobs


def _build_validation_items(products: List[Product]) -> List[ProductValidation]:
    items_data = [
        (5, "Description", "description", None, "ISO 15552 double-acting pneumatic cylinder with 63 mm bore diameter and 200 mm stroke. Features adjustable pneumatic cushioning (PPV) on both ends.", 0.91, "Generated from technical drawing OCR + cross-referenced with Festo online catalog.", 1, 0),
        (10, "Duty Cycle", "specifications.duty_cycle", "40% at 260A", "60% at 200A / 40% at 260A / 100% at 160A", 0.87, "Enriched from Lincoln Electric product page — original value was partial.", 2, 0),
        (4, "IP Rating", "specifications.protection", "IP67", "IP67 / IP69K", 0.83, "SICK WTB27 product page lists dual IP ratings for different housing variants.", 2, 1),
        (20, "Category", "category", "Gearboxes", "Power Transmission > Helical Gear Units", 0.95, "Hierarchical category assignment based on product taxonomy analysis.", 3, 1),
        (8, "Max Load Capacity", "specifications.max_load", "2500 N", "2800 N (horizontal) / 1200 N (vertical)", 0.79, "igus DryLin docs specify orientation-dependent load ratings.", 3, 2),
        (12, "Firmware Version", "specifications.firmware", None, "v32.011 (Logix Designer compatible)", 0.72, "Extracted from Rockwell Automation firmware compatibility matrix.", 4, 2),
        (14, "Insert Grade", "attributes.insert_grade", None, "GC 1130 (first choice for steel P materials)", 0.88, "Sandvik ToolGuide recommends GC 1130 for CoroMill 390.", 2, 3),
        (19, "EtherCAT Cycle Time", "specifications.cycle_time", None, "250 µs (minimum)", 0.86, "Bosch Rexroth IndraDrive Cs specs list minimum 250 µs cycle time.", 3, 1),
        (15, "Burst Pressure", "attributes.burst_pressure", "1680 bar", "1680 bar (per EN 856 4SH)", 0.94, "Added standard reference for burst pressure rating.", 4, 4),
        (22, "Safety Standard", "specifications.safety", None, "ISO 10218-1:2011 / ISO/TS 15066:2016", 0.97, "FANUC CRX-10iA/L is certified compliant with ISO 10218-1 and ISO/TS 15066.", 1, 0),
    ]
    items = []
    for pi, fname, fpath, old, new, conf, reasoning, priority, days in items_data:
        items.append(ProductValidation(
            id=_id(), product_id=products[pi].id,
            field_name=fname, field_path=fpath,
            old_value=old, proposed_value=new,
            ai_confidence=conf, ai_reasoning=reasoning,
            status="pending", priority=priority,
            created_at=_ago(days),
        ))
    return items
