"""
Repository Interfaces

Contratos para persistência de dados seguindo o padrão Repository.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any

from ..entities.document import Document, DocumentId
from ..entities.organization import Organization, OrganizationId
from ..entities.analysis import Analysis, AnalysisId


class IDocumentRepository(ABC):
    """Interface para repositório de documentos."""
    
    @abstractmethod
    async def save(self, document: Document) -> None:
        """Salva documento."""
        pass
    
    @abstractmethod
    async def find_by_id(self, document_id: DocumentId) -> Optional[Document]:
        """Busca documento por ID."""
        pass
    
    @abstractmethod
    async def find_by_content_hash(self, content_hash: str) -> Optional[Document]:
        """Busca documento por hash do conteúdo."""
        pass
    
    @abstractmethod
    async def find_similar_documents(
        self, 
        document: Document, 
        threshold: float = 0.9
    ) -> List[Document]:
        """Busca documentos similares."""
        pass
    
    @abstractmethod
    async def list_by_organization(
        self, 
        organization_id: OrganizationId,
        limit: int = 50,
        offset: int = 0
    ) -> List[Document]:
        """Lista documentos de uma organização."""
        pass
    
    @abstractmethod
    async def delete(self, document_id: DocumentId) -> bool:
        """Remove documento."""
        pass
    
    @abstractmethod
    async def exists(self, document_id: DocumentId) -> bool:
        """Verifica se documento existe."""
        pass


class IOrganizationRepository(ABC):
    """Interface para repositório de organizações."""
    
    @abstractmethod
    async def save(self, organization: Organization) -> None:
        """Salva organização."""
        pass
    
    @abstractmethod
    async def find_by_id(self, organization_id: OrganizationId) -> Optional[Organization]:
        """Busca organização por ID."""
        pass
    
    @abstractmethod
    async def find_by_name(self, name: str) -> Optional[Organization]:
        """Busca organização por nome."""
        pass
    
    @abstractmethod
    async def list_active(self, limit: int = 50, offset: int = 0) -> List[Organization]:
        """Lista organizações ativas."""
        pass
    
    @abstractmethod
    async def update_config(self, organization: Organization) -> None:
        """Atualiza configuração da organização."""
        pass
    
    @abstractmethod
    async def delete(self, organization_id: OrganizationId) -> bool:
        """Remove organização."""
        pass
    
    @abstractmethod
    async def exists(self, organization_id: OrganizationId) -> bool:
        """Verifica se organização existe."""
        pass


class IAnalysisRepository(ABC):
    """Interface para repositório de análises."""
    
    @abstractmethod
    async def save(self, analysis: Analysis) -> None:
        """Salva análise."""
        pass
    
    @abstractmethod
    async def find_by_id(self, analysis_id: AnalysisId) -> Optional[Analysis]:
        """Busca análise por ID."""
        pass
    
    @abstractmethod
    async def find_by_document_and_organization(
        self,
        document_id: DocumentId,
        organization_id: OrganizationId
    ) -> List[Analysis]:
        """Busca análises de um documento por organização."""
        pass
    
    @abstractmethod
    async def find_recent_by_organization(
        self,
        organization_id: OrganizationId,
        limit: int = 10
    ) -> List[Analysis]:
        """Busca análises recentes de uma organização."""
        pass
    
    @abstractmethod
    async def get_analytics(
        self,
        organization_id: Optional[OrganizationId] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Obtém analytics das análises."""
        pass
    
    @abstractmethod
    async def delete_old_analyses(self, days_old: int = 90) -> int:
        """Remove análises antigas."""
        pass


class ICacheRepository(ABC):
    """Interface para cache de resultados."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Obtém valor do cache."""
        pass
    
    @abstractmethod
    async def set(
        self, 
        key: str, 
        value: Dict[str, Any], 
        ttl_seconds: int = 3600
    ) -> None:
        """Define valor no cache."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Remove valor do cache."""
        pass
    
    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Verifica se chave existe no cache."""
        pass
    
    @abstractmethod
    async def clear_pattern(self, pattern: str) -> int:
        """Remove chaves que correspondem ao padrão."""
        pass