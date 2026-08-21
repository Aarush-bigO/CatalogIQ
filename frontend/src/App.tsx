import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import ProductTable from './components/ProductTable'
import DocumentUploader from './components/DocumentUploader'
import SearchBar from './components/SearchBar'
import EnrichmentPanel from './components/EnrichmentPanel'
import ValidationQueue from './components/ValidationQueue'
import KnowledgeGraph from './components/KnowledgeGraph'
import BrahMosChat from './components/BrahMosChat'
import BrahMosFloatingChat from './components/BrahMosFloatingChat'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductTable />} />
        <Route path="/documents" element={<DocumentUploader />} />
        <Route path="/validation" element={<ValidationQueue />} />
        <Route path="/search" element={<SearchBar />} />
        <Route path="/enrichment" element={<EnrichmentPanel />} />
        <Route path="/graph" element={<KnowledgeGraph />} />
        <Route path="/chat" element={<BrahMosChat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BrahMosFloatingChat />
    </Layout>
  )
}

