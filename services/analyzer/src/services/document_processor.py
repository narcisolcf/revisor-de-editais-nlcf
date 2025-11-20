"""
Document Processor para RAG

Processa documentos para uso no Vertex AI RAG Engine:
- Chunking inteligente preservando contexto
- Extração de metadata
- Upload para GCS
- Token counting
"""

import re
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
import structlog

try:
    import tiktoken
except ImportError:
    tiktoken = None

from google.cloud import storage

from ..config_rag import get_rag_config, ChunkConfig
from ..models.document_models import Document
from ..models.rag_models import (
    DocumentChunk,
    ProcessedDocument,
)

logger = structlog.get_logger(__name__)


class TokenCounter:
    """Contador de tokens para diferentes modelos."""

    def __init__(self, model: str = "gpt-3.5-turbo"):
        """
        Inicializa contador de tokens.

        Args:
            model: Nome do modelo para encoding
        """
        self.model = model
        self.encoding = None

        if tiktoken:
            try:
                self.encoding = tiktoken.encoding_for_model(model)
            except Exception:
                # Fallback para cl100k_base (usado pelo GPT-4)
                self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        """
        Conta tokens no texto.

        Args:
            text: Texto para contar

        Returns:
            Número de tokens
        """
        if self.encoding:
            return len(self.encoding.encode(text))
        else:
            # Estimativa aproximada: 1 token ≈ 4 caracteres
            return len(text) // 4


