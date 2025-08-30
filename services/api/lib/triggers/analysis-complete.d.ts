/**
 * Analysis Complete Trigger
 * Processes completed analysis results and updates document status
 * LicitaReview Cloud Functions
 */
import * as functions from "firebase-functions/v1";
/**
 * Trigger when analysis result is created
 */
export declare const onAnalysisResultCreated: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
/**
 * Trigger when analysis result is updated
 */
export declare const onAnalysisResultUpdated: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
/**
 * Clean up old analysis results (could be run on a schedule)
 */
export declare function cleanupOldAnalysisResults(retentionDays?: number): Promise<void>;
