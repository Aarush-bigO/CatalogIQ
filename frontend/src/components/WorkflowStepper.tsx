import { Link, useLocation } from 'react-router-dom'
import {
  FileText,
  Sparkles,
  ClipboardCheck,
  Search,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

const steps = [
  {
    step: 1,
    id: 'ingest',
    title: '1. Ingest & OCR',
    subtitle: 'Upload PDF / CAD Spec Sheets',
    path: '/documents',
    icon: FileText,
    badge: 'OCR & VLM',
  },
  {
    step: 2,
    id: 'enrich',
    title: '2. BrahMos AI Enrichment',
    subtitle: 'Autonomous Spec Extraction',
    path: '/enrichment',
    icon: Sparkles,
    badge: 'BrahMos AI',
  },
  {
    step: 3,
    id: 'validate',
    title: '3. HITL Validation',
    subtitle: 'Verify Before / After Diffs',
    path: '/validation',
    icon: ClipboardCheck,
    badge: 'Human-in-the-Loop',
  },
  {
    step: 4,
    id: 'catalog',
    title: '4. Live Catalog & RAG',
    subtitle: 'Semantic Search & Export',
    path: '/search',
    icon: Search,
    badge: 'Production RAG',
  },
]

export default function WorkflowStepper() {
  const location = useLocation()
  const currentPath = location.pathname

  const getCurrentStepIndex = () => {
    if (currentPath === '/documents') return 0
    if (currentPath === '/enrichment') return 1
    if (currentPath === '/validation') return 2
    if (currentPath === '/products' || currentPath === '/search' || currentPath === '/graph') return 3
    return -1
  }

  const activeIndex = getCurrentStepIndex()

  return (
    <div className="panel-precision p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
            Autonomous Ingestion Pipeline
          </h3>
        </div>
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Guided 4-Stage Lifecycle · Interactive Navigation
        </span>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {steps.map((s, idx) => {
          const Icon = s.icon
          const isCurrent = currentPath === s.path || (s.id === 'catalog' && (currentPath === '/products' || currentPath === '/search'))
          const isCompleted = activeIndex !== -1 && idx < activeIndex

          return (
            <Link
              key={s.id}
              to={s.path}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-start gap-3.5 group relative ${
                isCurrent
                  ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white shadow-sm ring-1 ring-zinc-950 dark:ring-white'
                  : isCompleted
                  ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40 text-zinc-900 dark:text-zinc-200 hover:border-emerald-400'
                  : 'bg-zinc-50 dark:bg-[#121215] border-zinc-200/80 dark:border-white/[0.06] hover:border-zinc-300 dark:hover:border-white/20 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border flex-shrink-0 transition-colors ${
                  isCurrent
                    ? 'bg-zinc-900 text-white border-zinc-800 dark:bg-zinc-100 dark:text-black dark:border-zinc-200'
                    : isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50'
                    : 'bg-white text-zinc-600 border-zinc-200 dark:bg-[#18181B] dark:text-zinc-300 dark:border-white/10 group-hover:text-zinc-950 dark:group-hover:text-white'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isCurrent
                        ? 'text-zinc-300 dark:text-zinc-700'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {s.badge}
                  </span>
                  {idx < steps.length - 1 && (
                    <ArrowRight
                      className={`w-3.5 h-3.5 hidden lg:block ${
                        isCurrent ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-300 dark:text-zinc-600'
                      }`}
                    />
                  )}
                </div>
                <p
                  className={`text-sm font-bold mt-1 truncate ${
                    isCurrent
                      ? 'text-white dark:text-black'
                      : 'text-zinc-950 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-200'
                  }`}
                >
                  {s.title}
                </p>
                <p
                  className={`text-xs truncate mt-0.5 ${
                    isCurrent ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {s.subtitle}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}