class SmartChunker:
    """
    Chunking inteligente que preserva estrutura semântica.

    Features:
    - Detecta seções (títulos, numeração)
    - Respeita limites de seção
    - Overlap contextual
    - Preserva metadata
    """

    def __init__(
        self,
        chunk_config: Optional[ChunkConfig] = None,
        token_counter: Optional[TokenCounter] = None
    ):
        """
        Inicializa chunker.

        Args:
            chunk_config: Configuração de chunking
            token_counter: Contador de tokens
        """
        self.config = chunk_config or ChunkConfig()
        self.config.validate_config()
        self.token_counter = token_counter or TokenCounter()
        self.logger = structlog.get_logger(self.__class__.__name__)

    def chunk_document(
        self,
        text: str,
        document_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[DocumentChunk]:
        """
        Divide documento em chunks preservando contexto.

        Strategy:
        1. Identifica seções (títulos, numeração)
        2. Divide respeitando limites de seção
        3. Adiciona overlap para contexto
        4. Enriquece com metadata

        Args:
            text: Texto do documento
            document_id: ID do documento
            metadata: Metadata adicional

        Returns:
            Lista de chunks
        """
        metadata = metadata or {}

        self.logger.info(
            "📄 Chunking document",
            document_id=document_id,
            text_length=len(text),
            chunk_size=self.config.chunk_size
        )

        chunks = []

        if self.config.preserve_sections:
            # Detecta seções
            sections = self._detect_sections(text)

            self.logger.debug(
                "🔍 Sections detected",
                section_count=len(sections)
            )

            # Processa cada seção
            for section in sections:
                section_chunks = self._chunk_section(
                    section['content'],
                    section_metadata={
                        'section_title': section['title'],
                        'section_number': section['number'],
                        'section_level': section['level']
                    }
                )
                chunks.extend(section_chunks)
        else:
            # Chunking simples sem preservar seções
            chunks = self._chunk_text(text)

        # Adiciona metadata e IDs
        final_chunks = []
        for idx, chunk in enumerate(chunks):
            chunk_id = self._generate_chunk_id(document_id, idx)

            # Merge metadata
            chunk_metadata = {
                **metadata,
                **chunk.get('metadata', {}),
                'chunk_index': idx,
                'total_chunks': len(chunks)
            }

            document_chunk = DocumentChunk(
                chunk_id=chunk_id,
                document_id=document_id,
                chunk_index=idx,
                content=chunk['content'],
                token_count=chunk['token_count'],
                metadata=chunk_metadata
            )

            final_chunks.append(document_chunk)

        self.logger.info(
            "✅ Document chunked",
            document_id=document_id,
            total_chunks=len(final_chunks),
            avg_tokens=sum(c.token_count for c in final_chunks) / len(final_chunks) if final_chunks else 0
        )

        return final_chunks

    def _detect_sections(self, text: str) -> List[Dict[str, Any]]:
        """
        Detecta seções no documento.

        Patterns:
        - Títulos em CAPS
        - Numeração (1., 1.1., Art. 1, etc)
        - Separadores visuais

        Args:
            text: Texto do documento

        Returns:
            Lista de seções detectadas
        """
        sections = []

        # Patterns para detecção de seções
        patterns = [
            # Numeração artigos: "Art. 1º", "Artigo 1"
            (r'^(Art\.?\s*\d+º?|Artigo\s+\d+)', 1),
            # Numeração decimal: "1.", "1.1.", "1.1.1."
            (r'^(\d+(?:\.\d+)*\.)\s+', 1),
            # Títulos em CAPS: "CAPÍTULO I", "SEÇÃO II"
            (r'^([A-ZÀÁÂÃÄÅ\s]+:?\s*[IVXLCDM]+)', 1),
            # Alíneas: "a)", "b)", "I -", "II -"
            (r'^([a-z]\)|[IVXLCDM]+\s*[-–])\s+', 2),
        ]

        lines = text.split('\n')
        current_section = {
            'title': 'Preâmbulo',
            'number': '0',
            'level': 0,
            'content': '',
            'start_line': 0
        }

        for line_idx, line in enumerate(lines):
            line_stripped = line.strip()

            if not line_stripped:
                current_section['content'] += '\n'
                continue

            # Verifica se é início de seção
            is_section_start = False
            section_title = None
            section_number = None
            section_level = 0

            for pattern, level in patterns:
                match = re.match(pattern, line_stripped, re.IGNORECASE)
                if match:
                    is_section_start = True
                    section_number = match.group(1)
                    section_title = line_stripped
                    section_level = level
                    break

            if is_section_start and current_section['content'].strip():
                # Salva seção anterior
                sections.append(current_section.copy())

                # Inicia nova seção
                current_section = {
                    'title': section_title or 'Sem título',
                    'number': section_number or str(len(sections)),
                    'level': section_level,
                    'content': line + '\n',
                    'start_line': line_idx
                }
            else:
                current_section['content'] += line + '\n'

        # Adiciona última seção
        if current_section['content'].strip():
            sections.append(current_section)

        return sections

    def _chunk_section(
        self,
        text: str,
        section_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Divide seção em chunks respeitando tamanho máximo.

        Args:
            text: Texto da seção
            section_metadata: Metadata da seção

        Returns:
            Lista de chunks da seção
        """
        section_metadata = section_metadata or {}
        chunks = []

        # Se seção é pequena o suficiente, retorna como chunk único
        token_count = self.token_counter.count_tokens(text)
        if token_count <= self.config.chunk_size:
            chunks.append({
                'content': text,
                'token_count': token_count,
                'metadata': section_metadata
            })
            return chunks

        # Seção grande - divide em chunks
        paragraphs = text.split('\n\n')
        current_chunk = ''
        current_tokens = 0

        for paragraph in paragraphs:
            paragraph_tokens = self.token_counter.count_tokens(paragraph)

            # Se parágrafo sozinho excede chunk_size, divide por sentença
            if paragraph_tokens > self.config.chunk_size:
                # Flush chunk atual
                if current_chunk:
                    chunks.append({
                        'content': current_chunk,
                        'token_count': current_tokens,
                        'metadata': section_metadata
                    })
                    current_chunk = ''
                    current_tokens = 0

                # Divide parágrafo
                para_chunks = self._chunk_paragraph(paragraph, section_metadata)
                chunks.extend(para_chunks)
                continue

            # Verifica se adicionar parágrafo excede limite
            if current_tokens + paragraph_tokens > self.config.chunk_size:
                # Salva chunk atual
                if current_chunk:
                    chunks.append({
                        'content': current_chunk,
                        'token_count': current_tokens,
                        'metadata': section_metadata
                    })

                # Inicia novo chunk com overlap
                overlap_text = self._get_overlap_text(current_chunk)
                current_chunk = overlap_text + '\n\n' + paragraph
                current_tokens = self.token_counter.count_tokens(current_chunk)
            else:
                # Adiciona ao chunk atual
                current_chunk += ('\n\n' if current_chunk else '') + paragraph
                current_tokens += paragraph_tokens

        # Adiciona último chunk
        if current_chunk:
            chunks.append({
                'content': current_chunk,
                'token_count': current_tokens,
                'metadata': section_metadata
            })

        return chunks

    def _chunk_paragraph(
        self,
        paragraph: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Divide parágrafo muito grande em chunks por sentença."""
        chunks = []
        sentences = re.split(r'([.!?]+\s+)', paragraph)

        current_chunk = ''
        current_tokens = 0

        for sentence in sentences:
            if not sentence.strip():
                continue

            sentence_tokens = self.token_counter.count_tokens(sentence)

            if current_tokens + sentence_tokens > self.config.chunk_size:
                if current_chunk:
                    chunks.append({
                        'content': current_chunk,
                        'token_count': current_tokens,
                        'metadata': metadata or {}
                    })

                current_chunk = sentence
                current_tokens = sentence_tokens
            else:
                current_chunk += sentence
                current_tokens += sentence_tokens

        if current_chunk:
            chunks.append({
                'content': current_chunk,
                'token_count': current_tokens,
                'metadata': metadata or {}
            })

        return chunks

    def _chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """Chunking simples sem preservar seções."""
        chunks = []
        words = text.split()
        current_chunk = []
        current_tokens = 0

        for word in words:
            word_tokens = self.token_counter.count_tokens(word)

            if current_tokens + word_tokens > self.config.chunk_size:
                # Salva chunk atual
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    'content': chunk_text,
                    'token_count': current_tokens,
                    'metadata': {}
                })

                # Overlap
                overlap_words = current_chunk[-self.config.chunk_overlap:]
                current_chunk = overlap_words + [word]
                current_tokens = self.token_counter.count_tokens(' '.join(current_chunk))
            else:
                current_chunk.append(word)
                current_tokens += word_tokens

        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                'content': chunk_text,
                'token_count': current_tokens,
                'metadata': {}
            })

        return chunks

    def _get_overlap_text(self, text: str) -> str:
        """Extrai texto de overlap do final do chunk."""
        tokens = text.split()
        overlap_tokens = tokens[-self.config.chunk_overlap:]
        return ' '.join(overlap_tokens)

    def _generate_chunk_id(self, document_id: str, chunk_index: int) -> str:
        """Gera ID único para chunk."""
        return f"{document_id}_chunk_{chunk_index}"


