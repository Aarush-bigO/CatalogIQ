import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
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

const statusConfig: Record<string, { icon: React.ElementType; badgeClass: string; label: string }> = {
  queued: { icon: Clock, badgeClass: 'badge-iris', label: 'Queued' },
  running: { icon: Loader2, badgeClass: 'badge-iris animate-pulse', label: 'Running' },
  completed: { icon: CheckCircle2, badgeClass: 'badge-sage', label: 'Completed' },
  failed: { icon: AlertCircle, badgeClass: 'badge-coral', label: 'Failed' },
  partial: { icon: AlertCircle, badgeClass: 'badge-amber', label: 'Partial' },
}

export default function EnrichmentPanel() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data: jobs, isLoading, isFetching, refetch } = useQuery({
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
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            AI Enrichment Stream & Jobs
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time execution telemetry of BrahMos AI zero-shot attribute inference jobs.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Refresh Jobs</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'queued', 'running', 'completed', 'failed'].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => { setFilter(status); setPage(1) }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              filter === status
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-black shadow-sm font-bold'
                : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/80'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All Jobs'}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="panel-precision p-0 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-[#09090B] text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th className="py-3.5 px-4">Enrichment Type</th>
              <th className="py-3.5 px-4">Target SKU / Product ID</th>
              <th className="py-3.5 px-4">Execution Status</th>
              <th className="py-3.5 px-4">AI Engine</th>
              <th className="py-3.5 px-4">Inferred Parameters</th>
              <th className="py-3.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.05]">
            {jobs?.items.map((job) => {
              const config = statusConfig[job.status] || statusConfig.queued
              const Icon = config.icon
              return (
                <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="badge-slate capitalize">{job.enrichment_type}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-white">
                    {job.product_id.slice(0, 12)}...
                  </td>
                  <td className="py-3.5 px-4">
                    <div className={config.badgeClass}>
                      <Icon className={`w-3.5 h-3.5 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                      <span>{config.label}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-zinc-200 text-xs font-mono border border-zinc-200 dark:border-white/5">
                      <Zap className="w-3.5 h-3.5 text-zinc-950 dark:text-white" />
                      {job.ai_model ? 'BrahMos AI' : 'BrahMos AI'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {(job.fields_enriched || []).map((field) => (
                        <span key={field} className="text-xs bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/[0.05]">
                          {field}
                        </span>
                      ))}
                      {(!job.fields_enriched || job.fields_enriched.length === 0) && (
                        <span className="text-xs text-zinc-400 italic">Deducing specifications...</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                    {job.started_at
                      ? new Date(job.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Pending'}
                  </td>
                </tr>
              )
            })}
            {jobs?.items.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-zinc-500">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                  <p className="font-bold text-zinc-700 dark:text-zinc-300 text-base">No AI enrichment jobs found</p>
                  <p className="text-xs text-zinc-500 mt-1">Trigger enrichments from the Product Catalog to populate this stream</p>
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-16 text-center text-zinc-500">
                  <div className="w-8 h-8 border-3 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-zinc-400">Loading AI jobs stream...</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}



