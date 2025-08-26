"""
Global Error Handler

Manipulador global de erros com logging, métricas e notificações.
"""

import traceback
from typing import Dict, Any, Optional, Type
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

from ...domain.exceptions.analysis_exceptions import (
    AnalysisException,
    DocumentNotFoundException,
    OrganizationNotFoundException,
    AnalysisTimeoutException,
    RateLimitException
)


class ErrorSeverity(str, Enum):
    """Severidade dos erros."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorInfo:
    """Informações estruturadas sobre um erro."""
    error_id: str
    error_type: str
    error_code: str
    message: str
    severity: ErrorSeverity
    timestamp: datetime
    context: Dict[str, Any]
    stack_trace: Optional[str] = None
    user_message: Optional[str] = None
    recovery_suggestions: list = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'error_id': self.error_id,
            'error_type': self.error_type,
            'error_code': self.error_code,
            'message': self.message,
            'severity': self.severity.value,
            'timestamp': self.timestamp.isoformat(),
            'context': self.context,
            'stack_trace': self.stack_trace,
            'user_message': self.user_message,
            'recovery_suggestions': self.recovery_suggestions or []
        }


class GlobalErrorHandler:
    """
    Manipulador global de erros do sistema.
    
    Centraliza o tratamento de erros, logging, métricas e notificações.
    """
    
    def __init__(self):
        self.error_mappings: Dict[Type[Exception], ErrorSeverity] = {
            # Erros de negócio - severidade média
            DocumentNotFoundException: ErrorSeverity.MEDIUM,
            OrganizationNotFoundException: ErrorSeverity.MEDIUM,
            
            # Erros de infraestrutura - severidade alta
            AnalysisTimeoutException: ErrorSeverity.HIGH,
            
            # Erros de segurança - severidade crítica
            RateLimitException: ErrorSeverity.CRITICAL,
            
            # Erros genéricos - severidade baixa
            ValueError: ErrorSeverity.LOW,
            TypeError: ErrorSeverity.MEDIUM,
            
            # Erros de sistema - severidade crítica
            Exception: ErrorSeverity.HIGH
        }
        
        self.user_friendly_messages = {
            DocumentNotFoundException: "O documento solicitado não foi encontrado.",
            OrganizationNotFoundException: "A organização especificada não existe.",
            AnalysisTimeoutException: "A análise demorou mais que o esperado. Tente novamente.",
            RateLimitException: "Muitas solicitações foram feitas. Aguarde antes de tentar novamente.",
            ValueError: "Os dados fornecidos são inválidos.",
            ConnectionError: "Erro de conexão. Verifique sua internet e tente novamente."
        }
        
        self.recovery_suggestions = {
            DocumentNotFoundException: [
                "Verifique se o ID do documento está correto",
                "Confirme se o documento foi carregado no sistema",
                "Contate o suporte se o problema persistir"
            ],
            OrganizationNotFoundException: [
                "Verifique se o ID da organização está correto",
                "Confirme se a organização está ativa no sistema",
                "Contate o administrador do sistema"
            ],
            AnalysisTimeoutException: [
                "Tente novamente após alguns minutos",
                "Verifique se o documento não é muito grande",
                "Contate o suporte se o problema persistir"
            ],
            RateLimitException: [
                "Aguarde o tempo indicado antes de tentar novamente",
                "Reduza a frequência de solicitações",
                "Considere upgrade do plano se necessário"
            ]
        }
    
    def handle_error(
        self,
        error: Exception,
        context: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> ErrorInfo:
        """
        Manipula erro e retorna informações estruturadas.
        
        Args:
            error: Exceção ocorrida
            context: Contexto adicional do erro
            user_id: ID do usuário que gerou o erro
            
        Returns:
            ErrorInfo com informações estruturadas do erro
        """
        import uuid
        
        error_id = str(uuid.uuid4())
        error_type = type(error).__name__
        severity = self._determine_severity(error)
        
        # Extrai código do erro se for exceção de domínio
        error_code = getattr(error, 'error_code', 'UNKNOWN_ERROR')
        
        # Constrói contexto completo
        full_context = context or {}
        if hasattr(error, 'context'):
            full_context.update(error.context)
        if user_id:
            full_context['user_id'] = user_id
        
        # Mensagem amigável ao usuário
        user_message = self._get_user_friendly_message(error)
        
        # Sugestões de recuperação
        recovery_suggestions = self._get_recovery_suggestions(error)
        
        # Stack trace para erros não de domínio
        stack_trace = None
        if not isinstance(error, AnalysisException):
            stack_trace = traceback.format_exc()
        
        error_info = ErrorInfo(
            error_id=error_id,
            error_type=error_type,
            error_code=error_code,
            message=str(error),
            severity=severity,
            timestamp=datetime.utcnow(),
            context=full_context,
            stack_trace=stack_trace,
            user_message=user_message,
            recovery_suggestions=recovery_suggestions
        )
        
        return error_info
    
    def _determine_severity(self, error: Exception) -> ErrorSeverity:
        """Determina severidade do erro."""
        for error_type, severity in self.error_mappings.items():
            if isinstance(error, error_type):
                return severity
        
        return ErrorSeverity.MEDIUM
    
    def _get_user_friendly_message(self, error: Exception) -> str:
        """Obtém mensagem amigável para o usuário."""
        for error_type, message in self.user_friendly_messages.items():
            if isinstance(error, error_type):
                return message
        
        return "Ocorreu um erro inesperado. Tente novamente ou contate o suporte."
    
    def _get_recovery_suggestions(self, error: Exception) -> list:
        """Obtém sugestões de recuperação do erro."""
        for error_type, suggestions in self.recovery_suggestions.items():
            if isinstance(error, error_type):
                return suggestions
        
        return [
            "Tente novamente",
            "Verifique os dados fornecidos",
            "Contate o suporte se o problema persistir"
        ]
    
    async def log_error(self, error_info: ErrorInfo) -> None:
        """Registra erro no sistema de logging."""
        # Em implementação real, integraria com sistema de logging
        print(f"ERROR [{error_info.severity.value.upper()}] {error_info.error_code}: {error_info.message}")
        if error_info.context:
            print(f"Context: {error_info.context}")
        if error_info.stack_trace and error_info.severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
            print(f"Stack trace: {error_info.stack_trace}")
    
    async def send_alert_if_needed(self, error_info: ErrorInfo) -> None:
        """Envia alerta se erro for crítico."""
        if error_info.severity == ErrorSeverity.CRITICAL:
            # Em implementação real, enviaria alerta via Slack, email, etc.
            print(f"🚨 CRITICAL ERROR ALERT: {error_info.error_code} - {error_info.message}")
    
    async def update_metrics(self, error_info: ErrorInfo) -> None:
        """Atualiza métricas de erro."""
        # Em implementação real, registraria métricas no sistema de monitoramento
        pass


class ErrorHandlerMiddleware:
    """
    Middleware para tratamento de erros em aplicações web.
    """
    
    def __init__(self, error_handler: GlobalErrorHandler):
        self.error_handler = error_handler
    
    async def handle_request_error(
        self,
        error: Exception,
        request_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Manipula erro de request web.
        
        Args:
            error: Exceção ocorrida
            request_context: Contexto do request
            
        Returns:
            Resposta de erro estruturada
        """
        error_info = self.error_handler.handle_error(error, request_context)
        
        # Log e alertas
        await self.error_handler.log_error(error_info)
        await self.error_handler.send_alert_if_needed(error_info)
        await self.error_handler.update_metrics(error_info)
        
        # Mapeia severidade para status HTTP
        status_code_mapping = {
            ErrorSeverity.LOW: 400,
            ErrorSeverity.MEDIUM: 422,
            ErrorSeverity.HIGH: 500,
            ErrorSeverity.CRITICAL: 503
        }
        
        status_code = status_code_mapping.get(error_info.severity, 500)
        
        # Resposta estruturada
        response = {
            'error': {
                'id': error_info.error_id,
                'code': error_info.error_code,
                'message': error_info.user_message,
                'severity': error_info.severity.value,
                'timestamp': error_info.timestamp.isoformat(),
                'recovery_suggestions': error_info.recovery_suggestions
            }
        }
        
        # Adiciona detalhes técnicos apenas em desenvolvimento
        if error_info.severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
            response['error']['technical_details'] = {
                'error_type': error_info.error_type,
                'original_message': error_info.message,
                'context': error_info.context
            }
        
        return {
            'status_code': status_code,
            'response': response
        }


# Instância global do manipulador de erros
global_error_handler = GlobalErrorHandler()


def get_error_handler() -> GlobalErrorHandler:
    """Obtém instância global do manipulador de erros."""
    return global_error_handler