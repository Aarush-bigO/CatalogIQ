import { useDashboardStats } from '../hooks/useProducts'
import {
  Package,
  FileText,
  Sparkles,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

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
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
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
    <div className="card">
      <h3 className="text-base font-bold text-gray-900 mb-4">Catalog Quality Index</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([label, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="capitalize font-medium text-gray-600">{label}</span>
                <span className="font-semibold text-gray-900">{count} ({pct.toFixed(1)}%)</span>
              </div>
              <div className="quality-bar">
                <div
                  className={`quality-fill ${colors[label] || 'bg-gray-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
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
    <div className="card">
      <h3 className="text-base font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2.5">
        {Object.entries(data).map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <StatusDot status={status} />
              <span className="capitalize font-medium text-gray-700">{status.replace(/_/g, ' ')}</span>
            </div>
            <span className="font-semibold text-gray-900">{count}</span>
          </div>
        ))}
        <div className="pt-2.5 border-t border-gray-100 flex justify-between text-xs">
          <span className="font-medium text-gray-500">Total</span>
          <span className="font-bold text-gray-900">{total}</span>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    published: 'bg-green-500',
    validated: 'bg-green-500',
    completed: 'bg-green-500',
    draft: 'bg-gray-400',
    enriching: 'bg-blue-500',
    pending_validation: 'bg-yellow-500',
    rejected: 'bg-red-500',
    failed: 'bg-red-500',
    pending: 'bg-yellow-500',
    queued: 'bg-blue-400',
    running: 'bg-blue-500',
  }
  return <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!stats) return <div>Error loading dashboard</div>

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-100 border border-white/20">
            <Zap className="w-3.5 h-3.5 text-yellow-300" />
            <span>Autonomous Industrial Product Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to CatalogIQ
          </h1>
          <p className="text-sm text-blue-100 leading-relaxed">
            Automating engineering spec extraction, Gemini AI enrichment, and human-in-the-loop catalog verification across {productStats?.total ?? 0} industrial parts.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/documents"
            className="px-4 py-2.5 bg-white text-blue-900 rounded-xl font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Upload Document
          </Link>
          <Link
            to="/validation"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-green-300" />
            Validation Queue ({stats.validation.pending_reviews})
          </Link>
        </div>
      </div>

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
        <h3 className="text-base font-bold text-gray-900 mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/products"
            className="p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-200 transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600">Product Catalog</p>
              <p className="text-xs text-gray-500">View specs, descriptions & quality</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </Link>
          <Link
            to="/search"
            className="p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-200 transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600">Intelligent Search</p>
              <p className="text-xs text-gray-500">Semantic RAG industrial part search</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </Link>
          <Link
            to="/enrichment"
            className="p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-gray-200 transition-colors flex items-center justify-between group"
          >
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600">AI Enrichment Stream</p>
              <p className="text-xs text-gray-500">Monitor live Gemini generation jobs</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
          </Link>
        </div>
      </div>
    </div>
  )
}
