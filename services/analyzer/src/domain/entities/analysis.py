"""
Analysis Entity - Refatorada

Entidade representando uma análise de documento
com todos os resultados e metadados associados.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import uuid

from .document import DocumentId
from .organization import OrganizationId


class AnalysisStatus(str, Enum):
    """Status possíveis de uma análise."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FindingSeverity(str, Enum):
    """Severidade dos findings."""
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"


class FindingCategory(str, Enum):
    """Categorias dos findings."""
    ESTRUTURAL = "estrutural"
    JURIDICO = "juridico"
    CLAREZA = "clareza"
    ABNT = "abnt"


@dataclass(frozen=True)
class AnalysisId:
    """Value Object para ID de análise."""
    value: str

    def __post_init__(self):
        if not self.value:
            raise ValueError("Analysis ID não pode estar vazio")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class ConformityScores:
    """Value Object para scores de conformidade."""
    structural: float
    legal: float
    clarity: float
    abnt: float
    overall: float

    def __post_init__(self):
        """Validações pós-inicialização."""
        scores = [self.structural, self.legal, self.clarity, self.abnt, self.overall]
        
        if any(score < 0 or score > 100 for score in scores):
            raise ValueError("Todos os scores devem estar entre 0 e 100")

    def get_category_rating(self, category: str) -> str:
        """
        Converte score numérico em rating qualitativo.
        
        Args:
            category: Nome da categoria
            
        Returns:
            Rating: excelente, bom, regular, insuficiente
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

    def to_dict(self) -> Dict[str, float]:
        """Converte para dicionário."""
        return {
            'structural': self.structural,
            'legal': self.legal,
            'clarity': self.clarity,
            'abnt': self.abnt,
            'overall': self.overall
        }

    def calculate_weighted_score(self, weights: 'AnalysisWeights') -> float:
        """
        Calcula score ponderado baseado nos pesos organizacionais.
        
        Args:
            weights: Pesos de análise da organização
            
        Returns:
            Score ponderado entre 0-100
        """
        from .organization import AnalysisWeights
        
        return (
            self.structural * (weights.structural / 100) +
            self.legal * (weights.legal / 100) +
            self.clarity * (weights.clarity / 100) +
            self.abnt * (weights.abnt / 100)
        )


@dataclass
class Finding:
    """
    Representa um achado/problema específico identificado na análise.
    """
    id: str
    category: FindingCategory
    severity: FindingSeverity
    title: str
    description: str
    suggestion: str
    location: Optional[str] = None
    context: Optional[str] = None
    rule_id: Optional[str] = None
    confidence: float = 1.0
    is_custom_rule: bool = False
    regulatory_reference: Optional[str] = None
    impact_score: float = 5.0
    created_at: datetime = field(default_factory=datetime.utcnow)

    def __post_init__(self):
        """Validações pós-inicialização."""
        self._validate()

    def _validate(self) -> None:
        """Valida invariantes do finding."""
        if not self.title.strip():
            raise ValueError("Título do finding não pode estar vazio")
        
        if not self.description.strip():
            raise ValueError("Descrição do finding não pode estar vazia")
        
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("Confiança deve estar entre 0.0 e 1.0")
        
        if not 0.0 <= self.impact_score <= 10.0:
            raise ValueError("Impact score deve estar entre 0.0 e 10.0")

    def get_severity_weight(self) -> float:
        """
        Retorna peso numérico da severidade.
        
        Returns:
            Peso de 1-4 baseado na severidade
        """
        weights = {
            FindingSeverity.BAIXA: 1.0,
            FindingSeverity.MEDIA: 2.0,
            FindingSeverity.ALTA: 3.0,
            FindingSeverity.CRITICA: 4.0
        }
        return weights[self.severity]

    def to_dict(self) -> Dict[str, Any]:
        """Converte finding para dicionário."""
        return {
            'id': self.id,
            'category': self.category.value,
            'severity': self.severity.value,
            'title': self.title,
            'description': self.description,
            'suggestion': self.suggestion,
            'location': self.location,
            'context': self.context,
            'rule_id': self.rule_id,
            'confidence': self.confidence,
            'is_custom_rule': self.is_custom_rule,
            'regulatory_reference': self.regulatory_reference,
            'impact_score': self.impact_score,
            'severity_weight': self.get_severity_weight(),
            'created_at': self.created_at.isoformat()
        }


@dataclass
class AnalysisMetrics:
    """Métricas e estatísticas da análise."""
    execution_time_seconds: float
    total_findings: int
    findings_by_severity: Dict[str, int] = field(default_factory=dict)
    findings_by_category: Dict[str, int] = field(default_factory=dict)
    custom_rules_applied: int = 0
    templates_validated: int = 0
    cache_hit: bool = False
    processing_steps: List[str] = field(default_factory=list)
    
    def add_processing_step(self, step: str) -> None:
        """Adiciona etapa de processamento."""
        self.processing_steps.append(step)

    def to_dict(self) -> Dict[str, Any]:
        """Converte métricas para dicionário."""
        return {
            'execution_time_seconds': self.execution_time_seconds,
            'total_findings': self.total_findings,
            'findings_by_severity': self.findings_by_severity,
            'findings_by_category': self.findings_by_category,
            'custom_rules_applied': self.custom_rules_applied,
            'templates_validated': self.templates_validated,
            'cache_hit': self.cache_hit,
            'processing_steps': self.processing_steps
        }


@dataclass
class Analysis:
    """
    Entidade Analysis refatorada.
    
    Representa uma análise completa de documento com resultados,
    findings, métricas e recomendações.
    """
    id: AnalysisId
    document_id: DocumentId
    organization_id: OrganizationId
    status: AnalysisStatus
    conformity_scores: ConformityScores
    weighted_score: float
    findings: List[Finding] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    metrics: Optional[AnalysisMetrics] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    version: str = "2.0.0"

    def __post_init__(self):
        """Validações pós-inicialização."""
        self._validate()

    def _validate(self) -> None:
        """Valida invariantes da análise."""
        if not 0.0 <= self.weighted_score <= 100.0:
            raise ValueError("Weighted score deve estar entre 0.0 e 100.0")

    def mark_as_completed(self) -> None:
        """Marca análise como completada."""
        self.status = AnalysisStatus.COMPLETED
        self.completed_at = datetime.utcnow()

    def mark_as_failed(self, error_message: str) -> None:
        """
        Marca análise como falhada.
        
        Args:
            error_message: Mensagem de erro
        """
        self.status = AnalysisStatus.FAILED
        self.error_message = error_message
        self.completed_at = datetime.utcnow()

    def add_finding(self, finding: Finding) -> None:
        """
        Adiciona finding à análise.
        
        Args:
            finding: Finding a ser adicionado
        """
        self.findings.append(finding)

    def get_findings_by_severity(self, severity: FindingSeverity) -> List[Finding]:
        """
        Obtém findings por severidade.
        
        Args:
            severity: Severidade dos findings
            
        Returns:
            Lista de findings da severidade especificada
        """
        return [f for f in self.findings if f.severity == severity]

    def get_findings_by_category(self, category: FindingCategory) -> List[Finding]:
        """
        Obtém findings por categoria.
        
        Args:
            category: Categoria dos findings
            
        Returns:
            Lista de findings da categoria especificada
        """
        return [f for f in self.findings if f.category == category]

    def get_critical_findings(self) -> List[Finding]:
        """Obtém apenas findings críticos."""
        return self.get_findings_by_severity(FindingSeverity.CRITICA)

    def get_custom_rule_findings(self) -> List[Finding]:
        """Obtém findings gerados por regras personalizadas."""
        return [f for f in self.findings if f.is_custom_rule]

    def calculate_improvement_potential(self) -> Dict[str, float]:
        """
        Calcula potencial de melhoria por categoria.
        
        Returns:
            Dict com potencial de melhoria por categoria
        """
        potential = {}
        
        for category in ['structural', 'legal', 'clarity', 'abnt']:
            current_score = getattr(self.conformity_scores, category)
            
            # Findings da categoria
            category_findings = [
                f for f in self.findings
                if f.category.value == category
            ]
            
            # Potencial baseado no impacto dos findings
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
            severity_counts[finding.severity.value] = severity_counts.get(finding.severity.value, 0) + 1
            
            # Conta por categoria
            category_counts[finding.category.value] = category_counts.get(finding.category.value, 0) + 1
        
        return {
            'analysis_id': str(self.id),
            'document_id': str(self.document_id),
            'organization_id': str(self.organization_id),
            'overall_score': self.weighted_score,
            'status': self.status.value,
            'total_findings': len(self.findings),
            'critical_issues': severity_counts.get('critica', 0),
            'high_priority_issues': severity_counts.get('alta', 0),
            'category_breakdown': category_counts,
            'scores_by_category': self.conformity_scores.to_dict(),
            'improvement_potential': self.calculate_improvement_potential(),
            'top_recommendations': self.recommendations[:3],
            'analysis_date': self.created_at.isoformat(),
            'completion_date': self.completed_at.isoformat() if self.completed_at else None,
            'custom_rules_findings': len(self.get_custom_rule_findings()),
            'version': self.version
        }

    def to_dict(self) -> Dict[str, Any]:
        """Converte análise para dicionário completo."""
        return {
            'id': str(self.id),
            'document_id': str(self.document_id),
            'organization_id': str(self.organization_id),
            'status': self.status.value,
            'conformity_scores': self.conformity_scores.to_dict(),
            'weighted_score': self.weighted_score,
            'findings': [f.to_dict() for f in self.findings],
            'recommendations': self.recommendations,
            'metrics': self.metrics.to_dict() if self.metrics else None,
            'created_at': self.created_at.isoformat(),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'error_message': self.error_message,
            'version': self.version,
            'executive_summary': self.generate_executive_summary(),
            'improvement_potential': self.calculate_improvement_potential()
        }

    @classmethod
    def create(
        cls,
        document_id: str,
        organization_id: str,
        conformity_scores: ConformityScores,
        weighted_score: float
    ) -> 'Analysis':
        """
        Factory method para criar análise.
        
        Args:
            document_id: ID do documento analisado
            organization_id: ID da organização
            conformity_scores: Scores de conformidade
            weighted_score: Score ponderado final
            
        Returns:
            Nova instância de Analysis
        """
        analysis_id = str(uuid.uuid4())
        
        return cls(
            id=AnalysisId(analysis_id),
            document_id=DocumentId(document_id),
            organization_id=OrganizationId(organization_id),
            status=AnalysisStatus.PENDING,
            conformity_scores=conformity_scores,
            weighted_score=weighted_score
        )

    def __eq__(self, other) -> bool:
        """Igualdade baseada no ID."""
        if not isinstance(other, Analysis):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash baseado no ID."""
        return hash(self.id)

    def __str__(self) -> str:
        """Representação string."""
        return f"Analysis(id={self.id}, document={self.document_id}, score={self.weighted_score:.1f})"