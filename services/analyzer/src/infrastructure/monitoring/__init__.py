"""
Advanced Monitoring Infrastructure

Sistema completo de monitoramento com métricas, tracing e alertas.
"""

from .metrics import (
    MetricsCollector,
    AdvancedMetricsService,
    MetricType,
    MetricUnit,
    get_metrics_collector,
    get_metrics_service
)

from .tracing import (
    Tracer,
    Span,
    Trace,
    SpanStatus,
    SpanKind,
    TracingExporter,
    get_tracer,
    trace_operation
)

from .alerting import (
    AlertManager,
    AlertRule,
    Alert,
    AlertSeverity,
    AlertStatus,
    AlertChannel,
    ConsoleAlertChannel,
    EmailAlertChannel,
    SlackAlertChannel,
    setup_default_alerting
)

__all__ = [
    # Metrics
    'MetricsCollector',
    'AdvancedMetricsService',
    'MetricType',
    'MetricUnit',
    'get_metrics_collector',
    'get_metrics_service',
    
    # Tracing
    'Tracer',
    'Span',
    'Trace',
    'SpanStatus',
    'SpanKind',
    'TracingExporter',
    'get_tracer',
    'trace_operation',
    
    # Alerting
    'AlertManager',
    'AlertRule',
    'Alert',
    'AlertSeverity',
    'AlertStatus',
    'AlertChannel',
    'ConsoleAlertChannel',
    'EmailAlertChannel',
    'SlackAlertChannel',
    'setup_default_alerting'
]