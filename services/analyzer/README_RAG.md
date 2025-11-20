# Vertex AI RAG Implementation

## 🎯 Overview

Implementação completa do Vertex AI RAG Engine no LicitaReview, fornecendo análise de documentos licitatórios fundamentada em base de conhecimento organizacional.

## 📦 Componentes Implementados

### Serviços Core (Python)

1. **RAGService** (`src/services/rag_service.py`)
   - Gerenciamento de corpus RAG
   - Importação de documentos
   - Retrieval de contextos
   - Geração com RAG

2. **DocumentProcessor** (`src/services/document_processor.py`)
   - Chunking inteligente (512 tokens)
   - Extração de metadata
   - Upload para GCS

3. **KnowledgeBaseManager** (`src/services/knowledge_base_manager.py`)
   - Corpus por organização
   - Base compartilhada (leis/normas)
   - Sincronização automática

4. **QueryService** (`src/services/query_service.py`)
   - Consultas inteligentes
   - Q&A fundamentado
   - Citação de fontes

5. **RAGEnhancedAnalyzer** (`src/services/rag_enhanced_analyzer.py`)
   - Análise tradicional + RAG
   - Insights legais, estruturais e de conformidade
   - Merge de resultados

6. **CacheService** (`src/services/cache_service.py`)
   - Cache Redis
   - Fallback em memória
   - TTL configurável

### Componentes UI (React/TypeScript)

1. **IntelligentQuery** (`apps/web/src/components/IntelligentQuery.tsx`)
   - Interface de consultas
   - Seletor de contexto
   - Exibição de fontes

### Configuração

1. **config_rag.py** - Configurações centralizadas
2. **requirements.txt** - Dependências atualizadas

### Modelos de Dados

1. **rag_models.py** - Modelos completos para RAG

## 🚀 Setup Rápido

### 1. Instalar Dependências

```bash
cd services/analyzer
pip install -r requirements.txt
```

### 2. Configurar GCP

```bash
# Habilitar APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable storage-component.googleapis.com

# Configurar credenciais
export GOOGLE_APPLICATION_CREDENTIALS="credentials/licitareview-prod.json"
```

### 3. Variáveis de Ambiente

```bash
# .env
GCP_PROJECT_ID=licitareview-prod
GCP_LOCATION=us-central1
GCS_RAG_BUCKET=licitareview-rag-corpus
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Inicializar Serviços

```python
from src.services.rag_service import RAGService
from src.services.knowledge_base_manager import KnowledgeBaseManager
from src.config_rag import init_rag_config

# Inicializar config
config = init_rag_config(
    project_id="licitareview-prod",
    location="us-central1"
)

# Criar serviços
rag_service = RAGService()
await rag_service.initialize()

kb_manager = KnowledgeBaseManager(rag_service)
```

## 📖 Uso

### Criar Base de Conhecimento Organizacional

```python
from src.models.config_models import OrganizationConfig

# Configuração da organização
org_config = OrganizationConfig(
    organization_id="org-123",
    name="Prefeitura Municipal",
    # ... outros campos
)

# Criar knowledge base
kb = await kb_manager.create_organization_kb(
    org_id="org-123",
    org_config=org_config
)

print(f"KB criada: {kb.private_corpus_id}")
```

### Sincronizar Documentos

```python
# Sincronizar documentos aprovados
result = await kb_manager.sync_organization_documents(
    org_id="org-123",
    force_resync=False
)

print(f"Sincronizados: {result.successful} documentos")
```

### Consulta Inteligente

```python
from src.services.query_service import IntelligentQueryService
from src.models.rag_models import ContextType

query_service = IntelligentQueryService(rag_service, kb_manager)

# Fazer pergunta
response = await query_service.answer_question(
    question="Quais são os requisitos de habilitação para pregão eletrônico?",
    org_id="org-123",
    context_type=ContextType.LEGAL
)

print(f"Resposta: {response.answer}")
print(f"Fontes: {len(response.sources)}")
print(f"Confiança: {response.confidence:.2%}")
```

### Análise RAG-Enhanced

```python
from src.services.rag_enhanced_analyzer import RAGEnhancedAnalyzer
from src.models.document_models import Document

# Criar analisador
analyzer = RAGEnhancedAnalyzer(
    doc_type="edital",
    org_config=org_config,
    rag_service=rag_service,
    kb_manager=kb_manager,
    use_rag=True
)

# Analisar documento
document = Document(
    id="doc-456",
    title="Edital Pregão 001/2025",
    content="..."
)

result = await analyzer.analyze_with_custom_params(document)

print(f"Score: {result.weighted_score}")
print(f"Findings: {len(result.findings)}")
print(f"Fontes RAG: {result.analysis_metadata.get('rag_sources', 0)}")
```

## 🧪 Testes

```bash
# Rodar testes
pytest services/analyzer/tests/test_rag_service.py -v

# Com coverage
pytest services/analyzer/tests/ --cov=src --cov-report=html
```

## 📊 Monitoramento

### Métricas Importantes

- **Latência de Retrieval**: <2s P95
- **Taxa de Erro**: <1%
- **Cache Hit Rate**: >60%
- **Custos Mensais**: ~$8 para 100 orgs

### Logs

Todos os serviços usam structlog para logging estruturado:

```python
self.logger.info(
    "Processing document",
    document_id=doc.id,
    org_id=org_id
)
```

## 💰 Custos

**Cenário: 100 Organizações, 10.000 Documentos**

- Setup (Ano 1): $400
- Operacional (Mensal): $8
- **Total Ano 1**: ~$500

Ver `VERTEX_AI_RAG_IMPLEMENTATION_PLAN.md` para detalhes.

## 🔧 Troubleshooting

### Erro: "RAG Service not initialized"

```python
await rag_service.initialize()
```

### Erro: "Corpus not found"

Verificar se corpus existe:
```python
corpus = await rag_service.get_corpus(corpus_id)
if not corpus:
    # Criar corpus
    ```

### Cache não funcionando

Verificar Redis:
```bash
redis-cli ping
```

## 📚 Referências

- [Vertex AI RAG Engine Overview](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview)
- [RAG Engine API Reference](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/model-reference/rag-api)
- [Plano de Implementação Completo](../../VERTEX_AI_RAG_IMPLEMENTATION_PLAN.md)

## ✅ Status

- [x] Fase 1: Setup e Infraestrutura
- [x] Fase 2: Processamento de Documentos
- [x] Fase 3: Integração com Análise
- [x] Fase 4: Otimização e Produção

**Status**: ✅ 100% Implementado

---

**Última atualização**: 20 de Novembro de 2025