class MetadataExtractor:
    """
    Extrai metadata relevante de documentos licitatórios.

    Extrai:
    - Tipo de documento
    - Modalidade
    - Órgão
    - Valor estimado
    - Prazos
    - Entidades nomeadas
    """

    def __init__(self):
        """Inicializa extrator de metadata."""
        self.logger = structlog.get_logger(self.__class__.__name__)

        # Patterns regex para extração
        self.patterns = {
            'modalidade': [
                (r'pregão\s+eletrônico', 'Pregão Eletrônico'),
                (r'pregão\s+presencial', 'Pregão Presencial'),
                (r'concorrência\s+pública', 'Concorrência Pública'),
                (r'tomada\s+de\s+preços', 'Tomada de Preços'),
                (r'convite', 'Convite'),
                (r'dispensa\s+de\s+licitação', 'Dispensa'),
                (r'inexigibilidade', 'Inexigibilidade'),
            ],
            'valor': [
                r'R\$\s*[\d.,]+',
                r'reais',
            ],
            'prazo': [
                r'\d+\s*\(\w+\)\s*dias',
                r'prazo\s+de\s+\d+\s+dias',
            ],
        }

    async def extract(self, document: Document) -> Dict[str, Any]:
        """
        Extrai metadata estruturada do documento.

        Args:
            document: Documento para extrair metadata

        Returns:
            Dicionário com metadata extraída
        """
        self.logger.info(
            "🔍 Extracting metadata",
            document_id=document.id
        )

        content = (document.content or '').lower()

        metadata = {
            'document_id': document.id,
            'document_title': document.title,
            'file_type': document.file_type,
            'extracted_at': datetime.utcnow().isoformat(),
        }

        # Tipo de documento
        metadata['document_type'] = self._extract_document_type(content)

        # Modalidade
        metadata['modalidade'] = self._extract_modalidade(content)

        # Valor
        metadata['valor_estimado'] = self._extract_value(content)

        # Prazo
        metadata['prazo'] = self._extract_deadline(content)

        # Número do edital/processo
        metadata['numero'] = self._extract_number(content)

        # Órgão
        metadata['orgao'] = self._extract_organ(document)

        self.logger.info(
            "✅ Metadata extracted",
            document_id=document.id,
            metadata_fields=len(metadata)
        )

        return metadata

    def _extract_document_type(self, content: str) -> str:
        """Extrai tipo do documento."""
        patterns = {
            'Edital': r'edital',
            'Termo de Referência': r'termo\s+de\s+referência',
            'Contrato': r'contrato',
            'Ata de Registro de Preços': r'ata\s+de\s+registro',
            'Projeto Básico': r'projeto\s+básico',
        }

        for doc_type, pattern in patterns.items():
            if re.search(pattern, content):
                return doc_type

        return 'Documento'

    def _extract_modalidade(self, content: str) -> Optional[str]:
        """Extrai modalidade da licitação."""
        for pattern, modalidade in self.patterns['modalidade']:
            if re.search(pattern, content):
                return modalidade
        return None

    def _extract_value(self, content: str) -> Optional[str]:
        """Extrai valor estimado."""
        match = re.search(r'R\$\s*([\d.,]+)', content)
        if match:
            return f"R$ {match.group(1)}"
        return None

    def _extract_deadline(self, content: str) -> Optional[str]:
        """Extrai prazo."""
        match = re.search(r'(\d+)\s*\(\w+\)\s*dias', content)
        if match:
            return f"{match.group(1)} dias"

        match = re.search(r'prazo\s+de\s+(\d+)\s+dias', content)
        if match:
            return f"{match.group(1)} dias"

        return None

    def _extract_number(self, content: str) -> Optional[str]:
        """Extrai número do processo/edital."""
        patterns = [
            r'(?:edital|pregão|processo)\s+(?:n[°º]?\.?)?\s*([\d/\-]+)',
            r'nº\s*([\d/\-]+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                return match.group(1)

        return None

    def _extract_organ(self, document: Document) -> Optional[str]:
        """Extrai órgão responsável."""
        # Tenta pegar de metadata existente
        if hasattr(document, 'metadata'):
            organ = document.metadata.get('organ') or document.metadata.get('organization')
            if organ:
                return organ

        # Busca no conteúdo
        content = (document.content or '')
        patterns = [
            r'prefeitura\s+municipal\s+de\s+(\w+)',
            r'governo\s+do\s+estado\s+(?:de|do)\s+(\w+)',
        ]

        for pattern in patterns:
            match = re.search(pattern, content, re.IGNORECASE)
            if match:
                return match.group(0)

        return None


class GCSDocumentManager:
    """
    Gerencia documentos no Google Cloud Storage para RAG.

    Features:
    - Upload de documentos processados
    - Organização por organização
    - Metadata management
    """

    def __init__(self, bucket_name: Optional[str] = None):
        """
        Inicializa gerenciador GCS.

        Args:
            bucket_name: Nome do bucket GCS
        """
        self.config = get_rag_config()
        self.bucket_name = bucket_name or self.config.gcs_bucket_name
        self.client = storage.Client(project=self.config.project_id)
        self.bucket = self.client.bucket(self.bucket_name)
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def upload_for_rag(
        self,
        document: Document,
        organization_id: str,
        processed_doc: Optional[ProcessedDocument] = None
    ) -> str:
        """
        Upload de documento processado para GCS.

        Args:
            document: Documento original
            organization_id: ID da organização
            processed_doc: Documento processado (opcional)

        Returns:
            GCS URI (gs://bucket/path/to/file)
        """
        self.logger.info(
            "☁️ Uploading document to GCS",
            document_id=document.id,
            organization_id=organization_id
        )

        try:
            # Define path no GCS
            blob_path = f"{self.config.gcs_base_path}/{organization_id}/{document.id}.txt"
            blob = self.bucket.blob(blob_path)

            # Prepara conteúdo
            if processed_doc:
                # Upload chunks concatenados
                content = self._concatenate_chunks(processed_doc.chunks)
            else:
                content = document.content or ''

            # Prepara metadata
            blob_metadata = {
                'organization_id': organization_id,
                'document_id': document.id,
                'document_type': document.get_document_type() if hasattr(document, 'get_document_type') else 'unknown',
                'uploaded_at': datetime.utcnow().isoformat(),
            }

            # Upload
            blob.metadata = blob_metadata
            blob.upload_from_string(
                content,
                content_type='text/plain',
                timeout=300
            )

            gcs_uri = f"gs://{self.bucket_name}/{blob_path}"

            self.logger.info(
                "✅ Document uploaded to GCS",
                document_id=document.id,
                gcs_uri=gcs_uri
            )

            return gcs_uri

        except Exception as e:
            self.logger.error(
                "❌ Failed to upload document to GCS",
                document_id=document.id,
                error=str(e)
            )
            raise

    def _concatenate_chunks(self, chunks: List[DocumentChunk]) -> str:
        """Concatena chunks em texto único."""
        return '\n\n'.join(chunk.content for chunk in chunks)


class DocumentProcessor:
    """
    Processador principal de documentos para RAG.

    Orquestra:
    - Chunking
    - Extração de metadata
    - Upload para GCS
    """

    def __init__(
        self,
        chunk_config: Optional[ChunkConfig] = None,
        gcs_manager: Optional[GCSDocumentManager] = None
    ):
        """
        Inicializa processador.

        Args:
            chunk_config: Configuração de chunking
            gcs_manager: Gerenciador GCS
        """
        self.chunker = SmartChunker(chunk_config)
        self.metadata_extractor = MetadataExtractor()
        self.gcs_manager = gcs_manager or GCSDocumentManager()
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def process_for_rag(
        self,
        document: Document,
        organization_id: Optional[str] = None
    ) -> ProcessedDocument:
        """
        Processa documento completo para RAG.

        Args:
            document: Documento para processar
            organization_id: ID da organização (para GCS upload)

        Returns:
            Documento processado com chunks e metadata
        """
        self.logger.info(
            "⚙️ Processing document for RAG",
            document_id=document.id,
            organization_id=organization_id
        )

        # Extrai metadata
        metadata = await self.metadata_extractor.extract(document)

        # Chunk document
        chunks = self.chunker.chunk_document(
            text=document.content or '',
            document_id=document.id,
            metadata=metadata
        )

        # Cria documento processado
        processed_doc = ProcessedDocument(
            document_id=document.id,
            original_content=document.content or '',
            chunks=chunks,
            total_chunks=len(chunks),
            total_tokens=sum(c.token_count for c in chunks),
            metadata=metadata
        )

        # Upload para GCS (se organização fornecida)
        if organization_id:
            gcs_uri = await self.gcs_manager.upload_for_rag(
                document,
                organization_id,
                processed_doc
            )
            processed_doc.gcs_uri = gcs_uri

        self.logger.info(
            "✅ Document processed for RAG",
            document_id=document.id,
            total_chunks=processed_doc.total_chunks,
            total_tokens=processed_doc.total_tokens,
            gcs_uri=processed_doc.gcs_uri
        )

        return processed_doc
