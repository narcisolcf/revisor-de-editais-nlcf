/**
 * Serviço para gerenciar filas de tarefas usando Cloud Tasks
 */

import { CloudTasksClient } from '@google-cloud/tasks';

export interface TaskPayload {
  analysisId: string;
  documentId: string;
  organizationId: string;
  priority?: 'low' | 'normal' | 'high';
  retryCount?: number;
  metadata?: Record<string, any>;
}

export interface TaskOptions {
  delay?: number; // em segundos
  maxRetries?: number;
  timeout?: number; // em segundos
}

export class TaskQueueService {
  private client: CloudTasksClient;
  private projectId: string;
  private location: string;
  private queueName: string;

  constructor(
    projectId: string,
    location: string = 'us-central1',
    queueName: string = 'analysis-queue'
  ) {
    this.client = new CloudTasksClient();
    this.projectId = projectId;
    this.location = location;
    this.queueName = queueName;
  }

  /**
   * Adiciona uma tarefa à fila
   */
  async enqueueTask(
    payload: TaskPayload,
    options: TaskOptions = {}
  ): Promise<string> {
    try {
      const parent = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      const task: any = {
        httpRequest: {
          httpMethod: 'POST',
          url: `https://${this.location}-${this.projectId}.cloudfunctions.net/processAnalysis`,
          headers: {
            'Content-Type': 'application/json',
          },
          body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        },
      };

      // Configurar delay se especificado
      if (options.delay && options.delay > 0) {
        const scheduleTime = new Date();
        scheduleTime.setSeconds(scheduleTime.getSeconds() + options.delay);
        task.scheduleTime = {
          seconds: Math.floor(scheduleTime.getTime() / 1000),
        };
      }

      // Configurar retry policy
      if (options.maxRetries) {
        task.retryConfig = {
          maxAttempts: options.maxRetries,
        };
      }

      const [response] = await this.client.createTask({
        parent,
        task,
      });

      console.log(`Tarefa criada: ${response.name}`);
      return response.name || '';
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      throw new Error(`Falha ao enfileirar tarefa: ${error}`);
    }
  }

  /**
   * Cancela uma tarefa específica
   */
  async cancelTask(taskName: string): Promise<void> {
    try {
      await this.client.deleteTask({ name: taskName });
      console.log(`Tarefa cancelada: ${taskName}`);
    } catch (error) {
      console.error('Erro ao cancelar tarefa:', error);
      throw new Error(`Falha ao cancelar tarefa: ${error}`);
    }
  }

  /**
   * Lista tarefas pendentes na fila
   */
  async listPendingTasks(): Promise<any[]> {
    try {
      const parent = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      const [tasks] = await this.client.listTasks({ parent });
      return tasks;
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      throw new Error(`Falha ao listar tarefas: ${error}`);
    }
  }

  /**
   * Pausa a fila (impede processamento de novas tarefas)
   */
  async pauseQueue(): Promise<void> {
    try {
      const name = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      await this.client.pauseQueue({ name });
      console.log(`Fila pausada: ${this.queueName}`);
    } catch (error) {
      console.error('Erro ao pausar fila:', error);
      throw new Error(`Falha ao pausar fila: ${error}`);
    }
  }

  /**
   * Resume a fila (permite processamento de tarefas)
   */
  async resumeQueue(): Promise<void> {
    try {
      const name = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      await this.client.resumeQueue({ name });
      console.log(`Fila resumida: ${this.queueName}`);
    } catch (error) {
      console.error('Erro ao resumir fila:', error);
      throw new Error(`Falha ao resumir fila: ${error}`);
    }
  }

  /**
   * Obtém estatísticas da fila
   */
  async getQueueStats(): Promise<any> {
    try {
      const name = this.client.queuePath(
        this.projectId,
        this.location,
        this.queueName
      );

      const [queue] = await this.client.getQueue({ name });
      return {
        name: queue.name,
        state: queue.state,
        tasksCount: await this.getTasksCount(),
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas da fila:', error);
      throw new Error(`Falha ao obter estatísticas: ${error}`);
    }
  }

  /**
   * Conta o número de tarefas na fila
   */
  private async getTasksCount(): Promise<number> {
    try {
      const tasks = await this.listPendingTasks();
      return tasks.length;
    } catch (error) {
      console.error('Erro ao contar tarefas:', error);
      return 0;
    }
  }

  /**
   * Cria uma tarefa de análise com prioridade
   */
  async enqueueAnalysisTask(
    analysisId: string,
    documentId: string,
    organizationId: string,
    priority: 'low' | 'normal' | 'high' = 'normal',
    metadata?: Record<string, any>
  ): Promise<string> {
    const payload: TaskPayload = {
      analysisId,
      documentId,
      organizationId,
      priority,
      metadata,
    };

    const options: TaskOptions = {
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