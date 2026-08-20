import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import type { EnrichmentJob } from '../types'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Zap,
} from 'lucide-react'

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  queued: { icon: Clock, color: 'text-gray-400 drop-shadow-[0_0_5px_currentColor]', label: 'Queued' },
  running: { icon: Loader2, color: 'text-primary-400 drop-shadow-[0_0_8px_currentColor]', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-green-400 drop-shadow-[0_0_8px_currentColor]', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-400 drop-shadow-[0_0_8px_currentColor]', label: 'Failed' },
  partial: { icon: AlertCircle, color: 'text-yellow-400 drop-shadow-[0_0_8px_currentColor]', label: 'Partial' },
}

export default function EnrichmentPanel() {
  const [page, _setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data: jobs, isLoading: _isLoading, refetch } = useQuery({
    queryKey: ['enrichment-jobs', page, filter],
    queryFn: async () => {
      const { data } = await api.get<{ items: EnrichmentJob[] }>('/enrichment/jobs', {
        params: { page, page_size: 20, status: filter || undefined },
      })
      return data
    },
    refetchInterval: 5000,
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-300 to-purple-400 drop-shadow-sm flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            AI Enrichment Stream
          </h1>
          <p className="text-white/60 mt-2 font-medium">Monitor and manage automated Gemini AI product generation</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Force Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['', 'queued', 'running', 'completed', 'failed'].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => { setFilter(status); _setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === status
                ? 'bg-primary-600 text-white shadow-[0_0_15px_rgba(0,240,255,0.3)] border border-primary-500/50'
                : 'bg-dark-800/80 text-white/60 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Jobs'}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="card p-0 overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10">
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Type</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Product ID</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Model</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Fields Enriched</th>
                <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {jobs?.items.map((job, idx) => {
                  const config = statusConfig[job.status] || statusConfig.queued
                  const Icon = config.icon
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={job.id}
                      className="hover:bg-white/5 group transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)] capitalize inline-flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          {job.enrichment_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-white/70 font-mono font-bold">{job.product_id.slice(0, 8)}...</td>
                      <td className="py-4 px-6">
                        <div className={`flex items-center gap-2 font-bold ${config.color}`}>
                          <Icon className={`w-4 h-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-sm">{config.label}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-white/60">
                          {job.ai_model}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-2">
                          {(job.fields_enriched || []).map((field) => (
                            <span key={field} className="text-xs font-bold bg-dark-800 border border-white/5 text-white/50 px-2 py-0.5 rounded shadow-inner">
                              {field}
                            </span>
                          ))}
                          {(!job.fields_enriched || job.fields_enriched.length === 0) && (
                            <span className="text-xs text-white/30 italic">Processing...</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-white/50">
                        {job.started_at
                          ? new Date(job.started_at).toLocaleString()
                          : 'Pending'}
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
              {jobs?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-white/40">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 text-white/10" />
                    <p className="text-lg font-bold">No enrichment jobs found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
