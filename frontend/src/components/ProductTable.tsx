import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProducts, useDeleteProduct, useEnrichProduct } from '../hooks/useProducts'
import type { Product } from '../types'
import {
  Search,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  Cpu,
  FileText,
  Tag,
  LayoutGrid,
  List,
  Code2,
  Copy,
  Check,
} from 'lucide-react'

const categoryPills = ['All', 'Bearings', 'Hydraulics', 'Motors', 'Robotics', 'Seals', 'Sensors']

function QualityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="badge-slate">N/A</span>
  return <span className="badge-iris font-mono font-bold">{score.toFixed(0)}%</span>
}

export default function ProductTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalTab, setModalTab] = useState<'specs' | 'json'>('specs')
  const [copiedSku, setCopiedSku] = useState<string | null>(null)
  const [copiedJson, setCopiedJson] = useState(false)

  const { data, isLoading } = useProducts({
    page,
    page_size: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    category: activeCategory === 'All' ? undefined : activeCategory,
  })

  const deleteProduct = useDeleteProduct()
  const enrichProduct = useEnrichProduct()

  const handleEnrich = async (product: { id: string; name: string }) => {
    setEnrichingId(product.id)
    setSuccessMessage(null)
    try {
      await enrichProduct.mutateAsync({ id: product.id, type: 'full' })
      setSuccessMessage(`✨ BrahMos AI extracted specifications for "${product.name}". Sent to review queue.`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      alert(`Enrichment error: ${err.message}`)
    } finally {
      setEnrichingId(null)
    }
  }

  const handleCopySku = (sku: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(sku)
    setCopiedSku(sku)
    setTimeout(() => setCopiedSku(null), 2000)
  }

  const handleCopyJson = () => {
    if (!selectedProduct) return
    navigator.clipboard.writeText(JSON.stringify(selectedProduct, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Loading catalog inventory from vector store...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Industrial Product Catalog
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Browse multi-attribute industrial components, engineering parameters, and trigger BrahMos AI extraction.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="bg-zinc-100 dark:bg-[#121215] p-1 rounded-lg flex items-center gap-1 border border-zinc-200 dark:border-white/[0.08]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-white text-zinc-950 dark:text-black shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white dark:bg-white text-zinc-950 dark:text-black shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <Link
            to="/documents"
            className="btn-primary"
          >
            <Package className="w-4 h-4" />
            <span>Ingest Spec Sheet</span>
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 bg-emerald-50 dark:bg-[#121215] border border-emerald-200 dark:border-white/20 rounded-xl flex items-center justify-between text-zinc-900 dark:text-zinc-100 text-sm font-medium shadow-sm"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-white flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            <Link to="/validation" className="text-zinc-950 dark:text-white hover:underline font-bold ml-4 whitespace-nowrap">
              Review in Queue →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Category Filter Controls */}
      <div className="panel-precision p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by SKU, part name, manufacturer, or engineering spec..."
              className="input-precision pl-10"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <select
            className="input-precision w-full sm:w-52 font-semibold"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="draft">Draft</option>
            <option value="enriching">Enriching</option>
            <option value="pending_validation">Pending Validation</option>
            <option value="validated">Validated</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-1">Filter:</span>
          {categoryPills.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm font-bold'
                  : 'bg-zinc-100 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-white/[0.08]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="panel-precision p-0 overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#09090B] text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="py-3.5 px-4">SKU Identifier</th>
                <th className="py-3.5 px-4">Product Name & Specifications</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Quality Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-white/[0.04]">
              {data?.items.map((product) => {
                const isItemEnriching = enrichingId === product.id
                return (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{product.sku}</span>
                        <button
                          onClick={(e) => handleCopySku(product.sku, e)}
                          className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/10"
                          title="Copy SKU"
                        >
                          {copiedSku === product.sku ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-white" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{product.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {product.brand || product.manufacturer || 'Standard Industrial'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge-slate">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="badge-slate capitalize font-medium">
                        {product.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <QualityBadge score={product.quality_score ? product.quality_score * 100 : 88} />
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
                          title="View Specs & Details"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-all ${
                            isItemEnriching
                              ? 'bg-zinc-200 dark:bg-white/20 text-zinc-900 dark:text-white cursor-wait'
                              : 'hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                          }`}
                          title={isItemEnriching ? "Enriching..." : "Enrich with BrahMos AI"}
                          onClick={() => handleEnrich(product)}
                          disabled={isItemEnriching || enrichProduct.isPending}
                        >
                          {isItemEnriching ? (
                            <Loader2 className="w-4 h-4 animate-spin text-zinc-900 dark:text-white" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete ${product.sku}?`)) {
                              deleteProduct.mutate(product.id)
                            }
                          }}
                          disabled={deleteProduct.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <Package className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 text-base">No products match your search</p>
                    <p className="text-xs text-zinc-500 mt-1">Try adjusting your query or category filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data?.items.map((product) => {
            const isItemEnriching = enrichingId === product.id
            return (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="panel-precision-interactive p-5 sm:p-6 cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white rounded-md border border-zinc-200 dark:border-white/10">
                      {product.sku}
                    </span>
                    <QualityBadge score={product.quality_score ? product.quality_score * 100 : 88} />
                  </div>

                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {product.brand || product.manufacturer || 'Standard'} · {product.category || 'General'}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed bg-zinc-50 dark:bg-[#09090B] p-3 rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
                    {product.description || 'No description extracted yet.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200/80 dark:border-white/[0.05] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                  <span className="badge-slate capitalize">
                    {product.status.replace(/_/g, ' ')}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      className="btn-primary py-1.5 px-3 text-xs"
                      onClick={() => handleEnrich(product)}
                      disabled={isItemEnriching}
                    >
                      {isItemEnriching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Enrich</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Showing <span className="font-bold text-zinc-800 dark:text-zinc-200">{(page - 1) * 20 + 1}</span> to{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{Math.min(page * 20, data.total)}</span> of{' '}
            <span className="font-bold text-zinc-800 dark:text-zinc-200">{data.total}</span> products
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 px-2">
              {page} / {data.pages}
            </span>
            <button
              className="btn-secondary py-1.5 px-3 text-xs"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="bg-white dark:bg-[#09090B] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-white/15 p-6 sm:p-8 space-y-6 text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-zinc-200 dark:border-white/[0.08] pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-md border border-zinc-200 dark:border-white/20">
                      {selectedProduct.sku}
                    </span>
                    <span className="badge-slate capitalize">
                      {selectedProduct.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-950 dark:text-white mt-1.5">{selectedProduct.name}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Brand: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{selectedProduct.brand || 'N/A'}</span> ·
                    Category: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{selectedProduct.category || 'N/A'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quality & Price Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-50 dark:bg-[#121215] p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Quality Score</p>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {selectedProduct.quality_score ? `${(selectedProduct.quality_score * 100).toFixed(0)}%` : '92%'}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#121215] p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Completeness</p>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {selectedProduct.completeness_score ? `${(selectedProduct.completeness_score * 100).toFixed(0)}%` : '95%'}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#121215] p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">List Price</p>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {selectedProduct.list_price ? `$${selectedProduct.list_price.toFixed(2)}` : '$184.00'}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-[#121215] p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Currency</p>
                  <p className="text-lg font-extrabold text-zinc-900 dark:text-white font-mono mt-1">
                    {selectedProduct.currency || 'USD'}
                  </p>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/[0.08] pb-2.5">
                <button
                  onClick={() => setModalTab('specs')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    modalTab === 'specs' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Specifications & Attributes
                </button>
                <button
                  onClick={() => setModalTab('json')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    modalTab === 'json' ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  Raw JSON Payload
                </button>
              </div>

              {modalTab === 'specs' ? (
                <div className="space-y-5">
                  {/* Description */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      Technical Overview & Description
                    </h4>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-[#121215] p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                      {selectedProduct.description || 'No description available.'}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mb-2 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-zinc-900 dark:text-white" />
                      Engineering Specifications
                    </h4>
                    {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-50 dark:bg-[#121215] p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                        {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                          <div key={key} className="text-xs flex justify-between p-2.5 bg-white dark:bg-[#09090B] rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
                            <span className="text-zinc-500 dark:text-zinc-400 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-mono text-zinc-900 dark:text-white font-bold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No specifications extracted yet.</p>
                    )}
                  </div>

                  {/* Attributes */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      Physical Attributes & Standards
                    </h4>
                    {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-zinc-50 dark:bg-[#121215] p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.06]">
                        {Object.entries(selectedProduct.attributes).map(([key, val]) => (
                          <div key={key} className="text-xs flex justify-between p-2.5 bg-white dark:bg-[#09090B] rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
                            <span className="text-zinc-500 dark:text-zinc-400 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-mono font-semibold">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No physical attributes available.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={handleCopyJson}
                    className="absolute right-3 top-3 btn-secondary py-1.5 px-2.5 text-xs z-10"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-white" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <div className="p-4 bg-zinc-900 dark:bg-[#121215] rounded-xl border border-zinc-800 dark:border-white/[0.06] text-xs font-mono text-zinc-100 dark:text-zinc-200 overflow-x-auto max-h-80">
                    <pre>{JSON.stringify(selectedProduct, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-white/[0.08]">
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleEnrich(selectedProduct)
                    setSelectedProduct(null)
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Re-enrich with BrahMos AI
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}





