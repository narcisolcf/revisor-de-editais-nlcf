"""
Knowledge Base Manager

Gerencia bases de conhecimento organizacionais no Vertex AI RAG.
Coordena corpus privados e compartilhados.
"""

import time
from datetime import datetime
from typing import List, Optional, Dict, Any
import structlog

from google.cloud import firestore
from google.api_core import exceptions as gcp_exceptions

from ..config_rag import get_rag_config, CorpusConfig
from ..models.document_models import Document
from ..models.rag_models import (
    OrganizationKnowledgeBase,
    SyncResult,
    ImportResult,
    ContextType,
)
from ..models.config_models import OrganizationConfig

from .rag_service import RAGService
from .document_processor import DocumentProcessor, GCSDocumentManager

logger = structlog.get_logger(__name__)


class KnowledgeBaseManager:
    """
    Gerenciador de bases de conhecimento por organização.

    Features:
    - Cria e gerencia corpus por organização
    - Mantém corpus compartilhados (leis, normas, jurisprudência)
    - Sincronização automática de documentos
    - Versionamento e atualização
    """

    def __init__(
        self,
        rag_service: RAGService,
        document_processor: Optional[DocumentProcessor] = None,
        firestore_client: Optional[firestore.Client] = None
    ):
        """
        Inicializa o gerenciador.

        Args:
            rag_service: Serviço RAG
            document_processor: Processador de documentos
            firestore_client: Cliente Firestore
        """
        self.config = get_rag_config()
        self.rag_service = rag_service
        self.document_processor = document_processor or DocumentProcessor()
        self.gcs_manager = GCSDocumentManager()

        # Firestore para persistência de metadados
        self.db = firestore_client or firestore.Client(
            project=self.config.project_id
        )

        self.logger = structlog.get_logger(self.__class__.__name__)
        self._kb_cache: Dict[str, OrganizationKnowledgeBase] = {}

    # ==================== Organization Knowledge Base ====================

    async def create_organization_kb(
        self,
        org_id: str,
        org_config: OrganizationConfig
    ) -> OrganizationKnowledgeBase:
        """
        Cria base de conhecimento para organização.

        Creates:
        1. Corpus privado da organização
        2. Referências aos corpus compartilhados

        Args:
            org_id: ID da organização
            org_config: Configuração da organização

        Returns:
            Base de conhecimento criada
        """
        self.logger.info(
            "🏗️ Creating organization knowledge base",
            org_id=org_id,
            org_name=org_config.name
        )

        try:
            # 1. Cria corpus privado
            private_corpus_config = CorpusConfig(
                display_name=f"Corpus Privado - {org_config.name}",
                description=f"Documentos privados da organização {org_config.name}",
                organization_id=org_id,
                is_shared=False,
                corpus_type="private"
            )

            private_corpus = await self.rag_service.create_corpus(
                private_corpus_config
            )

            # 2. Identifica corpus compartilhados disponíveis
            shared_corpus_ids = await self._get_shared_corpus_ids()

            # 3. Cria registro no Firestore
            kb_ref = self.db.collection('knowledge_bases').document(org_id)
            kb_data = {
                'organization_id': org_id,
                'organization_name': org_config.name,
                'private_corpus_id': private_corpus.corpus_id,
                'shared_corpus_ids': shared_corpus_ids,
                'created_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP,
                'document_count': 0,
                'last_sync_at': None,
                'status': 'active',
                'metadata': {
                    'corpus_name': private_corpus.corpus_name,
                    'preset': org_config.preset.value if org_config.preset else 'standard'
                }
            }
            kb_ref.set(kb_data)

            # 4. Cria modelo local
            kb = OrganizationKnowledgeBase(
                organization_id=org_id,
                private_corpus_id=private_corpus.corpus_id,
                shared_corpus_ids=shared_corpus_ids,
                created_at=datetime.utcnow(),
                document_count=0
            )

            # Cache
            self._kb_cache[org_id] = kb

            self.logger.info(
                "✅ Organization knowledge base created",
                org_id=org_id,
                private_corpus_id=private_corpus.corpus_id,
                shared_corpus_count=len(shared_corpus_ids)
            )

            return kb

        except Exception as e:
            self.logger.error(
                "❌ Failed to create organization KB",
                org_id=org_id,
                error=str(e)
            )
            raise

    async def get_organization_kb(
        self,
        org_id: str
    ) -> Optional[OrganizationKnowledgeBase]:
        """
        Recupera base de conhecimento da organização.

        Args:
            org_id: ID da organização

        Returns:
            Base de conhecimento ou None
        """
        # Verifica cache
        if org_id in self._kb_cache:
            return self._kb_cache[org_id]

        self.logger.info("🔍 Fetching organization KB", org_id=org_id)

        try:
            # Busca no Firestore
            kb_ref = self.db.collection('knowledge_bases').document(org_id)
            kb_doc = kb_ref.get()

            if not kb_doc.exists:
                self.logger.warning("⚠️ Organization KB not found", org_id=org_id)
                return None

            kb_data = kb_doc.to_dict()

            kb = OrganizationKnowledgeBase(
                organization_id=kb_data['organization_id'],
                private_corpus_id=kb_data['private_corpus_id'],
                shared_corpus_ids=kb_data.get('shared_corpus_ids', []),
                created_at=kb_data.get('created_at'),
                updated_at=kb_data.get('updated_at'),
                document_count=kb_data.get('document_count', 0),
                last_sync_at=kb_data.get('last_sync_at'),
                status=kb_data.get('status', 'active')
            )

            # Cache
            self._kb_cache[org_id] = kb

            return kb

        except Exception as e:
            self.logger.error(
                "❌ Failed to fetch organization KB",
                org_id=org_id,
                error=str(e)
            )
            return None

    async def delete_organization_kb(self, org_id: str) -> bool:
        """
        Deleta base de conhecimento da organização.

        Args:
            org_id: ID da organização

        Returns:
            True se deletado com sucesso
        """
        self.logger.info("🗑️ Deleting organization KB", org_id=org_id)

        try:
            # 1. Busca KB
            kb = await self.get_organization_kb(org_id)
            if not kb:
                return False

            # 2. Deleta corpus privado
            await self.rag_service.delete_corpus(kb.private_corpus_id)

            # 3. Deleta registro do Firestore
            kb_ref = self.db.collection('knowledge_bases').document(org_id)
            kb_ref.delete()

            # 4. Remove do cache
            self._kb_cache.pop(org_id, None)

            self.logger.info("✅ Organization KB deleted", org_id=org_id)
            return True

        except Exception as e:
            self.logger.error(
                "❌ Failed to delete organization KB",
                org_id=org_id,
                error=str(e)
            )
            return False

    # ==================== Document Sync ====================

    async def sync_organization_documents(
        self,
        org_id: str,
        force_resync: bool = False
    ) -> SyncResult:
        """
        Sincroniza documentos da organização com RAG corpus.

        Process:
        1. Busca documentos aprovados no Firestore
        2. Filtra documentos não sincronizados
        3. Processa e importa para corpus

        Args:
            org_id: ID da organização
            force_resync: Força resincronização de todos

        Returns:
            Resultado da sincronização
        """
        self.logger.info(
            "🔄 Syncing organization documents",
            org_id=org_id,
            force_resync=force_resync
        )

        start_time = time.time()

        try:
            # 1. Busca KB
            kb = await self.get_organization_kb(org_id)
            if not kb:
                raise ValueError(f"Organization KB not found: {org_id}")

            # 2. Busca documentos no Firestore
            docs_ref = self.db.collection('documents').where(
                'organizationId', '==', org_id
            ).where(
                'status', '==', 'approved'
            )

            docs_to_sync = []
            async for doc_snap in docs_ref.stream():
                doc_data = doc_snap.to_dict()

                # Verifica se precisa sincronizar
                if force_resync or not doc_data.get('synced_to_rag'):
                    docs_to_sync.append(doc_data)

            self.logger.info(
                "📚 Found documents to sync",
                org_id=org_id,
                total=len(docs_to_sync)
            )

            # 3. Processa e importa
            successful = 0
            failed = 0
            gcs_uris = []

            for doc_data in docs_to_sync:
                try:
                    # Cria modelo Document
                    document = self._firestore_doc_to_model(doc_data)

                    # Processa documento
                    processed_doc = await self.document_processor.process_for_rag(
                        document,
                        organization_id=org_id
                    )

                    if processed_doc.gcs_uri:
                        gcs_uris.append(processed_doc.gcs_uri)

                        # Marca como sincronizado no Firestore
                        doc_ref = self.db.collection('documents').document(doc_data['id'])
                        doc_ref.update({
                            'synced_to_rag': True,
                            'rag_gcs_uri': processed_doc.gcs_uri,
                            'rag_synced_at': firestore.SERVER_TIMESTAMP
                        })

                        successful += 1

                except Exception as e:
                    self.logger.error(
                        "❌ Failed to sync document",
                        doc_id=doc_data.get('id'),
                        error=str(e)
                    )
                    failed += 1

            # 4. Importa para corpus RAG (batch)
            if gcs_uris:
                import_result = await self.rag_service.import_files(
                    corpus_id=kb.private_corpus_id,
                    source_uris=gcs_uris
                )

                self.logger.info(
                    "📥 Batch import completed",
                    successful=import_result.successful,
                    failed=import_result.failed
                )

            # 5. Atualiza KB
            kb_ref = self.db.collection('knowledge_bases').document(org_id)
            kb_ref.update({
                'document_count': successful,
                'last_sync_at': firestore.SERVER_TIMESTAMP,
                'updated_at': firestore.SERVER_TIMESTAMP
            })

            sync_time = time.time() - start_time

            result = SyncResult(
                organization_id=org_id,
                corpus_id=kb.private_corpus_id,
                total_documents=len(docs_to_sync),
                successful=successful,
                failed=failed,
                sync_time_seconds=sync_time,
                last_sync_at=datetime.utcnow()
            )

            self.logger.info(
                "✅ Document sync completed",
                org_id=org_id,
                successful=successful,
                failed=failed,
                sync_time=f"{sync_time:.2f}s"
            )

            return result

        except Exception as e:
            self.logger.error(
                "❌ Document sync failed",
                org_id=org_id,
                error=str(e)
            )

            return SyncResult(
                organization_id=org_id,
                corpus_id='',
                total_documents=0,
                successful=0,
                failed=0,
                sync_time_seconds=time.time() - start_time
            )

    # ==================== Shared Knowledge Base ====================

    async def update_shared_knowledge_base(
        self,
        base_type: str,  # 'leis', 'normas', 'jurisprudencia'
        documents: List[Document]
    ) -> ImportResult:
        """
        Atualiza base compartilhada de conhecimento.

        Shared bases:
        - leis: Legislação federal (8.666/93, 14.133/21, etc)
        - normas: Normas ABNT, NBR
        - jurisprudencia: Acórdãos TCU, TCE

        Args:
            base_type: Tipo da base
            documents: Documentos para adicionar

        Returns:
            Resultado da importação
        """
        self.logger.info(
            "📚 Updating shared knowledge base",
            base_type=base_type,
            document_count=len(documents)
        )

        try:
            # 1. Busca ou cria corpus compartilhado
            corpus_config = CorpusConfig(
                display_name=f"Base Compartilhada - {base_type.title()}",
                description=f"Documentos compartilhados de {base_type}",
                is_shared=True,
                corpus_type=base_type
            )

            corpus_id = await self._get_or_create_shared_corpus(
                base_type,
                corpus_config
            )

            # 2. Processa e upload documentos
            gcs_uris = []
            for doc in documents:
                processed_doc = await self.document_processor.process_for_rag(
                    doc,
                    organization_id="shared"
                )

                if processed_doc.gcs_uri:
                    gcs_uris.append(processed_doc.gcs_uri)

            # 3. Importa para corpus
            import_result = await self.rag_service.import_files(
                corpus_id=corpus_id,
                source_uris=gcs_uris
            )

            self.logger.info(
                "✅ Shared knowledge base updated",
                base_type=base_type,
                corpus_id=corpus_id,
                successful=import_result.successful
            )

            return import_result

        except Exception as e:
            self.logger.error(
                "❌ Failed to update shared KB",
                base_type=base_type,
                error=str(e)
            )
            raise

    async def get_corpus_for_context(
        self,
        org_id: str,
        context_type: ContextType
    ) -> List[str]:
        """
        Retorna IDs de corpus relevantes para tipo de contexto.

        Args:
            org_id: ID da organização
            context_type: Tipo de contexto desejado

        Returns:
            Lista de corpus IDs
        """
        kb = await self.get_organization_kb(org_id)
        if not kb:
            return []

        if context_type == ContextType.ALL:
            return kb.get_all_corpus_ids()

        elif context_type == ContextType.ORGANIZATIONAL:
            return [kb.private_corpus_id]

        elif context_type == ContextType.LEGAL:
            return [cid for cid in kb.shared_corpus_ids if 'leis' in cid]

        elif context_type == ContextType.NORMAS:
            return [cid for cid in kb.shared_corpus_ids if 'normas' in cid]

        elif context_type == ContextType.JURISPRUDENCIA:
            return [cid for cid in kb.shared_corpus_ids if 'jurisprudencia' in cid]

        elif context_type == ContextType.TEMPLATES:
            return [kb.private_corpus_id]

        return kb.get_all_corpus_ids()

    # ==================== Helper Methods ====================

    async def _get_shared_corpus_ids(self) -> List[str]:
        """Retorna IDs dos corpus compartilhados disponíveis."""
        shared_corpus = []

        # Lista corpus compartilhados conhecidos
        shared_types = ['leis', 'normas', 'jurisprudencia']

        for corpus_type in shared_types:
            try:
                # Busca corpus compartilhado
                corpora = await self.rag_service.list_corpora()
                for corpus in corpora:
                    if corpus.is_shared and corpus.corpus_type == corpus_type:
                        shared_corpus.append(corpus.corpus_id)
                        break

            except Exception as e:
                self.logger.warning(
                    "⚠️ Shared corpus not found",
                    corpus_type=corpus_type,
                    error=str(e)
                )

        return shared_corpus

    async def _get_or_create_shared_corpus(
        self,
        base_type: str,
        corpus_config: CorpusConfig
    ) -> str:
        """Busca ou cria corpus compartilhado."""
        # Tenta buscar existente
        corpora = await self.rag_service.list_corpora()

        for corpus in corpora:
            if corpus.is_shared and corpus.corpus_type == base_type:
                return corpus.corpus_id

        # Não existe - cria novo
        corpus = await self.rag_service.create_corpus(corpus_config)
        return corpus.corpus_id

    def _firestore_doc_to_model(self, doc_data: Dict[str, Any]) -> Document:
        """Converte documento do Firestore para modelo."""
        return Document(
            id=doc_data.get('id', ''),
            title=doc_data.get('title', 'Sem título'),
            content=doc_data.get('extractedText', doc_data.get('content', '')),
            file_type=doc_data.get('fileType', 'unknown'),
            file_size=doc_data.get('fileSize', 0),
            uploaded_at=doc_data.get('uploadedAt', datetime.utcnow()),
            metadata=doc_data.get('metadata', {})
        )
