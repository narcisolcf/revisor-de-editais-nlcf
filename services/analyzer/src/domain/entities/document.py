"""
Document Entity - Refatorada

Entidade central representando documentos no sistema.
Contém regras de negócio puras, sem dependências externas.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import hashlib


class DocumentType(str, Enum):
    """Tipos de documento suportados pelo sistema."""
    EDITAL = "edital"
    PREGAO = "pregao"
    CONTRATO = "contrato"
    TERMO_REFERENCIA = "termo_referencia"
    ATA_REGISTRO_PRECOS = "ata_registro_precos"
    TOMADA_PRECOS = "tomada_precos"
    CONCORRENCIA = "concorrencia"
    CONVITE = "convite"
    DOCUMENTO_GENERICO = "documento_generico"


class DocumentStatus(str, Enum):
    """Estados possíveis de um documento."""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    PROCESSED = "processed"
    ANALYSIS_READY = "analysis_ready"
    ANALYZED = "analyzed"
    ERROR = "error"


@dataclass(frozen=True)
class DocumentId:
    """Value Object para ID de documento."""
    value: str

    def __post_init__(self):
        if not self.value or len(self.value) < 3:
            raise ValueError("Document ID deve ter pelo menos 3 caracteres")

    def __str__(self) -> str:
        return self.value


@dataclass
class DocumentMetadata:
    """Metadados do documento."""
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    language: Optional[str] = "pt-BR"
    encoding: Optional[str] = "utf-8"
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    extracted_at: Optional[datetime] = None
    extraction_method: Optional[str] = None
    custom_metadata: Dict[str, Any] = field(default_factory=dict)

    def add_custom_metadata(self, key: str, value: Any) -> None:
        """Adiciona metadado personalizado."""
        self.custom_metadata[key] = value

    def get_custom_metadata(self, key: str, default: Any = None) -> Any:
        """Obtém metadado personalizado."""
        return self.custom_metadata.get(key, default)


@dataclass
class Document:
    """
    Entidade Document refatorada seguindo princípios de Clean Architecture.
    
    Representa um documento no sistema com suas propriedades essenciais
    e regras de negócio relacionadas.
    """
    id: DocumentId
    title: str
    content: str
    document_type: DocumentType = DocumentType.DOCUMENTO_GENERICO
    status: DocumentStatus = DocumentStatus.UPLOADED
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    version: int = 1
    tags: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Validações pós-inicialização."""
        self._validate()
        self._update_computed_metadata()

    def _validate(self) -> None:
        """Valida invariantes da entidade."""
        if not self.title.strip():
            raise ValueError("Título do documento não pode estar vazio")
        
        if not self.content.strip():
            raise ValueError("Conteúdo do documento não pode estar vazio")
        
        if len(self.content) > 10_000_000:  # 10MB limite
            raise ValueError("Conteúdo do documento excede limite de 10MB")

    def _update_computed_metadata(self) -> None:
        """Atualiza metadados computados."""
        if self.content:
            self.metadata.character_count = len(self.content)
            self.metadata.word_count = len(self.content.split())

    def update_content(self, new_content: str) -> None:
        """
        Atualiza conteúdo do documento com validações.
        
        Args:
            new_content: Novo conteúdo do documento
        """
        if not new_content.strip():
            raise ValueError("Novo conteúdo não pode estar vazio")
        
        self.content = new_content.strip()
        self.updated_at = datetime.utcnow()
        self.version += 1
        self._update_computed_metadata()

    def change_status(self, new_status: DocumentStatus) -> None:
        """
        Muda status do documento seguindo regras de transição.
        
        Args:
            new_status: Novo status do documento
        """
        valid_transitions = {
            DocumentStatus.UPLOADED: [DocumentStatus.PROCESSING, DocumentStatus.ERROR],
            DocumentStatus.PROCESSING: [DocumentStatus.PROCESSED, DocumentStatus.ERROR],
            DocumentStatus.PROCESSED: [DocumentStatus.ANALYSIS_READY, DocumentStatus.ERROR],
            DocumentStatus.ANALYSIS_READY: [DocumentStatus.ANALYZED, DocumentStatus.ERROR],
            DocumentStatus.ANALYZED: [DocumentStatus.ANALYSIS_READY],  # Pode re-analisar
            DocumentStatus.ERROR: [DocumentStatus.PROCESSING]  # Pode tentar reprocessar
        }
        
        if new_status not in valid_transitions.get(self.status, []):
            raise ValueError(
                f"Transição inválida de {self.status.value} para {new_status.value}"
            )
        
        self.status = new_status
        self.updated_at = datetime.utcnow()

    def add_tag(self, tag: str) -> None:
        """Adiciona tag ao documento."""
        tag = tag.strip().lower()
        if tag and tag not in self.tags:
            self.tags.append(tag)
            self.updated_at = datetime.utcnow()

    def remove_tag(self, tag: str) -> None:
        """Remove tag do documento."""
        tag = tag.strip().lower()
        if tag in self.tags:
            self.tags.remove(tag)
            self.updated_at = datetime.utcnow()

    def has_tag(self, tag: str) -> bool:
        """Verifica se documento possui tag."""
        return tag.strip().lower() in self.tags

    def get_content_hash(self) -> str:
        """Gera hash do conteúdo para detecção de mudanças."""
        return hashlib.sha256(self.content.encode()).hexdigest()

    def get_excerpt(self, max_length: int = 500) -> str:
        """
        Obtém trecho do documento para preview.
        
        Args:
            max_length: Comprimento máximo do trecho
            
        Returns:
            Trecho do conteúdo do documento
        """
        content = self.content.strip()
        if len(content) <= max_length:
            return content
        
        # Tenta cortar em uma sentença completa
        excerpt = content[:max_length]
        last_period = excerpt.rfind('.')
        last_exclamation = excerpt.rfind('!')
        last_question = excerpt.rfind('?')
        
        last_sentence_end = max(last_period, last_exclamation, last_question)
        
        if last_sentence_end > max_length * 0.7:  # Se encontrou fim de sentença após 70% do trecho
            return excerpt[:last_sentence_end + 1]
        
        return excerpt + "..."

    def is_content_similar_to(self, other_content: str, threshold: float = 0.9) -> bool:
        """
        Verifica se conteúdo é similar a outro (detecção de duplicatas).
        
        Args:
            other_content: Outro conteúdo para comparar
            threshold: Limiar de similaridade (0.0 a 1.0)
            
        Returns:
            True se conteúdos são similares
        """
        if not other_content:
            return False
        
        # Algoritmo simples baseado em palavras comuns
        words1 = set(self.content.lower().split())
        words2 = set(other_content.lower().split())
        
        if not words1 or not words2:
            return False
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        similarity = len(intersection) / len(union) if union else 0
        return similarity >= threshold

    def get_readability_metrics(self) -> Dict[str, Any]:
        """
        Calcula métricas básicas de legibilidade.
        
        Returns:
            Dict com métricas de legibilidade
        """
        if not self.content.strip():
            return {}
        
        sentences = [s.strip() for s in self.content.split('.') if s.strip()]
        paragraphs = [p.strip() for p in self.content.split('\n\n') if p.strip()]
        words = self.content.split()
        
        return {
            'sentences_count': len(sentences),
            'paragraphs_count': len(paragraphs),
            'words_count': len(words),
            'characters_count': len(self.content),
            'avg_words_per_sentence': len(words) / len(sentences) if sentences else 0,
            'avg_sentences_per_paragraph': len(sentences) / len(paragraphs) if paragraphs else 0,
            'avg_characters_per_word': sum(len(w) for w in words) / len(words) if words else 0
        }

    def to_dict(self) -> Dict[str, Any]:
        """Converte entidade para dicionário."""
        return {
            'id': str(self.id),
            'title': self.title,
            'content': self.content,
            'document_type': self.document_type.value,
            'status': self.status.value,
            'metadata': {
                'file_name': self.metadata.file_name,
                'file_type': self.metadata.file_type,
                'file_size': self.metadata.file_size,
                'language': self.metadata.language,
                'word_count': self.metadata.word_count,
                'character_count': self.metadata.character_count,
                'custom_metadata': self.metadata.custom_metadata
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'version': self.version,
            'tags': self.tags,
            'content_hash': self.get_content_hash(),
            'readability_metrics': self.get_readability_metrics()
        }

    @classmethod
    def create(
        cls,
        document_id: str,
        title: str,
        content: str,
        document_type: DocumentType = DocumentType.DOCUMENTO_GENERICO,
        metadata: Optional[DocumentMetadata] = None
    ) -> 'Document':
        """
        Factory method para criar documento.
        
        Args:
            document_id: ID único do documento
            title: Título do documento
            content: Conteúdo textual
            document_type: Tipo do documento
            metadata: Metadados opcionais
            
        Returns:
            Nova instância de Document
        """
        return cls(
            id=DocumentId(document_id),
            title=title.strip(),
            content=content.strip(),
            document_type=document_type,
            metadata=metadata or DocumentMetadata()
        )

    def __eq__(self, other) -> bool:
        """Igualdade baseada no ID."""
        if not isinstance(other, Document):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash baseado no ID."""
        return hash(self.id)

    def __str__(self) -> str:
        """Representação string."""
        return f"Document(id={self.id}, title='{self.title[:50]}...', type={self.document_type.value})"