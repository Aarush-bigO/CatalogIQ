import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  User,
  X,
  Send,
  Maximize2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function BrahMosFloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hi! I am **BrahMos AI**.\n\nHow can I assist your catalog workflow today?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  const handleSend = async (quickText?: string) => {
    const text = (quickText || input).trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMsg])
    if (!quickText) setInput('')
    setIsLoading(true)

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const { data } = await api.post('/chat', {
        message: text,
        history,
      })

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
        },
      ])
    } catch {
      const lower = text.toLowerCase()
      let reply = ''
      if (lower.includes('workflow') || lower.includes('how to use')) {
        reply = '1. Ingest Specs (/documents)\n2. Auto-Enrich (/enrichment)\n3. Validate Diffs (/validation)\n4. Search & Export (/products).'
      } else {
        reply = `BrahMos AI analyzed: "${text}". Ask me about SKUs, tolerances, or workflow steps!`
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: reply,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 bg-white dark:bg-[#09090B] text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-white/20 shadow-2xl hover:border-zinc-400 dark:hover:border-white hover:bg-zinc-50 dark:hover:bg-[#18181B] transition-all duration-150 flex items-center gap-3 group"
          title="Ask BrahMos AI"
        >
          <div className="relative">
            <div className="w-9 h-9 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-xl flex items-center justify-center font-bold">
              <Bot className="w-5 h-5 text-white dark:text-black" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-black animate-pulse" />
          </div>
          <div className="text-left hidden sm:block pr-1">
            <p className="text-sm font-bold text-zinc-950 dark:text-white leading-none">BrahMos AI</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Catalog Assistant</p>
          </div>
        </button>
      )}

      {/* Floating Chat Drawer / Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="w-[360px] sm:w-[420px] h-[560px] bg-white dark:bg-[#09090B] rounded-2xl border border-zinc-200 dark:border-white/20 shadow-2xl flex flex-col overflow-hidden text-zinc-950 dark:text-white"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-50 dark:bg-[#121215] text-zinc-950 dark:text-white flex items-center justify-between border-b border-zinc-200/80 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-zinc-950 text-white dark:bg-white dark:text-black rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 dark:text-white">BrahMos AI Assistant</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Autonomous Catalog Intelligence</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  to="/chat"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
                  title="Expand to Full Page"
                >
                  <Maximize2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Bar */}
            <div className="p-2.5 bg-zinc-50/80 dark:bg-[#121215] border-b border-zinc-200/80 dark:border-white/[0.06] flex gap-2 overflow-x-auto">
              {[
                'Explain the workflow',
                'Find ball bearings',
                'What specs are needed?',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-zinc-950 dark:hover:border-white hover:bg-zinc-950 hover:text-white dark:hover:bg-white dark:hover:text-black px-3 py-1 rounded-lg whitespace-nowrap transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm">
              {messages.map((m) => {
                const isUser = m.role === 'user'
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                        isUser ? 'bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-[#18181B] dark:text-white dark:border-white/20'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div
                      className={`p-3.5 rounded-xl border leading-relaxed whitespace-pre-wrap max-w-[82%] text-sm ${
                        isUser
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-[#18181B] dark:text-white dark:border-white/20 rounded-tr-none'
                          : 'bg-zinc-50 text-zinc-900 border-zinc-200/80 dark:bg-[#121215] dark:text-zinc-200 dark:border-white/[0.06] rounded-tl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 pl-9">
                  <div className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-white animate-ping" />
                  <span>BrahMos AI is reasoning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-3 bg-white dark:bg-[#121215] border-t border-zinc-200/80 dark:border-white/[0.08] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask BrahMos AI..."
                className="input-precision flex-1 py-2 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-primary py-2 px-3.5 text-xs flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


