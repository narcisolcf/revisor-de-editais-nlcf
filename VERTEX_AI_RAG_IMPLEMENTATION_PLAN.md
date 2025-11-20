# 🚀 Plano de Implementação - Vertex AI RAG Engine
## LicitaReview - Sistema de Análise Inteligente de Documentos Licitatórios

**Data**: 20 de Novembro de 2025
**Versão**: 1.0
**Status**: Planejamento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pesquisa e Análise](#pesquisa-e-análise)
3. [Arquitetura Proposta](#arquitetura-proposta)
4. [Plano de Implementação](#plano-de-implementação)
5. [Estimativas e Cronograma](#estimativas-e-cronograma)
6. [Custos e Orçamento](#custos-e-orçamento)
7. [Riscos e Mitigação](#riscos-e-mitigação)
8. [Métricas de Sucesso](#métricas-de-sucesso)

---

## 🎯 Visão Geral

### Objetivo

Integrar o **Vertex AI RAG Engine** ao LicitaReview para aprimorar significativamente as capacidades de análise de documentos licitatórios através de:

- **Recuperação Contextual Inteligente**: Busca semântica avançada em corpus de documentos
- **Análise Aumentada por IA**: Respostas fundamentadas em conhecimento específico de licitações
- **Base de Conhecimento Organizacional**: Corpus personalizado por organização com normas, jurisprudência e melhores práticas
- **Redução de Alucinações**: Respostas baseadas em dados reais e verificáveis

### Por que Vertex AI RAG?

**Vertex AI RAG Engine** é a solução gerenciada do Google Cloud que oferece:

✅ **Simplicidade**: API unificada para gerenciamento de corpus, embeddings e retrieval
✅ **Escalabilidade**: Infraestrutura totalmente gerenciada e auto-escalável
✅ **Flexibilidade**: Suporte a múltiplos formatos (PDF, DOCX, TXT, HTML, Markdown)
✅ **Integração Nativa**: Funciona perfeitamente com Gemini e outros modelos do Vertex AI
✅ **Custo-Benefício**: Sem necessidade de gerenciar infraestrutura de vector databases
✅ **Segurança**: Dados privados permanecem no Google Cloud com controle de acesso

---

## 🔍 Pesquisa e Análise

### Documentação Oficial Consultada

#### **1. Vertex AI RAG Engine - Overview**
- **URL**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview
- **Última Atualização**: 2025-11-18
- **Status**: GA (General Availability) desde Janeiro 2025

**Principais Recursos:**

| Recurso | Descrição |
|---------|-----------|
| **RAG Corpus** | Índice otimizado para busca semântica de documentos |
| **Vector Databases** | RagManagedDb (default), Vector Search, Pinecone, Weaviate |
| **Data Sources** | Google Drive, GCS, Slack, JIRA, SharePoint |
| **File Formats** | PDF, DOCX, PPTX, TXT, HTML, Markdown, JSON |
| **Embedding Models** | text-embedding-004, text-embedding-005, multilingualembedding@001 |
| **LLM Support** | Gemini 2.0, Gemini 1.5, modelos personalizados |

#### **2. RAG Engine API Reference**
- **URL**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/rag-api
- **Principais Endpoints**:
  - `CreateRagCorpus` - Criar corpus de documentos
  - `ImportRagFiles` - Importar arquivos para o corpus
  - `RetrieveContexts` - Recuperar contextos relevantes
  - `GenerateContent` - Gerar respostas com RAG

#### **3. Quotas e Limites**
- **URL**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/quotas

**Limites Técnicos:**

| Parâmetro | Limite | Notas |
|-----------|--------|-------|
| **Embeddings por Request** | 250 textos | Max 20.000 tokens total |
| **Tokens por Embedding** | 2.048 tokens | Primeiros 2.048 são processados |
| **Chunk Size Ótimo** | ~512 tokens | Melhor performance |
| **Chunk Size Máximo** | 2.048 tokens | Limite do modelo |
| **Arquivos por Corpus** | Sem limite especificado | Limitado por quota do projeto |

#### **4. Pricing e Billing**
- **URL**: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-engine-billing

**Estrutura de Custos:**

| Componente | Custo | Observações |
|------------|-------|-------------|
| **RAG Engine Core** | GRATUITO | API é gratuita |
| **Data Ingestion** | Custo de embeddings | ~$0.025 por 1K tokens |
| **Vector Storage** | Custo de Spanner | ~$0.30/GB/mês |
| **Query Embeddings** | Custo de embeddings | ~$0.025 por 1K tokens |
| **LLM Generation** | Custo do modelo usado | Varia por modelo (Gemini) |
| **Grounding** | $2.50 por 1K requests | Opcional, para validação |

---

## 🏗️ Arquitetura Proposta

### Arquitetura Atual vs. Proposta

#### **Arquitetura Atual (Simplificada)**

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       v
┌──────────────────┐
│  Cloud Functions │
│  (Node.js/TS)    │
└──────┬───────────┘
       │
       v
┌──────────────────┐     ┌─────────────┐
│  Analyzer Service│────▶│  Firestore  │
│  (Python)        │     │  (Database) │
└──────┬───────────┘     └─────────────┘
       │
       v
┌──────────────────┐
│  AdaptiveAnalyzer│
│  + OCR Service   │
└──────────────────┘
```

#### **Arquitetura Proposta com Vertex AI RAG**

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       v
┌──────────────────────────────────────────────────┐
│            Cloud Functions (Node.js/TS)          │
└──────┬───────────────────────────────────────┬───┘
       │                                       │
       v                                       v
┌──────────────────┐                  ┌─────────────┐
│  Analyzer Service│◀────────────────▶│  Firestore  │
│  (Python)        │                  │  (Metadata) │
└──────┬───────────┘                  └─────────────┘
       │
       ├─────────────────┬─────────────────┬──────────────┐
       │                 │                 │              │
       v                 v                 v              v
┌─────────────┐   ┌────────────┐   ┌──────────┐   ┌──────────────┐
│   OCR       │   │  Adaptive  │   │ Vertex AI│   │  Knowledge   │
│  Service    │   │  Analyzer  │   │   RAG    │   │  Base Mgmt   │
└─────────────┘   └────────────┘   │  Engine  │   │   Service    │
                                    └────┬─────┘   └──────┬───────┘
                                         │                │
                                         v                v
                              ┌──────────────────┐  ┌────────────┐
                              │  RAG Corpus      │  │  Document  │
                              │  Management      │  │  Processor │
                              │  • Org Corpus A  │  │            │
                              │  • Org Corpus B  │  │  Chunking  │
                              │  • Shared Base   │  │  Embedding │
                              └──────────────────┘  └────────────┘
                                         │
                                         v
                              ┌──────────────────┐
                              │  Vector Database │
                              │  (RagManagedDb / │
                              │   Spanner)       │
                              └──────────────────┘
                                         │
                                         v
                              ┌──────────────────┐
                              │  Gemini Models   │
                              │  (Generation +   │
                              │   Grounding)     │
                              └──────────────────┘
```

### Componentes Novos

#### **1. RAG Service (Python)**
```python
# services/analyzer/src/services/rag_service.py

class RAGService:
    """
    Serviço de integração com Vertex AI RAG Engine.

    Responsabilidades:
    - Gerenciar corpus RAG por organização
    - Processar e indexar documentos
    - Realizar buscas semânticas
    - Gerar respostas fundamentadas
    """

    async def create_organization_corpus(
        self,
        org_id: str,
        corpus_config: CorpusConfig
    ) -> RagCorpus

    async def import_documents(
        self,
        corpus_id: str,
        documents: List[Document]
    ) -> ImportResult

    async def retrieve_contexts(
        self,
        corpus_id: str,
        query: str,
        top_k: int = 10
    ) -> List[RetrievedContext]

    async def generate_with_rag(
        self,
        corpus_id: str,
        query: str,
        model: str = "gemini-2.0-flash"
    ) -> RAGResponse
```

#### **2. Knowledge Base Manager**
```python
# services/analyzer/src/services/knowledge_base_manager.py

class KnowledgeBaseManager:
    """
    Gerenciador de bases de conhecimento organizacionais.

    Features:
    - Corpus por organização
    - Base compartilhada de leis e normas
    - Versionamento de documentos
    - Sincronização automática
    """

    async def sync_organization_knowledge(
        self,
        org_id: str
    ) -> SyncResult

    async def update_shared_base(
        self,
        base_type: str,  # "leis", "jurisprudencia", "normas"
        documents: List[Document]
    ) -> UpdateResult

    async def get_corpus_for_organization(
        self,
        org_id: str
    ) -> RagCorpus
```

#### **3. Document Processor**
```python
# services/analyzer/src/services/document_processor.py

class DocumentProcessor:
    """
    Processador de documentos para RAG.

    Features:
    - Chunking inteligente
    - Preservação de contexto
    - Metadata enrichment
    - Embedding generation
    """

    async def process_for_rag(
        self,
        document: Document,
        chunk_config: ChunkConfig
    ) -> ProcessedDocument

    async def extract_metadata(
        self,
        document: Document
    ) -> DocumentMetadata
```

### Fluxos de Trabalho

#### **Fluxo 1: Criação de Base de Conhecimento Organizacional**

```
1. Admin cria nova organização
   ↓
2. Sistema cria RAG Corpus para organização
   ↓
3. Admin faz upload de documentos base:
   - Editais anteriores aprovados
   - Templates organizacionais
   - Normas internas
   - Jurisprudência relevante
   ↓
4. DocumentProcessor processa documentos:
   - Chunking (512 tokens)
   - Extração de metadata
   - Embeddings
   ↓
5. Sistema importa para RAG Corpus
   ↓
6. Base de conhecimento pronta para uso
```

#### **Fluxo 2: Análise de Documento com RAG**

```
1. Usuário faz upload de edital
   ↓
2. OCRService extrai texto
   ↓
3. AdaptiveAnalyzer inicia análise
   ↓
4. Para cada seção/aspecto crítico:
   a) RAGService.retrieve_contexts()
      - Busca contextos relevantes no corpus
      - Top-K documentos similares
   b) RAGService.generate_with_rag()
      - Gemini analisa com contexto
      - Fundamenta resposta em docs reais
   c) Valida conformidade
   ↓
5. Combina análise tradicional + RAG
   ↓
6. Retorna resultado enriquecido
```

#### **Fluxo 3: Consulta Inteligente (Nova Feature)**

```
1. Usuário faz pergunta:
   "Quais são os requisitos de habilitação típicos?"
   ↓
2. RAGService.retrieve_contexts()
   - Busca em editais anteriores
   - Busca em normas
   ↓
3. RAGService.generate_with_rag()
   - Gemini sintetiza resposta
   - Cita fontes específicas
   ↓
4. Retorna resposta com referências:
   - Texto da resposta
   - Links para documentos fonte
   - Trechos relevantes
```

---

## 📐 Plano de Implementação

### Fase 1: Setup e Infraestrutura (1-2 semanas)

#### **Sprint 1.1: Configuração GCP (3-4 dias)**

**Tarefas:**

1. **Habilitar APIs necessárias**
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable spanner.googleapis.com
   gcloud services enable storage-component.googleapis.com
   ```

2. **Configurar Service Account**
   ```bash
   gcloud iam service-accounts create licitareview-rag-sa \
     --display-name="LicitaReview RAG Service Account"

   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:licitareview-rag-sa@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```

3. **Setup de Quotas**
   - Solicitar aumento de quotas se necessário
   - Configurar alertas de quota

4. **Ambiente de Desenvolvimento**
   ```bash
   # Instalar SDK do Vertex AI
   pip install google-cloud-aiplatform==1.70.0

   # Configurar credenciais
   export GOOGLE_APPLICATION_CREDENTIALS="credentials/licitareview-prod.json"
   ```

**Entregáveis:**
- ✅ GCP configurado com APIs habilitadas
- ✅ Service Account criada e permissões configuradas
- ✅ Ambiente de desenvolvimento pronto
- ✅ Documentação de setup

#### **Sprint 1.2: Implementação Base do RAGService (4-5 dias)**

**Tarefas:**

1. **Criar estrutura de serviço**
   ```python
   # services/analyzer/src/services/rag_service.py

   from google.cloud import aiplatform
   from vertexai.preview.generative_models import GenerativeModel
   from vertexai.preview import rag

   class RAGService:
       def __init__(self, project_id: str, location: str = "us-central1"):
           self.project_id = project_id
           self.location = location
           aiplatform.init(project=project_id, location=location)

       async def initialize(self):
           """Inicializa cliente RAG"""
           pass
   ```

2. **Implementar gestão de corpus**
   ```python
   async def create_corpus(
       self,
       corpus_name: str,
       display_name: str,
       description: str
   ) -> str:
       """Cria novo RAG corpus"""
       corpus = rag.create_corpus(
           display_name=display_name,
           description=description
       )
       return corpus.name

   async def get_corpus(self, corpus_id: str) -> rag.RagCorpus:
       """Recupera corpus existente"""
       return rag.get_corpus(name=corpus_id)

   async def list_corpora(self) -> List[rag.RagCorpus]:
       """Lista todos os corpus"""
       return rag.list_corpora()
   ```

3. **Implementar importação de documentos**
   ```python
   async def import_files(
       self,
       corpus_id: str,
       source_uris: List[str],
       chunk_size: int = 512,
       chunk_overlap: int = 100
   ) -> rag.ImportRagFilesResponse:
       """Importa arquivos para o corpus"""
       return await rag.import_files_async(
           corpus_name=corpus_id,
           paths=source_uris,
           chunk_size=chunk_size,
           chunk_overlap=chunk_overlap
       )
   ```

4. **Implementar retrieval**
   ```python
   async def retrieve_contexts(
       self,
       corpus_id: str,
       query: str,
       similarity_top_k: int = 10,
       vector_distance_threshold: float = 0.5
   ) -> List[rag.RetrievalContext]:
       """Recupera contextos relevantes"""
       return rag.retrieval_query(
           rag_resources=[
               rag.RagResource(
                   rag_corpus=corpus_id,
               )
           ],
           text=query,
           similarity_top_k=similarity_top_k,
           vector_distance_threshold=vector_distance_threshold
       )
   ```

5. **Implementar geração com RAG**
   ```python
   async def generate_with_rag(
       self,
       corpus_id: str,
       query: str,
       model_name: str = "gemini-2.0-flash-001"
   ) -> rag.GenerateContentResponse:
       """Gera resposta usando RAG"""
       model = GenerativeModel(model_name)

       response = model.generate_content(
           query,
           generation_config={
               "temperature": 0.2,
               "top_p": 0.95,
               "max_output_tokens": 8192,
           },
           tools=[
               rag.Tool(
                   retrieval=rag.Retrieval(
                       source=rag.VertexRagStore(
                           rag_resources=[
                               rag.RagResource(rag_corpus=corpus_id)
                           ],
                           similarity_top_k=10,
                       )
                   )
               )
           ]
       )

       return response
   ```

**Entregáveis:**
- ✅ RAGService implementado com funcionalidades base
- ✅ Testes unitários (>80% coverage)
- ✅ Documentação técnica
- ✅ Exemplos de uso

### Fase 2: Processamento de Documentos (2-3 semanas)

#### **Sprint 2.1: Document Processor (5-6 dias)**

**Tarefas:**

1. **Implementar chunking inteligente**
   ```python
   class SmartChunker:
       """
       Chunking que preserva estrutura semântica.
       """

       def __init__(
           self,
           chunk_size: int = 512,
           chunk_overlap: int = 100,
           preserve_sections: bool = True
       ):
           self.chunk_size = chunk_size
           self.chunk_overlap = chunk_overlap
           self.preserve_sections = preserve_sections

       def chunk_document(
           self,
           text: str,
           metadata: Dict[str, Any]
       ) -> List[DocumentChunk]:
           """
           Divide documento em chunks preservando contexto.

           Strategy:
           1. Identifica seções (títulos, numeração)
           2. Divide respeitando limites de seção
           3. Adiciona overlap para contexto
           4. Enriquece com metadata
           """
           chunks = []

           # Detecta seções
           sections = self._detect_sections(text)

           for section in sections:
               section_chunks = self._chunk_section(
                   section,
                   self.chunk_size,
                   self.chunk_overlap
               )

               for chunk in section_chunks:
                   chunk.metadata.update({
                       'section': section.title,
                       'section_number': section.number,
                       **metadata
                   })
                   chunks.append(chunk)

           return chunks
   ```

2. **Metadata Enrichment**
   ```python
   class MetadataExtractor:
       """
       Extrai metadata relevante de documentos licitatórios.
       """

       async def extract(
           self,
           document: Document
       ) -> Dict[str, Any]:
           """
           Extrai metadata estruturada:
           - Tipo de documento (edital, contrato, etc)
           - Modalidade (pregão, concorrência, etc)
           - Órgão
           - Data
           - Valor estimado
           - Objeto
           - Prazos
           """
           metadata = {}

           # Extração via regex patterns
           metadata['tipo'] = self._extract_document_type(document.content)
           metadata['modalidade'] = self._extract_modality(document.content)
           metadata['valor'] = self._extract_value(document.content)
           metadata['prazo'] = self._extract_deadline(document.content)

           # Extração via NER (Named Entity Recognition)
           entities = await self._extract_entities(document.content)
           metadata['entidades'] = entities

           return metadata
   ```

3. **Integração com GCS**
   ```python
   class GCSDocumentManager:
       """
       Gerencia documentos no Google Cloud Storage para RAG.
       """

       def __init__(self, bucket_name: str):
           self.bucket_name = bucket_name
           self.client = storage.Client()
           self.bucket = self.client.bucket(bucket_name)

       async def upload_for_rag(
           self,
           document: Document,
           organization_id: str
       ) -> str:
           """
           Upload de documento processado para GCS.

           Returns:
               GCS URI (gs://bucket/path/to/file)
           """
           # Organiza por organização
           blob_path = f"rag-corpus/{organization_id}/{document.id}.txt"
           blob = self.bucket.blob(blob_path)

           # Upload com metadata
           blob.metadata = {
               'organization_id': organization_id,
               'document_type': document.type,
               'uploaded_at': datetime.utcnow().isoformat()
           }

           blob.upload_from_string(
               document.content,
               content_type='text/plain'
           )

           return f"gs://{self.bucket_name}/{blob_path}"
   ```

**Entregáveis:**
- ✅ DocumentProcessor com chunking inteligente
- ✅ MetadataExtractor funcional
- ✅ GCSDocumentManager implementado
- ✅ Testes com documentos reais

#### **Sprint 2.2: Knowledge Base Manager (5-6 dias)**

**Tarefas:**

1. **Implementar gestão de corpus organizacionais**
   ```python
   class KnowledgeBaseManager:
       """
       Gerencia bases de conhecimento por organização.
       """

       def __init__(
           self,
           rag_service: RAGService,
           firestore_client: firestore.Client
       ):
           self.rag_service = rag_service
           self.db = firestore_client

       async def create_organization_kb(
           self,
           org_id: str,
           org_config: OrganizationConfig
       ) -> OrganizationKnowledgeBase:
           """
           Cria base de conhecimento para organização.

           Corpus incluem:
           1. Corpus privado da organização
           2. Referência ao corpus compartilhado de leis/normas
           """
           # Cria corpus privado
           private_corpus_id = await self.rag_service.create_corpus(
               corpus_name=f"org-{org_id}-private",
               display_name=f"Corpus Privado - {org_config.name}",
               description=f"Documentos privados da organização {org_config.name}"
           )

           # Salva no Firestore
           kb_ref = self.db.collection('knowledge_bases').document(org_id)
           kb_data = {
               'organization_id': org_id,
               'private_corpus_id': private_corpus_id,
               'shared_corpus_ids': ['shared-leis', 'shared-normas'],
               'created_at': firestore.SERVER_TIMESTAMP,
               'document_count': 0,
               'status': 'active'
           }
           kb_ref.set(kb_data)

           return OrganizationKnowledgeBase(**kb_data)
   ```

2. **Sistema de sincronização**
   ```python
   async def sync_organization_documents(
       self,
       org_id: str,
       force_resync: bool = False
   ) -> SyncResult:
       """
       Sincroniza documentos da organização com RAG corpus.
       """
       kb = await self.get_organization_kb(org_id)

       # Busca documentos no Firestore
       docs_ref = self.db.collection('documents').where(
           'organization_id', '==', org_id
       ).where(
           'status', '==', 'approved'
       )

       docs_to_sync = []
       async for doc in docs_ref.stream():
           doc_data = doc.to_dict()

           # Verifica se precisa sincronizar
           if force_resync or not doc_data.get('synced_to_rag'):
               docs_to_sync.append(doc_data)

       # Processa e importa
       for doc_data in docs_to_sync:
           await self._process_and_import(
               doc_data,
               kb.private_corpus_id
           )

       return SyncResult(
           total_documents=len(docs_to_sync),
           successful=len(docs_to_sync),
           failed=0
       )
   ```

3. **Base compartilhada de leis/normas**
   ```python
   async def update_shared_knowledge_base(
       self,
       base_type: str,  # 'leis', 'normas', 'jurisprudencia'
       documents: List[Document]
   ) -> UpdateResult:
       """
       Atualiza base compartilhada de conhecimento.

       Bases compartilhadas:
       - Leis federais (8.666/93, 14.133/21, etc)
       - Normas ABNT
       - Jurisprudência TCU/TCE
       """
       corpus_id = f"shared-{base_type}"

       # Verifica se corpus existe
       try:
           corpus = await self.rag_service.get_corpus(corpus_id)
       except NotFound:
           # Cria corpus compartilhado
           corpus_id = await self.rag_service.create_corpus(
               corpus_name=corpus_id,
               display_name=f"Base Compartilhada - {base_type.title()}",
               description=f"Documentos compartilhados de {base_type}"
           )

       # Processa e importa documentos
       gcs_uris = []
       for doc in documents:
           # Upload para GCS
           uri = await self.gcs_manager.upload_for_rag(
               doc,
               organization_id="shared"
           )
           gcs_uris.append(uri)

       # Importa para RAG
       await self.rag_service.import_files(
           corpus_id=corpus_id,
           source_uris=gcs_uris
       )

       return UpdateResult(
           base_type=base_type,
           documents_added=len(documents),
           corpus_id=corpus_id
       )
   ```

**Entregáveis:**
- ✅ KnowledgeBaseManager completo
- ✅ Sistema de sincronização funcionando
- ✅ Base compartilhada implementada
- ✅ Admin UI para gerenciar corpus

### Fase 3: Integração com Análise Existente (2-3 semanas)

#### **Sprint 3.1: RAG-Enhanced Analyzer (5-7 dias)**

**Tarefas:**

1. **Estender AdaptiveAnalyzer**
   ```python
   # services/analyzer/src/services/adaptive_analyzer.py

   class AdaptiveAnalyzer:
       def __init__(
           self,
           doc_type: str,
           org_config: OrganizationConfig,
           rag_service: Optional[RAGService] = None,  # NOVO
           kb_manager: Optional[KnowledgeBaseManager] = None  # NOVO
       ):
           self.doc_type = doc_type
           self.org_config = org_config
           self.rag_service = rag_service  # NOVO
           self.kb_manager = kb_manager  # NOVO
           self.use_rag = rag_service is not None  # NOVO

       async def analyze_with_custom_params(
           self,
           document: Document
       ) -> AnalysisResult:
           """
           Análise aprimorada com RAG.
           """
           # Análise tradicional
           traditional_result = await self._traditional_analysis(document)

           # Análise com RAG (se habilitado)
           if self.use_rag:
               rag_insights = await self._rag_enhanced_analysis(document)
               # Combina resultados
               enhanced_result = self._merge_results(
                   traditional_result,
                   rag_insights
               )
               return enhanced_result

           return traditional_result
   ```

2. **Análise RAG por categoria**
   ```python
   async def _rag_enhanced_analysis(
       self,
       document: Document
   ) -> RAGInsights:
       """
       Análise enriquecida com contexto do RAG.
       """
       insights = RAGInsights()

       # Obtém corpus da organização
       kb = await self.kb_manager.get_organization_kb(
           self.org_config.organization_id
       )

       # Análise Legal com RAG
       legal_insights = await self._analyze_legal_with_rag(
           document,
           kb.all_corpus_ids
       )
       insights.legal = legal_insights

       # Análise Estrutural com RAG
       structural_insights = await self._analyze_structure_with_rag(
           document,
           kb.private_corpus_id
       )
       insights.structural = structural_insights

       # Conformidade com templates
       conformity_insights = await self._check_conformity_with_rag(
           document,
           kb.private_corpus_id
       )
       insights.conformity = conformity_insights

       return insights
   ```

3. **Citação de fontes**
   ```python
   async def _analyze_legal_with_rag(
       self,
       document: Document,
       corpus_ids: List[str]
   ) -> LegalInsights:
       """
       Análise legal fundamentada em documentos.
       """
       # Query para análise legal
       query = f"""
       Analise os aspectos legais do seguinte trecho de edital:

       {document.content[:2000]}

       Verifique:
       1. Conformidade com Lei 14.133/21
       2. Conformidade com Lei 8.666/93 (se aplicável)
       3. Requisitos de habilitação adequados
       4. Prazos conforme legislação

       Cite os artigos e documentos específicos usados na análise.
       """

       # Gera com RAG
       response = await self.rag_service.generate_with_rag(
           corpus_id=corpus_ids[0],  # Corpus de leis
           query=query,
           model_name="gemini-2.0-flash-001"
       )

       # Extrai insights e citações
       insights = LegalInsights(
           analysis_text=response.text,
           sources=self._extract_sources(response),
           confidence=0.95,  # Alta confiança por ser fundamentado
           cited_laws=self._extract_cited_laws(response.text),
           recommendations=self._extract_recommendations(response.text)
       )

       return insights
   ```

**Entregáveis:**
- ✅ AdaptiveAnalyzer com suporte RAG
- ✅ Análise legal fundamentada
- ✅ Sistema de citação de fontes
- ✅ Testes A/B (com/sem RAG)

#### **Sprint 3.2: Nova Feature - Consultas Inteligentes (5-7 dias)**

**Tarefas:**

1. **Endpoint de consulta**
   ```python
   # services/api/src/routes/intelligent_query.ts

   router.post('/api/v1/query', async (req, res) => {
       const { question, organizationId, contextType } = req.body;

       // Chama analyzer service
       const result = await analyzerService.intelligentQuery({
           question,
           organizationId,
           contextType  // 'legal', 'templates', 'all'
       });

       res.json(result);
   });
   ```

2. **Implementação no Python**
   ```python
   # services/analyzer/src/services/query_service.py

   class IntelligentQueryService:
       """
       Serviço de consultas inteligentes com RAG.
       """

       async def answer_question(
           self,
           question: str,
           org_id: str,
           context_type: str = 'all'
       ) -> QueryResponse:
           """
           Responde pergunta usando base de conhecimento.
           """
           # Obtém corpus relevantes
           kb = await self.kb_manager.get_organization_kb(org_id)
           corpus_ids = self._select_corpus_by_context(
               kb,
               context_type
           )

           # Recupera contextos
           contexts = await self.rag_service.retrieve_contexts(
               corpus_id=corpus_ids[0],
               query=question,
               similarity_top_k=5
           )

           # Gera resposta fundamentada
           response = await self.rag_service.generate_with_rag(
               corpus_id=corpus_ids[0],
               query=self._build_query_prompt(question, contexts)
           )

           return QueryResponse(
               answer=response.text,
               sources=[
                   Source(
                       title=ctx.source.title,
                       excerpt=ctx.text,
                       relevance_score=ctx.distance
                   )
                   for ctx in contexts
               ],
               confidence=self._calculate_confidence(contexts)
           )
   ```

3. **UI Component (React)**
   ```typescript
   // apps/web/src/components/IntelligentQuery.tsx

   export function IntelligentQuery() {
       const [question, setQuestion] = useState('');
       const [response, setResponse] = useState<QueryResponse | null>(null);
       const [loading, setLoading] = useState(false);

       const handleAsk = async () => {
           setLoading(true);
           try {
               const result = await api.post('/api/v1/query', {
                   question,
                   organizationId: currentOrg.id,
                   contextType: 'all'
               });
               setResponse(result.data);
           } finally {
               setLoading(false);
           }
       };

       return (
           <div className="intelligent-query">
               <Input
                   placeholder="Pergunte algo sobre licitações..."
                   value={question}
                   onChange={(e) => setQuestion(e.target.value)}
               />
               <Button onClick={handleAsk} disabled={loading}>
                   {loading ? 'Pensando...' : 'Perguntar'}
               </Button>

               {response && (
                   <div className="response">
                       <div className="answer">
                           {response.answer}
                       </div>
                       <div className="sources">
                           <h4>Fontes:</h4>
                           {response.sources.map((source, idx) => (
                               <SourceCard key={idx} source={source} />
                           ))}
                       </div>
                   </div>
               )}
           </div>
       );
   }
   ```

**Entregáveis:**
- ✅ Feature de consultas inteligentes
- ✅ API endpoint implementado
- ✅ UI component no frontend
- ✅ Documentação de uso

### Fase 4: Otimização e Produção (2-3 semanas)

#### **Sprint 4.1: Performance e Cache (3-5 dias)**

**Tarefas:**

1. **Cache de embeddings**
2. **Cache de retrieval results**
3. **Batch processing para importação**
4. **Monitoramento de latência**

#### **Sprint 4.2: Testes e QA (5-7 dias)**

**Tarefas:**

1. **Testes de integração completos**
2. **Testes de performance/carga**
3. **Validação com usuários beta**
4. **Ajustes baseados em feedback**

#### **Sprint 4.3: Deploy e Documentação (3-4 dias)**

**Tarefas:**

1. **Deploy em produção**
2. **Documentação completa**
3. **Treinamento de usuários**
4. **Monitoramento pós-deploy**

---

## ⏱️ Estimativas e Cronograma

### Resumo por Fase

| Fase | Duração | Sprints | Esforço Total |
|------|---------|---------|---------------|
| **Fase 1: Setup e Infraestrutura** | 1-2 semanas | 2 | 8-10 dias |
| **Fase 2: Processamento de Documentos** | 2-3 semanas | 2 | 10-12 dias |
| **Fase 3: Integração com Análise** | 2-3 semanas | 2 | 10-14 dias |
| **Fase 4: Otimização e Produção** | 2-3 semanas | 3 | 11-16 dias |
| **TOTAL** | **7-11 semanas** | **9 sprints** | **39-52 dias** |

### Cronograma Detalhado

```
Semana 1-2: Fase 1 - Setup e Infraestrutura
├── Sprint 1.1: Configuração GCP [3-4 dias]
└── Sprint 1.2: RAGService Base [4-5 dias]

Semana 3-5: Fase 2 - Processamento de Documentos
├── Sprint 2.1: Document Processor [5-6 dias]
└── Sprint 2.2: Knowledge Base Manager [5-6 dias]

Semana 6-8: Fase 3 - Integração
├── Sprint 3.1: RAG-Enhanced Analyzer [5-7 dias]
└── Sprint 3.2: Consultas Inteligentes [5-7 dias]

Semana 9-11: Fase 4 - Otimização e Produção
├── Sprint 4.1: Performance e Cache [3-5 dias]
├── Sprint 4.2: Testes e QA [5-7 dias]
└── Sprint 4.3: Deploy e Docs [3-4 dias]
```

### Equipe Recomendada

| Papel | Dedicação | Justificativa |
|-------|-----------|---------------|
| **Backend Developer (Python)** | Full-time | Implementação dos serviços RAG |
| **Backend Developer (Node.js/TS)** | Part-time (50%) | Integração com Cloud Functions |
| **Frontend Developer** | Part-time (30%) | UI components para features RAG |
| **DevOps Engineer** | Part-time (30%) | Setup GCP, deploy, monitoramento |
| **Tech Lead / Architect** | Part-time (20%) | Revisão técnica, decisões arquiteturais |

---

## 💰 Custos e Orçamento

### Estimativa de Custos GCP

#### **Cenário: 100 Organizações, 10.000 documentos totais**

**Assumptions:**
- Média de 100 documentos por organização
- Documento médio: 10 páginas, ~5.000 tokens
- 50 chunks por documento (512 tokens cada)
- 1.000 queries por dia
- Retenção de 1 ano

#### **1. Custos de Setup e Ingestão**

| Item | Cálculo | Custo |
|------|---------|-------|
| **Embeddings (Ingestão)** | 10K docs × 50 chunks × 512 tokens × $0.000025/K tokens | $64.00 |
| **Storage (GCS)** | 10K docs × 50KB × $0.020/GB/mês × 12 meses | $120.00 |
| **Spanner (Vector DB)** | ~5GB × $0.30/GB/mês × 12 meses | $216.00 |
| **Subtotal Setup (Ano 1)** | | **$400.00** |

#### **2. Custos Operacionais (Mensal)**

| Item | Cálculo | Custo Mensal |
|------|---------|--------------|
| **Query Embeddings** | 1K queries/dia × 30 dias × 100 tokens × $0.000025/K | $0.75 |
| **Vector Search** | Incluído no Spanner | - |
| **Gemini Generation** | 1K queries/dia × 30 dias × 1K tokens output × $0.0001875/K | $5.63 |
| **Spanner Storage** | 5GB × $0.30/GB | $1.50 |
| **GCS Storage** | ~0.5GB × $0.020/GB | $0.01 |
| **Grounding (Opcional)** | 30K queries × $0.0025/K | $75.00 (se usado) |
| **Subtotal Operacional** | | **$7.89/mês** |
| | | **$94.68/ano** (sem grounding) |

#### **3. Custo Total Ano 1**

```
Setup (Ano 1)        : $400.00
Operacional (Ano 1)  : $94.68
─────────────────────────────
TOTAL ANO 1          : $494.68

Custo por Organização: $4.95/ano
Custo por Documento  : $0.05/ano
```

#### **4. Escalabilidade de Custos**

| Escala | Documentos | Organizações | Custo Mensal | Custo/Org/Mês |
|--------|------------|--------------|--------------|---------------|
| **Pequena** | 1.000 | 10 | $1.50 | $0.15 |
| **Média** | 10.000 | 100 | $7.89 | $0.08 |
| **Grande** | 100.000 | 1.000 | $52.00 | $0.05 |
| **Enterprise** | 1.000.000 | 10.000 | $380.00 | $0.038 |

### Comparação com Alternativas

| Solução | Setup | Operacional/Mês | Manutenção | Total Ano 1 |
|---------|-------|-----------------|------------|-------------|
| **Vertex AI RAG** | $400 | $8 | Baixa | ~$500 |
| **Pinecone** | $0 | $70 | Média | ~$840 |
| **Self-Hosted (Weaviate)** | $200 | $150 | Alta | ~$2.000 |
| **OpenAI + Pinecone** | $0 | $200 | Média | ~$2.400 |

**Conclusão**: Vertex AI RAG oferece melhor custo-benefício considerando:
- ✅ Menor custo operacional
- ✅ Zero manutenção de infraestrutura
- ✅ Integração nativa com GCP
- ✅ Escalabilidade automática

---

## ⚠️ Riscos e Mitigação

### Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Latência alta em queries** | Média | Alto | Cache agressivo, otimização de embeddings, pre-fetching |
| **Qualidade dos embeddings** | Baixa | Alto | Testes extensivos, ajuste de modelos, validação contínua |
| **Quotas GCP insuficientes** | Baixa | Médio | Monitoramento proativo, solicitação antecipada de aumentos |
| **Complexidade de integração** | Média | Médio | Arquitetura modular, testes progressivos, feature flags |
| **Custos acima do previsto** | Média | Médio | Monitoramento de custos, alertas, otimização contínua |

### Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Adoção baixa pelos usuários** | Baixa | Alto | Treinamento, documentação clara, valor demonstrável |
| **Resistência à IA** | Média | Médio | Transparência, explicabilidade, opção de desabilitar |
| **Problemas de privacidade** | Baixa | Alto | Compliance GCP, dados no Brasil, políticas claras |
| **Concorrência** | Média | Médio | Diferencial técnico, integração profunda, customização |

### Plano de Contingência

1. **Se latência for inaceitável**:
   - Implementar cache Redis
   - Usar modelos menores para casos simples
   - Pre-computar embeddings comuns

2. **Se custos escalarem demais**:
   - Implementar throttling
   - Usar tiers de serviço
   - Otimizar chunk size
   - Reduzir top_k em queries

3. **Se integração falhar**:
   - Rollback para versão anterior
   - Feature flag para desabilitar RAG
   - Modo degradado (só análise tradicional)

---

## 📊 Métricas de Sucesso

### KPIs Técnicos

| Métrica | Baseline | Target | Medição |
|---------|----------|--------|---------|
| **Latência P95 de Query** | N/A | <2s | Monitoring |
| **Taxa de Erro** | N/A | <1% | Error tracking |
| **Coverage de Testes** | 70% | >85% | CI/CD |
| **Tempo de Ingestão** | N/A | <5min para 100 docs | Benchmarks |

### KPIs de Produto

| Métrica | Baseline | Target (3 meses) | Medição |
|---------|----------|------------------|---------|
| **Precisão de Análise** | 75% | 90%+ | Validação manual |
| **Satisfação do Usuário** | N/A | 4.5/5 | Surveys |
| **Adoção da Feature** | 0% | 60% dos usuários | Analytics |
| **Queries por Usuário/Mês** | N/A | 20+ | Usage tracking |

### KPIs de Negócio

| Métrica | Baseline | Target (6 meses) | Impacto |
|---------|----------|------------------|---------|
| **Tempo de Análise** | 30min | 15min (-50%) | Eficiência |
| **Retrabalho** | 20% | 5% (-75%) | Qualidade |
| **Custos de Revisão** | $X | $X/2 (-50%) | ROI |
| **NPS** | N/A | 50+ | Satisfação |

### Validação de Sucesso

**Critérios para Go-Live:**

✅ Todos os testes passando (>90% coverage)
✅ Latência P95 < 2 segundos
✅ Taxa de erro < 1%
✅ Validação com 10+ organizações beta
✅ Documentação completa
✅ Aprovação do Tech Lead
✅ Monitoramento configurado

**Critérios para considerar sucesso (3 meses pós-launch):**

✅ Adoção por 60%+ dos usuários ativos
✅ Precisão de análise > 90%
✅ NPS > 45
✅ Tempo de análise reduzido em 40%+
✅ Custos dentro do orçado

---

## 📚 Referências e Recursos

### Documentação Oficial

1. **Vertex AI RAG Engine Overview**
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview

2. **RAG Engine API Reference**
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/rag-api

3. **RAG Quickstart Guide**
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-quickstart

4. **Vertex AI Quotas and Limits**
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/quotas

5. **RAG Engine Billing**
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-engine-billing

### Artigos e Tutoriais

6. **Building Vertex AI RAG Engine with Gemini 2 Flash**
   https://medium.com/google-cloud/building-vertex-ai-rag-engine-with-gemini-2-flash-llm

7. **Build a RAG Agent using Google ADK**
   https://medium.com/google-cloud/build-a-rag-agent-using-google-adk-and-vertex-ai-rag-engine

8. **RAG Systems Best Practices**
   https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval

9. **Building Google-quality Search System**
   https://codelabs.developers.google.com/build-google-quality-rag

### Repositórios de Exemplo

10. **adk-vertex-ai-rag-engine**
    https://github.com/arjunprabhulal/adk-vertex-ai-rag-engine

11. **Google Cloud Applied AI Samples**
    https://googlecloudplatform.github.io/applied-ai-engineering-samples

### Python Packages

```bash
# Principais dependências
google-cloud-aiplatform==1.70.0
google-cloud-storage==2.18.2
vertexai>=1.60.0
```

---

## 🎯 Próximos Passos

### Imediato (Esta Semana)

1. ✅ **Aprovar este plano** com stakeholders
2. ⏳ **Alocar recursos** (desenvolvedores, budget GCP)
3. ⏳ **Setup inicial** do ambiente GCP
4. ⏳ **Criar projeto piloto** com 1-2 organizações

### Curto Prazo (Próximo Mês)

1. ⏳ **Implementar Fase 1** completa
2. ⏳ **POC funcional** com RAGService
3. ⏳ **Validação técnica** com documentos reais
4. ⏳ **Apresentar resultados** iniciais

### Médio Prazo (3 Meses)

1. ⏳ **Completar implementação** (Fases 1-4)
2. ⏳ **Beta testing** com usuários selecionados
3. ⏳ **Otimização** baseada em feedback
4. ⏳ **Go-live** em produção

### Longo Prazo (6 Meses)

1. ⏳ **Expansão** para todas organizações
2. ⏳ **Features avançadas** (reranking, grounding)
3. ⏳ **Análise de ROI** detalhada
4. ⏳ **Roadmap** de melhorias contínuas

---

## 📞 Contato e Suporte

**Equipe Responsável:**

- **Tech Lead**: [Nome]
- **Backend Lead**: [Nome]
- **DevOps Lead**: [Nome]

**Canais de Comunicação:**

- Slack: #licitareview-rag-implementation
- Email: dev@licitareview.com
- Meetings: Segundas 10h (Sprint Planning)

---

## ✅ Aprovações

| Stakeholder | Papel | Status | Data |
|-------------|-------|--------|------|
| [Nome] | Product Owner | ⏳ Pendente | - |
| [Nome] | Tech Lead | ⏳ Pendente | - |
| [Nome] | CTO | ⏳ Pendente | - |
| [Nome] | Finance | ⏳ Pendente | - |

---

**Documento criado em**: 20 de Novembro de 2025
**Última atualização**: 20 de Novembro de 2025
**Versão**: 1.0
**Status**: 🟡 Aguardando Aprovação
