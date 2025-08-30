/**
 * Audit Logger
 * LicitaReview Cloud Functions
 */
import { AuditLog } from "../types";
/**
 * Create audit log entry (utility function)
 */
export declare function createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
export declare const auditLogger: import("firebase-functions/v2/https").HttpsFunction;
