import { z } from 'zod';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { Email } from '../value-objects/email.vo';
import { Phone } from '../value-objects/phone.vo';
import { Address } from '../value-objects/address.vo';
import { ValidationError } from '../errors/validation.error';
import { BusinessError } from '../errors/business.error';
import { OrganizationType, OrganizationStatus, OrganizationSettings } from '../types/organization.types';

/**
 * Enums de domínio para Organization
 */

export enum OrganizationSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

/**
 * Interfaces para dados da organização
 */
export interface OrganizationContact {
  email: Email;
  phone?: Phone;
  website?: string;
}



export interface OrganizationMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  averageAnalysisTime: number; // em minutos
  lastAnalysisDate?: Date;
}

/**
 * Props para criação da organização
 */
export interface CreateOrganizationProps {
  name: string;
  document: string; // CNPJ
  type: OrganizationType;
  size: OrganizationSize;
  contact: OrganizationContact;
  address: Address;
  description?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Props para atualização da organização
 */
export interface UpdateOrganizationProps {
  name?: string;
  type?: OrganizationType;
  size?: OrganizationSize;
  contact?: Partial<OrganizationContact>;
  address?: Address;
  description?: string;
  settings?: Partial<OrganizationSettings>;
}

/**
 * Entidade Organization seguindo princípios da Clean Architecture
 */
export class OrganizationEntity {
  private constructor(
    private readonly _id: OrganizationId,
    private _name: string,
    private readonly _document: string,
    private _type: OrganizationType,
    private _size: OrganizationSize,
    private _contact: OrganizationContact,
    private _address: Address,
    private _description: string | undefined,
    private _status: OrganizationStatus,
    private _settings: OrganizationSettings,
    private _metrics: OrganizationMetrics,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {}

  /**
   * Schema de validação para CNPJ
   */
  private static readonly cnpjSchema = z.string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve ter formato 00.000.000/0000-00')
    .refine((cnpj) => {
      // Validação básica de CNPJ
      const digits = cnpj.replace(/\D/g, '');
      if (digits.length !== 14) return false;
      
      // Verificar se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(digits)) return false;
      
      return true; // Aqui poderia ter validação completa do dígito verificador
    }, 'CNPJ inválido');

  /**
   * Schema de validação para criação
   */
  private static readonly createSchema = z.object({
    name: z.string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome não pode ter mais de 100 caracteres'),
    document: OrganizationEntity.cnpjSchema,
    type: z.nativeEnum(OrganizationType),
    size: z.nativeEnum(OrganizationSize),
    description: z.string()
      .max(500, 'Descrição não pode ter mais de 500 caracteres')
      .optional()
  });

  /**
   * Configurações padrão
   */
  private static readonly defaultSettings: OrganizationSettings = {
    analysisRules: [],
    customParameters: {},
    documentRetentionDays: 365,
    maxDocumentSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    autoAnalysis: true,
    notificationSettings: {
      email: true,
      inApp: true
    }
  };

  /**
   * Métricas iniciais
   */
  private static readonly initialMetrics: OrganizationMetrics = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    averageAnalysisTime: 0
  };

  /**
   * Criar nova organização
   */
  public static create(props: CreateOrganizationProps): OrganizationEntity {
    try {
      // Validar dados básicos
      const validatedData = this.createSchema.parse({
        name: props.name.trim(),
        document: props.document,
        type: props.type,
        size: props.size,
        description: props.description?.trim()
      });

      const now = new Date();
      const settings = { ...this.defaultSettings, ...props.settings };

      return new OrganizationEntity(
        OrganizationId.generate(),
        validatedData.name,
        validatedData.document,
        validatedData.type,
        validatedData.size,
        props.contact,
        props.address,
        validatedData.description,
        OrganizationStatus.TRIAL,
        settings,
        this.initialMetrics,
        now,
        now
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Dados inválidos para criação da organização: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
      throw error;
    }
  }

  /**
   * Criar organização a partir de dados persistidos
   */
  public static fromPersistence(data: {
    id: string;
    name: string;
    document: string;
    type: OrganizationType;
    size: OrganizationSize;
    contact: OrganizationContact;
    address: Address;
    description?: string;
    status: OrganizationStatus;
    settings: OrganizationSettings;
    metrics: OrganizationMetrics;
    createdAt: Date;
    updatedAt: Date;
  }): OrganizationEntity {
    return new OrganizationEntity(
      OrganizationId.create(data.id),
      data.name,
      data.document,
      data.type,
      data.size,
      data.contact,
      data.address,
      data.description,
      data.status,
      data.settings,
      data.metrics,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Atualizar dados da organização
   */
  public update(props: UpdateOrganizationProps): void {
    if (this._status === OrganizationStatus.SUSPENDED) {
      throw BusinessError.operationNotAllowed(
        'update',
        'Organização está suspensa'
      );
    }

    if (props.name !== undefined) {
      if (props.name.trim().length < 2) {
        throw ValidationError.outOfRange('name', props.name, 2);
      }
      this._name = props.name.trim();
    }

    if (props.type !== undefined) {
      this._type = props.type;
    }

    if (props.size !== undefined) {
      this._size = props.size;
    }

    if (props.contact !== undefined) {
      this._contact = { ...this._contact, ...props.contact };
    }

    if (props.address !== undefined) {
      this._address = props.address;
    }

    if (props.description !== undefined) {
      this._description = props.description.trim() || undefined;
    }

    if (props.settings !== undefined) {
      this._settings = { ...this._settings, ...props.settings };
    }

    this._updatedAt = new Date();
  }

  /**
   * Ativar organização
   */
  public activate(): void {
    if (this._status === OrganizationStatus.ACTIVE) {
      throw BusinessError.invalidState(
        'Organization',
        this._status,
        'not ACTIVE'
      );
    }

    this._status = OrganizationStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Desativar organização
   */
  public deactivate(): void {
    if (this._status === OrganizationStatus.INACTIVE) {
      throw BusinessError.invalidState(
        'Organization',
        this._status,
        'not INACTIVE'
      );
    }

    this._status = OrganizationStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Suspender organização
   */
  public suspend(): void {
    if (this._status === OrganizationStatus.SUSPENDED) {
      throw BusinessError.invalidState(
        'Organization',
        this._status,
        'not SUSPENDED'
      );
    }

    this._status = OrganizationStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  /**
   * Atualizar métricas
   */
  public updateMetrics(metrics: Partial<OrganizationMetrics>): void {
    this._metrics = { ...this._metrics, ...metrics };
    this._updatedAt = new Date();
  }

  /**
   * Verificar se pode realizar análises
   */
  public canPerformAnalysis(): boolean {
    return this._status === OrganizationStatus.ACTIVE && this._settings.autoAnalysis;
  }

  /**
   * Getters
   */
  public get id(): OrganizationId {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get document(): string {
    return this._document;
  }

  public get type(): OrganizationType {
    return this._type;
  }

  public get size(): OrganizationSize {
    return this._size;
  }

  public get contact(): OrganizationContact {
    return this._contact;
  }

  public get address(): Address {
    return this._address;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get status(): OrganizationStatus {
    return this._status;
  }

  public get settings(): OrganizationSettings {
    return this._settings;
  }

  public get metrics(): OrganizationMetrics {
    return this._metrics;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Converter para objeto simples
   */
  public toObject() {
    return {
      id: this._id.value,
      name: this._name,
      document: this._document,
      type: this._type,
      size: this._size,
      contact: this._contact,
      address: this._address.toObject(),
      description: this._description,
      status: this._status,
      settings: this._settings,
      metrics: this._metrics,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}