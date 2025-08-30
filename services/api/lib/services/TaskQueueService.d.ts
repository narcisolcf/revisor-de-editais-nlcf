/**
 * Serviço para gerenciar filas de tarefas usando Cloud Tasks
 */
export interface TaskPayload {
    analysisId: string;
    documentId: string;
    organizationId: string;
    priority?: 'low' | 'normal' | 'high';
    retryCount?: number;
    metadata?: Record<string, any>;
}
export interface TaskOptions {
    delay?: number;
    maxRetries?: number;
    timeout?: number;
}
export declare class TaskQueueService {
    private client;
    private projectId;
    private location;
    private queueName;
    constructor(projectId: string, location?: string, queueName?: string);
    /**
     * Adiciona uma tarefa à fila
     */
    enqueueTask(payload: TaskPayload, _options?: TaskOptions): Promise<string>;
    /**
     * Cancela uma tarefa específica
     */
    cancelTask(taskName: string): Promise<void>;
    /**
     * Lista tarefas pendentes na fila
     */
    listPendingTasks(): Promise<any[]>;
    /**
     * Pausa a fila (impede processamento de novas tarefas)
     */
    pauseQueue(): Promise<void>;
    /**
     * Resume a fila (permite processamento de tarefas)
     */
    resumeQueue(): Promise<void>;
    /**
     * Obtém estatísticas da fila
     */
    getQueueStats(): Promise<any>;
    /**
     * Conta o número de tarefas na fila
     */
    private getTasksCount;
    /**
     * Cria uma tarefa de análise com prioridade
     */
    enqueueAnalysisTask(analysisId: string, documentId: string, organizationId: string, priority?: 'low' | 'normal' | 'high', metadata?: Record<string, any>): Promise<string>;
}
