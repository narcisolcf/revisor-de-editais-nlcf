/**
 * Tipos para classificação de documentos
 */

import { DocumentType } from './base';

/** Sistema de classificação hierárquica */
export interface ClassificationHierarchy {
  /** Nível raiz - tipo principal */
  type: DocumentType;
  /** Categorias do tipo */
  categories: ClassificationCategory[];
  /** Metadados do tipo */
  metadata: TypeMetadata;
}

/** Categoria de classificação */
export interface ClassificationCategory {
  /** ID único da categoria */
  id: string;
  /** Nome da categoria */
  name: string;
  /** Descrição */
  description: string;
  /** Subcategorias */
  subcategories: ClassificationSubcategory[];
  /** Regras de identificação */
  identificationRules: IdentificationRule[];
  /** Campos obrigatórios para esta categoria */
  requiredFields: string[];
  /** Campos opcionais */
  optionalFields: string[];
  /** Se está ativa */
  isActive: boolean;
  /** Ordem de exibição */
  displayOrder: number;
}

/** Subcategoria de classificação */
export interface ClassificationSubcategory {
  /** ID único da subcategoria */
  id: string;
  /** Nome da subcategoria */
  name: string;
  /** Descrição */
  description: string;
  /** Regras específicas */
  rules: IdentificationRule[];
  /** Campos específicos */
  specificFields: string[];
  /** Templates associados */
  templates: string[];
  /** Se está ativa */
  isActive: boolean;
}

/** Regra de identificação */
export interface IdentificationRule {
  /** ID da regra */
  id: string;
  /** Nome da regra */
  name: string;
  /** Tipo de regra */
  type: RuleType;
  /** Condições da regra */
  conditions: RuleCondition[];
  /** Peso da regra (0-1) */
  weight: number;
  /** Se a regra é obrigatória */
  required: boolean;
  /** Descrição da regra */
  description?: string;
}

/** Tipos de regra */
export type RuleType = 
  | 'text_pattern'     // Padrão de texto
  | 'keyword_match'    // Correspondência de palavras-chave
  | 'structure'        // Estrutura do documento
  | 'metadata'         // Metadados do arquivo
  | 'content_analysis' // Análise de conteúdo
  | 'format'           // Formato do arquivo
  | 'size'             // Tamanho do arquivo
  | 'custom';          // Regra customizada

/** Condição de regra */
export interface RuleCondition {
  /** Campo a ser verificado */
  field: string;
  /** Operador de comparação */
  operator: ConditionOperator;
  /** Valor esperado */
  value: unknown;
  /** Se a condição é case sensitive */
  caseSensitive?: boolean;
  /** Peso desta condição */
  weight?: number;
}

/** Operadores de condição */
export type ConditionOperator = 
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'regex_match'
  | 'greater_than'
  | 'less_than'
  | 'in_range'
  | 'exists'
  | 'not_exists';

/** Metadados de tipo de documento */
export interface TypeMetadata {
  /** Descrição do tipo */
  description: string;
  /** Exemplos de documentos */
  examples: string[];
  /** Características típicas */
  characteristics: string[];
  /** Campos comuns */
  commonFields: FieldDefinition[];
  /** Validações específicas */
  validations: ValidationRule[];
  /** Templates disponíveis */
  templates: TemplateDefinition[];
}

/** Definição de campo */
export interface FieldDefinition {
  /** Nome do campo */
  name: string;
  /** Tipo do campo */
  type: FieldType;
  /** Se é obrigatório */
  required: boolean;
  /** Valor padrão */
  defaultValue?: unknown;
  /** Validações do campo */
  validations: FieldValidation[];
  /** Opções (para campos de seleção) */
  options?: FieldOption[];
  /** Descrição do campo */
  description?: string;
  /** Placeholder */
  placeholder?: string;
}

/** Tipos de campo */
export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'file'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'percentage';

/** Validação de campo */
export interface FieldValidation {
  /** Tipo de validação */
  type: ValidationType;
  /** Parâmetros da validação */
  params?: Record<string, unknown>;
  /** Mensagem de erro */
  errorMessage: string;
}

/** Tipos de validação */
export type ValidationType = 
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'pattern'
  | 'email'
  | 'url'
  | 'numeric'
  | 'date'
  | 'custom';

/** Opção de campo */
export interface FieldOption {
  /** Valor da opção */
  value: string;
  /** Label da opção */
  label: string;
  /** Se está ativa */
  active: boolean;
  /** Ordem de exibição */
  order: number;
}

/** Regra de validação */
export interface ValidationRule {
  /** ID da regra */
  id: string;
  /** Nome da regra */
  name: string;
  /** Função de validação */
  validator: string; // Nome da função ou código
  /** Parâmetros */
  params: Record<string, unknown>;
  /** Mensagem de erro */
  errorMessage: string;
  /** Severidade */
  severity: 'error' | 'warning' | 'info';
}

