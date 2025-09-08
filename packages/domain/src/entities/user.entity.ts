import { z } from 'zod';
import { UserId } from '../value-objects/user-id.vo';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { Email } from '../value-objects/email.vo';

import { ValidationError } from '../errors/validation.error';
import { BusinessError } from '../errors/business.error';
import { UserRole, UserStatus, UserContext, UserProfile } from '../types/user.types';

/**
 * Enums de domínio para User
 */

/**
 * Interfaces para dados do usuário
 */

export interface UserPermissions {
  canCreateAnalysis: boolean;
  canEditAnalysis: boolean;
  canDeleteAnalysis: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageOrganization: boolean;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface UserActivity {
  lastLoginAt?: Date;
  lastAnalysisAt?: Date;
  totalAnalyses: number;
  totalLogins: number;
}

/**
 * Props para criação do usuário
 */
export interface CreateUserProps {
  email: Email;
  profile: UserProfile;
  role: UserRole;
  context: UserContext;
  organizationId?: OrganizationId;
  preferences?: Partial<UserPreferences>;
}

/**
 * Props para atualização do usuário
 */
export interface UpdateUserProps {
  profile?: Partial<UserProfile>;
  role?: UserRole;
  context?: UserContext;
  preferences?: Partial<UserPreferences>;
}

/**
 * Entidade User seguindo princípios da Clean Architecture
 */
export class UserEntity {
  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    private _profile: UserProfile,
    private _role: UserRole,
    private _context: UserContext,
    private _organizationId: OrganizationId | undefined,
    private _status: UserStatus,
    private _permissions: UserPermissions,
    private _preferences: UserPreferences,
    private _activity: UserActivity,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
    private _emailVerifiedAt?: Date
  ) {}



  /**
   * Schema de validação para criação
   */
  private static readonly createSchema = z.object({
    firstName: z.string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(50, 'Nome não pode ter mais de 50 caracteres'),
    lastName: z.string()
      .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
      .max(50, 'Sobrenome não pode ter mais de 50 caracteres'),
    avatar: z.string().url('Avatar deve ser uma URL válida').optional(),
    phone: z.string().optional(),
    department: z.string().optional(),
    position: z.string().optional()
  });

  /**
   * Permissões padrão por role
   */
  private static readonly rolePermissions: Record<UserRole, UserPermissions> = {
    [UserRole.ADMIN]: {
      canCreateAnalysis: true,
      canEditAnalysis: true,
      canDeleteAnalysis: true,
      canViewReports: true,
      canManageUsers: true,
      canManageOrganization: true
    },
    [UserRole.MANAGER]: {
      canCreateAnalysis: true,
      canEditAnalysis: true,
      canDeleteAnalysis: true,
      canViewReports: true,
      canManageUsers: true,
      canManageOrganization: false
    },
    [UserRole.ANALYST]: {
      canCreateAnalysis: true,
      canEditAnalysis: true,
      canDeleteAnalysis: false,
      canViewReports: true,
      canManageUsers: false,
      canManageOrganization: false
    },
    [UserRole.VIEWER]: {
      canCreateAnalysis: false,
      canEditAnalysis: false,
      canDeleteAnalysis: false,
      canViewReports: true,
      canManageUsers: false,
      canManageOrganization: false
    }
  };

  /**
   * Preferências padrão
   */
  private static readonly defaultPreferences: UserPreferences = {
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    theme: 'auto'
  };

  /**
   * Atividade inicial
   */
  private static readonly initialActivity: UserActivity = {
    totalAnalyses: 0,
    totalLogins: 0
  };

