# Orchestration.md - Orquestração de Sistemas e Processos

## 🎭 Visão Geral

### Filosofia de Orquestração
**"Coordenação inteligente de sistemas distribuídos para máxima eficiência e confiabilidade"**

Nossa estratégia de orquestração baseia-se em:
- **Event-Driven Architecture**: Comunicação assíncrona resiliente
- **Microservices Coordination**: Coordenação descentralizada mas observável
- **Fault Tolerance**: Degradação graceful e recuperação automática
- **Scalability**: Elasticidade horizontal e vertical
- **Observability**: Visibilidade completa do estado do sistema

### Escopo de Orquestração
```
Sistema de Análise de Documentos
├── Frontend (React SPA)
├── Backend Services
│   ├── Document Service
│   ├── Analysis Engine
│   ├── AI Integration Layer
│   └── Notification Service
├── External Integrations
│   ├── OpenAI/Claude APIs
│   ├── Government Systems
│   └── File Storage
└── Infrastructure
    ├── Databases
    ├── Message Queues
    └── Monitoring
```

---

## 🏗️ Arquitetura de Orquestração

### Event-Driven Architecture

#### Event Bus Central
```typescript
// ✅ Event bus com tipagem forte
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    userId?: string;
    correlationId: string;
    causationId?: string;
  };
}

interface EventBus {
  publish<T extends DomainEvent>(event: T): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<Subscription>;
  subscribeToStream(
    streamName: string,
    handler: StreamHandler
  ): Promise<Subscription>;
}

// ✅ Implementação com garantias de entrega
class ReliableEventBus implements EventBus {
  constructor(
    private messageQueue: MessageQueue,
    private eventStore: EventStore,
    private logger: Logger
  ) {}

  async publish<T extends DomainEvent>(event: T): Promise<void> {
    const eventId = uuidv4();
    const enrichedEvent = {
      ...event,
      id: eventId,
      metadata: {
        ...event.metadata,
        timestamp: new Date()
      }
    };

    try {
      // 1. Persistir evento no event store
      await this.eventStore.append(enrichedEvent);
      
      // 2. Publicar no message queue
      await this.messageQueue.publish(
        `events.${event.type}`,
        enrichedEvent,
        {
          persistent: true,
          correlationId: event.metadata.correlationId
        }
      );

      this.logger.info('Event published successfully', {
        eventId,
        eventType: event.type,
        correlationId: event.metadata.correlationId
      });
    } catch (error) {
      this.logger.error('Failed to publish event', {
        eventId,
        eventType: event.type,
        error: error.message
      });
      throw new EventPublishingError(`Failed to publish event ${eventId}`, { cause: error });
    }
  }

  async subscribe<T extends DomainEvent>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<Subscription> {
    return this.messageQueue.subscribe(
      `events.${eventType}`,
      async (message) => {
        const event = message.data as T;
        
        try {
          await handler(event);
          await message.ack();
        } catch (error) {
          this.logger.error('Event handler failed', {
            eventId: event.id,
            eventType: event.type,
            error: error.message
          });
          
          await message.nack();
          throw error;
        }
      },
      {
        durable: true,
        autoAck: false
      }
    );
  }
}
```

#### Domain Events

##### Document Events
```typescript
// ✅ Eventos do domínio de documentos
interface DocumentCreatedEvent extends DomainEvent {
  type: 'document.created';
  aggregateType: 'document';
  data: {
    documentId: string;
    title: string;
    type: DocumentType;
    userId: string;
    fileSize: number;
    autoAnalyze: boolean;
  };
}

interface DocumentAnalysisStartedEvent extends DomainEvent {
  type: 'document.analysis.started';
  aggregateType: 'document';
  data: {
    documentId: string;
    analysisId: string;
    userId: string;
    analysisType: 'quick' | 'full' | 'custom';
    rulesApplied: string[];
  };
}

interface DocumentAnalysisCompletedEvent extends DomainEvent {
  type: 'document.analysis.completed';
  aggregateType: 'document';
  data: {
    documentId: string;
    analysisId: string;
    conformityScore: number;
    problemsCount: number;
    executionTime: number;
    aiUsed: boolean;
  };
}

interface DocumentAnalysisFailedEvent extends DomainEvent {
  type: 'document.analysis.failed';
  aggregateType: 'document';
  data: {
    documentId: string;
    analysisId: string;
    error: string;
    retryCount: number;
    canRetry: boolean;
  };
}
```

##### Analysis Events
```typescript
// ✅ Eventos específicos de análise
interface AnalysisQueuedEvent extends DomainEvent {
  type: 'analysis.queued';
  aggregateType: 'analysis';
  data: {
    analysisId: string;
    documentId: string;
    priority: 'low' | 'normal' | 'high';
    estimatedDuration: number;
    queuePosition: number;
  };
}

interface AnalysisProgressUpdatedEvent extends DomainEvent {
  type: 'analysis.progress.updated';
  aggregateType: 'analysis';
  data: {
    analysisId: string;
    documentId: string;
    progress: number; // 0-100
    currentStep: string;
    estimatedTimeRemaining: number;
  };
}

interface ProblemDetectedEvent extends DomainEvent {
  type: 'problem.detected';
  aggregateType: 'analysis';
  data: {
    analysisId: string;
    documentId: string;
    problemId: string;
    severity: ProblemSeverity;
    category: ProblemCategory;
    ruleId?: string;
    aiConfidence?: number;
  };
}
```

### Workflow Orchestration

#### Saga Pattern Implementation
```typescript
// ✅ Saga para coordenar análise de documento
interface SagaStep {
  execute(): Promise<void>;
  compensate(): Promise<void>;
}

class DocumentAnalysisSaga {
  private steps: SagaStep[] = [];
  private executedSteps: SagaStep[] = [];

  constructor(
    private documentId: string,
    private analysisOptions: AnalysisOptions,
    private eventBus: EventBus,
    private services: {
      documentService: DocumentService;
      analysisEngine: AnalysisEngine;
      aiService: AIService;
      notificationService: NotificationService;
    }
  ) {
    this.setupSteps();
  }

  private setupSteps() {
    this.steps = [
      new ValidateDocumentStep(this.documentId, this.services.documentService),
      new QueueAnalysisStep(this.documentId, this.analysisOptions, this.eventBus),
      new ExtractTextStep(this.documentId, this.services.documentService),
      new ApplyRulesStep(this.documentId, this.services.analysisEngine),
      new RunAIAnalysisStep(this.documentId, this.services.aiService),
      new ConsolidateResultsStep(this.documentId, this.services.analysisEngine),
      new SendNotificationStep(this.documentId, this.services.notificationService)
    ];
  }

  async execute(): Promise<void> {
    const correlationId = uuidv4();
    
    try {
      for (const step of this.steps) {
        await step.execute();
        this.executedSteps.push(step);
        
        // Emitir evento de progresso
        await this.eventBus.publish({
          type: 'analysis.progress.updated',
          aggregateId: this.documentId,
          aggregateType: 'document',
          version: 1,
          data: {
            analysisId: this.documentId,
            documentId: this.documentId,
            progress: (this.executedSteps.length / this.steps.length) * 100,
            currentStep: step.constructor.name,
            estimatedTimeRemaining: this.calculateRemainingTime()
          },
          metadata: {
            timestamp: new Date(),
            correlationId
          }
        } as AnalysisProgressUpdatedEvent);
      }

      // Emitir evento de conclusão
      await this.eventBus.publish({
        type: 'document.analysis.completed',
        aggregateId: this.documentId,
        aggregateType: 'document',
        version: 1,
        data: {
          documentId: this.documentId,
          analysisId: this.documentId,
          conformityScore: 85, // Resultado real
          problemsCount: 3,
          executionTime: Date.now() - this.startTime,
          aiUsed: this.analysisOptions.aiEnabled
        },
        metadata: {
          timestamp: new Date(),
          correlationId
        }
      } as DocumentAnalysisCompletedEvent);

    } catch (error) {
      // Compensação em caso de erro
      await this.compensate();
      
      // Emitir evento de falha
      await this.eventBus.publish({
        type: 'document.analysis.failed',
        aggregateId: this.documentId,
        aggregateType: 'document',
        version: 1,
        data: {
          documentId: this.documentId,
          analysisId: this.documentId,
          error: error.message,
          retryCount: 0,
          canRetry: true
        },
        metadata: {
          timestamp: new Date(),
          correlationId
        }
      } as DocumentAnalysisFailedEvent);

      throw error;
    }
  }

  private async compensate(): Promise<void> {
    // Executar compensação na ordem reversa
    for (const step of this.executedSteps.reverse()) {
      try {
        await step.compensate();
      } catch (compensationError) {
        // Log erro de compensação mas continua
        console.error(`Compensation failed for step ${step.constructor.name}:`, compensationError);
      }
    }
  }

  private calculateRemainingTime(): number {
    const avgStepTime = 10000; // 10s por step
    const remainingSteps = this.steps.length - this.executedSteps.length;
    return remainingSteps * avgStepTime;
  }
}

// ✅ Implementação de step específico
class RunAIAnalysisStep implements SagaStep {
  constructor(
    private documentId: string,
    private aiService: AIService
  ) {}

  async execute(): Promise<void> {
    try {
      const document = await this.getDocument();
      const result = await this.aiService.analyze(document.content, {
        type: document.type,
        timeout: 60000
      });

      await this.storeAIResult(result);
    } catch (error) {
      if (error instanceof AIServiceUnavailableError) {
        // Degradação graceful - pular análise por IA
        console.warn('AI service unavailable, skipping AI analysis');
        return;
      }
      throw error;
    }
  }

  async compensate(): Promise<void> {
    // Limpar resultados de IA se necessário
    await this.clearAIResult();
  }

  private async getDocument(): Promise<Document> {
    // Implementação...
  }

  private async storeAIResult(result: AIAnalysisResult): Promise<void> {
    // Implementação...
  }

  private async clearAIResult(): Promise<void> {
    // Implementação...
  }
}
```

### Service Mesh Pattern

