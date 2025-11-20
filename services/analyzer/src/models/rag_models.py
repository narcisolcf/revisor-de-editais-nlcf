"""
Modelos de dados para Vertex AI RAG Engine

Define as estruturas de dados usadas pelos serviços RAG.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class CorpusStatus(str, Enum):
    """Status do corpus RAG."""
    CREATING = "creating"
    ACTIVE = "active"
    UPDATING = "updating"
    ERROR = "error"
    DELETING = "deleting"


class DocumentStatus(str, Enum):
    """Status do documento no corpus."""
    PENDING = "pending"
    PROCESSING = "processing"
    INDEXED = "indexed"
    ERROR = "error"


class ContextType(str, Enum):
    """Tipo de contexto para queries."""
    ALL = "all"
    LEGAL = "legal"
    TEMPLATES = "templates"
    NORMAS = "normas"
    JURISPRUDENCIA = "jurisprudencia"
    ORGANIZATIONAL = "organizational"


# ==================== Corpus Models ====================


class RagCorpus(BaseModel):
    """Representa um corpus RAG."""

    corpus_id: str
    corpus_name: str  # Nome único (e.g., "org-123-private")
    display_name: str
    description: str
    organization_id: Optional[str] = None
    is_shared: bool = False
    corpus_type: str = "private"
    status: CorpusStatus = CorpusStatus.ACTIVE
    document_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        use_enum_values = True


class OrganizationKnowledgeBase(BaseModel):
    """Base de conhecimento de uma organização."""

    organization_id: str
    private_corpus_id: str  # Corpus privado da org
    shared_corpus_ids: List[str] = Field(default_factory=list)  # Corpus compartilhados
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    document_count: int = 0
    last_sync_at: Optional[datetime] = None
    status: str = "active"

    def get_all_corpus_ids(self) -> List[str]:
        """Retorna todos os corpus IDs (privado + compartilhados)."""
        return [self.private_corpus_id] + self.shared_corpus_ids


# ==================== Document Models ====================


class DocumentChunk(BaseModel):
    """Representa um chunk de documento."""

    chunk_id: str
    document_id: str
    chunk_index: int
    content: str
    token_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    embedding: Optional[List[float]] = None

    def get_display_preview(self, max_length: int = 100) -> str:
        """Retorna preview do chunk."""
        if len(self.content) <= max_length:
            return self.content
        return self.content[:max_length] + "..."


class ProcessedDocument(BaseModel):
    """Documento processado para RAG."""

    document_id: str
    original_content: str
    chunks: List[DocumentChunk]
    total_chunks: int
    total_tokens: int
    metadata: Dict[str, Any] = Field(default_factory=dict)
    gcs_uri: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def average_chunk_size(self) -> float:
        """Tamanho médio dos chunks."""
        if not self.chunks:
            return 0
        return sum(c.token_count for c in self.chunks) / len(self.chunks)


class RagDocument(BaseModel):
    """Documento no corpus RAG."""

    document_id: str
    corpus_id: str
    file_name: str
    gcs_uri: str
    status: DocumentStatus = DocumentStatus.PENDING
    chunk_count: int = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)
    imported_at: datetime = Field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None

    class Config:
        use_enum_values = True


# ==================== Retrieval Models ====================


class RetrievedContext(BaseModel):
    """Contexto recuperado do RAG."""

    source_document_id: str
    source_file_name: str
    chunk_text: str
    relevance_score: float  # 0-1, maior = mais relevante
    distance: float  # Vector distance
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def get_citation(self) -> str:
        """Retorna citação formatada."""
        doc_type = self.metadata.get('document_type', 'Documento')
        section = self.metadata.get('section', '')
        if section:
            return f"{doc_type} - {self.source_file_name} (Seção: {section})"
        return f"{doc_type} - {self.source_file_name}"


class RetrievalResult(BaseModel):
    """Resultado de uma busca no corpus."""

    query: str
    contexts: List[RetrievedContext]
    total_found: int
    corpus_ids_searched: List[str]
    retrieval_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def get_top_contexts(self, n: int = 5) -> List[RetrievedContext]:
        """Retorna top N contextos mais relevantes."""
        return sorted(
            self.contexts,
            key=lambda c: c.relevance_score,
            reverse=True
        )[:n]


# ==================== Generation Models ====================


class Source(BaseModel):
    """Fonte citada em uma resposta."""

    title: str
    excerpt: str
    relevance_score: float
    document_id: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RAGResponse(BaseModel):
    """Resposta gerada com RAG."""

    answer: str
    sources: List[Source]
    confidence: float  # 0-1
    model_used: str
    contexts_used: int
    generation_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

    def get_sources_text(self) -> str:
        """Retorna fontes formatadas como texto."""
        if not self.sources:
            return "Nenhuma fonte específica citada."

        sources_text = "\n\nFontes consultadas:\n"
        for i, source in enumerate(self.sources, 1):
            sources_text += f"{i}. {source.title}\n"
            sources_text += f"   Relevância: {source.relevance_score:.2%}\n"
            sources_text += f"   \"{source.excerpt[:100]}...\"\n\n"

        return sources_text


class QueryResponse(BaseModel):
    """Resposta para uma consulta inteligente."""

    question: str
    answer: str
    sources: List[Source]
    confidence: float
    context_type: ContextType
    retrieval_info: Dict[str, Any] = Field(default_factory=dict)
    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


# ==================== Import/Sync Models ====================


class ImportRequest(BaseModel):
    """Request para importar documentos."""

    corpus_id: str
    document_ids: List[str]
    force_reimport: bool = False
    chunk_size: int = 512
    chunk_overlap: int = 100


class ImportResult(BaseModel):
    """Resultado de importação de documentos."""

    corpus_id: str
    total_documents: int
    successful: int
    failed: int
    skipped: int
    import_time_seconds: float
    errors: List[Dict[str, str]] = Field(default_factory=list)

    @property
    def success_rate(self) -> float:
        """Taxa de sucesso."""
        if self.total_documents == 0:
            return 0.0
        return self.successful / self.total_documents


class SyncResult(BaseModel):
    """Resultado de sincronização."""

    organization_id: str
    corpus_id: str
    total_documents: int
    successful: int
    failed: int
    sync_time_seconds: float
    last_sync_at: datetime = Field(default_factory=datetime.utcnow)


# ==================== Analysis Enhancement Models ====================


class LegalInsight(BaseModel):
    """Insight legal gerado com RAG."""

    analysis_text: str
    cited_laws: List[str] = Field(default_factory=list)
    cited_articles: List[str] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    confidence: float
    recommendations: List[str] = Field(default_factory=list)


class StructuralInsight(BaseModel):
    """Insight estrutural gerado com RAG."""

    analysis_text: str
    template_matches: List[str] = Field(default_factory=list)
    deviations: List[str] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    confidence: float


class ConformityInsight(BaseModel):
    """Insight de conformidade gerado com RAG."""

    analysis_text: str
    compliant_items: List[str] = Field(default_factory=list)
    non_compliant_items: List[str] = Field(default_factory=list)
    sources: List[Source] = Field(default_factory=list)
    confidence: float


class RAGInsights(BaseModel):
    """Conjunto de insights gerados com RAG."""

    legal: Optional[LegalInsight] = None
    structural: Optional[StructuralInsight] = None
    conformity: Optional[ConformityInsight] = None
    overall_confidence: float = 0.0
    total_sources: int = 0
    generation_time_ms: float = 0.0

    def get_all_sources(self) -> List[Source]:
        """Retorna todas as fontes citadas."""
        all_sources = []
        if self.legal:
            all_sources.extend(self.legal.sources)
        if self.structural:
            all_sources.extend(self.structural.sources)
        if self.conformity:
            all_sources.extend(self.conformity.sources)

        # Remove duplicatas
        unique_sources = {}
        for source in all_sources:
            unique_sources[source.document_id] = source

        return list(unique_sources.values())


# ==================== Error Models ====================


class RAGError(BaseModel):
    """Erro relacionado a RAG."""

    error_type: str
    message: str
    corpus_id: Optional[str] = None
    document_id: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
