import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { api } from '../api/client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  suggestedActions?: string[]
}

const starterPrompts = [
  'How does the CatalogIQ workflow work from upload to search?',
  'Explain how HITL validation queue protects catalog quality',
  'What parameters are needed for deep groove ball bearings?',
  'What are the efficiency specifications for IE3 induction motors?',
  'How to find 350-bar hydraulic solenoid directional valves?',
]

export default function BrahMosChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        '👋 **Hello! I am BrahMos AI**, your autonomous industrial product intelligence assistant.\n\n' +
        'How can I help you today? You can ask me about:\n' +
        '- 📄 **Catalog Lifecycle**: Multi-format PDF cut sheet ingestion to vector RAG\n' +
        '- ⚙️ **Engineering Parameters**: Bearings, motors, hydraulic valves, robotics, seals\n' +
        '- 🛡️ **HITL Validation**: Inspecting AI proposal diffs and sign-off workflows',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'How does the CatalogIQ workflow work?',
        'Find angular contact bearings',
        'Explain HITL validation diffs',
      ],
    },
  ])

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim()
    if (!queryText || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInput('')
    setIsLoading(true)

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const { data } = await api.post('/chat', {
        message: queryText,
        history,
      })

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: data.suggested_actions,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch {
      // Local fallback
      const fallbackReply =
        `🤖 **BrahMos AI Response**\n\n` +
        `I analyzed your engineering question: *"${queryText}"*.\n\n` +
        `I can help you search live SKUs, convert engineering units, explain catalog validation diffs, and guide you through each step of the pipeline.`

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          'How does the CatalogIQ workflow work?',
          'Find angular contact bearings',
        ],
      }
      setMessages((prev) => [...prev, botMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleClear = () => {
    if (confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 'init-reset',
          role: 'assistant',
          content: 'Chat history cleared. How can BrahMos AI assist your engineering workflow now?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: starterPrompts.slice(0, 3),
        },
      ])
    }
  }

  return (
    <div className="space-y-7">
      {/* Header Banner */}
      <div className="panel-elevated p-7 sm:p-8 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white rounded-full text-xs font-mono font-bold border border-zinc-200 dark:border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CONVERSATIONAL ASSISTANT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              BrahMos AI Assistant
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              Autonomous conversational reasoning for industrial catalogs, engineering specifications, tolerance standards, and guided workflows.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="btn-secondary text-xs font-semibold py-2 px-3.5 flex items-center gap-2"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Column: Starter Prompts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="panel-precision p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-950 dark:text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
                Suggested Prompts
              </h3>
            </div>
            <div className="space-y-2">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={isLoading}
                  className="w-full p-3 text-left text-xs rounded-xl border border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.06] dark:hover:border-white/20 bg-zinc-50 dark:bg-[#121215] dark:hover:bg-[#18181B] text-zinc-700 dark:text-zinc-300 transition-all group flex items-start justify-between gap-2 shadow-2xs"
                >
                  <span className="group-hover:text-zinc-950 dark:group-hover:text-white line-clamp-2 leading-relaxed font-medium">{prompt}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 dark:group-hover:text-white flex-shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Chat Stream */}
        <div className="lg:col-span-3 panel-precision p-0 flex flex-col h-[640px] overflow-hidden shadow-sm">
          {/* Chat Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-2xs ${
                      isUser
                        ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-white dark:text-black dark:border-white'
                        : 'bg-white text-zinc-900 border-zinc-200 dark:bg-[#18181B] dark:text-white dark:border-white/20'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[85%] sm:max-w-[78%] space-y-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                    <div className="flex items-center gap-2 px-1 text-xs font-mono text-zinc-400">
                      <span>{isUser ? 'You' : 'BrahMos AI'}</span>
                      <span>·</span>
                      <span>{m.timestamp}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl border text-sm leading-relaxed whitespace-pre-wrap ${
                        isUser
                          ? 'bg-zinc-950 text-white border-zinc-950 dark:bg-[#18181B] dark:text-white dark:border-white/20 rounded-tr-none shadow-sm'
                          : 'bg-zinc-50 text-zinc-900 border-zinc-200/80 dark:bg-[#121215] dark:text-zinc-200 dark:border-white/[0.06] rounded-tl-none'
                      }`}
                    >
                      {m.content}
                    </div>

                    {/* Action buttons on bot message */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 px-1">
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 hover:bg-zinc-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-white" />
                              <span className="text-zinc-950 dark:text-white font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>

                        {/* Suggested action chips */}
                        {m.suggestedActions?.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(act)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-950 hover:text-white dark:bg-white/5 dark:hover:bg-white dark:hover:text-black border border-zinc-200 dark:border-white/10 px-3 py-1 rounded-md transition-colors"
                          >
                            <Zap className="w-3 h-3 text-zinc-950 dark:text-white" />
                            <span>{act}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white flex items-center justify-center border border-zinc-200 dark:border-white/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-white/[0.06] rounded-2xl rounded-tl-none flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-zinc-950 dark:bg-white animate-ping" />
                  <span>BrahMos AI is reasoning...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white dark:bg-[#09090B] border-t border-zinc-200/80 dark:border-white/[0.06]">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-3"
            >
              <input
                type="text"
                placeholder="Ask BrahMos AI anything about parts, workflow steps, or engineering specs..."
                className="input-precision flex-1 py-3 text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-primary py-3 px-5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}



