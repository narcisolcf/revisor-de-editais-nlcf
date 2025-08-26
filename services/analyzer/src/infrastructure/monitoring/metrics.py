"""
Advanced Metrics System

Sistema avançado de métricas para monitoramento da aplicação.
"""

import time
import asyncio
from typing import Dict, Any, Optional, List, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
import threading
from contextlib import asynccontextmanager

from ...domain.interfaces.services import IMetricsService


class MetricType(str, Enum):
    """Tipos de métricas."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"


class MetricUnit(str, Enum):
    """Unidades de métricas."""
    SECONDS = "seconds"
    MILLISECONDS = "milliseconds"
    COUNT = "count"
    BYTES = "bytes"
    PERCENTAGE = "percentage"
    REQUESTS_PER_SECOND = "requests_per_second"


@dataclass
class MetricPoint:
    """Ponto de métrica."""
    timestamp: datetime
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'value': self.value,
            'labels': self.labels
        }


@dataclass
class Metric:
    """Métrica com histórico de pontos."""
    name: str
    metric_type: MetricType
    unit: MetricUnit
    description: str
    points: deque = field(default_factory=lambda: deque(maxlen=1000))
    labels: Dict[str, str] = field(default_factory=dict)
    
    def add_point(self, value: float, labels: Optional[Dict[str, str]] = None) -> None:
        """Adiciona ponto à métrica."""
        point_labels = {**self.labels}
        if labels:
            point_labels.update(labels)
        
        point = MetricPoint(
            timestamp=datetime.utcnow(),
            value=value,
            labels=point_labels
        )
        self.points.append(point)
    
    def get_latest_value(self) -> Optional[float]:
        """Obtém último valor da métrica."""
        return self.points[-1].value if self.points else None
    
    def get_average(self, minutes: int = 5) -> Optional[float]:
        """Obtém média dos últimos N minutos."""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        recent_points = [p for p in self.points if p.timestamp >= cutoff]
        
        if not recent_points:
            return None
        
        return sum(p.value for p in recent_points) / len(recent_points)
    
    def get_rate(self, minutes: int = 1) -> float:
        """Obtém taxa por minuto."""
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        recent_points = [p for p in self.points if p.timestamp >= cutoff]
        
        if not recent_points:
            return 0.0
        
        return len(recent_points) / minutes


class MetricsCollector:
    """
    Coletor de métricas para monitoramento da aplicação.
    
    Coleta e armazena métricas em tempo real com suporte a labels,
    agregações e alertas.
    """
    
    def __init__(self, max_metrics: int = 10000):
        self._metrics: Dict[str, Metric] = {}
        self._max_metrics = max_metrics
        self._lock = threading.RLock()
        self._alert_handlers: List[Callable] = []
        self._background_task: Optional[asyncio.Task] = None
        
        # Métricas predefinidas do sistema
        self._register_system_metrics()
    
    def _register_system_metrics(self) -> None:
        """Registra métricas predefinidas do sistema."""
        # Métricas de análise
        self.register_metric(
            "analysis_requests_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de solicitações de análise"
        )
        
        self.register_metric(
            "analysis_duration_seconds",
            MetricType.HISTOGRAM,
            MetricUnit.SECONDS,
            "Duração das análises em segundos"
        )
        
        self.register_metric(
            "analysis_errors_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de erros em análises"
        )
        
        self.register_metric(
            "documents_processed_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de documentos processados"
        )
        
        self.register_metric(
            "cache_hits_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de hits do cache"
        )
        
        self.register_metric(
            "cache_misses_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de misses do cache"
        )
        
        # Métricas de performance
        self.register_metric(
            "memory_usage_bytes",
            MetricType.GAUGE,
            MetricUnit.BYTES,
            "Uso de memória em bytes"
        )
        
        self.register_metric(
            "cpu_usage_percentage",
            MetricType.GAUGE,
            MetricUnit.PERCENTAGE,
            "Uso de CPU em porcentagem"
        )
        
        # Métricas de negócio
        self.register_metric(
            "findings_detected_total",
            MetricType.COUNTER,
            MetricUnit.COUNT,
            "Total de findings detectados"
        )
        
        self.register_metric(
            "analysis_score_average",
            MetricType.GAUGE,
            MetricUnit.PERCENTAGE,
            "Score médio das análises"
        )
    
    def register_metric(
        self,
        name: str,
        metric_type: MetricType,
        unit: MetricUnit,
        description: str,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Registra nova métrica."""
        with self._lock:
            if len(self._metrics) >= self._max_metrics:
                raise ValueError(f"Máximo de {self._max_metrics} métricas atingido")
            
            if name in self._metrics:
                return  # Métrica já existe
            
            self._metrics[name] = Metric(
                name=name,
                metric_type=metric_type,
                unit=unit,
                description=description,
                labels=labels or {}
            )
    
    def increment(
        self,
        name: str,
        value: float = 1.0,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Incrementa contador."""
        with self._lock:
            if name not in self._metrics:
                self.register_metric(name, MetricType.COUNTER, MetricUnit.COUNT, f"Auto-created counter: {name}")
            
            metric = self._metrics[name]
            current_value = metric.get_latest_value() or 0.0
            metric.add_point(current_value + value, labels)
    
    def set_gauge(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Define valor de gauge."""
        with self._lock:
            if name not in self._metrics:
                self.register_metric(name, MetricType.GAUGE, MetricUnit.COUNT, f"Auto-created gauge: {name}")
            
            self._metrics[name].add_point(value, labels)
    
    def observe_histogram(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Observa valor em histograma."""
        with self._lock:
            if name not in self._metrics:
                self.register_metric(name, MetricType.HISTOGRAM, MetricUnit.SECONDS, f"Auto-created histogram: {name}")
            
            self._metrics[name].add_point(value, labels)
    
    def get_metric(self, name: str) -> Optional[Metric]:
        """Obtém métrica por nome."""
        with self._lock:
            return self._metrics.get(name)
    
    def get_all_metrics(self) -> Dict[str, Metric]:
        """Obtém todas as métricas."""
        with self._lock:
            return self._metrics.copy()
    
    def get_metrics_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Obtém resumo das métricas."""
        end_time = end_time or datetime.utcnow()
        start_time = start_time or (end_time - timedelta(hours=1))
        
        summary = {
            'period': {
                'start': start_time.isoformat(),
                'end': end_time.isoformat()
            },
            'metrics': {}
        }
        
        with self._lock:
            for name, metric in self._metrics.items():
                # Filtra pontos pelo período
                period_points = [
                    p for p in metric.points
                    if start_time <= p.timestamp <= end_time
                ]
                
                if not period_points:
                    continue
                
                values = [p.value for p in period_points]
                
                metric_summary = {
                    'type': metric.metric_type.value,
                    'unit': metric.unit.value,
                    'description': metric.description,
                    'points_count': len(period_points),
                    'latest_value': values[-1] if values else None
                }
                
                if metric.metric_type in [MetricType.HISTOGRAM, MetricType.SUMMARY]:
                    metric_summary.update({
                        'min': min(values),
                        'max': max(values),
                        'avg': sum(values) / len(values),
                        'p50': self._percentile(values, 50),
                        'p95': self._percentile(values, 95),
                        'p99': self._percentile(values, 99)
                    })
                elif metric.metric_type == MetricType.COUNTER:
                    metric_summary['total'] = sum(values)
                    metric_summary['rate_per_minute'] = metric.get_rate()
                
                summary['metrics'][name] = metric_summary
        
        return summary
    
    def _percentile(self, values: List[float], percentile: int) -> float:
        """Calcula percentil."""
        if not values:
            return 0.0
        
        sorted_values = sorted(values)
        k = (len(sorted_values) - 1) * percentile / 100
        f = int(k)
        c = k - f
        
        if f + 1 < len(sorted_values):
            return sorted_values[f] * (1 - c) + sorted_values[f + 1] * c
        else:
            return sorted_values[f]
    
    @asynccontextmanager
    async def timer(self, metric_name: str, labels: Optional[Dict[str, str]] = None):
        """Context manager para medir tempo."""
        start_time = time.time()
        try:
            yield
        finally:
            duration = time.time() - start_time
            self.observe_histogram(metric_name, duration, labels)
    
    def add_alert_handler(self, handler: Callable[[str, Metric, float], None]) -> None:
        """Adiciona handler de alerta."""
        self._alert_handlers.append(handler)
    
    async def start_monitoring(self) -> None:
        """Inicia monitoramento em background."""
        if self._background_task and not self._background_task.done():
            return
        
        self._background_task = asyncio.create_task(self._monitoring_loop())
    
    async def stop_monitoring(self) -> None:
        """Para monitoramento em background."""
        if self._background_task:
            self._background_task.cancel()
            try:
                await self._background_task
            except asyncio.CancelledError:
                pass
    
    async def _monitoring_loop(self) -> None:
        """Loop de monitoramento."""
        while True:
            try:
                await self._collect_system_metrics()
                await self._check_alerts()
                await asyncio.sleep(30)  # Coleta a cada 30 segundos
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Erro no loop de monitoramento: {e}")
                await asyncio.sleep(5)
    
    async def _collect_system_metrics(self) -> None:
        """Coleta métricas do sistema."""
        try:
            import psutil
            
            # Métricas de sistema
            memory = psutil.virtual_memory()
            cpu_percent = psutil.cpu_percent(interval=1)
            
            self.set_gauge("memory_usage_bytes", memory.used)
            self.set_gauge("cpu_usage_percentage", cpu_percent)
            
        except ImportError:
            # psutil não disponível, usar valores mock
            self.set_gauge("memory_usage_bytes", 1024 * 1024 * 100)  # 100MB
            self.set_gauge("cpu_usage_percentage", 25.0)
    
    async def _check_alerts(self) -> None:
        """Verifica condições de alerta."""
        with self._lock:
            for name, metric in self._metrics.items():
                latest_value = metric.get_latest_value()
                if latest_value is None:
                    continue
                
                # Alertas predefinidos
                if name == "cpu_usage_percentage" and latest_value > 80:
                    await self._trigger_alert("high_cpu_usage", metric, latest_value)
                elif name == "memory_usage_bytes" and latest_value > 1024 * 1024 * 1024:  # 1GB
                    await self._trigger_alert("high_memory_usage", metric, latest_value)
                elif name == "analysis_errors_total":
                    error_rate = metric.get_rate()
                    if error_rate > 10:  # Mais de 10 erros por minuto
                        await self._trigger_alert("high_error_rate", metric, error_rate)
    
    async def _trigger_alert(self, alert_type: str, metric: Metric, value: float) -> None:
        """Dispara alerta."""
        for handler in self._alert_handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(alert_type, metric, value)
                else:
                    handler(alert_type, metric, value)
            except Exception as e:
                print(f"Erro ao executar handler de alerta: {e}")


class AdvancedMetricsService(IMetricsService):
    """
    Implementação avançada do serviço de métricas.
    
    Integra com o coletor de métricas para fornecer
    funcionalidades avançadas de monitoramento.
    """
    
    def __init__(self, collector: Optional[MetricsCollector] = None):
        self.collector = collector or MetricsCollector()
        self._is_started = False
    
    async def initialize(self) -> None:
        """Inicializa o serviço de métricas."""
        if not self._is_started:
            await self.collector.start_monitoring()
            self._is_started = True
    
    async def cleanup(self) -> None:
        """Limpa recursos do serviço."""
        if self._is_started:
            await self.collector.stop_monitoring()
            self._is_started = False
    
    async def record_analysis_metrics(self, analysis) -> None:
        """Registra métricas de análise."""
        # Incrementa contador de análises
        self.collector.increment("analysis_requests_total", labels={
            "organization_id": analysis.organization_id,
            "document_type": getattr(analysis.document, 'document_type', 'unknown')
        })
        
        # Registra duração se disponível
        if hasattr(analysis, 'duration_seconds'):
            self.collector.observe_histogram("analysis_duration_seconds", analysis.duration_seconds)
        
        # Registra score médio
        if hasattr(analysis, 'overall_score'):
            self.collector.set_gauge("analysis_score_average", analysis.overall_score)
        
        # Conta findings por categoria
        if hasattr(analysis, 'findings'):
            for finding in analysis.findings:
                self.collector.increment("findings_detected_total", labels={
                    "category": finding.category.value,
                    "severity": finding.severity.value
                })
    
    async def record_performance_metrics(
        self,
        operation: str,
        duration: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Registra métricas de performance."""
        labels = {"operation": operation}
        if metadata:
            labels.update({k: str(v) for k, v in metadata.items()})
        
        self.collector.observe_histogram("operation_duration_seconds", duration, labels)
    
    async def record_error_metrics(
        self,
        error_type: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> None:
        """Registra métricas de erro."""
        labels = {"error_type": error_type}
        if context:
            labels.update({k: str(v) for k, v in context.items()})
        
        self.collector.increment("analysis_errors_total", labels=labels)
    
    async def get_metrics_summary(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Obtém resumo das métricas."""
        return self.collector.get_metrics_summary(start_time, end_time)
    
    def get_collector(self) -> MetricsCollector:
        """Obtém coletor de métricas."""
        return self.collector


# Instância global do coletor de métricas
_global_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Obtém instância global do coletor de métricas."""
    global _global_collector
    if _global_collector is None:
        _global_collector = MetricsCollector()
    return _global_collector


def get_metrics_service() -> AdvancedMetricsService:
    """Obtém instância do serviço de métricas."""
    return AdvancedMetricsService(get_metrics_collector())