#### Service Registry
```typescript
// ✅ Registry de serviços com health checking
interface ServiceMetadata {
  name: string;
  version: string;
  endpoints: string[];
  healthEndpoint: string;
  capabilities: string[];
  dependencies: string[];
}

interface ServiceInstance {
  id: string;
  metadata: ServiceMetadata;
  lastSeen: Date;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
}

class ServiceRegistry {
  private services = new Map<string, ServiceInstance[]>();
  private healthCheckInterval = 30000; // 30s

  constructor(private eventBus: EventBus) {
    this.startHealthChecking();
  }

  async register(instance: ServiceInstance): Promise<void> {
    const serviceName = instance.metadata.name;
    
    if (!this.services.has(serviceName)) {
      this.services.set(serviceName, []);
    }

    const instances = this.services.get(serviceName)!;
    const existingIndex = instances.findIndex(i => i.id === instance.id);

    if (existingIndex >= 0) {
      instances[existingIndex] = instance;
    } else {
      instances.push(instance);
    }

    // Emitir evento de registro
    await this.eventBus.publish({
      type: 'service.registered',
      aggregateId: instance.id,
      aggregateType: 'service',
      version: 1,
      data: {
        serviceId: instance.id,
        serviceName: instance.metadata.name,
        endpoints: instance.metadata.endpoints
      },
      metadata: {
        timestamp: new Date(),
        correlationId: uuidv4()
      }
    });
  }

  async discover(serviceName: string): Promise<ServiceInstance[]> {
    const instances = this.services.get(serviceName) || [];
    return instances.filter(instance => 
      instance.status === 'healthy' && 
      this.isRecentlySeen(instance)
    );
  }

  async getHealthyInstance(serviceName: string): Promise<ServiceInstance | null> {
    const instances = await this.discover(serviceName);
    
    if (instances.length === 0) {
      return null;
    }

    // Load balancing - escolher instância com menor tempo de resposta
    return instances.reduce((best, current) => 
      (current.responseTime || Infinity) < (best.responseTime || Infinity) 
        ? current 
        : best
    );
  }

  private async startHealthChecking(): Promise<void> {
    setInterval(async () => {
      for (const [serviceName, instances] of this.services) {
        for (const instance of instances) {
          await this.checkHealth(instance);
        }
      }
    }, this.healthCheckInterval);
  }

  private async checkHealth(instance: ServiceInstance): Promise<void> {
    try {
      const startTime = Date.now();
      const response = await fetch(instance.metadata.healthEndpoint, {
        timeout: 5000
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      instance.status = isHealthy ? 'healthy' : 'unhealthy';
      instance.responseTime = responseTime;
      instance.lastSeen = new Date();

      if (!isHealthy) {
        await this.eventBus.publish({
          type: 'service.unhealthy',
          aggregateId: instance.id,
          aggregateType: 'service',
          version: 1,
          data: {
            serviceId: instance.id,
            serviceName: instance.metadata.name,
            responseTime,
            statusCode: response.status
          },
          metadata: {
            timestamp: new Date(),
            correlationId: uuidv4()
          }
        });
      }
    } catch (error) {
      instance.status = 'unhealthy';
      instance.lastSeen = new Date();
    }
  }

  private isRecentlySeen(instance: ServiceInstance): boolean {
    const maxAge = this.healthCheckInterval * 3; // 3 health check cycles
    return Date.now() - instance.lastSeen.getTime() < maxAge;
  }
}
```

#### Circuit Breaker Pattern
```typescript
// ✅ Circuit breaker para chamadas externas
interface CircuitBreakerConfig {
  failureThreshold: number;
  timeout: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: Date;
  private successCount = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private logger: Logger
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
        this.logger.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        throw new CircuitOpenError(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      
      if (this.successCount >= 3) { // 3 sucessos consecutivos
        this.state = 'CLOSED';
        this.successCount = 0;
        this.logger.info(`Circuit breaker ${this.name} reset to CLOSED state`);
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.logger.warn(`Circuit breaker ${this.name} failed in HALF_OPEN, moving to OPEN`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.logger.warn(`Circuit breaker ${this.name} opened due to ${this.failureCount} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    
    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.resetTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// ✅ Factory para circuit breakers
class CircuitBreakerFactory {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(
    name: string, 
    config: CircuitBreakerConfig,
    logger: Logger
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config, logger));
    }
    return this.breakers.get(name)!;
  }

  getAllMetrics() {
    const metrics: Record<string, any> = {};
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }
}
```

---

## 🔄 Process Orchestration

### Document Analysis Pipeline

#### Pipeline Definition
```typescript
// ✅ Pipeline configurável para análise
interface PipelineStep {
  name: string;
  execute(context: PipelineContext): Promise<PipelineContext>;
  rollback?(context: PipelineContext): Promise<void>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  dependencies?: string[];
}

interface PipelineContext {
  documentId: string;
  document?: Document;
  analysisId: string;
  options: AnalysisOptions;
  results: Map<string, any>;
  metadata: Record<string, any>;
  startTime: Date;
}

