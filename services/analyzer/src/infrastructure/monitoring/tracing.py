"""
Advanced Tracing System

Sistema avançado de tracing para rastreamento de operações.
"""

import time
import uuid
import asyncio
from typing import Dict, Any, Optional, List, Callable, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from contextlib import asynccontextmanager
import json
import threading
from collections import defaultdict, deque


class SpanStatus(str, Enum):
    """Status do span."""
    OK = "ok"
    ERROR = "error"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"


class SpanKind(str, Enum):
    """Tipo do span."""
    SERVER = "server"
    CLIENT = "client"
    PRODUCER = "producer"
    CONSUMER = "consumer"
    INTERNAL = "internal"


@dataclass
class SpanEvent:
    """Evento dentro de um span."""
    timestamp: datetime
    name: str
    attributes: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'timestamp': self.timestamp.isoformat(),
            'name': self.name,
            'attributes': self.attributes
        }


@dataclass
class Span:
    """Span de tracing representando uma operação."""
    trace_id: str
    span_id: str
    parent_span_id: Optional[str]
    operation_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    status: SpanStatus = SpanStatus.OK
    kind: SpanKind = SpanKind.INTERNAL
    tags: Dict[str, Any] = field(default_factory=dict)
    events: List[SpanEvent] = field(default_factory=list)
    error: Optional[str] = None
    
    def add_tag(self, key: str, value: Any) -> None:
        """Adiciona tag ao span."""
        self.tags[key] = value
    
    def add_event(self, name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
        """Adiciona evento ao span."""
        event = SpanEvent(
            timestamp=datetime.utcnow(),
            name=name,
            attributes=attributes or {}
        )
        self.events.append(event)
    
    def set_error(self, error: Union[str, Exception]) -> None:
        """Define erro no span."""
        self.status = SpanStatus.ERROR
        if isinstance(error, Exception):
            self.error = f"{type(error).__name__}: {str(error)}"
            self.add_tag("error.type", type(error).__name__)
            self.add_tag("error.message", str(error))
        else:
            self.error = str(error)
            self.add_tag("error", True)
    
    def finish(self, status: Optional[SpanStatus] = None) -> None:
        """Finaliza o span."""
        self.end_time = datetime.utcnow()
        self.duration_ms = (self.end_time - self.start_time).total_seconds() * 1000
        
        if status:
            self.status = status
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'trace_id': self.trace_id,
            'span_id': self.span_id,
            'parent_span_id': self.parent_span_id,
            'operation_name': self.operation_name,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_ms': self.duration_ms,
            'status': self.status.value,
            'kind': self.kind.value,
            'tags': self.tags,
            'events': [event.to_dict() for event in self.events],
            'error': self.error
        }


@dataclass
class Trace:
    """Trace completo com múltiplos spans."""
    trace_id: str
    spans: List[Span] = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_ms: Optional[float] = None
    root_operation: Optional[str] = None
    
    def add_span(self, span: Span) -> None:
        """Adiciona span ao trace."""
        self.spans.append(span)
        
        # Atualiza timestamps do trace
        if self.start_time is None or span.start_time < self.start_time:
            self.start_time = span.start_time
        
        if span.end_time:
            if self.end_time is None or span.end_time > self.end_time:
                self.end_time = span.end_time
        
        # Define operação raiz
        if span.parent_span_id is None:
            self.root_operation = span.operation_name
        
        # Recalcula duração
        if self.start_time and self.end_time:
            self.duration_ms = (self.end_time - self.start_time).total_seconds() * 1000
    
    def get_root_span(self) -> Optional[Span]:
        """Obtém span raiz do trace."""
        for span in self.spans:
            if span.parent_span_id is None:
                return span
        return None
    
    def get_span_tree(self) -> Dict[str, List[Span]]:
        """Obtém árvore de spans por parent."""
        tree = defaultdict(list)
        for span in self.spans:
            parent_id = span.parent_span_id or "root"
            tree[parent_id].append(span)
        return dict(tree)
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'trace_id': self.trace_id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'duration_ms': self.duration_ms,
            'root_operation': self.root_operation,
            'spans_count': len(self.spans),
            'spans': [span.to_dict() for span in self.spans]
        }


class TracingContext:
    """Contexto de tracing para thread/async local."""
    
    def __init__(self):
        self._current_span: Optional[Span] = None
        self._trace_id: Optional[str] = None
    
    @property
    def current_span(self) -> Optional[Span]:
        """Span atual no contexto."""
        return self._current_span
    
    @current_span.setter
    def current_span(self, span: Optional[Span]) -> None:
        """Define span atual."""
        self._current_span = span
        if span:
            self._trace_id = span.trace_id
    
    @property
    def trace_id(self) -> Optional[str]:
        """ID do trace atual."""
        return self._trace_id
    
    def clear(self) -> None:
        """Limpa contexto."""
        self._current_span = None
        self._trace_id = None


