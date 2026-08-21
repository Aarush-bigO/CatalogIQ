import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'
import { useTheme } from '../context/ThemeContext'
import type { ValidationItem } from '../types'
import {
  LayoutDashboard,
  Package,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Network,
  Bot,
  Menu,
  X,
  Zap,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react'


export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const { data: valQueue } = useQuery({
    queryKey: ['validation-queue-badge'],
    queryFn: async () => {
      try {
        const { data } = await api.get<{ items: ValidationItem[] }>('/validation/queue', {
          params: { page: 1, page_size: 50, status: 'pending' },
        })
        return data
      } catch {
        return { items: [] }
      }
    },
    refetchInterval: 5000,
  })

  const pendingCount = valQueue?.items?.length || 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 flex relative font-sans antialiased transition-colors duration-150">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen w-72 bg-white dark:bg-[#09090B] border-r border-zinc-200 dark:border-white/[0.08] flex flex-col z-50 transition-all duration-200 ease-out shadow-lg lg:shadow-none lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                  CatalogIQ
                </span>
                <span className="text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-white/[0.08] text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Product Intelligence</p>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Telemetry */}
        <div className="px-3.5 py-2.5 mx-4 mt-4 rounded-xl bg-zinc-100/80 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-white animate-pulse" />
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">BrahMos AI Engine</span>
            </div>
            <span className="text-[10px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-white/[0.08] px-2 py-0.5 rounded border border-zinc-200 dark:border-white/10 shadow-2xs">
              Live
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
            Autonomous multi-tier industrial intelligence
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Core Tools */}
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Main Platform
            </p>
            {[
              { path: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
              { path: '/products', label: 'Product Catalog', icon: Package, badge: null },
              { path: '/documents', label: 'Ingest Specs', icon: FileText, badge: null },
              { path: '/validation', label: 'Validation Queue', icon: ShieldCheck, badge: pendingCount },
              { path: '/chat', label: 'BrahMos Assistant', icon: Bot, badge: null },
            ].map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                    isActive
                      ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-white/[0.12] border border-zinc-200 dark:border-white/15 shadow-xs font-semibold'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/60 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge && item.badge > 0 ? (
                      <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black">
                        {item.badge}
                      </span>
                    ) : null}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-zinc-400 dark:text-zinc-400" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Secondary Tools */}
          <div className="space-y-1 pt-2 border-t border-zinc-200/60 dark:border-white/[0.06]">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Advanced Tools
            </p>
            {[
              { path: '/search', label: 'Semantic RAG Search', icon: Search },
              { path: '/enrichment', label: 'AI Inference Jobs', icon: Sparkles },
              { path: '/graph', label: 'Knowledge Graph', icon: Network },
            ].map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? 'text-zinc-950 dark:text-white bg-zinc-100 dark:bg-white/[0.12] border border-zinc-200 dark:border-white/15 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100/60 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-zinc-950 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Theme Mode Switcher in Sidebar */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-[#09090B]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Appearance</span>
            <span className="text-[11px] font-mono text-zinc-400 capitalize">{theme} mode</span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-zinc-200/70 dark:bg-[#18181B] p-1 rounded-lg border border-zinc-200 dark:border-white/10">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                theme === 'light'
                  ? 'bg-white text-zinc-950 shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
              title="Light theme"
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
              title="Dark theme"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                theme === 'system'
                  ? 'bg-white dark:bg-white dark:text-black text-zinc-950 shadow-sm font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
              }`}
              title="Sync with system preference"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Auto</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 z-10">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-zinc-200/80 dark:border-white/[0.08] px-4 sm:px-8 flex items-center justify-between transition-colors duration-150">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">CatalogIQ</span>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-200 capitalize">
                {location.pathname.replace('/', '').replace(/-/g, ' ') || 'Executive Dashboard'}
              </span>
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/search"
              className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200/80 dark:bg-[#121215] dark:hover:bg-[#18181B] border border-zinc-200 dark:border-white/[0.08] text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-2xs"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span>Search SKUs, specs...</span>
              <kbd className="px-2 py-0.5 bg-white dark:bg-white/10 text-zinc-500 dark:text-zinc-400 rounded text-xs font-mono border border-zinc-200 dark:border-transparent">⌘K</kbd>
            </Link>

            {/* Topbar Theme Quick Toggle */}
            <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-[#121215] border border-zinc-200 dark:border-white/[0.08]">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
                title={`Current: ${theme} mode. Click to toggle.`}
              >
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            <Link
              to="/documents"
              className="btn-primary py-2 px-4 text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Ingest Spec</span>
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto space-y-7">
          {children}
        </main>
      </div>
    </div>
  )
}




