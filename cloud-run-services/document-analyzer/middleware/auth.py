"""
LicitaReview - Middleware de Autenticação

Middleware para verificação de API keys e autenticação de requests.
"""

from typing import Optional
from fastapi import HTTPException, Header
import structlog

logger = structlog.get_logger(__name__)

# API Keys válidas (em produção viria do banco de dados ou serviço de auth)
VALID_API_KEYS = {
    "licitareview_demo_key_2024": {
        "organization_id": "org_demo",
        "name": "Demonstração LicitaReview",
        "permissions": ["analyze", "upload", "config"]
    },
    "licitareview_test_key_2024": {
        "organization_id": "org_test", 
        "name": "Testes LicitaReview",
        "permissions": ["analyze", "upload"]
    }
}


async def verify_api_key(
    x_api_key: Optional[str] = Header(None, description="API Key para autenticação")
) -> str:
    """
    Verifica e valida API key do header.
    
    Args:
        x_api_key: API key fornecida no header X-API-Key
        
    Returns:
        API key validada
        
    Raises:
        HTTPException: Se API key inválida ou ausente
    """
    if not x_api_key:
        logger.warning("Request without API key")
        raise HTTPException(
            status_code=401,
            detail="API key obrigatória. Inclua no header X-API-Key."
        )
    
    if x_api_key not in VALID_API_KEYS:
        logger.warning("Invalid API key attempted", api_key_prefix=x_api_key[:10])
        raise HTTPException(
            status_code=401,
            detail="API key inválida."
        )
    
    # Log de acesso autorizado
    key_info = VALID_API_KEYS[x_api_key]
    logger.info(
        "Authorized request",
        organization_id=key_info["organization_id"],
        organization_name=key_info["name"]
    )
    
    return x_api_key


def get_organization_from_api_key(api_key: str) -> Optional[dict]:
    """
    Extrai informações da organização a partir da API key.
    
    Args:
        api_key: API key validada
        
    Returns:
        Dict com informações da organização ou None
    """
    return VALID_API_KEYS.get(api_key)