class DocumentAnalysisPipeline {
  private steps: PipelineStep[] = [];
  private stepRegistry = new Map<string, PipelineStep>();

  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private metrics: MetricsCollector
  ) {
    this.registerSteps();
  }

  private registerSteps(): void {
    const steps = [
      new DocumentValidationStep(),
      new TextExtractionStep(),
      new RuleAnalysisStep(),
      new AIAnalysisStep(),
      new ResultConsolidationStep(),
      new QualityAssuranceStep(),
      new NotificationStep()
    ];

    for (const step of steps) {
      this.stepRegistry.set(step.name, step);
    }
  }

  async execute(context: PipelineContext): Promise<AnalysisResult> {
    const executedSteps: string[] = [];
    const correlationId = uuidv4();

    try {
      // Determinar steps baseado nas opções
      this.steps = this.determineSteps(context.options);
      
      // Executar pipeline
      let currentContext = { ...context };
      
      for (let i = 0; i < this.steps.length; i++) {
        const step = this.steps[i];
        const stepStartTime = Date.now();

        try {
          // Verificar dependências
          await this.checkDependencies(step, executedSteps);
          
          // Executar step com timeout
          currentContext = await this.executeStepWithTimeout(step, currentContext);
          
          executedSteps.push(step.name);
          
          // Métricas
          const stepDuration = Date.now() - stepStartTime;
          this.metrics.recordStepDuration(step.name, stepDuration);
          
          // Evento de progresso
          await this.emitProgressEvent(
            currentContext,
            i + 1,
            this.steps.length,
            correlationId
          );

        } catch (error) {
          // Retry policy
          if (step.retryPolicy && this.shouldRetry(step, error)) {
            i--; // Repetir step
            continue;
          }

          // Rollback em caso de erro
          await this.rollbackExecutedSteps(executedSteps, currentContext);
          throw new PipelineExecutionError(
            `Pipeline failed at step ${step.name}`,
            { step: step.name, context: currentContext, cause: error }
          );
        }
      }

      // Extrair resultado final
      const result = this.extractResult(currentContext);
      
      // Evento de conclusão
      await this.emitCompletionEvent(currentContext, result, correlationId);
      
      return result;

    } catch (error) {
      // Evento de falha
      await this.emitFailureEvent(context, error, correlationId);
      throw error;
    }
  }

  private determineSteps(options: AnalysisOptions): PipelineStep[] {
    const steps: PipelineStep[] = [
      this.stepRegistry.get('document-validation')!,
      this.stepRegistry.get('text-extraction')!,
      this.stepRegistry.get('rule-analysis')!
    ];

    if (options.aiEnabled) {
      steps.push(this.stepRegistry.get('ai-analysis')!);
    }

    steps.push(
      this.stepRegistry.get('result-consolidation')!,
      this.stepRegistry.get('quality-assurance')!
    );

    if (options.notifyOnCompletion) {
      steps.push(this.stepRegistry.get('notification')!);
    }

    return steps;
  }

  private async executeStepWithTimeout(
    step: PipelineStep,
    context: PipelineContext
  ): Promise<PipelineContext> {
    const timeout = step.timeout || 60000; // 60s default

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new StepTimeoutError(`Step ${step.name} timed out after ${timeout}ms`));
      }, timeout);

      step.execute(context)
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async checkDependencies(
    step: PipelineStep,
    executedSteps: string[]
  ): Promise<void> {
    if (!step.dependencies) return;

    for (const dependency of step.dependencies) {
      if (!executedSteps.includes(dependency)) {
        throw new DependencyNotMetError(
          `Step ${step.name} requires ${dependency} to be executed first`
        );
      }
    }
  }

  private async rollbackExecutedSteps(
    executedSteps: string[],
    context: PipelineContext
  ): Promise<void> {
    // Rollback na ordem reversa
    for (const stepName of executedSteps.reverse()) {
      const step = this.stepRegistry.get(stepName);
      if (step?.rollback) {
        try {
          await step.rollback(context);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed for step ${stepName}`, {
            error: rollbackError.message,
            context
          });
        }
      }
    }
  }

  private shouldRetry(step: PipelineStep, error: Error): boolean {
    if (!step.retryPolicy) return false;

    // Implementar lógica de retry baseada na policy
    return step.retryPolicy.shouldRetry(error);
  }

  private extractResult(context: PipelineContext): AnalysisResult {
    return {
      analysisId: context.analysisId,
      documentId: context.documentId,
      conformityScore: context.results.get('conformity-score') || 0,
      problems: context.results.get('problems') || [],
      executionTime: Date.now() - context.startTime.getTime(),
      stepsExecuted: Array.from(context.results.keys()),
      metadata: context.metadata
    };
  }

  private async emitProgressEvent(
    context: PipelineContext,
    currentStep: number,
    totalSteps: number,
    correlationId: string
  ): Promise<void> {
    await this.eventBus.publish({
      type: 'analysis.progress.updated',
      aggregateId: context.analysisId,
      aggregateType: 'analysis',
      version: 1,
      data: {
        analysisId: context.analysisId,
        documentId: context.documentId,
        progress: (currentStep / totalSteps) * 100,
        currentStep: this.steps[currentStep - 1]?.name || 'unknown',
        estimatedTimeRemaining: this.estimateRemainingTime(currentStep, totalSteps)
      },
      metadata: {
        timestamp: new Date(),
        correlationId
      }
    });
  }

  private estimateRemainingTime(currentStep: number, totalSteps: number): number {
    const avgStepTime = 8000; // 8s per step
    const remainingSteps = totalSteps - currentStep;
    return remainingSteps * avgStepTime;
  }
}
```

#### Specialized Pipeline Steps
```typescript
// ✅ Step específico para análise por IA
class AIAnalysisStep implements PipelineStep {
  name = 'ai-analysis';
  timeout = 120000; // 2 minutes
  dependencies = ['text-extraction'];

  constructor(
    private aiService: AIService,
    private circuitBreaker: CircuitBreaker
  ) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const document = context.results.get('extracted-text');
    if (!document) {
      throw new Error('Text extraction required before AI analysis');
    }

    try {
      const aiResult = await this.circuitBreaker.execute(async () => {
        return this.aiService.analyzeDocument(document, {
          type: context.options.documentType,
          language: 'pt-BR',
          includeReasons: true
        });
      });

      // Armazenar resultado
      context.results.set('ai-analysis', aiResult);
      context.metadata.aiAnalysisUsed = true;
      context.metadata.aiConfidence = aiResult.confidence;

      return context;

    } catch (error) {
      if (error instanceof CircuitOpenError) {
        // Degradação graceful - pular análise por IA
        context.metadata.aiAnalysisSkipped = true;
        context.metadata.aiSkipReason = 'Circuit breaker open';
        return context;
      }

      throw new AIAnalysisError('Failed to perform AI analysis', {
        cause: error,
        documentId: context.documentId
      });
    }
  }

  async rollback(context: PipelineContext): Promise<void> {
    // Limpar resultados de IA
    context.results.delete('ai-analysis');
    delete context.metadata.aiAnalysisUsed;
    delete context.metadata.aiConfidence;
  }
}

// ✅ Step para consolidação de resultados
class ResultConsolidationStep implements PipelineStep {
  name = 'result-consolidation';
  dependencies = ['rule-analysis'];

  constructor(private consolidationEngine: ConsolidationEngine) {}

  async execute(context: PipelineContext): Promise<PipelineContext> {
    const ruleResults = context.results.get('rule-analysis');
    const aiResults = context.results.get('ai-analysis');

    if (!ruleResults) {
      throw new Error('Rule analysis required for consolidation');
    }

    // Consolidar resultados
    const consolidatedResults = await this.consolidationEngine.consolidate({
      ruleResults,
      aiResults,
      documentType: context.options.documentType,
      confidence: context.metadata.aiConfidence || 0
    });

    // Calcular score final
    const conformityScore = this.calculateConformityScore(consolidatedResults);

    context.results.set('consolidated-problems', consolidatedResults.problems);
    context.results.set('conformity-score', conformityScore);
    context.metadata.consolidationMethod = consolidatedResults.method;

    return context;
  }

  private calculateConformityScore(results: ConsolidatedResults): number {
    const baseScore = 100;
    let deductions = 0;

    for (const problem of results.problems) {
      switch (problem.severity) {
        case 'critica':
          deductions += 20;
          break;
        case 'alta':
          deductions += 10;
          break;
        case 'media':
          deductions += 5;
          break;
        case 'baixa':
          deductions += 2;
          break;
      }
    }

    return Math.max(0, baseScore - deductions);
  }
}
```

### Batch Processing Orchestration

#### Job Queue Management
```typescript
// ✅ Sistema de filas para processamento em lote
interface Job {
  id: string;
  type: string;
  data: Record<string, unknown>;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay?: number;
  createdAt: Date;
  scheduledFor?: Date;
}

interface JobProcessor {
  process(job: Job): Promise<JobResult>;
  canHandle(jobType: string): boolean;
}

interface JobResult {
  success: boolean;
  result?: any;
  error?: string;
  shouldRetry?: boolean;
  retryDelay?: number;
}

class JobOrchestrator {
  private processors = new Map<string, JobProcessor>();
  private queues = new Map<string, Job[]>();
  private processing = new Set<string>();

  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private metrics: MetricsCollector
  ) {
    this.startProcessing();
  }

  registerProcessor(jobType: string, processor: JobProcessor): void {
    this.processors.set(jobType, processor);
    
    if (!this.queues.has(jobType)) {
      this.queues.set(jobType, []);
    }
  }

  async enqueue(job: Omit<Job, 'id' | 'attempts' | 'createdAt'>): Promise<string> {
    const fullJob: Job = {
      ...job,
      id: uuidv4(),
      attempts: 0,
      createdAt: new Date()
    };

    const queue = this.queues.get(job.type);
    if (!queue) {
      throw new Error(`No queue found for job type ${job.type}`);
    }

    // Inserir com prioridade
    this.insertWithPriority(queue, fullJob);

    // Emitir evento
    await this.eventBus.publish({
      type: 'job.queued',
      aggregateId: fullJob.id,
      aggregateType: 'job',
      version: 1,
      data: {
        jobId: fullJob.id,
        jobType: fullJob.type,
        priority: fullJob.priority,
        queueSize: queue.length
      },
      metadata: {
        timestamp: new Date(),
        correlationId: uuidv4()
      }
    });

    return fullJob.id;
  }

  private insertWithPriority(queue: Job[], job: Job): void {
    let inserted = false;
    
    for (let i = 0; i < queue.length; i++) {
      if (job.priority > queue[i].priority) {
        queue.splice(i, 0, job);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      queue.push(job);
    }
  }

  private async startProcessing(): Promise<void> {
    setInterval(async () => {
      for (const [jobType, queue] of this.queues) {
        if (queue.length > 0 && !this.processing.has(jobType)) {
          await this.processNextJob(jobType);
        }
      }
    }, 1000); // Check every second
  }

  private async processNextJob(jobType: string): Promise<void> {
    const queue = this.queues.get(jobType)!;
    const job = queue.shift();
    
    if (!job) return;

    // Verificar se deve ser processado agora
    if (job.scheduledFor && job.scheduledFor > new Date()) {
      // Recolocar na fila
      this.insertWithPriority(queue, job);
      return;
    }

    this.processing.add(jobType);

    try {
      await this.executeJob(job);
    } finally {
      this.processing.delete(jobType);
    }
  }

  private async executeJob(job: Job): Promise<void> {
    const processor = this.processors.get(job.type);
    if (!processor) {
      this.logger.error(`No processor found for job type ${job.type}`);
      return;
    }

    const startTime = Date.now();
    job.attempts++;

    try {
      // Emitir evento de início
      await this.eventBus.publish({
        type: 'job.started',
        aggregateId: job.id,
        aggregateType: 'job',
        version: 1,
        data: {
          jobId: job.id,
          jobType: job.type,
          attempt: job.attempts
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Processar job
      const result = await processor.process(job);
      const duration = Date.now() - startTime;

      // Métricas
      this.metrics.recordJobDuration(job.type, duration);
      this.metrics.incrementJobCounter(job.type, 'completed');

      if (result.success) {
        // Emitir evento de sucesso
        await this.eventBus.publish({
          type: 'job.completed',
          aggregateId: job.id,
          aggregateType: 'job',
          version: 1,
          data: {
            jobId: job.id,
            jobType: job.type,
            duration,
            result: result.result
          },
          metadata: {
            timestamp: new Date(),
            correlationId: uuidv4()
          }
        });
      } else {
        await this.handleJobFailure(job, result);
      }

    } catch (error) {
      await this.handleJobFailure(job, {
        success: false,
        error: error.message,
        shouldRetry: true
      });
    }
  }

  private async handleJobFailure(job: Job, result: JobResult): Promise<void> {
    this.metrics.incrementJobCounter(job.type, 'failed');

    if (result.shouldRetry && job.attempts < job.maxAttempts) {
      // Reagendar job com delay
      const delay = result.retryDelay || this.calculateBackoffDelay(job.attempts);
      job.scheduledFor = new Date(Date.now() + delay);
      
      const queue = this.queues.get(job.type)!;
      this.insertWithPriority(queue, job);

      // Emitir evento de retry
      await this.eventBus.publish({
        type: 'job.retrying',
        aggregateId: job.id,
        aggregateType: 'job',
        version: 1,
        data: {
          jobId: job.id,
          jobType: job.type,
          attempt: job.attempts,
          nextAttemptAt: job.scheduledFor,
          error: result.error
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });
    } else {
      // Job falhou definitivamente
      await this.eventBus.publish({
        type: 'job.failed',
        aggregateId: job.id,
        aggregateType: 'job',
        version: 1,
        data: {
          jobId: job.id,
          jobType: job.type,
          finalAttempt: job.attempts,
          error: result.error
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });
    }
  }

  private calculateBackoffDelay(attempts: number): number {
    // Exponential backoff with jitter
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    
    const delay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
    const jitter = Math.random() * 0.1 * delay; // 10% jitter
    
    return delay + jitter;
  }

  async getQueueStats(jobType: string): Promise<QueueStats> {
    const queue = this.queues.get(jobType) || [];
    
    return {
      jobType,
      queueSize: queue.length,
      isProcessing: this.processing.has(jobType),
      oldestJob: queue.length > 0 ? queue[queue.length - 1].createdAt : null,
      avgPriority: queue.reduce((sum, job) => sum + job.priority, 0) / queue.length || 0
    };
  }
}

// ✅ Processor específico para análise em lote
class BatchAnalysisProcessor implements JobProcessor {
  constructor(
    private analysisService: DocumentAnalysisService,
    private notificationService: NotificationService
  ) {}

  canHandle(jobType: string): boolean {
    return jobType === 'batch-analysis';
  }

  async process(job: Job): Promise<JobResult> {
    const { documentIds, userId, options } = job.data as {
      documentIds: string[];
      userId: string;
      options: AnalysisOptions;
    };

    try {
      const results: AnalysisResult[] = [];
      const errors: Array<{ documentId: string; error: string }> = [];

      // Processar documentos em paralelo (limitado)
      const concurrency = 3;
      const chunks = this.chunkArray(documentIds, concurrency);

      for (const chunk of chunks) {
        const promises = chunk.map(async (documentId) => {
          try {
            const result = await this.analysisService.analyzeDocument(documentId, options);
            results.push(result);
          } catch (error) {
            errors.push({
              documentId,
              error: error.message
            });
          }
        });

        await Promise.all(promises);
      }

      // Enviar notificação de conclusão
      await this.notificationService.sendBatchAnalysisComplete({
        userId,
        totalDocuments: documentIds.length,
        successfulAnalyses: results.length,
        errors: errors.length,
        results
      });

      return {
        success: true,
        result: {
          processedDocuments: results.length,
          errors: errors.length,
          results,
          errors: errors
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        shouldRetry: true,
        retryDelay: 30000 // 30 seconds
      };
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

---

## 📊 Monitoring and Observability

### Distributed Tracing

#### Trace Context Management
```typescript
// ✅ Contexto de tracing distribuído
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage: Record<string, string>;
  flags: number;
}

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tags: Record<string, any>;
  logs: SpanLog[];
  status: 'pending' | 'success' | 'error';
}

interface SpanLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

class DistributedTracer {
  private activeSpans = new Map<string, Span>();
  private completedSpans: Span[] = [];

  constructor(
    private serviceName: string,
    private eventBus: EventBus
  ) {}

  startSpan(
    operationName: string, 
    parentContext?: TraceContext
  ): { span: Span; context: TraceContext } {
    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    
    const span: Span = {
      traceId,
      spanId,
      parentSpanId: parentContext?.spanId,
      operationName,
      startTime: new Date(),
      tags: {
        'service.name': this.serviceName,
        'service.version': process.env.SERVICE_VERSION || 'unknown'
      },
      logs: [],
      status: 'pending'
    };

    this.activeSpans.set(spanId, span);

    const context: TraceContext = {
      traceId,
      spanId,
      parentSpanId: parentContext?.spanId,
      baggage: { ...parentContext?.baggage },
      flags: 1
    };

    return { span, context };
  }

  finishSpan(spanId: string, status: 'success' | 'error' = 'success'): void {
    const span = this.activeSpans.get(spanId);
    if (!span) return;

    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;

    this.activeSpans.delete(spanId);
    this.completedSpans.push(span);

    // Enviar span para sistema de tracing
    this.sendSpan(span);
  }

  addTag(spanId: string, key: string, value: any): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  addLog(spanId: string, level: SpanLog['level'], message: string, fields?: Record<string, any>): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: new Date(),
        level,
        message,
        fields
      });
    }
  }

  private async sendSpan(span: Span): Promise<void> {
    try {
      // Enviar para Jaeger, Zipkin ou sistema similar
      await this.eventBus.publish({
        type: 'trace.span.completed',
        aggregateId: span.spanId,
        aggregateType: 'span',
        version: 1,
        data: {
          ...span,
          serviceName: this.serviceName
        },
        metadata: {
          timestamp: new Date(),
          correlationId: span.traceId
        }
      });
    } catch (error) {
      console.error('Failed to send span:', error);
    }
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractContextFromHeaders(headers: Record<string, string>): TraceContext | null {
    const traceHeader = headers['x-trace-context'];
    if (!traceHeader) return null;

    try {
      return JSON.parse(Buffer.from(traceHeader, 'base64').toString());
    } catch {
      return null;
    }
  }

  injectContextToHeaders(context: TraceContext): Record<string, string> {
    return {
      'x-trace-context': Buffer.from(JSON.stringify(context)).toString('base64')
    };
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  getTraceMetrics(traceId: string) {
    const spans = this.completedSpans.filter(s => s.traceId === traceId);
    
    if (spans.length === 0) return null;

    const totalDuration = Math.max(...spans.map(s => (s.endTime?.getTime() || 0) - s.startTime.getTime()));
    const spanCount = spans.length;
    const errorCount = spans.filter(s => s.status === 'error').length;

    return {
      traceId,
      totalDuration,
      spanCount,
      errorCount,
      errorRate: errorCount / spanCount,
      services: [...new Set(spans.map(s => s.tags['service.name']))],
      criticalPath: this.calculateCriticalPath(spans)
    };
  }

  private calculateCriticalPath(spans: Span[]): Span[] {
    // Implementar algoritmo para encontrar caminho crítico
    // (path mais longo na árvore de spans)
    return spans.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }
}

// ✅ Middleware para instrumentação automática
export const tracingMiddleware = (tracer: DistributedTracer) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extrair contexto do header
    const parentContext = tracer.extractContextFromHeaders(req.headers as Record<string, string>);
    
    // Criar span para request
    const { span, context } = tracer.startSpan(
      `${req.method} ${req.path}`,
      parentContext
    );

    // Adicionar tags
    tracer.addTag(span.spanId, 'http.method', req.method);
    tracer.addTag(span.spanId, 'http.url', req.url);
    tracer.addTag(span.spanId, 'http.user_agent', req.get('User-Agent'));

    // Anexar contexto ao request
    (req as any).traceContext = context;
    (req as any).spanId = span.spanId;

    // Finalizar span ao terminar response
    res.on('finish', () => {
      tracer.addTag(span.spanId, 'http.status_code', res.statusCode);
      
      const status = res.statusCode >= 400 ? 'error' : 'success';
      tracer.finishSpan(span.spanId, status);
    });

    next();
  };
};
```

### Metrics Collection and Aggregation

#### Custom Metrics System
```typescript
// ✅ Sistema de métricas customizado
interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

