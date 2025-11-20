"""
Configuração para Vertex AI RAG Engine

Este módulo centraliza todas as configurações relacionadas ao RAG.
"""

import os
from typing import Optional
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings


class RAGConfig(BaseSettings):
    """Configurações do Vertex AI RAG Engine."""

    # GCP Settings
    project_id: str = Field(
        default="licitareview-prod",
        env="GCP_PROJECT_ID"
    )
    location: str = Field(
        default="us-central1",
        env="GCP_LOCATION"
    )

    # Credenciais
    credentials_path: Optional[str] = Field(
        default="credentials/licitareview-prod-b6b067fdd7e4.json",
        env="GOOGLE_APPLICATION_CREDENTIALS"
    )

    # GCS Settings
    gcs_bucket_name: str = Field(
        default="licitareview-rag-corpus",
        env="GCS_RAG_BUCKET"
    )
    gcs_base_path: str = Field(
        default="rag-corpus",
        env="GCS_RAG_BASE_PATH"
    )

    # RAG Corpus Settings
    shared_corpus_prefix: str = "shared"
    org_corpus_prefix: str = "org"

    # Chunk Settings
    default_chunk_size: int = 512  # Otimizado para embeddings
    default_chunk_overlap: int = 100  # ~20% overlap
    max_chunk_size: int = 2048  # Limite do modelo

    # Embedding Settings
    embedding_model: str = "text-embedding-004"  # Modelo recomendado
    embedding_batch_size: int = 250  # Max per request

    # Retrieval Settings
    default_similarity_top_k: int = 10
    default_vector_distance_threshold: float = 0.5

    # Generation Settings
    default_model: str = "gemini-2.0-flash-001"
    default_temperature: float = 0.2  # Mais determinístico
    default_max_output_tokens: int = 8192
    default_top_p: float = 0.95

    # Cache Settings (Redis)
    redis_host: str = Field(default="localhost", env="REDIS_HOST")
    redis_port: int = Field(default=6379, env="REDIS_PORT")
    redis_db: int = Field(default=0, env="REDIS_DB")
    cache_ttl_seconds: int = 3600  # 1 hora
    cache_enabled: bool = True

    # Performance Settings
    max_concurrent_imports: int = 5
    import_timeout_seconds: int = 600  # 10 minutos
    query_timeout_seconds: int = 30

    # Feature Flags
    enable_grounding: bool = False  # $2.5/1K requests - desabilitado por padrão
    enable_reranking: bool = True
    enable_query_cache: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


class ChunkConfig(BaseModel):
    """Configuração para chunking de documentos."""

    chunk_size: int = 512
    chunk_overlap: int = 100
    preserve_sections: bool = True
    min_chunk_size: int = 100  # Chunks muito pequenos são descartados

    def validate_config(self) -> bool:
        """Valida configuração."""
        if self.chunk_size > 2048:
            raise ValueError("chunk_size não pode exceder 2048 tokens")
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunk_overlap deve ser menor que chunk_size")
        if self.min_chunk_size > self.chunk_size:
            raise ValueError("min_chunk_size deve ser menor que chunk_size")
        return True


class CorpusConfig(BaseModel):
    """Configuração para criação de corpus."""

    display_name: str
    description: str
    organization_id: Optional[str] = None
    is_shared: bool = False
    corpus_type: str = "private"  # private, shared-leis, shared-normas, shared-jurisprudencia

    def get_corpus_name(self) -> str:
        """Gera nome único do corpus."""
        if self.is_shared:
            return f"shared-{self.corpus_type}"
        return f"org-{self.organization_id}-{self.corpus_type}"


# Singleton global config
_rag_config: Optional[RAGConfig] = None


def get_rag_config() -> RAGConfig:
    """Retorna configuração RAG singleton."""
    global _rag_config
    if _rag_config is None:
        _rag_config = RAGConfig()
    return _rag_config


def init_rag_config(
    project_id: Optional[str] = None,
    location: Optional[str] = None,
    credentials_path: Optional[str] = None
) -> RAGConfig:
    """
    Inicializa configuração RAG com valores customizados.

    Args:
        project_id: ID do projeto GCP
        location: Região GCP
        credentials_path: Path para credenciais

    Returns:
        Configuração RAG inicializada
    """
    global _rag_config

    # Cria config com valores customizados
    config_dict = {}
    if project_id:
        config_dict['project_id'] = project_id
    if location:
        config_dict['location'] = location
    if credentials_path:
        config_dict['credentials_path'] = credentials_path

    _rag_config = RAGConfig(**config_dict)

    # Configura variável de ambiente para Google Cloud
    if _rag_config.credentials_path:
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = _rag_config.credentials_path

    return _rag_config
