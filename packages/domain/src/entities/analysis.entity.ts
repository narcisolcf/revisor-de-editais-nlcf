import { z } from 'zod';
import { DomainError } from '../errors/domain.error';
import { AnalysisId } from '../value-objects/analysis-id.vo';
import { DocumentId } from '../value-objects/document-id.vo';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { UserId } from '../value-objects/user-id.vo';
import { AnalysisStatus, ProblemSeverity, AnalysisConfig, Problem } from '../types/analysis.types';

/**
 * Enums de Domínio para Analysis
 */

export enum AnalysisType {
  STRUCTURAL = 'structural',
  LEGAL = 'legal',
  CLARITY = 'clarity',
  ABNT = 'abnt',
  FULL = 'full'
}

/**
 * Value Objects para Analysis
 */
export interface ProblemLocation {
  readonly page?: number;
  readonly section?: string;
  readonly line?: number;
  readonly startOffset?: number;
  readonly endOffset?: number;
}



export interface AnalysisMetrics {
  readonly conformityScore: number; // 0-100
  readonly structuralScore: number; // 0-100
  readonly legalScore: number; // 0-100
  readonly clarityScore: number; // 0-100
  readonly abntScore: number; // 0-100
  readonly totalProblems: number;
  readonly criticalProblems: number;
  readonly errorProblems: number;
  readonly warningProblems: number;
  readonly infoProblems: number;
  readonly executionTimeMs: number;
}



/**
 * Schemas de validação
 */
const ProblemLocationSchema = z.object({
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  line: z.number().int().positive().optional(),
  startOffset: z.number().int().min(0).optional(),
  endOffset: z.number().int().min(0).optional()
});

const ProblemSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  severity: z.nativeEnum(ProblemSeverity),
  description: z.string().min(1),
  location: ProblemLocationSchema.optional(),
  suggestion: z.string().optional(),
  ruleId: z.string().optional()
});

const AnalysisMetricsSchema = z.object({
  conformityScore: z.number().min(0).max(100),
  structuralScore: z.number().min(0).max(100),
  legalScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  abntScore: z.number().min(0).max(100),
  totalProblems: z.number().int().min(0),
  criticalProblems: z.number().int().min(0),
  errorProblems: z.number().int().min(0),
  warningProblems: z.number().int().min(0),
  infoProblems: z.number().int().min(0),
  executionTimeMs: z.number().min(0)
});

const AnalysisConfigSchema = z.object({
  rules: z.array(z.string().min(1)),
  strictMode: z.boolean(),
  includeWarnings: z.boolean(),
  customParameters: z.record(z.unknown()).optional()
});

/**
 * Propriedades para criação de Analysis
 */
export interface CreateAnalysisProps {
  documentId: string;
  organizationId: string;
  executedBy: string;
  config: AnalysisConfig;
  estimatedDurationMs?: number;
}

/**
 * Propriedades para atualização de Analysis
 */
export interface UpdateAnalysisProps {
  status?: AnalysisStatus;
  problems?: Problem[];
  metrics?: AnalysisMetrics;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Entidade Analysis seguindo princípios de Clean Architecture
 */
export class AnalysisEntity {
  private constructor(
    private readonly _id: AnalysisId,
    private readonly _documentId: DocumentId,
    private readonly _organizationId: OrganizationId,
    private _status: AnalysisStatus,
    private readonly _config: AnalysisConfig,
    private readonly _executedBy: UserId,
    private _problems: Problem[] = [],
    private _metrics?: AnalysisMetrics,
    private readonly _executedAt: Date = new Date(),
    private _completedAt?: Date,
    private _errorMessage?: string,
    private _metadata: Record<string, unknown> = {},
    private readonly _estimatedDurationMs?: number
  ) {}

  /**
   * Factory method para criar nova instância de Analysis
   */
  public static create(props: CreateAnalysisProps): AnalysisEntity {
    // Validações de negócio
    const validatedConfig = AnalysisConfigSchema.parse(props.config);

    if (validatedConfig.rules.length === 0) {
      throw new DomainError('Análise deve ter pelo menos uma regra configurada');
    }



    return new AnalysisEntity(
      AnalysisId.generate(),
      DocumentId.create(props.documentId),
      OrganizationId.create(props.organizationId),
      AnalysisStatus.PENDING,
      validatedConfig,
      UserId.create(props.executedBy),
      [],
      undefined,
      new Date(),
      undefined,
      undefined,
      {},
      props.estimatedDurationMs
    );
  }

  /**
   * Factory method para reconstruir Analysis a partir de dados persistidos
   */
  public static fromPersistence(data: {
    id: string;
    documentId: string;
    organizationId: string;
    status: AnalysisStatus;
    config: AnalysisConfig;
    problems: Problem[];
    metrics?: AnalysisMetrics;
    executedAt: Date;
    completedAt?: Date;
    executedBy: string;
    errorMessage?: string;
    metadata: Record<string, unknown>;
    estimatedDurationMs?: number;
  }): AnalysisEntity {
    return new AnalysisEntity(
      AnalysisId.create(data.id),
      DocumentId.create(data.documentId),
      OrganizationId.create(data.organizationId),
      data.status,
      data.config,
      UserId.create(data.executedBy),
      data.problems,
      data.metrics,
      data.executedAt,
      data.completedAt,
      data.errorMessage,
      data.metadata,
      data.estimatedDurationMs
    );
  }

