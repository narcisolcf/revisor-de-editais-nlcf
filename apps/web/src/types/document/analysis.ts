/**
 * Tipos para análise de documentos
 */

import { BaseEntity, TimestampedEntity } from '../core/base';
import { Status, Priority, Severity } from '../core/common';
import { DocumentType } from './base';

/** Análise completa de um documento */
export interface DocumentAnalysis extends TimestampedEntity {
  /** ID do documento analisado */
  documentId: string;
  /** Tipo de análise realizada */
  analysisType: AnalysisType;
  /** Status da análise */
  status: AnalysisStatus;
  /** Progresso da análise (0-100) */
  progress: number;
  /** Configuração usada na análise */
  config: AnalysisConfig;
  /** Resultados da análise */
  results: AnalysisResults;
  /** Métricas de performance */
  metrics: AnalysisMetrics;
  /** Usuário que solicitou a análise */
  requestedBy: string;
  /** Data de início da análise */
  startedAt: Date;
  /** Data de conclusão da análise */
  completedAt?: Date;
  /** Erros ocorridos */
  errors: AnalysisError[];
  /** Avisos gerados */
  warnings: AnalysisWarning[];
}

/** Tipos de análise disponíveis */
export type AnalysisType = 
  | 'compliance'      // Análise de conformidade
  | 'legal'           // Análise jurídica
  | 'technical'       // Análise técnica
  | 'financial'       // Análise financeira
  | 'risk'            // Análise de riscos
  | 'quality'         // Análise de qualidade
  | 'completeness'    // Análise de completude
  | 'consistency'     // Análise de consistência
  | 'custom';         // Análise customizada

/** Status da análise */
export type AnalysisStatus = 
  | 'pending'         // Aguardando início
  | 'initializing'    // Inicializando
  | 'preprocessing'   // Pré-processamento
  | 'analyzing'       // Análise em andamento
  | 'postprocessing'  // Pós-processamento
  | 'completed'       // Concluída
  | 'failed'          // Falhou
  | 'cancelled'       // Cancelada
  | 'timeout';        // Timeout

/** Configuração de análise */
export interface AnalysisConfig {
  /** Tipo de análise */
  type: AnalysisType;
  /** Parâmetros específicos */
  parameters: AnalysisParameters;
  /** Regras a serem aplicadas */
  rules: AnalysisRule[];
  /** Critérios de avaliação */
  criteria: EvaluationCriteria[];
  /** Configurações de output */
  output: OutputConfig;
  /** Timeout em segundos */
  timeout: number;
  /** Prioridade da análise */
  priority: Priority;
}

/** Parâmetros de análise */
export interface AnalysisParameters {
  /** Nível de detalhamento */
  detailLevel: 'basic' | 'standard' | 'detailed' | 'comprehensive';
  /** Se deve incluir sugestões */
  includeSuggestions: boolean;
  /** Se deve gerar relatório */
  generateReport: boolean;
  /** Idioma da análise */
  language: string;
  /** Contexto específico */
  context?: AnalysisContext;
  /** Parâmetros customizados */
  custom?: Record<string, unknown>;
}

/** Contexto de análise */
export interface AnalysisContext {
  /** Tipo de licitação */
  procurementType?: string;
  /** Modalidade */
  modality?: string;
  /** Valor estimado */
  estimatedValue?: number;
  /** Órgão licitante */
  procuringEntity?: string;
  /** Legislação aplicável */
  applicableLaw?: string[];
  /** Contexto adicional */
  additional?: Record<string, unknown>;
}

/** Regra de análise */
export interface AnalysisRule {
  /** ID da regra */
  id: string;
  /** Nome da regra */
  name: string;
  /** Descrição */
  description: string;
  /** Categoria da regra */
  category: RuleCategory;
  /** Severidade */
  severity: Severity;
  /** Condições da regra */
  conditions: RuleCondition[];
  /** Ações a serem tomadas */
  actions: RuleAction[];
  /** Se a regra está ativa */
  isActive: boolean;
  /** Peso da regra */
  weight: number;
}

