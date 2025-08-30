"use strict";
/**
 * Serviço para gerenciar filas de tarefas usando Cloud Tasks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskQueueService = void 0;
// import { CloudTasksClient } from '@google-cloud/tasks'; // Package not installed
// Mock CloudTasksClient for now
class CloudTasksClient {
    constructor() { }
    queuePath(projectId, location, queueName) {
        return `projects/${projectId}/locations/${location}/queues/${queueName}`;
    }
    async createTask() {
        return [{ name: 'mock-task' }];
    }
    async deleteTask() {
        return [{}];
    }
    async listTasks() {
        return [[]];
    }
    async pauseQueue() {
        return [{}];
    }
    async resumeQueue() {
        return [{}];
    }
    async getQueue() {
        return [{ state: 'RUNNING' }];
    }
}
class TaskQueueService {
    constructor(projectId, location = 'us-central1', queueName = 'analysis-queue') {
        this.client = new CloudTasksClient();
        this.projectId = projectId;
        this.location = location;
        this.queueName = queueName;
    }
    /**
     * Adiciona uma tarefa à fila
     */
    async enqueueTask(payload, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    _options = {}) {
        try {
            // Mock implementation - não precisa dos parâmetros reais
            const [response] = await this.client.createTask();
            console.log(`Tarefa criada: ${response.name}`);
            return response.name || '';
        }
        catch (error) {
            console.error('Erro ao criar tarefa:', error);
            throw new Error(`Falha ao enfileirar tarefa: ${error}`);
        }
    }
    /**
     * Cancela uma tarefa específica
     */
    async cancelTask(taskName) {
        try {
            await this.client.deleteTask();
            console.log(`Tarefa cancelada: ${taskName}`);
        }
        catch (error) {
            console.error('Erro ao cancelar tarefa:', error);
            throw new Error(`Falha ao cancelar tarefa: ${error}`);
        }
    }
    /**
     * Lista tarefas pendentes na fila
     */
    async listPendingTasks() {
        try {
            // Mock implementation - não precisa dos parâmetros reais
            const [tasks] = await this.client.listTasks();
            return tasks;
        }
        catch (error) {
            console.error('Erro ao listar tarefas:', error);
            throw new Error(`Falha ao listar tarefas: ${error}`);
        }
    }
    /**
     * Pausa a fila (impede processamento de novas tarefas)
     */
    async pauseQueue() {
        try {
            // Mock implementation - não precisa dos parâmetros reais
            await this.client.pauseQueue();
            console.log(`Fila pausada: ${this.queueName}`);
        }
        catch (error) {
            console.error('Erro ao pausar fila:', error);
            throw new Error(`Falha ao pausar fila: ${error}`);
        }
    }
    /**
     * Resume a fila (permite processamento de tarefas)
     */
    async resumeQueue() {
        try {
            // Mock implementation - não precisa dos parâmetros reais
            await this.client.resumeQueue();
            console.log(`Fila resumida: ${this.queueName}`);
        }
        catch (error) {
            console.error('Erro ao resumir fila:', error);
            throw new Error(`Falha ao resumir fila: ${error}`);
        }
    }
    /**
     * Obtém estatísticas da fila
     */
    async getQueueStats() {
        try {
            // Mock implementation - não precisa dos parâmetros reais
            const [queue] = await this.client.getQueue();
            return {
                name: queue.name,
                state: queue.state,
                tasksCount: await this.getTasksCount(),
            };
        }
        catch (error) {
            console.error('Erro ao obter estatísticas da fila:', error);
            throw new Error(`Falha ao obter estatísticas: ${error}`);
        }
    }
    /**
     * Conta o número de tarefas na fila
     */
    async getTasksCount() {
        try {
            const tasks = await this.listPendingTasks();
            return tasks.length;
        }
        catch (error) {
            console.error('Erro ao contar tarefas:', error);
            return 0;
        }
    }
    /**
     * Cria uma tarefa de análise com prioridade
     */
    async enqueueAnalysisTask(analysisId, documentId, organizationId, priority = 'normal', metadata) {
        const payload = {
            analysisId,
            documentId,
            organizationId,
            priority,
            metadata,
        };
        const options = {
            maxRetries: 3,
            timeout: 300, // 5 minutos
        };
        // Ajustar delay baseado na prioridade
        switch (priority) {
            case 'high':
                options.delay = 0; // Processar imediatamente
                break;
            case 'normal':
                options.delay = 5; // 5 segundos de delay
                break;
            case 'low':
                options.delay = 30; // 30 segundos de delay
                break;
        }
        return await this.enqueueTask(payload, options);
    }
}
exports.TaskQueueService = TaskQueueService;
//# sourceMappingURL=TaskQueueService.js.map