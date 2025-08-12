import { DocumentClassification, AnalysisRule } from '@/types/document';

// Conjunto centralizado de regras para avaliação de documentos
// Mantemos regras genéricas + específicas por tipoDocumento e modalidade

const genericRules: AnalysisRule[] = [
  {
    id: 'generic-prazo',
    description: 'Documento deve especificar prazos',
    type: 'keyword_presence',
    keywordsAll: ['prazo'],
    severity: 'alta',
    category: 'juridico',
    suggestion: 'Incluir cláusula sobre prazos de entrega e execução',
    problemType: 'clausula_faltante',
  },
];

const editalRules: AnalysisRule[] = [
  {
    id: 'edital-objeto',
    description: 'Objeto/finalidade deve estar definido',
    type: 'keyword_any',
    keywordsAny: ['objeto', 'finalidade'],
    severity: 'critica',
    category: 'juridico',
    suggestion: 'Definir claramente o objeto da licitação',
    problemType: 'clausula_faltante',
  },
  {
    id: 'edital-criterio',
    description: 'Critério de julgamento deve ser especificado',
    type: 'keyword_any',
    keywordsAny: ['critério', 'criterio', 'julgamento'],
    severity: 'alta',
    category: 'juridico',
    suggestion: 'Especificar o critério de julgamento (menor preço, melhor técnica, etc.)',
    problemType: 'criterio_irregular',
  },
];

const termoReferenciaRules: AnalysisRule[] = [
  {
    id: 'tr-especificacao',
    description: 'Especificações técnicas devem estar detalhadas',
    type: 'keyword_any',
    keywordsAny: ['especificação', 'especificacao', 'detalhamento'],
    severity: 'alta',
    category: 'tecnico',
    suggestion: 'Detalhar especificações técnicas conforme necessidades da Administração',
    problemType: 'especificacao_incompleta',
  },
];

const modalidadeProcessoLicitatorioRules: AnalysisRule[] = [
  {
    id: 'modalidade-sistema-eletronico',
    description: 'Mencionar uso de sistema eletrônico quando aplicável',
    type: 'keyword_any',
    keywordsAny: ['sistema', 'eletrônico', 'eletronico'],
    severity: 'media',
    category: 'formal',
    suggestion: 'Especificar o sistema eletrônico a ser utilizado para o pregão',
    problemType: 'modalidade_incorreta',
  },
];

export function getRulesForClassification(
  classification: DocumentClassification
): AnalysisRule[] {
  const rules: AnalysisRule[] = [...genericRules];

  switch (classification.tipoDocumento) {
    case 'edital':
      rules.push(...editalRules);
      break;
    case 'tr':
      rules.push(...termoReferenciaRules);
      break;
    default:
      break;
  }

  if (classification.modalidadePrincipal === 'processo_licitatorio') {
    rules.push(...modalidadeProcessoLicitatorioRules);
  }

  return rules;
}
