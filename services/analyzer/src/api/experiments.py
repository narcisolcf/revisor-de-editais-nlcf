"""
API Endpoints para Gerenciamento de Experimentos A/B

Permite criar, gerenciar e monitorar experimentos de modelos AI/ML.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from ..ml.ab_testing import (
    ABTestManager,
    ExperimentConfig,
    ModelVariant,
    PromptStrategy,
    RetrievalStrategy,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/experiments", tags=["experiments"])

# Global ABTestManager instance
ab_test_manager = ABTestManager()


# ============================================================================
# Pydantic Models
# ============================================================================

class ExperimentCreate(BaseModel):
    """Request para criar experimento."""
    experiment_id: str = Field(..., description="ID único do experimento")
    name: str = Field(..., description="Nome do experimento")
    description: str = Field(..., description="Descrição detalhada")

    # Model configuration
    model_variant: ModelVariant
    temperature: float = Field(default=0.2, ge=0.0, le=1.0)
    top_p: float = Field(default=0.95, ge=0.0, le=1.0)
    max_tokens: int = Field(default=8192, ge=1, le=32768)

    # RAG configuration
    retrieval_strategy: RetrievalStrategy = RetrievalStrategy.STANDARD
    similarity_top_k: int = Field(default=10, ge=1, le=50)
    vector_threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    enable_reranking: bool = False

    # Prompt configuration
    prompt_strategy: PromptStrategy = PromptStrategy.DETAILED
    system_prompt: Optional[str] = None

    # Experiment settings
    traffic_percentage: float = Field(default=0.5, ge=0.0, le=1.0)
    is_active: bool = True


class ExperimentUpdate(BaseModel):
    """Request para atualizar experimento."""
    name: Optional[str] = None
    description: Optional[str] = None
    traffic_percentage: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_active: Optional[bool] = None


class ResultRecord(BaseModel):
    """Request para registrar resultado de execução."""
    experiment_id: str
    latency_ms: float
    tokens_used: int
    success: bool = True


class FeedbackRecord(BaseModel):
    """Request para registrar feedback do usuário."""
    experiment_id: str
    is_positive: bool
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    comment: Optional[str] = None


class ExperimentResponse(BaseModel):
    """Response com dados do experimento."""
    experiment_id: str
    name: str
    description: str
    model_variant: str
    is_active: bool
    traffic_percentage: float
    metrics: Dict[str, Any]
    created_at: Optional[str] = None


class ComparisonResponse(BaseModel):
    """Response com comparação de experimentos."""
    experiment_a: Dict[str, Any]
    experiment_b: Dict[str, Any]
    comparison: Dict[str, Any]


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/", response_model=ExperimentResponse, status_code=201)
async def create_experiment(experiment: ExperimentCreate):
    """
    Cria um novo experimento A/B.

    Args:
        experiment: Configuração do experimento

    Returns:
        Experimento criado com metadata

    Raises:
        400: Se experimento já existe
    """
    # Verificar se já existe
    if experiment.experiment_id in ab_test_manager.experiments:
        raise HTTPException(
            status_code=400,
            detail=f"Experiment {experiment.experiment_id} already exists"
        )

    try:
        # Criar experimento
        exp = ab_test_manager.create_experiment(
            experiment_id=experiment.experiment_id,
            name=experiment.name,
            description=experiment.description,
            model_variant=experiment.model_variant,
            temperature=experiment.temperature,
            top_p=experiment.top_p,
            max_tokens=experiment.max_tokens,
            retrieval_strategy=experiment.retrieval_strategy,
            similarity_top_k=experiment.similarity_top_k,
            vector_threshold=experiment.vector_threshold,
            enable_reranking=experiment.enable_reranking,
            prompt_strategy=experiment.prompt_strategy,
            system_prompt=experiment.system_prompt,
            traffic_percentage=experiment.traffic_percentage,
            is_active=experiment.is_active,
        )

        logger.info(f"Created experiment: {experiment.experiment_id}")

        return ExperimentResponse(
            experiment_id=exp.experiment_id,
            name=exp.name,
            description=exp.description,
            model_variant=exp.model_variant.value,
            is_active=exp.is_active,
            traffic_percentage=exp.traffic_percentage,
            metrics={
                'total_requests': exp.total_requests,
                'success_rate': exp.get_success_rate(),
                'feedback_score': exp.get_feedback_score(),
            },
            created_at=exp.start_date.isoformat() if exp.start_date else None,
        )

    except Exception as e:
        logger.error(f"Failed to create experiment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[ExperimentResponse])
async def list_experiments(
    active_only: bool = Query(False, description="Retornar apenas experimentos ativos")
):
    """
    Lista todos os experimentos.

    Args:
        active_only: Se True, retorna apenas experimentos ativos

    Returns:
        Lista de experimentos
    """
    experiments = ab_test_manager.experiments.values()

    if active_only:
        experiments = [exp for exp in experiments if exp.is_active]

    return [
        ExperimentResponse(
            experiment_id=exp.experiment_id,
            name=exp.name,
            description=exp.description,
            model_variant=exp.model_variant.value,
            is_active=exp.is_active,
            traffic_percentage=exp.traffic_percentage,
            metrics={
                'total_requests': exp.total_requests,
                'success_rate': exp.get_success_rate(),
                'avg_latency_ms': exp.avg_latency_ms,
                'avg_tokens': exp.avg_tokens,
                'feedback_score': exp.get_feedback_score(),
            },
            created_at=exp.start_date.isoformat() if exp.start_date else None,
        )
        for exp in experiments
    ]


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(experiment_id: str):
    """
    Obtém detalhes de um experimento específico.

    Args:
        experiment_id: ID do experimento

    Returns:
        Dados detalhados do experimento

    Raises:
        404: Se experimento não existe
    """
    if experiment_id not in ab_test_manager.experiments:
        raise HTTPException(
            status_code=404,
            detail=f"Experiment {experiment_id} not found"
        )

    exp = ab_test_manager.experiments[experiment_id]

    return ExperimentResponse(
        experiment_id=exp.experiment_id,
        name=exp.name,
        description=exp.description,
        model_variant=exp.model_variant.value,
        is_active=exp.is_active,
        traffic_percentage=exp.traffic_percentage,
        metrics={
            'total_requests': exp.total_requests,
            'success_rate': exp.get_success_rate(),
            'error_count': exp.error_count,
            'avg_latency_ms': exp.avg_latency_ms,
            'avg_tokens': exp.avg_tokens,
            'positive_feedback': exp.positive_feedback,
            'negative_feedback': exp.negative_feedback,
            'feedback_score': exp.get_feedback_score(),
            'avg_rating': exp.avg_rating,
        },
        created_at=exp.start_date.isoformat() if exp.start_date else None,
    )


@router.patch("/{experiment_id}", response_model=ExperimentResponse)
async def update_experiment(experiment_id: str, update: ExperimentUpdate):
    """
    Atualiza configuração de um experimento.

    Args:
        experiment_id: ID do experimento
        update: Campos a atualizar

    Returns:
        Experimento atualizado

    Raises:
        404: Se experimento não existe
    """
    if experiment_id not in ab_test_manager.experiments:
        raise HTTPException(
            status_code=404,
            detail=f"Experiment {experiment_id} not found"
        )

    exp = ab_test_manager.experiments[experiment_id]

    # Atualizar campos
    if update.name is not None:
        exp.name = update.name
    if update.description is not None:
        exp.description = update.description
    if update.traffic_percentage is not None:
        exp.traffic_percentage = update.traffic_percentage
    if update.is_active is not None:
        exp.is_active = update.is_active

    logger.info(f"Updated experiment: {experiment_id}")

    return ExperimentResponse(
        experiment_id=exp.experiment_id,
        name=exp.name,
        description=exp.description,
        model_variant=exp.model_variant.value,
        is_active=exp.is_active,
        traffic_percentage=exp.traffic_percentage,
        metrics={
            'total_requests': exp.total_requests,
            'success_rate': exp.get_success_rate(),
            'feedback_score': exp.get_feedback_score(),
        },
        created_at=exp.start_date.isoformat() if exp.start_date else None,
    )


@router.delete("/{experiment_id}", status_code=204)
async def delete_experiment(experiment_id: str):
    """
    Remove um experimento.

    Args:
        experiment_id: ID do experimento

    Raises:
        404: Se experimento não existe
    """
    if experiment_id not in ab_test_manager.experiments:
        raise HTTPException(
            status_code=404,
            detail=f"Experiment {experiment_id} not found"
        )

    del ab_test_manager.experiments[experiment_id]
    logger.info(f"Deleted experiment: {experiment_id}")


@router.post("/control-group")
async def set_control_group(experiment_id: str):
    """
    Define o grupo de controle (baseline).

    Args:
        experiment_id: ID do experimento a usar como controle

    Raises:
        404: Se experimento não existe
    """
    try:
        ab_test_manager.set_control_group(experiment_id)
        logger.info(f"Set control group: {experiment_id}")

        return {
            "status": "success",
            "control_group": experiment_id
        }

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/select/variant")
async def select_variant(user_id: Optional[str] = None):
    """
    Seleciona uma variante para o usuário.

    Args:
        user_id: ID do usuário (opcional, para consistência)

    Returns:
        Configuração do experimento selecionado
    """
    try:
        variant = ab_test_manager.select_variant(user_id=user_id)

        return {
            "experiment_id": variant.experiment_id,
            "name": variant.name,
            "model_variant": variant.model_variant.value,
            "temperature": variant.temperature,
            "retrieval_strategy": variant.retrieval_strategy.value,
            "prompt_strategy": variant.prompt_strategy.value,
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/results", status_code=201)
async def record_result(result: ResultRecord):
    """
    Registra resultado de uma execução.

    Args:
        result: Dados do resultado

    Returns:
        Confirmação
    """
    ab_test_manager.record_result(
        experiment_id=result.experiment_id,
        latency_ms=result.latency_ms,
        tokens_used=result.tokens_used,
        success=result.success,
    )

    return {"status": "recorded"}


@router.post("/feedback", status_code=201)
async def record_feedback(feedback: FeedbackRecord):
    """
    Registra feedback do usuário.

    Args:
        feedback: Dados do feedback

    Returns:
        Confirmação
    """
    ab_test_manager.record_feedback(
        experiment_id=feedback.experiment_id,
        is_positive=feedback.is_positive,
        rating=feedback.rating,
    )

    logger.info(
        f"Recorded feedback for {feedback.experiment_id}: "
        f"positive={feedback.is_positive}"
    )

    return {"status": "recorded"}


@router.get("/compare/{experiment_a_id}/{experiment_b_id}", response_model=ComparisonResponse)
async def compare_experiments(experiment_a_id: str, experiment_b_id: str):
    """
    Compara dois experimentos.

    Args:
        experiment_a_id: ID do primeiro experimento
        experiment_b_id: ID do segundo experimento

    Returns:
        Comparação detalhada com métricas e vencedor

    Raises:
        404: Se algum experimento não existe
    """
    try:
        comparison = ab_test_manager.compare_experiments(
            experiment_a_id,
            experiment_b_id
        )

        return ComparisonResponse(**comparison)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/export")
async def export_results(filepath: str = Query(..., description="Caminho do arquivo JSON")):
    """
    Exporta resultados de todos os experimentos para JSON.

    Args:
        filepath: Caminho onde salvar o arquivo

    Returns:
        Confirmação
    """
    try:
        ab_test_manager.export_results(filepath)
        logger.info(f"Exported results to {filepath}")

        return {
            "status": "success",
            "filepath": filepath,
            "experiments_count": len(ab_test_manager.experiments),
        }

    except Exception as e:
        logger.error(f"Failed to export results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Initialization
# ============================================================================

def initialize_default_experiments():
    """Inicializa experimentos padrão se não existirem."""
    if not ab_test_manager.experiments:
        from ..ml.ab_testing import create_default_experiments
        global ab_test_manager
        ab_test_manager = create_default_experiments()
        logger.info("Initialized default experiments")


# Inicializar ao carregar módulo
initialize_default_experiments()
