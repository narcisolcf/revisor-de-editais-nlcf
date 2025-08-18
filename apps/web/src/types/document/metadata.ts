/**
 * Tipos para metadados de documentos
 */

import { BaseEntity } from '../core/base';
import { DocumentType } from './base';

/** Metadados completos de um documento */
export interface DocumentMetadata extends BaseEntity {
  /** ID do documento */
  documentId: string;
  /** Metadados básicos do arquivo */
  file: FileMetadata;
  /** Metadados de conteúdo */
  content: ContentMetadata;
  /** Metadados técnicos */
  technical: TechnicalMetadata;
  /** Metadados de negócio */
  business: BusinessMetadata;
  /** Metadados de processamento */
  processing: ProcessingMetadata;
  /** Metadados customizados */
  custom: Record<string, unknown>;
  /** Histórico de alterações */
  changeHistory: MetadataChange[];
}

/** Metadados básicos do arquivo */
export interface FileMetadata {
  /** Nome original do arquivo */
  originalName: string;
  /** Nome atual do arquivo */
  currentName: string;
  /** Extensão do arquivo */
  extension: string;
  /** Tipo MIME */
  mimeType: string;
  /** Tamanho em bytes */
  size: number;
  /** Hash MD5 */
  md5Hash: string;
  /** Hash SHA256 */
  sha256Hash: string;
  /** Data de criação do arquivo original */
  originalCreatedAt?: Date;
  /** Data de modificação do arquivo original */
  originalModifiedAt?: Date;
  /** Atributos do sistema de arquivos */
  fileAttributes: FileAttributes;
}

/** Atributos do arquivo */
export interface FileAttributes {
  /** Se é somente leitura */
  readonly: boolean;
  /** Se está oculto */
  hidden: boolean;
  /** Se é um arquivo de sistema */
  system: boolean;
  /** Permissões (formato Unix) */
  permissions?: string;
  /** Proprietário */
  owner?: string;
  /** Grupo */
  group?: string;
}

/** Metadados de conteúdo */
export interface ContentMetadata {
  /** Idioma principal do documento */
  language: string;
  /** Idiomas detectados */
  detectedLanguages: LanguageDetection[];
  /** Encoding do texto */
  encoding: string;
  /** Número total de caracteres */
  characterCount: number;
  /** Número de palavras */
  wordCount: number;
  /** Número de parágrafos */
  paragraphCount: number;
  /** Número de páginas */
  pageCount?: number;
  /** Palavras-chave extraídas */
  keywords: Keyword[];
  /** Entidades nomeadas */
  namedEntities: NamedEntity[];
  /** Tópicos identificados */
  topics: Topic[];
  /** Resumo automático */
  summary?: string;
  /** Sentimento geral */
  sentiment?: SentimentAnalysis;
  /** Estatísticas de legibilidade */
  readability?: ReadabilityStats;
}

/** Detecção de idioma */
export interface LanguageDetection {
  /** Código do idioma (ISO 639-1) */
  languageCode: string;
  /** Nome do idioma */
  languageName: string;
  /** Confiança da detecção (0-1) */
  confidence: number;
  /** Porcentagem do texto neste idioma */
  percentage: number;
}

/** Palavra-chave extraída */
export interface Keyword {
  /** Termo */
  term: string;
  /** Frequência no documento */
  frequency: number;
  /** Score de relevância */
  relevanceScore: number;
  /** Posições no texto */
  positions: TextPosition[];
  /** Categoria da palavra-chave */
  category?: string;
}

/** Posição no texto */
export interface TextPosition {
  /** Índice de início */
  start: number;
  /** Índice de fim */
  end: number;
  /** Página (se aplicável) */
  page?: number;
  /** Linha */
  line?: number;
}

