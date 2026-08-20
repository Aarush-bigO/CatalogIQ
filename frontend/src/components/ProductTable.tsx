import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProducts, useDeleteProduct, useEnrichProduct } from '../hooks/useProducts'
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
} from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'px-2 py-1 text-xs font-semibold rounded-md bg-gray-500/20 text-gray-300 border border-gray-500/30',
  enriching: 'px-2 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.4)]',
  pending_validation: 'px-2 py-1 text-xs font-semibold rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 shadow-[0_0_8px_rgba(234,179,8,0.4)]',
  validated: 'px-2 py-1 text-xs font-semibold rounded-md bg-green-500/20 text-green-300 border border-green-500/30 shadow-[0_0_8px_rgba(34,197,94,0.4)]',
  rejected: 'px-2 py-1 text-xs font-semibold rounded-md bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
  published: 'px-2 py-1 text-xs font-semibold rounded-md bg-primary-500/20 text-primary-300 border border-primary-500/30 shadow-[0_0_8px_rgba(0,240,255,0.4)]',
}

function QualityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="px-2 py-1 text-xs font-bold rounded-md bg-gray-500/20 text-gray-400">N/A</span>
  if (score >= 90) return <span className="px-2 py-1 text-xs font-bold rounded-md bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">{score.toFixed(0)}</span>
  if (score >= 70) return <span className="px-2 py-1 text-xs font-bold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">{score.toFixed(0)}</span>
  if (score >= 50) return <span className="px-2 py-1 text-xs font-bold rounded-md bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">{score.toFixed(0)}</span>
  return <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-500/20 text-red-400 border border-red-500/30">{score.toFixed(0)}</span>
}

