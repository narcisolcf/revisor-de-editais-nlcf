"""
LicitaReview - Middleware de Rate Limiting

Controla a taxa de requests para prevenir abuse da API.
"""

import time
from typing import Dict
from fastapi import HTTPException, Request
import structlog

logger = structlog.get_logger(__name__)

# Armazenamento em memória para rate limiting
# Em produção, usar Redis ou similar
request_counts: Dict[str, Dict[str, any]] = {}

# Configurações de rate limiting
RATE_LIMITS = {
    'analyze': {'requests': 10, 'window_seconds': 60},  # 10 análises por minuto
    'upload': {'requests': 20, 'window_seconds': 60},   # 20 uploads por minuto
    'default': {'requests': 60, 'window_seconds': 60}   # 60 requests por minuto
}


async def rate_limit(request: Request) -> None:
    """
    Middleware de rate limiting baseado em IP e endpoint.
    
    Args:
        request: Request do FastAPI
        
    Raises:
        HTTPException: Se limite de rate excedido
    """
    # Identifica cliente (IP + User-Agent)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("User-Agent", "unknown")[:50]
    client_id = f"{client_ip}_{hash(user_agent) % 10000}"
    
    # Determina endpoint e limite aplicável
    endpoint = _get_endpoint_type(request.url.path)
    limit_config = RATE_LIMITS.get(endpoint, RATE_LIMITS['default'])
    
    current_time = time.time()
    window_start = current_time - limit_config['window_seconds']
    
    # Inicializa ou limpa dados antigos do cliente
    if client_id not in request_counts:
        request_counts[client_id] = {'requests': [], 'first_request': current_time}
    
    client_data = request_counts[client_id]
    
    # Remove requests antigas da janela
    client_data['requests'] = [
        req_time for req_time in client_data['requests'] 
        if req_time > window_start
    ]
    
    # Verifica se excedeu o limite
    if len(client_data['requests']) >= limit_config['requests']:
        logger.warning(
            "Rate limit exceeded",
            client_id=client_id,
            endpoint=endpoint,
            requests_count=len(client_data['requests']),
            limit=limit_config['requests'],
            window_seconds=limit_config['window_seconds']
        )
        
        # Calcula tempo para reset
        oldest_request = min(client_data['requests'])
        retry_after = int(oldest_request + limit_config['window_seconds'] - current_time + 1)
        
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit excedido. Tente novamente em {retry_after} segundos.",
            headers={"Retry-After": str(retry_after)}
        )
    
    # Registra request atual
    client_data['requests'].append(current_time)
    
    logger.debug(
        "Rate limit check passed",
        client_id=client_id,
        endpoint=endpoint,
        current_requests=len(client_data['requests']),
        limit=limit_config['requests']
    )


def _get_endpoint_type(path: str) -> str:
    """
    Determina o tipo de endpoint baseado no path.
    
    Args:
        path: Path da URL
        
    Returns:
        Tipo do endpoint para rate limiting
    """
    if '/analyze' in path:
        return 'analyze'
    elif '/upload' in path:
        return 'upload'
    else:
        return 'default'


def get_rate_limit_status(client_id: str, endpoint: str = 'default') -> Dict[str, any]:
    """
    Retorna status atual do rate limiting para um cliente.
    
    Args:
        client_id: Identificador do cliente
        endpoint: Tipo de endpoint
        
    Returns:
        Dict com status do rate limiting
    """
    if client_id not in request_counts:
        return {
            'requests_made': 0,
            'requests_remaining': RATE_LIMITS[endpoint]['requests'],
            'reset_time': None
        }
    
    client_data = request_counts[client_id]
    limit_config = RATE_LIMITS[endpoint]
    current_time = time.time()
    window_start = current_time - limit_config['window_seconds']
    
    # Conta requests na janela atual
    recent_requests = [
        req_time for req_time in client_data['requests']
        if req_time > window_start
    ]
    
    requests_made = len(recent_requests)
    requests_remaining = max(0, limit_config['requests'] - requests_made)
    
    # Calcula quando o rate limit será resetado
    reset_time = None
    if recent_requests:
        oldest_request = min(recent_requests)
        reset_time = oldest_request + limit_config['window_seconds']
    
    return {
        'requests_made': requests_made,
        'requests_remaining': requests_remaining,
        'reset_time': reset_time,
        'window_seconds': limit_config['window_seconds']
    }