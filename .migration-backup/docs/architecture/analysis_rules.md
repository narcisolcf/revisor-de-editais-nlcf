# Parâmetros de Avaliação (Regras de Análise)

Este documento descreve como configurar e estender os parâmetros usados na avaliação de documentos (editais, TR, etc.).

## Onde ficam as regras?

As regras estão centralizadas em:
- `src/data/analysisRules.ts` — Define regras genéricas e específicas por tipo de documento e modalidade.

Os tipos/contratos usados pelas regras ficam em:
- `src/types/document.ts` — Tipos `AnalysisRule`, `RuleSeverity`, `RuleCategory` e `AnalysisRuleSet`.

## Como funciona

1. Em `DocumentAnalysisService.analyzeConformity`, as regras são carregadas por classificação com `getRulesForClassification(classification)`.
2. As regras são avaliadas (palavras-chave obrigatórias, pelo menos uma palavra, padrões/regex).
3. Problemas são gerados com base na gravidade, categoria e tipo de problema definidos na regra.
4. Hooks de validações existentes (ex.: `validateEdital`, `validateTermoReferencia`) continuam ativos e complementam as regras genéricas.

## Adicionando/alterando regras

- Regras genéricas: adicione em `genericRules`.
- Regras para Edital: adicione em `editalRules`.
- Regras para Termo de Referência: adicione em `termoReferenciaRules`.
- Regras por modalidade (ex.: Processo Licitatório): adicione em `modalidadeProcessoLicitatorioRules`.

Cada regra segue a interface `AnalysisRule`:
- `id`: string única
- `description`: descrição do requisito
- `type`: `keyword_presence` (todas), `keyword_any` (pelo menos uma), `pattern` (regex)
- `keywordsAll`/`keywordsAny`/`pattern`: critério da regra
- `severity`: `baixa` | `media` | `alta` | `critica`
- `category`: `juridico` | `tecnico` | `orcamentario` | `formal`
- `suggestion`: orientação de correção
- `problemType`: mapeia para o tipo de `Problem`

## Exemplo rápido

```ts
// src/data/analysisRules.ts
const editalRules: AnalysisRule[] = [
  {
    id: 'edital-criterio',
    description: 'Critério de julgamento deve ser especificado',
    type: 'keyword_any',
    keywordsAny: ['critério', 'criterio', 'julgamento'],
    severity: 'alta',
    category: 'juridico',
    suggestion: 'Especificar o critério de julgamento',
    problemType: 'criterio_irregular',
  },
];
```

## Boas práticas
- Use acentos e variações sem acento (ex.: `critério` e `criterio`).
- Evite regex complexas; prefira regras por palavras-chave.
- Mantenha `id` estável para facilitar auditoria.
