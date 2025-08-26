/**
 * Tipos comuns utilizados em todo o sistema
 */

/** Estados básicos de operações assíncronas */
export type Status = 'idle' | 'loading' | 'success' | 'error';

/** Estados estendidos com mais granularidade */
export type ExtendedStatus = 
  | 'idle'
  | 'pending'
  | 'loading'
  | 'processing'
  | 'success'
  | 'warning'
  | 'error'
  | 'cancelled';

/** Níveis de prioridade */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/** Níveis de severidade */
export type Severity = 'info' | 'warning' | 'error' | 'critical';

/** Tipos de notificação */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/** Direções de ordenação */
export type SortDirection = 'asc' | 'desc';

/** Operadores de filtro */
export type FilterOperator = 
  | 'eq'      // igual
  | 'ne'      // não igual
  | 'gt'      // maior que
  | 'gte'     // maior ou igual
  | 'lt'      // menor que
  | 'lte'     // menor ou igual
  | 'in'      // contido em
  | 'nin'     // não contido em
  | 'like'    // contém (string)
  | 'ilike'   // contém (case insensitive)
  | 'regex';  // expressão regular

/** Interface para filtros genéricos */
export interface Filter<T = unknown> {
  /** Campo a ser filtrado */
  field: string;
  /** Operador de comparação */
  operator: FilterOperator;
  /** Valor para comparação */
  value: T;
}

/** Interface para ordenação */
export interface Sort {
  /** Campo para ordenação */
  field: string;
  /** Direção da ordenação */
  direction: SortDirection;
}

/** Interface para seleção de campos */
export interface FieldSelection {
  /** Campos a serem incluídos */
  include?: string[];
  /** Campos a serem excluídos */
  exclude?: string[];
}

/** Configurações de cache */
export interface CacheConfig {
  /** Tempo de vida em milissegundos */
  ttl: number;
  /** Se deve usar cache stale-while-revalidate */
  staleWhileRevalidate: boolean;
  /** Chave personalizada do cache */
  key?: string;
}

// RetryConfig movido para ./api.ts para evitar conflitos

/** Configurações de timeout */
export interface TimeoutConfig {
  /** Timeout em milissegundos */
  timeout: number;
  /** Se deve cancelar operações em andamento */
  cancelOnTimeout: boolean;
}

/** Coordenadas geográficas */
export interface Coordinates {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Altitude (opcional) */
  altitude?: number;
}

/** Informações de localização */
export interface Location extends Coordinates {
  /** Endereço formatado */
  address?: string;
  /** Cidade */
  city?: string;
  /** Estado/Província */
  state?: string;
  /** País */
  country?: string;
  /** CEP/Código postal */
  postalCode?: string;
}

/** Range de valores numéricos */
export interface NumericRange {
  /** Valor mínimo */
  min: number;
  /** Valor máximo */
  max: number;
}

/** Range de datas */
export interface DateRange {
  /** Data inicial */
  start: Date;
  /** Data final */
  end: Date;
}

/** Configurações de formatação */
export interface FormatConfig {
  /** Locale para formatação */
  locale: string;
  /** Timezone */
  timezone?: string;
  /** Formato de data personalizado */
  dateFormat?: string;
  /** Formato de número personalizado */
  numberFormat?: Intl.NumberFormatOptions;
}

/** Resultado de validação */
export interface ValidationResult {
  /** Se a validação passou */
  isValid: boolean;
  /** Lista de erros encontrados */
  errors: import('./errors').ValidationError[];
  /** Avisos (não impedem a operação) */
  warnings: ValidationWarning[];
}

/** Aviso de validação */
export interface ValidationWarning {
  /** Campo relacionado ao aviso */
  field: string;
  /** Código do aviso */
  code: string;
  /** Mensagem de aviso */
  message: string;
  /** Valor relacionado */
  value?: unknown;
}