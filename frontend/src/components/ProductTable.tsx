import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts, useDeleteProduct, useEnrichProduct } from '../hooks/useProducts'
import {
  Search,
  Filter,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Loader2,
  CheckCircle2,
  Eye,
  X,
  Layers,
  Cpu,
  FileText,
  DollarSign,
  Tag,
} from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'badge-gray',
  enriching: 'badge-blue',
  pending_validation: 'badge-yellow',
  validated: 'badge-green',
  rejected: 'badge-red',
  published: 'badge-green',
}

function QualityBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="badge-gray">N/A</span>
  if (score >= 90) return <span className="badge-green">{score.toFixed(0)}</span>
  if (score >= 70) return <span className="badge-blue">{score.toFixed(0)}</span>
  if (score >= 50) return <span className="badge-yellow">{score.toFixed(0)}</span>
  return <span className="badge-red">{score.toFixed(0)}</span>
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-green-800 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <Link to="/validation" className="text-blue-600 hover:underline font-medium text-xs ml-4">
            View in Validation Queue →
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products by name, SKU, brand..."
            className="input pl-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="input w-40"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="enriching">Enriching</option>
          <option value="pending_validation">Pending Validation</option>
          <option value="validated">Validated</option>
          <option value="published">Published</option>
        </select>
        <input
          type="text"
          placeholder="Filter by Category"
          className="input w-48"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">SKU</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Name</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Category</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Quality</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.items.map((product) => {
              const isItemEnriching = enrichingId === product.id
              return (
                <tr
                  key={product.id}
                  className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  onClick={() => setSelectedProduct(product)}
                >
                  <td className="py-3 text-sm font-medium text-gray-900 font-mono">{product.sku}</td>
                  <td className="py-3 text-sm text-gray-800 max-w-xs font-medium truncate">
                    {product.name}
                  </td>
                  <td className="py-3 text-sm text-gray-500">{product.category || '-'}</td>
                  <td className="py-3">
                    <span className={statusColors[product.status] || 'badge-gray'}>
                      {product.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3">
                    <QualityBadge score={product.quality_score} />
                  </td>
                  <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                        title="View Full Details"
                        onClick={() => setSelectedProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className={`p-1.5 rounded-lg transition-colors ${
                          isItemEnriching
                            ? 'bg-blue-100 text-blue-700 cursor-wait'
                            : 'hover:bg-blue-50 text-blue-600'
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
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
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
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  No products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} products
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary p-2"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {data.pages}
            </span>
            <button
              className="btn-secondary p-2"
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                    {selectedProduct.sku}
                  </span>
                  <span className={statusColors[selectedProduct.status] || 'badge-gray'}>
                    {selectedProduct.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedProduct.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Brand: <span className="font-semibold text-gray-700">{selectedProduct.brand || 'N/A'}</span> ·
                  Category: <span className="font-semibold text-gray-700">{selectedProduct.category || 'N/A'}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quality & Price Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Quality Score</p>
                <p className="text-lg font-bold text-green-600 mt-0.5">
                  {selectedProduct.quality_score ? `${selectedProduct.quality_score.toFixed(0)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Completeness</p>
                <p className="text-lg font-bold text-blue-600 mt-0.5">
                  {selectedProduct.completeness_score ? `${selectedProduct.completeness_score.toFixed(0)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">List Price</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedProduct.list_price ? `$${selectedProduct.list_price.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Currency</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">
                  {selectedProduct.currency || 'USD'}
                </p>
              </div>
            </div>

            {/* Technical Description */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-gray-500" />
                Technical Overview & Description
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                {selectedProduct.description || 'No description available.'}
              </p>
            </div>

            {/* Specifications */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-blue-500" />
                Engineering Specifications
              </h4>
              {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-blue-50/40 p-3 rounded-lg border border-blue-100">
                  {Object.entries(selectedProduct.specifications).map(([key, val]) => (
                    <div key={key} className="text-xs flex justify-between p-2 bg-white rounded border border-blue-50">
                      <span className="font-semibold text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-mono text-blue-900 font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No specifications extracted yet.</p>
              )}
            </div>

            {/* Physical Attributes */}
            <div>
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-500" />
                Physical Attributes & Standards
              </h4>
              {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-purple-50/40 p-3 rounded-lg border border-purple-100">
                  {Object.entries(selectedProduct.attributes).map(([key, val]) => (
                    <div key={key} className="text-xs flex justify-between p-2 bg-white rounded border border-purple-50">
                      <span className="font-semibold text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-purple-950 font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No physical attributes available.</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                className="btn-secondary py-2 px-4 text-xs"
                onClick={() => setSelectedProduct(null)}
              >
                Close
              </button>
              <button
                className="btn-primary py-2 px-4 text-xs bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                onClick={() => {
                  handleEnrich(selectedProduct)
                  setSelectedProduct(null)
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Re-enrich with Gemini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
