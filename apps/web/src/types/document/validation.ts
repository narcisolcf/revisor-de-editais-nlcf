/**
 * Tipos para validação de documentos
 */

import { Severity } from '../core/common';
import { DocumentType } from './base';

/** Resultado completo de validação */
export interface DocumentValidationResult {
  /** Se o documento é válido */
  isValid: boolean;
  /** Score geral de validação (0-100) */
  overallScore: number;
  /** Validações realizadas */
  validations: ValidationCheck[];
  /** Erros encontrados */
  errors: ValidationError[];
  /** Avisos gerados */
  warnings: ValidationWarning[];
  /** Informações adicionais */
  info: ValidationInfo[];
  /** Estatísticas da validação */
  statistics: ValidationStatistics;
  /** Tempo de processamento */
  processingTime: number;
  /** Versão do validador */
  validatorVersion: string;
}

/** Verificação de validação */
export interface ValidationCheck {
  /** ID da verificação */
  id: string;
  /** Nome da verificação */
  name: string;
  /** Categoria */
  category: ValidationCategory;
  /** Status da verificação */
  status: ValidationStatus;
  /** Score da verificação (0-100) */
  score: number;
  /** Peso da verificação */
  weight: number;
  /** Descrição */
  description: string;
  /** Detalhes do resultado */
  details: ValidationDetail[];
  /** Tempo de execução */
  executionTime: number;
}

/** Categorias de validação */
export type ValidationCategory = 
  | 'format'          // Formato do arquivo
  | 'structure'       // Estrutura do documento
  | 'content'         // Conteúdo
  | 'metadata'        // Metadados
  | 'security'        // Segurança
  | 'compliance'      // Conformidade
  | 'quality'         // Qualidade
  | 'accessibility'   // Acessibilidade
  | 'integrity';      // Integridade

/** Status de validação */
export type ValidationStatus = 
  | 'passed'          // Passou na validação
  | 'failed'          // Falhou na validação
  | 'warning'         // Passou com avisos
  | 'skipped'         // Pulada
  | 'error';          // Erro na execução

/** Detalhe de validação */
export interface ValidationDetail {
  /** Aspecto verificado */
  aspect: string;
  /** Valor encontrado */
  foundValue: unknown;
  /** Valor esperado */
  expectedValue: unknown;
  /** Se passou na verificação */
  passed: boolean;
  /** Observações */
  notes?: string;
}

/** Erro de validação */
export interface ValidationError {
  /** Código do erro */
  code: string;
  /** Mensagem de erro */
  message: string;
  /** Severidade */
  severity: Severity;
  /** Categoria */
  category: ValidationCategory;
  /** Campo relacionado */
  field?: string;
  /** Valor que causou o erro */
  value?: unknown;
  /** Localização no documento */
  location?: ErrorLocation;
  /** Regra que foi violada */
  rule?: string;
  /** Sugestões de correção */
  suggestions: string[];
  /** Se é um erro bloqueante */
  blocking: boolean;
}

/** Aviso de validação */
export interface ValidationWarning {
  /** Código do aviso */
  code: string;
  /** Mensagem */
  message: string;
  /** Categoria */
  category: ValidationCategory;
  /** Campo relacionado */
  field?: string;
  /** Localização */
  location?: ErrorLocation;
  /** Recomendações */
  recommendations: string[];
  /** Se pode ser ignorado */
  ignorable: boolean;
}

/** Informação de validação */
export interface ValidationInfo {
  /** Código da informação */
  code: string;
  /** Mensagem */
  message: string;
  /** Categoria */
  category: ValidationCategory;
  /** Dados adicionais */
  data?: Record<string, unknown>;
}

/** Localização de erro */
export interface ErrorLocation {
  /** Página (para PDFs) */
  page?: number;
  /** Linha */
  line?: number;
  /** Coluna */
  column?: number;
  /** Seção do documento */
  section?: string;
  /** Elemento específico */
  element?: string;
  /** XPath (para XMLs) */
  xpath?: string;
}

/** Estatísticas de validação */
export interface ValidationStatistics {
  /** Total de verificações */
  totalChecks: number;
  /** Verificações que passaram */
  passedChecks: number;
  /** Verificações que falharam */
  failedChecks: number;
  /** Verificações com aviso */
  warningChecks: number;
  /** Verificações puladas */
  skippedChecks: number;
  /** Taxa de sucesso */
  successRate: number;
  /** Distribuição por categoria */
  categoryDistribution: Record<ValidationCategory, CategoryStats>;
}

/** Estatísticas por categoria */
export interface CategoryStats {
  /** Total na categoria */
  total: number;
  /** Passou */
  passed: number;
  /** Falhou */
  failed: number;
  /** Avisos */
  warnings: number;
  /** Score médio */
  averageScore: number;
}

/** Configuração de validação */
export interface ValidationConfig {
  /** Tipo de documento */
  documentType: DocumentType;
  /** Nível de rigor */
  strictness: ValidationStrictness;
  /** Categorias a serem validadas */
  categories: ValidationCategory[];
  /** Regras específicas */
  rules: ValidationRule[];
  /** Configurações por categoria */
  categoryConfigs: Record<ValidationCategory, CategoryConfig>;
  /** Se deve parar no primeiro erro */
  stopOnFirstError: boolean;
  /** Timeout em segundos */
  timeout: number;
  /** Configurações customizadas */
  custom?: Record<string, unknown>;
}

/** Nível de rigor da validação */
export type ValidationStrictness = 
  | 'lenient'         // Permissivo
  | 'standard'        // Padrão
  | 'strict'          // Rigoroso
  | 'pedantic';       // Muito rigoroso

