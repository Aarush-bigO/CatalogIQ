import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '../hooks/useSearch'
import { Search, Sparkles, Zap } from 'lucide-react'

const sampleQueries = [
  'angular contact ball bearing 50mm bore',
  '350 bar hydraulic solenoid directional valve',
  '15 kW IE3 premium efficiency induction motor',
  'collaborative robot 10kg payload ISO compliant',
  'high temperature nitrile rubber seals',
]

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('hybrid')
  const { data, isLoading } = useSearch(query, searchType)

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Semantic Industrial RAG Search
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Query across multi-attribute technical catalogs with explainable vector cosine & keyword match reasoning.
          </p>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="panel-precision p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by part description, dimensions (e.g. '50x90x20'), pressure rating, standards..."
              className="input-precision pl-11 py-3 text-sm font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/5"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <select
                className="input-precision py-3 text-sm font-semibold"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="hybrid">Hybrid (Vector + BM25)</option>
                <option value="semantic">Semantic (Embeddings)</option>
                <option value="keyword">Keyword (Exact Match)</option>
                <option value="graph">Graph (Ontology RAG)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Suggested Query Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Zap className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
            Try:
          </span>
          {sampleQueries.map((sample) => (
            <button
              key={sample}
              onClick={() => setQuery(sample)}
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/[0.04] hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-black border border-zinc-200 dark:border-white/[0.06] hover:border-transparent px-3 py-1 rounded-lg transition-all"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Search Results */}
        {data && query.length > 2 && (
          <div className="pt-4 border-t border-zinc-200/80 dark:border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Found <span className="text-zinc-950 dark:text-white font-bold font-mono">{data.total_results} matching items</span> in{' '}
                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{data.execution_time_ms}ms</span> via{' '}
                <span className="capitalize text-zinc-950 dark:text-white font-bold">{searchType}</span> vector index
              </p>
            </div>

            <div className="space-y-3.5">
              <AnimatePresence>
                {data.results.map((result, idx) => (
                  <motion.div
                    key={result.product_id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-5 sm:p-6 rounded-xl border border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.06] dark:hover:border-white/20 bg-zinc-50/70 dark:bg-[#121215] transition-all duration-150 group space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 bg-white dark:bg-white/10 text-zinc-900 dark:text-white rounded-md border border-zinc-200 dark:border-white/20">
                            {result.sku}
                          </span>
                          {result.category && (
                            <span className="badge-slate">{result.category}</span>
                          )}
                        </div>
                        <h4 className="font-bold text-zinc-950 dark:text-white text-base group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
                          {result.name}
                        </h4>
                      </div>

                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1.5">
                        <span className="badge-iris font-mono text-xs font-bold">
                          {(result.score * 100).toFixed(1)}% Match Score
                        </span>
                        {result.matched_field && (
                          <p className="text-xs text-zinc-500">Matched on: {result.matched_field}</p>
                        )}
                      </div>
                    </div>

                    {result.description && (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-[#09090B] p-3 rounded-lg border border-zinc-200/60 dark:border-white/[0.04]">
                        {result.description}
                      </p>
                    )}

                    {result.explanation && (
                      <div className="p-3.5 bg-white dark:bg-[#09090B] rounded-xl border border-zinc-200 dark:border-white/15 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-zinc-950 dark:text-white flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs uppercase tracking-wider text-zinc-950 dark:text-white block">
                            Vector Match Rationale:
                          </span>
                          <span className="leading-relaxed text-zinc-600 dark:text-zinc-200 mt-0.5 block">{result.explanation}</span>
                        </div>
                      </div>
                    )}

                    {result.attributes && Object.keys(result.attributes).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-2">
                        {Object.entries(result.attributes).slice(0, 6).map(([key, value]) => (
                          <span key={key} className="text-xs bg-white dark:bg-white/5 text-zinc-800 dark:text-zinc-300 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-white/[0.06]">
                            <span className="font-semibold text-zinc-500 dark:text-zinc-400">{key}:</span> {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {data.results.length === 0 && (
                <div className="py-14 text-center text-zinc-500">
                  <Search className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300 text-base">No matching products found</p>
                  <p className="text-xs text-zinc-500 mt-1">Try searching with broader engineering keywords or part numbers</p>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="pt-8 flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Computing vector semantic match scores...</p>
          </div>
        )}
      </div>
    </div>
  )
}




