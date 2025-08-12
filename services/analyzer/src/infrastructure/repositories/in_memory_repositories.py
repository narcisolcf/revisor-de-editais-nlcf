"""
In-Memory Repository Implementations

Implementações em memória dos repositórios para desenvolvimento e testes.
"""

from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime, timedelta
import json

from ...domain.entities.document import Document, DocumentId
from ...domain.entities.organization import Organization, OrganizationId
from ...domain.entities.analysis import Analysis, AnalysisId
from ...domain.interfaces.repositories import (
    IDocumentRepository,
    IOrganizationRepository,
    IAnalysisRepository,
    ICacheRepository
)


class InMemoryDocumentRepository(IDocumentRepository):
    """Implementação em memória do repositório de documentos."""
    
    def __init__(self):
        self._documents: Dict[str, Document] = {}
    
    async def save(self, document: Document) -> None:
        """Salva documento."""
        self._documents[str(document.id)] = document
    
    async def find_by_id(self, document_id: DocumentId) -> Optional[Document]:
        """Busca documento por ID."""
        return self._documents.get(str(document_id))
    
    async def find_by_content_hash(self, content_hash: str) -> Optional[Document]:
        """Busca documento por hash do conteúdo."""
        for document in self._documents.values():
            if document.get_content_hash() == content_hash:
                return document
        return None
    
    async def find_similar_documents(
        self, 
        document: Document, 
        threshold: float = 0.9
    ) -> List[Document]:
        """Busca documentos similares."""
        similar_docs = []
        for doc in self._documents.values():
            if doc.id != document.id:
                if document.is_content_similar_to(doc.content, threshold):
                    similar_docs.append(doc)
        return similar_docs
    
    async def list_by_organization(
        self, 
        organization_id: OrganizationId,
        limit: int = 50,
        offset: int = 0
    ) -> List[Document]:
        """Lista documentos de uma organização."""
        # Para este exemplo simples, retorna todos os documentos
        # Em implementação real, haveria relacionamento org -> docs
        all_docs = list(self._documents.values())
        return all_docs[offset:offset + limit]
    
    async def delete(self, document_id: DocumentId) -> bool:
        """Remove documento."""
        if str(document_id) in self._documents:
            del self._documents[str(document_id)]
            return True
        return False
    
    async def exists(self, document_id: DocumentId) -> bool:
        """Verifica se documento existe."""
        return str(document_id) in self._documents


class InMemoryOrganizationRepository(IOrganizationRepository):
    """Implementação em memória do repositório de organizações."""
    
    def __init__(self):
        self._organizations: Dict[str, Organization] = {}
    
    async def save(self, organization: Organization) -> None:
        """Salva organização."""
        self._organizations[str(organization.id)] = organization
    
    async def find_by_id(self, organization_id: OrganizationId) -> Optional[Organization]:
        """Busca organização por ID."""
        return self._organizations.get(str(organization_id))
    
    async def find_by_name(self, name: str) -> Optional[Organization]:
        """Busca organização por nome."""
        for org in self._organizations.values():
            if org.name.lower() == name.lower():
                return org
        return None
    
    async def list_active(self, limit: int = 50, offset: int = 0) -> List[Organization]:
        """Lista organizações ativas."""
        active_orgs = [org for org in self._organizations.values() if org.is_active]
        return active_orgs[offset:offset + limit]
    
    async def update_config(self, organization: Organization) -> None:
        """Atualiza configuração da organização."""
        if str(organization.id) in self._organizations:
            self._organizations[str(organization.id)] = organization
        else:
            raise ValueError(f"Organização {organization.id} não encontrada")
    
    async def delete(self, organization_id: OrganizationId) -> bool:
        """Remove organização."""
        if str(organization_id) in self._organizations:
            del self._organizations[str(organization_id)]
            return True
        return False
    
    async def exists(self, organization_id: OrganizationId) -> bool:
        """Verifica se organização existe."""
        return str(organization_id) in self._organizations