/** Regra de validação */
export interface ValidationRule {
  /** ID da regra */
  id: string;
  /** Nome da regra */
  name: string;
  /** Descrição */
  description: string;
  /** Categoria */
  category: ValidationCategory;
  /** Severidade */
  severity: Severity;
  /** Condições da regra */
  conditions: RuleCondition[];
  /** Ações quando a regra falha */
  onFailure: FailureAction[];
  /** Se a regra está ativa */
  enabled: boolean;
  /** Peso da regra */
  weight: number;
  /** Dependências */
  dependencies: string[];
}

/** Condição de regra */
export interface RuleCondition {
  /** Campo a ser verificado */
  field: string;
  /** Operador de comparação */
  operator: ConditionOperator;
  /** Valor esperado */
  value: unknown;
  /** Se é case sensitive */
  caseSensitive?: boolean;
  /** Expressão regular (se aplicável) */
  regex?: string;
}

/** Operadores de condição */
export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'matches_regex'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in_list'
  | 'not_in_list'
  | 'exists'
  | 'not_exists'
  | 'is_empty'
  | 'is_not_empty';

/** Ação em caso de falha */
export interface FailureAction {
  /** Tipo de ação */
  type: FailureActionType;
  /** Parâmetros da ação */
  parameters: Record<string, unknown>;
  /** Mensagem associada */
  message: string;
}

/** Tipos de ação de falha */
export type FailureActionType = 
  | 'error'           // Gerar erro
  | 'warning'         // Gerar aviso
  | 'info'            // Gerar informação
  | 'suggest'         // Sugerir correção
  | 'auto_fix'        // Tentar correção automática
  | 'skip'            // Pular validação
  | 'stop';           // Parar validação

/** Configuração por categoria */
export interface CategoryConfig {
  /** Se a categoria está habilitada */
  enabled: boolean;
  /** Peso da categoria */
  weight: number;
  /** Configurações específicas */
  settings: Record<string, unknown>;
  /** Regras customizadas */
  customRules: ValidationRule[];
}

/** Perfil de validação */
export interface ValidationProfile {
  /** ID do perfil */
  id: string;
  /** Nome do perfil */
  name: string;
  /** Descrição */
  description: string;
  /** Tipos de documento aplicáveis */
  applicableTypes: DocumentType[];
  /** Configuração base */
  baseConfig: ValidationConfig;
  /** Se é o perfil padrão */
  isDefault: boolean;
  /** Versão do perfil */
  version: string;
  /** Criado por */
  createdBy: string;
  /** Data de criação */
  createdAt: Date;
}

/** Contexto de validação */
export interface ValidationContext {
  /** Documento sendo validado */
  documentId: string;
  /** Tipo do documento */
  documentType: DocumentType;
  /** Metadados do documento */
  metadata: Record<string, unknown>;
  /** Contexto do usuário */
  userContext: UserContext;
  /** Contexto da aplicação */
  applicationContext: ApplicationContext;
  /** Dados adicionais */
  additionalData?: Record<string, unknown>;
}

/** Contexto do usuário */
export interface UserContext {
  /** ID do usuário */
  userId: string;
  /** Permissões do usuário */
  permissions: string[];
  /** Preferências */
  preferences: Record<string, unknown>;
  /** Configurações de validação */
  validationSettings?: ValidationConfig;
}

/** Contexto da aplicação */
export interface ApplicationContext {
  /** Versão da aplicação */
  version: string;
  /** Ambiente (dev, staging, prod) */
  environment: string;
  /** Configurações globais */
  globalSettings: Record<string, unknown>;
  /** Features habilitadas */
  enabledFeatures: string[];
}

/** Relatório de validação */
export interface ValidationReport {
  /** Resultado da validação */
  result: DocumentValidationResult;
  /** Resumo executivo */
  summary: ValidationSummary;
  /** Recomendações */
  recommendations: ValidationRecommendation[];
  /** Próximos passos */
  nextSteps: string[];
  /** Anexos */
  attachments: ReportAttachment[];
  /** Metadados do relatório */
  metadata: ReportMetadata;
}

/** Resumo de validação */
export interface ValidationSummary {
  /** Status geral */
  overallStatus: 'passed' | 'failed' | 'warning';
  /** Score geral */
  overallScore: number;
  /** Principais problemas */
  keyIssues: string[];
  /** Principais sucessos */
  keySuccesses: string[];
  /** Estatísticas resumidas */
  stats: SummaryStats;
}

/** Estatísticas resumidas */
export interface SummaryStats {
  /** Total de verificações */
  totalChecks: number;
  /** Erros críticos */
  criticalErrors: number;
  /** Erros */
  errors: number;
  /** Avisos */
  warnings: number;
  /** Taxa de conformidade */
  complianceRate: number;
}

/** Recomendação de validação */
export interface ValidationRecommendation {
  /** ID da recomendação */
  id: string;
  /** Prioridade */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Título */
  title: string;
  /** Descrição */
  description: string;
  /** Ações recomendadas */
  actions: string[];
  /** Benefícios esperados */
  benefits: string[];
  /** Esforço estimado */
  effort: 'low' | 'medium' | 'high';
}

/** Anexo do relatório */
export interface ReportAttachment {
  /** Nome do anexo */
  name: string;
  /** Tipo do anexo */
  type: 'log' | 'data' | 'chart' | 'document';
  /** URL ou conteúdo */
  content: string;
  /** Tamanho em bytes */
  size: number;
  /** Formato */
  format: string;
}

/** Metadados do relatório */
export interface ReportMetadata {
  /** Data de geração */
  generatedAt: Date;
  /** Versão do gerador */
  generatorVersion: string;
  /** Configuração usada */
  configUsed: ValidationConfig;
  /** Tempo total de processamento */
  totalProcessingTime: number;
  /** Hash do documento validado */
  documentHash: string;
}