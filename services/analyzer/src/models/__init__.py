"""
LicitaReview - Modelos de Dados Python

Este módulo contém todos os modelos de dados Pydantic para o sistema LicitaReview,
incluindo documentos, análises e configurações organizacionais.

Estrutura:
- DocumentModels: Modelos para documentos licitatórios
- AnalysisModels: Modelos para resultados de análise
- ConfigModels: Modelos para configurações organizacionais (CORE DIFERENCIAL)
"""

from .document_models import (
    Document,
    DocumentType,
    DocumentClassification,
    DocumentStatus,
    DocumentMetadata,
    LicitationModality
)

from .analysis_models import (
    AnalysisRequest,
    AnalysisResult,
    AnalysisFinding,
    ConformityScore,
    AnalysisStatus,
    ProblemSeverity,
    ProblemCategory
)

from .config_models import (
    OrganizationConfig,
    AnalysisWeights,
    CustomRule,
    AnalysisPreset,
    OrganizationTemplate,
    TemplateSection
)

__all__ = [
    # Document Models
    "Document",
    "DocumentType", 
    "DocumentClassification",
    "DocumentStatus",
    "DocumentMetadata",
    "LicitationModality",
    
    # Analysis Models
    "AnalysisRequest",
    "AnalysisResult",
    "AnalysisFinding",
    "ConformityScore",
    "AnalysisStatus",
    "ProblemSeverity",
    "ProblemCategory",
    
    # Config Models (CORE DIFERENCIAL)
    "OrganizationConfig",
    "AnalysisWeights",
    "CustomRule",
    "AnalysisPreset",
    "OrganizationTemplate",
    "TemplateSection",
]