/** Entidade nomeada */
export interface NamedEntity {
  /** Texto da entidade */
  text: string;
  /** Tipo da entidade */
  type: EntityType;
  /** Confiança da identificação */
  confidence: number;
  /** Posições no texto */
  positions: TextPosition[];
  /** Informações adicionais */
  metadata?: Record<string, unknown>;
}

/** Tipos de entidade */
export type EntityType = 
  | 'PERSON'          // Pessoa
  | 'ORGANIZATION'    // Organização
  | 'LOCATION'        // Localização
  | 'DATE'            // Data
  | 'TIME'            // Hora
  | 'MONEY'           // Valor monetário
  | 'PERCENTAGE'      // Porcentagem
  | 'EMAIL'           // Email
  | 'PHONE'           // Telefone
  | 'URL'             // URL
  | 'DOCUMENT_NUMBER' // Número de documento
  | 'LAW_REFERENCE'   // Referência legal
  | 'CUSTOM';         // Customizado

/** Tópico identificado */
export interface Topic {
  /** Nome do tópico */
  name: string;
  /** Score de relevância */
  relevanceScore: number;
  /** Palavras-chave do tópico */
  keywords: string[];
  /** Categoria do tópico */
  category?: string;
  /** Confiança da identificação */
  confidence: number;
}

/** Análise de sentimento */
export interface SentimentAnalysis {
  /** Score geral (-1 a 1) */
  overallScore: number;
  /** Classificação */
  classification: 'negative' | 'neutral' | 'positive';
  /** Confiança da análise */
  confidence: number;
  /** Sentimentos por seção */
  sectionSentiments?: SectionSentiment[];
}

/** Sentimento por seção */
export interface SectionSentiment {
  /** Identificador da seção */
  sectionId: string;
  /** Nome da seção */
  sectionName: string;
  /** Score da seção */
  score: number;
  /** Classificação da seção */
  classification: 'negative' | 'neutral' | 'positive';
}

/** Estatísticas de legibilidade */
export interface ReadabilityStats {
  /** Índice Flesch */
  fleschScore: number;
  /** Nível de escolaridade Flesch-Kincaid */
  fleschKincaidGrade: number;
  /** Índice de facilidade de leitura */
  readingEase: ReadingEaseLevel;
  /** Palavras por sentença (média) */
  averageWordsPerSentence: number;
  /** Sílabas por palavra (média) */
  averageSyllablesPerWord: number;
  /** Sentenças complexas (%) */
  complexSentencesPercentage: number;
}

/** Nível de facilidade de leitura */
export type ReadingEaseLevel = 
  | 'very_easy'
  | 'easy'
  | 'fairly_easy'
  | 'standard'
  | 'fairly_difficult'
  | 'difficult'
  | 'very_difficult';

/** Metadados técnicos */
export interface TechnicalMetadata {
  /** Informações do criador */
  creator: CreatorInfo;
  /** Aplicativo usado para criar */
  application?: ApplicationInfo;
  /** Versão do formato */
  formatVersion?: string;
  /** Propriedades específicas do formato */
  formatProperties: Record<string, unknown>;
  /** Informações de segurança */
  security: SecurityInfo;
  /** Informações de compressão */
  compression?: CompressionInfo;
  /** Metadados EXIF (para imagens) */
  exif?: ExifData;
  /** Informações de OCR */
  ocr?: OcrInfo;
}

/** Informações do criador */
export interface CreatorInfo {
  /** Nome do autor */
  author?: string;
  /** Título */
  title?: string;
  /** Assunto */
  subject?: string;
  /** Palavras-chave do criador */
  keywords?: string;
  /** Comentários */
  comments?: string;
  /** Empresa */
  company?: string;
  /** Categoria */
  category?: string;
}

/** Informações da aplicação */
export interface ApplicationInfo {
  /** Nome da aplicação */
  name: string;
  /** Versão da aplicação */
  version: string;
  /** Fabricante */
  vendor?: string;
  /** Sistema operacional */
  operatingSystem?: string;
}

