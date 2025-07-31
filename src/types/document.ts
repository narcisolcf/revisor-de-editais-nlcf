// Nova estrutura hierárquica de classificação - Lei 14.133/21

// Nível 1: Tipo de Objeto
export type TipoObjeto = 
  | 'aquisicao'
  | 'servico'
  | 'obra_servicos_eng';

// Nível 2: Modalidade Principal
export type ModalidadePrincipal = 
  | 'contratacao_direta'
  | 'processo_licitatorio'
  | 'alteracoes_contratuais';

// Nível 3: Subtipo
export type Subtipo = 
  | 'dispensa'
  | 'adesao'
  | 'processo_licitatorio'
  | 'aditivo_quantitativo'
  | 'aditivo_qualitativo'
  | 'aditivo_vigencia';

// Nível 4: Tipo de Documento
export type TipoDocumento = 
  | 'etp'
  | 'tr'
  | 'mapa_riscos'
  | 'edital'
  | 'minuta_contrato'
  | 'impugnacao'
  | 'projeto_basico';

// Interface para representar a classificação completa
export interface DocumentClassification {
  tipoObjeto: TipoObjeto;
  modalidadePrincipal: ModalidadePrincipal;
  subtipo: Subtipo;
  tipoDocumento: TipoDocumento;
}

// Interface para estrutura hierárquica
export interface ClassificationNode {
  nivel: number;
  nome: string;
  key: string;
  filhos: ClassificationNode[];
}

// Configuração específica por classificação
export interface DocumentClassificationConfig {
  classification: DocumentClassification;
  requiredFields: string[];
  analysisParameters: string[];
  validationRules: ValidationRule[];
  specificMetrics: string[];
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Campos específicos por tipo de documento
export interface DocumentSpecificFields {
  // Para editais
  modalidade?: string;
  objetoLicitacao?: string;
  prazoEntregaProposta?: Date;
  criterioJulgamento?: 'menor_preco' | 'melhor_tecnica' | 'tecnica_preco';
  
  // Para termo de referência
  especificacoesTecnicas?: string;
  quantitativos?: Array<{ item: string; quantidade: number; unidade: string }>;
  justificativa?: string;
  
  // Para minuta de contrato
  vigenciaContrato?: number;
  clausulasPenalidades?: boolean;
  garantiaContratual?: number;
  
  // Para projeto básico
  memorialDescritivo?: boolean;
  planilhaOrcamentaria?: boolean;
  cronogramaExecucao?: boolean;
  
  // Para ata de registro de preços
  validadeAta?: number;
  itensRegistrados?: Array<{ item: string; precoUnitario: number }>;
  
  // Para pareceres
  fundamentacaoLegal?: boolean;
  conclusaoObjetiva?: boolean;
  recomendacoes?: string[];
}

export interface DocumentUpload {
  id: string;
  prefeituraId: string;
  nome: string;
  tipo: 'PDF' | 'DOCX';
  classification: DocumentClassification;
  tamanho: number;
  urlStorage: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  specificFields?: DocumentSpecificFields;
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAnalysis {
  id: string;
  documentoId: string;
  classification: DocumentClassification;
  textoExtraido: string;
  scoreConformidade: number;
  problemasEncontrados: Problem[];
  recomendacoes: string[];
  metricas: AnalysisMetrics;
  specificAnalysis: DocumentClassificationSpecificAnalysis;
  createdAt: Date;
}

// Análise específica por classificação de documento
export interface DocumentClassificationSpecificAnalysis {
  // Para editais
  prazosAdequados?: boolean;
  modalidadeCorreta?: boolean;
  criteriosHabilitacaoClaros?: boolean;
  especificacoesDetalhadas?: boolean;
  
  // Para termo de referência
  especificacoesTecnicasCompletas?: boolean;
  quantitativosDetalhados?: boolean;
  justificativaFundamentada?: boolean;
  
  // Para minuta de contrato
  clausulasObrigatorias?: string[];
  clausulasFaltantes?: string[];
  penalidadesDefinidas?: boolean;
  
  // Para projeto básico
  memorialAdequado?: boolean;
  planilhaConsistente?: boolean;
  cronogramaRealista?: boolean;
  
  // Para ata de registro
  validadeDefinida?: boolean;
  precosCoerentes?: boolean;
  itensEspecificados?: boolean;
  
  // Para pareceres
  fundamentacaoSolida?: boolean;
  conclusaoClara?: boolean;
  baseJuridicaCorreta?: boolean;
  
  // Métricas customizadas por tipo
  customMetrics?: Record<string, number | boolean | string>;
}

export interface Problem {
  tipo: 'clausula_faltante' | 'inconsistencia' | 'prazo_inadequado' | 'criterio_irregular' | 
        'especificacao_incompleta' | 'modalidade_incorreta' | 'fundamentacao_fraca' | 
        'quantitativo_inconsistente' | 'planilha_inconsistente' | 'cronograma_irrealista';
  descricao: string;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  localizacao?: string;
  sugestaoCorrecao?: string;
  classification?: DocumentClassification;
  categoria?: 'juridico' | 'tecnico' | 'orcamentario' | 'formal';
}

export interface AnalysisMetrics {
  totalClauses: number;
  validClauses: number;
  missingClauses: number;
  inconsistencies: number;
  processingTime: number;
}

export interface Prefeitura {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  municipio: string;
  estado: string;
  telefone?: string;
  responsavel?: string;
  createdAt: Date;
}