export interface DocumentUpload {
  id: string;
  prefeituraId: string;
  nome: string;
  tipo: 'PDF' | 'DOCX';
  tamanho: number;
  urlStorage: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  tipoLicitacao: 'pregao' | 'concorrencia' | 'tomada_precos' | 'convite';
  descricao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentAnalysis {
  id: string;
  documentoId: string;
  textoExtraido: string;
  scoreConformidade: number;
  problemasEncontrados: Problem[];
  recomendacoes: string[];
  metricas: AnalysisMetrics;
  createdAt: Date;
}

export interface Problem {
  tipo: 'clausula_faltante' | 'inconsistencia' | 'prazo_inadequado' | 'criterio_irregular';
  descricao: string;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  localizacao?: string;
  sugestaoCorrecao?: string;
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