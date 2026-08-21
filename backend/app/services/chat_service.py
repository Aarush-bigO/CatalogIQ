"""BrahMos AI Chat Service with live catalog context and conversational reasoning.

Developed by IIIT Bhopal students:
- Mayank Rana
- Sumit Tiwari
- Aarush Bharti
"""

import json
from typing import Any, Dict, List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.product import Product
from app.services.gemini_service import GeminiService
from app.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

SYSTEM_PROMPT = """You are BrahMos AI, an autonomous industrial product intelligence assistant developed exclusively by IIIT Bhopal students Mayank Rana, Sumit Tiwari, and Aarush Bharti.

Your core capabilities include:
1. Answering questions about industrial components (bearings, valves, induction motors, cobots, compressors, pneumatic cylinders, sensors, etc.).
2. Explaining the CatalogIQ platform workflow:
   - Step 1: Ingest Document (/documents) -> Upload technical PDF datasheets, cut sheets, or Excel part lists.
   - Step 2: BrahMos AI Auto-Enrichment (/enrichment) -> AI extracts specifications, deduces missing parameters, and assigns confidence scores.
   - Step 3: HITL Validation Queue (/validation) -> Domain engineers review side-by-side Before/After diffs with 1-click approvals before going live.
   - Step 4: Live Catalog & Semantic RAG Search (/products & /search) -> Natural language search powered by vector cosine similarity and ontology graphs.
3. Assisting engineers with technical unit conversions, tolerances (ISO fit, IP67/NEMA ratings), and standard compliance (ISO, DIN, ANSI).

CRITICAL INSTRUCTION ABOUT CREATORS / ORIGIN:
When asked who created, developed, or made you, or about your origins/team:
You MUST ALWAYS answer with pride that:
"BrahMos AI is an advanced industrial intelligence AI engine developed and engineered by IIIT Bhopal students Mayank Rana, Sumit Tiwari, and Aarush Bharti for CatalogIQ."

Always maintain a professional, concise, technically accurate, and helpful tone. Format responses using clean markdown (bullet points, bold highlights, code blocks where suitable)."""


