# Sistema de Análise por Categoria - Revisor de Editais

## Visão Geral

Este sistema implementa uma arquitetura robusta para análise de documentos de licitação com análise por categoria, cache inteligente e sistema de fallback. O sistema é composto por quatro analisadores especializados que trabalham em conjunto para fornecer uma análise abrangente e confiável.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    AnalysisOrchestrator                     │
│                     (Orquestrador Principal)                │
└─────────────────┬───────────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌────▼────┐   ┌────▼────┐
│ Cache │   │Fallback │   │Analyzers│
│System │   │ System  │   │(4 cats) │
└───────┘   └─────────┘   └─────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼───┐          ┌───▼───┐          ┌───▼───┐
    │Struct.│          │Legal  │          │Clarity│
    │Analyzer│          │Analyzer│          │Analyzer│
    └───────┘          └───────┘          └───────┘
                                      
                                    ┌───▼───┐
                                    │ABNT   │
                                    │Analyzer│
                                    └───────┘
```

## Componentes Principais

### 1. Analisadores por Categoria

#### StructuralAnalyzer
- **Propósito**: Analisa estrutura, formatação e organização do documento
- **Funcionalidades**:
  - Extração e análise de seções
  - Verificação de hierarquia
  - Análise de formatação (listas, numeração, espaçamento)
  - Verificação específica por tipo de documento
- **Prioridade**: 1 (mais alta)
- **Timeout**: 10 segundos

#### LegalAnalyzer
- **Propósito**: Verifica conformidade jurídica e riscos legais
- **Funcionalidades**:
  - Análise de conformidade com leis (8.666/93, 10.520/02)
  - Detecção de riscos legais
  - Verificação de cláusulas obrigatórias
  - Análise de prazos e vencimentos
- **Prioridade**: 2
- **Timeout**: 15 segundos

#### ClarityAnalyzer
- **Propósito**: Analisa clareza, ambiguidade e legibilidade
- **Funcionalidades**:
  - Detecção de ambiguidades (verbos modais, termos subjetivos)
  - Métricas de legibilidade (Flesch-Kincaid)
  - Análise de consistência terminológica
  - Verificação de clareza específica por tipo
- **Prioridade**: 3
- **Timeout**: 12 segundos

#### ABNTAnalyzer
- **Propósito**: Verifica conformidade com normas técnicas brasileiras
- **Funcionalidades**:
  - Análise de formatação ABNT
  - Verificação de estrutura (pré-textual, textual, pós-textual)
  - Análise de referências bibliográficas
  - Verificação de numeração e paginação
- **Prioridade**: 4 (mais baixa)
- **Timeout**: 10 segundos

### 2. Sistema de Cache Inteligente

#### Características
- **Cache por Similaridade**: Identifica análises similares baseado em texto e classificação
- **Invalidação Inteligente**: Remove entradas quando parâmetros mudam
- **LRU + LFU**: Algoritmo híbrido para evição de entradas
- **Métricas Detalhadas**: Hit rate, tamanho, estatísticas de uso

#### Configuração
```typescript
const cacheConfig = {
  maxSize: 100, // MB
  maxEntries: 1000,
  ttl: 24 * 60 * 60 * 1000, // 24 horas
  similarityThreshold: 0.85, // 85% de similaridade
  enableCompression: true,
  enableMetrics: true
};
```

### 3. Sistema de Fallback

#### Estratégias de Fallback
1. **Retry Strategy** (Prioridade 1): Tenta novamente em caso de falha
2. **Basic Analysis Strategy** (Prioridade 2): Usa analisador básico
3. **Error Result Strategy** (Prioridade 3): Retorna resultado de erro estruturado

#### Configuração
```typescript
const fallbackConfig = {
  enabled: true,
  maxRetries: 3,
  retryDelay: 1000, // ms
  enableBasicAnalysis: true,
  enableLogging: true,
  enableMetrics: true
};
```

## Como Usar

### Configuração Básica

```typescript
import { AnalysisOrchestrator } from '@/services/analysis';

const orchestrator = new AnalysisOrchestrator({
  enableCache: true,
  enableFallback: true,
  enableParallelProcessing: true,
  maxConcurrentAnalyses: 5,
  timeout: 30000
});
```

### Análise Completa de Documento

```typescript
const result = await orchestrator.analyzeDocument(
  documentText,
  classification,
  { customParameter: 'value' }
);

console.log('Score Geral:', result.overallScore);
console.log('Confiança:', result.overallConfidence);
console.log('Tempo de Processamento:', result.totalProcessingTime);
console.log('Problemas Encontrados:', result.problems.length);

// Resultados por categoria
console.log('Análise Estrutural:', result.categoryResults.structural.score);
console.log('Análise Legal:', result.categoryResults.legal.score);
console.log('Análise de Clareza:', result.categoryResults.clarity.score);
console.log('Análise ABNT:', result.categoryResults.abnt.score);
```

### Análise por Categoria Específica

```typescript
// Apenas análise estrutural
const structuralResult = await orchestrator.analyzeStructural(
  documentText,
  classification
);

// Apenas análise legal
const legalResult = await orchestrator.analyzeLegal(
  documentText,
  classification
);
```

### Gerenciamento de Cache

```typescript
// Invalidar cache por parâmetros
await orchestrator.invalidateCache({ customParameter: 'newValue' });