/** Categorias de regras */
export type RuleCategory = 
  | 'mandatory'       // Obrigatória
  | 'recommended'     // Recomendada
  | 'best_practice'   // Boa prática
  | 'warning'         // Aviso
  | 'information';    // Informativa

/** Condição de regra */
export interface RuleCondition {
  /** Campo a ser verificado */
  field: string;
  /** Operador */
  operator: string;
  /** Valor esperado */
  value: unknown;
  /** Lógica (AND/OR) */
  logic?: 'AND' | 'OR';
}

/** Ação de regra */
export interface RuleAction {
  /** Tipo de ação */
  type: 'flag' | 'score' | 'suggest' | 'require' | 'warn';
  /** Parâmetros da ação */
  parameters: Record<string, unknown>;
  /** Mensagem associada */
  message: string;
}

/** Critérios de avaliação */
export interface EvaluationCriteria {
  /** Nome do critério */
  name: string;
  /** Peso do critério */
  weight: number;
  /** Subcritérios */
  subcriteria: SubCriterion[];
  /** Método de avaliação */
  evaluationMethod: EvaluationMethod;
}

/** Subcritério */
export interface SubCriterion {
  /** Nome */
  name: string;
  /** Peso */
  weight: number;
  /** Descrição */
  description: string;
  /** Métrica associada */
  metric: string;
}

/** Método de avaliação */
export type EvaluationMethod = 
  | 'checklist'
  | 'scoring'
  | 'weighted_average'
  | 'fuzzy_logic'
  | 'machine_learning'
  | 'rule_based';

/** Configuração de output */
export interface OutputConfig {
  /** Formato do relatório */
  reportFormat: 'json' | 'pdf' | 'html' | 'xml';
  /** Se deve incluir detalhes */
  includeDetails: boolean;
  /** Se deve incluir recomendações */
  includeRecommendations: boolean;
  /** Se deve incluir gráficos */
  includeCharts: boolean;
  /** Idioma do output */
  language: string;
}

/** Resultados da análise */
export interface AnalysisResults {
  /** Score geral */
  overallScore: number;
  /** Scores por categoria */
  categoryScores: CategoryScore[];
  /** Problemas encontrados */
  issues: AnalysisIssue[];
  /** Recomendações */
  recommendations: Recommendation[];
  /** Estatísticas */
  statistics: AnalysisStatistics;
  /** Resumo executivo */
  executiveSummary: ExecutiveSummary;
  /** Dados brutos */
  rawData?: Record<string, unknown>;
}

/** Score por categoria */
export interface CategoryScore {
  /** Nome da categoria */
  category: string;
  /** Score (0-100) */
  score: number;
  /** Peso da categoria */
  weight: number;
  /** Status */
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  /** Detalhes do score */
  details: ScoreDetail[];
}

/** Detalhe do score */
export interface ScoreDetail {
  /** Critério avaliado */
  criterion: string;
  /** Score do critério */
  score: number;
  /** Peso */
  weight: number;
  /** Observações */
  notes?: string;
}

/** Problema encontrado na análise */
export interface AnalysisIssue {
  /** ID único do problema */
  id: string;
  /** Tipo do problema */
  type: IssueType;
  /** Severidade */
  severity: Severity;
  /** Categoria */
  category: string;
  /** Título do problema */
  title: string;
  /** Descrição detalhada */
  description: string;
  /** Localização no documento */
  location?: IssueLocation;
  /** Regra que detectou o problema */
  ruleId?: string;
  /** Impacto estimado */
  impact: ImpactLevel;
  /** Esforço para correção */
  effort: EffortLevel;
  /** Status do problema */
  status: IssueStatus;
  /** Ações sugeridas */
  suggestedActions: string[];
}

/** Tipos de problema */
export type IssueType = 
  | 'missing_information'
  | 'incorrect_format'
  | 'inconsistency'
  | 'compliance_violation'
  | 'legal_issue'
  | 'technical_error'
  | 'quality_issue'
  | 'best_practice_violation';

