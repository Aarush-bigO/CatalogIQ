import { useState } from 'react'
import { useSearch } from '../hooks/useSearch'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('hybrid')
  const { data, isLoading } = useSearch(query, searchType)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Catalog</h1>
        <p className="text-gray-500 mt-1">Semantic, keyword, and hybrid search across products</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, SKUs, specifications..."
              className="input pl-11 py-3 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select
              className="input w-36"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="hybrid">Hybrid</option>
              <option value="semantic">Semantic</option>
              <option value="keyword">Keyword</option>
              <option value="graph">Graph</option>
            </select>
          </div>
        </div>

        {data && query.length > 2 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {data.total_results} results in {data.execution_time_ms}ms
              </p>
            </div>

            <div className="space-y-3">
              {data.results.map((result) => (
                <div
                  key={result.product_id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{result.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">SKU: {result.sku}</p>
                      {result.category && (
                        <span className="badge-blue mt-2">{result.category}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-blue-600">
                        {(result.score * 100).toFixed(1)}% match
                      </span>
                      <p className="text-xs text-gray-400 mt-0.5">{result.matched_field}</p>
                    </div>
                  </div>
                  {result.explanation && (
                    <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
                  )}
                  {result.attributes && Object.keys(result.attributes).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(result.attributes).slice(0, 5).map(([key, value]) => (
                        <span key={key} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        )}
      </div>
    </div>
  )
}
