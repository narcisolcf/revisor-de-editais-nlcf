// Tipos específicos de documentos licitatórios
export type DocumentType = 
  | 'edital'
  | 'termo_referencia'
  | 'minuta_contrato'
  | 'projeto_basico'
  | 'ata_registro_precos'
  | 'parecer_juridico'
  | 'parecer_tecnico'
  | 'planilha_orcamentaria'
  | 'cronograma'
  | 'memorial_descritivo';

// Modalidades de licitação
export type ModalidadeLicitacao = 
  | 'pregao_eletronico'
  | 'pregao_presencial'
  | 'concorrencia'
  | 'tomada_precos'
  | 'convite'
  | 'concurso'
  | 'leilao'
  | 'rdc'
  | 'dispensa'
  | 'inexigibilidade';

// Configuração específica por tipo de documento
export interface DocumentTypeConfig {
  documentType: DocumentType;
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
  modalidade?: ModalidadeLicitacao;
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
  documentType: DocumentType;
  tamanho: number;
  urlStorage: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  modalidadeLicitacao?: ModalidadeLicitacao;
  specificFields?: DocumentSpecificFields;
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAnalysis {
  id: string;
  documentoId: string;
  documentType: DocumentType;
  textoExtraido: string;
  scoreConformidade: number;
  problemasEncontrados: Problem[];
  recomendacoes: string[];
  metricas: AnalysisMetrics;
  specificAnalysis: DocumentTypeSpecificAnalysis;
  createdAt: Date;
}

// Análise específica por tipo de documento
export interface DocumentTypeSpecificAnalysis {
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
  documentType?: DocumentType;
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