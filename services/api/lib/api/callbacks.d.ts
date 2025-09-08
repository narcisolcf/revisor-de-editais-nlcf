/**
 * Callbacks API - Endpoints para receber callbacks do Cloud Run
 * LicitaReview Cloud Functions
 */
import * as functions from 'firebase-functions/v1';
import { CallbackHandler } from '../services/CallbackHandler';
declare const callbackHandler: CallbackHandler;
export declare const callbacksApi: functions.HttpsFunction;
export { callbackHandler };
