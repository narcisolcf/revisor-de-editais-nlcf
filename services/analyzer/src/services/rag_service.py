"""
Vertex AI RAG Service

Serviço principal para integração com Vertex AI RAG Engine.
Gerencia corpus, importação de documentos, retrieval e geração.
"""

import time
from datetime import datetime
from typing import List, Optional, Dict, Any
import structlog

from google.cloud import aiplatform
from google.api_core import exceptions as gcp_exceptions
from vertexai.preview.generative_models import GenerativeModel, Tool
from vertexai.preview import rag
from vertexai.preview.rag import RagCorpus as VertexRagCorpus

from ..config_rag import get_rag_config, CorpusConfig
from ..models.rag_models import (
    RagCorpus,
    CorpusStatus,
    RetrievedContext,
    RetrievalResult,
    RAGResponse,
    Source,
    ImportResult,
    RAGError,
)

logger = structlog.get_logger(__name__)


class RAGService:
    """
    Serviço de integração com Vertex AI RAG Engine.

    Funcionalidades:
    - Gerenciamento de corpus (criar, listar, deletar)
    - Importação de documentos para corpus
    - Recuperação de contextos relevantes (retrieval)
    - Geração de respostas fundamentadas (RAG)
    """

    def __init__(self):
        """Inicializa o serviço RAG."""
        self.config = get_rag_config()
        self.logger = structlog.get_logger(self.__class__.__name__)
        self.is_initialized = False
        self._corpus_cache: Dict[str, RagCorpus] = {}

    async def initialize(self):
        """
        Inicializa o cliente Vertex AI.

        Raises:
            RuntimeError: Se a inicialização falhar
        """
        if self.is_initialized:
            return

        self.logger.info(
            "🚀 Initializing RAG Service",
            project_id=self.config.project_id,
            location=self.config.location
        )

        try:
            # Inicializa Vertex AI
            aiplatform.init(
                project=self.config.project_id,
                location=self.config.location
            )

            self.is_initialized = True
            self.logger.info("✅ RAG Service initialized successfully")

        except Exception as e:
            self.logger.error(
                "❌ Failed to initialize RAG Service",
                error=str(e),
                error_type=type(e).__name__
            )
            raise RuntimeError(f"RAG Service initialization failed: {str(e)}")

    async def cleanup(self):
        """Limpa recursos do serviço."""
        self.logger.info("🧹 Cleaning up RAG Service")
        self._corpus_cache.clear()
        self.is_initialized = False

    # ==================== Corpus Management ====================

    async def create_corpus(
        self,
        corpus_config: CorpusConfig
    ) -> RagCorpus:
        """
        Cria novo RAG corpus.

        Args:
            corpus_config: Configuração do corpus

        Returns:
            Corpus criado

        Raises:
            ValueError: Se a configuração for inválida
            RuntimeError: Se a criação falhar
        """
        await self._ensure_initialized()

        corpus_name = corpus_config.get_corpus_name()

        self.logger.info(
            "📚 Creating RAG corpus",
            corpus_name=corpus_name,
            display_name=corpus_config.display_name
        )

        try:
            # Cria corpus no Vertex AI
            vertex_corpus = rag.create_corpus(
                display_name=corpus_config.display_name,
                description=corpus_config.description
            )

            # Cria modelo local
            corpus = RagCorpus(
                corpus_id=vertex_corpus.name.split('/')[-1],
                corpus_name=corpus_name,
                display_name=corpus_config.display_name,
                description=corpus_config.description,
                organization_id=corpus_config.organization_id,
                is_shared=corpus_config.is_shared,
                corpus_type=corpus_config.corpus_type,
                status=CorpusStatus.ACTIVE,
                created_at=datetime.utcnow(),
                metadata={
                    'vertex_corpus_name': vertex_corpus.name,
                    'created_by': 'rag_service'
                }
            )

            # Cache
            self._corpus_cache[corpus.corpus_id] = corpus

            self.logger.info(
                "✅ RAG corpus created successfully",
                corpus_id=corpus.corpus_id,
                corpus_name=corpus_name
            )

            return corpus

        except Exception as e:
            self.logger.error(
                "❌ Failed to create corpus",
                corpus_name=corpus_name,
                error=str(e)
            )
            raise RuntimeError(f"Failed to create corpus: {str(e)}")

    async def get_corpus(self, corpus_id: str) -> Optional[RagCorpus]:
        """
        Recupera corpus por ID.

        Args:
            corpus_id: ID do corpus

        Returns:
            Corpus encontrado ou None
        """
        await self._ensure_initialized()

        # Verifica cache
        if corpus_id in self._corpus_cache:
            return self._corpus_cache[corpus_id]

        self.logger.info("🔍 Fetching corpus", corpus_id=corpus_id)

        try:
            # Busca no Vertex AI
            corpus_name = f"projects/{self.config.project_id}/locations/{self.config.location}/ragCorpora/{corpus_id}"
            vertex_corpus = rag.get_corpus(name=corpus_name)

            # Converte para modelo local
            corpus = self._vertex_corpus_to_model(vertex_corpus)

            # Cache
            self._corpus_cache[corpus_id] = corpus

            return corpus

        except gcp_exceptions.NotFound:
            self.logger.warning("⚠️ Corpus not found", corpus_id=corpus_id)
            return None
        except Exception as e:
            self.logger.error(
                "❌ Failed to fetch corpus",
                corpus_id=corpus_id,
                error=str(e)
            )
            return None

    async def list_corpora(
        self,
        organization_id: Optional[str] = None
    ) -> List[RagCorpus]:
        """
        Lista todos os corpus.

        Args:
            organization_id: Filtrar por organização (opcional)

        Returns:
            Lista de corpus
        """
        await self._ensure_initialized()

        self.logger.info("📋 Listing corpora", organization_id=organization_id)

        try:
            # Lista do Vertex AI
            vertex_corpora = rag.list_corpora()

            corpora = []
            for vertex_corpus in vertex_corpora:
                corpus = self._vertex_corpus_to_model(vertex_corpus)

                # Filtro por organização
                if organization_id:
                    if corpus.organization_id == organization_id:
                        corpora.append(corpus)
                else:
                    corpora.append(corpus)

                # Cache
                self._corpus_cache[corpus.corpus_id] = corpus

            self.logger.info(
                "✅ Listed corpora",
                total=len(corpora),
                filtered_by_org=organization_id is not None
            )

            return corpora

        except Exception as e:
            self.logger.error("❌ Failed to list corpora", error=str(e))
            return []

    async def delete_corpus(self, corpus_id: str) -> bool:
        """
        Deleta corpus.

        Args:
            corpus_id: ID do corpus

        Returns:
            True se deletado com sucesso
        """
        await self._ensure_initialized()

        self.logger.info("🗑️ Deleting corpus", corpus_id=corpus_id)

        try:
            corpus_name = f"projects/{self.config.project_id}/locations/{self.config.location}/ragCorpora/{corpus_id}"
            rag.delete_corpus(name=corpus_name)

            # Remove do cache
            self._corpus_cache.pop(corpus_id, None)

            self.logger.info("✅ Corpus deleted successfully", corpus_id=corpus_id)
            return True

        except Exception as e:
            self.logger.error(
                "❌ Failed to delete corpus",
                corpus_id=corpus_id,
                error=str(e)
            )
            return False

    # ==================== Document Import ====================

    async def import_files(
        self,
        corpus_id: str,
        source_uris: List[str],
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None
    ) -> ImportResult:
        """
        Importa arquivos para o corpus.

        Args:
            corpus_id: ID do corpus
            source_uris: Lista de GCS URIs (gs://bucket/path)
            chunk_size: Tamanho do chunk (opcional)
            chunk_overlap: Overlap entre chunks (opcional)

        Returns:
            Resultado da importação
        """
        await self._ensure_initialized()

        chunk_size = chunk_size or self.config.default_chunk_size
        chunk_overlap = chunk_overlap or self.config.default_chunk_overlap

        self.logger.info(
            "📥 Importing files to corpus",
            corpus_id=corpus_id,
            file_count=len(source_uris),
            chunk_size=chunk_size
        )

        start_time = time.time()
        successful = 0
        failed = 0
        errors = []

        try:
            corpus_name = f"projects/{self.config.project_id}/locations/{self.config.location}/ragCorpora/{corpus_id}"

            # Importa arquivos
            response = await rag.import_files_async(
                corpus_name=corpus_name,
                paths=source_uris,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                max_embedding_requests_per_min=self.config.embedding_batch_size
            )

            # Processa resultado
            successful = len(source_uris) - len(response.failed_samples)
            failed = len(response.failed_samples)

            for failed_sample in response.failed_samples:
                errors.append({
                    'file': failed_sample.gcs_uri,
                    'error': failed_sample.error_message
                })

            import_time = time.time() - start_time

            result = ImportResult(
                corpus_id=corpus_id,
                total_documents=len(source_uris),
                successful=successful,
                failed=failed,
                skipped=0,
                import_time_seconds=import_time,
                errors=errors
            )

            self.logger.info(
                "✅ File import completed",
                corpus_id=corpus_id,
                successful=successful,
                failed=failed,
                import_time=f"{import_time:.2f}s"
            )

            return result

        except Exception as e:
            self.logger.error(
                "❌ File import failed",
                corpus_id=corpus_id,
                error=str(e)
            )

            return ImportResult(
                corpus_id=corpus_id,
                total_documents=len(source_uris),
                successful=0,
                failed=len(source_uris),
                skipped=0,
                import_time_seconds=time.time() - start_time,
                errors=[{'error': str(e)}]
            )

    # ==================== Retrieval ====================

    async def retrieve_contexts(
        self,
        corpus_id: str,
        query: str,
        similarity_top_k: Optional[int] = None,
        vector_distance_threshold: Optional[float] = None
    ) -> RetrievalResult:
        """
        Recupera contextos relevantes do corpus.

        Args:
            corpus_id: ID do corpus
            query: Query de busca
            similarity_top_k: Número de resultados (opcional)
            vector_distance_threshold: Threshold de distância (opcional)

        Returns:
            Resultado da recuperação
        """
        await self._ensure_initialized()

        similarity_top_k = similarity_top_k or self.config.default_similarity_top_k
        vector_distance_threshold = vector_distance_threshold or self.config.default_vector_distance_threshold

        self.logger.info(
            "🔍 Retrieving contexts",
            corpus_id=corpus_id,
            query_length=len(query),
            top_k=similarity_top_k
        )

        start_time = time.time()

        try:
            corpus_name = f"projects/{self.config.project_id}/locations/{self.config.location}/ragCorpora/{corpus_id}"

            # Recupera contextos
            response = rag.retrieval_query(
                rag_resources=[
                    rag.RagResource(rag_corpus=corpus_name)
                ],
                text=query,
                similarity_top_k=similarity_top_k,
                vector_distance_threshold=vector_distance_threshold
            )

            # Converte para modelo
            contexts = []
            for ctx in response.contexts.contexts:
                retrieved_ctx = RetrievedContext(
                    source_document_id=ctx.source_uri.split('/')[-1],
                    source_file_name=ctx.source_uri.split('/')[-1],
                    chunk_text=ctx.text,
                    relevance_score=1.0 - ctx.distance,  # Convert distance to relevance
                    distance=ctx.distance,
                    metadata={
                        'source_uri': ctx.source_uri,
                        'chunk_index': getattr(ctx, 'chunk_index', 0)
                    }
                )
                contexts.append(retrieved_ctx)

            retrieval_time = (time.time() - start_time) * 1000  # ms

            result = RetrievalResult(
                query=query,
                contexts=contexts,
                total_found=len(contexts),
                corpus_ids_searched=[corpus_id],
                retrieval_time_ms=retrieval_time
            )

            self.logger.info(
                "✅ Contexts retrieved",
                corpus_id=corpus_id,
                contexts_found=len(contexts),
                retrieval_time_ms=f"{retrieval_time:.2f}ms"
            )

            return result

        except Exception as e:
            self.logger.error(
                "❌ Context retrieval failed",
                corpus_id=corpus_id,
                error=str(e)
            )

            return RetrievalResult(
                query=query,
                contexts=[],
                total_found=0,
                corpus_ids_searched=[corpus_id],
                retrieval_time_ms=(time.time() - start_time) * 1000,
                metadata={'error': str(e)}
            )

    # ==================== Generation with RAG ====================

    async def generate_with_rag(
        self,
        corpus_id: str,
        query: str,
        model_name: Optional[str] = None,
        temperature: Optional[float] = None,
        max_output_tokens: Optional[int] = None
    ) -> RAGResponse:
        """
        Gera resposta usando RAG (Retrieval-Augmented Generation).

        Args:
            corpus_id: ID do corpus
            query: Query/prompt
            model_name: Nome do modelo (opcional)
            temperature: Temperatura (opcional)
            max_output_tokens: Max tokens de saída (opcional)

        Returns:
            Resposta gerada com fontes
        """
        await self._ensure_initialized()

        model_name = model_name or self.config.default_model
        temperature = temperature or self.config.default_temperature
        max_output_tokens = max_output_tokens or self.config.default_max_output_tokens

        self.logger.info(
            "🤖 Generating with RAG",
            corpus_id=corpus_id,
            model=model_name,
            query_length=len(query)
        )

        start_time = time.time()

        try:
            corpus_name = f"projects/{self.config.project_id}/locations/{self.config.location}/ragCorpora/{corpus_id}"

            # Cria modelo
            model = GenerativeModel(model_name)

            # Cria ferramenta RAG
            rag_retrieval_tool = Tool.from_retrieval(
                retrieval=rag.Retrieval(
                    source=rag.VertexRagStore(
                        rag_resources=[rag.RagResource(rag_corpus=corpus_name)],
                        similarity_top_k=self.config.default_similarity_top_k,
                        vector_distance_threshold=self.config.default_vector_distance_threshold
                    )
                )
            )

            # Gera resposta
            response = model.generate_content(
                query,
                tools=[rag_retrieval_tool],
                generation_config={
                    "temperature": temperature,
                    "top_p": self.config.default_top_p,
                    "max_output_tokens": max_output_tokens,
                }
            )

            # Extrai texto da resposta
            answer_text = response.text

            # Extrai fontes das grounding metadata
            sources = self._extract_sources_from_response(response)

            generation_time = (time.time() - start_time) * 1000  # ms

            rag_response = RAGResponse(
                answer=answer_text,
                sources=sources,
                confidence=0.90,  # Alta confiança por ser fundamentado
                model_used=model_name,
                contexts_used=len(sources),
                generation_time_ms=generation_time,
                metadata={
                    'corpus_id': corpus_id,
                    'temperature': temperature
                }
            )

            self.logger.info(
                "✅ Generation completed",
                corpus_id=corpus_id,
                sources_count=len(sources),
                generation_time_ms=f"{generation_time:.2f}ms"
            )

            return rag_response

        except Exception as e:
            self.logger.error(
                "❌ Generation with RAG failed",
                corpus_id=corpus_id,
                error=str(e)
            )

            # Retorna resposta de erro
            return RAGResponse(
                answer=f"Erro ao gerar resposta: {str(e)}",
                sources=[],
                confidence=0.0,
                model_used=model_name,
                contexts_used=0,
                generation_time_ms=(time.time() - start_time) * 1000,
                metadata={'error': str(e)}
            )

    # ==================== Helper Methods ====================

    async def _ensure_initialized(self):
        """Garante que o serviço está inicializado."""
        if not self.is_initialized:
            await self.initialize()

    def _vertex_corpus_to_model(self, vertex_corpus: VertexRagCorpus) -> RagCorpus:
        """Converte Vertex RAG Corpus para modelo local."""
        corpus_id = vertex_corpus.name.split('/')[-1]

        return RagCorpus(
            corpus_id=corpus_id,
            corpus_name=vertex_corpus.display_name,
            display_name=vertex_corpus.display_name,
            description=getattr(vertex_corpus, 'description', ''),
            status=CorpusStatus.ACTIVE,
            metadata={'vertex_corpus_name': vertex_corpus.name}
        )

    def _extract_sources_from_response(self, response) -> List[Source]:
        """Extrai fontes da resposta do modelo."""
        sources = []

        # Tenta extrair grounding metadata
        if hasattr(response, 'grounding_metadata'):
            grounding = response.grounding_metadata

            if hasattr(grounding, 'grounding_chunks'):
                for chunk in grounding.grounding_chunks:
                    source = Source(
                        title=chunk.web.title if hasattr(chunk, 'web') else "Documento",
                        excerpt=chunk.text[:200] if len(chunk.text) > 200 else chunk.text,
                        relevance_score=chunk.relevance_score if hasattr(chunk, 'relevance_score') else 0.8,
                        document_id=chunk.document_id if hasattr(chunk, 'document_id') else "unknown",
                        metadata={'uri': chunk.uri if hasattr(chunk, 'uri') else ''}
                    )
                    sources.append(source)

        return sources
