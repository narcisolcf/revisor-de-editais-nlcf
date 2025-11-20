"""
Cache Service para RAG

Implementa cache em Redis para:
- Embeddings
- Resultados de retrieval
- Respostas geradas
- Metadados de corpus
"""

import json
import hashlib
from typing import Optional, Any
from datetime import timedelta
import structlog

try:
    import redis
except ImportError:
    redis = None

from ..config_rag import get_rag_config

logger = structlog.get_logger(__name__)


class CacheService:
    """
    Serviço de cache para RAG.

    Features:
    - Cache de embeddings
    - Cache de retrieval results
    - Cache de generated responses
    - TTL configurável
    """

    def __init__(self):
        """Inicializa o serviço de cache."""
        self.config = get_rag_config()
        self.logger = structlog.get_logger(self.__class__.__name__)
        self.redis_client = None
        self.enabled = self.config.cache_enabled

        if self.enabled and redis:
            try:
                self.redis_client = redis.Redis(
                    host=self.config.redis_host,
                    port=self.config.redis_port,
                    db=self.config.redis_db,
                    decode_responses=True
                )
                # Testa conexão
                self.redis_client.ping()
                self.logger.info("✅ Redis cache connected")
            except Exception as e:
                self.logger.warning(
                    "⚠️ Redis cache unavailable, using in-memory fallback",
                    error=str(e)
                )
                self.redis_client = None
                # Fallback para cache em memória
                self._memory_cache = {}
        else:
            self._memory_cache = {}

    def get(self, key: str) -> Optional[Any]:
        """
        Recupera valor do cache.

        Args:
            key: Chave do cache

        Returns:
            Valor ou None se não encontrado
        """
        if not self.enabled:
            return None

        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                if value:
                    return json.loads(value)
            else:
                return self._memory_cache.get(key)
        except Exception as e:
            self.logger.error("❌ Cache get failed", key=key, error=str(e))

        return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Armazena valor no cache.

        Args:
            key: Chave do cache
            value: Valor para armazenar
            ttl: Time-to-live em segundos

        Returns:
            True se sucesso
        """
        if not self.enabled:
            return False

        ttl = ttl or self.config.cache_ttl_seconds

        try:
            serialized_value = json.dumps(value)

            if self.redis_client:
                self.redis_client.setex(
                    key,
                    ttl,
                    serialized_value
                )
            else:
                self._memory_cache[key] = value

            return True

        except Exception as e:
            self.logger.error("❌ Cache set failed", key=key, error=str(e))
            return False

    def delete(self, key: str) -> bool:
        """
        Remove valor do cache.

        Args:
            key: Chave para remover

        Returns:
            True se removido
        """
        try:
            if self.redis_client:
                return bool(self.redis_client.delete(key))
            else:
                return self._memory_cache.pop(key, None) is not None

        except Exception as e:
            self.logger.error("❌ Cache delete failed", key=key, error=str(e))
            return False

    def generate_cache_key(self, *parts: str) -> str:
        """
        Gera chave de cache única.

        Args:
            *parts: Partes da chave

        Returns:
            Chave de cache
        """
        combined = ":".join(str(p) for p in parts)
        hash_value = hashlib.sha256(combined.encode()).hexdigest()[:16]
        return f"rag:{hash_value}"

    def clear_all(self) -> bool:
        """Limpa todo o cache."""
        try:
            if self.redis_client:
                # Limpa apenas keys com prefixo 'rag:'
                for key in self.redis_client.scan_iter("rag:*"):
                    self.redis_client.delete(key)
            else:
                self._memory_cache.clear()

            self.logger.info("✅ Cache cleared")
            return True

        except Exception as e:
            self.logger.error("❌ Cache clear failed", error=str(e))
            return False


# Singleton global cache
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Retorna cache service singleton."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