/** Definição de template */
export interface TemplateDefinition {
  /** ID do template */
  id: string;
  /** Nome do template */
  name: string;
  /** Descrição */
  description: string;
  /** Campos do template */
  fields: FieldDefinition[];
  /** Layout do template */
  layout: TemplateLayout;
  /** Se está ativo */
  isActive: boolean;
  /** Versão do template */
  version: string;
}

/** Layout de template */
export interface TemplateLayout {
  /** Seções do layout */
  sections: LayoutSection[];
  /** Configurações de estilo */
  styling: LayoutStyling;
}

/** Seção de layout */
export interface LayoutSection {
  /** ID da seção */
  id: string;
  /** Título da seção */
  title: string;
  /** Campos da seção */
  fields: string[];
  /** Configurações da seção */
  config: SectionConfig;
}

/** Configurações de seção */
export interface SectionConfig {
  /** Número de colunas */
  columns: number;
  /** Se é colapsável */
  collapsible: boolean;
  /** Se inicia colapsada */
  collapsed: boolean;
  /** Ordem de exibição */
  order: number;
}

/** Estilização de layout */
export interface LayoutStyling {
  /** Tema */
  theme: 'light' | 'dark' | 'auto';
  /** Cores personalizadas */
  colors?: Record<string, string>;
  /** Fontes */
  fonts?: Record<string, string>;
  /** Espaçamentos */
  spacing?: Record<string, number>;
}

/** Resultado de classificação */
export interface ClassificationResult {
  /** Classificação principal */
  primary: ClassificationMatch;
  /** Classificações alternativas */
  alternatives: ClassificationMatch[];
  /** Confiança geral */
  overallConfidence: number;
  /** Características detectadas */
  detectedFeatures: DetectedFeature[];
  /** Tempo de processamento */
  processingTime: number;
  /** Versão do classificador */
  classifierVersion: string;
}

/** Correspondência de classificação */
export interface ClassificationMatch {
  /** Tipo identificado */
  type: DocumentType;
  /** Categoria */
  category?: string;
  /** Subcategoria */
  subcategory?: string;
  /** Confiança (0-1) */
  confidence: number;
  /** Regras que corresponderam */
  matchedRules: RuleMatch[];
  /** Score detalhado */
  score: ClassificationScore;
}

/** Correspondência de regra */
export interface RuleMatch {
  /** ID da regra */
  ruleId: string;
  /** Nome da regra */
  ruleName: string;
  /** Score da regra */
  score: number;
  /** Condições que corresponderam */
  matchedConditions: ConditionMatch[];
}

/** Correspondência de condição */
export interface ConditionMatch {
  /** Campo verificado */
  field: string;
  /** Valor encontrado */
  foundValue: unknown;
  /** Valor esperado */
  expectedValue: unknown;
  /** Score da condição */
  score: number;
}

/** Score de classificação */
export interface ClassificationScore {
  /** Score total */
  total: number;
  /** Score por categoria */
  byCategory: Record<string, number>;
  /** Score por tipo de regra */
  byRuleType: Record<RuleType, number>;
  /** Fatores de confiança */
  confidenceFactors: ConfidenceFactor[];
}

/** Fator de confiança */
export interface ConfidenceFactor {
  /** Nome do fator */
  name: string;
  /** Valor do fator */
  value: number;
  /** Peso do fator */
  weight: number;
  /** Descrição */
  description: string;
}

/** Característica detectada */
export interface DetectedFeature {
  /** Nome da característica */
  name: string;
  /** Valor detectado */
  value: unknown;
  /** Confiança da detecção */
  confidence: number;
  /** Localização no documento */
  location?: FeatureLocation;
}

/** Localização de característica */
export interface FeatureLocation {
  /** Página (para PDFs) */
  page?: number;
  /** Posição no texto */
  textPosition?: TextPosition;
  /** Coordenadas (para imagens) */
  coordinates?: BoundingBox;
}

/** Posição no texto */
export interface TextPosition {
  /** Índice de início */
  start: number;
  /** Índice de fim */
  end: number;
  /** Linha */
  line?: number;
  /** Coluna */
  column?: number;
}

/** Caixa delimitadora */
export interface BoundingBox {
  /** Coordenada X */
  x: number;
  /** Coordenada Y */
  y: number;
  /** Largura */
  width: number;
  /** Altura */
  height: number;
}

/** Configuração de classificação */
export interface ClassificationConfig {
  /** Se deve usar classificação automática */
  autoClassify: boolean;
  /** Threshold mínimo de confiança */
  minConfidence: number;
  /** Número máximo de alternativas */
  maxAlternatives: number;
  /** Se deve usar cache */
  useCache: boolean;
  /** Timeout em segundos */
  timeout: number;
  /** Modelos a serem usados */
  models: string[];
}