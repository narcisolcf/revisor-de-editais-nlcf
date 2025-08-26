"""
LicitaReview - Modelos de Documentos

Este módulo contém os modelos Pydantic para representar documentos licitatórios
e suas características no sistema LicitaReview.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from uuid import uuid4

from pydantic import BaseModel, Field, validator, root_validator
from pydantic.types import StrictStr, PositiveInt


class DocumentType(str, Enum):
    """
    Tipos de documentos licitatórios suportados pelo LicitaReview.
    
    Baseado na Lei 14.133/2021 e práticas comuns de licitação.
    """
    EDITAL = "edital"
    TERMO_REFERENCIA = "termo_referencia"
    ETP = "etp"  # Estudo Técnico Preliminar
    MAPA_RISCOS = "mapa_riscos"
    MINUTA_CONTRATO = "minuta_contrato"


class LicitationModality(str, Enum):
    """
    Modalidades de licitação conforme Lei 14.133/2021.
    """
    PREGAO_ELETRONICO = "pregao_eletronico"
    PREGAO_PRESENCIAL = "pregao_presencial"
    CONCORRENCIA = "concorrencia"
    TOMADA_PRECOS = "tomada_precos"
    CARTA_CONVITE = "carta_convite"
    CONCURSO = "concurso"
    LEILAO = "leilao"
    DIALOGO_COMPETITIVO = "dialogo_competitivo"


class DocumentStatus(str, Enum):
    """
    Status do documento no sistema de análise.
    """
    PENDING = "pending"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    REVIEWED = "reviewed"
    APPROVED = "approved"
    REJECTED = "rejected"


class DocumentClassification(BaseModel):
    """
    Classificação hierárquica do documento conforme estrutura do frontend.
    
    Permite classificação em múltiplos níveis para diferentes tipos de documento.
    """
    primary_category: StrictStr = Field(
        ..., 
        description="Categoria principal do documento",
        example="licitacao"
    )
    secondary_category: Optional[StrictStr] = Field(
        None,
        description="Subcategoria específica",
        example="bens_servicos"
    )
    document_type: DocumentType = Field(
        ...,
        description="Tipo específico do documento"
    )
    modality: Optional[LicitationModality] = Field(
        None,
        description="Modalidade licitatória (se aplicável)"
    )
    complexity_level: Optional[str] = Field(
        None,
        description="Nível de complexidade: simples, media, complexa",
        regex=r"^(simples|media|complexa)$"
    )
    
    class Config:
        """Configuração do modelo Pydantic."""
        use_enum_values = True
        validate_assignment = True
        
    def to_hierarchy_string(self) -> str:
        """
        Converte a classificação em uma string hierárquica.
        
        Returns:
            String no formato "primary/secondary/type"
        """
        parts = [self.primary_category]
        if self.secondary_category:
            parts.append(self.secondary_category)
        parts.append(self.document_type.value)
        return "/".join(parts)
    
    @classmethod
    def from_hierarchy_string(cls, hierarchy: str) -> "DocumentClassification":
        """
        Cria uma classificação a partir de uma string hierárquica.
        
        Args:
            hierarchy: String no formato "primary/secondary/type"
            
        Returns:
            Instância de DocumentClassification
        """
        parts = hierarchy.split("/")
        
        if len(parts) < 2:
            raise ValueError("Hierarchy string must have at least primary/type")
        
        return cls(
            primary_category=parts[0],
            secondary_category=parts[1] if len(parts) > 2 else None,
            document_type=DocumentType(parts[-1])
        )


class DocumentMetadata(BaseModel):
    """
    Metadados adicionais do documento.
    
    Armazena informações contextuais e técnicas sobre o documento.
    """
    file_name: StrictStr = Field(..., description="Nome original do arquivo")
    file_size: PositiveInt = Field(..., description="Tamanho do arquivo em bytes")
    file_type: StrictStr = Field(
        ..., 
        description="Tipo MIME do arquivo",
        regex=r"^[a-z-]+/[a-z0-9][a-z0-9!#$&\-\^]*$"
    )
    page_count: Optional[PositiveInt] = Field(
        None, 
        description="Número de páginas (para PDFs)"
    )
    word_count: Optional[PositiveInt] = Field(
        None,
        description="Contagem aproximada de palavras"
    )
    encoding: Optional[str] = Field(
        "utf-8",
        description="Codificação do texto extraído"
    )
    ocr_confidence: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Confiança do OCR (0.0 a 1.0)"
    )
    extraction_method: Optional[str] = Field(
        None,
        description="Método usado para extração: ocr, text, hybrid"
    )
    language: str = Field(
        "pt-BR",
        description="Idioma detectado do documento"
    )
    organization_id: Optional[str] = Field(
        None,
        description="ID da organização proprietária"
    )
    tags: List[str] = Field(
        default_factory=list,
        description="Tags personalizadas do documento"
    )
    custom_fields: Dict[str, Any] = Field(
        default_factory=dict,
        description="Campos personalizados definidos pela organização"
    )
    
    @validator('file_type')
    def validate_file_type(cls, v):
        """Valida se o tipo de arquivo é suportado."""
        supported_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'text/html'
        ]
        if v not in supported_types:
            raise ValueError(f'Tipo de arquivo não suportado: {v}')
        return v


class Document(BaseModel):
    """
    Modelo principal para documentos licitatórios no LicitaReview.
    
    Representa um documento completo com todo seu contexto, conteúdo e metadados.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único do documento"
    )
    title: StrictStr = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Título ou nome do documento"
    )
    content: StrictStr = Field(
        ...,
        min_length=1,
        description="Conteúdo textual completo do documento"
    )
    classification: DocumentClassification = Field(
        ...,
        description="Classificação hierárquica do documento"
    )
    status: DocumentStatus = Field(
        default=DocumentStatus.PENDING,
        description="Status atual do documento no sistema"
    )
    metadata: DocumentMetadata = Field(
        ...,
        description="Metadados técnicos e contextuais"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data e hora de criação"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data e hora da última atualização"
    )
    created_by: Optional[str] = Field(
        None,
        description="ID do usuário que criou o documento"
    )
    organization_id: StrictStr = Field(
        ...,
        description="ID da organização proprietária"
    )
    version: int = Field(
        default=1,
        ge=1,
        description="Versão do documento"
    )
    parent_document_id: Optional[str] = Field(
        None,
        description="ID do documento pai (para versionamento)"
    )
    
    class Config:
        """Configuração do modelo Pydantic."""
        use_enum_values = True
        validate_assignment = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
    
    @root_validator
    def validate_organization_consistency(cls, values):
        """Valida consistência entre organization_id do documento e metadados."""
        doc_org_id = values.get('organization_id')
        metadata = values.get('metadata')
        
        if metadata and metadata.organization_id:
            if doc_org_id != metadata.organization_id:
                raise ValueError(
                    "organization_id deve ser consistente entre documento e metadados"
                )
        elif metadata:
            # Se não definido nos metadados, usar o do documento
            metadata.organization_id = doc_org_id
            
        return values
    
    @validator('updated_at')
    def validate_updated_at(cls, v, values):
        """Garante que updated_at seja posterior ou igual a created_at."""
        created_at = values.get('created_at')
        if created_at and v < created_at:
            raise ValueError('updated_at deve ser posterior ou igual a created_at')
        return v
    
    def update_content(self, new_content: str, updated_by: Optional[str] = None) -> None:
        """
        Atualiza o conteúdo do documento.
        
        Args:
            new_content: Novo conteúdo do documento
            updated_by: ID do usuário que fez a atualização
        """
        self.content = new_content
        self.updated_at = datetime.utcnow()
        if updated_by:
            self.metadata.custom_fields['updated_by'] = updated_by
    
    def change_status(self, new_status: DocumentStatus) -> None:
        """
        Altera o status do documento.
        
        Args:
            new_status: Novo status do documento
        """
        self.status = new_status
        self.updated_at = datetime.utcnow()
        
        # Log da mudança de status
        status_log = self.metadata.custom_fields.get('status_log', [])
        status_log.append({
            'previous_status': self.status.value if hasattr(self, 'status') else None,
            'new_status': new_status.value,
            'changed_at': datetime.utcnow().isoformat()
        })
        self.metadata.custom_fields['status_log'] = status_log
    
    def create_new_version(self, new_content: str, updated_by: Optional[str] = None) -> "Document":
        """
        Cria uma nova versão do documento.
        
        Args:
            new_content: Conteúdo da nova versão
            updated_by: ID do usuário que criou a versão
            
        Returns:
            Nova instância de Document com versão incrementada
        """
        new_doc = self.copy(deep=True)
        new_doc.id = str(uuid4())
        new_doc.content = new_content
        new_doc.version = self.version + 1
        new_doc.parent_document_id = self.id
        new_doc.created_at = datetime.utcnow()
        new_doc.updated_at = datetime.utcnow()
        new_doc.status = DocumentStatus.PENDING
        
        if updated_by:
            new_doc.created_by = updated_by
            
        return new_doc
    
    def to_summary_dict(self) -> Dict[str, Any]:
        """
        Converte o documento para um dicionário resumido.
        
        Útil para listagens e previews.
        
        Returns:
            Dicionário com informações resumidas do documento
        """
        return {
            'id': self.id,
            'title': self.title,
            'type': self.classification.document_type.value,
            'status': self.status.value,
            'organization_id': self.organization_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'version': self.version,
            'file_name': self.metadata.file_name,
            'file_size': self.metadata.file_size,
            'page_count': self.metadata.page_count,
            'word_count': self.metadata.word_count
        }
    
    def get_content_preview(self, max_length: int = 500) -> str:
        """
        Retorna uma prévia do conteúdo do documento.
        
        Args:
            max_length: Tamanho máximo da prévia
            
        Returns:
            Prévia do conteúdo truncada se necessário
        """
        if len(self.content) <= max_length:
            return self.content
            
        # Tenta quebrar em uma palavra completa
        truncated = self.content[:max_length]
        last_space = truncated.rfind(' ')
        
        if last_space > max_length * 0.8:  # Se conseguir quebrar em pelo menos 80% do tamanho
            return truncated[:last_space] + "..."
        else:
            return truncated + "..."
    
    @classmethod
    def create_from_upload(
        cls,
        title: str,
        content: str,
        classification: DocumentClassification,
        metadata: DocumentMetadata,
        organization_id: str,
        created_by: Optional[str] = None
    ) -> "Document":
        """
        Factory method para criar documento a partir de upload.
        
        Args:
            title: Título do documento
            content: Conteúdo extraído
            classification: Classificação do documento
            metadata: Metadados do arquivo
            organization_id: ID da organização
            created_by: ID do usuário que fez o upload
            
        Returns:
            Nova instância de Document
        """
        return cls(
            title=title,
            content=content,
            classification=classification,
            metadata=metadata,
            organization_id=organization_id,
            created_by=created_by,
            status=DocumentStatus.PENDING
        )