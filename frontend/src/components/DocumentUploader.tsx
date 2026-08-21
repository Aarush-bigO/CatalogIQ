import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useDocuments, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Sparkles,
  Zap,
  FileCheck,
} from 'lucide-react'

const sampleCutSheets = [
  {
    title: 'SKF 7210 Angular Contact Bearing',
    filename: 'SKF_7210_BEP_Spindle_Bearing_Specs.pdf',
    size: '1.4 MB',
    specs: '50mm bore, 40° contact angle, 11,000 RPM rating',
    type: 'Bearing Cut Sheet',
  },
  {
    title: 'Parker D1VW 350-Bar Hydraulic Valve',
    filename: 'Parker_D1VW_Directional_Control_Valve.pdf',
    size: '2.8 MB',
    specs: 'NG6 / CETOP 03, 350 bar, Solenoid directional control',
    type: 'Hydraulic Valve Spec',
  },
  {
    title: 'Siemens SIMOTICS 15kW IE3 Motor',
    filename: 'Siemens_SIMOTICS_1LE1_15kW_IE3_Motor.pdf',
    size: '3.2 MB',
    specs: '400V 50Hz, 1465 RPM, IP55 enclosure, Cast Iron',
    type: 'Electric Motor Datasheet',
  },
]

export default function DocumentUploader() {
  const [demoUploading, setDemoUploading] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  const { data, isLoading } = useDocuments({ page_size: 50 })
  const uploadDoc = useUploadDocument()
  const deleteDoc = useDeleteDocument()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          await uploadDoc.mutateAsync(formData)
          setUploadSuccess(`Successfully ingested "${file.name}" into BrahMos AI OCR extraction pipeline.`)
          setTimeout(() => setUploadSuccess(null), 5000)
        } catch (err: any) {
          alert(`Upload failed: ${err.message}`)
        }
      }
    },
    [uploadDoc]
  )

  const handle1ClickDemo = async (sample: typeof sampleCutSheets[0]) => {
    setDemoUploading(sample.title)
    setUploadSuccess(null)
    try {
      const mockBlob = new Blob(
        [
          `--- TECHNICAL DATASHEET: ${sample.title} ---\nFile: ${sample.filename}\nType: ${sample.type}\nSpecifications:\n- ${sample.specs}\n- Standards: ISO 9001, IEC 60034-1, DIN EN 60034\n- Quality: 100% Tested & Certified\n- Manufacturer: Industrial Global Supply`,
        ],
        { type: 'application/pdf' }
      )
      const mockFile = new File([mockBlob], sample.filename, { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', mockFile)
      await uploadDoc.mutateAsync(formData)
      setUploadSuccess(`✨ Ingested demo cut sheet "${sample.filename}". BrahMos AI OCR extraction active!`)
      setTimeout(() => setUploadSuccess(null), 5000)
    } catch (err: any) {
      alert(`Demo ingestion error: ${err.message}`)
    } finally {
      setDemoUploading(null)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024,
  })

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
            Document Ingestion & Multi-Modal OCR
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Ingest PDFs, technical cut sheets, and CAD specs. BrahMos AI extracts tabular parameters into structured database records.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {uploadSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 bg-emerald-50 dark:bg-[#121215] border border-emerald-200 dark:border-white/20 rounded-xl flex items-center gap-3 text-zinc-900 dark:text-zinc-100 text-sm font-medium shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-white flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1-Click Pre-Configured Demo Cut Sheets ── */}
      <div className="panel-precision p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-zinc-950 dark:text-white" />
            <h3 className="text-sm font-bold text-zinc-950 dark:text-white uppercase tracking-wider">
              Instant 1-Click Demo Spec Sheets
            </h3>
          </div>
          <span className="badge-iris">Instant Pipeline Test</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleCutSheets.map((sample) => {
            const isUploadingThis = demoUploading === sample.title
            return (
              <div
                key={sample.title}
                className="p-4 sm:p-5 rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 hover:border-zinc-300 dark:border-white/[0.06] dark:hover:border-white/20 dark:hover:bg-[#18181B] transition-all flex flex-col justify-between space-y-3 group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="badge-slate">{sample.type}</span>
                    <span className="text-xs font-mono text-zinc-500">{sample.size}</span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors line-clamp-1">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-2 bg-white dark:bg-[#09090B] p-2.5 rounded-lg border border-zinc-200/60 dark:border-white/[0.04]">
                    {sample.specs}
                  </p>
                </div>

                <button
                  onClick={() => handle1ClickDemo(sample)}
                  disabled={isUploadingThis || uploadDoc.isPending}
                  className="btn-secondary w-full py-2 text-xs font-semibold disabled:opacity-50"
                >
                  {isUploadingThis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950 dark:text-white" />
                      <span>Ingesting & Parsing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-zinc-950 dark:text-white" />
                      <span>1-Click Test Ingest</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Drag & Drop Laser Scanning Zone ── */}
      <div
        {...getRootProps()}
        className={`panel-precision p-10 sm:p-12 text-center cursor-pointer transition-all duration-200 relative overflow-hidden border-2 border-dashed ${
          isDragActive
            ? 'border-zinc-950 bg-zinc-100 dark:border-white dark:bg-[#18181B]'
            : 'border-zinc-300 hover:border-zinc-500 hover:bg-zinc-50 dark:border-white/15 dark:hover:border-white/30 dark:hover:bg-[#121215]'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive && <div className="laser-scanner" />}

        <div className="flex flex-col items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white flex items-center justify-center shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              {isDragActive ? 'Drop your technical document here' : 'Drag & drop technical cut sheets or browse'}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              Supports PDF, PNG, JPG, Excel (.xlsx), CSV, and Plaintext spec sheets up to 50MB
            </p>
          </div>
          <button type="button" className="btn-secondary mt-1">
            <span>Browse Local Files</span>
          </button>
        </div>
      </div>

      {/* ── Processed Documents Table ── */}
      <div className="panel-precision p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200/80 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-zinc-950 dark:text-white" />
            <h3 className="text-base font-bold text-zinc-950 dark:text-white">
              Ingested Document Library ({data?.length || 0})
            </h3>
          </div>
          <span className="badge-iris">OCR Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/[0.06] text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="pb-3 px-4">Filename</th>
                <th className="pb-3 px-4">Doc Type</th>
                <th className="pb-3 px-4">File Size</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Ingested At</th>
                <th className="pb-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:divide-white/[0.04]">
              {data?.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <span className="truncate max-w-xs">{doc.filename}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="badge-slate uppercase">{doc.doc_type || 'PDF'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                    {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024).toFixed(1)} KB` : '1.2 MB'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="badge-iris flex items-center gap-1.5 w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-white" />
                      Processed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Today'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.filename}"?`)) {
                          deleteDoc.mutate(doc.id)
                        }
                      }}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/20 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 text-base">No documents ingested yet</p>
                    <p className="text-xs text-zinc-500 mt-1">Use the 1-click test buttons above or drop a technical PDF</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}





