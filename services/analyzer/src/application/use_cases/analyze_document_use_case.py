"""
Analyze Document Use Case

Caso de uso principal para análise adaptativa de documentos.
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime

from ...domain.entities.document import Document, DocumentId
from ...domain.entities.organization import Organization, OrganizationId
from ...domain.entities.analysis import Analysis
from ...domain.interfaces.repositories import (
    IDocumentRepository,
    IOrganizationRepository,
    IAnalysisRepository,
    ICacheRepository
)
from ...domain.interfaces.services import (
    IValidationService,
    INotificationService,
    IMetricsService
)
from ...domain.services.analysis_domain_service import AnalysisDomainService


@dataclass
class AnalyzeDocumentRequest:
    """Request para análise de documento."""
    document_id: str
    organization_id: str
    analysis_type: str = "standard"
    force_reanalysis: bool = False
    minimum_confidence: float = 0.5
    max_findings: Optional[int] = None
    custom_parameters: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.custom_parameters is None:
            self.custom_parameters = {}


@dataclass 
class AnalyzeDocumentResponse:
    """Response da análise de documento."""
    analysis: Analysis
    cache_hit: bool = False
    processing_time_seconds: float = 0.0
    metadata: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class AnalyzeDocumentUseCase:
    """
    Caso de uso para análise adaptativa de documentos.
    
    Coordena todo o processo de análise, desde validação
    até persistência dos resultados.
    """
    
    def __init__(
        self,
        document_repository: IDocumentRepository,
        organization_repository: IOrganizationRepository,
        analysis_repository: IAnalysisRepository,
        cache_repository: ICacheRepository,
        analysis_domain_service: AnalysisDomainService,
        validation_service: IValidationService,
        notification_service: INotificationService,
        metrics_service: IMetricsService
    ):
        self.document_repository = document_repository
        self.organization_repository = organization_repository
        self.analysis_repository = analysis_repository
        self.cache_repository = cache_repository
        self.analysis_domain_service = analysis_domain_service
        self.validation_service = validation_service
        self.notification_service = notification_service
        self.metrics_service = metrics_service
    
    async def execute(self, request: AnalyzeDocumentRequest) -> AnalyzeDocumentResponse:
        """
        Executa análise adaptativa de documento.
        
        Args:
            request: Request com parâmetros da análise
            
        Returns:
            Response com resultado da análise
            
        Raises:
            ValueError: Se dados de entrada inválidos
            RuntimeError: Se erro durante processamento
        """
        start_time = datetime.utcnow()
        
        try:
            # 1. Validação inicial
            await self._validate_request(request)
            
            # 2. Carrega entidades necessárias
            document = await self._load_document(request.document_id)
            organization = await self._load_organization(request.organization_id)
            
            # 3. Validações de negócio
            await self._validate_business_rules(document, organization, request)
            
            # 4. Verifica cache (se não for reanalise forçada)
            if not request.force_reanalysis:
                cached_analysis = await self._get_cached_analysis(document, organization)
                if cached_analysis:
                    processing_time = (datetime.utcnow() - start_time).total_seconds()
                    
                    # Registra hit de cache
                    await self.metrics_service.record_performance_metrics(
                        "analysis_cache_hit",
                        processing_time,
                        {
                            'document_id': request.document_id,
                            'organization_id': request.organization_id
                        }
                    )
                    
                    return AnalyzeDocumentResponse(
                        analysis=cached_analysis,
                        cache_hit=True,
                        processing_time_seconds=processing_time,
                        metadata={'cache_key': self._generate_cache_key(document, organization)}
                    )
            
            # 5. Executa análise adaptativa
            analysis = await self.analysis_domain_service.execute_adaptive_analysis(
                document, organization
            )
            
            # 6. Aplica filtros do request
            analysis = await self._apply_request_filters(analysis, request)
            
            # 7. Persiste resultado
            await self.analysis_repository.save(analysis)
            
            # 8. Cache do resultado
            await self._cache_analysis_result(document, organization, analysis)
            
            # 9. Notificações se necessário
            await self._send_notifications(analysis, organization)
            
            # 10. Métricas finais
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            await self.metrics_service.record_performance_metrics(
                "analysis_completed",
                processing_time,
                {
                    'document_id': request.document_id,
                    'organization_id': request.organization_id,
                    'findings_count': len(analysis.findings),
                    'weighted_score': analysis.weighted_score
                }
            )
            
            return AnalyzeDocumentResponse(
                analysis=analysis,
                cache_hit=False,
                processing_time_seconds=processing_time,
                metadata={
                    'analysis_type': request.analysis_type,
                    'custom_parameters': request.custom_parameters
                }
            )
            
        except Exception as e:
            # Registra erro
            await self.metrics_service.record_error_metrics(
                type(e).__name__,
                str(e),
                {
                    'operation': 'analyze_document',
                    'document_id': request.document_id,
                    'organization_id': request.organization_id
                }
            )
            raise
    
    async def _validate_request(self, request: AnalyzeDocumentRequest) -> None:
        """Valida request de entrada."""
        if not request.document_id or not request.document_id.strip():
            raise ValueError("Document ID é obrigatório")
        
        if not request.organization_id or not request.organization_id.strip():
            raise ValueError("Organization ID é obrigatório")
        
        if not 0.0 <= request.minimum_confidence <= 1.0:
            raise ValueError("Minimum confidence deve estar entre 0.0 e 1.0")
        
        if request.max_findings is not None and request.max_findings <= 0:
            raise ValueError("Max findings deve ser positivo")
        
        valid_analysis_types = ["quick", "standard", "detailed", "custom"]
        if request.analysis_type not in valid_analysis_types:
            raise ValueError(f"Analysis type deve ser um de: {valid_analysis_types}")
    
    async def _load_document(self, document_id: str) -> Document:
        """Carrega documento por ID."""
        document = await self.document_repository.find_by_id(DocumentId(document_id))
        if not document:
            raise ValueError(f"Documento {document_id} não encontrado")
        
        return document
    
    async def _load_organization(self, organization_id: str) -> Organization:
        """Carrega organização por ID."""
        organization = await self.organization_repository.find_by_id(
            OrganizationId(organization_id)
        )
        if not organization:
            raise ValueError(f"Organização {organization_id} não encontrada")
        
        if not organization.is_active:
            raise ValueError(f"Organização {organization_id} está inativa")
        
        return organization
    
    async def _validate_business_rules(
        self, 
        document: Document, 
        organization: Organization, 
        request: AnalyzeDocumentRequest
    ) -> None:
        """Valida regras de negócio."""
        # Valida documento
        doc_errors = await self.validation_service.validate_document(document)
        if doc_errors:
            raise ValueError(f"Documento inválido: {'; '.join(doc_errors)}")
        
        # Valida configuração da organização
        org_errors = await self.validation_service.validate_organization_config(organization)
        if org_errors:
            raise ValueError(f"Configuração da organização inválida: {'; '.join(org_errors)}")
        
        # Valida request de análise
        request_errors = await self.validation_service.validate_analysis_request(
            document, organization
        )
        if request_errors:
            raise ValueError(f"Request de análise inválido: {'; '.join(request_errors)}")
    
    async def _get_cached_analysis(
        self, 
        document: Document, 
        organization: Organization
    ) -> Optional[Analysis]:
        """Busca análise em cache."""
        cache_key = self._generate_cache_key(document, organization)
        cached_data = await self.cache_repository.get(cache_key)
        
        if cached_data:
            # Reconstrói análise do cache (simplificado)
            # Em implementação real, seria mais elaborado
            return Analysis.create(
                str(document.id),
                str(organization.id),
                cached_data.get('conformity_scores', {}),
                cached_data.get('weighted_score', 0.0)
            )
        
        return None
    
    async def _cache_analysis_result(
        self,
        document: Document,
        organization: Organization,
        analysis: Analysis
    ) -> None:
        """Armazena resultado da análise em cache."""
        cache_key = self._generate_cache_key(document, organization)
        cache_data = {
            'analysis_id': str(analysis.id),
            'conformity_scores': analysis.conformity_scores.to_dict(),
            'weighted_score': analysis.weighted_score,
            'findings_count': len(analysis.findings),
            'cached_at': datetime.utcnow().isoformat(),
            'organization_config_hash': organization.get_config_hash()
        }
        
        # Cache por 1 hora
        await self.cache_repository.set(cache_key, cache_data, ttl_seconds=3600)
    
    def _generate_cache_key(self, document: Document, organization: Organization) -> str:
        """Gera chave de cache baseada no documento e configuração da organização."""
        content_hash = document.get_content_hash()
        config_hash = organization.get_config_hash()
        return f"analysis:{content_hash[:16]}:{config_hash[:16]}"
    
    async def _apply_request_filters(
        self,
        analysis: Analysis,
        request: AnalyzeDocumentRequest
    ) -> Analysis:
        """Aplica filtros do request ao resultado da análise."""
        # Filtra por confiança mínima
        if request.minimum_confidence > 0:
            analysis.findings = [
                f for f in analysis.findings
                if f.confidence >= request.minimum_confidence
            ]
        
        # Limita número de findings
        if request.max_findings and len(analysis.findings) > request.max_findings:
            # Ordena por severidade e confiança, mantém os mais importantes
            analysis.findings = sorted(
                analysis.findings,
                key=lambda f: (f.get_severity_weight(), f.confidence),
                reverse=True
            )[:request.max_findings]
        
        return analysis
    
    async def _send_notifications(self, analysis: Analysis, organization: Organization) -> None:
        """Envia notificações baseadas no resultado da análise."""
        # Notifica conclusão da análise
        await self.notification_service.send_analysis_completed(analysis, organization)
        
        # Notifica findings críticos se existirem
        critical_findings = analysis.get_critical_findings()
        if critical_findings:
            await self.notification_service.send_critical_findings(
                analysis, critical_findings
            )