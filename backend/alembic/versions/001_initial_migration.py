"""Initial migration - create all tables

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types
    productstatus = sa.Enum('DRAFT', 'ENRICHING', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PUBLISHED', name='productstatus')
    productstatus.create(op.get_bind())
    
    documenttype = sa.Enum('PDF', 'IMAGE', 'EXCEL', 'CSV', 'WORD', 'WEBPAGE', 'CATALOG', 'TECHNICAL_SHEET', 'UNKNOWN', name='documenttype')
    documenttype.create(op.get_bind())
    
    processingstatus = sa.Enum('PENDING', 'UPLOADED', 'EXTRACTING', 'OCR_RUNNING', 'AI_ANALYZING', 'COMPLETED', 'FAILED', 'QUEUED_FOR_ENRICHMENT', name='processingstatus')
    processingstatus.create(op.get_bind())
    
    enrichmentstatus = sa.Enum('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', name='enrichmentstatus')
    enrichmentstatus.create(op.get_bind())
    
    validationstatus = sa.Enum('PENDING', 'AUTO_PASSED', 'AUTO_FAILED', 'HUMAN_REVIEWING', 'HUMAN_APPROVED', 'HUMAN_REJECTED', name='validationstatus')
    validationstatus.create(op.get_bind())
    
    # products table
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sku', sa.String(100), nullable=False),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(200), nullable=True),
        sa.Column('subcategory', sa.String(200), nullable=True),
        sa.Column('brand', sa.String(200), nullable=True),
        sa.Column('manufacturer', sa.String(200), nullable=True),
        sa.Column('currency', sa.String(3), nullable=True),
        sa.Column('list_price', sa.Float(), nullable=True),
        sa.Column('cost_price', sa.Float(), nullable=True),
        sa.Column('primary_image_url', sa.Text(), nullable=True),
        sa.Column('image_urls', sa.JSON(), nullable=True),
        sa.Column('attributes', sa.JSON(), nullable=False),
        sa.Column('specifications', sa.JSON(), nullable=False),
        sa.Column('hs_code', sa.String(50), nullable=True),
        sa.Column('unspsc_code', sa.String(50), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'ENRICHING', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PUBLISHED', name='productstatus'), nullable=False),
        sa.Column('quality_score', sa.Float(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('completeness_score', sa.Float(), nullable=True),
        sa.Column('source_catalog', sa.String(200), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('source_documents', sa.JSON(), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=True),
        sa.Column('language', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('enriched_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('validated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('sku', 'source_catalog', name='uix_product_sku_catalog'),
    )
    
    op.create_index('ix_products_sku', 'products', ['sku'])
    op.create_index('ix_products_status', 'products', ['status'])
    op.create_index('ix_products_category', 'products', ['category'])
    op.create_index('ix_products_quality_score', 'products', ['quality_score'])
    op.create_index('ix_products_created_at', 'products', ['created_at'])
    
    # product_aliases table
    op.create_table(
        'product_aliases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('alias_type', sa.String(50), nullable=False),
        sa.Column('alias_value', sa.String(500), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('source', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    )
    
    # product_relationships table
    op.create_table(
        'product_relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('target_product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relationship_type', sa.String(50), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('inferred_by_ai', sa.Boolean(), nullable=False),
        sa.Column('validated_by_human', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['source_product_id'], ['products.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['target_product_id'], ['products.id'], ondelete='CASCADE'),
    )
    
    # source_documents table
    op.create_table(
        'source_documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('filename', sa.String(500), nullable=False),
        sa.Column('original_filename', sa.String(500), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('doc_type', sa.Enum('PDF', 'IMAGE', 'EXCEL', 'CSV', 'WORD', 'WEBPAGE', 'CATALOG', 'TECHNICAL_SHEET', 'UNKNOWN', name='documenttype'), nullable=False),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('uploaded_by', sa.String(200), nullable=True),
        sa.Column('catalog_name', sa.String(200), nullable=True),
        sa.Column('status', sa.Enum('PENDING', 'UPLOADED', 'EXTRACTING', 'OCR_RUNNING', 'AI_ANALYZING', 'COMPLETED', 'FAILED', 'QUEUED_FOR_ENRICHMENT', name='processingstatus'), nullable=False),
        sa.Column('processing_metadata', sa.JSON(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    
    op.create_index('ix_source_documents_status', 'source_documents', ['status'])
    op.create_index('ix_source_documents_doc_type', 'source_documents', ['doc_type'])
    op.create_index('ix_source_documents_created_at', 'source_documents', ['created_at'])
    
    # document_extractions table
    op.create_table(
        'document_extractions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('extraction_method', sa.String(50), nullable=False),
        sa.Column('extracted_data', sa.JSON(), nullable=True),
        sa.Column('raw_text', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('bounding_box', sa.JSON(), nullable=True),
        sa.Column('model_version', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
    )
    
    op.create_index('ix_document_extractions_product_id', 'document_extractions', ['product_id'])
    op.create_index('ix_document_extractions_confidence', 'document_extractions', ['confidence'])
    
    # ocr_results table
    op.create_table(
        'ocr_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('ocr_text', sa.Text(), nullable=False),
        sa.Column('ocr_engine', sa.String(50), nullable=False),
        sa.Column('confidence_avg', sa.Float(), nullable=True),
        sa.Column('language', sa.String(10), nullable=False),
        sa.Column('processing_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='CASCADE'),
    )
    
    # document_page_images table
    op.create_table(
        'document_page_images',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source_document_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=False),
        sa.Column('image_path', sa.Text(), nullable=False),
        sa.Column('width', sa.Integer(), nullable=True),
        sa.Column('height', sa.Integer(), nullable=True),
        sa.Column('dpi', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['source_document_id'], ['source_documents.id'], ondelete='CASCADE'),
    )
    
    # enrichment_runs table
    op.create_table(
        'enrichment_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('enrichment_type', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'PARTIAL', name='enrichmentstatus'), nullable=False),
        sa.Column('ai_model', sa.String(100), nullable=False),
        sa.Column('prompt_template', sa.Text(), nullable=True),
        sa.Column('raw_llm_output', sa.Text(), nullable=True),
        sa.Column('changes_made', sa.JSON(), nullable=True),
        sa.Column('fields_enriched', sa.JSON(), nullable=True),
        sa.Column('confidence_scores', sa.JSON(), nullable=True),
        sa.Column('sources_used', sa.JSON(), nullable=True),
        sa.Column('rag_query', sa.Text(), nullable=True),
        sa.Column('rag_retrieved_chunks', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tokens_input', sa.Integer(), nullable=True),
        sa.Column('tokens_output', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_enrichment_runs_product_id', 'enrichment_runs', ['product_id'])
    op.create_index('ix_enrichment_runs_status', 'enrichment_runs', ['status'])
    
    # product_validations table
    op.create_table(
        'product_validations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('field_name', sa.String(200), nullable=False),
        sa.Column('field_path', sa.String(500), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('proposed_value', sa.Text(), nullable=False),
        sa.Column('ai_confidence', sa.Float(), nullable=False),
        sa.Column('ai_reasoning', sa.Text(), nullable=True),
        sa.Column('ai_suggested_action', sa.String(50), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'AUTO_PASSED', 'AUTO_FAILED', 'HUMAN_REVIEWING', 'HUMAN_APPROVED', 'HUMAN_REJECTED', name='validationstatus'), nullable=False),
        sa.Column('reviewer_id', sa.String(200), nullable=True),
        sa.Column('reviewer_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
    )
    
    op.create_index('ix_product_validations_product_id', 'product_validations', ['product_id'])
    op.create_index('ix_product_validations_status', 'product_validations', ['status'])
    
    # validation_rules table
    op.create_table(
        'validation_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('field_path', sa.String(500), nullable=False),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('auto_fix', sa.Boolean(), nullable=False),
        sa.Column('auto_fix_value', sa.Text(), nullable=True),
        sa.Column('applies_to_categories', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('validation_rules')
    op.drop_table('product_validations')
    op.drop_table('enrichment_runs')
    op.drop_table('document_page_images')
    op.drop_table('ocr_results')
    op.drop_table('document_extractions')
    op.drop_table('source_documents')
    op.drop_table('product_relationships')
    op.drop_table('product_aliases')
    op.drop_table('products')
    
    # Drop enum types
    sa.Enum(name='productstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='documenttype').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='processingstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='enrichmentstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='validationstatus').drop(op.get_bind(), checkfirst=True)
