import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearch } from '../hooks/useSearch'
import { Search, SlidersHorizontal, Sparkles, Zap, Box } from 'lucide-react'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('hybrid')
  const { data, isLoading } = useSearch(query, searchType)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-200 via-white to-primary-300 drop-shadow-sm">Intelligent Search</h1>
        <p className="text-white/60 font-medium max-w-xl mx-auto">Semantic, keyword, and hybrid RAG search powered by Google Gemini embeddings.</p>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        className="card relative overflow-hidden group border border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] group-hover:bg-primary-500/20 transition-colors duration-500 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group/input">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40 group-focus-within/input:text-primary-400 transition-colors drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
            <input
              type="text"
              placeholder="Search products, SKUs, engineering specifications..."
              className="w-full bg-dark-800/80 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all shadow-inner backdrop-blur-xl font-bold"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-4 bg-dark-800/80 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
              <SlidersHorizontal className="w-5 h-5 text-white/50" />
            </div>
            <select
              className="bg-dark-800/80 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all appearance-none cursor-pointer shadow-inner backdrop-blur-xl min-w-[140px]"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="hybrid" className="bg-dark-800">Hybrid Match</option>
              <option value="semantic" className="bg-dark-800">Semantic AI</option>
              <option value="keyword" className="bg-dark-800">Exact Keyword</option>
              <option value="graph" className="bg-dark-800">Knowledge Graph</option>
            </select>
          </div>
        </div>

        <AnimatePresence>
          {data && query.length > 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-white/10 relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-bold text-white/50 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  {data.total_results} matching results found in <span className="text-primary-300 font-mono">{data.execution_time_ms}ms</span>
                </p>
              </div>

              <div className="space-y-4">
                {data.results.map((result, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={result.product_id}
                    className="p-5 rounded-2xl bg-dark-800/60 border border-white/5 hover:border-primary-500/30 hover:bg-white/5 transition-all shadow-inner group/item backdrop-blur-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-white group-hover/item:text-primary-200 transition-colors flex items-center gap-2">
                          <Box className="w-5 h-5 text-purple-400 opacity-50 group-hover/item:opacity-100 transition-opacity" />
                          {result.name}
                        </h4>
                        <p className="text-sm text-white/50 mt-1 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-white/5 rounded text-primary-300 font-mono text-xs border border-white/10">SKU: {result.sku}</span>
                        </p>
                        {result.category && (
                          <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)] mt-3">
                            {result.category}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-green-400 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20 flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                          <Zap className="w-3.5 h-3.5" />
                          {(result.score * 100).toFixed(1)}% Match
                        </span>
                        <p className="text-xs font-bold text-white/40 mt-2 uppercase tracking-wider">{result.matched_field}</p>
                      </div>
                    </div>
                    {result.explanation && (
                      <p className="text-sm text-white/70 mt-4 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                        {result.explanation}
                      </p>
                    )}
                    {result.attributes && Object.keys(result.attributes).length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {Object.entries(result.attributes).slice(0, 5).map(([key, value]) => (
                          <span key={key} className="text-xs font-bold bg-dark-800 text-white/60 px-2.5 py-1 rounded-md border border-white/10">
                            <span className="text-white/40 capitalize mr-1">{key.replace(/_/g, ' ')}:</span> {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 flex items-center justify-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}
