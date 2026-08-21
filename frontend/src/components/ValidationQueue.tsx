import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api/client'
import type { ValidationItem } from '../types'
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  X,
  ShieldCheck,
  Bot,
  ArrowRight,
} from 'lucide-react'

const priorityBadges: Record<number, { text: string; className: string }> = {
  1: { text: 'P1 · Critical', className: 'badge-iris' },
  2: { text: 'P2 · High', className: 'badge-slate' },
  3: { text: 'P3 · Medium', className: 'badge-slate' },
  4: { text: 'P4 · Low', className: 'badge-slate' },
  5: { text: 'P5 · Info', className: 'badge-slate' },
}

export default function ValidationQueue() {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: queue, isLoading } = useQuery({
    queryKey: ['validation-queue'],
    queryFn: async () => {
      const { data } = await api.get<{ items: ValidationItem[] }>('/validation/queue', {
        params: { page: 1, page_size: 50, status: 'pending' },
      })
      return data
    },
    refetchInterval: 5000,
  })

  const applyAction = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const { data } = await api.post(`/validation/${id}/action`, {
        action,
        reviewer_id: 'engineer-reviewer',
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id)
    try {
      await applyAction.mutateAsync({ id, action })
    } finally {
      setActionLoading(null)
    }
  }

  const formatProposedValue = (val: string) => {
    try {
      const parsed = JSON.parse(val)
      if (typeof parsed === 'object' && parsed !== null) {
        return (
          <div className="space-y-2 mt-1.5">
            {Object.entries(parsed).map(([k, v]) => (
              <div key={k} className="text-xs sm:text-sm flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#09090B] border border-zinc-200/80 dark:border-white/[0.05]">
                <span className="font-semibold text-zinc-500 dark:text-zinc-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                <span className="font-mono text-zinc-900 dark:text-white font-bold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
              </div>
            ))}
          </div>
        )
      }
    } catch {
      // Plain text
    }
    return <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-white dark:bg-[#09090B] p-3.5 rounded-xl border border-zinc-200/80 dark:border-white/[0.05]">{val}</p>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-zinc-950 dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Loading validation review queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Human-in-the-Loop Validation
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Verify AI-proposed engineering specifications and descriptions before publishing to live production catalogs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-iris text-xs py-1.5 px-3 flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-white animate-pulse" />
            <span>{queue?.items?.length || 0} Pending Sign-Offs</span>
          </span>
        </div>
      </div>

      {/* Cards View */}
      <div className="space-y-5">
        {queue?.items.map((item) => {
          const isExpanded = expandedId === item.id
          const pBadge = priorityBadges[item.priority] || priorityBadges[5]
          const isLoadingThis = actionLoading === item.id

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`panel-precision p-6 sm:p-7 space-y-4 transition-all duration-150 ${
                isExpanded ? 'border-zinc-400 dark:border-white/30 ring-1 ring-zinc-900/10 dark:ring-white/10' : ''
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-200/80 dark:border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <span className={pBadge.className}>
                    {pBadge.text}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-2">
                      <span>Field: {item.field_name}</span>
                      <span className="text-xs font-mono font-medium text-zinc-500">
                        ({item.field_path})
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="badge-slate text-xs font-mono flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>AI Confidence: {((item.ai_confidence || 0) * 100).toFixed(0)}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-primary py-1.5 px-3 text-xs"
                      onClick={() => handleAction(item.id, 'approve')}
                      disabled={isLoadingThis}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve</span>
                    </button>

                    <button
                      className="btn-secondary py-1.5 px-3 text-xs"
                      onClick={() => handleAction(item.id, 'reject')}
                      disabled={isLoadingThis}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                      title={isExpanded ? "Collapse" : "Expand Details"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Side-by-Side Diff Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Original Value */}
                <div className="bg-zinc-50 dark:bg-[#121215] p-4 sm:p-5 rounded-xl border border-zinc-200/80 dark:border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Current Live Database Value
                    </p>
                    <span className="text-xs font-mono text-zinc-400">Baseline</span>
                  </div>
                  {item.old_value ? (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-[#09090B] p-3 rounded-lg border border-zinc-200/60 dark:border-white/[0.04]">
                      {item.old_value}
                    </p>
                  ) : (
                    <div className="bg-white dark:bg-[#09090B] p-3.5 rounded-lg border border-dashed border-zinc-300 dark:border-white/10 text-center">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 italic font-mono">
                        [EMPTY / UNSET ATTRIBUTE]
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: BrahMos AI Proposed Value */}
                <div className="bg-zinc-50 dark:bg-[#121215] p-4 sm:p-5 rounded-xl border border-zinc-300 dark:border-white/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-zinc-950 dark:text-white" />
                      BrahMos AI Proposed Value
                    </p>
                    <span className="badge-iris text-xs">
                      AI Proposed Diff
                    </span>
                  </div>
                  <div className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed max-h-96 overflow-y-auto">
                    {formatProposedValue(item.proposed_value)}
                  </div>
                </div>
              </div>

              {/* AI Reasoning Footer Rationale */}
              {item.ai_reasoning && (
                <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-[#121215] p-4 rounded-xl border border-zinc-200/80 dark:border-white/[0.08]">
                  <Bot className="w-5 h-5 text-zinc-950 dark:text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-zinc-950 dark:text-white block text-xs uppercase tracking-wider">
                      AI Reasoning & Inference Rationale:
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-1 block">{item.ai_reasoning}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}

        {(!queue?.items || queue.items.length === 0) && (
          <div className="panel-precision py-16 text-center text-zinc-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white flex items-center justify-center mx-auto border border-zinc-200 dark:border-white/10 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">HITL Review Queue is All Clear</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              All AI-proposed engineering specifications have been reviewed. Trigger new enrichments from the Product Catalog or upload new spec sheets.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link to="/products" className="btn-secondary">
                View Products
              </Link>
              <Link to="/documents" className="btn-primary">
                <span>Ingest Spec</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}




