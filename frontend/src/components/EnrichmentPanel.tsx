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
} from 'lucide-react'

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  queued: { icon: Clock, color: 'text-gray-500', label: 'Queued' },
  running: { icon: Loader2, color: 'text-blue-600', label: 'Running' },
  completed: { icon: CheckCircle2, color: 'text-green-600', label: 'Completed' },
  failed: { icon: AlertCircle, color: 'text-red-600', label: 'Failed' },
  partial: { icon: AlertCircle, color: 'text-yellow-600', label: 'Partial' },
}

export default function EnrichmentPanel() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data: jobs, isLoading, refetch } = useQuery({
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Enrichment</h1>
          <p className="text-gray-500 mt-1">Monitor and manage AI-powered product data enrichment</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'queued', 'running', 'completed', 'failed'].map((status) => (
          <button
            key={status || 'all'}
            onClick={() => { setFilter(status); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Jobs table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Type</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Product ID</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Status</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Model</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Fields</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Started</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs?.items.map((job) => {
              const config = statusConfig[job.status] || statusConfig.queued
              const Icon = config.icon
              return (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="py-3">
                    <span className="badge-blue capitalize">{job.enrichment_type}</span>
                  </td>
                  <td className="py-3 text-sm text-gray-600 font-mono">{job.product_id.slice(0, 8)}...</td>
                  <td className="py-3">
                    <div className={`flex items-center gap-1.5 ${config.color}`}>
                      <Icon className={`w-4 h-4 ${job.status === 'running' ? 'animate-spin' : ''}`} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{job.ai_model}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {(job.fields_enriched || []).map((field) => (
                        <span key={field} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {field}
                        </span>
                      ))}
                      {(!job.fields_enriched || job.fields_enriched.length === 0) && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {job.started_at
                      ? new Date(job.started_at).toLocaleString()
                      : 'Not started'}
                  </td>
                </tr>
              )
            })}
            {jobs?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  No enrichment jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