interface MetricAggregation {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  constructor(
    private eventBus: EventBus,
    private flushInterval = 60000 // 1 minute
  ) {
    this.startPeriodicFlush();
  }

  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.buildMetricKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);

    this.addMetric({
      name,
      type: 'counter',
      value: currentValue + value,
      labels,
      timestamp: new Date()
    });
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildMetricKey(name, labels);
    this.gauges.set(key, value);

    this.addMetric({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date()
    });
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.buildMetricKey(name, labels);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    
    this.histograms.get(key)!.push(value);

    this.addMetric({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: new Date()
    });
  }

  recordStepDuration(stepName: string, duration: number): void {
    this.recordHistogram('pipeline_step_duration_ms', duration, {
      step: stepName
    });
  }

  recordJobDuration(jobType: string, duration: number): void {
    this.recordHistogram('job_duration_ms', duration, {
      job_type: jobType
    });
  }

  incrementJobCounter(jobType: string, status: string): void {
    this.incrementCounter('jobs_total', {
      job_type: jobType,
      status
    });
  }

  recordAnalysisMetrics(result: AnalysisResult): void {
    this.recordHistogram('analysis_duration_ms', result.executionTime, {
      document_type: result.documentType || 'unknown'
    });

    this.setGauge('analysis_conformity_score', result.conformityScore, {
      document_type: result.documentType || 'unknown'
    });

    this.incrementCounter('analysis_problems_total', {
      document_type: result.documentType || 'unknown'
    }, result.problems.length);

    // Métricas por severidade
    for (const problem of result.problems) {
      this.incrementCounter('problems_by_severity', {
        severity: problem.severity,
        category: problem.category
      });
    }
  }

  getAggregatedMetrics(name: string, timeRange?: { start: Date; end: Date }): MetricAggregation | null {
    let filteredMetrics = this.metrics.filter(m => m.name === name);

    if (timeRange) {
      filteredMetrics = filteredMetrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) return null;

    const values = filteredMetrics.map(m => m.value);
    const sortedValues = values.sort((a, b) => a - b);

    return {
      count: values.length,
      sum: values.reduce((sum, val) => sum + val, 0),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      p50: this.percentile(sortedValues, 0.5),
      p95: this.percentile(sortedValues, 0.95),
      p99: this.percentile(sortedValues, 0.99)
    };
  }

  private percentile(sortedValues: number[], p: number): number {
    const index = Math.ceil(sortedValues.length * p) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private buildMetricKey(name: string, labels: Record<string, string>): string {
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}{${labelString}}`;
  }

  private addMetric(metric: Metric): void {
    this.metrics.push(metric);
    
    // Manter apenas últimas 10k métricas em memória
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private async startPeriodicFlush(): Promise<void> {
    setInterval(async () => {
      await this.flushMetrics();
    }, this.flushInterval);
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // Agregar métricas por tipo
      const aggregatedMetrics = this.aggregateMetrics();

      // Enviar para sistema de métricas (Prometheus, InfluxDB, etc.)
      await this.eventBus.publish({
        type: 'metrics.batch',
        aggregateId: uuidv4(),
        aggregateType: 'metrics',
        version: 1,
        data: {
          metrics: aggregatedMetrics,
          timestamp: new Date(),
          service: 'document-analysis'
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Limpar métricas antigas
      const cutoff = new Date(Date.now() - this.flushInterval * 2);
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff);

    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  private aggregateMetrics(): Record<string, any> {
    const aggregated: Record<string, any> = {};

    // Agrupar por nome de métrica
    const groupedMetrics = this.metrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric);
      return groups;
    }, {} as Record<string, Metric[]>);

    // Agregar cada grupo
    for (const [name, metrics] of Object.entries(groupedMetrics)) {
      const latestMetric = metrics[metrics.length - 1];
      
      switch (latestMetric.type) {
        case 'counter':
          aggregated[`${name}_total`] = this.aggregateCounter(metrics);
          break;
        case 'gauge':
          aggregated[`${name}_current`] = this.aggregateGauge(metrics);
          break;
        case 'histogram':
          aggregated[`${name}_histogram`] = this.aggregateHistogram(metrics);
          break;
      }
    }

    return aggregated;
  }

  private aggregateCounter(metrics: Metric[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const metric of metrics) {
      const key = this.buildMetricKey('', metric.labels);
      result[key] = (result[key] || 0) + metric.value;
    }

    return result;
  }

  private aggregateGauge(metrics: Metric[]): Record<string, number> {
    const result: Record<string, number> = {};
    
    // Para gauges, manter apenas o valor mais recente por label
    for (const metric of metrics) {
      const key = this.buildMetricKey('', metric.labels);
      result[key] = metric.value;
    }

    return result;
  }

  private aggregateHistogram(metrics: Metric[]): Record<string, MetricAggregation> {
    const grouped: Record<string, number[]> = {};
    
    for (const metric of metrics) {
      const key = this.buildMetricKey('', metric.labels);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(metric.value);
    }

    const result: Record<string, MetricAggregation> = {};
    
    for (const [key, values] of Object.entries(grouped)) {
      const sortedValues = values.sort((a, b) => a - b);
      
      result[key] = {
        count: values.length,
        sum: values.reduce((sum, val) => sum + val, 0),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p50: this.percentile(sortedValues, 0.5),
        p95: this.percentile(sortedValues, 0.95),
        p99: this.percentile(sortedValues, 0.99)
      };
    }

    return result;
  }

  exportPrometheusMetrics(): string {
    const lines: string[] = [];
    
    // Exportar counters
    for (const [key, value] of this.counters) {
      const [name, labels] = this.parseMetricKey(key);
      lines.push(`${name}_total${labels} ${value}`);
    }

    // Exportar gauges
    for (const [key, value] of this.gauges) {
      const [name, labels] = this.parseMetricKey(key);
      lines.push(`${name}${labels} ${value}`);
    }

    // Exportar histograms (summary format)
    for (const [key, values] of this.histograms) {
      const [name, labels] = this.parseMetricKey(key);
      const sortedValues = values.sort((a, b) => a - b);
      
      lines.push(`${name}_count${labels} ${values.length}`);
      lines.push(`${name}_sum${labels} ${values.reduce((a, b) => a + b, 0)}`);
      lines.push(`${name}_bucket{le="0.5",${labels.slice(1)}} ${this.percentile(sortedValues, 0.5)}`);
      lines.push(`${name}_bucket{le="0.95",${labels.slice(1)}} ${this.percentile(sortedValues, 0.95)}`);
      lines.push(`${name}_bucket{le="0.99",${labels.slice(1)}} ${this.percentile(sortedValues, 0.99)}`);
    }

    return lines.join('\n');
  }

  private parseMetricKey(key: string): [string, string] {
    const match = key.match(/^([^{]+)(\{.*\})?$/);
    if (!match) return [key, ''];
    
    return [match[1], match[2] || ''];
  }
}
```

---

## 🚨 Incident Response and Recovery

### Automated Recovery Procedures

#### Self-Healing System
```typescript
// ✅ Sistema de auto-recuperação
interface HealthCheck {
  name: string;
  check(): Promise<HealthCheckResult>;
  recover?(): Promise<void>;
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  maxRetries: number;
}

interface HealthCheckResult {
  healthy: boolean;
  message?: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

interface RecoveryAction {
  name: string;
  execute(): Promise<RecoveryResult>;
  canRollback: boolean;
  rollback?(): Promise<void>;
}

interface RecoveryResult {
  success: boolean;
  message: string;
  actionsExecuted: string[];
}

class SelfHealingOrchestrator {
  private healthChecks = new Map<string, HealthCheck>();
  private recoveryActions = new Map<string, RecoveryAction>();
  private isRecovering = false;
  private recoveryHistory: RecoveryAttempt[] = [];

  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private notificationService: NotificationService
  ) {
    this.registerDefaultHealthChecks();
    this.registerDefaultRecoveryActions();
    this.startHealthMonitoring();
  }

  registerHealthCheck(healthCheck: HealthCheck): void {
    this.healthChecks.set(healthCheck.name, healthCheck);
  }

  registerRecoveryAction(action: RecoveryAction): void {
    this.recoveryActions.set(action.name, action);
  }

  private registerDefaultHealthChecks(): void {
    this.registerHealthCheck({
      name: 'database-connectivity',
      criticalityLevel: 'critical',
      maxRetries: 3,
      async check() {
        try {
          const start = Date.now();
          // Verificar conexão com database
          await database.ping();
          const responseTime = Date.now() - start;
          
          return {
            healthy: responseTime < 5000, // 5s timeout
            responseTime,
            message: responseTime < 5000 ? 'Database accessible' : 'Database slow response'
          };
        } catch (error) {
          return {
            healthy: false,
            message: `Database connection failed: ${error.message}`
          };
        }
      },
      async recover() {
        // Tentar reconectar ao database
        await database.reconnect();
      }
    });

    this.registerHealthCheck({
      name: 'ai-service-availability',
      criticalityLevel: 'high',
      maxRetries: 2,
      async check() {
        try {
          const start = Date.now();
          const response = await aiService.healthCheck();
          const responseTime = Date.now() - start;
          
          return {
            healthy: response.status === 'ok' && responseTime < 30000,
            responseTime,
            message: response.message
          };
        } catch (error) {
          return {
            healthy: false,
            message: `AI service unavailable: ${error.message}`
          };
        }
      }
    });

    this.registerHealthCheck({
      name: 'memory-usage',
      criticalityLevel: 'medium',
      maxRetries: 1,
      async check() {
        const usage = process.memoryUsage();
        const usedMB = usage.heapUsed / 1024 / 1024;
        const totalMB = usage.heapTotal / 1024 / 1024;
        const percentage = (usedMB / totalMB) * 100;
        
        return {
          healthy: percentage < 85, // 85% threshold
          message: `Memory usage: ${percentage.toFixed(1)}%`,
          metadata: { usedMB, totalMB, percentage }
        };
      },
      async recover() {
        // Forçar garbage collection
        if (global.gc) {
          global.gc();
        }
        
        // Limpar caches desnecessários
        await cacheService.clearExpired();
      }
    });
  }

  private registerDefaultRecoveryActions(): void {
    this.recoveryActions.set('restart-service', {
      name: 'restart-service',
      canRollback: false,
      async execute() {
        // Em um ambiente real, isso seria uma chamada para o orquestrador
        // Kubernetes, Docker Swarm, etc.
        console.log('Executing service restart...');
        
        return {
          success: true,
          message: 'Service restart initiated',
          actionsExecuted: ['service-restart']
        };
      }
    });

    this.recoveryActions.set('clear-cache', {
      name: 'clear-cache',
      canRollback: true,
      async execute() {
        await cacheService.clearAll();
        
        return {
          success: true,
          message: 'All caches cleared',
          actionsExecuted: ['cache-clear']
        };
      },
      async rollback() {
        // Recarregar caches críticos
        await cacheService.warmUp();
      }
    });

    this.recoveryActions.set('scale-up', {
      name: 'scale-up',
      canRollback: true,
      async execute() {
        // Escalar horizontalmente
        console.log('Scaling up service instances...');
        
        return {
          success: true,
          message: 'Service scaled up',
          actionsExecuted: ['horizontal-scale']
        };
      },
      async rollback() {
        // Reverter escala
        console.log('Scaling down to original size...');
      }
    });
  }

  private async startHealthMonitoring(): Promise<void> {
    const interval = 30000; // 30 seconds
    
    setInterval(async () => {
      if (this.isRecovering) return;
      
      await this.runHealthChecks();
    }, interval);
  }

  private async runHealthChecks(): Promise<void> {
    const results = new Map<string, HealthCheckResult>();
    const unhealthyChecks: string[] = [];

    // Executar todos os health checks
    for (const [name, healthCheck] of this.healthChecks) {
      try {
        const result = await healthCheck.check();
        results.set(name, result);
        
        if (!result.healthy) {
          unhealthyChecks.push(name);
        }
      } catch (error) {
        results.set(name, {
          healthy: false,
          message: `Health check failed: ${error.message}`
        });
        unhealthyChecks.push(name);
      }
    }

    // Emitir eventos de saúde
    await this.eventBus.publish({
      type: 'system.health.checked',
      aggregateId: 'system',
      aggregateType: 'system',
      version: 1,
      data: {
        timestamp: new Date(),
        results: Object.fromEntries(results),
        unhealthyCount: unhealthyChecks.length,
        totalChecks: this.healthChecks.size
      },
      metadata: {
        timestamp: new Date(),
        correlationId: uuidv4()
      }
    });

    // Iniciar recuperação se necessário
    if (unhealthyChecks.length > 0) {
      await this.initiateRecovery(unhealthyChecks, results);
    }
  }

  private async initiateRecovery(
    unhealthyChecks: string[],
    healthResults: Map<string, HealthCheckResult>
  ): Promise<void> {
    if (this.isRecovering) return;
    
    this.isRecovering = true;
    const recoveryId = uuidv4();

    try {
      this.logger.warn('Initiating automated recovery', {
        recoveryId,
        unhealthyChecks,
        timestamp: new Date()
      });

      // Emitir evento de início de recuperação
      await this.eventBus.publish({
        type: 'system.recovery.started',
        aggregateId: recoveryId,
        aggregateType: 'recovery',
        version: 1,
        data: {
          recoveryId,
          unhealthyChecks,
          healthResults: Object.fromEntries(healthResults)
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      const recovery: RecoveryAttempt = {
        id: recoveryId,
        startTime: new Date(),
        unhealthyChecks,
        actionsExecuted: [],
        success: false
      };

      // Determinar estratégia de recuperação
      const strategy = this.determineRecoveryStrategy(unhealthyChecks);
      
      // Executar ações de recuperação
      for (const actionName of strategy.actions) {
        const action = this.recoveryActions.get(actionName);
        if (!action) continue;

        try {
          const result = await action.execute();
          recovery.actionsExecuted.push(actionName);
          
          if (!result.success) {
            throw new Error(result.message);
          }
        } catch (error) {
          this.logger.error(`Recovery action ${actionName} failed`, {
            error: error.message,
            recoveryId
          });
          
          // Rollback se possível
          if (action.canRollback && action.rollback) {
            try {
              await action.rollback();
            } catch (rollbackError) {
              this.logger.error(`Rollback failed for ${actionName}`, {
                error: rollbackError.message,
                recoveryId
              });
            }
          }
          
          break;
        }
      }

      // Verificar se recuperação foi bem-sucedida
      await this.wait(10000); // Aguardar 10s para estabilizar
      
      const postRecoveryResults = await this.runPostRecoveryChecks(unhealthyChecks);
      recovery.success = postRecoveryResults.every(result => result.healthy);
      recovery.endTime = new Date();

      this.recoveryHistory.push(recovery);

      // Emitir evento de conclusão
      await this.eventBus.publish({
        type: recovery.success ? 'system.recovery.completed' : 'system.recovery.failed',
        aggregateId: recoveryId,
        aggregateType: 'recovery',
        version: 1,
        data: {
          recoveryId,
          success: recovery.success,
          duration: recovery.endTime.getTime() - recovery.startTime.getTime(),
          actionsExecuted: recovery.actionsExecuted,
          postRecoveryResults
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      if (!recovery.success) {
        // Notificar equipe de operações
        await this.notificationService.sendCriticalAlert({
          title: 'Automated Recovery Failed',
          message: `Recovery attempt ${recoveryId} failed to resolve health issues`,
          unhealthyChecks,
          actionsExecuted: recovery.actionsExecuted
        });
      }

    } finally {
      this.isRecovering = false;
    }
  }

  private determineRecoveryStrategy(unhealthyChecks: string[]): RecoveryStrategy {
    const criticalChecks = unhealthyChecks.filter(name => {
      const check = this.healthChecks.get(name);
      return check?.criticalityLevel === 'critical';
    });

    if (criticalChecks.includes('database-connectivity')) {
      return {
        actions: ['restart-service'],
        escalationLevel: 'critical'
      };
    }

    if (unhealthyChecks.includes('memory-usage')) {
      return {
        actions: ['clear-cache', 'scale-up'],
        escalationLevel: 'medium'
      };
    }

    if (unhealthyChecks.includes('ai-service-availability')) {
      return {
        actions: ['clear-cache'],
        escalationLevel: 'medium'
      };
    }

    return {
      actions: ['clear-cache'],
      escalationLevel: 'low'
    };
  }

  private async runPostRecoveryChecks(originalUnhealthyChecks: string[]): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const checkName of originalUnhealthyChecks) {
      const healthCheck = this.healthChecks.get(checkName);
      if (!healthCheck) continue;

      try {
        const result = await healthCheck.check();
        results.push(result);
      } catch (error) {
        results.push({
          healthy: false,
          message: `Post-recovery check failed: ${error.message}`
        });
      }
    }

    return results;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRecoveryHistory(): RecoveryAttempt[] {
    return [...this.recoveryHistory];
  }

  getSystemHealth(): SystemHealthStatus {
    const lastCheck = this.recoveryHistory[this.recoveryHistory.length - 1];
    const recentRecoveries = this.recoveryHistory.filter(
      r => Date.now() - r.startTime.getTime() < 24 * 60 * 60 * 1000 // Last 24h
    );

    return {
      overall: this.isRecovering ? 'recovering' : 'healthy',
      lastRecovery: lastCheck,
      recoveriesLast24h: recentRecoveries.length,
      isRecovering: this.isRecovering,
      registeredChecks: this.healthChecks.size,
      availableActions: this.recoveryActions.size
    };
  }
}

interface RecoveryAttempt {
  id: string;
  startTime: Date;
  endTime?: Date;
  unhealthyChecks: string[];
  actionsExecuted: string[];
  success: boolean;
}

interface RecoveryStrategy {
  actions: string[];
  escalationLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'recovering';
  lastRecovery?: RecoveryAttempt;
  recoveriesLast24h: number;
  isRecovering: boolean;
  registeredChecks: number;
  availableActions: number;
}
```

### Disaster Recovery Orchestration

#### Backup and Restore Coordination
```typescript
// ✅ Orquestração de backup e restore
interface BackupMetadata {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  timestamp: Date;
  size: number;
  checksum: string;
  components: BackupComponent[];
  retention: Date;
  encrypted: boolean;
}

interface BackupComponent {
  name: string;
  type: 'database' | 'files' | 'configuration' | 'logs';
  path: string;
  size: number;
  checksum: string;
}

interface RestorePoint {
  id: string;
  backupId: string;
  description: string;
  timestamp: Date;
  components: string[];
  verified: boolean;
}

class DisasterRecoveryOrchestrator {
  private backupProviders = new Map<string, BackupProvider>();
  private activeBackups = new Set<string>();

  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private notificationService: NotificationService,
    private storageService: StorageService
  ) {
    this.registerBackupProviders();
    this.schedulePeriodicBackups();
  }

  private registerBackupProviders(): void {
    this.backupProviders.set('database', new DatabaseBackupProvider());
    this.backupProviders.set('files', new FileSystemBackupProvider());
    this.backupProviders.set('configuration', new ConfigurationBackupProvider());
  }

  async createBackup(
    type: 'full' | 'incremental' = 'incremental',
    components: string[] = ['database', 'files', 'configuration']
  ): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (this.activeBackups.has('any')) {
      throw new Error('Another backup is already in progress');
    }

    this.activeBackups.add(backupId);

    try {
      const backup: BackupMetadata = {
        id: backupId,
        type,
        timestamp: new Date(),
        size: 0,
        checksum: '',
        components: [],
        retention: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        encrypted: true
      };

      // Emitir evento de início
      await this.eventBus.publish({
        type: 'backup.started',
        aggregateId: backupId,
        aggregateType: 'backup',
        version: 1,
        data: {
          backupId,
          type,
          components,
          timestamp: backup.timestamp
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Executar backup de cada componente
      for (const componentName of components) {
        const provider = this.backupProviders.get(componentName);
        if (!provider) {
          this.logger.warn(`No backup provider for component ${componentName}`);
          continue;
        }

        try {
          const component = await provider.backup(type);
          backup.components.push(component);
          backup.size += component.size;

          this.logger.info(`Component ${componentName} backed up successfully`, {
            backupId,
            componentSize: component.size
          });

        } catch (error) {
          this.logger.error(`Failed to backup component ${componentName}`, {
            backupId,
            error: error.message
          });
          
          // Para backup full, falha de qualquer componente falha o backup inteiro
          if (type === 'full') {
            throw error;
          }
        }
      }

      // Calcular checksum do backup completo
      backup.checksum = await this.calculateBackupChecksum(backup.components);

      // Armazenar metadados
      await this.storageService.storeBackupMetadata(backup);

      // Emitir evento de conclusão
      await this.eventBus.publish({
        type: 'backup.completed',
        aggregateId: backupId,
        aggregateType: 'backup',
        version: 1,
        data: {
          backupId,
          type,
          size: backup.size,
          components: backup.components.length,
          duration: Date.now() - backup.timestamp.getTime()
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      this.logger.info(`Backup ${backupId} completed successfully`, {
        size: backup.size,
        components: backup.components.length
      });

      return backupId;

    } catch (error) {
      // Emitir evento de falha
      await this.eventBus.publish({
        type: 'backup.failed',
        aggregateId: backupId,
        aggregateType: 'backup',
        version: 1,
        data: {
          backupId,
          type,
          error: error.message,
          timestamp: new Date()
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      throw new BackupError(`Backup ${backupId} failed: ${error.message}`, {
        backupId,
        cause: error
      });

    } finally {
      this.activeBackups.delete(backupId);
    }
  }

  async restoreFromBackup(
    backupId: string,
    components: string[] = [],
    targetLocation?: string
  ): Promise<void> {
    const restoreId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Carregar metadados do backup
      const backup = await this.storageService.getBackupMetadata(backupId);
      if (!backup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Verificar integridade do backup
      const isValid = await this.verifyBackupIntegrity(backup);
      if (!isValid) {
        throw new Error(`Backup ${backupId} integrity check failed`);
      }

      // Determinar componentes a restaurar
      const componentsToRestore = components.length > 0 
        ? components 
        : backup.components.map(c => c.name);

      // Emitir evento de início
      await this.eventBus.publish({
        type: 'restore.started',
        aggregateId: restoreId,
        aggregateType: 'restore',
        version: 1,
        data: {
          restoreId,
          backupId,
          components: componentsToRestore,
          targetLocation
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Executar restore de cada componente
      for (const componentName of componentsToRestore) {
        const component = backup.components.find(c => c.name === componentName);
        if (!component) {
          this.logger.warn(`Component ${componentName} not found in backup ${backupId}`);
          continue;
        }

        const provider = this.backupProviders.get(componentName);
        if (!provider) {
          this.logger.warn(`No restore provider for component ${componentName}`);
          continue;
        }

        try {
          await provider.restore(component, targetLocation);
          
          this.logger.info(`Component ${componentName} restored successfully`, {
            restoreId,
            backupId
          });

        } catch (error) {
          this.logger.error(`Failed to restore component ${componentName}`, {
            restoreId,
            backupId,
            error: error.message
          });
          throw error;
        }
      }

      // Emitir evento de conclusão
      await this.eventBus.publish({
        type: 'restore.completed',
        aggregateId: restoreId,
        aggregateType: 'restore',
        version: 1,
        data: {
          restoreId,
          backupId,
          components: componentsToRestore,
          duration: Date.now() - Date.now() // Placeholder
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      this.logger.info(`Restore ${restoreId} completed successfully`);

    } catch (error) {
      // Emitir evento de falha
      await this.eventBus.publish({
        type: 'restore.failed',
        aggregateId: restoreId,
        aggregateType: 'restore',
        version: 1,
        data: {
          restoreId,
          backupId,
          error: error.message
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      throw new RestoreError(`Restore ${restoreId} failed: ${error.message}`, {
        restoreId,
        backupId,
        cause: error
      });
    }
  }

  async createRestorePoint(description: string): Promise<string> {
    // Criar backup full como ponto de restore
    const backupId = await this.createBackup('full');
    
    const restorePoint: RestorePoint = {
      id: `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      backupId,
      description,
      timestamp: new Date(),
      components: ['database', 'files', 'configuration'],
      verified: false
    };

    // Verificar restore point
    try {
      await this.verifyRestorePoint(restorePoint);
      restorePoint.verified = true;
    } catch (error) {
      this.logger.warn(`Restore point verification failed: ${error.message}`);
    }

    await this.storageService.storeRestorePoint(restorePoint);

    // Emitir evento
    await this.eventBus.publish({
      type: 'restore_point.created',
      aggregateId: restorePoint.id,
      aggregateType: 'restore_point',
      version: 1,
      data: {
        restorePointId: restorePoint.id,
        backupId,
        description,
        verified: restorePoint.verified
      },
      metadata: {
        timestamp: new Date(),
        correlationId: uuidv4()
      }
    });

    return restorePoint.id;
  }

  private async schedulePeriodicBackups(): Promise<void> {
    // Backup incremental diário às 2:00 AM
    const dailyBackupSchedule = '0 2 * * *'; // Cron expression
    
    // Backup full semanal aos domingos às 1:00 AM
    const weeklyBackupSchedule = '0 1 * * 0';

    // Implementar agendamento com cron jobs
    console.log('Backup schedules configured:', {
      daily: dailyBackupSchedule,
      weekly: weeklyBackupSchedule
    });
  }

  private async calculateBackupChecksum(components: BackupComponent[]): Promise<string> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    
    for (const component of components) {
      hash.update(component.checksum);
    }
    
    return hash.digest('hex');
  }

  private async verifyBackupIntegrity(backup: BackupMetadata): Promise<boolean> {
    try {
      // Verificar checksum geral
      const calculatedChecksum = await this.calculateBackupChecksum(backup.components);
      if (calculatedChecksum !== backup.checksum) {
        return false;
      }

      // Verificar cada componente
      for (const component of backup.components) {
        const provider = this.backupProviders.get(component.name);
        if (!provider) continue;

        const isValid = await provider.verifyIntegrity(component);
        if (!isValid) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Backup integrity verification failed', {
        backupId: backup.id,
        error: error.message
      });
      return false;
    }
  }

  private async verifyRestorePoint(restorePoint: RestorePoint): Promise<void> {
    // Verificar se backup ainda existe e está íntegro
    const backup = await this.storageService.getBackupMetadata(restorePoint.backupId);
    if (!backup) {
      throw new Error(`Backup ${restorePoint.backupId} not found`);
    }

    const isValid = await this.verifyBackupIntegrity(backup);
    if (!isValid) {
      throw new Error(`Backup ${restorePoint.backupId} integrity check failed`);
    }
  }

  async listBackups(limit = 50): Promise<BackupMetadata[]> {
    return this.storageService.listBackups(limit);
  }

  async listRestorePoints(): Promise<RestorePoint[]> {
    return this.storageService.listRestorePoints();
  }

  async cleanupExpiredBackups(): Promise<number> {
    const expiredBackups = await this.storageService.getExpiredBackups();
    let deletedCount = 0;

    for (const backup of expiredBackups) {
      try {
        await this.storageService.deleteBackup(backup.id);
        deletedCount++;
        
        this.logger.info(`Deleted expired backup ${backup.id}`, {
          backupDate: backup.timestamp,
          retentionDate: backup.retention
        });
      } catch (error) {
        this.logger.error(`Failed to delete backup ${backup.id}`, {
          error: error.message
        });
      }
    }

    return deletedCount;
  }
}