class InMemoryAnalysisRepository(IAnalysisRepository):
    """Implementação em memória do repositório de análises."""
    
    def __init__(self):
        self._analyses: Dict[str, Analysis] = {}
    
    async def save(self, analysis: Analysis) -> None:
        """Salva análise."""
        self._analyses[str(analysis.id)] = analysis
    
    async def find_by_id(self, analysis_id: AnalysisId) -> Optional[Analysis]:
        """Busca análise por ID."""
        return self._analyses.get(str(analysis_id))
    
    async def find_by_document_and_organization(
        self,
        document_id: DocumentId,
        organization_id: OrganizationId
    ) -> List[Analysis]:
        """Busca análises de um documento por organização."""
        results = []
        for analysis in self._analyses.values():
            if (analysis.document_id == document_id and 
                analysis.organization_id == organization_id):
                results.append(analysis)
        
        # Ordena por data de criação (mais recentes primeiro)
        return sorted(results, key=lambda a: a.created_at, reverse=True)
    
    async def find_recent_by_organization(
        self,
        organization_id: OrganizationId,
        limit: int = 10
    ) -> List[Analysis]:
        """Busca análises recentes de uma organização."""
        org_analyses = [
            analysis for analysis in self._analyses.values()
            if analysis.organization_id == organization_id
        ]
        
        # Ordena por data e limita
        sorted_analyses = sorted(org_analyses, key=lambda a: a.created_at, reverse=True)
        return sorted_analyses[:limit]
    
    async def get_analytics(
        self,
        organization_id: Optional[OrganizationId] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Obtém analytics das análises."""
        analyses = list(self._analyses.values())
        
        # Filtra por organização se especificada
        if organization_id:
            analyses = [a for a in analyses if a.organization_id == organization_id]
        
        # Filtra por data se especificada
        if start_date:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            analyses = [a for a in analyses if a.created_at >= start_dt]
        
        if end_date:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            analyses = [a for a in analyses if a.created_at <= end_dt]
        
        # Calcula estatísticas
        total_analyses = len(analyses)
        if total_analyses == 0:
            return {
                'total_analyses': 0,
                'average_score': 0,
                'total_findings': 0,
                'analyses_by_status': {},
                'findings_by_severity': {}
            }
        
        avg_score = sum(a.weighted_score for a in analyses) / total_analyses
        total_findings = sum(len(a.findings) for a in analyses)
        
        # Conta por status
        status_counts = {}
        for analysis in analyses:
            status = analysis.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Conta findings por severidade
        severity_counts = {}
        for analysis in analyses:
            for finding in analysis.findings:
                severity = finding.severity.value
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        return {
            'total_analyses': total_analyses,
            'average_score': round(avg_score, 2),
            'total_findings': total_findings,
            'analyses_by_status': status_counts,
            'findings_by_severity': severity_counts,
            'period': {
                'start_date': start_date,
                'end_date': end_date
            }
        }
    
    async def delete_old_analyses(self, days_old: int = 90) -> int:
        """Remove análises antigas."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        old_analysis_ids = []
        for analysis_id, analysis in self._analyses.items():
            if analysis.created_at < cutoff_date:
                old_analysis_ids.append(analysis_id)
        
        for analysis_id in old_analysis_ids:
            del self._analyses[analysis_id]
        
        return len(old_analysis_ids)


class InMemoryCacheRepository(ICacheRepository):
    """Implementação em memória do repositório de cache."""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Obtém valor do cache."""
        if key in self._cache:
            cache_entry = self._cache[key]
            
            # Verifica TTL
            if 'expires_at' in cache_entry:
                if datetime.utcnow() > cache_entry['expires_at']:
                    del self._cache[key]
                    return None
            
            return cache_entry.get('value')
        
        return None
    
    async def set(
        self, 
        key: str, 
        value: Dict[str, Any], 
        ttl_seconds: int = 3600
    ) -> None:
        """Define valor no cache."""
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
        
        self._cache[key] = {
            'value': value,
            'expires_at': expires_at,
            'created_at': datetime.utcnow()
        }
    
    async def delete(self, key: str) -> bool:
        """Remove valor do cache."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False
    
    async def exists(self, key: str) -> bool:
        """Verifica se chave existe no cache."""
        if key in self._cache:
            # Verifica TTL
            cache_entry = self._cache[key]
            if 'expires_at' in cache_entry:
                if datetime.utcnow() > cache_entry['expires_at']:
                    del self._cache[key]
                    return False
            return True
        return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Remove chaves que correspondem ao padrão."""
        import re
        
        # Converte padrão simples com * para regex
        regex_pattern = pattern.replace('*', '.*')
        regex = re.compile(regex_pattern)
        
        keys_to_delete = []
        for key in self._cache.keys():
            if regex.match(key):
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self._cache[key]
        
        return len(keys_to_delete)
    
    async def cleanup_expired(self) -> int:
        """Remove entradas expiradas do cache."""
        expired_keys = []
        now = datetime.utcnow()
        
        for key, cache_entry in self._cache.items():
            if 'expires_at' in cache_entry and now > cache_entry['expires_at']:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self._cache[key]
        
        return len(expired_keys)