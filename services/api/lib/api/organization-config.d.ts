/**
 * Organization Configuration API
 * Cloud Functions para gerenciar configurações organizacionais
 * Conecta configurações do Firestore com serviço de análise do Cloud Run
 */
import * as functions from 'firebase-functions/v1';
/**
 * Handler principal para configurações organizacionais
 */
export declare const organizationConfig: functions.HttpsFunction;