// ✅ Interface para providers de backup
interface BackupProvider {
  backup(type: 'full' | 'incremental'): Promise<BackupComponent>;
  restore(component: BackupComponent, targetLocation?: string): Promise<void>;
  verifyIntegrity(component: BackupComponent): Promise<boolean>;
}

// ✅ Provider específico para backup de database
class DatabaseBackupProvider implements BackupProvider {
  async backup(type: 'full' | 'incremental'): Promise<BackupComponent> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_${type}_${timestamp}.sql`;
    const path = `/backups/database/${filename}`;

    try {
      // Executar dump do database
      const dumpCommand = type === 'full' 
        ? 'pg_dump --clean --create --format=custom'
        : 'pg_dump --format=custom --incremental';

      // Executar comando de backup (simulado)
      console.log(`Executing database backup: ${dumpCommand}`);
      
      // Calcular tamanho e checksum
      const size = Math.floor(Math.random() * 1000000) + 100000; // Simulado
      const checksum = this.calculateChecksum(path);

      return {
        name: 'database',
        type: 'database',
        path,
        size,
        checksum
      };
    } catch (error) {
      throw new Error(`Database backup failed: ${error.message}`);
    }
  }

  async restore(component: BackupComponent, targetLocation?: string): Promise<void> {
    try {
      // Executar restore do database
      const restoreCommand = `pg_restore --clean --create ${component.path}`;
      console.log(`Executing database restore: ${restoreCommand}`);
      
      // Simulação do restore
      await this.wait(5000);
      
    } catch (error) {
      throw new Error(`Database restore failed: ${error.message}`);
    }
  }

  async verifyIntegrity(component: BackupComponent): Promise<boolean> {
    try {
      // Verificar se arquivo existe e checksum está correto
      const currentChecksum = this.calculateChecksum(component.path);
      return currentChecksum === component.checksum;
    } catch (error) {
      return false;
    }
  }

  private calculateChecksum(filePath: string): string {
    // Simulação de cálculo de checksum
    return `checksum_${filePath.split('/').pop()}`;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🔧 DevOps Integration

### CI/CD Pipeline Orchestration

#### Deployment Automation
```typescript
// ✅ Orquestração de deployment automatizado
interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  version: string;
  strategy: 'blue-green' | 'rolling' | 'canary';
  healthChecks: string[];
  rollbackTriggers: RollbackTrigger[];
  notifications: NotificationConfig[];
}

