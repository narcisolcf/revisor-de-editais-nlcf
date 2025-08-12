import { ClassificationNode } from '@/types/document';

// Estrutura hierárquica completa baseada na classificação AGU
export const classificationTree: ClassificationNode[] = [
  {
    nivel: 1,
    nome: "Aquisição",
    key: "aquisicao",
    filhos: [
      {
        nivel: 2,
        nome: "Contratação Direta",
        key: "contratacao_direta",
        filhos: [
          {
            nivel: 3,
            nome: "Dispensa",
            key: "dispensa",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] }
            ]
          },
          { nivel: 3, nome: "Adesão", key: "adesao", filhos: [] }
        ]
      },
      {
        nivel: 2,
        nome: "Processo Licitatório",
        key: "processo_licitatorio",
        filhos: [
          {
            nivel: 3,
            nome: "Processo Licitatório",
            key: "processo_licitatorio",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] },
              { nivel: 4, nome: "IMPUGNAÇÃO", key: "impugnacao", filhos: [] }
            ]
          }
        ]
      },
      {
        nivel: 2,
        nome: "Alterações Contratuais",
        key: "alteracoes_contratuais",
        filhos: [
          { nivel: 3, nome: "Aditivo Quantitativo", key: "aditivo_quantitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Qualitativo", key: "aditivo_qualitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Vigência", key: "aditivo_vigencia", filhos: [] }
        ]
      }
    ]
  },
  {
    nivel: 1,
    nome: "Serviço",
    key: "servico",
    filhos: [
      {
        nivel: 2,
        nome: "Contratação Direta",
        key: "contratacao_direta",
        filhos: [
          {
            nivel: 3,
            nome: "Dispensa",
            key: "dispensa",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] }
            ]
          }
        ]
      },
      {
        nivel: 2,
        nome: "Processo Licitatório",
        key: "processo_licitatorio",
        filhos: [
          {
            nivel: 3,
            nome: "Processo Licitatório",
            key: "processo_licitatorio",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] },
              { nivel: 4, nome: "IMPUGNAÇÃO", key: "impugnacao", filhos: [] }
            ]
          }
        ]
      },
      {
        nivel: 2,
        nome: "Alterações Contratuais",
        key: "alteracoes_contratuais",
        filhos: [
          { nivel: 3, nome: "Aditivo Quantitativo", key: "aditivo_quantitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Qualitativo", key: "aditivo_qualitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Vigência", key: "aditivo_vigencia", filhos: [] }
        ]
      }
    ]
  },
  {
    nivel: 1,
    nome: "Obra e Serviços de Eng.",
    key: "obra_servicos_eng",
    filhos: [
      {
        nivel: 2,
        nome: "Contratação Direta",
        key: "contratacao_direta",
        filhos: [
          {
            nivel: 3,
            nome: "Dispensa",
            key: "dispensa",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "PROJETO BÁSICO", key: "projeto_basico", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] }
            ]
          }
        ]
      },
      {
        nivel: 2,
        nome: "Processo Licitatório",
        key: "processo_licitatorio",
        filhos: [
          {
            nivel: 3,
            nome: "Processo Licitatório",
            key: "processo_licitatorio",
            filhos: [
              { nivel: 4, nome: "ETP", key: "etp", filhos: [] },
              { nivel: 4, nome: "TR", key: "tr", filhos: [] },
              { nivel: 4, nome: "MAPA DE RISCOS", key: "mapa_riscos", filhos: [] },
              { nivel: 4, nome: "PROJETO BÁSICO", key: "projeto_basico", filhos: [] },
              { nivel: 4, nome: "EDITAL", key: "edital", filhos: [] },
              { nivel: 4, nome: "MINUTA DE CONTRATO", key: "minuta_contrato", filhos: [] },
              { nivel: 4, nome: "IMPUGNAÇÃO", key: "impugnacao", filhos: [] }
            ]
          }
        ]
      },
      {
        nivel: 2,
        nome: "Alterações Contratuais",
        key: "alteracoes_contratuais",
        filhos: [
          { nivel: 3, nome: "Aditivo Quantitativo", key: "aditivo_quantitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Qualitativo", key: "aditivo_qualitativo", filhos: [] },
          { nivel: 3, nome: "Aditivo Vigência", key: "aditivo_vigencia", filhos: [] }
        ]
      }
    ]
  }
];

// Funções utilitárias mantidas apenas para compatibilidade durante transição

export function getTiposObjeto(): ClassificationNode[] {
  return classificationTree;
}

// Função para validação de caminhos de classificação
export function isValidClassificationPath(
  tipoObjeto: string,
  modalidade: string,
  subtipo: string,
  documento: string
): boolean {
  const tipo = classificationTree.find(node => node.key === tipoObjeto);
  const modalidadeNode = tipo?.filhos.find(node => node.key === modalidade);
  const subtipoNode = modalidadeNode?.filhos.find(node => node.key === subtipo);
  return subtipoNode?.filhos.some(doc => doc.key === documento) || false;
}