/** Informações de segurança */
export interface SecurityInfo {
  /** Se o documento está protegido por senha */
  passwordProtected: boolean;
  /** Se tem assinatura digital */
  digitallySignedAt: boolean;
  /** Se permite cópia */
  allowsCopy: boolean;
  /** Se permite impressão */
  allowsPrint: boolean;
  /** Se permite edição */
  allowsEdit: boolean;
  /** Nível de criptografia */
  encryptionLevel?: string;
  /** Informações do certificado */
  certificateInfo?: CertificateInfo;
}

/** Informações do certificado */
export interface CertificateInfo {
  /** Emissor */
  issuer: string;
  /** Assunto */
  subject: string;
  /** Data de validade */
  validFrom: Date;
  /** Data de expiração */
  validTo: Date;
  /** Número de série */
  serialNumber: string;
  /** Algoritmo de assinatura */
  signatureAlgorithm: string;
}

/** Informações de compressão */
export interface CompressionInfo {
  /** Algoritmo usado */
  algorithm: string;
  /** Taxa de compressão */
  ratio: number;
  /** Tamanho original */
  originalSize: number;
  /** Tamanho comprimido */
  compressedSize: number;
}

/** Dados EXIF */
export interface ExifData {
  /** Câmera/dispositivo */
  camera?: string;
  /** Data da foto */
  dateTime?: Date;
  /** Coordenadas GPS */
  gps?: GpsCoordinates;
  /** Configurações da câmera */
  cameraSettings?: CameraSettings;
  /** Dimensões da imagem */
  dimensions?: ImageDimensions;
}

/** Coordenadas GPS */
export interface GpsCoordinates {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Altitude */
  altitude?: number;
}

/** Configurações da câmera */
export interface CameraSettings {
  /** ISO */
  iso?: number;
  /** Abertura */
  aperture?: string;
  /** Velocidade do obturador */
  shutterSpeed?: string;
  /** Distância focal */
  focalLength?: string;
  /** Flash */
  flash?: boolean;
}

/** Dimensões da imagem */
export interface ImageDimensions {
  /** Largura */
  width: number;
  /** Altura */
  height: number;
  /** Resolução horizontal */
  horizontalResolution?: number;
  /** Resolução vertical */
  verticalResolution?: number;
}

/** Informações de OCR */
export interface OcrInfo {
  /** Engine de OCR usado */
  engine: string;
  /** Versão do engine */
  version: string;
  /** Confiança média */
  averageConfidence: number;
  /** Idiomas detectados */
  detectedLanguages: string[];
  /** Número de palavras reconhecidas */
  recognizedWords: number;
  /** Tempo de processamento */
  processingTime: number;
}

/** Metadados de negócio */
export interface BusinessMetadata {
  /** Tipo de documento */
  documentType: DocumentType;
  /** Classificação específica */
  classification?: string;
  /** Departamento responsável */
  department?: string;
  /** Projeto relacionado */
  project?: string;
  /** Cliente relacionado */
  client?: string;
  /** Número do contrato */
  contractNumber?: string;
  /** Valor do documento */
  documentValue?: number;
  /** Moeda */
  currency?: string;
  /** Data de validade */
  expirationDate?: Date;
  /** Status do documento */
  status?: DocumentStatus;
  /** Prioridade */
  priority?: DocumentPriority;
  /** Tags de negócio */
  businessTags: string[];
  /** Relacionamentos */
  relationships: DocumentRelationship[];
}

/** Status do documento */
export type DocumentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'expired'
  | 'cancelled';

/** Prioridade do documento */
export type DocumentPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'
  | 'critical';

/** Relacionamento entre documentos */
export interface DocumentRelationship {
  /** ID do documento relacionado */
  relatedDocumentId: string;
  /** Tipo de relacionamento */
  relationshipType: RelationshipType;
  /** Descrição do relacionamento */
  description?: string;
  /** Força do relacionamento (0-1) */
  strength: number;
}

