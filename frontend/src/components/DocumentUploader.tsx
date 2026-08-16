import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
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
  const { data: documents, isLoading } = useDocuments({ page_size: 50 })
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Ingestion & AI Extraction</h1>
          <p className="text-gray-500 mt-1">
            Upload spec sheets, PDFs, or images — Google Gemini AI will extract engineering specs into live products.
          </p>
        </div>
      </div>

      {uploadSuccessFile && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-950">
                ✨ Successfully extracted "{uploadSuccessFile}" with Gemini AI!
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                New product created in catalog & queued for human review in Validation Queue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/validation"
              className="btn-primary py-1.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
            >
              Review in Validation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/products"
              className="btn-secondary py-1.5 px-3 text-xs hover:bg-white flex items-center gap-1"
            >
              View Products
            </Link>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`card border-2 border-dashed cursor-pointer transition-all ${
          isDragActive
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center py-10">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
            <Upload className="w-8 h-8" />
          </div>
          <p className="text-base font-semibold text-gray-900">
            {isDragActive ? 'Drop your industrial document here' : 'Click to browse or drag & drop files'}
          </p>
          <p className="text-xs text-gray-500 mt-1.5 max-w-sm text-center">
            Supports PDF, PNG, JPG, Excel, CSV, TXT (up to 50MB). Automatically extracted via Google Gemini.
          </p>
        </div>
      </div>

      {uploadDocument.isPending && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-sm text-blue-700">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
          <div>
            <span className="font-semibold">Processing upload with Google Gemini AI...</span>
            <span className="text-xs text-blue-600 block">Extracting SKU, specifications, and descriptions</span>
          </div>
        </div>
      )}

      {/* Document list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Uploaded Documents Catalog</h3>
          <span className="text-xs text-gray-500">{documents?.length || 0} Files</span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : documents?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            No documents uploaded yet
          </div>
        ) : (
          <div className="space-y-2">
            {documents?.map((doc) => {
              const StatusIcon = statusIcons[doc.status] || Clock
              const DocIcon = docTypeIcons[doc.doc_type] || FileText
              const displayName = doc.original_filename || doc.filename
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-4 p-3.5 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors"
                >
                  <DocIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500">
                      {formatBytes(doc.file_size_bytes)} · {doc.doc_type?.toUpperCase()} · Processed with Gemini
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 ${statusColors[doc.status] || 'text-gray-400'}`}>
                      <StatusIcon className={`w-4 h-4 ${doc.status.includes('ing') ? 'animate-spin' : ''}`} />
                      <span className="text-xs capitalize font-medium">{doc.status.replace(/_/g, ' ')}</span>
                    </div>
                    <button
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
