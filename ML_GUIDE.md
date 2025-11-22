# 🧠 AI/ML Guide - LicitaReview

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura AI/ML](#arquitetura-aiml)
3. [RAG (Retrieval-Augmented Generation)](#rag-retrieval-augmented-generation)
4. [A/B Testing de Modelos](#ab-testing-de-modelos)
5. [Analytics e Métricas](#analytics-e-métricas)
6. [User Feedback Loop](#user-feedback-loop)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O LicitaReview utiliza técnicas avançadas de AI/ML para análise inteligente de editais de licitação:

- **Modelo Principal**: Google Gemini 2.0 Flash
- **RAG Engine**: Vertex AI RAG para contexto específico
- **A/B Testing**: Experimentação contínua de modelos
- **Feedback Loop**: Melhoria contínua baseada em feedback real

### Stack AI/ML

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│              User Feedback UI Components                │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   API Layer (FastAPI)                   │
│  /api/experiments  │  /api/analytics  │  /api/feedback  │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   ML Core Components                    │
│  ABTestManager  │  RAGEnhancements  │  MetricsStore    │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Google Cloud AI Services                │
│  Vertex AI RAG  │  Gemini Models  │  Embeddings API    │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura AI/ML

### Componentes Principais

#### 1. RAG Engine

**Localização**: `services/analyzer/src/services/rag_service.py`

```python
from src.services.rag_service import RAGService

# Inicializar RAG
rag = RAGService(project_id="your-project", location="us-central1")

# Criar corpus para organização
corpus_id = await rag.create_corpus(
    organization_id="org-123",
    display_name="Editais Ministério X"
)

# Importar documentos
await rag.import_documents(
    corpus_id=corpus_id,
    documents=document_list
)

# Query
response = await rag.query(
    corpus_id=corpus_id,
    query="Qual o prazo de entrega?"
)
```

#### 2. A/B Testing Manager

**Localização**: `services/analyzer/src/ml/ab_testing.py`

```python
from src.ml.ab_testing import ABTestManager, ModelVariant

# Criar manager
manager = ABTestManager()

# Criar experimento
experiment = manager.create_experiment(
    experiment_id="exp-gemini-pro-test",
    name="Test Gemini Pro",
    description="Testing Gemini Pro vs Flash",
    model_variant=ModelVariant.GEMINI_PRO,
    temperature=0.15,
    traffic_percentage=0.3,  # 30% do tráfego
)

# Selecionar variante para usuário
variant = manager.select_variant(user_id="user-123")

# Registrar resultado
manager.record_result(
    experiment_id=variant.experiment_id,
    latency_ms=1250.5,
    tokens_used=850,
    success=True
)

# Registrar feedback
manager.record_feedback(
    experiment_id=variant.experiment_id,
    is_positive=True,
    rating=4.5
)

# Comparar experimentos
comparison = manager.compare_experiments(
    "control-gemini-flash",
    "exp-gemini-pro-test"
)
print(f"Winner: {comparison['comparison']['winner']}")
```

#### 3. RAG Enhancements

**Localização**: `services/analyzer/src/ml/rag_enhancements.py`

##### Adaptive Chunking

```python
from src.ml.rag_enhancements import AdaptiveChunker, ChunkingStrategy

chunker = AdaptiveChunker()

# Chunking adaptativo por tipo de documento
chunks = chunker.chunk_document(
    text=edital_text,
    document_id="doc-123",
    document_type="edital",  # ou "contrato", "lei"
    strategy=ChunkingStrategy.ADAPTIVE
)

# Cada chunk tem metadata enriquecida
for chunk in chunks:
    print(f"Chunk {chunk.metadata.chunk_index}")
    print(f"  Section: {chunk.metadata.section}")
    print(f"  Has values: {chunk.metadata.has_values}")
    print(f"  Completeness: {chunk.metadata.completeness_score}")
    print(f"  Topics: {chunk.metadata.main_topics}")
```

##### Query Expansion

```python
from src.ml.rag_enhancements import QueryExpander, QueryExpansionMethod

expander = QueryExpander()

# Expandir query com sinônimos e termos relacionados
expanded_queries = expander.expand_query(
    query="Prazo de licitação",
    methods=[
        QueryExpansionMethod.SYNONYMS,
        QueryExpansionMethod.LEGAL_TERMS,
        QueryExpansionMethod.ACRONYMS,
    ]
)

# Resultado:
# [
#   "Prazo de licitação",
#   "Prazo de certame",
#   "Prazo de processo licitatório",
#   "Período de licitação",
# ]
```

##### Semantic Deduplication

```python
from src.ml.rag_enhancements import SemanticDeduplicator

dedup = SemanticDeduplicator(similarity_threshold=0.95)

# Remover chunks duplicados
unique_chunks, removed_indices = dedup.deduplicate(
    chunks=all_chunks,
    embeddings=all_embeddings
)

print(f"Removed {len(removed_indices)} duplicate chunks")
print(f"Kept {len(unique_chunks)} unique chunks")
```

##### Citation Quality Scoring

```python
from src.ml.rag_enhancements import CitationQualityScorer

scorer = CitationQualityScorer()

# Avaliar qualidade da citação
scores = scorer.score_citation(
    citation_text=retrieved_chunk.text,
    query=user_query,
    metadata=retrieved_chunk.metadata
)

print(f"Relevance: {scores['relevance']:.2f}")
print(f"Completeness: {scores['completeness']:.2f}")
print(f"Specificity: {scores['specificity']:.2f}")
print(f"Verifiability: {scores['verifiability']:.2f}")
print(f"Total Score: {scores['total']:.2f}")
```

---

## 🔍 RAG (Retrieval-Augmented Generation)

### Configuração Atual

**Arquivo**: `services/analyzer/src/config_rag.py`

```python
RAG_CONFIG = {
    'model': 'gemini-2.0-flash-001',
    'temperature': 0.2,
    'chunk_size': 512,
    'chunk_overlap': 100,
    'embedding_model': 'text-embedding-004',
    'similarity_top_k': 10,
    'vector_threshold': 0.5,
}
```

### Estratégias de Retrieval

#### 1. Standard (Padrão)

```python
retrieval_strategy = RetrievalStrategy.STANDARD
```

- Top-K similarity search
- Threshold de similaridade: 0.5
- Rápido e eficiente

#### 2. Reranked (Reordenação)

```python
retrieval_strategy = RetrievalStrategy.RERANKED
```

- Retrieve top-K * 2
- Reranking com modelo cross-encoder
- Maior qualidade, mais lento

#### 3. Hybrid (Híbrido)

```python
retrieval_strategy = RetrievalStrategy.HYBRID
```

- Combine semantic + keyword search
- BM25 + Vector similarity
- Melhor recall

#### 4. MMR (Maximum Marginal Relevance)

```python
retrieval_strategy = RetrievalStrategy.MMR
```

- Diversidade de resultados
- Evita redundância
- Melhor cobertura de tópicos

### Pipeline RAG Completo

```python
from src.services.rag_service import RAGService
from src.ml.rag_enhancements import (
    AdaptiveChunker,
    QueryExpander,
    SemanticDeduplicator,
    CitationQualityScorer
)

# 1. Chunking Inteligente
chunker = AdaptiveChunker()
chunks = chunker.chunk_document(
    text=document.content,
    document_id=document.id,
    document_type="edital",
    strategy=ChunkingStrategy.ADAPTIVE
)

# 2. Deduplicação
dedup = SemanticDeduplicator(similarity_threshold=0.95)
unique_chunks, _ = dedup.deduplicate(chunks, embeddings)

# 3. Importar para RAG
rag = RAGService(project_id=PROJECT_ID)
await rag.import_documents(corpus_id, unique_chunks)

# 4. Query com expansão
expander = QueryExpander()
expanded_queries = expander.expand_query(user_query)

# 5. Retrieve com melhor query
results = await rag.query(
    corpus_id=corpus_id,
    query=expanded_queries[0],  # Usar query expandida
    top_k=10
)

# 6. Score de qualidade das citações
scorer = CitationQualityScorer()
for result in results:
    scores = scorer.score_citation(
        citation_text=result.text,
        query=user_query,
        metadata=result.metadata
    )
    result.quality_score = scores['total']

# 7. Filtrar por qualidade
high_quality_results = [
    r for r in results
    if r.quality_score >= 0.6
]
```

---

## 🧪 A/B Testing de Modelos

### Conceitos

**A/B Testing** permite comparar diferentes modelos, configurações e estratégias
de forma científica com tráfego real.

### Criando Experimentos

#### Via API

```bash
curl -X POST "http://localhost:8080/api/experiments/" \
  -H "Content-Type: application/json" \
  -d '{
    "experiment_id": "exp-gemini-pro-2024",
    "name": "Gemini Pro - High Quality",
    "description": "Testing Gemini Pro with reranking for higher quality",
    "model_variant": "gemini-1.5-pro-002",
    "temperature": 0.15,
    "retrieval_strategy": "reranked",
    "enable_reranking": true,
    "similarity_top_k": 15,
    "traffic_percentage": 0.2
  }'
```

#### Via Python

```python
from src.api.experiments import ab_test_manager

experiment = ab_test_manager.create_experiment(
    experiment_id="exp-gemini-pro-2024",
    name="Gemini Pro - High Quality",
    description="Testing Gemini Pro with reranking",
    model_variant=ModelVariant.GEMINI_PRO,
    temperature=0.15,
    retrieval_strategy=RetrievalStrategy.RERANKED,
    enable_reranking=True,
    similarity_top_k=15,
    traffic_percentage=0.2,  # 20% do tráfego
    is_active=True
)
```

### Distribuição de Tráfego

```python
# Configurar múltiplos experimentos
experiments = [
    ("control-flash", 0.5),      # 50% - Controle
    ("exp-pro-reranked", 0.3),   # 30% - Gemini Pro
    ("exp-flash-structured", 0.2) # 20% - Flash Estruturado
]

# Total deve somar 1.0 (100%)
```

### Seleção de Variantes

```python
# Seleção aleatória (novo usuário)
variant = ab_test_manager.select_variant()

# Seleção consistente (mesmo usuário sempre vê mesma variante)
variant = ab_test_manager.select_variant(user_id="user-123")
```

### Coleta de Métricas

```python
import time

# Início da análise
start_time = time.time()

# Executar análise com variante selecionada
result = await analyze_document(
    document=doc,
    model_variant=variant.model_variant,
    temperature=variant.temperature,
    retrieval_strategy=variant.retrieval_strategy
)

# Fim da análise
latency_ms = (time.time() - start_time) * 1000

# Registrar resultado
ab_test_manager.record_result(
    experiment_id=variant.experiment_id,
    latency_ms=latency_ms,
    tokens_used=result.tokens_used,
    success=result.success
)
```

### Análise de Resultados

```python
# Comparar dois experimentos
comparison = ab_test_manager.compare_experiments(
    "control-flash",
    "exp-pro-reranked"
)

print("=== Comparison ===")
print(f"Control: {comparison['experiment_a']['name']}")
print(f"  Success Rate: {comparison['experiment_a']['success_rate']:.1f}%")
print(f"  Avg Latency: {comparison['experiment_a']['avg_latency_ms']:.0f}ms")
print(f"  Feedback Score: {comparison['experiment_a']['feedback_score']:.1f}%")

print(f"\nVariant: {comparison['experiment_b']['name']}")
print(f"  Success Rate: {comparison['experiment_b']['success_rate']:.1f}%")
print(f"  Avg Latency: {comparison['experiment_b']['avg_latency_ms']:.0f}ms")
print(f"  Feedback Score: {comparison['experiment_b']['feedback_score']:.1f}%")

print(f"\n🏆 Winner: {comparison['comparison']['winner']}")
print(f"Success Rate Diff: {comparison['comparison']['success_rate_diff']:+.1f}%")
print(f"Latency Diff: {comparison['comparison']['latency_diff_ms']:+.0f}ms")
print(f"Feedback Diff: {comparison['comparison']['feedback_diff']:+.1f}%")
```

### Critérios para Determinar Vencedor

O algoritmo usa **weighted scoring**:

- **Feedback Score**: 50% (mais importante)
- **Success Rate**: 30%
- **Latency**: 20% (menor é melhor)

```python
def _determine_winner(exp_a, exp_b):
    # Normalizar métricas
    feedback_a = exp_a.get_feedback_score() / 100
    feedback_b = exp_b.get_feedback_score() / 100

    success_a = exp_a.get_success_rate() / 100
    success_b = exp_b.get_success_rate() / 100

    # Latency (inverter - menor é melhor)
    max_latency = max(exp_a.avg_latency_ms, exp_b.avg_latency_ms)
    latency_a = 1 - (exp_a.avg_latency_ms / max_latency)
    latency_b = 1 - (exp_b.avg_latency_ms / max_latency)

    # Score ponderado
    score_a = (feedback_a * 0.5) + (success_a * 0.3) + (latency_a * 0.2)
    score_b = (feedback_b * 0.5) + (success_b * 0.3) + (latency_b * 0.2)

    return "a" if score_a > score_b else "b"
```

### Exportando Resultados

```python
# Exportar para JSON
ab_test_manager.export_results("experiments_2024-01.json")
```

```json
{
  "experiments": [
    {
      "experiment_id": "control-flash",
      "name": "Control: Gemini 2.0 Flash",
      "metrics": {
        "total_requests": 1500,
        "success_rate": 94.5,
        "avg_latency_ms": 1250,
        "feedback_score": 78.3
      }
    },
    {
      "experiment_id": "exp-pro-reranked",
      "name": "Gemini Pro + Reranking",
      "metrics": {
        "total_requests": 450,
        "success_rate": 96.2,
        "avg_latency_ms": 2100,
        "feedback_score": 85.7
      }
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Analytics e Métricas

### Métricas Disponíveis

#### 1. System Health

```bash
GET /api/analytics/health
```

```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "total_requests": 1250,
  "error_rate": 2.3,
  "avg_latency_ms": 1150,
  "p95_latency_ms": 2300,
  "p99_latency_ms": 4500
}
```

#### 2. Analytics Overview

```bash
GET /api/analytics/overview?period=24h
```

```json
{
  "period": "24h",
  "total_requests": 5420,
  "total_analyses": 1250,
  "total_errors": 125,
  "error_rate": 2.3,
  "avg_latency_ms": 1150,
  "p95_latency_ms": 2300,
  "avg_tokens_per_analysis": 850,
  "total_feedback": 450,
  "positive_feedback_rate": 78.5
}
```

#### 3. Time Series

```bash
GET /api/analytics/timeseries/latency?period=24h&granularity=1h
```

```json
[
  {
    "timestamp": "2024-01-15 10:00",
    "value": 1150.5,
    "label": "Avg: 1150.5ms"
  },
  {
    "timestamp": "2024-01-15 11:00",
    "value": 1220.3,
    "label": "Avg: 1220.3ms"
  }
]
```

#### 4. Model Performance

```bash
GET /api/analytics/models/performance?period=7d
```

```json
[
  {
    "model_variant": "gemini-2.0-flash-001",
    "total_requests": 8500,
    "avg_latency_ms": 1150,
    "p95_latency_ms": 2200,
    "success_rate": 94.5,
    "avg_tokens": 820,
    "feedback_score": 78.3
  },
  {
    "model_variant": "gemini-1.5-pro-002",
    "total_requests": 1500,
    "avg_latency_ms": 2100,
    "p95_latency_ms": 3800,
    "success_rate": 96.2,
    "avg_tokens": 950,
    "feedback_score": 85.7
  }
]
```

### Registrando Métricas Customizadas

```python
from src.api.analytics import metrics_store

# Request metrics
metrics_store.record_request(
    endpoint="/analyze",
    method="POST",
    status_code=200,
    latency_ms=1250.5,
    experiment_id="exp-pro-reranked"
)

# Analysis metrics
metrics_store.record_analysis(
    document_id="doc-123",
    analysis_type="full",
    duration_ms=12500,
    tokens_used=850,
    model_variant="gemini-2.0-flash-001",
    success=True,
    experiment_id="control-flash"
)

# Error metrics
metrics_store.record_error(
    error_type="ValidationError",
    error_message="Invalid document format",
    endpoint="/analyze",
    experiment_id="control-flash"
)
```

### Dashboards

Os dados de analytics podem ser visualizados em:

1. **Built-in Dashboard**: `/api/analytics/*` endpoints
2. **Cloud Monitoring**: Google Cloud Console
3. **Custom Dashboards**: Grafana/Looker (integração futura)

---

## 🔄 User Feedback Loop

### Tipos de Feedback

#### 1. Thumbs (👍 👎)

```python
from src.api.feedback import FeedbackCreate, FeedbackType

feedback = FeedbackCreate(
    document_id="doc-123",
    feedback_type=FeedbackType.THUMBS,
    is_positive=True,
    experiment_id="control-flash"
)
```

#### 2. Rating (⭐ 1-5)

```python
feedback = FeedbackCreate(
    document_id="doc-123",
    feedback_type=FeedbackType.RATING,
    rating=4,
    experiment_id="exp-pro-reranked"
)
```

#### 3. Detailed Comment

```python
feedback = FeedbackCreate(
    document_id="doc-123",
    feedback_type=FeedbackType.DETAILED,
    category=FeedbackCategory.ACCURACY,
    comment="A análise foi precisa, mas faltou detalhar os prazos.",
    rating=4,
    experiment_id="control-flash"
)
```

#### 4. Correction

```python
feedback = FeedbackCreate(
    document_id="doc-123",
    feedback_type=FeedbackType.CORRECTION,
    category=FeedbackCategory.ACCURACY,
    comment="O prazo correto é 30 dias, não 45 dias.",
    correction="Prazo: 30 dias corridos a partir da publicação.",
    is_positive=False,
    experiment_id="control-flash"
)
```

### API Endpoints

#### Criar Feedback

```bash
POST /api/feedback/

{
  "document_id": "doc-123",
  "feedback_type": "detailed",
  "category": "accuracy",
  "rating": 4,
  "comment": "Boa análise, mas poderia detalhar mais os prazos",
  "experiment_id": "control-flash"
}
```

#### Obter Feedbacks de um Documento

```bash
GET /api/feedback/document/doc-123
```

#### Sumário Estatístico

```bash
GET /api/feedback/summary/stats?experiment_id=control-flash
```

```json
{
  "total_feedbacks": 450,
  "positive_count": 353,
  "negative_count": 75,
  "neutral_count": 22,
  "avg_rating": 4.2,
  "by_category": {
    "accuracy": 180,
    "completeness": 120,
    "clarity": 90,
    "relevance": 60
  },
  "by_type": {
    "thumbs": 250,
    "rating": 120,
    "detailed": 80
  }
}
```

#### Insights de Feedback

```bash
GET /api/feedback/insights/analyze?limit=500
```

```json
{
  "top_issues": [
    {
      "category": "completeness",
      "count": 45,
      "examples": [
        "Faltou analisar os anexos",
        "Não mencionou critérios de julgamento"
      ]
    },
    {
      "category": "accuracy",
      "count": 32,
      "examples": [
        "Prazo incorreto",
        "Valor estimado diferente do edital"
      ]
    }
  ],
  "improvement_suggestions": [
    "Adicionar análise automática de anexos",
    "Melhorar extração de prazos",
    "Validar valores com múltiplas fontes"
  ],
  "sentiment_trend": "improving",
  "critical_feedback_count": 12
}
```

### Ciclo de Melhoria

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Interaction                                     │
│    └─> Analisa documento com modelo/experimento         │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Collect Feedback                                     │
│    └─> Thumbs, Rating, Comments, Corrections            │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Store & Analyze                                      │
│    └─> FeedbackStore + MetricsStore                     │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Generate Insights                                    │
│    └─> Top issues, Trends, Critical feedback            │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Improve Models                                       │
│    └─> Adjust configs, Create new experiments           │
└─────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────┐
│ 6. A/B Test Improvements                                │
│    └─> Compare old vs new                               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Best Practices

### 1. RAG Best Practices

#### Chunking

```python
# ✅ BOM: Adaptive chunking por tipo
chunks = chunker.chunk_document(
    text=text,
    document_type="edital",  # Ajusta tamanho e estratégia
    strategy=ChunkingStrategy.ADAPTIVE
)

# ❌ RUIM: Tamanho fixo para todos os documentos
chunks = text.split('\n\n')  # Muito simplista
```

#### Query

```python
# ✅ BOM: Query expansion
expanded = expander.expand_query(query)
results = await rag.query(corpus_id, expanded[0])

# ❌ RUIM: Query literal sem expansão
results = await rag.query(corpus_id, query)
```

#### Deduplication

```python
# ✅ BOM: Semantic deduplication
unique_chunks, _ = dedup.deduplicate(chunks, embeddings)

# ❌ RUIM: Sem deduplicação (aumenta custo e ruído)
all_chunks = chunks  # Pode ter duplicatas
```

### 2. A/B Testing Best Practices

#### Traffic Distribution

```python
# ✅ BOM: Gradual rollout
experiments = [
    ("control", 0.7),      # 70% controle
    ("new-variant", 0.3),  # 30% novo
]

# ❌ RUIM: 50/50 sem validação
experiments = [
    ("control", 0.5),
    ("untested-variant", 0.5),  # Muito risco
]
```

#### Sample Size

```python
# ✅ BOM: Aguardar sample size adequado
if experiment.total_requests >= 100:
    # Comparar resultados
    comparison = manager.compare_experiments(...)

# ❌ RUIM: Decidir com pouco dados
if experiment.total_requests >= 10:  # Muito cedo!
    comparison = manager.compare_experiments(...)
```

#### Metrics

```python
# ✅ BOM: Múltiplas métricas
- Feedback score (qualidade percebida)
- Success rate (funcionamento)
- Latency (performance)
- Token usage (custo)

# ❌ RUIM: Apenas uma métrica
- Latency  # Ignora qualidade!
```

### 3. Feedback Loop Best Practices

#### Collection

```python
# ✅ BOM: Múltiplos tipos de feedback
- Thumbs (rápido)
- Rating (quantitativo)
- Comments (qualitativo)
- Corrections (ground truth)

# ❌ RUIM: Apenas thumbs
- Falta contexto para melhorias
```

#### Analysis

```python
# ✅ BOM: Análise regular de insights
insights = await get_feedback_insights(limit=500)
if insights.critical_feedback_count > 10:
    # Investigar problemas críticos
    pass

# ❌ RUIM: Coletar mas não analisar
# Feedback é ignorado
```

### 4. Performance Best Practices

#### Caching

```python
# ✅ BOM: Cache de embeddings
@cache_embeddings(ttl=3600)
def get_document_embedding(text):
    return embedding_model.embed(text)

# ❌ RUIM: Recalcular sempre
def get_document_embedding(text):
    return embedding_model.embed(text)  # Caro!
```

#### Batching

```python
# ✅ BOM: Batch processing
embeddings = embedding_model.embed_batch(texts)

# ❌ RUIM: One-by-one
embeddings = [embedding_model.embed(t) for t in texts]
```

---

## 🔧 Troubleshooting

### Problema: RAG retorna resultados irrelevantes

**Sintomas**:
- Citações não respondem a pergunta
- Score de qualidade baixo

**Soluções**:

1. **Aumentar threshold de similaridade**:
```python
vector_threshold = 0.7  # de 0.5 para 0.7
```

2. **Usar query expansion**:
```python
expanded = expander.expand_query(query)
```

3. **Verificar chunking**:
```python
# Chunks muito grandes ou pequenos?
chunk_size = 700  # Ajustar
```

### Problema: Experimento sem dados suficientes

**Sintomas**:
- `total_requests < 100`
- Métricas instáveis

**Soluções**:

1. **Aumentar traffic percentage**:
```python
experiment.traffic_percentage = 0.5  # de 0.2 para 0.5
```

2. **Aguardar mais tempo**:
```python
# Esperar pelo menos 1 semana com tráfego real
```

3. **Synthetic testing**:
```python
# Gerar tráfego de teste para validar funcionamento
```

### Problema: Feedback muito negativo

**Sintomas**:
- `feedback_score < 60%`
- Muitos comentários negativos

**Soluções**:

1. **Analisar insights**:
```python
insights = await get_feedback_insights()
print(insights.top_issues)
```

2. **Verificar experiment config**:
```python
# Temperature muito alta?
experiment.temperature = 0.1  # Reduzir
```

3. **Rollback se crítico**:
```python
experiment.is_active = False
experiment.traffic_percentage = 0.0
```

### Problema: Latência alta

**Sintomas**:
- `avg_latency_ms > 5000`
- Timeouts

**Soluções**:

1. **Reduzir top_k**:
```python
similarity_top_k = 5  # de 10 para 5
```

2. **Desabilitar reranking**:
```python
enable_reranking = False
```

3. **Usar modelo mais rápido**:
```python
model_variant = ModelVariant.GEMINI_2_FLASH  # em vez de PRO
```

---

## 📚 Recursos Adicionais

### Documentação

- [Vertex AI RAG](https://cloud.google.com/vertex-ai/docs/vector-search/overview)
- [Gemini Models](https://ai.google.dev/models/gemini)
- [A/B Testing Guide](https://www.optimizely.com/optimization-glossary/ab-testing/)

### Arquivos Relacionados

```
services/analyzer/src/
├── ml/
│   ├── ab_testing.py           # A/B testing framework
│   └── rag_enhancements.py     # RAG improvements
├── services/
│   └── rag_service.py          # RAG core service
├── api/
│   ├── experiments.py          # Experiments API
│   ├── analytics.py            # Analytics API
│   └── feedback.py             # Feedback API
└── config_rag.py               # RAG configuration
```

### Scripts Úteis

```bash
# Criar experimento padrão
python -m src.ml.ab_testing

# Exportar resultados
curl -X POST "http://localhost:8080/api/experiments/export?filepath=results.json"

# Ver analytics
curl "http://localhost:8080/api/analytics/overview?period=7d"

# Insights de feedback
curl "http://localhost:8080/api/feedback/insights/analyze"
```

---

**Última atualização**: 22/11/2025
**Versão**: 1.0.0
**Mantido por**: AI/ML Team
