"""
Observability Integration

Integração completa de observabilidade combinando métricas, tracing e alertas.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime
from contextlib import asynccontextmanager

from .metrics import MetricsCollector, AdvancedMetricsService
from .tracing import Tracer, get_tracer
from .alerting import AlertManager, setup_default_alerting


class ObservabilityManager:
    """
    Gerenciador centralizado de observabilidade.
    
    Coordena métricas, tracing e alertas de forma integrada.
    """
    
    def __init__(
        self,
        service_name: str = "analyzer",
        enable_metrics: bool = True,
        enable_tracing: bool = True,
        enable_alerting: bool = True
    ):
        self.service_name = service_name
        self.enable_metrics = enable_metrics
        self.enable_tracing = enable_tracing
        self.enable_alerting = enable_alerting
        
        # Componentes
        self.metrics_collector: Optional[MetricsCollector] = None
        self.metrics_service: Optional[AdvancedMetricsService] = None
        self.tracer: Optional[Tracer] = None
        self.alert_manager: Optional[AlertManager] = None
        
        self._is_initialized = False
    
    async def initialize(self) -> None:
        """Inicializa todos os componentes de observabilidade."""
        if self._is_initialized:
            return
        
        # Inicializa métricas
        if self.enable_metrics:
            self.metrics_collector = MetricsCollector()
            self.metrics_service = AdvancedMetricsService(self.metrics_collector)
            await self.metrics_service.initialize()
        
        # Inicializa tracing
        if self.enable_tracing:
            self.tracer = get_tracer(self.service_name)
            
            # Integra tracing com métricas
            if self.metrics_collector:
                from .tracing import TracingExporter
                exporter = TracingExporter.metrics_exporter(self.metrics_collector)
                self.tracer.add_exporter(exporter)
        
        # Inicializa alertas
        if self.enable_alerting and self.metrics_collector:
            self.alert_manager = setup_default_alerting(self.metrics_collector)
            await self.alert_manager.start_monitoring()
        
        self._is_initialized = True
        print(f"Observabilidade inicializada para serviço '{self.service_name}'")
    
    async def cleanup(self) -> None:
        """Limpa recursos de observabilidade."""
        if not self._is_initialized:
            return
        
        if self.alert_manager:
            await self.alert_manager.stop_monitoring()
        
        if self.metrics_service:
            await self.metrics_service.cleanup()
        
        self._is_initialized = False
        print("Observabilidade finalizada")
    
    @asynccontextmanager
    async def observe_operation(
        self,
        operation_name: str,
        tags: Optional[Dict[str, Any]] = None
    ):
        """
        Context manager para observação completa de operações.
        
        Combina tracing, métricas e potenciais alertas.
        """
        # Inicia span se tracing estiver habilitado
        span = None
        if self.tracer:
            span = self.tracer.start_span(operation_name, tags=tags)
            context = self.tracer._get_context()
            previous_span = context.current_span
            context.current_span = span
        
        start_time = datetime.utcnow()
        
        try:
            yield span
            
            # Operação bem-sucedida
            if span:
                self.tracer.finish_span(span)
            
            # Registra métricas de sucesso
            if self.metrics_collector:
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                self.metrics_collector.increment(
                    f"{operation_name}_total",
                    labels={"status": "success", **(tags or {})}
                )
                
                self.metrics_collector.observe_histogram(
                    f"{operation_name}_duration_seconds",
                    duration,
                    labels=tags
                )
        
        except Exception as e:
            # Operação com erro
            if span:
                span.set_error(e)
                self.tracer.finish_span(span)
            
            # Registra métricas de erro
            if self.metrics_collector:
                duration = (datetime.utcnow() - start_time).total_seconds()
                
                self.metrics_collector.increment(
                    f"{operation_name}_total",
                    labels={"status": "error", "error_type": type(e).__name__, **(tags or {})}
                )
                
                self.metrics_collector.increment(
                    f"{operation_name}_errors_total",
                    labels={"error_type": type(e).__name__, **(tags or {})}
                )
                
                self.metrics_collector.observe_histogram(
                    f"{operation_name}_duration_seconds",
                    duration,
                    labels={"status": "error", **(tags or {})}
                )
            
            raise
        
        finally:
            # Restaura contexto do span
            if self.tracer and span:
                self.tracer._get_context().current_span = previous_span
    
    def record_business_metric(
        self,
        metric_name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Registra métrica de negócio."""
        if self.metrics_collector:
            self.metrics_collector.set_gauge(metric_name, value, labels)
    
    def increment_counter(
        self,
        counter_name: str,
        value: float = 1.0,
        labels: Optional[Dict[str, str]] = None
    ) -> None:
        """Incrementa contador."""
        if self.metrics_collector:
            self.metrics_collector.increment(counter_name, value, labels)
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Obtém status de saúde do sistema."""
        health = {
            "service": self.service_name,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "healthy",
            "components": {}
        }
        
        # Status das métricas
        if self.metrics_collector:
            try:
                summary = self.metrics_collector.get_metrics_summary()
                health["components"]["metrics"] = {
                    "status": "healthy",
                    "metrics_count": len(summary.get("metrics", {}))
                }
            except Exception as e:
                health["components"]["metrics"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health["status"] = "degraded"
        
        # Status do tracing
        if self.tracer:
            try:
                active_traces = len(self.tracer.get_active_traces())
                health["components"]["tracing"] = {
                    "status": "healthy",
                    "active_traces": active_traces
                }
            except Exception as e:
                health["components"]["tracing"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health["status"] = "degraded"
        
        # Status dos alertas
        if self.alert_manager:
            try:
                active_alerts = len(self.alert_manager.get_active_alerts())
                stats = self.alert_manager.get_alert_statistics()
                
                health["components"]["alerting"] = {
                    "status": "healthy",
                    "active_alerts": active_alerts,
                    "rules_count": stats["total_rules"],
                    "channels_count": stats["channels_configured"]
                }
                
                # Se há muitos alertas ativos, marca como degradado
                if active_alerts > 10:
                    health["components"]["alerting"]["status"] = "degraded"
                    health["status"] = "degraded"
                    
            except Exception as e:
                health["components"]["alerting"] = {
                    "status": "unhealthy",
                    "error": str(e)
                }
                health["status"] = "degraded"
        
        return health
    
    async def get_monitoring_dashboard(self) -> Dict[str, Any]:
        """Obtém dados para dashboard de monitoramento."""
        dashboard = {
            "service": self.service_name,
            "timestamp": datetime.utcnow().isoformat(),
            "metrics": {},
            "traces": {},
            "alerts": {}
        }
        
        # Dados de métricas
        if self.metrics_collector:
            try:
                summary = self.metrics_collector.get_metrics_summary()
                dashboard["metrics"] = {
                    "summary": summary,
                    "key_metrics": self._extract_key_metrics(summary)
                }
            except Exception as e:
                dashboard["metrics"] = {"error": str(e)}
        
        # Dados de tracing
        if self.tracer:
            try:
                traces = self.tracer.get_active_traces()
                dashboard["traces"] = {
                    "active_count": len(traces),
                    "recent_operations": self._extract_recent_operations(traces)
                }
            except Exception as e:
                dashboard["traces"] = {"error": str(e)}
        
        # Dados de alertas
        if self.alert_manager:
            try:
                dashboard["alerts"] = self.alert_manager.get_alert_statistics()
            except Exception as e:
                dashboard["alerts"] = {"error": str(e)}
        
        return dashboard
    
    def _extract_key_metrics(self, summary: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai métricas principais para o dashboard."""
        metrics = summary.get("metrics", {})
        key_metrics = {}
        
        # Métricas importantes
        important_metrics = [
            "analysis_requests_total",
            "analysis_duration_seconds",
            "analysis_errors_total",
            "cpu_usage_percentage",
            "memory_usage_bytes",
            "cache_hits_total"
        ]
        
        for metric_name in important_metrics:
            if metric_name in metrics:
                metric_data = metrics[metric_name]
                key_metrics[metric_name] = {
                    "latest_value": metric_data.get("latest_value"),
                    "type": metric_data.get("type"),
                    "unit": metric_data.get("unit")
                }
                
                # Adiciona métricas específicas por tipo
                if metric_data.get("type") == "histogram":
                    key_metrics[metric_name].update({
                        "avg": metric_data.get("avg"),
                        "p95": metric_data.get("p95")
                    })
                elif metric_data.get("type") == "counter":
                    key_metrics[metric_name]["rate_per_minute"] = metric_data.get("rate_per_minute")
        
        return key_metrics
    
    def _extract_recent_operations(self, traces: List) -> List[Dict[str, Any]]:
        """Extrai operações recentes dos traces."""
        recent_ops = []
        
        for trace in traces[-10:]:  # Últimos 10 traces
            root_span = trace.get_root_span()
            if root_span:
                recent_ops.append({
                    "operation": root_span.operation_name,
                    "duration_ms": root_span.duration_ms,
                    "status": root_span.status.value,
                    "start_time": root_span.start_time.isoformat(),
                    "spans_count": len(trace.spans)
                })
        
        return recent_ops