interface DeploymentStep {
  name: string;
  execute(context: DeploymentContext): Promise<void>;
  rollback?(context: DeploymentContext): Promise<void>;
  timeout: number;
  retryCount: number;
}

interface DeploymentContext {
  deploymentId: string;
  config: DeploymentConfig;
  previousVersion?: string;
  artifacts: DeploymentArtifact[];
  environment: Record<string, string>;
  metadata: Record<string, any>;
}

interface RollbackTrigger {
  type: 'health_check' | 'error_rate' | 'response_time' | 'manual';
  threshold: number;
  duration: number; // seconds
}

class DeploymentOrchestrator {
  private deploymentSteps = new Map<string, DeploymentStep>();
  private activeDeployments = new Map<string, DeploymentContext>();

  constructor(
    private eventBus: EventBus,
    private logger: Logger,
    private notificationService: NotificationService,
    private infraService: InfrastructureService
  ) {
    this.registerDeploymentSteps();
  }

  private registerDeploymentSteps(): void {
    this.deploymentSteps.set('pre-flight-checks', new PreFlightChecksStep());
    this.deploymentSteps.set('backup-current', new BackupCurrentVersionStep());
    this.deploymentSteps.set('deploy-infrastructure', new DeployInfrastructureStep());
    this.deploymentSteps.set('deploy-application', new DeployApplicationStep());
    this.deploymentSteps.set('run-migrations', new RunMigrationsStep());
    this.deploymentSteps.set('health-checks', new HealthChecksStep());
    this.deploymentSteps.set('smoke-tests', new SmokeTestsStep());
    this.deploymentSteps.set('traffic-routing', new TrafficRoutingStep());
    this.deploymentSteps.set('post-deploy-verification', new PostDeployVerificationStep());
    this.deploymentSteps.set('cleanup', new CleanupStep());
  }

