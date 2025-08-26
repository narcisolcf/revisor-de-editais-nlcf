"""
Analysis Domain Exceptions

Exceções específicas para operações de análise.
"""

from typing import Optional, Dict, Any, List


class AnalysisException(Exception):
    """Exceção base para erros de análise."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code or "ANALYSIS_ERROR"
        self.context = context or {}


class DocumentNotFoundException(AnalysisException):
    """Documento não encontrado."""
    
    def __init__(self, document_id: str):
        super().__init__(
            f"Documento {document_id} não encontrado",
            error_code="DOCUMENT_NOT_FOUND",
            context={"document_id": document_id}
        )
        self.document_id = document_id


class OrganizationNotFoundException(AnalysisException):
    """Organização não encontrada."""
    
    def __init__(self, organization_id: str):
        super().__init__(
            f"Organização {organization_id} não encontrada",
            error_code="ORGANIZATION_NOT_FOUND",
            context={"organization_id": organization_id}
        )
        self.organization_id = organization_id


class InvalidOrganizationConfigException(AnalysisException):
    """Configuração de organização inválida."""
    
    def __init__(self, organization_id: str, validation_errors: List[str]):
        error_msg = f"Configuração inválida para organização {organization_id}: {'; '.join(validation_errors)}"
        super().__init__(
            error_msg,
            error_code="INVALID_ORGANIZATION_CONFIG",
            context={
                "organization_id": organization_id,
                "validation_errors": validation_errors
            }
        )
        self.organization_id = organization_id
        self.validation_errors = validation_errors


class DocumentValidationException(AnalysisException):
    """Erro de validação de documento."""
    
    def __init__(self, document_id: str, validation_errors: List[str]):
        error_msg = f"Documento {document_id} inválido: {'; '.join(validation_errors)}"
        super().__init__(
            error_msg,
            error_code="DOCUMENT_VALIDATION_ERROR",
            context={
                "document_id": document_id,
                "validation_errors": validation_errors
            }
        )
        self.document_id = document_id
        self.validation_errors = validation_errors


class AnalysisTimeoutException(AnalysisException):
    """Timeout durante análise."""
    
    def __init__(
        self, 
        document_id: str, 
        organization_id: str,
        timeout_seconds: int
    ):
        super().__init__(
            f"Timeout na análise do documento {document_id} para organização {organization_id} após {timeout_seconds}s",
            error_code="ANALYSIS_TIMEOUT",
            context={
                "document_id": document_id,
                "organization_id": organization_id,
                "timeout_seconds": timeout_seconds
            }
        )
        self.document_id = document_id
        self.organization_id = organization_id
        self.timeout_seconds = timeout_seconds


class AnalysisEngineException(AnalysisException):
    """Erro no engine de análise."""
    
    def __init__(
        self, 
        engine_name: str, 
        original_error: Exception,
        document_id: Optional[str] = None
    ):
        super().__init__(
            f"Erro no engine de análise {engine_name}: {str(original_error)}",
            error_code="ANALYSIS_ENGINE_ERROR",
            context={
                "engine_name": engine_name,
                "original_error": str(original_error),
                "original_error_type": type(original_error).__name__,
                "document_id": document_id
            }
        )
        self.engine_name = engine_name
        self.original_error = original_error
        self.document_id = document_id


class CustomRuleException(AnalysisException):
    """Erro em regra personalizada."""
    
    def __init__(
        self, 
        rule_id: str, 
        rule_name: str,
        error_message: str
    ):
        super().__init__(
            f"Erro na regra personalizada '{rule_name}' (ID: {rule_id}): {error_message}",
            error_code="CUSTOM_RULE_ERROR",
            context={
                "rule_id": rule_id,
                "rule_name": rule_name,
                "error_message": error_message
            }
        )
        self.rule_id = rule_id
        self.rule_name = rule_name


class AnalysisQuotaExceededException(AnalysisException):
    """Quota de análise excedida."""
    
    def __init__(
        self, 
        organization_id: str,
        current_usage: int,
        quota_limit: int
    ):
        super().__init__(
            f"Quota de análise excedida para organização {organization_id}: {current_usage}/{quota_limit}",
            error_code="ANALYSIS_QUOTA_EXCEEDED",
            context={
                "organization_id": organization_id,
                "current_usage": current_usage,
                "quota_limit": quota_limit
            }
        )
        self.organization_id = organization_id
        self.current_usage = current_usage
        self.quota_limit = quota_limit


class CacheException(AnalysisException):
    """Erro relacionado ao cache."""
    
    def __init__(self, cache_operation: str, original_error: Exception):
        super().__init__(
            f"Erro na operação de cache '{cache_operation}': {str(original_error)}",
            error_code="CACHE_ERROR",
            context={
                "cache_operation": cache_operation,
                "original_error": str(original_error),
                "original_error_type": type(original_error).__name__
            }
        )
        self.cache_operation = cache_operation
        self.original_error = original_error


class RateLimitException(AnalysisException):
    """Rate limit excedido."""
    
    def __init__(
        self, 
        client_id: str,
        retry_after_seconds: int
    ):
        super().__init__(
            f"Rate limit excedido para cliente {client_id}. Tente novamente em {retry_after_seconds}s",
            error_code="RATE_LIMIT_EXCEEDED",
            context={
                "client_id": client_id,
                "retry_after_seconds": retry_after_seconds
            }
        )
        self.client_id = client_id
        self.retry_after_seconds = retry_after_seconds


class InsufficientPermissionsException(AnalysisException):
    """Permissões insuficientes."""
    
    def __init__(
        self, 
        user_id: str,
        required_permission: str,
        resource: Optional[str] = None
    ):
        message = f"Usuário {user_id} não possui permissão '{required_permission}'"
        if resource:
            message += f" para o recurso '{resource}'"
        
        super().__init__(
            message,
            error_code="INSUFFICIENT_PERMISSIONS",
            context={
                "user_id": user_id,
                "required_permission": required_permission,
                "resource": resource
            }
        )
        self.user_id = user_id
        self.required_permission = required_permission
        self.resource = resource