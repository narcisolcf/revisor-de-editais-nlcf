/**
 * Tipos fundamentais para entidades base do sistema
 */

/** Interface base para todas as entidades do sistema */
export interface BaseEntity {
  /** Identificador único da entidade */
  id: string;
  /** Data de criação */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt: Date;
}

/** Interface para entidades com controle de versão */
export interface TimestampedEntity extends BaseEntity {
  /** Número da versão para controle de concorrência */
  version: number;
  /** Identificador do usuário que fez a última modificação */
  lastModifiedBy?: string;
}

/** Interface para entidades que podem ser arquivadas */
export interface ArchivableEntity extends BaseEntity {
  /** Indica se a entidade está arquivada */
  isArchived: boolean;
  /** Data de arquivamento */
  archivedAt?: Date;
  /** Usuário que arquivou */
  archivedBy?: string;
}

/** Interface para entidades com metadados */
export interface MetadataEntity extends BaseEntity {
  /** Metadados adicionais em formato chave-valor */
  metadata: Record<string, unknown>;
  /** Tags para categorização */
  tags: string[];
}

/** Interface para entidades auditáveis */
export interface AuditableEntity extends TimestampedEntity {
  /** Histórico de mudanças */
  auditLog: AuditEntry[];
}

/** Entrada do log de auditoria */
export interface AuditEntry {
  /** Timestamp da ação */
  timestamp: Date;
  /** Usuário que executou a ação */
  userId: string;
  /** Tipo de ação executada */
  action: AuditAction;
  /** Dados anteriores (para updates) */
  previousData?: Record<string, unknown>;
  /** Novos dados */
  newData?: Record<string, unknown>;
  /** Comentário sobre a ação */
  comment?: string;
}

/** Tipos de ações de auditoria */
export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'view'
  | 'download'
  | 'share';