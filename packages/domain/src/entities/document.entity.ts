import { z } from 'zod';
import { DomainError } from '../errors/domain.error';
import { DocumentId } from '../value-objects/document-id.vo';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { DocumentType, DocumentStatus, LicitationModality, DocumentMetadata, DocumentClassification } from '../types/document.types';

/**
 * Enums de Domínio para Document
 */

export enum ComplexityLevel {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta'
}

/**
 * Value Objects para Document
 */

/**
 * Schema de validação para Document
 */
const DocumentMetadataSchema = z.object({
  fileName: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileSize: z.number().positive('Tamanho do arquivo deve ser positivo'),
  mimeType: z.string().min(1, 'Tipo MIME é obrigatório'),
  checksum: z.string().optional(),
  ocrConfidence: z.number().min(0).max(1).optional(),
  extractionMethod: z.enum(['ocr', 'text', 'hybrid']).optional(),
  language: z.string().default('pt-BR'),
  organizationId: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.date(),
  processingStartedAt: z.date().optional(),
  processingCompletedAt: z.date().optional()
});

const DocumentClassificationSchema = z.object({
  primaryCategory: z.string().min(1, 'Categoria primária é obrigatória'),
  secondaryCategory: z.string().optional(),
  documentType: z.nativeEnum(DocumentType),
  modality: z.nativeEnum(LicitationModality).optional(),
  complexityLevel: z.nativeEnum(ComplexityLevel),
  confidenceScore: z.number().min(0).max(1).optional()
});

/**
 * Propriedades para criação de Document
 */
export interface CreateDocumentProps {
  title: string;
  content: string;
  classification: DocumentClassification;
  metadata: DocumentMetadata;
  organizationId: string;
  createdBy: string;
  tags?: string[];
  parentDocumentId?: string;
  expiresAt?: Date;
}

/**
 * Propriedades para atualização de Document
 */
export interface UpdateDocumentProps {
  title?: string;
  content?: string;
  classification?: Partial<DocumentClassification>;
  status?: DocumentStatus;
  tags?: string[];
  expiresAt?: Date;
}

/**
 * Entidade Document seguindo princípios de Clean Architecture
 */
export class DocumentEntity {
  private constructor(
    private readonly _id: DocumentId,
    private _title: string,
    private _content: string,
    private _classification: DocumentClassification,
    private readonly _metadata: DocumentMetadata,
    private readonly _organizationId: OrganizationId,
    private readonly _createdBy: UserId,
    private _status: DocumentStatus,
    private readonly _version: number,
    private readonly _parentDocumentId?: DocumentId,
    private _tags: string[] = [],
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
    private _expiresAt?: Date
  ) {}

  /**
   * Factory method para criar nova instância de Document
   */
  public static create(props: CreateDocumentProps): DocumentEntity {
    // Validações de negócio
    if (props.title.trim().length === 0) {
      throw new DomainError('Título do documento não pode estar vazio');
    }

    if (props.content.trim().length === 0) {
      throw new DomainError('Conteúdo do documento não pode estar vazio');
    }

    // Validar metadata e classification usando Zod
    const validatedMetadata = DocumentMetadataSchema.parse(props.metadata);
    const validatedClassification = DocumentClassificationSchema.parse(props.classification);

    // Validar tags
    const tags = props.tags?.filter(tag => tag.trim().length > 0) || [];
    if (tags.length > 20) {
      throw new DomainError('Documento não pode ter mais de 20 tags');
    }

    return new DocumentEntity(
      DocumentId.generate(),
      props.title.trim(),
      props.content,
      validatedClassification,
      validatedMetadata,
      OrganizationId.create(props.organizationId),
      UserId.create(props.createdBy),
      DocumentStatus.DRAFT,
      1,
      props.parentDocumentId ? DocumentId.create(props.parentDocumentId) : undefined,
      tags,
      new Date(),
      new Date(),
      props.expiresAt
    );
  }

  /**
   * Factory method para reconstruir Document a partir de dados persistidos
   */
  public static fromPersistence(data: {
    id: string;
    title: string;
    content: string;
    classification: DocumentClassification;
    metadata: DocumentMetadata;
    organizationId: string;
    createdBy: string;
    status: DocumentStatus;
    version: number;
    parentDocumentId?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
  }): DocumentEntity {
    return new DocumentEntity(
      DocumentId.create(data.id),
      data.title,
      data.content,
      data.classification,
      data.metadata,
      OrganizationId.create(data.organizationId),
      UserId.create(data.createdBy),
      data.status,
      data.version,
      data.parentDocumentId ? DocumentId.create(data.parentDocumentId) : undefined,
      data.tags,
      data.createdAt,
      data.updatedAt,
      data.expiresAt
    );
  }

