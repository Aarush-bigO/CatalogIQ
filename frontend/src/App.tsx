import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProductTable from './components/ProductTable'
import DocumentUploader from './components/DocumentUploader'
import SearchBar from './components/SearchBar'
import EnrichmentPanel from './components/EnrichmentPanel'
import ValidationQueue from './components/ValidationQueue'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductTable />} />
        <Route path="/documents" element={<DocumentUploader />} />
        <Route path="/search" element={<SearchBar />} />
        <Route path="/enrichment" element={<EnrichmentPanel />} />
        <Route path="/validation" element={<ValidationQueue />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
