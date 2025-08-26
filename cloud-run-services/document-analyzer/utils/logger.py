"""
LicitaReview - Sistema de Logging Estruturado

Configuração centralizada de logging usando structlog para
logs estruturados e de alta performance.
"""

import logging
import sys
from typing import Any, Dict
import structlog
from structlog.stdlib import LoggerFactory


def setup_logging(level: str = "INFO") -> structlog.stdlib.BoundLogger:
    """
    Configura sistema de logging estruturado.
    
    Args:
        level: Nível de log (DEBUG, INFO, WARNING, ERROR)
        
    Returns:
        Logger estruturado configurado
    """
    # Configura logging padrão do Python
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, level.upper())
    )
    
    # Configuração do structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer(colors=True)
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level.upper())
        ),
        logger_factory=LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    return structlog.get_logger("licitareview.analyzer")


def get_request_context(request_id: str = None, **kwargs) -> Dict[str, Any]:
    """
    Cria contexto de logging para requests.
    
    Args:
        request_id: ID único do request
        **kwargs: Contexto adicional
        
    Returns:
        Dict com contexto estruturado
    """
    context = {
        "service": "analyzer",
        "version": "2.0.0",
    }
    
    if request_id:
        context["request_id"] = request_id
    
    context.update(kwargs)
    return context