  /**
   * Criar novo usuário
   */
  public static create(props: CreateUserProps): UserEntity {
    try {
      // Validar dados do perfil
      const validatedProfile = this.createSchema.parse({
        firstName: props.profile.firstName.trim(),
        lastName: props.profile.lastName.trim(),
        avatar: props.profile.avatar,
        phone: props.profile.phone,
        department: props.profile.department,
        position: props.profile.position
      });

      const profile: UserProfile = validatedProfile;

      const now = new Date();
      const permissions = this.rolePermissions[props.role];
      const preferences = { ...this.defaultPreferences, ...props.preferences };

      return new UserEntity(
        UserId.generate(),
        props.email,
        profile,
        props.role,
        props.context,
        props.organizationId,
        UserStatus.PENDING,
        permissions,
        preferences,
        this.initialActivity,
        now,
        now
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Dados inválidos para criação do usuário: ${error.errors.map(e => e.message).join(', ')}`
        );
      }
      throw error;
    }
  }

  /**
   * Criar usuário a partir de dados persistidos
   */
  public static fromPersistence(data: {
    id: string;
    email: Email;
    profile: UserProfile;
    role: UserRole;
    context: UserContext;
    organizationId?: string;
    status: UserStatus;
    permissions: UserPermissions;
    preferences: UserPreferences;
    activity: UserActivity;
    createdAt: Date;
    updatedAt: Date;
    emailVerifiedAt?: Date;
  }): UserEntity {
    return new UserEntity(
      UserId.create(data.id),
      data.email,
      data.profile,
      data.role,
      data.context,
      data.organizationId ? OrganizationId.create(data.organizationId) : undefined,
      data.status,
      data.permissions,
      data.preferences,
      data.activity,
      data.createdAt,
      data.updatedAt,
      data.emailVerifiedAt
    );
  }

  /**
   * Atualizar dados do usuário
   */
  public update(props: UpdateUserProps): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw BusinessError.operationNotAllowed(
        'update',
        'Usuário está suspenso'
      );
    }

    if (props.profile) {
      this._profile = { ...this._profile, ...props.profile };
    }

    if (props.role && props.role !== this._role) {
      this._role = props.role;
      this._permissions = UserEntity.rolePermissions[props.role];
    }

    if (props.context) {
      this._context = props.context;
    }

    if (props.preferences) {
      this._preferences = { ...this._preferences, ...props.preferences };
    }

    this._updatedAt = new Date();
  }

  /**
   * Verificar email
   */
  public verifyEmail(): void {
    if (this._emailVerifiedAt) {
      throw BusinessError.operationNotAllowed(
        'verifyEmail',
        'Email já foi verificado'
      );
    }

    this._emailVerifiedAt = new Date();
    if (this._status === UserStatus.PENDING) {
      this._status = UserStatus.ACTIVE;
    }
    this._updatedAt = new Date();
  }

  /**
   * Ativar usuário
   */
  public activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw BusinessError.invalidState(
        'User',
        this._status,
        'not ACTIVE'
      );
    }

    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Desativar usuário
   */
  public deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      throw BusinessError.invalidState(
        'User',
        this._status,
        'not INACTIVE'
      );
    }

    this._status = UserStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * Suspender usuário
   */
  public suspend(): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw BusinessError.invalidState(
        'User',
        this._status,
        'not SUSPENDED'
      );
    }

    this._status = UserStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  /**
   * Registrar login
   */
  public recordLogin(): void {
    this._activity.lastLoginAt = new Date();
    this._activity.totalLogins += 1;
    this._updatedAt = new Date();
  }

  /**
   * Registrar análise
   */
  public recordAnalysis(): void {
    this._activity.lastAnalysisAt = new Date();
    this._activity.totalAnalyses += 1;
    this._updatedAt = new Date();
  }

  /**
   * Associar à organização
   */
  public associateToOrganization(organizationId: OrganizationId): void {
    this._organizationId = organizationId;
    this._updatedAt = new Date();
  }

  /**
   * Desassociar da organização
   */
  public dissociateFromOrganization(): void {
    this._organizationId = undefined;
    this._updatedAt = new Date();
  }

  /**
   * Verificar se tem permissão
   */
  public hasPermission(permission: keyof UserPermissions): boolean {
    return this._permissions[permission];
  }

  /**
   * Verificar se está ativo
   */
  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * Verificar se email foi verificado
   */
  public isEmailVerified(): boolean {
    return !!this._emailVerifiedAt;
  }

  /**
   * Obter nome completo
   */
  public getFullName(): string {
    return `${this._profile.firstName} ${this._profile.lastName}`;
  }

  /**
   * Getters
   */
  public get id(): UserId {
    return this._id;
  }

  public get email(): Email {
    return this._email;
  }

  public get profile(): UserProfile {
    return this._profile;
  }

  public get role(): UserRole {
    return this._role;
  }

  public get context(): UserContext {
    return this._context;
  }

  public get organizationId(): OrganizationId | undefined {
    return this._organizationId;
  }

  public get status(): UserStatus {
    return this._status;
  }

  public get permissions(): UserPermissions {
    return this._permissions;
  }

  public get preferences(): UserPreferences {
    return this._preferences;
  }

  public get activity(): UserActivity {
    return this._activity;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get emailVerifiedAt(): Date | undefined {
    return this._emailVerifiedAt;
  }

  /**
   * Converter para objeto simples
   */
  public toObject() {
    return {
      id: this._id.value,
      email: this._email.value,
      profile: this._profile,
      role: this._role,
      context: this._context,
      organizationId: this._organizationId?.value,
      status: this._status,
      permissions: this._permissions,
      preferences: this._preferences,
      activity: this._activity,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      emailVerifiedAt: this._emailVerifiedAt
    };
  }
}