  async deploy(config: DeploymentConfig): Promise<string> {
    const deploymentId = `deploy_${config.environment}_${Date.now()}`;
    
    const context: DeploymentContext = {
      deploymentId,
      config,
      artifacts: await this.gatherArtifacts(config),
      environment: await this.getEnvironmentVariables(config.environment),
      metadata: {
        startTime: new Date(),
        triggeredBy: 'automated-ci',
        gitCommit: process.env.GIT_COMMIT || 'unknown'
      }
    };

    this.activeDeployments.set(deploymentId, context);

    try {
      // Emitir evento de início
      await this.eventBus.publish({
        type: 'deployment.started',
        aggregateId: deploymentId,
        aggregateType: 'deployment',
        version: 1,
        data: {
          deploymentId,
          environment: config.environment,
          version: config.version,
          strategy: config.strategy
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Determinar steps baseado na estratégia
      const steps = this.determineDeploymentSteps(config.strategy);
      
      // Executar deployment pipeline
      await this.executeDeploymentPipeline(context, steps);

      // Monitorar pós-deployment
      this.startPostDeploymentMonitoring(context);

      this.logger.info(`Deployment ${deploymentId} completed successfully`, {
        environment: config.environment,
        version: config.version,
        duration: Date.now() - context.metadata.startTime.getTime()
      });

      return deploymentId;

    } catch (error) {
      // Executar rollback automático
      await this.executeRollback(context, error);
      throw error;
    }
  }

  private determineDeploymentSteps(strategy: string): string[] {
    const baseSteps = [
      'pre-flight-checks',
      'backup-current',
      'deploy-infrastructure'
    ];

    switch (strategy) {
      case 'blue-green':
        return [
          ...baseSteps,
          'deploy-application',
          'run-migrations',
          'health-checks',
          'smoke-tests',
          'traffic-routing',
          'post-deploy-verification',
          'cleanup'
        ];

      case 'rolling':
        return [
          ...baseSteps,
          'deploy-application', // Deploy em batches
          'health-checks',
          'post-deploy-verification',
          'cleanup'
        ];

      case 'canary':
        return [
          ...baseSteps,
          'deploy-application', // Deploy para subset
          'health-checks',
          'smoke-tests',
          'traffic-routing', // Gradual traffic increase
          'post-deploy-verification',
          'cleanup'
        ];

      default:
        return baseSteps.concat(['deploy-application', 'health-checks']);
    }
  }

  private async executeDeploymentPipeline(
    context: DeploymentContext,
    stepNames: string[]
  ): Promise<void> {
    const executedSteps: string[] = [];

    try {
      for (let i = 0; i < stepNames.length; i++) {
        const stepName = stepNames[i];
        const step = this.deploymentSteps.get(stepName);
        
        if (!step) {
          throw new Error(`Deployment step ${stepName} not found`);
        }

        // Emitir evento de progresso
        await this.eventBus.publish({
          type: 'deployment.step.started',
          aggregateId: context.deploymentId,
          aggregateType: 'deployment',
          version: 1,
          data: {
            deploymentId: context.deploymentId,
            stepName,
            progress: ((i + 1) / stepNames.length) * 100
          },
          metadata: {
            timestamp: new Date(),
            correlationId: uuidv4()
          }
        });

        const stepStartTime = Date.now();

        try {
          // Executar step com timeout
          await this.executeStepWithTimeout(step, context);
          executedSteps.push(stepName);

          const stepDuration = Date.now() - stepStartTime;
          
          this.logger.info(`Deployment step ${stepName} completed`, {
            deploymentId: context.deploymentId,
            duration: stepDuration
          });

        } catch (error) {
          this.logger.error(`Deployment step ${stepName} failed`, {
            deploymentId: context.deploymentId,
            error: error.message
          });

          // Rollback steps executados
          await this.rollbackExecutedSteps(context, executedSteps);
          throw error;
        }
      }

      // Emitir evento de conclusão
      await this.eventBus.publish({
        type: 'deployment.completed',
        aggregateId: context.deploymentId,
        aggregateType: 'deployment',
        version: 1,
        data: {
          deploymentId: context.deploymentId,
          environment: context.config.environment,
          version: context.config.version,
          duration: Date.now() - context.metadata.startTime.getTime(),
          stepsExecuted: executedSteps.length
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

    } catch (error) {
      // Emitir evento de falha
      await this.eventBus.publish({
        type: 'deployment.failed',
        aggregateId: context.deploymentId,
        aggregateType: 'deployment',
        version: 1,
        data: {
          deploymentId: context.deploymentId,
          environment: context.config.environment,
          error: error.message,
          stepsExecuted: executedSteps
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      throw new DeploymentError(
        `Deployment ${context.deploymentId} failed at step pipeline execution`,
        { deploymentId: context.deploymentId, cause: error }
      );
    }
  }

  private async executeStepWithTimeout(
    step: DeploymentStep,
    context: DeploymentContext
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step ${step.name} timed out after ${step.timeout}ms`));
      }, step.timeout);

      step.execute(context)
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async rollbackExecutedSteps(
    context: DeploymentContext,
    executedSteps: string[]
  ): Promise<void> {
    // Rollback na ordem reversa
    for (const stepName of executedSteps.reverse()) {
      const step = this.deploymentSteps.get(stepName);
      
      if (step && step.rollback) {
        try {
          await step.rollback(context);
          this.logger.info(`Rollback completed for step ${stepName}`);
        } catch (rollbackError) {
          this.logger.error(`Rollback failed for step ${stepName}`, {
            error: rollbackError.message
          });
        }
      }
    }
  }

  private async executeRollback(
    context: DeploymentContext,
    originalError: Error
  ): Promise<void> {
    const rollbackId = `rollback_${context.deploymentId}`;

    try {
      this.logger.warn(`Initiating rollback for deployment ${context.deploymentId}`, {
        originalError: originalError.message
      });

      // Emitir evento de rollback
      await this.eventBus.publish({
        type: 'deployment.rollback.started',
        aggregateId: rollbackId,
        aggregateType: 'rollback',
        version: 1,
        data: {
          rollbackId,
          deploymentId: context.deploymentId,
          reason: originalError.message
        },
        metadata: {
          timestamp: new Date(),
          correlationId: uuidv4()
        }
      });

      // Implementar rollback baseado na estratégia
      await this.performRollback(context);

      // Notificar equipe
      await this.notificationService.sendDeploymentAlert({
        type: 'rollback_completed',
        deploymentId: context.deploymentId,
        environment: context.config.environment,
        reason: originalError.message
      });

    } catch (rollbackError) {
      this.logger.error(`Rollback failed for deployment ${context.deploymentId}`, {
        originalError: originalError.message,
        rollbackError: rollbackError.message
      });

      // Notificar falha crítica
      await this.notificationService.sendCriticalAlert({
        title: 'Deployment Rollback Failed',
        message: `Both deployment and rollback failed for ${context.deploymentId}`,
        environment: context.config.environment,
        errors: [originalError.message, rollbackError.message]
      });
    }
  }

  private async performRollback(context: DeploymentContext): Promise<void> {
    if (!context.previousVersion) {
      throw new Error('No previous version available for rollback');
    }

    // Criar contexto de rollback
    const rollbackContext: DeploymentContext = {
      ...context,
      config: {
        ...context.config,
        version: context.previousVersion
      },
      metadata: {
        ...context.metadata,
        isRollback: true,
        originalDeploymentId: context.deploymentId
      }
    };

    // Executar deployment da versão anterior
    const rollbackSteps = [
      'deploy-application',
      'health-checks',
      'traffic-routing'
    ];

    await this.executeDeploymentPipeline(rollbackContext, rollbackSteps);
  }

  private async startPostDeploymentMonitoring(context: DeploymentContext): Promise<void> {
    const monitoringDuration = 30 * 60 * 1000; // 30 minutes
    const checkInterval = 60 * 1000; // 1 minute

    setTimeout(async () => {
      const startTime = Date.now();
      
      const monitoring = setInterval(async () => {
        try {
          const shouldRollback = await this.checkRollbackTriggers(context);
          
          if (shouldRollback) {
            clearInterval(monitoring);
            await this.executeRollback(context, new Error('Automated rollback triggered'));
            return;
          }

          // Parar monitoramento após duração especificada
          if (Date.now() - startTime >= monitoringDuration) {
            clearInterval(monitoring);
            
            // Deployment considerado estável
            await this.eventBus.publish({
              type: 'deployment.stabilized',
              aggregateId: context.deploymentId,
              aggregateType: 'deployment',
              version: 1,
              data: {
                deploymentId: context.deploymentId,
                environment: context.config.environment,
                monitoringDuration
              },
              metadata: {
                timestamp: new Date(),
                correlationId: uuidv4()
              }
            });
          }

        } catch (error) {
          this.logger.error('Error during post-deployment monitoring', {
            deploymentId: context.deploymentId,
            error: error.message
          });
        }
      }, checkInterval);

    }, 60000); // Esperar 1 minuto antes de iniciar monitoramento
  }

  private async checkRollbackTriggers(context: DeploymentContext): Promise<boolean> {
    for (const trigger of context.config.rollbackTriggers) {
      const shouldTrigger = await this.evaluateRollbackTrigger(trigger, context);
      
      if (shouldTrigger) {
        this.logger.warn(`Rollback trigger activated: ${trigger.type}`, {
          deploymentId: context.deploymentId,
          trigger
        });
        return true;
      }
    }

    return false;
  }

  private async evaluateRollbackTrigger(
    trigger: RollbackTrigger,
    context: DeploymentContext
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'health_check':
        // Verificar se health checks estão falhando
        const healthStatus = await this.infraService.getHealthStatus(context.config.environment);
        return healthStatus.failureRate > trigger.threshold;

      case 'error_rate':
        // Verificar taxa de erro
        const errorRate = await this.infraService.getErrorRate(
          context.config.environment, 
          trigger.duration * 1000
        );
        return errorRate > trigger.threshold;

      case 'response_time':
        // Verificar tempo de resposta
        const avgResponseTime = await this.infraService.getAverageResponseTime(
          context.config.environment,
          trigger.duration * 1000
        );
        return avgResponseTime > trigger.threshold;

      default:
        return false;
    }
  }

  private async gatherArtifacts(config: DeploymentConfig): Promise<DeploymentArtifact[]> {
    // Coletar artefatos do build
    return [
      {
        name: 'application',
        type: 'docker-image',
        url: `registry.example.com/app:${config.version}`,
        checksum: `sha256:${config.version}`
      },
      {
        name: 'configuration',
        type: 'config-bundle',
        url: `s3://deployments/config-${config.version}.tar.gz`,
        checksum: `md5:config-${config.version}`
      }
    ];
  }

  private async getEnvironmentVariables(environment: string): Promise<Record<string, string>> {
    // Carregar variáveis específicas do ambiente
    return {
      NODE_ENV: environment,
      LOG_LEVEL: environment === 'production' ? 'warn' : 'debug',
      API_BASE_URL: `https://api-${environment}.example.com`,
      DATABASE_URL: `postgresql://db-${environment}.example.com:5432/app`
    };
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus | null> {
    const context = this.activeDeployments.get(deploymentId);
    if (!context) return null;

    return {
      deploymentId,
      environment: context.config.environment,
      version: context.config.version,
      status: 'running', // Determinar status real
      startTime: context.metadata.startTime,
      duration: Date.now() - context.metadata.startTime.getTime()
    };
  }

  async listActiveDeployments(): Promise<DeploymentStatus[]> {
    const statuses: DeploymentStatus[] = [];
    
    for (const [deploymentId, context] of this.activeDeployments) {
      const status = await this.getDeploymentStatus(deploymentId);
      if (status) {
        statuses.push(status);
      }
    }

    return statuses;
  }
}

interface DeploymentArtifact {
  name: string;
  type: string;
  url: string;
  checksum: string;
}

interface DeploymentStatus {
  deploymentId: string;
  environment: string;
  version: string;
  status: 'running' | 'completed' | 'failed' | 'rolling_back';
  startTime: Date;
  duration: number;
}

interface NotificationConfig {
  type: 'slack' | 'email' | 'teams';
  channels: string[];
  events: string[];
}
```

---

## 📋 Conclusão

### Resumo da Arquitetura de Orquestração

A arquitetura de orquestração implementada fornece:

1. **Event-Driven Coordination**: Sistema robusto de eventos para comunicação entre serviços
2. **Workflow Management**: Orquestração de processos complexos com suporte a compensação
3. **Service Mesh**: Discovery, load balancing e circuit breaking automáticos
4. **Process Pipelines**: Pipelines configuráveis para análise de documentos
5. **Batch Processing**: Sistema de filas para processamento assíncrono
6. **Monitoring & Observability**: Tracing distribuído e coleta de métricas
7. **Self-Healing**: Recuperação automática de falhas
8. **Disaster Recovery**: Backup e restore coordenados
9. **CI/CD Integration**: Deployment automatizado com rollback

### Benefícios Alcançados

- **Resiliência**: Tolerância a falhas com recuperação automática
- **Escalabilidade**: Arquitetura que cresce com a demanda
- **Observabilidade**: Visibilidade completa do sistema em produção
- **Automação**: Redução de intervenção manual em operações
- **Confiabilidade**: Garantias de consistência e integridade

### Próximos Passos

1. **Implementação Incremental**: Deploy gradual dos componentes
2. **Monitoring Enhancement**: Refinamento de métricas e alertas
3. **Performance Optimization**: Otimização baseada em dados reais
4. **Security Hardening**: Implementação de medidas de segurança adicionais
5. **Documentation**: Documentação operacional detalhada

---

*Orchestration.md v1.0*
*Última atualização: 11 de Agosto, 2025*
*Próxima revisão: 11 de Novembro, 2025*
*Owner: Platform Engineering Team*