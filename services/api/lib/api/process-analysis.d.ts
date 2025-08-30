/**
 * Cloud Function para processar tarefas de análise da fila
 * Chamada pelo TaskQueueService via Cloud Tasks
 */
import * as functions from 'firebase-functions/v1';
/**
 * Processa uma tarefa de análise da fila
 */
export declare const processAnalysis: functions.HttpsFunction;