export default function ProductTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [enrichingId, setEnrichingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  const { data, isLoading } = useProducts({
    page,
    page_size: 20,
    search: search || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  })

  const deleteProduct = useDeleteProduct()
  const enrichProduct = useEnrichProduct()

  const handleEnrich = async (product: { id: string; name: string }) => {
    setEnrichingId(product.id)
    setSuccessMessage(null)
    try {
      await enrichProduct.mutateAsync({ id: product.id, type: 'full' })
      setSuccessMessage(`✨ Google Gemini AI successfully enriched "${product.name}"! Status updated to Pending Validation.`)
      setTimeout(() => setSuccessMessage(null), 6000)
    } catch (err: any) {
      alert(`Enrichment error: ${err.message}`)
    } finally {
      setEnrichingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-between text-green-300 text-sm shadow-[0_0_15px_rgba(34,197,94,0.15)] backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <Link to="/validation" className="text-primary-300 hover:text-primary-200 hover:underline font-bold text-xs ml-4 transition-colors">
              View in Validation Queue →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary-400 transition-colors" />
          <input
            type="text"
            placeholder="Search products by name, SKU, brand..."
            className="w-full bg-dark-800/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all shadow-inner backdrop-blur-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="w-full sm:w-48 bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all appearance-none cursor-pointer backdrop-blur-sm"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="" className="bg-dark-800">All Status</option>
          <option value="draft" className="bg-dark-800">Draft</option>
          <option value="enriching" className="bg-dark-800">Enriching</option>
          <option value="pending_validation" className="bg-dark-800">Pending Validation</option>
          <option value="validated" className="bg-dark-800">Validated</option>
          <option value="published" className="bg-dark-800">Published</option>
        </select>
        <input
          type="text"
          placeholder="Filter Category"
          className="w-full sm:w-48 bg-dark-800/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all backdrop-blur-sm"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
        />
      </div>

      <div className="card p-0 overflow-hidden border border-white/10 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">SKU</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Quality</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.items.map((product) => {
                const isItemEnriching = enrichingId === product.id
                return (
                  <tr
                    key={product.id}
                    className="hover:bg-white/5 cursor-pointer transition-colors group"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <td className="py-4 px-6 text-sm font-medium text-white/90 font-mono group-hover:text-primary-300 transition-colors">{product.sku}</td>
                    <td className="py-4 px-6 text-sm text-white/80 max-w-xs font-medium truncate">
                      {product.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-white/50">{product.category || '-'}</td>
                    <td className="py-4 px-6">
                      <span className={statusColors[product.status] || statusColors.draft}>
                        {product.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <QualityBadge score={product.quality_score} />
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                          title="View Full Details"
                          onClick={() => setSelectedProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-all ${
                            isItemEnriching
                              ? 'bg-primary-500/20 text-primary-400 cursor-wait shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                              : 'bg-white/5 hover:bg-primary-500/20 text-white/60 hover:text-primary-400 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          }`}
                          title={isItemEnriching ? "Enriching with Gemini AI..." : "Enrich with AI"}
                          onClick={() => handleEnrich(product)}
                          disabled={isItemEnriching || enrichProduct.isPending}
                        >
                          {isItemEnriching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
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
                  <td colSpan={6} className="py-16 text-center text-white/40">
                    <Package className="w-16 h-16 mx-auto mb-4 text-white/10" />
                    <p className="text-lg">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between bg-dark-800/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
          <p className="text-sm text-white/50">
            Showing <strong className="text-white/80">{(page - 1) * 20 + 1}</strong> to <strong className="text-white/80">{Math.min(page * 20, data.total)}</strong> of <strong className="text-white/80">{data.total}</strong> products
          </p>
          <div className="flex items-center gap-3">
            <button
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-white/70">
              Page {page} of {data.pages}
            </span>
            <button
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-white/5 disabled:cursor-not-allowed"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-dark-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 p-6 md:p-8 space-y-8"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold px-3 py-1 bg-white/5 text-primary-300 rounded-md border border-white/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
                      {selectedProduct.sku}
                    </span>
                    <span className={statusColors[selectedProduct.status] || statusColors.draft}>
                      {selectedProduct.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mt-4">{selectedProduct.name}</h2>
                  <p className="text-sm text-white/50 mt-1 flex items-center gap-2">
                    <span>Brand: <strong className="text-white/80 font-semibold">{selectedProduct.brand || 'N/A'}</strong></span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>Category: <strong className="text-white/80 font-semibold">{selectedProduct.category || 'N/A'}</strong></span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Quality & Price Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Quality</p>
                  <p className="text-2xl font-black text-green-400 mt-1 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                    {selectedProduct.quality_score ? `${selectedProduct.quality_score.toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Complete</p>
                  <p className="text-2xl font-black text-blue-400 mt-1 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
                    {selectedProduct.completeness_score ? `${selectedProduct.completeness_score.toFixed(0)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Price</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {selectedProduct.list_price ? `$${selectedProduct.list_price.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                  <p className="text-xs text-white/50 font-bold uppercase tracking-wider">Currency</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {selectedProduct.currency || 'USD'}
                  </p>
                </div>
              </div>

              {/* Technical Description */}
              <div>
                <h4 className="text-sm font-bold uppercase text-white/70 tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-white/50" />
                  Technical Description
                </h4>
                <p className="text-sm text-white/80 leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/10 shadow-inner">
                  {selectedProduct.description || 'No description available.'}
                </p>
              </div>

              {/* Specifications */}
              <div>
                <h4 className="text-sm font-bold uppercase text-white/70 tracking-wider mb-3 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary-400" />
                  Engineering Specifications
                </h4>
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-primary-900/10 p-5 rounded-2xl border border-primary-500/20 shadow-inner">
                    {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                      <div key={key} className="text-sm flex justify-between p-3 bg-dark-800/80 rounded-xl border border-white/5">
                        <span className="font-semibold text-white/60 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="font-mono text-primary-300 font-bold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic bg-white/5 p-4 rounded-xl border border-white/5">No specifications extracted yet.</p>
                )}
              </div>

              {/* Physical Attributes */}
              <div>
                <h4 className="text-sm font-bold uppercase text-white/70 tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-400" />
                  Physical Attributes
                </h4>
                {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-900/10 p-5 rounded-2xl border border-purple-500/20 shadow-inner">
                    {Object.entries(selectedProduct.attributes).map(([key, val]) => (
                      <div key={key} className="text-sm flex justify-between p-3 bg-dark-800/80 rounded-xl border border-white/5">
                        <span className="font-semibold text-white/60 capitalize">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-purple-300 font-bold">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic bg-white/5 p-4 rounded-xl border border-white/5">No physical attributes available.</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                <button
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-all"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </button>
                <button
                  className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] flex items-center gap-2"
                  onClick={() => {
                    handleEnrich(selectedProduct)
                    setSelectedProduct(null)
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  Re-enrich with Gemini
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
