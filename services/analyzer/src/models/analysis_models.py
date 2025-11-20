"""
LicitaReview - Modelos de Análise

Este módulo contém os modelos Pydantic para representar resultados de análise,
requests de análise e findings específicos do sistema LicitaReview.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from uuid import uuid4

from pydantic import field_validator, ConfigDict, BaseModel, Field, model_validator
from pydantic.types import StrictStr, PositiveInt, confloat

from .config_models import OrganizationConfig, AnalysisWeights


class ProblemSeverity(str, Enum):
    """
    Níveis de severidade dos problemas identificados na análise.
    
    Baseado na criticidade para conformidade licitatória.
    """
    BAIXA = "baixa"
    MEDIA = "media" 
    ALTA = "alta"
    CRITICA = "critica"


class ProblemCategory(str, Enum):
    """
    Categorias de problemas de análise.
    
    Alinhadas com as dimensões de análise do LicitaReview.
    """
    ESTRUTURAL = "estrutural"      # Problemas de estrutura e formatação
    JURIDICO = "juridico"          # Problemas de conformidade legal
    CLAREZA = "clareza"           # Problemas de ambiguidade e legibilidade
    ABNT = "abnt"                 # Problemas com normas técnicas ABNT
    ORCAMENTARIO = "orcamentario"  # Problemas orçamentários
    FORMAL = "formal"             # Problemas de forma e procedimento


class AnalysisStatus(str, Enum):
    """Status da análise de documento."""
    PENDING = "pending"
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConformityScore(BaseModel):
    """
    Pontuações de conformidade por categoria de análise.
    
    Scores individuais para cada dimensão de análise, além do score geral.
    """
    structural: confloat(ge=0.0, le=100.0) = Field(
        ..., 
        description="Pontuação estrutural (0-100)"
    )
    legal: confloat(ge=0.0, le=100.0) = Field(
        ..., 
        description="Pontuação de conformidade jurídica (0-100)"
    )
    clarity: confloat(ge=0.0, le=100.0) = Field(
        ..., 
        description="Pontuação de clareza textual (0-100)"
    )
    abnt: confloat(ge=0.0, le=100.0) = Field(
        ..., 
        description="Pontuação de conformidade ABNT (0-100)"
    )
    overall: confloat(ge=0.0, le=100.0) = Field(
        ..., 
        description="Pontuação geral calculada"
    )
    
    model_config = ConfigDict(validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_overall_score(self):
        """Valida que o score geral está dentro da faixa esperada."""
        structural = values.get('structural', 0)
        legal = values.get('legal', 0)
        clarity = values.get('clarity', 0)
        abnt = values.get('abnt', 0)
        overall = values.get('overall', 0)
        
        # Calcula score médio para validação
        average_score = (structural + legal + clarity + abnt) / 4
        
        # Permite uma tolerância de 10 pontos na diferença
        if abs(overall - average_score) > 10:
            raise ValueError(
                f"Score geral ({overall}) muito distante da média ({average_score:.1f})"
            )
            
        return values
    
    def calculate_weighted_score(self, weights: "AnalysisWeights") -> float:
        """
        Calcula score ponderado baseado nos pesos organizacionais.
        
        Args:
            weights: Pesos de análise da organização
            
        Returns:
            Score ponderado entre 0-100
        """
        
        return (
            self.structural * (weights.structural / 100) +
            self.legal * (weights.legal / 100) +
            self.clarity * (weights.clarity / 100) +
            self.abnt * (weights.abnt / 100)
        )
    
    def get_category_rating(self, category: str) -> str:
        """
        Converte score numérico em rating qualitativo.
        
        Args:
            category: Nome da categoria (structural, legal, etc.)
            
        Returns:
            Rating qualitativo: excelente, bom, regular, insuficiente
        """
        score = getattr(self, category, 0)
        
        if score >= 90:
            return "excelente"
        elif score >= 75:
            return "bom"
        elif score >= 60:
            return "regular"
        else:
            return "insuficiente"
    
    def to_summary_dict(self) -> Dict[str, Any]:
        """Converte para dicionário resumido com ratings."""
        return {
            'scores': {
                'structural': self.structural,
                'legal': self.legal,
                'clarity': self.clarity,
                'abnt': self.abnt,
                'overall': self.overall
            },
            'ratings': {
                'structural': self.get_category_rating('structural'),
                'legal': self.get_category_rating('legal'),
                'clarity': self.get_category_rating('clarity'),
                'abnt': self.get_category_rating('abnt'),
                'overall': self.get_category_rating('overall')
            }
        }


class AnalysisFinding(BaseModel):
    """
    Representa um problema ou achado específico da análise.
    
    Cada finding representa uma questão identificada no documento.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único do finding"
    )
    category: ProblemCategory = Field(
        ...,
        description="Categoria do problema identificado"
    )
    severity: ProblemSeverity = Field(
        ...,
        description="Severidade do problema"
    )
    title: StrictStr = Field(
        ...,
        max_length=200,
        description="Título resumido do problema"
    )
    description: StrictStr = Field(
        ...,
        max_length=1000,
        description="Descrição detalhada do problema"
    )
    suggestion: StrictStr = Field(
        ...,
        max_length=1000,
        description="Sugestão de correção ou melhoria"
    )
    location: Optional[str] = Field(
        None,
        description="Localização no documento (página, seção, etc.)"
    )
    context: Optional[str] = Field(
        None,
        max_length=500,
        description="Contexto específico onde o problema foi encontrado"
    )
    rule_id: Optional[str] = Field(
        None,
        description="ID da regra que gerou este finding"
    )
    confidence: confloat(ge=0.0, le=1.0) = Field(
        1.0,
        description="Nível de confiança na detecção (0.0-1.0)"
    )
    is_custom_rule: bool = Field(
        default=False,
        description="Indica se foi gerado por regra personalizada"
    )
    auto_fixable: bool = Field(
        default=False,
        description="Indica se o problema pode ser corrigido automaticamente"
    )
    regulatory_reference: Optional[str] = Field(
        None,
        description="Referência à legislação ou norma aplicável"
    )
    impact_score: confloat(ge=0.0, le=10.0) = Field(
        default=5.0,
        description="Impacto estimado do problema (0-10)"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_impact_score_by_severity(self):
        """Ajusta impact_score baseado na severidade."""
        if self.severity:
            severity_impacts = {
                ProblemSeverity.BAIXA: (0, 3),
                ProblemSeverity.MEDIA: (3, 6),
                ProblemSeverity.ALTA: (6, 8),
                ProblemSeverity.CRITICA: (8, 10)
            }

            min_impact, max_impact = severity_impacts[self.severity]
            if not (min_impact <= self.impact_score <= max_impact):
                # Ajusta automaticamente se fora da faixa
                self.impact_score = max(min_impact, min(self.impact_score, max_impact))

        return self
    
    def get_severity_weight(self) -> float:
        """
        Retorna o peso numérico da severidade.
        
        Returns:
            Peso de 1-4 baseado na severidade
        """
        weights = {
            ProblemSeverity.BAIXA: 1,
            ProblemSeverity.MEDIA: 2,
            ProblemSeverity.ALTA: 3,
            ProblemSeverity.CRITICA: 4
        }
        return weights[self.severity]
    
    def to_display_dict(self) -> Dict[str, Any]:
        """Converte para dicionário otimizado para display."""
        return {
            'id': self.id,
            'title': self.title,
            'category': self.category.value,
            'severity': self.severity.value,
            'description': self.description,
            'suggestion': self.suggestion,
            'location': self.location,
            'confidence': self.confidence,
            'impact_score': self.impact_score,
            'regulatory_reference': self.regulatory_reference,
            'is_fixable': self.auto_fixable
        }


class AnalysisRequest(BaseModel):
    """
    Request para análise de documento com parâmetros personalizados.
    
    Este é o modelo que define como solicitar uma análise adaptativa
    baseada na configuração organizacional.
    """
    document_id: StrictStr = Field(
        ...,
        description="ID do documento a ser analisado"
    )
    organization_config: OrganizationConfig = Field(
        ...,
        description="Configuração organizacional para análise personalizada"
    )
    analysis_type: str = Field(
        default="standard",
        pattern=r"^(quick|standard|detailed|custom)$",
        description="Tipo de análise: quick, standard, detailed, custom"
    )
    custom_parameters: Dict[str, Any] = Field(
        default_factory=dict,
        description="Parâmetros adicionais personalizados"
    )
    force_reanalysis: bool = Field(
        default=False,
        description="Força reanalise mesmo se existir resultado em cache"
    )
    include_suggestions: bool = Field(
        default=True,
        description="Incluir sugestões de melhoria no resultado"
    )
    max_findings: Optional[PositiveInt] = Field(
        None,
        description="Limite máximo de findings a retornar"
    )
    minimum_confidence: confloat(ge=0.0, le=1.0) = Field(
        default=0.5,
        description="Confiança mínima para incluir findings"
    )
    requested_by: Optional[str] = Field(
        None,
        description="ID do usuário que solicitou a análise"
    )
    priority: str = Field(
        default="normal",
        pattern=r"^(low|normal|high|urgent)$",
        description="Prioridade da análise"
    )
    
    model_config = ConfigDict(validate_assignment=True)
    
    def get_cache_key(self) -> str:
        """
        Gera chave de cache baseada nos parâmetros de análise.
        
        Returns:
            String única para identificar análises equivalentes
        """
        import hashlib
        import json
        
        # Componentes para a chave de cache
        cache_components = {
            'document_id': self.document_id,
            'org_config_hash': self.organization_config.get_config_hash(),
            'analysis_type': self.analysis_type,
            'custom_parameters': self.custom_parameters,
            'minimum_confidence': self.minimum_confidence
        }
        
        cache_string = json.dumps(cache_components, sort_keys=True)
        return hashlib.sha256(cache_string.encode()).hexdigest()[:16]
    
    def to_processing_context(self) -> Dict[str, Any]:
        """
        Converte request para contexto de processamento.
        
        Returns:
            Dicionário com contexto para o motor de análise
        """
        return {
            'document_id': self.document_id,
            'organization_id': self.organization_config.organization_id,
            'analysis_weights': self.organization_config.weights.dict(),
            'custom_rules': [rule.dict() for rule in self.organization_config.custom_rules],
            'analysis_type': self.analysis_type,
            'custom_parameters': self.custom_parameters,
            'quality_settings': {
                'minimum_confidence': self.minimum_confidence,
                'max_findings': self.max_findings,
                'include_suggestions': self.include_suggestions
            }
        }


class AnalysisResult(BaseModel):
    """
    Resultado completo da análise de documento.
    
    Representa o output do motor de análise adaptativo com todos
    os achados, scores e recomendações.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único do resultado de análise"
    )
    document_id: StrictStr = Field(
        ...,
        description="ID do documento analisado"
    )
    organization_id: StrictStr = Field(
        ...,
        description="ID da organização que solicitou a análise"
    )
    request_id: Optional[str] = Field(
        None,
        description="ID do request original de análise"
    )
    status: AnalysisStatus = Field(
        default=AnalysisStatus.COMPLETED,
        description="Status da análise"
    )
    conformity_scores: ConformityScore = Field(
        ...,
        description="Pontuações de conformidade por categoria"
    )
    weighted_score: confloat(ge=0.0, le=100.0) = Field(
        ...,
        description="Score final ponderado pelos pesos organizacionais"
    )
    findings: List[AnalysisFinding] = Field(
        default_factory=list,
        description="Lista de problemas e achados identificados"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="Recomendações gerais de melhoria"
    )
    applied_config: OrganizationConfig = Field(
        ...,
        description="Configuração organizacional aplicada na análise"
    )
    analysis_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadados técnicos da análise"
    )
    executed_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data e hora de execução da análise"
    )
    execution_time_seconds: Optional[float] = Field(
        None,
        description="Tempo de execução em segundos"
    )
    model_version: str = Field(
        default="2.0.0",
        description="Versão do modelo de análise utilizado"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_weighted_score(self):
        """Valida que o weighted_score está consistente com os scores e pesos."""
        conformity_scores = values.get('conformity_scores')
        applied_config = values.get('applied_config')
        weighted_score = values.get('weighted_score')
        
        if all([conformity_scores, applied_config, weighted_score is not None]):
            expected_weighted = conformity_scores.calculate_weighted_score(
                applied_config.weights
            )
            
            # Permite tolerância de 1 ponto
            if abs(weighted_score - expected_weighted) > 1.0:
                raise ValueError(
                    f"Weighted score ({weighted_score}) inconsistente com cálculo "
                    f"esperado ({expected_weighted:.1f})"
                )
        
        return values
    
    def get_findings_by_severity(self) -> Dict[str, List[AnalysisFinding]]:
        """
        Agrupa findings por severidade.
        
        Returns:
            Dict com findings agrupados por severidade
        """
        grouped = {
            'critica': [],
            'alta': [],
            'media': [],
            'baixa': []
        }
        
        for finding in self.findings:
            grouped[finding.severity.value].append(finding)
        
        return grouped
    
    def get_findings_by_category(self) -> Dict[str, List[AnalysisFinding]]:
        """
        Agrupa findings por categoria.
        
        Returns:
            Dict com findings agrupados por categoria
        """
        grouped = {}
        
        for finding in self.findings:
            category = finding.category.value
            if category not in grouped:
                grouped[category] = []
            grouped[category].append(finding)
        
        return grouped
    
    def calculate_improvement_potential(self) -> Dict[str, float]:
        """
        Calcula potencial de melhoria por categoria.
        
        Returns:
            Dict com potencial de melhoria (0-100) por categoria
        """
        potential = {}
        
        for category in ['structural', 'legal', 'clarity', 'abnt']:
            current_score = getattr(self.conformity_scores, category)
            
            # Calcula potencial baseado no score atual e findings
            category_findings = [
                f for f in self.findings 
                if f.category.value == category
            ]
            
            # Score máximo alcançável considerando os problemas identificados
            max_improvement = sum(f.impact_score for f in category_findings) * 2
            potential_score = min(100, current_score + max_improvement)
            
            potential[category] = potential_score - current_score
        
        return potential
    
    def generate_executive_summary(self) -> Dict[str, Any]:
        """
        Gera sumário executivo da análise.
        
        Returns:
            Dict com sumário para apresentação
        """
        severity_counts = {}
        category_counts = {}
        
        for finding in self.findings:
            # Conta por severidade
            sev = finding.severity.value
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            
            # Conta por categoria
            cat = finding.category.value
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        return {
            'overall_score': self.weighted_score,
            'total_findings': len(self.findings),
            'critical_issues': severity_counts.get('critica', 0),
            'high_priority_issues': severity_counts.get('alta', 0),
            'category_breakdown': category_counts,
            'scores_by_category': {
                'structural': self.conformity_scores.structural,
                'legal': self.conformity_scores.legal,
                'clarity': self.conformity_scores.clarity,
                'abnt': self.conformity_scores.abnt
            },
            'improvement_potential': self.calculate_improvement_potential(),
            'top_recommendations': self.recommendations[:3],
            'analysis_date': self.executed_at.isoformat(),
            'organization_preset': self.applied_config.preset_type
        }
    
    def to_detailed_dict(self) -> Dict[str, Any]:
        """Converte para dicionário detalhado para APIs."""
        return {
            'id': self.id,
            'document_id': self.document_id,
            'organization_id': self.organization_id,
            'status': self.status.value,
            'weighted_score': self.weighted_score,
            'conformity_scores': self.conformity_scores.dict(),
            'findings': [f.to_display_dict() for f in self.findings],
            'findings_by_severity': {
                k: len(v) for k, v in self.get_findings_by_severity().items()
            },
            'findings_by_category': {
                k: len(v) for k, v in self.get_findings_by_category().items()
            },
            'recommendations': self.recommendations,
            'applied_weights': self.applied_config.weights.dict(),
            'executive_summary': self.generate_executive_summary(),
            'executed_at': self.executed_at.isoformat(),
            'execution_time': self.execution_time_seconds,
            'model_version': self.model_version
        }


class DocumentUploadResponse(BaseModel):
    """
    Resposta do upload e processamento de documento.
    
    Retornada após o upload bem-sucedido de um documento para análise.
    """
    document_id: StrictStr = Field(
        ...,
        description="ID único gerado para o documento"
    )
    filename: Optional[str] = Field(
        None,
        description="Nome original do arquivo"
    )
    file_type: StrictStr = Field(
        ...,
        description="Tipo MIME do arquivo"
    )
    file_size: PositiveInt = Field(
        ...,
        description="Tamanho do arquivo em bytes"
    )
    extracted_text_length: PositiveInt = Field(
        ...,
        description="Comprimento do texto extraído"
    )
    document_type: Optional[str] = Field(
        None,
        description="Tipo de documento identificado automaticamente"
    )
    processing_status: str = Field(
        default="completed",
        pattern=r"^(processing|completed|failed)$",
        description="Status do processamento"
    )
    upload_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data e hora do upload"
    )
    preview_text: Optional[str] = Field(
        None,
        max_length=500,
        description="Prévia do texto extraído"
    )
    detected_language: Optional[str] = Field(
        None,
        description="Idioma detectado no documento"
    )
    estimated_analysis_time: Optional[int] = Field(
        None,
        description="Tempo estimado para análise em segundos"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)


class AnalysisResponse(BaseModel):
    """
    Resposta completa de uma análise de documento.
    
    Modelo de resposta para APIs que inclui tanto o resultado
    da análise quanto metadados adicionais.
    """
    analysis_result: AnalysisResult = Field(
        ...,
        description="Resultado completo da análise"
    )
    processing_info: Dict[str, Any] = Field(
        default_factory=dict,
        description="Informações sobre o processamento"
    )
    api_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadados da API"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    @property
    def overall_score(self) -> float:
        """Accessor para o score ponderado final."""
        return self.analysis_result.weighted_score
    
    @property
    def total_findings(self) -> int:
        """Accessor para o total de findings."""
        return len(self.analysis_result.findings)
    
    @property
    def critical_findings(self) -> int:
        """Accessor para findings críticos."""
        return len([
            f for f in self.analysis_result.findings 
            if f.severity == ProblemSeverity.CRITICA
        ])
    
    def to_summary_dict(self) -> Dict[str, Any]:
        """Converte para dicionário resumido para APIs."""
        return {
            'document_id': self.analysis_result.document_id,
            'organization_id': self.analysis_result.organization_id,
            'overall_score': self.overall_score,
            'total_findings': self.total_findings,
            'critical_findings': self.critical_findings,
            'analysis_status': self.analysis_result.status.value,
            'executed_at': self.analysis_result.executed_at.isoformat(),
            'execution_time': self.analysis_result.execution_time_seconds,
            'applied_preset': self.analysis_result.applied_config.preset_type.value,
            'weight_distribution': self.analysis_result.applied_config.weights.get_weight_distribution_type(),
            'processing_info': self.processing_info
        }