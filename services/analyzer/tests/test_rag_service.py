"""
Testes para RAG Service

Testes básicos para validar funcionalidade do RAGService.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

from src.services.rag_service import RAGService
from src.models.rag_models import RagCorpus, CorpusStatus
from src.config_rag import CorpusConfig


class TestRAGService:
    """Testes para RAGService."""

    @pytest.fixture
    def rag_service(self):
        """Fixture do RAGService."""
        return RAGService()

    @pytest.fixture
    def corpus_config(self):
        """Fixture de configuração de corpus."""
        return CorpusConfig(
            display_name="Test Corpus",
            description="Corpus de teste",
            organization_id="org-123",
            is_shared=False,
            corpus_type="private"
        )

    @pytest.mark.asyncio
    async def test_initialize(self, rag_service):
        """Testa inicialização do serviço."""
        with patch('google.cloud.aiplatform.init'):
            await rag_service.initialize()
            assert rag_service.is_initialized

    @pytest.mark.asyncio
    async def test_create_corpus(self, rag_service, corpus_config):
        """Testa criação de corpus."""
        with patch('src.services.rag_service.rag.create_corpus') as mock_create:
            # Mock do corpus criado
            mock_vertex_corpus = Mock()
            mock_vertex_corpus.name = "projects/test/locations/us/ragCorpora/123"
            mock_create.return_value = mock_vertex_corpus

            rag_service.is_initialized = True

            corpus = await rag_service.create_corpus(corpus_config)

            assert corpus.display_name == corpus_config.display_name
            assert corpus.organization_id == corpus_config.organization_id
            assert corpus.status == CorpusStatus.ACTIVE

    @pytest.mark.asyncio
    async def test_import_files(self, rag_service):
        """Testa importação de arquivos."""
        with patch('src.services.rag_service.rag.import_files_async') as mock_import:
            # Mock da resposta de importação
            mock_response = Mock()
            mock_response.failed_samples = []
            mock_import.return_value = mock_response

            rag_service.is_initialized = True

            result = await rag_service.import_files(
                corpus_id="test-corpus",
                source_uris=["gs://bucket/file1.txt", "gs://bucket/file2.txt"],
                chunk_size=512
            )

            assert result.successful == 2
            assert result.failed == 0
            assert result.total_documents == 2

    @pytest.mark.asyncio
    async def test_retrieve_contexts(self, rag_service):
        """Testa recuperação de contextos."""
        with patch('src.services.rag_service.rag.retrieval_query') as mock_retrieval:
            # Mock da resposta de retrieval
            mock_context = Mock()
            mock_context.text = "Contexto relevante"
            mock_context.distance = 0.3
            mock_context.source_uri = "gs://bucket/doc.txt"

            mock_response = Mock()
            mock_response.contexts.contexts = [mock_context]
            mock_retrieval.return_value = mock_response

            rag_service.is_initialized = True

            result = await rag_service.retrieve_contexts(
                corpus_id="test-corpus",
                query="test query"
            )

            assert result.total_found == 1
            assert len(result.contexts) == 1
            assert result.contexts[0].chunk_text == "Contexto relevante"

    @pytest.mark.asyncio
    async def test_generate_with_rag(self, rag_service):
        """Testa geração com RAG."""
        with patch('src.services.rag_service.GenerativeModel') as mock_model_class:
            # Mock do modelo e resposta
            mock_response = Mock()
            mock_response.text = "Resposta gerada com RAG"

            mock_model = Mock()
            mock_model.generate_content.return_value = mock_response
            mock_model_class.return_value = mock_model

            rag_service.is_initialized = True

            result = await rag_service.generate_with_rag(
                corpus_id="test-corpus",
                query="test query"
            )

            assert result.answer == "Resposta gerada com RAG"
            assert result.confidence > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
