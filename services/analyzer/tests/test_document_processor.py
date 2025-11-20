"""
Testes para Document Processor

Testa chunking, metadata extraction e GCS upload.
"""

import pytest
from unittest.mock import Mock, patch, AsyncMock

from src.services.document_processor import (
    SmartChunker,
    MetadataExtractor,
    TokenCounter,
    DocumentProcessor
)
from src.models.document_models import Document
from src.config_rag import ChunkConfig


class TestTokenCounter:
    """Testes para TokenCounter."""

    def test_count_tokens_simple(self):
        """Testa contagem de tokens simples."""
        counter = TokenCounter()
        text = "Hello world, this is a test."
        count = counter.count_tokens(text)
        assert count > 0
        assert isinstance(count, int)

    def test_count_tokens_empty(self):
        """Testa contagem com texto vazio."""
        counter = TokenCounter()
        count = counter.count_tokens("")
        assert count == 0


class TestSmartChunker:
    """Testes para SmartChunker."""

    @pytest.fixture
    def chunker(self):
        """Fixture do chunker."""
        config = ChunkConfig(chunk_size=100, chunk_overlap=20)
        return SmartChunker(config)

    def test_chunk_small_document(self, chunker):
        """Testa chunking de documento pequeno."""
        text = "Este é um documento pequeno para teste."
        chunks = chunker.chunk_document(text, "doc-123")

        assert len(chunks) >= 1
        assert all(chunk.document_id == "doc-123" for chunk in chunks)
        assert all(isinstance(chunk.chunk_index, int) for chunk in chunks)

    def test_chunk_large_document(self, chunker):
        """Testa chunking de documento grande."""
        # Cria documento grande
        text = " ".join([f"Palavra {i}" for i in range(500)])
        chunks = chunker.chunk_document(text, "doc-456")

        assert len(chunks) > 1
        # Verifica overlap
        for i in range(len(chunks) - 1):
            assert chunks[i].chunk_index == i

    def test_chunk_with_sections(self):
        """Testa chunking preservando seções."""
        config = ChunkConfig(chunk_size=512, preserve_sections=True)
        chunker = SmartChunker(config)

        text = """
        Art. 1º Este é o primeiro artigo.
        Algum conteúdo aqui.

        Art. 2º Este é o segundo artigo.
        Mais conteúdo aqui.
        """

        chunks = chunker.chunk_document(text, "doc-789")
        assert len(chunks) >= 1


class TestMetadataExtractor:
    """Testes para MetadataExtractor."""

    @pytest.fixture
    def extractor(self):
        """Fixture do extractor."""
        return MetadataExtractor()

    @pytest.mark.asyncio
    async def test_extract_document_type(self, extractor):
        """Testa extração de tipo de documento."""
        document = Document(
            id="test-doc",
            title="Edital Pregão 001/2024",
            content="EDITAL DE PREGÃO ELETRÔNICO Nº 001/2024...",
            file_type="text/plain"
        )

        metadata = await extractor.extract(document)

        assert metadata['document_type'] == 'Edital'
        assert metadata['document_id'] == 'test-doc'

    @pytest.mark.asyncio
    async def test_extract_modalidade(self, extractor):
        """Testa extração de modalidade."""
        document = Document(
            id="test-doc",
            title="Teste",
            content="Este é um pregão eletrônico para aquisição...",
            file_type="text/plain"
        )

        metadata = await extractor.extract(document)

        assert metadata['modalidade'] == 'Pregão Eletrônico'

    @pytest.mark.asyncio
    async def test_extract_value(self, extractor):
        """Testa extração de valor."""
        document = Document(
            id="test-doc",
            title="Teste",
            content="Valor estimado: R$ 150.000,00",
            file_type="text/plain"
        )

        metadata = await extractor.extract(document)

        assert 'R$' in metadata.get('valor_estimado', '')


class TestDocumentProcessor:
    """Testes para DocumentProcessor completo."""

    @pytest.fixture
    def processor(self):
        """Fixture do processor."""
        with patch('src.services.document_processor.GCSDocumentManager'):
            return DocumentProcessor()

    @pytest.mark.asyncio
    async def test_process_for_rag(self, processor):
        """Testa processamento completo para RAG."""
        document = Document(
            id="test-doc",
            title="Edital Teste",
            content="EDITAL DE PREGÃO ELETRÔNICO. " + " ".join([f"Item {i}" for i in range(200)]),
            file_type="text/plain"
        )

        # Mock GCS upload
        processor.gcs_manager.upload_for_rag = AsyncMock(
            return_value="gs://bucket/test-doc.txt"
        )

        processed = await processor.process_for_rag(document, "org-123")

        assert processed.document_id == "test-doc"
        assert processed.total_chunks > 0
        assert processed.total_tokens > 0
        assert processed.gcs_uri == "gs://bucket/test-doc.txt"
        assert len(processed.chunks) == processed.total_chunks


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
