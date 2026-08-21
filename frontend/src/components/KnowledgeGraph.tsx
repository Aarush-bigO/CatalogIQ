import { useState } from 'react'
import {
  Network,
  Cpu,
  Layers,
  FileText,
  Package,
  ShieldCheck,
  Sparkles,
  Database,
  Search,
  Boxes,
} from 'lucide-react'

interface GraphNode {
  id: string
  label: string
  type: 'product' | 'category' | 'spec' | 'document' | 'brand'
  details?: string
  confidence?: number
}

interface GraphLink {
  source: string
  target: string
  relation: string
}

export default function KnowledgeGraph() {
  const [activeTab, setActiveTab] = useState<'graph' | 'architecture' | 'schema'>('graph')
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  // Sample nodes generated from catalog
  const nodes: GraphNode[] = [
    // Categories
    { id: 'cat-bearings', label: 'Bearings & Bushings', type: 'category', details: 'Industrial precision rotational components' },
    { id: 'cat-hydraulics', label: 'Hydraulics & Fluid Power', type: 'category', details: 'High-pressure directional valves and cylinders' },
    { id: 'cat-motors', label: 'Electric Motors & Drives', type: 'category', details: '3-phase AC induction motors & VFD inverters' },
    { id: 'cat-robotics', label: 'Robotics & Automation', type: 'category', details: 'Cobots, 6-axis arms and CNC motion controllers' },

    // Brands
    { id: 'brand-skf', label: 'SKF Group', type: 'brand', details: 'Global leader in bearing design and manufacturing' },
    { id: 'brand-parker', label: 'Parker Hannifin', type: 'brand', details: 'Motion and control technologies' },
    { id: 'brand-siemens', label: 'Siemens AG', type: 'brand', details: 'Industrial automation and drive technologies' },
    { id: 'brand-fanuc', label: 'FANUC Robotics', type: 'brand', details: 'Factory automation & collaborative robots' },

    // Products
    { id: 'p-1', label: 'SKF 7210 BEP Angular Contact', type: 'product', details: '50×90×20 mm, 40° contact angle, 11000 RPM', confidence: 96 },
    { id: 'p-2', label: 'Parker D1VW020BNJW Valve', type: 'product', details: 'Solenoid directional control, NG6, 350 bar', confidence: 91 },
    { id: 'p-3', label: 'Siemens 1LE1 15 kW Motor', type: 'product', details: 'IE3 Premium Efficiency, 1465 RPM, IP55', confidence: 93 },
    { id: 'p-4', label: 'FANUC CRX-10iA/L Cobot', type: 'product', details: '10 kg payload, 1418 mm reach, ISO 10218-1', confidence: 98 },

    // Specs
    { id: 'spec-1', label: 'Dynamic Load: 35.1 kN', type: 'spec', details: 'Extracted via BrahMos AI' },
    { id: 'spec-2', label: 'Max Pressure: 350 bar', type: 'spec', details: 'Validated by Human Reviewer' },
    { id: 'spec-3', label: 'Protection: IP55 / IC411', type: 'spec', details: 'Adheres to IEC 60034-5 standard' },
    { id: 'spec-4', label: 'Safety: ISO/TS 15066', type: 'spec', details: 'Collaborative robot force limit compliance' },

    // Documents
    { id: 'doc-1', label: 'SKF_Bearings_Master_Catalog.pdf', type: 'document', details: '342 pages, OCR & VLM extracted' },
    { id: 'doc-2', label: 'Parker_Hydraulics_D1VW.pdf', type: 'document', details: '12 pages technical datasheet' },
    { id: 'doc-3', label: 'Siemens_SIMOTICS_GP.pdf', type: 'document', details: '86 pages product brochure' },
    { id: 'doc-4', label: 'FANUC_CRX_Safety_Assessment.pdf', type: 'document', details: '78 pages compliance report' },
  ]

  const links: GraphLink[] = [
    { source: 'brand-skf', target: 'p-1', relation: 'MANUFACTURED_BY' },
    { source: 'p-1', target: 'cat-bearings', relation: 'BELONGS_TO' },
    { source: 'p-1', target: 'spec-1', relation: 'HAS_SPEC' },
    { source: 'p-1', target: 'doc-1', relation: 'EXTRACTED_FROM' },

    { source: 'brand-parker', target: 'p-2', relation: 'MANUFACTURED_BY' },
    { source: 'p-2', target: 'cat-hydraulics', relation: 'BELONGS_TO' },
    { source: 'p-2', target: 'spec-2', relation: 'HAS_SPEC' },
    { source: 'p-2', target: 'doc-2', relation: 'EXTRACTED_FROM' },

    { source: 'brand-siemens', target: 'p-3', relation: 'MANUFACTURED_BY' },
    { source: 'p-3', target: 'cat-motors', relation: 'BELONGS_TO' },
    { source: 'p-3', target: 'spec-3', relation: 'HAS_SPEC' },
    { source: 'p-3', target: 'doc-3', relation: 'EXTRACTED_FROM' },

    { source: 'brand-fanuc', target: 'p-4', relation: 'MANUFACTURED_BY' },
    { source: 'p-4', target: 'cat-robotics', relation: 'BELONGS_TO' },
    { source: 'p-4', target: 'spec-4', relation: 'HAS_SPEC' },
    { source: 'p-4', target: 'doc-4', relation: 'EXTRACTED_FROM' },
  ]

  const typeStyles: Record<string, { badgeClass: string; icon: any }> = {
    product: { badgeClass: 'badge-iris', icon: Package },
    category: { badgeClass: 'badge-slate', icon: Layers },
    spec: { badgeClass: 'badge-iris', icon: Cpu },
    document: { badgeClass: 'badge-slate', icon: FileText },
    brand: { badgeClass: 'badge-slate', icon: Boxes },
  }

  const filteredNodes = nodes.filter((n) => {
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || (n.details || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || n.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="panel-elevated p-7 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-full text-xs font-mono font-bold border border-zinc-200 dark:border-white/20">
              <Network className="w-3.5 h-3.5" />
              <span>ONTOLOGY & ARCHITECTURE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Product Intelligence Knowledge Graph
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Explore interconnected ontology graphs mapping SKUs, technical parameters, manufacturers, source datasheets, and BrahMos AI enrichment paths.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'graph'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Entity Graph
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'architecture'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              System Architecture
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'schema'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm'
                  : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
            >
              Cypher & Schema
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Views */}
      {activeTab === 'graph' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search graph nodes, attributes, or SKUs..."
                className="input-precision pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {['all', 'product', 'category', 'spec', 'document', 'brand'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                    filterType === t
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-black font-bold shadow-sm'
                      : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/80'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Graph Canvas / Bento Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Node Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredNodes.map((node) => {
                  const style = typeStyles[node.type] || typeStyles.product
                  const Icon = style.icon
                  const isSelected = selectedNode?.id === node.id

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`panel-precision-interactive p-5 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-zinc-950 bg-zinc-100/80 dark:border-white dark:bg-[#18181B] ring-1 ring-zinc-950/20 dark:ring-white/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={style.badgeClass}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{node.type}</span>
                        </span>
                        {node.confidence && (
                          <span className="badge-iris text-xs font-mono font-bold">
                            {node.confidence}% AI Conf
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-zinc-950 dark:text-white text-sm mt-3 line-clamp-1">{node.label}</h4>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">{node.details}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Node Inspector Drawer */}
            <div className="lg:col-span-1">
              <div className="panel-precision p-5 sticky top-20 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
                  <h3 className="font-bold text-zinc-950 dark:text-white text-sm flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-zinc-950 dark:text-white" />
                    <span>Entity Inspector</span>
                  </h3>
                  {selectedNode && (
                    <span className="text-xs font-mono text-zinc-400">
                      ID: {selectedNode.id}
                    </span>
                  )}
                </div>

                {selectedNode ? (
                  <div className="space-y-4 text-sm">
                    <div className="p-4 bg-zinc-50 dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-white/[0.06] space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Entity Label</p>
                      <p className="text-sm font-bold text-zinc-950 dark:text-white">{selectedNode.label}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{selectedNode.details}</p>
                    </div>

                    {/* Linked Relations */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                        Connected Graph Edges
                      </p>
                      <div className="space-y-2">
                        {links
                          .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                          .map((l, i) => {
                            const isOutgoing = l.source === selectedNode.id
                            const otherId = isOutgoing ? l.target : l.source
                            const otherNode = nodes.find((n) => n.id === otherId)
                            return (
                              <div
                                key={i}
                                className="p-3 bg-zinc-50 dark:bg-[#121215] rounded-lg border border-zinc-200/80 dark:border-white/[0.04] text-xs flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-mono text-zinc-950 dark:text-white text-xs block font-bold">
                                    {l.relation}
                                  </span>
                                  <span className="text-zinc-600 dark:text-zinc-300 text-xs">
                                    {otherNode?.label || otherId}
                                  </span>
                                </div>
                                <span className="text-xs font-mono px-2 py-0.5 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded font-semibold text-zinc-700 dark:text-zinc-400">
                                  {isOutgoing ? '➔ Out' : '⬅ In'}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-zinc-500">
                    <Network className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                    <p className="text-xs text-zinc-500">Click any node to inspect ontology relationships</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Architecture Showcase */}
      {activeTab === 'architecture' && (
        <div className="space-y-5">
          <div className="panel-precision p-6 sm:p-7 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white">CatalogIQ Architecture Pipeline</h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Standalone SQLite & Async FastAPI Gateway integrated with BrahMos AI Engine.
              </p>
            </div>

            {/* Architecture Pipeline Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl space-y-2">
                <div className="p-2 bg-zinc-200/80 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg w-fit">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white text-sm">1. Ingestion & OCR</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Ingests PDF spec sheets, technical drawings, Excel matrices, and image cut sheets via OCR & VLM.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl space-y-2">
                <div className="p-2 bg-zinc-200/80 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg w-fit">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white text-sm">2. BrahMos AI Reasoning</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Autonomous multi-tier cascade and zero-shot deduction of technical attributes.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl space-y-2">
                <div className="p-2 bg-zinc-200/80 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg w-fit">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white text-sm">3. HITL Verification</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Side-by-side Before/After diff cards with confidence scores and domain expert approval.
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06] rounded-xl space-y-2">
                <div className="p-2 bg-zinc-200/80 dark:bg-white/10 text-zinc-900 dark:text-white rounded-lg w-fit">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-zinc-950 dark:text-white text-sm">4. Semantic RAG</h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Async SQLite (SQLAlchemy 2.0) with hybrid vector cosine similarity and explainable rationale.
                </p>
              </div>
            </div>

            {/* Architecture Code Diagram */}
            <div className="p-4 bg-zinc-900 dark:bg-[#09090B] rounded-xl border border-zinc-800 dark:border-white/[0.06] font-mono text-xs text-zinc-200 overflow-x-auto">
              <pre className="leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────────────────────┐
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
│  │ Products │ │Documents │ │  Search  │ │Enrichment│ │Validation│ │ BrahMos  │  │
│  │  Router  │ │  Router  │ │  Router  │ │  Router  │ │  Router  │ │ AI Chat  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
┌─────────────────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│         BRAHMOS AI ENGINE       │  │ DATABASE & STORAGE │  │   RAG SEARCH     │
│ ┌─────────────────────────────┐ │  │ ┌────────────────┐ │  │ ┌──────────────┐ │
│ │ Multi-Tier Cascade Fallback │ │  │ │ Async SQLite   │ │  │ │ Fuzzy & Meta │ │
│ │ Autonomous Spec Extraction  │ │  │ │ (SQLAlchemy 2) │ │  │ │ RAG Scorer   │ │
│ │ Zero-Shot Domain Reasoning  │ │  │ │ Local Files    │ │  │ │ Confidence   │ │
│ └─────────────────────────────┘ │  │ └────────────────┘ │  │ └──────────────┘ │
└─────────────────────────────────┘  └────────────────────┘  └──────────────────┘`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Cypher & Schema */}
      {activeTab === 'schema' && (
        <div className="panel-precision p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Knowledge Graph Cypher Schema</h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Declarative Neo4j / Cypher graph schema mapping industrial product attributes and relationships.
              </p>
            </div>
            <span className="badge-slate font-mono">Cypher v5.0</span>
          </div>

          <div className="p-4 bg-zinc-900 dark:bg-[#09090B] rounded-xl border border-zinc-800 dark:border-white/[0.06] font-mono text-xs text-zinc-200 overflow-x-auto">
            <pre className="leading-relaxed">
{`// Create Node Constraints & Schema Indexes
CREATE CONSTRAINT unique_product_sku IF NOT EXISTS FOR (p:Product) REQUIRE p.sku IS UNIQUE;
CREATE CONSTRAINT unique_document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE;
CREATE INDEX product_category_idx IF NOT EXISTS FOR (p:Product) ON (p.category);

// Core Entity Relationships
(:Product)-[:BELONGS_TO]->(:Category)
(:Product)-[:MANUFACTURED_BY]->(:Brand)
(:Product)-[:HAS_SPECIFICATION]->(:Specification)
(:Product)-[:EXTRACTED_FROM]->(:Document)
(:Product)-[:VALIDATED_IN]->(:ValidationQueue)
(:Product)-[:ENRICHED_BY]->(:AIEngine { model: "BrahMos AI" })`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}



