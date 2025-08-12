"""
Service Interfaces

Contratos para serviços de domínio e infraestrutura.
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from ..entities.document import Document, DocumentType
from ..entities.organization import Organization
from ..entities.analysis import Analysis, Finding


@dataclass
class AnalysisResult:
    """Resultado de análise de categoria."""
    score: float
    findings: List[Finding]
    metadata: Dict[str, Any]


class ITextExtractionService(ABC):
    """Interface para extração de texto de documentos."""
    
    @abstractmethod
    async def extract_from_pdf(self, file_content: bytes) -> str:
        """Extrai texto de PDF."""
        pass
    
    @abstractmethod
    async def extract_from_word(self, file_content: bytes) -> str:
        """Extrai texto de documento Word."""
        pass
    
    @abstractmethod
    async def extract_from_image(self, file_content: bytes) -> str:
        """Extrai texto de imagem via OCR."""
        pass
    
    @abstractmethod
    async def detect_document_type(self, content: str) -> DocumentType:
        """Detecta tipo de documento baseado no conteúdo."""
        pass
    
    @abstractmethod
    async def detect_language(self, content: str) -> str:
        """Detecta idioma do documento."""
        pass


class IAnalysisEngine(ABC):
    """Interface para engines de análise."""
    
    @abstractmethod
    async def analyze_structural(
        self, 
        document: Document, 
        organization: Organization
    ) -> AnalysisResult:
        """Executa análise estrutural."""
        pass
    
    @abstractmethod
    async def analyze_legal(
        self, 
        document: Document, 
        organization: Organization
    ) -> AnalysisResult:
        """Executa análise jurídica."""
        pass
    
    @abstractmethod
    async def analyze_clarity(
        self, 
        document: Document, 
        organization: Organization
    ) -> AnalysisResult:
        """Executa análise de clareza."""
        pass
    
    @abstractmethod
    async def analyze_abnt(
        self, 
        document: Document, 
        organization: Organization
    ) -> AnalysisResult:
        """Executa análise de conformidade ABNT."""
        pass


class INotificationService(ABC):
    """Interface para serviço de notificações."""
    
    @abstractmethod
    async def send_analysis_completed(
        self, 
        analysis: Analysis, 
        organization: Organization
    ) -> None:
        """Notifica conclusão de análise."""
        pass
    
    @abstractmethod
    async def send_critical_findings(
        self, 
        analysis: Analysis, 
        critical_findings: List[Finding]
    ) -> None:
        """Notifica findings críticos."""
        pass
    
    @abstractmethod
    async def send_system_alert(
        self, 
        message: str, 
        severity: str = "info"
    ) -> None:
        """Envia alerta do sistema."""
        pass


class IMetricsService(ABC):
    """Interface para serviço de métricas."""
    
    @abstractmethod
    async def record_analysis_metrics(self, analysis: Analysis) -> None:
        """Registra métricas de análise."""
        pass
    
    @abstractmethod
    async def record_performance_metrics(
        self, 
        operation: str, 
        duration_seconds: float,
        metadata: Dict[str, Any] = None
    ) -> None:
        """Registra métricas de performance."""
        pass
    
    @abstractmethod
    async def record_error_metrics(
        self, 
        error_type: str, 
        error_message: str,
        context: Dict[str, Any] = None
    ) -> None:
        """Registra métricas de erro."""
        pass
    
    @abstractmethod
    async def get_metrics_summary(
        self, 
        start_date: str, 
        end_date: str
    ) -> Dict[str, Any]:
        """Obtém sumário de métricas."""
        pass


class IValidationService(ABC):
    """Interface para serviço de validação."""
    
    @abstractmethod
    async def validate_document(self, document: Document) -> List[str]:
        """Valida documento e retorna erros."""
        pass
    
    @abstractmethod
    async def validate_organization_config(
        self, 
        organization: Organization
    ) -> List[str]:
        """Valida configuração da organização."""
        pass
    
    @abstractmethod
    async def validate_analysis_request(
        self,
        document: Document,
        organization: Organization
    ) -> List[str]:
        """Valida request de análise."""
        pass


class ILoggingService(ABC):
    """Interface para serviço de logging estruturado."""
    
    @abstractmethod
    async def log_analysis_started(
        self,
        document_id: str,
        organization_id: str,
        analysis_id: str
    ) -> None:
        """Registra início de análise."""
        pass
    
    @abstractmethod
    async def log_analysis_completed(
        self,
        analysis_id: str,
        duration_seconds: float,
        findings_count: int
    ) -> None:
        """Registra conclusão de análise."""
        pass
    
    @abstractmethod
    async def log_error(
        self,
        error_message: str,
        error_type: str,
        context: Dict[str, Any] = None
    ) -> None:
        """Registra erro."""
        pass
    
    @abstractmethod
    async def log_security_event(
        self,
        event_type: str,
        user_id: Optional[str] = None,
        details: Dict[str, Any] = None
    ) -> None:
        """Registra evento de segurança."""
        pass


class IConfigurationService(ABC):
    """Interface para serviço de configuração."""
    
    @abstractmethod
    async def get_system_config(self) -> Dict[str, Any]:
        """Obtém configuração do sistema."""
        pass
    
    @abstractmethod
    async def get_analysis_limits(self) -> Dict[str, int]:
        """Obtém limites de análise."""
        pass
    
    @abstractmethod
    async def get_feature_flags(self) -> Dict[str, bool]:
        """Obtém feature flags."""
        pass
    
    @abstractmethod
    async def update_system_config(
        self, 
        config: Dict[str, Any]
    ) -> None:
        """Atualiza configuração do sistema."""
        pass