  /**
   * Iniciar análise
   */
  public start(): void {
    if (this._status !== AnalysisStatus.PENDING) {
      throw new DomainError('Análise só pode ser iniciada se estiver pendente');
    }

    this._status = AnalysisStatus.IN_PROGRESS;
  }

  /**
   * Completar análise com sucesso
   */
  public complete(problems: Problem[], metrics: AnalysisMetrics): void {
    if (this._status !== AnalysisStatus.IN_PROGRESS) {
      throw new DomainError('Análise só pode ser completada se estiver em progresso');
    }

    // Validar problemas
    problems.forEach(problem => ProblemSchema.parse(problem));
    
    // Validar métricas
    const validatedMetrics = AnalysisMetricsSchema.parse(metrics);

    // Verificar consistência entre problemas e métricas
    const problemCounts = this.countProblemsBySeverity(problems);
    if (
      problemCounts.critical !== validatedMetrics.criticalProblems ||
      problemCounts.error !== validatedMetrics.errorProblems ||
      problemCounts.warning !== validatedMetrics.warningProblems ||
      problemCounts.info !== validatedMetrics.infoProblems ||
      problems.length !== validatedMetrics.totalProblems
    ) {
      throw new DomainError('Métricas inconsistentes com problemas encontrados');
    }

    this._problems = problems;
    this._metrics = validatedMetrics;
    this._status = AnalysisStatus.COMPLETED;
    this._completedAt = new Date();
    this._errorMessage = undefined;
  }

  /**
   * Falhar análise
   */
  public fail(errorMessage: string): void {
    if (![AnalysisStatus.PENDING, AnalysisStatus.IN_PROGRESS].includes(this._status)) {
      throw new DomainError('Análise só pode falhar se estiver pendente ou em progresso');
    }

    if (!errorMessage.trim()) {
      throw new DomainError('Mensagem de erro é obrigatória');
    }

    this._status = AnalysisStatus.FAILED;
    this._errorMessage = errorMessage.trim();
    this._completedAt = new Date();
  }

  /**
   * Cancelar análise
   */
  public cancel(): void {
    if (![AnalysisStatus.PENDING, AnalysisStatus.IN_PROGRESS].includes(this._status)) {
      throw new DomainError('Análise só pode ser cancelada se estiver pendente ou em progresso');
    }

    this._status = AnalysisStatus.CANCELLED;
    this._completedAt = new Date();
  }

  /**
   * Atualizar metadados
   */
  public updateMetadata(metadata: Record<string, unknown>): void {
    this._metadata = { ...this._metadata, ...metadata };
  }

  /**
   * Verificar se análise está finalizada
   */
  public isFinished(): boolean {
    return [AnalysisStatus.COMPLETED, AnalysisStatus.FAILED, AnalysisStatus.CANCELLED].includes(this._status);
  }

  /**
   * Verificar se análise foi bem-sucedida
   */
  public isSuccessful(): boolean {
    return this._status === AnalysisStatus.COMPLETED;
  }

  /**
   * Obter duração da análise em milissegundos
   */
  public getDurationMs(): number | undefined {
    if (!this._completedAt) return undefined;
    return this._completedAt.getTime() - this._executedAt.getTime();
  }

  /**
   * Obter problemas por severidade
   */
  public getProblemsBySeverity(severity: ProblemSeverity): Problem[] {
    return this._problems.filter(problem => problem.severity === severity);
  }

  /**
   * Obter problemas por tipo
   */
  public getProblemsByType(type: string): Problem[] {
    return this._problems.filter(problem => problem.type === type);
  }

  /**
   * Contar problemas por severidade
   */
  private countProblemsBySeverity(problems: Problem[]) {
    return {
      critical: problems.filter(p => p.severity === ProblemSeverity.CRITICA).length,
      error: problems.filter(p => p.severity === ProblemSeverity.ALTA).length,
      warning: problems.filter(p => p.severity === ProblemSeverity.MEDIA).length,
      info: problems.filter(p => p.severity === ProblemSeverity.BAIXA).length
    };
  }

  /**
   * Getters
   */
  public get id(): AnalysisId { return this._id; }
  public get documentId(): DocumentId { return this._documentId; }
  public get organizationId(): OrganizationId { return this._organizationId; }
  public get status(): AnalysisStatus { return this._status; }
  public get config(): AnalysisConfig { return this._config; }
  public get problems(): Problem[] { return [...this._problems]; }
  public get metrics(): AnalysisMetrics | undefined { return this._metrics; }
  public get executedAt(): Date { return this._executedAt; }
  public get completedAt(): Date | undefined { return this._completedAt; }
  public get executedBy(): UserId { return this._executedBy; }
  public get errorMessage(): string | undefined { return this._errorMessage; }
  public get metadata(): Record<string, unknown> { return { ...this._metadata }; }
  public get estimatedDurationMs(): number | undefined { return this._estimatedDurationMs; }

  /**
   * Converter para objeto simples para persistência
   */
  public toPersistence() {
    return {
      id: this._id.value,
      documentId: this._documentId.value,
      organizationId: this._organizationId.value,
      status: this._status,
      config: this._config,
      problems: this._problems,
      metrics: this._metrics,
      executedAt: this._executedAt,
      completedAt: this._completedAt,
      executedBy: this._executedBy.value,
      errorMessage: this._errorMessage,
      metadata: this._metadata,
      estimatedDurationMs: this._estimatedDurationMs
    };
  }
}