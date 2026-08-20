import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FileText,
  Search,
  Sparkles,
  ClipboardCheck,
  Menu,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Background3D from './Background3D'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/documents', label: 'Documents', icon: FileText },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/enrichment', label: 'Enrichment', icon: Sparkles },
  { path: '/validation', label: 'Validation', icon: ClipboardCheck },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden relative">
      {/* 3D Background - absolute positioned behind everything */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Background3D />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-800/40 backdrop-blur-2xl border-r border-white/10 transform transition-transform duration-300 ease-out flex flex-col justify-between shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="z-10 relative">
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <Link to="/" className="flex items-center gap-3 group perspective-1000">
              <motion.div
                whileHover={{ rotateY: 180, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 bg-gradient-to-tr from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CatalogIQ</span>
                  <span className="px-1.5 py-0.5 bg-primary-500/20 border border-primary-500/30 text-primary-400 font-bold rounded text-[10px] uppercase tracking-wider shadow-[0_0_8px_rgba(59,130,246,0.2)]">
                    AI
                  </span>
                </div>
              </div>
            </Link>
            <button
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-2 mt-4 z-10 relative">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="block relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'text-white border border-primary-500/30 bg-primary-500/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent pointer-events-none"
                      />
                    )}
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : ''}`} />
                    <span className="relative z-10">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 z-10 relative">
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-dark-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex items-center gap-3 shadow-inner hover:border-white/10 transition-colors"
          >
            <div className="p-2 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-xl shadow-[0_0_10px_rgba(139,92,246,0.4)]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-200">Gemini 2.0 Flash</p>
              <p className="text-[10px] text-primary-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span>
                Autonomous Active
              </p>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        {/* Header */}
        <header className="h-20 bg-dark-800/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <button
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)] cursor-default"
            >
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]" />
              <span className="text-xs font-semibold text-green-400 tracking-wide">Engine Online</span>
            </motion.div>
          </div>
        </header>

        {/* Page content with Page Transition */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-full perspective-1000"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