# Instância global do gerenciador de observabilidade
_global_observability: Optional[ObservabilityManager] = None


async def get_observability_manager(
    service_name: str = "analyzer"
) -> ObservabilityManager:
    """Obtém instância global do gerenciador de observabilidade."""
    global _global_observability
    
    if _global_observability is None:
        _global_observability = ObservabilityManager(service_name)
        await _global_observability.initialize()
    
    return _global_observability


async def cleanup_observability() -> None:
    """Limpa observabilidade global."""
    global _global_observability
    
    if _global_observability:
        await _global_observability.cleanup()
        _global_observability = None


# Decorators para instrumentação automática
def observe_async(operation_name: str, tags: Optional[Dict[str, Any]] = None):
    """Decorator para observação automática de funções async."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            manager = await get_observability_manager()
            
            async with manager.observe_operation(operation_name, tags) as span:
                # Adiciona argumentos como tags se forem simples
                if span and tags is None:
                    for i, arg in enumerate(args):
                        if isinstance(arg, (str, int, float, bool)):
                            span.add_tag(f"arg_{i}", arg)
                    
                    for key, value in kwargs.items():
                        if isinstance(value, (str, int, float, bool)):
                            span.add_tag(f"param_{key}", value)
                
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def observe_sync(operation_name: str, tags: Optional[Dict[str, Any]] = None):
    """Decorator para observação automática de funções síncronas."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Para funções síncronas, usa apenas o tracer
            tracer = get_tracer()
            span = tracer.start_span(operation_name, tags=tags)
            
            try:
                # Adiciona argumentos como tags
                if tags is None:
                    for i, arg in enumerate(args):
                        if isinstance(arg, (str, int, float, bool)):
                            span.add_tag(f"arg_{i}", arg)
                    
                    for key, value in kwargs.items():
                        if isinstance(value, (str, int, float, bool)):
                            span.add_tag(f"param_{key}", value)
                
                result = func(*args, **kwargs)
                tracer.finish_span(span)
                return result
            except Exception as e:
                span.set_error(e)
                tracer.finish_span(span)
                raise
        
        return wrapper
    return decorator