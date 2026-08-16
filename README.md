# CatalogIQ ⚡

> **Autonomous Industrial Product Intelligence & Catalog Automation Engine**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.0-646CFF.svg?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.0%20Flash-4285F4.svg?style=flat&logo=google&logoColor=white)](https://aistudio.google.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20(aiosqlite)-003B57.svg?style=flat&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Executive Summary

Industrial suppliers, distributors, and manufacturers manage vast catalogs of highly technical products (bearings, motors, valves, robotics, VFDs) trapped across fragmented PDFs, spec sheets, vendor cut sheets, and legacy spreadsheets.

**CatalogIQ** is an enterprise-grade, autonomous product intelligence platform that automates the end-to-end catalog lifecycle:
1. **Document Ingestion & OCR/VLM Parsing:** Ingests unformatted PDFs, technical diagrams, Excel sheets, and images.
2. **Autonomous Gemini AI Enrichment:** Leverages Google Gemini 2.0 Flash to deduce missing engineering specifications, physical attributes, standardized taxonomy, and technical overviews.
3. **Human-in-the-Loop (HITL) Validation:** An interactive diff review queue allowing domain experts to verify or reject AI proposals before publishing.
4. **Industrial RAG & Semantic Search:** Natural language search across SKUs and engineering parameters with explainable matching rationale.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CATALOGIQ REACT FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Dashboard   │  │ Catalog Grid │  │ Doc Ingest   │  │  Validation Queue   │  │
│  │  (Analytics) │  │  (Modal Det) │  │  (Uploader)  │  │  (HITL Side-by-Side)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │  (Axios REST API / React Query)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                             FASTAPI BACKEND GATEWAY                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Products │ │Documents │ │  Search  │ │Enrichment│ │Validation│ │Analytics│  │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
┌─────────────────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│         AI ENGINE (GEMINI)      │  │ DATABASE & STORAGE │  │   RAG SEARCH     │
│ ┌─────────────────────────────┐ │  │ ┌────────────────┐ │  │ ┌──────────────┐ │
│ │ Google Gemini 2.0 / Flash   │ │  │ │ Async SQLite   │ │  │ │ Fuzzy & Meta │ │
│ │ Multi-Model Auto-Fallback   │ │  │ │ (SQLAlchemy 2) │ │  │ │ RAG Scorer   │ │
│ │ Zero-Shot Spec Extraction   │ │  │ │ Local Filesystem│ │ │ │ Confidence   │ │
│ └─────────────────────────────┘ │  │ └────────────────┘ │  │ └──────────────┘ │
└─────────────────────────────────┘  └────────────────────┘  └──────────────────┘
```

---

## ✨ Core Features & Capabilities

### 1. 🤖 Multi-Model Google Gemini AI Integration
- Powered by Google's latest **Gemini 2.0 / 3.1 Flash** models via the official `google-genai` SDK.
- Intelligent **multi-model fallback cascading** (`gemini-flash-latest` ➔ `gemini-3.1-flash-lite` ➔ `gemini-3.5-flash-lite`).
- Generates structured engineering JSON payloads (Operating temperatures, tolerances, antistatic compliance, material composition).

### 2. 📂 Intelligent Document Ingestion Pipeline
- Upload raw spec sheets (PDF, PNG, JPG, CSV, Excel, TXT).
- Automated background parser extracts key parameters, drafts SKU entries, calculates list/cost price estimates, and populates the catalog.

### 3. 🛡️ Human-in-the-Loop (HITL) Validation Queue
- Side-by-side **Before vs. Proposed Diff Cards**.
- Visual AI Confidence indicators & explicit **AI Rationale** explanations for why changes were proposed.
- One-click **Approve & Save** (directly updates live database) or **Reject**.

### 4. 🔍 Explainable Semantic RAG Search
- Natural language querying across multi-attribute industrial catalogs (e.g. `"angular contact ball bearing 120mm"`, `"raw edge cogged v-belt"`).
- Returns confidence scores, technical match highlights, and reasoning breakdowns.

### 5. 📊 Real-Time Quality & Completeness Index
- Product quality grading algorithm (0–100%) tracking missing fields, standard adherence, and enrichment depth.
- Interactive **Product Details Modal** displaying complete technical datasheets.

---

## 🚀 Quickstart Guide (Local Setup)

The platform is designed with a **Zero-Docker / Standalone SQLite architecture** for instantaneous local setup.

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- *(Optional)* **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Clone Repository
```bash
git clone https://github.com/Aarush-bigO/CatalogIQ.git
cd CatalogIQ
```

---

### Step 2: Backend Setup
```bash
cd backend

# Create & activate Python 3.11 virtual environment
python3.11 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-light.txt
pip install google-genai

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
USE_MOCK_AI=false
```

Start the FastAPI backend server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> ⚡ *Database is automatically created and seeded with 24+ industrial catalog items at `./data/product_intelligence.db` on initial startup.*

---

### Step 3: Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📡 API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/dashboard` | Aggregated catalog quality, enrichment & validation stats |
| `GET` | `/api/v1/products/` | Paginated product catalog with search & filtering |
| `GET` | `/api/v1/products/{id}` | Complete product detail with JSON specs & attributes |
| `POST` | `/api/v1/products/{id}/enrich` | Trigger live Google Gemini AI enrichment on product |
| `POST` | `/api/v1/documents/upload` | Upload & extract catalog items from PDF, Image, CSV |
| `GET` | `/api/v1/documents/` | List uploaded source documents and extraction statuses |
| `GET` | `/api/v1/validation/queue` | Fetch pending HITL validation diff items |
| `POST` | `/api/v1/validation/{id}/action` | Approve, Reject, or Escalate validation item |
| `POST` | `/api/v1/search/` | Semantic RAG & keyword catalog search engine |
| `GET` | `/api/v1/enrichment/jobs` | Monitor AI enrichment stream and execution history |

Interactive Swagger API Documentation is available live at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## 🗂️ Project Structure

```
CatalogIQ/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy 2.0 async models (Product, Document, Validation)
│   │   ├── routers/           # FastAPI REST API endpoints
│   │   ├── services/          # Gemini AI, Document Ingestion, RAG & Validation Engines
│   │   ├── config.py          # Centralized Pydantic application settings
│   │   ├── database.py        # Async SQLite session manager
│   │   ├── seed.py            # Automated catalog seeder
│   │   └── main.py            # FastAPI entrypoint with CORS & lifecycle management
│   ├── data/                  # SQLite database location (product_intelligence.db)
│   ├── uploads/               # Uploaded spec sheets & PDFs
│   ├── requirements-light.txt # Core backend dependencies
│   └── .env.example           # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Dashboard, ProductTable, ValidationQueue, DocumentUploader
│   │   ├── hooks/             # TanStack React Query hooks connected to FastAPI
│   │   ├── api/               # Axios client instance
│   │   ├── types/             # TypeScript domain interfaces
│   │   ├── App.tsx            # React router definitions
│   │   └── index.css          # Tailwind CSS styles
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite build configuration
│
├── .gitignore                 # Protected secrets and build artifacts
├── .env.example               # Root configuration template
└── README.md                  # Project documentation
```

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, TanStack React Query, Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Python 3.11, FastAPI, Pydantic v2, Structlog, Uvicorn.
- **AI & LLM:** Google Gemini 2.0 Flash / 3.1 Flash (`google-genai` SDK), Custom Prompt Engineering, Intelligent Multi-Model Cascade.
- **Database & Storage:** SQLAlchemy 2.0 (Async), `aiosqlite`, SQLite 3.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built for Autonomous Product Intelligence & Industrial Catalog Automation.</sub>
</div>