// Invalidar cache por classificação
await orchestrator.invalidateCacheByClassification(classification);

// Obter métricas do cache
const cacheMetrics = orchestrator.getCacheMetrics();
console.log('Hit Rate:', cacheMetrics.averageHitRate);
```

### Monitoramento e Saúde do Sistema

```typescript
// Status de saúde dos analisadores
const healthStatus = orchestrator.getAnalyzerHealthStatus();
console.log('Status Estrutural:', healthStatus.structural.healthy);

// Métricas de fallback
const fallbackMetrics = orchestrator.getFallbackMetrics();
console.log('Fallbacks Executados:', fallbackMetrics.totalFallbacks);

// Logs de fallback
const fallbackLogs = orchestrator.getFallbackLogs(50);
console.log('Últimos 50 logs:', fallbackLogs);
```

## Configurações Avançadas

### Configuração de Analisadores

```typescript
// Configurar analisador específico
const structuralAnalyzer = new StructuralAnalyzer();
structuralAnalyzer.updateConfig({
  timeout: 15000,
  fallbackEnabled: true
});
```

### Configuração de Cache

```typescript
const cache = new IntelligentCache({
  maxSize: 200, // 200MB
  maxEntries: 2000,
  ttl: 12 * 60 * 60 * 1000, // 12 horas
  similarityThreshold: 0.9 // 90% de similaridade
});
```

### Configuração de Fallback

```typescript
const fallbackSystem = new FallbackSystem({
  maxRetries: 5,
  retryDelay: 2000,
  enableBasicAnalysis: true,
  enableLogging: true
});
```

## Métricas e Monitoramento

### Métricas de Cache
- **Hit Rate**: Taxa de acerto do cache
- **Tamanho**: Uso de memória
- **Entradas**: Número de análises em cache
- **Evicções**: Número de entradas removidas

### Métricas de Fallback
- **Total de Fallbacks**: Número total de execuções
- **Fallbacks Bem-sucedidos**: Execuções que funcionaram
- **Fallbacks Falharam**: Execuções que falharam
- **Tempo Médio**: Tempo médio de execução

### Status de Saúde
- **Healthy**: Analisador funcionando normalmente
- **Error Count**: Número de erros consecutivos
- **Last Error**: Último erro encontrado

## Tratamento de Erros

O sistema implementa tratamento robusto de erros com:

1. **Fallback Automático**: Em caso de falha, executa estratégias alternativas
2. **Logging Detalhado**: Registra todos os erros e ações de fallback
3. **Métricas de Erro**: Acompanha frequência e tipos de erro
4. **Graceful Degradation**: Continua funcionando mesmo com falhas parciais

## Performance e Otimizações

### Processamento Paralelo
- Análises executadas simultaneamente quando habilitado
- Configurável via `enableParallelProcessing`
- Limite de análises concorrentes configurável

### Cache Inteligente
- Reduz tempo de resposta para análises similares
- Invalidação automática por mudança de parâmetros
- Algoritmo LRU+LFU para otimização de memória

### Timeouts Configuráveis
- Cada analisador tem timeout individual
- Timeout geral configurável no orquestrador
- Fallback automático em caso de timeout

## Casos de Uso

### 1. Análise de Edital
- **StructuralAnalyzer**: Verifica seções obrigatórias
- **LegalAnalyzer**: Conformidade com Lei 8.666/93
- **ClarityAnalyzer**: Clareza de critérios e especificações
- **ABNTAnalyzer**: Formatação e estrutura técnica

### 2. Análise de Termo de Referência
- **StructuralAnalyzer**: Organização e hierarquia
- **LegalAnalyzer**: Justificativa e fundamentação
- **ClarityAnalyzer**: Especificações técnicas claras
- **ABNTAnalyzer**: Referências e numeração

### 3. Análise de Contrato
- **StructuralAnalyzer**: Cláusulas organizadas
- **LegalAnalyzer**: Cláusulas obrigatórias
- **ClarityAnalyzer**: Linguagem clara e objetiva
- **ABNTAnalyzer**: Formatação contratual

## Extensibilidade

O sistema foi projetado para ser facilmente extensível:

1. **Novos Analisadores**: Implementar `BaseAnalyzer`
2. **Novas Estratégias de Fallback**: Adicionar ao `FallbackSystem`
3. **Novos Tipos de Cache**: Estender `IntelligentCache`
4. **Novas Métricas**: Adicionar ao sistema de monitoramento

## Considerações de Produção

### Segurança
- Validação de entrada em todos os analisadores
- Sanitização de texto antes da análise
- Limites de tamanho de arquivo configuráveis

### Escalabilidade
- Processamento paralelo configurável
- Cache distribuído (Redis) para produção
- Load balancing entre instâncias

### Monitoramento
- Logs estruturados para análise
- Métricas em tempo real
- Alertas automáticos para falhas
- Dashboard de saúde do sistema

## Conclusão

Este sistema fornece uma base sólida e extensível para análise de documentos de licitação, com foco em:

- **Confiabilidade**: Sistema de fallback robusto
- **Performance**: Cache inteligente e processamento paralelo
- **Monitoramento**: Métricas detalhadas e logs estruturados
- **Extensibilidade**: Arquitetura modular e configurável

O sistema está pronto para uso em produção e pode ser facilmente adaptado para diferentes tipos de documentos e requisitos específicos.