  /**
   * Atualizar documento
   */
  public update(props: UpdateDocumentProps): void {
    if (props.title !== undefined) {
      if (props.title.trim().length === 0) {
        throw new DomainError('Título do documento não pode estar vazio');
      }
      this._title = props.title.trim();
    }

    if (props.content !== undefined) {
      if (props.content.trim().length === 0) {
        throw new DomainError('Conteúdo do documento não pode estar vazio');
      }
      this._content = props.content;
    }

    if (props.classification !== undefined) {
      // Filtrar propriedades undefined para compatibilidade com exactOptionalPropertyTypes
      const filteredClassification = Object.fromEntries(
        Object.entries(props.classification).filter(([_, value]) => value !== undefined)
      ) as Partial<DocumentClassification>;
      
      this._classification = { ...this._classification, ...filteredClassification };
      DocumentClassificationSchema.parse(this._classification);
    }

    if (props.status !== undefined) {
      this.changeStatus(props.status);
    }

    if (props.tags !== undefined) {
      const validTags = props.tags.filter(tag => tag.trim().length > 0);
      if (validTags.length > 20) {
        throw new DomainError('Documento não pode ter mais de 20 tags');
      }
      this._tags = validTags;
    }

    if (props.expiresAt !== undefined) {
      this._expiresAt = props.expiresAt;
    }

    this._updatedAt = new Date();
  }

  /**
   * Alterar status do documento
   */
  public changeStatus(newStatus: DocumentStatus): void {
    // Regras de negócio para transição de status
    const allowedTransitions: Record<DocumentStatus, DocumentStatus[]> = {
      [DocumentStatus.DRAFT]: [DocumentStatus.UPLOADED],
      [DocumentStatus.UPLOADED]: [DocumentStatus.PROCESSING, DocumentStatus.REJECTED],
      [DocumentStatus.PROCESSING]: [DocumentStatus.ANALYZED, DocumentStatus.REJECTED],
      [DocumentStatus.ANALYZED]: [DocumentStatus.REVIEWED, DocumentStatus.REJECTED],
      [DocumentStatus.REVIEWED]: [DocumentStatus.APPROVED, DocumentStatus.REJECTED],
      [DocumentStatus.APPROVED]: [],
      [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT]
    };

    const allowed = allowedTransitions[this._status];
    if (!allowed.includes(newStatus)) {
      throw new DomainError(
        `Transição de status inválida: ${this._status} → ${newStatus}`
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Verificar se documento está expirado
   */
  public isExpired(): boolean {
    return this._expiresAt ? new Date() > this._expiresAt : false;
  }

  /**
   * Verificar se documento pode ser editado
   */
  public canBeEdited(): boolean {
    return [DocumentStatus.DRAFT, DocumentStatus.REJECTED].includes(this._status) && !this.isExpired();
  }

  /**
   * Getters
   */
  public get id(): DocumentId { return this._id; }
  public get title(): string { return this._title; }
  public get content(): string { return this._content; }
  public get classification(): DocumentClassification { return this._classification; }
  public get metadata(): DocumentMetadata { return this._metadata; }
  public get organizationId(): OrganizationId { return this._organizationId; }
  public get createdBy(): UserId { return this._createdBy; }
  public get status(): DocumentStatus { return this._status; }
  public get version(): number { return this._version; }
  public get parentDocumentId(): DocumentId | undefined { return this._parentDocumentId; }
  public get tags(): string[] { return [...this._tags]; }
  public get createdAt(): Date { return this._createdAt; }
  public get updatedAt(): Date { return this._updatedAt; }
  public get expiresAt(): Date | undefined { return this._expiresAt; }

  /**
   * Converter para objeto simples para persistência
   */
  public toPersistence() {
    return {
      id: this._id.value,
      title: this._title,
      content: this._content,
      classification: this._classification,
      metadata: this._metadata,
      organizationId: this._organizationId.value,
      createdBy: this._createdBy.value,
      status: this._status,
      version: this._version,
      parentDocumentId: this._parentDocumentId?.value,
      tags: this._tags,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      expiresAt: this._expiresAt
    };
  }
}