/** Tipos de relacionamento */
export type RelationshipType = 
  | 'parent'          // Documento pai
  | 'child'           // Documento filho
  | 'sibling'         // Documento irmão
  | 'reference'       // Referência
  | 'attachment'      // Anexo
  | 'version'         // Versão
  | 'translation'     // Tradução
  | 'summary'         // Resumo
  | 'source'          // Fonte
  | 'derived';        // Derivado

/** Metadados de processamento */
export interface ProcessingMetadata {
  /** Histórico de processamento */
  processingHistory: ProcessingStep[];
  /** Ferramentas utilizadas */
  toolsUsed: ToolInfo[];
  /** Configurações de processamento */
  processingConfig: Record<string, unknown>;
  /** Estatísticas de performance */
  performanceStats: PerformanceStats;
  /** Qualidade do processamento */
  qualityMetrics: QualityMetrics;
}

/** Etapa de processamento */
export interface ProcessingStep {
  /** Nome da etapa */
  stepName: string;
  /** Timestamp de início */
  startTime: Date;
  /** Timestamp de fim */
  endTime: Date;
  /** Status da etapa */
  status: 'success' | 'warning' | 'error';
  /** Detalhes da etapa */
  details: Record<string, unknown>;
  /** Erros ocorridos */
  errors?: string[];
  /** Avisos gerados */
  warnings?: string[];
}

/** Informações da ferramenta */
export interface ToolInfo {
  /** Nome da ferramenta */
  name: string;
  /** Versão */
  version: string;
  /** Configuração usada */
  config: Record<string, unknown>;
  /** Tempo de execução */
  executionTime: number;
}

/** Estatísticas de performance */
export interface PerformanceStats {
  /** Tempo total de processamento */
  totalProcessingTime: number;
  /** Uso de CPU */
  cpuUsage: number;
  /** Uso de memória */
  memoryUsage: number;
  /** Throughput */
  throughput: number;
  /** Latência */
  latency: number;
}

/** Métricas de qualidade */
export interface QualityMetrics {
  /** Score geral de qualidade */
  overallQuality: number;
  /** Precisão */
  accuracy: number;
  /** Completude */
  completeness: number;
  /** Consistência */
  consistency: number;
  /** Confiabilidade */
  reliability: number;
}

/** Mudança nos metadados */
export interface MetadataChange {
  /** Timestamp da mudança */
  timestamp: Date;
  /** Usuário que fez a mudança */
  userId: string;
  /** Campo alterado */
  field: string;
  /** Valor anterior */
  previousValue: unknown;
  /** Novo valor */
  newValue: unknown;
  /** Motivo da mudança */
  reason?: string;
  /** Tipo de operação */
  operation: 'create' | 'update' | 'delete';
}

/** Esquema de metadados */
export interface MetadataSchema {
  /** Versão do esquema */
  version: string;
  /** Campos obrigatórios */
  requiredFields: string[];
  /** Campos opcionais */
  optionalFields: string[];
  /** Validações */
  validations: SchemaValidation[];
  /** Transformações */
  transformations: SchemaTransformation[];
}

/** Validação de esquema */
export interface SchemaValidation {
  /** Campo a validar */
  field: string;
  /** Tipo esperado */
  type: string;
  /** Regras de validação */
  rules: ValidationRule[];
}

/** Transformação de esquema */
export interface SchemaTransformation {
  /** Campo origem */
  sourceField: string;
  /** Campo destino */
  targetField: string;
  /** Função de transformação */
  transformation: string;
  /** Parâmetros */
  parameters: Record<string, unknown>;
}

/** Regra de validação de esquema */
export interface ValidationRule {
  /** Tipo de validação */
  type: string;
  /** Parâmetros */
  parameters: Record<string, unknown>;
  /** Mensagem de erro */
  errorMessage: string;
}