"""
LicitaReview - Utilitários para Modelos

Este módulo contém funções utilitárias para conversão entre modelos,
serialização avançada e validação cruzada.
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Union, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, ValidationError

from .document_models import Document, DocumentClassification, DocumentMetadata
from .analysis_models import AnalysisResult, AnalysisFinding, ConformityScore
from .config_models import OrganizationConfig, AnalysisWeights, CustomRule

# Type variable para funções genéricas
T = TypeVar('T', bound=BaseModel)


class ModelConverter:
    """
    Classe utilitária para conversão entre modelos e formatos.
    
    Fornece métodos para serialização, desserialização e conversão
    entre diferentes representações dos modelos.
    """
    
    @staticmethod
    def to_json_safe(obj: Any) -> Any:
        """
        Converte objeto para formato JSON-safe.
        
        Args:
            obj: Objeto a ser convertido
            
        Returns:
            Versão JSON-safe do objeto
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif isinstance(obj, UUID):
            return str(obj)
        elif isinstance(obj, BaseModel):
            return obj.dict()
        elif isinstance(obj, (list, tuple)):
            return [ModelConverter.to_json_safe(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: ModelConverter.to_json_safe(value) for key, value in obj.items()}
        else:
            return obj
    
    @staticmethod
    def serialize_model(model: BaseModel, include_metadata: bool = True) -> Dict[str, Any]:
        """
        Serializa modelo Pydantic com metadados opcionais.
        
        Args:
            model: Modelo a ser serializado
            include_metadata: Se deve incluir metadados de serialização
            
        Returns:
            Dicionário serializado
        """
        data = model.dict()
        
        if include_metadata:
            data['__model_type__'] = model.__class__.__name__
            data['__serialized_at__'] = datetime.utcnow().isoformat()
            data['__version__'] = getattr(model, 'version', '1.0.0')
        
        return ModelConverter.to_json_safe(data)
    
    @staticmethod
    def deserialize_model(data: Dict[str, Any], model_class: Type[T]) -> T:
        """
        Desserializa dicionário em modelo Pydantic.
        
        Args:
            data: Dados a serem desserializados
            model_class: Classe do modelo alvo
            
        Returns:
            Instância do modelo
            
        Raises:
            ValidationError: Se dados não são válidos para o modelo
        """
        # Remove metadados de serialização se presentes
        clean_data = {
            k: v for k, v in data.items() 
            if not k.startswith('__')
        }
        
        return model_class.parse_obj(clean_data)
    
    @staticmethod
    def convert_document_to_summary(document: Document) -> Dict[str, Any]:
        """
        Converte documento para formato de sumário.
        
        Args:
            document: Documento a ser convertido
            
        Returns:
            Sumário do documento
        """
        return {
            'id': document.id,
            'title': document.title,
            'type': document.classification.document_type.value,
            'status': document.status.value,
            'organization_id': document.organization_id,
            'created_at': document.created_at.isoformat(),
            'updated_at': document.updated_at.isoformat(),
            'version': document.version,
            'file_info': {
                'name': document.metadata.file_name,
                'size': document.metadata.file_size,
                'type': document.metadata.file_type,
                'pages': document.metadata.page_count,
                'words': document.metadata.word_count
            },
            'classification': {
                'primary': document.classification.primary_category,
                'secondary': document.classification.secondary_category,
                'hierarchy': document.classification.to_hierarchy_string()
            },
            'content_preview': document.get_content_preview(200)
        }
    
    @staticmethod
    def convert_analysis_to_dashboard(analysis: AnalysisResult) -> Dict[str, Any]:
        """
        Converte resultado de análise para formato de dashboard.
        
        Args:
            analysis: Resultado da análise
            
        Returns:
            Dados otimizados para dashboard
        """
        findings_by_severity = analysis.get_findings_by_severity()
        findings_by_category = analysis.get_findings_by_category()
        
        return {
            'id': analysis.id,
            'document_id': analysis.document_id,
            'organization_id': analysis.organization_id,
            'overall_score': analysis.weighted_score,
            'scores_breakdown': {
                'structural': analysis.conformity_scores.structural,
                'legal': analysis.conformity_scores.legal,
                'clarity': analysis.conformity_scores.clarity,
                'abnt': analysis.conformity_scores.abnt
            },
            'findings_summary': {
                'total': len(analysis.findings),
                'critical': len(findings_by_severity.get('critica', [])),
                'high': len(findings_by_severity.get('alta', [])),
                'medium': len(findings_by_severity.get('media', [])),
                'low': len(findings_by_severity.get('baixa', []))
            },
            'category_breakdown': {
                category: len(findings)
                for category, findings in findings_by_category.items()
            },
            'top_issues': [
                finding.to_display_dict()
                for finding in sorted(
                    analysis.findings,
                    key=lambda f: (f.get_severity_weight(), f.impact_score),
                    reverse=True
                )[:5]
            ],
            'recommendations': analysis.recommendations[:3],
            'analysis_date': analysis.executed_at.isoformat(),
            'execution_time': analysis.execution_time_seconds,
            'applied_preset': analysis.applied_config.preset_type,
            'weights_applied': analysis.applied_config.weights.to_percentage_dict()
        }
    
    @staticmethod
    def convert_config_to_frontend(config: OrganizationConfig) -> Dict[str, Any]:
        """
        Converte configuração organizacional para formato do frontend.
        
        Args:
            config: Configuração organizacional
            
        Returns:
            Dados otimizados para frontend React
        """
        return {
            'id': config.id,
            'organizationId': config.organization_id,
            'organizationName': config.organization_name,
            'weights': {
                'structural': config.weights.structural,
                'legal': config.weights.legal,
                'clarity': config.weights.clarity,
                'abnt': config.weights.abnt
            },
            'weightsFormatted': config.weights.to_percentage_dict(),
            'presetType': config.preset_type.value,
            'distributionType': config.weights.get_weight_distribution_type(),
            'dominantCategory': config.weights.get_dominant_category(),
            'customRules': [
                {
                    'id': rule.id,
                    'name': rule.name,
                    'description': rule.description,
                    'category': rule.category,
                    'severity': rule.severity,
                    'isActive': rule.is_active,
                    'usageCount': rule.usage_count,
                    'effectivenessScore': rule.effectiveness_score
                }
                for rule in config.custom_rules
            ],
            'templates': [
                {
                    'id': template.id,
                    'name': template.name,
                    'documentType': template.document_type.value,
                    'version': template.version,
                    'sectionsCount': len(template.sections),
                    'isActive': template.is_active,
                    'usageCount': template.usage_count
                }
                for template in config.templates
            ],
            'settings': {
                'autoApprovalThreshold': config.auto_approval_threshold,
                'excludedCategories': config.excluded_categories,
                'minimumThresholds': config.minimum_score_thresholds,
                'notificationSettings': config.notification_settings
            },
            'metadata': {
                'version': config.version,
                'createdAt': config.created_at.isoformat(),
                'updatedAt': config.updated_at.isoformat(),
                'isActive': config.is_active,
                'configHash': config.get_config_hash()[:8]
            }
        }


class ValidationUtils:
    """
    Utilitários para validação cruzada e consistência entre modelos.
    """
    
    @staticmethod
    def validate_analysis_consistency(
        document: Document,
        analysis: AnalysisResult,
        config: OrganizationConfig
    ) -> Dict[str, Any]:
        """
        Valida consistência entre documento, análise e configuração.
        
        Args:
            document: Documento analisado
            analysis: Resultado da análise
            config: Configuração aplicada
            
        Returns:
            Dicionário com resultado da validação
        """
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Validar IDs consistentes
        if document.id != analysis.document_id:
            validation_result['errors'].append(
                f"Document ID mismatch: {document.id} != {analysis.document_id}"
            )
            validation_result['is_valid'] = False
        
        if document.organization_id != analysis.organization_id:
            validation_result['errors'].append(
                f"Organization ID mismatch: {document.organization_id} != {analysis.organization_id}"
            )
            validation_result['is_valid'] = False
        
        if config.organization_id != analysis.organization_id:
            validation_result['errors'].append(
                f"Config organization ID mismatch: {config.organization_id} != {analysis.organization_id}"
            )
            validation_result['is_valid'] = False
        
        # Validar score ponderado
        expected_score = analysis.conformity_scores.calculate_weighted_score(config.weights)
        if abs(analysis.weighted_score - expected_score) > 1.0:
            validation_result['warnings'].append(
                f"Weighted score inconsistency: {analysis.weighted_score} vs expected {expected_score:.1f}"
            )
        
        # Validar versões de configuração
        if config.get_config_hash() != analysis.applied_config.get_config_hash():
            validation_result['warnings'].append(
                "Applied configuration differs from current configuration"
            )
        
        return validation_result
    
    @staticmethod
    def validate_weights_preset_consistency(weights: AnalysisWeights, preset: str) -> bool:
        """
        Valida se pesos são consistentes com preset declarado.
        
        Args:
            weights: Pesos de análise
            preset: Preset declarado
            
        Returns:
            True se consistente
        """
        if preset == 'custom':
            return True
        
        try:
            from .config_models import AnalysisPreset
            expected_weights = AnalysisWeights.from_preset(AnalysisPreset(preset))
            
            # Permite tolerância de 1% em cada peso
            tolerances = {
                'structural': 1.0,
                'legal': 1.0,
                'clarity': 1.0,
                'abnt': 1.0
            }
            
            for category, tolerance in tolerances.items():
                current = getattr(weights, category)
                expected = getattr(expected_weights, category)
                if abs(current - expected) > tolerance:
                    return False
            
            return True
        except Exception:
            return False


class SerializationUtils:
    """
    Utilitários para serialização avançada e formatos específicos.
    """
    
    @staticmethod
    def export_config_to_json(config: OrganizationConfig, pretty: bool = True) -> str:
        """
        Exporta configuração organizacional para JSON.
        
        Args:
            config: Configuração a ser exportada
            pretty: Se deve formatar JSON de forma legível
            
        Returns:
            String JSON da configuração
        """
        data = ModelConverter.serialize_model(config, include_metadata=True)
        
        if pretty:
            return json.dumps(data, indent=2, ensure_ascii=False, default=str)
        else:
            return json.dumps(data, ensure_ascii=False, default=str)
    
    @staticmethod
    def import_config_from_json(json_str: str) -> OrganizationConfig:
        """
        Importa configuração organizacional de JSON.
        
        Args:
            json_str: String JSON da configuração
            
        Returns:
            Instância de OrganizationConfig
            
        Raises:
            ValidationError: Se JSON não é válido
            ValueError: Se JSON não pode ser parsed
        """
        try:
            data = json.loads(json_str)
            return ModelConverter.deserialize_model(data, OrganizationConfig)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {e}")
    
    @staticmethod
    def export_analysis_summary_csv(analyses: List[AnalysisResult]) -> str:
        """
        Exporta sumário de análises para formato CSV.
        
        Args:
            analyses: Lista de resultados de análise
            
        Returns:
            String CSV com dados das análises
        """
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        headers = [
            'ID', 'Document ID', 'Organization ID', 'Execution Date',
            'Overall Score', 'Structural Score', 'Legal Score', 'Clarity Score', 'ABNT Score',
            'Total Findings', 'Critical Issues', 'High Issues', 'Medium Issues', 'Low Issues',
            'Execution Time (s)', 'Preset Applied', 'Model Version'
        ]
        writer.writerow(headers)
        
        # Dados
        for analysis in analyses:
            findings_by_severity = analysis.get_findings_by_severity()
            
            row = [
                analysis.id,
                analysis.document_id,
                analysis.organization_id,
                analysis.executed_at.isoformat(),
                analysis.weighted_score,
                analysis.conformity_scores.structural,
                analysis.conformity_scores.legal,
                analysis.conformity_scores.clarity,
                analysis.conformity_scores.abnt,
                len(analysis.findings),
                len(findings_by_severity.get('critica', [])),
                len(findings_by_severity.get('alta', [])),
                len(findings_by_severity.get('media', [])),
                len(findings_by_severity.get('baixa', [])),
                analysis.execution_time_seconds,
                analysis.applied_config.preset_type,
                analysis.model_version
            ]
            writer.writerow(row)
        
        return output.getvalue()
    
    @staticmethod
    def create_analysis_comparison(
        analyses: List[AnalysisResult],
        comparison_field: str = 'weighted_score'
    ) -> Dict[str, Any]:
        """
        Cria comparação entre múltiples análises.
        
        Args:
            analyses: Lista de análises para comparar
            comparison_field: Campo para comparação
            
        Returns:
            Dicionário com dados de comparação
        """
        if not analyses:
            return {'error': 'No analyses provided'}
        
        comparison = {
            'total_analyses': len(analyses),
            'date_range': {
                'start': min(a.executed_at for a in analyses).isoformat(),
                'end': max(a.executed_at for a in analyses).isoformat()
            },
            'score_statistics': {},
            'findings_statistics': {},
            'organizations': list(set(a.organization_id for a in analyses)),
            'trend_analysis': []
        }
        
        # Estatísticas de score
        scores = [getattr(a, comparison_field) for a in analyses]
        comparison['score_statistics'] = {
            'mean': sum(scores) / len(scores),
            'min': min(scores),
            'max': max(scores),
            'std_dev': (sum((x - sum(scores)/len(scores))**2 for x in scores) / len(scores))**0.5
        }
        
        # Estatísticas de findings
        all_findings_counts = [len(a.findings) for a in analyses]
        comparison['findings_statistics'] = {
            'mean_findings': sum(all_findings_counts) / len(all_findings_counts),
            'min_findings': min(all_findings_counts),
            'max_findings': max(all_findings_counts)
        }
        
        # Análise de tendência (cronológica)
        sorted_analyses = sorted(analyses, key=lambda a: a.executed_at)
        comparison['trend_analysis'] = [
            {
                'date': a.executed_at.isoformat(),
                'score': getattr(a, comparison_field),
                'findings': len(a.findings)
            }
            for a in sorted_analyses
        ]
        
        return comparison


# Funções utilitárias globais para facilitar uso
def serialize_for_api(model: BaseModel) -> Dict[str, Any]:
    """Serializa modelo para resposta de API."""
    return ModelConverter.serialize_model(model, include_metadata=False)


def create_document_summary(document: Document) -> Dict[str, Any]:
    """Cria sumário de documento."""
    return ModelConverter.convert_document_to_summary(document)


def create_dashboard_data(analysis: AnalysisResult) -> Dict[str, Any]:
    """Cria dados para dashboard."""
    return ModelConverter.convert_analysis_to_dashboard(analysis)


def prepare_frontend_config(config: OrganizationConfig) -> Dict[str, Any]:
    """Prepara configuração para frontend."""
    return ModelConverter.convert_config_to_frontend(config)


def validate_models_consistency(
    document: Document,
    analysis: AnalysisResult,
    config: OrganizationConfig
) -> Dict[str, Any]:
    """Valida consistência entre modelos relacionados."""
    return ValidationUtils.validate_analysis_consistency(document, analysis, config)