/** Localização do problema */
export interface IssueLocation {
  /** Página */
  page?: number;
  /** Seção */
  section?: string;
  /** Parágrafo */
  paragraph?: number;
  /** Linha */
  line?: number;
  /** Campo específico */
  field?: string;
}

/** Nível de impacto */
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

/** Nível de esforço */
export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'extensive';

/** Status do problema */
export type IssueStatus = 
  | 'open'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'wont_fix'
  | 'duplicate';

/** Recomendação */
export interface Recommendation {
  /** ID da recomendação */
  id: string;
  /** Tipo */
  type: RecommendationType;
  /** Prioridade */
  priority: Priority;
  /** Título */
  title: string;
  /** Descrição */
  description: string;
  /** Benefícios esperados */
  benefits: string[];
  /** Passos para implementação */
  implementationSteps: string[];
  /** Recursos necessários */
  requiredResources: string[];
  /** Tempo estimado */
  estimatedTime: string;
  /** Custo estimado */
  estimatedCost?: number;
  /** ROI esperado */
  expectedROI?: number;
}

/** Tipos de recomendação */
export type RecommendationType = 
  | 'improvement'
  | 'correction'
  | 'optimization'
  | 'compliance'
  | 'best_practice'
  | 'risk_mitigation';

/** Estatísticas da análise */
export interface AnalysisStatistics {
  /** Total de regras verificadas */
  totalRulesChecked: number;
  /** Regras que passaram */
  rulesPassed: number;
  /** Regras que falharam */
  rulesFailed: number;
  /** Total de problemas encontrados */
  totalIssues: number;
  /** Problemas por severidade */
  issuesBySeverity: Record<Severity, number>;
  /** Problemas por categoria */
  issuesByCategory: Record<string, number>;
  /** Taxa de conformidade */
  complianceRate: number;
  /** Score médio */
  averageScore: number;
}

/** Resumo executivo */
export interface ExecutiveSummary {
  /** Avaliação geral */
  overallAssessment: string;
  /** Principais achados */
  keyFindings: string[];
  /** Principais riscos */
  keyRisks: string[];
  /** Recomendações prioritárias */
  priorityRecommendations: string[];
  /** Próximos passos */
  nextSteps: string[];
  /** Conclusão */
  conclusion: string;
}

/** Métricas de performance da análise */
export interface AnalysisMetrics {
  /** Tempo total de processamento */
  totalProcessingTime: number;
  /** Tempo por etapa */
  processingTimeByStage: Record<string, number>;
  /** Uso de memória */
  memoryUsage: number;
  /** Uso de CPU */
  cpuUsage: number;
  /** Número de regras processadas */
  rulesProcessed: number;
  /** Taxa de processamento */
  processingRate: number;
  /** Eficiência */
  efficiency: number;
}

/** Erro de análise */
export interface AnalysisError {
  /** Código do erro */
  code: string;
  /** Mensagem */
  message: string;
  /** Etapa onde ocorreu */
  stage: string;
  /** Stack trace */
  stackTrace?: string;
  /** Contexto do erro */
  context?: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
}

/** Aviso de análise */
export interface AnalysisWarning {
  /** Código do aviso */
  code: string;
  /** Mensagem */
  message: string;
  /** Severidade */
  severity: Severity;
  /** Contexto */
  context?: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
}

/** Comparação entre análises */
export interface AnalysisComparison {
  /** Análise base */
  baseAnalysis: string;
  /** Análise comparada */
  comparedAnalysis: string;
  /** Diferenças encontradas */
  differences: AnalysisDifference[];
  /** Melhorias identificadas */
  improvements: string[];
  /** Regressões identificadas */
  regressions: string[];
  /** Score de similaridade */
  similarityScore: number;
}

/** Diferença entre análises */
export interface AnalysisDifference {
  /** Campo que difere */
  field: string;
  /** Valor na análise base */
  baseValue: unknown;
  /** Valor na análise comparada */
  comparedValue: unknown;
  /** Tipo de diferença */
  type: 'added' | 'removed' | 'modified';
  /** Impacto da diferença */
  impact: ImpactLevel;
}