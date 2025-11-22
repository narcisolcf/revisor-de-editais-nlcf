"""
A/B Testing Framework para Modelos de AI/ML

Este módulo permite testar diferentes modelos, prompts e configurações
para otimizar a qualidade das análises.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import random
import json


class ModelVariant(str, Enum):
    """Variantes de modelos disponíveis."""
    GEMINI_2_FLASH = "gemini-2.0-flash-001"
    GEMINI_PRO = "gemini-1.5-pro-002"
    GEMINI_FLASH = "gemini-1.5-flash-002"


class PromptStrategy(str, Enum):
    """Estratégias de prompt."""
    CONCISE = "concise"          # Respostas curtas e diretas
    DETAILED = "detailed"        # Análises detalhadas
    STRUCTURED = "structured"    # Output estruturado (JSON)
    CONVERSATIONAL = "conversational"  # Tom mais natural


class RetrievalStrategy(str, Enum):
    """Estratégias de retrieval RAG."""
    STANDARD = "standard"        # Top-K padrão
    RERANKED = "reranked"       # Com reranking
    HYBRID = "hybrid"           # Keyword + semantic
    MMR = "mmr"                 # Maximum Marginal Relevance


@dataclass
class ExperimentConfig:
    """Configuração de um experimento A/B."""

    experiment_id: str
    name: str
    description: str

    # Model configuration
    model_variant: ModelVariant
    temperature: float = 0.2
    top_p: float = 0.95
    max_tokens: int = 8192

    # RAG configuration
    retrieval_strategy: RetrievalStrategy = RetrievalStrategy.STANDARD
    similarity_top_k: int = 10
    vector_threshold: float = 0.5
    enable_reranking: bool = False

    # Prompt configuration
    prompt_strategy: PromptStrategy = PromptStrategy.DETAILED
    system_prompt: Optional[str] = None

    # Experiment settings
    traffic_percentage: float = 0.5  # 50% de tráfego
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True

    # Metrics
    total_requests: int = 0
    success_count: int = 0
    error_count: int = 0
    avg_latency_ms: float = 0.0
    avg_tokens: float = 0.0

    # Feedback metrics
    positive_feedback: int = 0
    negative_feedback: int = 0
    avg_rating: float = 0.0

    def __post_init__(self):
        if self.start_date is None:
            self.start_date = datetime.utcnow()

    def get_success_rate(self) -> float:
        """Calcula taxa de sucesso."""
        if self.total_requests == 0:
            return 0.0
        return (self.success_count / self.total_requests) * 100

    def get_feedback_score(self) -> float:
        """Calcula score de feedback (0-100)."""
        total_feedback = self.positive_feedback + self.negative_feedback
        if total_feedback == 0:
            return 0.0
        return (self.positive_feedback / total_feedback) * 100

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'experiment_id': self.experiment_id,
            'name': self.name,
            'description': self.description,
            'model_variant': self.model_variant.value,
            'temperature': self.temperature,
            'top_p': self.top_p,
            'max_tokens': self.max_tokens,
            'retrieval_strategy': self.retrieval_strategy.value,
            'similarity_top_k': self.similarity_top_k,
            'vector_threshold': self.vector_threshold,
            'enable_reranking': self.enable_reranking,
            'prompt_strategy': self.prompt_strategy.value,
            'traffic_percentage': self.traffic_percentage,
            'is_active': self.is_active,
            'metrics': {
                'total_requests': self.total_requests,
                'success_rate': self.get_success_rate(),
                'avg_latency_ms': self.avg_latency_ms,
                'avg_tokens': self.avg_tokens,
                'feedback_score': self.get_feedback_score(),
            }
        }


class ABTestManager:
    """
    Gerenciador de testes A/B.

    Permite criar, gerenciar e analisar experimentos A/B
    para otimização de modelos e configurações.
    """

    def __init__(self):
        self.experiments: Dict[str, ExperimentConfig] = {}
        self.control_group: Optional[ExperimentConfig] = None

    def create_experiment(
        self,
        experiment_id: str,
        name: str,
        description: str,
        **kwargs
    ) -> ExperimentConfig:
        """
        Cria um novo experimento A/B.

        Args:
            experiment_id: ID único do experimento
            name: Nome do experimento
            description: Descrição
            **kwargs: Parâmetros da ExperimentConfig

        Returns:
            Configuração do experimento
        """
        experiment = ExperimentConfig(
            experiment_id=experiment_id,
            name=name,
            description=description,
            **kwargs
        )

        self.experiments[experiment_id] = experiment
        return experiment

    def set_control_group(self, experiment_id: str):
        """Define o grupo de controle (baseline)."""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")
        self.control_group = self.experiments[experiment_id]

    def select_variant(self, user_id: Optional[str] = None) -> ExperimentConfig:
        """
        Seleciona uma variante para o usuário.

        Usa traffic_percentage para distribuição de tráfego.
        Se user_id fornecido, usa hash para consistência.

        Args:
            user_id: ID do usuário (opcional)

        Returns:
            Configuração selecionada
        """
        active_experiments = [
            exp for exp in self.experiments.values()
            if exp.is_active
        ]

        if not active_experiments:
            if self.control_group:
                return self.control_group
            raise ValueError("No active experiments")

        # Se user_id fornecido, usar hash para consistência
        if user_id:
            hash_value = hash(user_id)
            random.seed(hash_value)

        # Seleção baseada em traffic_percentage
        rand = random.random()
        cumulative = 0.0

        for exp in active_experiments:
            cumulative += exp.traffic_percentage
            if rand <= cumulative:
                return exp

        # Fallback para primeiro experimento
        return active_experiments[0]

    def record_result(
        self,
        experiment_id: str,
        latency_ms: float,
        tokens_used: int,
        success: bool = True
    ):
        """
        Registra resultado de uma execução.

        Args:
            experiment_id: ID do experimento
            latency_ms: Latência em ms
            tokens_used: Tokens utilizados
            success: Se foi bem-sucedido
        """
        if experiment_id not in self.experiments:
            return

        exp = self.experiments[experiment_id]
        exp.total_requests += 1

        if success:
            exp.success_count += 1
        else:
            exp.error_count += 1

        # Update moving average
        n = exp.total_requests
        exp.avg_latency_ms = (exp.avg_latency_ms * (n - 1) + latency_ms) / n
        exp.avg_tokens = (exp.avg_tokens * (n - 1) + tokens_used) / n

    def record_feedback(
        self,
        experiment_id: str,
        is_positive: bool,
        rating: Optional[float] = None
    ):
        """
        Registra feedback do usuário.

        Args:
            experiment_id: ID do experimento
            is_positive: Se feedback é positivo
            rating: Rating opcional (0-5)
        """
        if experiment_id not in self.experiments:
            return

        exp = self.experiments[experiment_id]

        if is_positive:
            exp.positive_feedback += 1
        else:
            exp.negative_feedback += 1

        # Update average rating
        if rating is not None:
            total_feedback = exp.positive_feedback + exp.negative_feedback
            exp.avg_rating = (exp.avg_rating * (total_feedback - 1) + rating) / total_feedback

    def get_experiment_stats(self, experiment_id: str) -> Dict[str, Any]:
        """Retorna estatísticas de um experimento."""
        if experiment_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_id} not found")

        exp = self.experiments[experiment_id]
        return exp.to_dict()

    def compare_experiments(
        self,
        experiment_a_id: str,
        experiment_b_id: str
    ) -> Dict[str, Any]:
        """
        Compara dois experimentos.

        Args:
            experiment_a_id: ID do experimento A
            experiment_b_id: ID do experimento B

        Returns:
            Comparação detalhada
        """
        if experiment_a_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_a_id} not found")
        if experiment_b_id not in self.experiments:
            raise ValueError(f"Experiment {experiment_b_id} not found")

        exp_a = self.experiments[experiment_a_id]
        exp_b = self.experiments[experiment_b_id]

        return {
            'experiment_a': {
                'id': experiment_a_id,
                'name': exp_a.name,
                'model': exp_a.model_variant.value,
                'success_rate': exp_a.get_success_rate(),
                'avg_latency_ms': exp_a.avg_latency_ms,
                'feedback_score': exp_a.get_feedback_score(),
                'total_requests': exp_a.total_requests,
            },
            'experiment_b': {
                'id': experiment_b_id,
                'name': exp_b.name,
                'model': exp_b.model_variant.value,
                'success_rate': exp_b.get_success_rate(),
                'avg_latency_ms': exp_b.avg_latency_ms,
                'feedback_score': exp_b.get_feedback_score(),
                'total_requests': exp_b.total_requests,
            },
            'comparison': {
                'success_rate_diff': exp_a.get_success_rate() - exp_b.get_success_rate(),
                'latency_diff_ms': exp_a.avg_latency_ms - exp_b.avg_latency_ms,
                'feedback_diff': exp_a.get_feedback_score() - exp_b.get_feedback_score(),
                'winner': self._determine_winner(exp_a, exp_b),
            }
        }

    def _determine_winner(
        self,
        exp_a: ExperimentConfig,
        exp_b: ExperimentConfig
    ) -> str:
        """
        Determina o vencedor baseado em múltiplas métricas.

        Peso das métricas:
        - Feedback score: 50%
        - Success rate: 30%
        - Latency: 20%
        """
        # Normalizar métricas (0-1)
        feedback_a = exp_a.get_feedback_score() / 100
        feedback_b = exp_b.get_feedback_score() / 100

        success_a = exp_a.get_success_rate() / 100
        success_b = exp_b.get_success_rate() / 100

        # Latency: menor é melhor (inverter)
        max_latency = max(exp_a.avg_latency_ms, exp_b.avg_latency_ms)
        if max_latency > 0:
            latency_a = 1 - (exp_a.avg_latency_ms / max_latency)
            latency_b = 1 - (exp_b.avg_latency_ms / max_latency)
        else:
            latency_a = latency_b = 0.5

        # Score ponderado
        score_a = (feedback_a * 0.5) + (success_a * 0.3) + (latency_a * 0.2)
        score_b = (feedback_b * 0.5) + (success_b * 0.3) + (latency_b * 0.2)

        if score_a > score_b:
            return exp_a.experiment_id
        elif score_b > score_a:
            return exp_b.experiment_id
        else:
            return "tie"

    def export_results(self, filepath: str):
        """Exporta resultados para JSON."""
        results = {
            'experiments': [
                exp.to_dict() for exp in self.experiments.values()
            ],
            'control_group': self.control_group.experiment_id if self.control_group else None,
            'timestamp': datetime.utcnow().isoformat(),
        }

        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)


# Pre-configured experiments
def create_default_experiments() -> ABTestManager:
    """Cria experimentos padrão para teste."""
    manager = ABTestManager()

    # Controle: Gemini 2.0 Flash (atual)
    control = manager.create_experiment(
        experiment_id="control-gemini-2-flash",
        name="Control: Gemini 2.0 Flash",
        description="Configuração padrão atual do sistema",
        model_variant=ModelVariant.GEMINI_2_FLASH,
        temperature=0.2,
        retrieval_strategy=RetrievalStrategy.STANDARD,
        traffic_percentage=0.4,
    )
    manager.set_control_group("control-gemini-2-flash")

    # Variante A: Gemini Pro com reranking
    manager.create_experiment(
        experiment_id="variant-a-pro-reranked",
        name="Variant A: Pro + Reranking",
        description="Gemini Pro com reranking para maior qualidade",
        model_variant=ModelVariant.GEMINI_PRO,
        temperature=0.15,
        retrieval_strategy=RetrievalStrategy.RERANKED,
        enable_reranking=True,
        similarity_top_k=15,
        traffic_percentage=0.3,
    )

    # Variante B: Flash com prompt estruturado
    manager.create_experiment(
        experiment_id="variant-b-flash-structured",
        name="Variant B: Flash Structured",
        description="Flash com prompt estruturado (JSON output)",
        model_variant=ModelVariant.GEMINI_FLASH,
        temperature=0.1,
        prompt_strategy=PromptStrategy.STRUCTURED,
        traffic_percentage=0.3,
    )

    return manager
