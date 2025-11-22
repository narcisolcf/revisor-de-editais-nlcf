"""
Analytics Dashboard API

Fornece métricas em tempo real e histórico para monitoramento
de performance de modelos AI/ML.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict
import statistics
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ============================================================================
# In-Memory Metrics Storage
# ============================================================================

class MetricsStore:
    """
    Armazenamento em memória de métricas.

    Em produção, isso seria substituído por Redis ou TimeSeries DB.
    """

    def __init__(self):
        # Métricas por timestamp
        self.request_metrics: List[Dict[str, Any]] = []
        self.analysis_metrics: List[Dict[str, Any]] = []
        self.error_metrics: List[Dict[str, Any]] = []
        self.feedback_metrics: List[Dict[str, Any]] = []

        # Agregados em tempo real
        self.hourly_aggregates: Dict[str, Dict[str, Any]] = defaultdict(dict)
        self.daily_aggregates: Dict[str, Dict[str, Any]] = defaultdict(dict)

    def record_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        latency_ms: float,
        experiment_id: Optional[str] = None,
    ):
        """Registra métrica de request HTTP."""
        metric = {
            'timestamp': datetime.utcnow().isoformat(),
            'endpoint': endpoint,
            'method': method,
            'status_code': status_code,
            'latency_ms': latency_ms,
            'experiment_id': experiment_id,
        }
        self.request_metrics.append(metric)
        self._aggregate_metric(metric, 'request')

    def record_analysis(
        self,
        document_id: str,
        analysis_type: str,
        duration_ms: float,
        tokens_used: int,
        model_variant: str,
        success: bool,
        experiment_id: Optional[str] = None,
    ):
        """Registra métrica de análise de documento."""
        metric = {
            'timestamp': datetime.utcnow().isoformat(),
            'document_id': document_id,
            'analysis_type': analysis_type,
            'duration_ms': duration_ms,
            'tokens_used': tokens_used,
            'model_variant': model_variant,
            'success': success,
            'experiment_id': experiment_id,
        }
        self.analysis_metrics.append(metric)
        self._aggregate_metric(metric, 'analysis')

    def record_error(
        self,
        error_type: str,
        error_message: str,
        endpoint: str,
        experiment_id: Optional[str] = None,
    ):
        """Registra erro."""
        metric = {
            'timestamp': datetime.utcnow().isoformat(),
            'error_type': error_type,
            'error_message': error_message,
            'endpoint': endpoint,
            'experiment_id': experiment_id,
        }
        self.error_metrics.append(metric)

    def record_feedback(
        self,
        document_id: str,
        is_positive: bool,
        rating: Optional[float],
        experiment_id: Optional[str] = None,
    ):
        """Registra feedback do usuário."""
        metric = {
            'timestamp': datetime.utcnow().isoformat(),
            'document_id': document_id,
            'is_positive': is_positive,
            'rating': rating,
            'experiment_id': experiment_id,
        }
        self.feedback_metrics.append(metric)

    def _aggregate_metric(self, metric: Dict[str, Any], metric_type: str):
        """Agrega métrica em buckets horários e diários."""
        timestamp = datetime.fromisoformat(metric['timestamp'])
        hour_key = timestamp.strftime('%Y-%m-%d-%H')
        day_key = timestamp.strftime('%Y-%m-%d')

        # Agregação horária
        if hour_key not in self.hourly_aggregates:
            self.hourly_aggregates[hour_key] = {
                'total_requests': 0,
                'total_errors': 0,
                'latencies': [],
                'tokens': [],
            }

        if metric_type == 'request':
            self.hourly_aggregates[hour_key]['total_requests'] += 1
            self.hourly_aggregates[hour_key]['latencies'].append(metric['latency_ms'])

        elif metric_type == 'analysis':
            if metric.get('tokens_used'):
                self.hourly_aggregates[hour_key]['tokens'].append(metric['tokens_used'])

        # Agregação diária
        if day_key not in self.daily_aggregates:
            self.daily_aggregates[day_key] = {
                'total_requests': 0,
                'total_errors': 0,
                'latencies': [],
                'tokens': [],
            }

        if metric_type == 'request':
            self.daily_aggregates[day_key]['total_requests'] += 1
            self.daily_aggregates[day_key]['latencies'].append(metric['latency_ms'])

    def get_recent_metrics(
        self,
        metric_type: str,
        minutes: int = 60
    ) -> List[Dict[str, Any]]:
        """Retorna métricas recentes."""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)

        if metric_type == 'request':
            metrics = self.request_metrics
        elif metric_type == 'analysis':
            metrics = self.analysis_metrics
        elif metric_type == 'error':
            metrics = self.error_metrics
        elif metric_type == 'feedback':
            metrics = self.feedback_metrics
        else:
            return []

        return [
            m for m in metrics
            if datetime.fromisoformat(m['timestamp']) >= cutoff
        ]

    def cleanup_old_metrics(self, days: int = 7):
        """Remove métricas antigas (> N dias)."""
        cutoff = datetime.utcnow() - timedelta(days=days)

        def filter_metrics(metrics):
            return [
                m for m in metrics
                if datetime.fromisoformat(m['timestamp']) >= cutoff
            ]

        self.request_metrics = filter_metrics(self.request_metrics)
        self.analysis_metrics = filter_metrics(self.analysis_metrics)
        self.error_metrics = filter_metrics(self.error_metrics)
        self.feedback_metrics = filter_metrics(self.feedback_metrics)


# Global metrics store
metrics_store = MetricsStore()


# ============================================================================
# Pydantic Models
# ============================================================================

class SystemHealthResponse(BaseModel):
    """Response com health do sistema."""
    status: str
    uptime_seconds: float
    total_requests: int
    error_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float


class AnalyticsOverviewResponse(BaseModel):
    """Response com overview de analytics."""
    period: str
    total_requests: int
    total_analyses: int
    total_errors: int
    error_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    avg_tokens_per_analysis: float
    total_feedback: int
    positive_feedback_rate: float


class TimeSeriesDataPoint(BaseModel):
    """Ponto de dados em série temporal."""
    timestamp: str
    value: float
    label: Optional[str] = None


class ModelPerformanceResponse(BaseModel):
    """Response com performance por modelo."""
    model_variant: str
    total_requests: int
    avg_latency_ms: float
    p95_latency_ms: float
    success_rate: float
    avg_tokens: float
    feedback_score: float


class ErrorSummaryResponse(BaseModel):
    """Response com sumário de erros."""
    error_type: str
    count: int
    percentage: float
    recent_examples: List[str]


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/health", response_model=SystemHealthResponse)
async def get_system_health():
    """
    Retorna health do sistema em tempo real.

    Returns:
        Métricas de saúde do sistema
    """
    recent_requests = metrics_store.get_recent_metrics('request', minutes=60)

    if not recent_requests:
        return SystemHealthResponse(
            status="healthy",
            uptime_seconds=0,
            total_requests=0,
            error_rate=0.0,
            avg_latency_ms=0.0,
            p95_latency_ms=0.0,
            p99_latency_ms=0.0,
        )

    # Calcular métricas
    total_requests = len(recent_requests)
    error_count = sum(1 for r in recent_requests if r['status_code'] >= 400)
    latencies = [r['latency_ms'] for r in recent_requests]

    error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0.0

    return SystemHealthResponse(
        status="healthy" if error_rate < 5.0 else "degraded",
        uptime_seconds=3600.0,  # Placeholder
        total_requests=total_requests,
        error_rate=error_rate,
        avg_latency_ms=statistics.mean(latencies) if latencies else 0.0,
        p95_latency_ms=statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else 0.0,
        p99_latency_ms=statistics.quantiles(latencies, n=100)[98] if len(latencies) >= 100 else 0.0,
    )


@router.get("/overview", response_model=AnalyticsOverviewResponse)
async def get_analytics_overview(
    period: str = Query("1h", description="Período: 1h, 24h, 7d, 30d")
):
    """
    Retorna overview de analytics para um período.

    Args:
        period: Período de agregação (1h, 24h, 7d, 30d)

    Returns:
        Overview com métricas agregadas
    """
    # Converter período para minutos
    period_map = {
        '1h': 60,
        '24h': 1440,
        '7d': 10080,
        '30d': 43200,
    }
    minutes = period_map.get(period, 60)

    # Obter métricas
    requests = metrics_store.get_recent_metrics('request', minutes=minutes)
    analyses = metrics_store.get_recent_metrics('analysis', minutes=minutes)
    errors = metrics_store.get_recent_metrics('error', minutes=minutes)
    feedbacks = metrics_store.get_recent_metrics('feedback', minutes=minutes)

    # Calcular métricas
    total_requests = len(requests)
    total_errors = len(errors)
    error_rate = (total_errors / total_requests * 100) if total_requests > 0 else 0.0

    latencies = [r['latency_ms'] for r in requests]
    avg_latency = statistics.mean(latencies) if latencies else 0.0
    p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) >= 20 else 0.0

    tokens = [a['tokens_used'] for a in analyses if a.get('tokens_used')]
    avg_tokens = statistics.mean(tokens) if tokens else 0.0

    positive_feedback = sum(1 for f in feedbacks if f['is_positive'])
    positive_rate = (positive_feedback / len(feedbacks) * 100) if feedbacks else 0.0

    return AnalyticsOverviewResponse(
        period=period,
        total_requests=total_requests,
        total_analyses=len(analyses),
        total_errors=total_errors,
        error_rate=error_rate,
        avg_latency_ms=avg_latency,
        p95_latency_ms=p95_latency,
        avg_tokens_per_analysis=avg_tokens,
        total_feedback=len(feedbacks),
        positive_feedback_rate=positive_rate,
    )


@router.get("/timeseries/{metric_name}")
async def get_timeseries(
    metric_name: str,
    period: str = Query("24h", description="Período: 1h, 24h, 7d"),
    granularity: str = Query("1h", description="Granularidade: 1m, 5m, 1h")
) -> List[TimeSeriesDataPoint]:
    """
    Retorna série temporal de uma métrica.

    Args:
        metric_name: Nome da métrica (latency, requests, errors, tokens)
        period: Período de dados
        granularity: Granularidade dos buckets

    Returns:
        Lista de pontos de dados
    """
    # Placeholder implementation
    # Em produção, isso consultaria TimeSeries DB

    period_map = {'1h': 60, '24h': 1440, '7d': 10080}
    minutes = period_map.get(period, 1440)

    if metric_name == 'latency':
        requests = metrics_store.get_recent_metrics('request', minutes=minutes)
        # Agrupar por hora
        hourly_latencies = defaultdict(list)
        for r in requests:
            hour = datetime.fromisoformat(r['timestamp']).strftime('%Y-%m-%d %H:00')
            hourly_latencies[hour].append(r['latency_ms'])

        return [
            TimeSeriesDataPoint(
                timestamp=hour,
                value=statistics.mean(latencies),
                label=f"Avg: {statistics.mean(latencies):.1f}ms"
            )
            for hour, latencies in sorted(hourly_latencies.items())
        ]

    elif metric_name == 'requests':
        requests = metrics_store.get_recent_metrics('request', minutes=minutes)
        hourly_counts = defaultdict(int)
        for r in requests:
            hour = datetime.fromisoformat(r['timestamp']).strftime('%Y-%m-%d %H:00')
            hourly_counts[hour] += 1

        return [
            TimeSeriesDataPoint(
                timestamp=hour,
                value=float(count),
                label=f"{count} requests"
            )
            for hour, count in sorted(hourly_counts.items())
        ]

    else:
        return []


@router.get("/models/performance", response_model=List[ModelPerformanceResponse])
async def get_model_performance(
    period: str = Query("24h", description="Período: 1h, 24h, 7d, 30d")
):
    """
    Retorna performance por modelo.

    Args:
        period: Período de análise

    Returns:
        Lista de performance por modelo
    """
    period_map = {'1h': 60, '24h': 1440, '7d': 10080, '30d': 43200}
    minutes = period_map.get(period, 1440)

    analyses = metrics_store.get_recent_metrics('analysis', minutes=minutes)
    feedbacks = metrics_store.get_recent_metrics('feedback', minutes=minutes)

    # Agrupar por modelo
    by_model = defaultdict(lambda: {
        'requests': [],
        'latencies': [],
        'tokens': [],
        'successes': 0,
        'failures': 0,
        'positive_feedback': 0,
        'negative_feedback': 0,
    })

    for analysis in analyses:
        model = analysis.get('model_variant', 'unknown')
        by_model[model]['requests'].append(analysis)
        by_model[model]['latencies'].append(analysis['duration_ms'])

        if analysis.get('tokens_used'):
            by_model[model]['tokens'].append(analysis['tokens_used'])

        if analysis['success']:
            by_model[model]['successes'] += 1
        else:
            by_model[model]['failures'] += 1

    # Adicionar feedback
    for feedback in feedbacks:
        exp_id = feedback.get('experiment_id')
        if exp_id:
            # Mapear experiment_id para modelo (simplificado)
            model = exp_id.split('-')[0] if exp_id else 'unknown'
            if feedback['is_positive']:
                by_model[model]['positive_feedback'] += 1
            else:
                by_model[model]['negative_feedback'] += 1

    # Calcular métricas
    results = []
    for model, data in by_model.items():
        total = data['successes'] + data['failures']
        success_rate = (data['successes'] / total * 100) if total > 0 else 0.0

        total_feedback = data['positive_feedback'] + data['negative_feedback']
        feedback_score = (
            (data['positive_feedback'] / total_feedback * 100)
            if total_feedback > 0 else 0.0
        )

        latencies = data['latencies']
        tokens = data['tokens']

        results.append(ModelPerformanceResponse(
            model_variant=model,
            total_requests=len(data['requests']),
            avg_latency_ms=statistics.mean(latencies) if latencies else 0.0,
            p95_latency_ms=(
                statistics.quantiles(latencies, n=20)[18]
                if len(latencies) >= 20 else 0.0
            ),
            success_rate=success_rate,
            avg_tokens=statistics.mean(tokens) if tokens else 0.0,
            feedback_score=feedback_score,
        ))

    return results


@router.get("/errors/summary", response_model=List[ErrorSummaryResponse])
async def get_error_summary(
    period: str = Query("24h", description="Período: 1h, 24h, 7d")
):
    """
    Retorna sumário de erros.

    Args:
        period: Período de análise

    Returns:
        Lista de erros agregados por tipo
    """
    period_map = {'1h': 60, '24h': 1440, '7d': 10080}
    minutes = period_map.get(period, 1440)

    errors = metrics_store.get_recent_metrics('error', minutes=minutes)

    if not errors:
        return []

    # Agrupar por tipo
    by_type = defaultdict(list)
    for error in errors:
        error_type = error.get('error_type', 'unknown')
        by_type[error_type].append(error['error_message'])

    total_errors = len(errors)

    return [
        ErrorSummaryResponse(
            error_type=error_type,
            count=len(messages),
            percentage=(len(messages) / total_errors * 100),
            recent_examples=messages[:3],  # Primeiros 3 exemplos
        )
        for error_type, messages in by_type.items()
    ]


@router.post("/record/request")
async def record_request_metric(
    endpoint: str,
    method: str,
    status_code: int,
    latency_ms: float,
    experiment_id: Optional[str] = None,
):
    """Registra métrica de request."""
    metrics_store.record_request(
        endpoint=endpoint,
        method=method,
        status_code=status_code,
        latency_ms=latency_ms,
        experiment_id=experiment_id,
    )
    return {"status": "recorded"}


@router.post("/record/analysis")
async def record_analysis_metric(
    document_id: str,
    analysis_type: str,
    duration_ms: float,
    tokens_used: int,
    model_variant: str,
    success: bool,
    experiment_id: Optional[str] = None,
):
    """Registra métrica de análise."""
    metrics_store.record_analysis(
        document_id=document_id,
        analysis_type=analysis_type,
        duration_ms=duration_ms,
        tokens_used=tokens_used,
        model_variant=model_variant,
        success=success,
        experiment_id=experiment_id,
    )
    return {"status": "recorded"}


@router.delete("/cleanup")
async def cleanup_old_metrics(days: int = Query(7, description="Dias de retenção")):
    """Remove métricas antigas."""
    metrics_store.cleanup_old_metrics(days=days)
    return {"status": "cleaned", "retention_days": days}
