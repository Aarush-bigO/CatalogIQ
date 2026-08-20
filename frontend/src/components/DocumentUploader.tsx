import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Image,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

const statusIcons: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  failed: AlertCircle,
  extracting: Loader2,
  ocr_running: Loader2,
  ai_analyzing: Loader2,
  pending: Clock,
  uploaded: Clock,
}

const statusColors: Record<string, string> = {
  completed: 'text-green-600',
  failed: 'text-red-600',
  extracting: 'text-blue-600',
  ocr_running: 'text-blue-600',
  ai_analyzing: 'text-blue-600',
  pending: 'text-yellow-600',
  uploaded: 'text-gray-400',
}

const docTypeIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  image: Image,
  excel: FileText,
  csv: FileText,
  word: FileText,
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DocumentUploader() {
  const { data: documents, isLoading } = useDocuments({ page_size: 50 }) as { data: any[], isLoading: boolean }
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const [uploadSuccessFile, setUploadSuccessFile] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadSuccessFile(null)
    acceptedFiles.forEach(async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      try {
        await uploadDocument.mutateAsync(formData)
        setUploadSuccessFile(file.name)
        setTimeout(() => setUploadSuccessFile(null), 10000)
      } catch (err: any) {
        alert(`Upload error: ${err.message}`)
      }
    })
  }, [uploadDocument])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-primary-300 to-purple-400 drop-shadow-sm">Document Ingestion & AI Extraction</h1>
          <p className="text-white/60 mt-2 font-medium">
            Upload spec sheets, PDFs, or images — Google Gemini AI will dynamically extract engineering specs into live products.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {uploadSuccessFile && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-5 bg-gradient-to-r from-primary-900/40 to-purple-900/40 border border-primary-500/30 rounded-2xl flex items-center justify-between shadow-[0_0_20px_rgba(0,240,255,0.15)] backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500/20 text-primary-300 rounded-xl shadow-inner border border-primary-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white drop-shadow-md">
                  ✨ Successfully extracted "{uploadSuccessFile}" with Gemini AI!
                </p>
                <p className="text-xs text-primary-200 mt-1">
                  New product created in catalog & queued for human review in Validation Queue.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/validation"
                className="px-4 py-2 text-xs font-bold bg-primary-600 hover:bg-primary-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] flex items-center gap-2"
              >
                Review in Validation <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/products"
                className="px-4 py-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
              >
                View Products
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`card relative overflow-hidden border-2 border-dashed cursor-pointer transition-all duration-300 group ${
          isDragActive
            ? 'border-primary-500 bg-primary-900/20 shadow-[0_0_30px_rgba(0,240,255,0.2)]'
            : 'border-white/20 hover:border-primary-400 hover:bg-white/5'
        }`}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] group-hover:bg-primary-500/20 transition-colors duration-500" />
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-12 relative z-10">
          <motion.div
            animate={{ y: isDragActive ? -10 : 0 }}
            className="p-4 bg-white/5 text-primary-400 rounded-2xl mb-4 border border-white/10 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-shadow"
          >
            <Upload className="w-10 h-10" />
          </motion.div>
          <p className="text-xl font-bold text-white">
            {isDragActive ? 'Drop your industrial document here' : 'Click to browse or drag & drop files'}
          </p>
          <p className="text-sm text-white/50 mt-2 max-w-md text-center">
            Supports PDF, PNG, JPG, Excel, CSV, TXT (up to 50MB). Automatically extracted via Google Gemini 2.0.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {uploadDocument.isPending && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-primary-900/30 border border-primary-500/20 rounded-xl flex items-center gap-4 text-sm shadow-[0_0_15px_rgba(0,240,255,0.1)] backdrop-blur-md"
          >
            <Loader2 className="w-6 h-6 animate-spin text-primary-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white">Processing upload with Google Gemini AI...</span>
              <span className="text-xs text-primary-300 block mt-0.5">Extracting SKU, specifications, and descriptions via multi-modal analysis</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document list */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Uploaded Documents Catalog
          </h3>
          <span className="text-xs font-bold px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white/70">{documents?.length || 0} Files</span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          </div>
        ) : documents?.length === 0 ? (
          <div className="text-center py-12 text-white/40 bg-dark-800/50 rounded-2xl border border-white/5">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/10" />
            <p className="text-lg font-medium">No documents uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents?.map((doc) => {
              const StatusIcon = statusIcons[doc.status] || Clock
              const DocIcon = docTypeIcons[doc.doc_type] || FileText
              const displayName = doc.filename
              return (
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  key={doc.id}
                  className="flex items-center gap-5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all shadow-inner group"
                >
                  <div className="p-3 bg-dark-800 rounded-xl border border-white/5 shadow-inner">
                    <DocIcon className="w-6 h-6 text-primary-400 group-hover:text-primary-300 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate group-hover:text-primary-100 transition-colors">{displayName}</p>
                    <p className="text-xs text-white/50 mt-1 flex items-center gap-2">
                      <span className="font-mono bg-dark-800 px-1.5 py-0.5 rounded text-white/70">{formatBytes(doc.file_size_bytes)}</span>
                      <span>·</span>
                      <span className="uppercase font-bold text-white/60">{doc.doc_type}</span>
                      <span>·</span>
                      <span className="text-purple-300/70 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Processed with Gemini</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-800 border border-white/5 shadow-inner ${statusColors[doc.status] || 'text-gray-400'}`}>
                      <StatusIcon className={`w-4 h-4 ${doc.status.includes('ing') ? 'animate-spin drop-shadow-[0_0_5px_currentColor]' : ''}`} />
                      <span className="text-xs capitalize font-bold">{doc.status.replace(/_/g, ' ')}</span>
                    </div>
                    <button
                      className="p-2 rounded-lg bg-dark-800 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all shadow-inner"
                      title="Delete document"
                      onClick={() => {
                        if (confirm(`Delete ${displayName}?`)) {
                          deleteDocument.mutate(doc.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