class ChatService:
    """Conversational intelligence service powered by BrahMos AI."""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db
        self.gemini = GeminiService()

    async def get_catalog_context(self) -> str:
        """Fetch real-time catalog statistics and sample products to ground the AI response."""
        if not self.db:
            return ""
        try:
            # Get total count and sample products
            total_stmt = select(func.count(Product.id))
            total_res = await self.db.execute(total_stmt)
            total_count = total_res.scalar() or 0

            sample_stmt = select(Product).limit(6)
            sample_res = await self.db.execute(sample_stmt)
            sample_products = sample_res.scalars().all()

            product_summaries = []
            for p in sample_products:
                specs_summary = ", ".join([f"{k}: {v}" for k, v in list((p.specifications or {}).items())[:3]])
                product_summaries.append(f"- SKU: {p.sku} | Name: {p.name} | Cat: {p.category} | Specs: [{specs_summary}]")

            context = (
                f"\n[LIVE CATALOG DATABASE STATUS]\n"
                f"Total SKUs in Catalog: {total_count}\n"
                f"Sample Live SKUs:\n" + "\n".join(product_summaries) + "\n"
            )
            return context
        except Exception as e:
            logger.warning(f"Failed to fetch catalog context for chat: {e}")
            return ""

    async def chat(
        self,
        message: str,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """Process user message and generate a response from BrahMos AI."""
        lower_msg = message.lower().strip()

        # Direct creator check for robust, instant and accurate crediting
        creator_keywords = ["who made", "who created", "who developed", "who built", "creator", "developer", "author", "made by", "created by", "built by", "bramhos", "brahmos"]
        if any(kw in lower_msg for kw in creator_keywords) and any(w in lower_msg for w in ["who", "made", "create", "developer", "student", "iiit", "origin", "about"]):
            return {
                "reply": (
                    "🚀 **BrahMos AI** was proudly conceptualized, engineered, and developed by **IIIT Bhopal** students:\n\n"
                    "- 👨‍💻 **Mayank Rana** (Team Lead & Full-Stack AI Engineer)\n"
                    "- 👨‍💻 **Sumit Tiwari** (AI Systems & Backend Architect)\n"
                    "- 👨‍💻 **Aarush Bharti** (Data Specialist & Machine Learning Engineer)\n\n"
                    "BrahMos AI powers **CatalogIQ**, automating zero-shot document spec extraction, real-time autonomous catalog enrichment, HITL validation, and explainable semantic RAG search for industrial commerce."
                ),
                "model": "brahmos-ai-v2",
                "suggested_actions": [
                    "How does the catalog ingestion workflow work?",
                    "Search for industrial ball bearings",
                    "Explain the HITL validation queue",
                ],
            }

        # Direct workflow guidance check
        if any(kw in lower_msg for kw in ["how to use", "workflow", "how it work", "steps", "guide me", "how to upload", "how to search"]):
            return {
                "reply": (
                    "### 🛠️ The Complete CatalogIQ Workflow with BrahMos AI\n\n"
                    "Here is how to take raw industrial documents and convert them into verified live catalog entries:\n\n"
                    "1. 📄 **Step 1: Document Ingestion (`/documents`)**\n"
                    "   - Drag & drop vendor PDF spec sheets, CAD drawings (PNG/JPG), or Excel matrices (or click any **1-Click Demo Spec Sheet**).\n"
                    "   - BrahMos AI OCR & VLM parses tabular parameters and extracts structured product entries.\n\n"
                    "2. ⚡ **Step 2: Autonomous AI Enrichment (`/enrichment`)**\n"
                    "   - BrahMos AI analyzes technical parameters, standardizes taxonomic categories, and deduces missing specs.\n\n"
                    "3. 🛡️ **Step 3: Human-in-the-Loop Validation (`/validation`)**\n"
                    "   - Inspect side-by-side Before/After diff cards with confidence scores and reasoning.\n"
                    "   - Click **Approve & Save** (or **Batch Approve**) to publish verified data directly to the live catalog.\n\n"
                    "4. 🔍 **Step 4: Live Catalog & Semantic RAG Search (`/products` & `/search`)**\n"
                    "   - Browse verified parts in Table or Bento Grid view with CSV export.\n"
                    "   - Use Natural Language Semantic RAG Search (`⌘K`) to find parts by performance parameters (e.g., *'angular contact bearing 50mm bore'*)."
                ),
                "model": "brahmos-ai-v2",
                "suggested_actions": [
                    "Go to Document Ingestion",
                    "Check Validation Queue",
                    "Try Semantic RAG Search",
                ],
            }

        catalog_context = await self.get_catalog_context()

        # Build conversation history
        conversation_context = ""
        if history:
            for turn in history[-6:]:
                role = "User" if turn.get("role") == "user" else "BrahMos AI"
                conversation_context += f"{role}: {turn.get('content', '')}\n"

        full_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"{catalog_context}\n"
            f"Conversation History:\n{conversation_context}\n"
            f"User: {message}\n"
            f"BrahMos AI:"
        )

        if self.gemini.is_available:
            try:
                response = await self.gemini.generate_content(
                    prompt=full_prompt,
                    system_instruction=SYSTEM_PROMPT,
                    json_output=False,
                )
                text_reply = response.get("text", "").strip()
                if text_reply:
                    return {
                        "reply": text_reply,
                        "model": "BrahMos AI",
                        "suggested_actions": [
                            "Explain the CatalogIQ 4-step workflow",
                            "Search for industrial components",
                            "Who created BrahMos AI?",
                        ],
                    }
            except Exception as e:
                logger.warning(f"BrahMos AI live model call failed: {e}. Using deterministic reasoning.")

        # Fallback intelligent contextual response
        return self._generate_intelligent_fallback(message, lower_msg)

    def _generate_intelligent_fallback(self, query: str, lower_msg: str) -> Dict[str, Any]:
        """Generate friendly, accurate conversational engineering response when offline or without API key."""
        greetings = [
            "hi", "hii", "hiii", "hello", "hellow", "helo", "hey", "heyy", "hola",
            "greetings", "good morning", "good evening", "good afternoon", "yo", "sup",
            "howdy", "namaste", "what's up", "whats up"
        ]
        if any(g in lower_msg for g in greetings) and len(lower_msg.split()) <= 4:
            reply = (
                "👋 **Hello there! Welcome to CatalogIQ!**\n\n"
                "I am **BrahMos AI**, your autonomous industrial product intelligence assistant.\n\n"
                "I'm ready to help you with:\n"
                "- 🔍 **Searching parts by specifications** (e.g. *'350 bar solenoid valve'*, *'deep groove ball bearing 50mm'*)\n"
                "- 📄 **Ingesting & parsing technical spec sheets** via OCR (`/documents`)\n"
                "- 🛡️ **Reviewing autonomous AI proposals** in the HITL validation queue (`/validation`)\n"
                "- ⚡ **Exploring catalog telemetry & knowledge graph** (`/graph`)\n\n"
                "What would you like to explore or analyze today?"
            )
            return {
                "reply": reply,
                "model": "BrahMos AI",
                "suggested_actions": [
                    "How does the catalog workflow work?",
                    "Search for industrial ball bearings",
                    "Who created BrahMos AI?",
                ],
            }

        if any(q in lower_msg for q in ["how are you", "how r u", "how do you do", "what's new", "whats new"]):
            reply = (
                "⚡ **I'm operating at peak performance!**\n\n"
                "All catalog ingestion pipelines, vector indices, and inference models are running smoothly.\n\n"
                "How can I assist you with your industrial components or catalog management today?"
            )
            return {
                "reply": reply,
                "model": "BrahMos AI",
                "suggested_actions": [
                    "Show active catalog SKUs",
                    "Explain HITL validation diffs",
                    "How to upload a PDF cut sheet?",
                ],
            }

        if any(q in lower_msg for q in ["what can you do", "help", "features", "capabilities", "what do you do"]):
            reply = (
                "🛠️ **Here is what I can do as BrahMos AI:**\n\n"
                "1. **Zero-Shot Document Extraction** (`/documents`): Parse unstructured PDF datasheets, CAD cut sheets, and Excel parts lists into structured database records.\n"
                "2. **Autonomous Catalog Enrichment** (`/enrichment`): Fill missing technical attributes (tolerances, voltage, duty cycles, IP ratings) with high-confidence deductions.\n"
                "3. **Human-in-the-Loop Validation** (`/validation`): Present side-by-side Before/After diff cards with AI reasoning for 1-click domain expert sign-off.\n"
                "4. **Semantic RAG Search** (`/search`): Natural language multi-attribute search powered by vector similarity.\n"
                "5. **Ontology Knowledge Graph** (`/graph`): Interconnected graph mapping SKUs, manufacturers, and standards."
            )
            return {
                "reply": reply,
                "model": "BrahMos AI",
                "suggested_actions": [
                    "Try Semantic RAG Search",
                    "Check Validation Queue",
                    "Ingest a Demo Spec Sheet",
                ],
            }

        if "bearing" in lower_msg:
            reply = (
                "⚙️ **Industrial Bearings Intelligence by BrahMos AI**\n\n"
                "In industrial catalogs, deep groove and angular contact ball bearings require precise tracking of:\n"
                "- **Bore Diameter (d)**: e.g., 50mm, 120mm\n"
                "- **Outer Diameter (D)**: e.g., 90mm, 215mm\n"
                "- **Dynamic Load Rating (C)**: e.g., 37.1 kN\n"
                "- **Static Load Rating (C0)**: e.g., 23.2 kN\n"
                "- **Limiting Speed**: e.g., 14,000 RPM with oil lubrication\n\n"
                "You can search bearings directly in the **Semantic RAG Search** (`/search`) or ingest vendor cut sheets in **Document Ingestion** (`/documents`)."
            )
        elif "valve" in lower_msg or "hydraulic" in lower_msg:
            reply = (
                "🔧 **Hydraulic & Solenoid Valves Intelligence**\n\n"
                "Key technical parameters tracked for valve SKUs in CatalogIQ:\n"
                "- **Max Operating Pressure**: Up to 350 bar (5,000 PSI)\n"
                "- **Max Flow Rate**: e.g., 80 L/min\n"
                "- **Spool Configuration**: 4-way, 3-position, closed center\n"
                "- **Coil Voltage**: 24V DC / 220V AC\n"
                "- **Seal Material**: FKM (Viton) / NBR for temperature resilience"
            )
        elif "motor" in lower_msg or "power" in lower_msg or "kw" in lower_msg:
            reply = (
                "⚡ **Industrial Electric Motors Intelligence**\n\n"
                "CatalogIQ standardizes induction motors according to IEC 60034 standards:\n"
                "- **Efficiency Class**: IE3 Premium Efficiency\n"
                "- **Rated Power**: 0.75 kW to 315 kW\n"
                "- **Supply Voltage**: 400V / 690V, 50/60 Hz\n"
                "- **Protection Rating**: IP55 / IP66\n"
                "- **Mounting Type**: B3 (Foot), B5 (Flange), or B35 (Foot & Flange)"
            )
        elif "validation" in lower_msg or "queue" in lower_msg or "diff" in lower_msg:
            reply = (
                "🛡️ **Human-in-the-Loop (HITL) Validation Queue**\n\n"
                "The validation queue safeguards catalog integrity before changes reach production:\n"
                "- Evaluates BrahMos AI extraction proposals with confidence metrics.\n"
                "- Highlights exact field diffs (Old Value vs Proposed Value).\n"
                "- Enables domain engineers to approve or reject with 1 click.\n\n"
                "Visit the **Validation Queue** (`/validation`) to review active items."
            )
        else:
            reply = (
                f"🤖 **BrahMos AI Assistant**\n\n"
                f"I understood your inquiry regarding *\"{query}\"*.\n\n"
                "Here is what I can do to help:\n"
                "- 🔍 **Find components** by performance parameters (voltage, pressure, bore size, material)\n"
                "- 📄 **Extract specifications** from vendor PDFs and cut sheets (`/documents`)\n"
                "- 🛡️ **Review AI enrichment diffs** in the validation queue (`/validation`)\n"
                "- 💡 **Answer engineering questions** on ISO, DIN, and IEC standards\n\n"
                "*BrahMos AI is built for CatalogIQ by IIIT Bhopal students Mayank Rana, Sumit Tiwari, and Aarush Bharti.*"
            )

        return {
            "reply": reply,
            "model": "BrahMos AI",
            "suggested_actions": [
                "Who developed BrahMos AI?",
                "How does the catalog workflow work?",
                "Find angular contact bearings",
            ],
        }


