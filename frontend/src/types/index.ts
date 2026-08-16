export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  manufacturer: string | null;
  currency: string | null;
  list_price: number | null;
  cost_price: number | null;
  attributes: Record<string, unknown>;
  specifications: Record<string, unknown>;
  status: string;
  quality_score: number | null;
  confidence_score: number | null;
  completeness_score: number | null;
  source_catalog: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Document {
  id: string;
  filename: string;
  doc_type: string;
  status: string;
  file_size_bytes: number;
  page_count: number | null;
  created_at: string | null;
}

export interface SearchResult {
  product_id: string;
  sku: string;
  name: string;
  category: string | null;
  description: string | null;
  score: number;
  matched_field: string | null;
  explanation: string | null;
  attributes: Record<string, unknown>;
}

export interface EnrichmentJob {
  id: string;
  product_id: string;
  enrichment_type: string;
  status: string;
  ai_model: string;
  fields_enriched: string[];
  confidence_scores: Record<string, number>;
  started_at: string | null;
  completed_at: string | null;
}

export interface ValidationItem {
  id: string;
  product_id: string;
  field_name: string;
  field_path: string;
  old_value: string | null;
  proposed_value: string;
  ai_confidence: number;
  ai_reasoning: string | null;
  status: string;
  priority: number;
  created_at: string | null;
}

export interface DashboardStats {
  products: {
    total_products: number;
    status_breakdown: Record<string, number>;
    quality_distribution: Record<string, number>;
    category_count: number;
    avg_quality_score: number;
    avg_confidence_score: number;
    avg_completeness_score: number;
  };
  documents: {
    status_breakdown: Record<string, number>;
    total: number;
  };
  enrichment: {
    status_breakdown: Record<string, number>;
    total_jobs: number;
  };
  validation: {
    status_breakdown: Record<string, number>;
    pending_reviews: number;
  };
}
