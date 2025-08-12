"""
Dependency Injection Container

Container para injeção de dependência e configuração
de todos os componentes do sistema.
"""

from typing import Dict, Any, Optional, TypeVar, Type, Callable
from abc import ABC, abstractmethod
import asyncio
from dataclasses import dataclass, field

# Imports das interfaces
from ...domain.interfaces.repositories import (
    IDocumentRepository,
    IOrganizationRepository,
    IAnalysisRepository,
    ICacheRepository
)
from ...domain.interfaces.services import (
    IAnalysisEngine,
    ITextExtractionService,
    INotificationService,
    IMetricsService,
    IValidationService,
    ILoggingService,
    IConfigurationService
)

# Imports dos serviços de domínio
from ...domain.services.analysis_domain_service import AnalysisDomainService
from ...domain.factories.analyzer_factory import AnalyzerFactory

# Imports dos use cases
from ...application.use_cases.analyze_document_use_case import AnalyzeDocumentUseCase

# Imports das implementações
from ..repositories.in_memory_repositories import (
    InMemoryDocumentRepository,
    InMemoryOrganizationRepository,
    InMemoryAnalysisRepository,
    InMemoryCacheRepository
)

T = TypeVar('T')


class ServiceLifetime:
    """Tempos de vida dos serviços."""
    SINGLETON = "singleton"
    TRANSIENT = "transient"
    SCOPED = "scoped"


@dataclass
class ServiceDescriptor:
    """Descritor de serviço para o container."""
    service_type: Type
    implementation: Optional[Type] = None
    factory: Optional[Callable] = None
    lifetime: str = ServiceLifetime.TRANSIENT
    dependencies: list = field(default_factory=list)


