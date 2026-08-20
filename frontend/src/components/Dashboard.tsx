import { useDashboardStats } from '../hooks/useProducts'
import {
  Package,
  FileText,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  subtext?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="card flex-col justify-center relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
      <div className="flex items-start justify-between z-10 relative">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">{title}</p>
          <p className="text-3xl font-extrabold text-white mt-2 drop-shadow-md">{value}</p>
          {subtext && <p className="text-xs text-white/40 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg shadow-black/20 ring-1 ring-white/10`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

function QualityDistribution({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const colors: Record<string, string> = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    average: 'bg-yellow-500',
    poor: 'bg-red-500',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="card"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-400" />
        Catalog Quality Index
      </h3>
      <div className="space-y-4">
        {Object.entries(data).map(([label, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize font-medium text-white/70">{label}</span>
                <span className="font-semibold text-white/90">{count} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full ${colors[label] || 'bg-gray-400'} shadow-[0_0_10px_currentColor]`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

function StatusBreakdown({
  title,
  data,
}: {
  title: string
  data: Record<string, number>
}) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)

  return (
    <motion.div whileHover={{ scale: 1.01 }} className="card">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <StatusDot status={status} />
              <span className="capitalize font-medium text-white/70">{status.replace(/_/g, ' ')}</span>
            </div>
            <span className="font-semibold text-white/90 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{count}</span>
          </div>
        ))}
        <div className="pt-3 mt-3 border-t border-white/10 flex justify-between text-sm">
          <span className="font-medium text-white/50">Total</span>
          <span className="font-bold text-white">{total}</span>
        </div>
      </div>
    </motion.div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    validated: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    completed: 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]',
    draft: 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.6)]',
    enriching: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
    pending_validation: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
    rejected: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]',
    failed: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]',
    pending: 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]',
    queued: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]',
    running: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]',
  }
  return <div className={`w-2.5 h-2.5 rounded-full ${colors[status] || 'bg-gray-400'}`} />
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats()

  const productStats = useMemo(() => {
    if (!stats) return null
    return {
      total: stats.products.total_products,
      avgQuality: stats.products.avg_quality_score,
      pending: stats.validation.pending_reviews,
      docTotal: stats.documents.total,
    }
  }, [stats])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
      </div>
    )
  }

  if (!stats) return <div className="text-white">Error loading dashboard</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Hero Welcome Banner */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-900/80 via-dark-800/80 to-purple-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 text-white shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px]" />

        <div className="space-y-4 max-w-2xl relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-xs font-semibold text-primary-200 border border-primary-500/30 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          >
            <Zap className="w-4 h-4 text-primary-400" />
            <span>Autonomous Industrial Product Intelligence</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-200 to-purple-300 drop-shadow-sm">
            Welcome to CatalogIQ
          </h1>
          <p className="text-base text-white/70 leading-relaxed font-light">
            Automating engineering spec extraction, Gemini AI enrichment, and human-in-the-loop catalog verification across <strong className="text-primary-300 font-bold">{productStats?.total ?? 0}</strong> industrial parts.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 relative z-10">
          <Link
            to="/documents"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] flex items-center gap-2 hover:-translate-y-1"
          >
            <FileText className="w-5 h-5" />
            Upload Document
          </Link>
          <Link
            to="/validation"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 hover:-translate-y-1 backdrop-blur-md"
          >
            <ShieldCheck className="w-5 h-5 text-green-400" />
            Validation Queue ({stats.validation.pending_reviews})
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Catalog Products"
          value={productStats?.total ?? 0}
          icon={Package}
          color="bg-blue-600"
          subtext={`Avg Quality: ${productStats?.avgQuality ?? 0}%`}
        />
        <StatCard
          title="Ingested Documents"
          value={productStats?.docTotal ?? 0}
          icon={FileText}
          color="bg-purple-600"
          subtext="Extracted via Gemini AI"
        />
        <StatCard
          title="Pending Validation"
          value={productStats?.pending ?? 0}
          icon={ClipboardCheck}
          color="bg-amber-600"
          subtext="Requires human review"
        />
        <StatCard
          title="AI Enrichment Jobs"
          value={stats.enrichment.total_jobs}
          icon={Sparkles}
          color="bg-emerald-600"
          subtext="Gemini 2.0 Flash active"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <QualityDistribution data={stats.products.quality_distribution} />
        </div>
        <div className="lg:col-span-1">
          <StatusBreakdown title="Product Status Breakdown" data={stats.products.status_breakdown} />
        </div>
        <div className="lg:col-span-1">
          <StatusBreakdown title="Document Ingestion Status" data={stats.documents.status_breakdown} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Quick Navigation
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/products"
            className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex items-center justify-between group hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <div>
              <p className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">Product Catalog</p>
              <p className="text-xs text-white/50 mt-1">View specs, descriptions & quality</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-primary-400 transition-colors" />
          </Link>
          <Link
            to="/search"
            className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex items-center justify-between group hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <div>
              <p className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">Intelligent Search</p>
              <p className="text-xs text-white/50 mt-1">Semantic RAG industrial part search</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-primary-400 transition-colors" />
          </Link>
          <Link
            to="/enrichment"
            className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all flex items-center justify-between group hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <div>
              <p className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">AI Enrichment Stream</p>
              <p className="text-xs text-white/50 mt-1">Monitor live Gemini generation jobs</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-primary-400 transition-colors" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