class Tracer:
    """
    Tracer para criação e gerenciamento de spans.
    
    Implementa tracing distribuído com suporte a contexto
    e sampling configurável.
    """
    
    def __init__(
        self,
        service_name: str,
        sampling_rate: float = 1.0,
        max_traces: int = 10000
    ):
        self.service_name = service_name
        self.sampling_rate = sampling_rate
        self.max_traces = max_traces
        
        self._traces: Dict[str, Trace] = {}
        self._active_spans: Dict[str, Span] = {}
        self._context = threading.local()
        self._lock = threading.RLock()
        self._exporters: List[Callable] = []
        
        # Configurações
        self._auto_finish_timeout = timedelta(minutes=5)
        self._cleanup_interval = timedelta(minutes=10)
        self._last_cleanup = datetime.utcnow()
    
    def _get_context(self) -> TracingContext:
        """Obtém contexto atual."""
        if not hasattr(self._context, 'tracing'):
            self._context.tracing = TracingContext()
        return self._context.tracing
    
    def start_span(
        self,
        operation_name: str,
        parent_span: Optional[Span] = None,
        kind: SpanKind = SpanKind.INTERNAL,
        tags: Optional[Dict[str, Any]] = None
    ) -> Span:
        """Inicia novo span."""
        # Verifica sampling
        if not self._should_sample():
            return self._create_no_op_span()
        
        context = self._get_context()
        
        # Determina parent
        if parent_span is None:
            parent_span = context.current_span
        
        # Gera IDs
        trace_id = parent_span.trace_id if parent_span else str(uuid.uuid4())
        span_id = str(uuid.uuid4())
        parent_span_id = parent_span.span_id if parent_span else None
        
        # Cria span
        span = Span(
            trace_id=trace_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            operation_name=operation_name,
            start_time=datetime.utcnow(),
            kind=kind,
            tags=tags or {}
        )
        
        # Adiciona tags padrão
        span.add_tag("service.name", self.service_name)
        span.add_tag("span.kind", kind.value)
        
        with self._lock:
            # Adiciona ao trace
            if trace_id not in self._traces:
                self._traces[trace_id] = Trace(trace_id=trace_id)
            
            self._traces[trace_id].add_span(span)
            self._active_spans[span_id] = span
            
            # Limpa traces antigos periodicamente
            self._maybe_cleanup()
        
        return span
    
    def _should_sample(self) -> bool:
        """Verifica se deve fazer sampling."""
        import random
        return random.random() < self.sampling_rate
    
    def _create_no_op_span(self) -> Span:
        """Cria span no-op para sampling."""
        return Span(
            trace_id="no-op",
            span_id="no-op",
            parent_span_id=None,
            operation_name="no-op",
            start_time=datetime.utcnow()
        )
    
    def finish_span(self, span: Span, status: Optional[SpanStatus] = None) -> None:
        """Finaliza span."""
        if span.span_id == "no-op":
            return
        
        span.finish(status)
        
        with self._lock:
            if span.span_id in self._active_spans:
                del self._active_spans[span.span_id]
            
            # Se é o último span do trace, exporta
            trace = self._traces.get(span.trace_id)
            if trace and not any(s.end_time is None for s in trace.spans):
                self._export_trace(trace)
    
    @asynccontextmanager
    async def span(
        self,
        operation_name: str,
        parent_span: Optional[Span] = None,
        kind: SpanKind = SpanKind.INTERNAL,
        tags: Optional[Dict[str, Any]] = None
    ):
        """Context manager para spans."""
        span = self.start_span(operation_name, parent_span, kind, tags)
        context = self._get_context()
        
        # Salva contexto anterior
        previous_span = context.current_span
        context.current_span = span
        
        try:
            yield span
            self.finish_span(span, SpanStatus.OK)
        except Exception as e:
            span.set_error(e)
            self.finish_span(span, SpanStatus.ERROR)
            raise
        finally:
            # Restaura contexto
            context.current_span = previous_span
    
    def get_current_span(self) -> Optional[Span]:
        """Obtém span atual do contexto."""
        return self._get_context().current_span
    
    def get_trace(self, trace_id: str) -> Optional[Trace]:
        """Obtém trace por ID."""
        with self._lock:
            return self._traces.get(trace_id)
    
    def get_active_traces(self) -> List[Trace]:
        """Obtém traces ativos."""
        with self._lock:
            return list(self._traces.values())
    
    def add_exporter(self, exporter: Callable[[Trace], None]) -> None:
        """Adiciona exportador de traces."""
        self._exporters.append(exporter)
    
    def _export_trace(self, trace: Trace) -> None:
        """Exporta trace finalizado."""
        for exporter in self._exporters:
            try:
                exporter(trace)
            except Exception as e:
                print(f"Erro ao exportar trace {trace.trace_id}: {e}")
    
    def _maybe_cleanup(self) -> None:
        """Limpa traces antigos se necessário."""
        now = datetime.utcnow()
        if now - self._last_cleanup < self._cleanup_interval:
            return
        
        self._last_cleanup = now
        cutoff = now - self._auto_finish_timeout
        
        # Finaliza spans abandonados
        abandoned_spans = []
        for span in self._active_spans.values():
            if span.start_time < cutoff:
                abandoned_spans.append(span)
        
        for span in abandoned_spans:
            span.set_error("Span timeout - auto finished")
            self.finish_span(span, SpanStatus.TIMEOUT)
        
        # Remove traces antigos
        if len(self._traces) > self.max_traces:
            # Mantém apenas os mais recentes
            sorted_traces = sorted(
                self._traces.items(),
                key=lambda x: x[1].start_time or datetime.min,
                reverse=True
            )
            
            to_keep = dict(sorted_traces[:self.max_traces // 2])
            self._traces.clear()
            self._traces.update(to_keep)


class TracingExporter:
    """Exportador de traces para diferentes destinos."""
    
    @staticmethod
    def console_exporter() -> Callable[[Trace], None]:
        """Exportador para console."""
        def export(trace: Trace) -> None:
            print(f"TRACE {trace.trace_id}:")
            print(f"  Operation: {trace.root_operation}")
            print(f"  Duration: {trace.duration_ms:.2f}ms")
            print(f"  Spans: {len(trace.spans)}")
            
            for span in trace.spans:
                indent = "  " if span.parent_span_id else ""
                status_icon = "✓" if span.status == SpanStatus.OK else "✗"
                print(f"  {indent}{status_icon} {span.operation_name} ({span.duration_ms:.2f}ms)")
                
                if span.error:
                    print(f"    {indent}ERROR: {span.error}")
        
        return export
    
    @staticmethod
    def json_file_exporter(file_path: str) -> Callable[[Trace], None]:
        """Exportador para arquivo JSON."""
        def export(trace: Trace) -> None:
            try:
                with open(file_path, 'a') as f:
                    json.dump(trace.to_dict(), f)
                    f.write('\n')
            except Exception as e:
                print(f"Erro ao exportar trace para arquivo: {e}")
        
        return export
    
    @staticmethod
    def metrics_exporter(metrics_collector) -> Callable[[Trace], None]:
        """Exportador que gera métricas dos traces."""
        def export(trace: Trace) -> None:
            try:
                if trace.duration_ms:
                    metrics_collector.observe_histogram(
                        "trace_duration_ms",
                        trace.duration_ms,
                        {"operation": trace.root_operation}
                    )
                
                metrics_collector.increment(
                    "traces_completed_total",
                    labels={"operation": trace.root_operation}
                )
                
                # Conta spans com erro
                error_spans = sum(1 for span in trace.spans if span.status == SpanStatus.ERROR)
                if error_spans > 0:
                    metrics_collector.increment(
                        "traces_with_errors_total",
                        labels={"operation": trace.root_operation}
                    )
                
            except Exception as e:
                print(f"Erro ao exportar métricas do trace: {e}")
        
        return export


# Instância global do tracer
_global_tracer: Optional[Tracer] = None


def get_tracer(service_name: str = "analyzer") -> Tracer:
    """Obtém instância global do tracer."""
    global _global_tracer
    if _global_tracer is None:
        _global_tracer = Tracer(service_name)
        
        # Configura exportadores padrão
        _global_tracer.add_exporter(TracingExporter.console_exporter())
        
        # Integra com métricas se disponível
        try:
            from .metrics import get_metrics_collector
            collector = get_metrics_collector()
            _global_tracer.add_exporter(TracingExporter.metrics_exporter(collector))
        except ImportError:
            pass
    
    return _global_tracer


def trace_operation(operation_name: str, kind: SpanKind = SpanKind.INTERNAL):
    """Decorator para tracing automático de operações."""
    def decorator(func):
        if asyncio.iscoroutinefunction(func):
            async def async_wrapper(*args, **kwargs):
                tracer = get_tracer()
                async with tracer.span(operation_name, kind=kind) as span:
                    # Adiciona argumentos como tags se forem simples
                    for i, arg in enumerate(args):
                        if isinstance(arg, (str, int, float, bool)):
                            span.add_tag(f"arg_{i}", arg)
                    
                    for key, value in kwargs.items():
                        if isinstance(value, (str, int, float, bool)):
                            span.add_tag(f"param_{key}", value)
                    
                    return await func(*args, **kwargs)
            return async_wrapper
        else:
            def sync_wrapper(*args, **kwargs):
                tracer = get_tracer()
                span = tracer.start_span(operation_name, kind=kind)
                
                try:
                    # Adiciona argumentos como tags
                    for i, arg in enumerate(args):
                        if isinstance(arg, (str, int, float, bool)):
                            span.add_tag(f"arg_{i}", arg)
                    
                    for key, value in kwargs.items():
                        if isinstance(value, (str, int, float, bool)):
                            span.add_tag(f"param_{key}", value)
                    
                    result = func(*args, **kwargs)
                    tracer.finish_span(span, SpanStatus.OK)
                    return result
                except Exception as e:
                    span.set_error(e)
                    tracer.finish_span(span, SpanStatus.ERROR)
                    raise
            
            return sync_wrapper
    return decorator