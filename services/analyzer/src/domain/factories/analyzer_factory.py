"""
Analyzer Factory

Factory para criação de analisadores adaptativos
com configurações específicas.
"""

from typing import Dict, Any, Optional, Type
from abc import ABC, abstractmethod
from enum import Enum

from ..entities.organization import Organization, AnalysisPreset
from ..interfaces.services import IAnalysisEngine


class AnalyzerType(str, Enum):
    """Tipos de analisador disponíveis."""
    STANDARD = "standard"
    FAST = "fast"
    DETAILED = "detailed"
    CUSTOM = "custom"


class IAnalyzerFactory(ABC):
    """Interface para factory de analisadores."""
    
    @abstractmethod
    def create_analyzer(
        self, 
        analyzer_type: AnalyzerType, 
        organization: Organization,
        custom_config: Optional[Dict[str, Any]] = None
    ) -> IAnalysisEngine:
        """Cria analisador baseado no tipo e organização."""
        pass
    
    @abstractmethod
    def create_analyzer_for_preset(
        self, 
        preset: AnalysisPreset,
        organization: Organization
    ) -> IAnalysisEngine:
        """Cria analisador otimizado para preset específico."""
        pass


class AnalyzerFactory(IAnalyzerFactory):
    """
    Factory concreta para criação de analisadores adaptativos.
    
    Cria analisadores otimizados baseados no tipo de organização,
    preset de configuração e requisitos específicos.
    """
    
    def __init__(self):
        self._analyzer_registry: Dict[AnalyzerType, Type[IAnalysisEngine]] = {}
        self._preset_mappings: Dict[AnalysisPreset, AnalyzerType] = {
            AnalysisPreset.RIGOROUS: AnalyzerType.DETAILED,
            AnalysisPreset.STANDARD: AnalyzerType.STANDARD,
            AnalysisPreset.FLEXIBLE: AnalyzerType.FAST,
            AnalysisPreset.TECHNICAL: AnalyzerType.DETAILED,
            AnalysisPreset.CUSTOM: AnalyzerType.CUSTOM
        }
    
    def register_analyzer(
        self, 
        analyzer_type: AnalyzerType, 
        analyzer_class: Type[IAnalysisEngine]
    ) -> None:
        """
        Registra implementação de analisador para um tipo.
        
        Args:
            analyzer_type: Tipo do analisador
            analyzer_class: Classe de implementação
        """
        self._analyzer_registry[analyzer_type] = analyzer_class
    
    def create_analyzer(
        self, 
        analyzer_type: AnalyzerType, 
        organization: Organization,
        custom_config: Optional[Dict[str, Any]] = None
    ) -> IAnalysisEngine:
        """
        Cria analisador baseado no tipo e organização.
        
        Args:
            analyzer_type: Tipo do analisador a criar
            organization: Organização solicitante
            custom_config: Configurações customizadas opcionais
            
        Returns:
            Instância de IAnalysisEngine configurada
            
        Raises:
            ValueError: Se tipo de analisador não suportado
        """
        if analyzer_type not in self._analyzer_registry:
            raise ValueError(f"Tipo de analisador não suportado: {analyzer_type}")
        
        analyzer_class = self._analyzer_registry[analyzer_type]
        
        # Cria configuração baseada na organização
        config = self._build_analyzer_config(organization, custom_config)
        
        # Para este exemplo, assumimos que as implementações concretas
        # dos analisadores seguem um padrão de construção
        if hasattr(analyzer_class, 'create_with_config'):
            return analyzer_class.create_with_config(config)
        else:
            return analyzer_class(config)
    
    def create_analyzer_for_preset(
        self, 
        preset: AnalysisPreset,
        organization: Organization
    ) -> IAnalysisEngine:
        """
        Cria analisador otimizado para preset específico.
        
        Args:
            preset: Preset de análise
            organization: Organização solicitante
            
        Returns:
            Analisador otimizado para o preset
        """
        analyzer_type = self._preset_mappings.get(preset, AnalyzerType.STANDARD)
        
        # Configuração específica para preset
        preset_config = self._get_preset_specific_config(preset)
        
        return self.create_analyzer(analyzer_type, organization, preset_config)
    
    def create_comparative_analyzer(
        self, 
        organizations: list[Organization]
    ) -> 'ComparativeAnalyzer':
        """
        Cria analisador para análise comparativa entre organizações.
        
        Args:
            organizations: Lista de organizações para comparar
            
        Returns:
            Analisador comparativo configurado
        """
        analyzers = {}
        for org in organizations:
            analyzer = self.create_analyzer_for_preset(org.preset_type, org)
            analyzers[str(org.id)] = analyzer
        
        return ComparativeAnalyzer(analyzers)
    
    def _build_analyzer_config(
        self, 
        organization: Organization, 
        custom_config: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Constrói configuração do analisador baseada na organização.
        
        Args:
            organization: Organização solicitante
            custom_config: Configurações customizadas
            
        Returns:
            Dict com configuração completa do analisador
        """
        config = {
            'organization_id': str(organization.id),
            'organization_name': organization.name,
            'organization_type': organization.organization_type.value,
            'weights': organization.weights.to_dict(),
            'preset_type': organization.preset_type.value,
            'custom_rules': [
                {
                    'id': rule.id,
                    'pattern': rule.pattern,
                    'pattern_type': rule.pattern_type,
                    'severity': rule.severity,
                    'category': rule.category,
                    'message': rule.message,
                    'suggestion': rule.suggestion,
                    'is_active': rule.is_active
                }
                for rule in organization.get_active_rules()
            ],
            'settings': organization.settings,
            'version': organization.version
        }
        
        # Adiciona configurações customizadas se fornecidas
        if custom_config:
            config.update(custom_config)
        
        return config
    
    def _get_preset_specific_config(self, preset: AnalysisPreset) -> Dict[str, Any]:
        """
        Obtém configuração específica para preset.
        
        Args:
            preset: Preset de análise
            
        Returns:
            Dict com configurações específicas do preset
        """
        preset_configs = {
            AnalysisPreset.RIGOROUS: {
                'enable_deep_legal_analysis': True,
                'minimum_confidence_threshold': 0.8,
                'enable_regulatory_cross_check': True,
                'legal_database_priority': True
            },
            AnalysisPreset.STANDARD: {
                'balanced_analysis': True,
                'minimum_confidence_threshold': 0.6,
                'enable_standard_validations': True
            },
            AnalysisPreset.FLEXIBLE: {
                'fast_mode': True,
                'minimum_confidence_threshold': 0.4,
                'skip_non_critical_checks': True,
                'parallel_processing': True
            },
            AnalysisPreset.TECHNICAL: {
                'enable_technical_validation': True,
                'abnt_standards_priority': True,
                'structural_analysis_depth': 'high',
                'minimum_confidence_threshold': 0.7
            },
            AnalysisPreset.CUSTOM: {
                'allow_custom_parameters': True,
                'flexible_configuration': True
            }
        }
        
        return preset_configs.get(preset, {})


class ComparativeAnalyzer:
    """
    Analisador para execução de análises comparativas
    entre múltiplas organizações.
    """
    
    def __init__(self, analyzers: Dict[str, IAnalysisEngine]):
        self.analyzers = analyzers
    
    async def analyze_comparative(self, document, analysis_type: str = "standard"):
        """
        Executa análise comparativa do documento
        usando todos os analisadores configurados.
        
        Args:
            document: Documento a ser analisado
            analysis_type: Tipo de análise
            
        Returns:
            Dict com resultados por organização
        """
        results = {}
        
        for org_id, analyzer in self.analyzers.items():
            try:
                # Executaria análise usando o analisador específico
                # result = await analyzer.analyze(document, analysis_type)
                # results[org_id] = result
                pass
            except Exception as e:
                results[org_id] = {'error': str(e)}
        
        return results
    
    def get_score_variations(self, comparative_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula variações de score entre organizações.
        
        Args:
            comparative_results: Resultados da análise comparativa
            
        Returns:
            Dict com estatísticas de variação
        """
        scores = []
        for org_id, result in comparative_results.items():
            if 'error' not in result and 'weighted_score' in result:
                scores.append(result['weighted_score'])
        
        if not scores:
            return {'error': 'Nenhum resultado válido encontrado'}
        
        min_score = min(scores)
        max_score = max(scores)
        avg_score = sum(scores) / len(scores)
        score_variation = max_score - min_score
        
        return {
            'min_score': min_score,
            'max_score': max_score,
            'average_score': avg_score,
            'score_variation': score_variation,
            'variation_percentage': (score_variation / avg_score) * 100 if avg_score > 0 else 0,
            'organizations_count': len(scores),
            'differential_demonstrated': score_variation > 10  # Diferencial significativo
        }


class AnalyzerConfigurationBuilder:
    """
    Builder para construção de configurações complexas de analisadores.
    """
    
    def __init__(self):
        self._config: Dict[str, Any] = {}
    
    def with_organization(self, organization: Organization) -> 'AnalyzerConfigurationBuilder':
        """Adiciona configuração da organização."""
        self._config.update({
            'organization_id': str(organization.id),
            'weights': organization.weights.to_dict(),
            'custom_rules': [rule.id for rule in organization.get_active_rules()],
            'preset_type': organization.preset_type.value
        })
        return self
    
    def with_performance_profile(self, profile: str) -> 'AnalyzerConfigurationBuilder':
        """Adiciona perfil de performance."""
        profiles = {
            'fast': {'parallel_processing': True, 'cache_aggressive': True},
            'balanced': {'parallel_processing': True, 'cache_standard': True},
            'thorough': {'deep_analysis': True, 'cache_conservative': True}
        }
        
        if profile in profiles:
            self._config.update(profiles[profile])
        
        return self
    
    def with_custom_settings(self, settings: Dict[str, Any]) -> 'AnalyzerConfigurationBuilder':
        """Adiciona configurações customizadas."""
        self._config.update(settings)
        return self
    
    def build(self) -> Dict[str, Any]:
        """Constrói configuração final."""
        return self._config.copy()