class IDependencyContainer(ABC):
    """Interface para container de injeção de dependência."""
    
    @abstractmethod
    def register_singleton(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Registra serviço como singleton."""
        pass
    
    @abstractmethod
    def register_transient(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Registra serviço como transient."""
        pass
    
    @abstractmethod
    def register_factory(self, service_type: Type[T], factory: Callable[[], T]) -> None:
        """Registra factory para criação de serviço."""
        pass
    
    @abstractmethod
    def resolve(self, service_type: Type[T]) -> T:
        """Resolve instância do serviço."""
        pass
    
    @abstractmethod
    async def initialize_async_services(self) -> None:
        """Inicializa serviços assíncronos."""
        pass


class DependencyContainer(IDependencyContainer):
    """
    Container para injeção de dependência.
    
    Gerencia criação e tempo de vida de todas as dependências do sistema.
    """
    
    def __init__(self):
        self._services: Dict[Type, ServiceDescriptor] = {}
        self._singletons: Dict[Type, Any] = {}
        self._is_initialized = False
    
    def register_singleton(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Registra serviço como singleton."""
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=implementation,
            lifetime=ServiceLifetime.SINGLETON
        )
    
    def register_transient(self, service_type: Type[T], implementation: Type[T]) -> None:
        """Registra serviço como transient."""
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            implementation=implementation,
            lifetime=ServiceLifetime.TRANSIENT
        )
    
    def register_factory(self, service_type: Type[T], factory: Callable[[], T]) -> None:
        """Registra factory para criação de serviço."""
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            factory=factory,
            lifetime=ServiceLifetime.TRANSIENT
        )
    
    def register_instance(self, service_type: Type[T], instance: T) -> None:
        """Registra instância específica como singleton."""
        self._services[service_type] = ServiceDescriptor(
            service_type=service_type,
            lifetime=ServiceLifetime.SINGLETON
        )
        self._singletons[service_type] = instance
    
    def resolve(self, service_type: Type[T]) -> T:
        """Resolve instância do serviço."""
        if service_type not in self._services:
            raise ValueError(f"Serviço {service_type.__name__} não registrado")
        
        descriptor = self._services[service_type]
        
        # Se é singleton e já foi criado, retorna instância existente
        if descriptor.lifetime == ServiceLifetime.SINGLETON:
            if service_type in self._singletons:
                return self._singletons[service_type]
        
        # Cria nova instância
        instance = self._create_instance(descriptor)
        
        # Se é singleton, armazena para reutilização
        if descriptor.lifetime == ServiceLifetime.SINGLETON:
            self._singletons[service_type] = instance
        
        return instance
    
    def _create_instance(self, descriptor: ServiceDescriptor) -> Any:
        """Cria instância baseada no descritor."""
        if descriptor.factory:
            return descriptor.factory()
        
        if descriptor.implementation:
            # Resolve dependências do construtor
            dependencies = self._resolve_dependencies(descriptor.implementation)
            return descriptor.implementation(*dependencies)
        
        raise ValueError(f"Não é possível criar instância para {descriptor.service_type}")
    
    def _resolve_dependencies(self, implementation_type: Type) -> list:
        """Resolve dependências do construtor."""
        # Implementação simplificada - em uma versão real,
        # analisaria anotações de tipo do __init__
        return []
    
    async def initialize_async_services(self) -> None:
        """Inicializa serviços assíncronos."""
        if self._is_initialized:
            return
        
        # Inicializa serviços que implementam método initialize
        for service_type, instance in self._singletons.items():
            if hasattr(instance, 'initialize'):
                if asyncio.iscoroutinefunction(instance.initialize):
                    await instance.initialize()
                else:
                    instance.initialize()
        
        self._is_initialized = True
    
    async def cleanup(self) -> None:
        """Limpa recursos dos serviços."""
        for service_type, instance in self._singletons.items():
            if hasattr(instance, 'cleanup'):
                if asyncio.iscoroutinefunction(instance.cleanup):
                    await instance.cleanup()
                else:
                    instance.cleanup()
        
        self._singletons.clear()
        self._is_initialized = False


class ServiceRegistry:
    """
    Registry para configuração centralizada de serviços.
    
    Configura todas as dependências do sistema de forma centralizada.
    """
    
    @staticmethod
    def configure_container(container: DependencyContainer) -> None:
        """
        Configura container com todas as dependências do sistema.
        
        Args:
            container: Container a ser configurado
        """
        # Repositórios
        ServiceRegistry._register_repositories(container)
        
        # Serviços de infraestrutura
        ServiceRegistry._register_infrastructure_services(container)
        
        # Serviços de domínio
        ServiceRegistry._register_domain_services(container)
        
        # Factories
        ServiceRegistry._register_factories(container)
        
        # Use cases
        ServiceRegistry._register_use_cases(container)
    
    @staticmethod
    def _register_repositories(container: DependencyContainer) -> None:
        """Registra repositórios."""
        # Para desenvolvimento, usa implementações em memória
        # Em produção, registraria implementações com banco de dados
        container.register_singleton(IDocumentRepository, InMemoryDocumentRepository)
        container.register_singleton(IOrganizationRepository, InMemoryOrganizationRepository)
        container.register_singleton(IAnalysisRepository, InMemoryAnalysisRepository)
        container.register_singleton(ICacheRepository, InMemoryCacheRepository)
    
    @staticmethod
    def _register_infrastructure_services(container: DependencyContainer) -> None:
        """Registra serviços de infraestrutura."""
        # Registraria implementações concretas dos serviços
        # Por enquanto, factories que criam mocks
        
        def create_text_extraction_service():
            # Mock implementation
            class MockTextExtractionService:
                async def extract_from_pdf(self, content): return "Mock PDF text"
                async def extract_from_word(self, content): return "Mock Word text"
                async def extract_from_image(self, content): return "Mock OCR text"
                async def detect_document_type(self, content): return "documento_generico"
                async def detect_language(self, content): return "pt-BR"
            return MockTextExtractionService()
        
        def create_notification_service():
            class MockNotificationService:
                async def send_analysis_completed(self, analysis, org): pass
                async def send_critical_findings(self, analysis, findings): pass
                async def send_system_alert(self, msg, severity): pass
            return MockNotificationService()
        
        def create_metrics_service():
            from ..monitoring.metrics import AdvancedMetricsService
            return AdvancedMetricsService()
        
        def create_validation_service():
            class MockValidationService:
                async def validate_document(self, doc): return []
                async def validate_organization_config(self, org): return []
                async def validate_analysis_request(self, doc, org): return []
            return MockValidationService()
        
        def create_logging_service():
            class MockLoggingService:
                async def log_analysis_started(self, doc_id, org_id, analysis_id): pass
                async def log_analysis_completed(self, analysis_id, duration, findings): pass
                async def log_error(self, msg, error_type, context=None): pass
                async def log_security_event(self, event_type, user_id=None, details=None): pass
            return MockLoggingService()
        
        def create_configuration_service():
            class MockConfigurationService:
                async def get_system_config(self): return {}
                async def get_analysis_limits(self): return {'max_documents': 1000}
                async def get_feature_flags(self): return {'advanced_analysis': True}
                async def update_system_config(self, config): pass
            return MockConfigurationService()
        
        container.register_factory(ITextExtractionService, create_text_extraction_service)
        container.register_factory(INotificationService, create_notification_service)
        container.register_factory(IMetricsService, create_metrics_service)
        container.register_factory(IValidationService, create_validation_service)
        container.register_factory(ILoggingService, create_logging_service)
        container.register_factory(IConfigurationService, create_configuration_service)
    
    @staticmethod
    def _register_domain_services(container: DependencyContainer) -> None:
        """Registra serviços de domínio."""
        def create_analysis_domain_service():
            # Mock analysis engine
            class MockAnalysisEngine:
                async def analyze_structural(self, doc, org):
                    from ...domain.interfaces.services import AnalysisResult
                    from ...domain.entities.analysis import Finding, FindingCategory, FindingSeverity
                    return AnalysisResult(
                        score=85.0,
                        findings=[
                            Finding(
                                id="mock_structural_001",
                                category=FindingCategory.ESTRUTURAL,
                                severity=FindingSeverity.MEDIA,
                                title="Mock structural finding",
                                description="Mock description",
                                suggestion="Mock suggestion"
                            )
                        ],
                        metadata={'mock': True}
                    )
                
                async def analyze_legal(self, doc, org):
                    from ...domain.interfaces.services import AnalysisResult
                    return AnalysisResult(score=78.0, findings=[], metadata={'mock': True})
                
                async def analyze_clarity(self, doc, org):
                    from ...domain.interfaces.services import AnalysisResult
                    return AnalysisResult(score=92.0, findings=[], metadata={'mock': True})
                
                async def analyze_abnt(self, doc, org):
                    from ...domain.interfaces.services import AnalysisResult
                    return AnalysisResult(score=88.0, findings=[], metadata={'mock': True})
            
            return AnalysisDomainService(
                analysis_engine=MockAnalysisEngine(),
                metrics_service=container.resolve(IMetricsService),
                logging_service=container.resolve(ILoggingService)
            )
        
        container.register_factory(AnalysisDomainService, create_analysis_domain_service)
    
    @staticmethod
    def _register_factories(container: DependencyContainer) -> None:
        """Registra factories."""
        container.register_singleton(AnalyzerFactory, AnalyzerFactory)
    
    @staticmethod
    def _register_use_cases(container: DependencyContainer) -> None:
        """Registra use cases."""
        def create_analyze_document_use_case():
            return AnalyzeDocumentUseCase(
                document_repository=container.resolve(IDocumentRepository),
                organization_repository=container.resolve(IOrganizationRepository),
                analysis_repository=container.resolve(IAnalysisRepository),
                cache_repository=container.resolve(ICacheRepository),
                analysis_domain_service=container.resolve(AnalysisDomainService),
                validation_service=container.resolve(IValidationService),
                notification_service=container.resolve(INotificationService),
                metrics_service=container.resolve(IMetricsService)
            )
        
        container.register_factory(AnalyzeDocumentUseCase, create_analyze_document_use_case)


# Instância global do container (singleton de aplicação)
_container: Optional[DependencyContainer] = None


def get_container() -> DependencyContainer:
    """
    Obtém instância global do container.
    
    Returns:
        Container de dependências configurado
    """
    global _container
    if _container is None:
        _container = DependencyContainer()
        ServiceRegistry.configure_container(_container)
    return _container


async def initialize_system() -> DependencyContainer:
    """
    Inicializa sistema completo com todas as dependências.
    
    Returns:
        Container inicializado
    """
    container = get_container()
    await container.initialize_async_services()
    return container


async def cleanup_system() -> None:
    """Limpa recursos do sistema."""
    global _container
    if _container:
        await _container.cleanup()
        _container = None