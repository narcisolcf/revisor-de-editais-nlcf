/**
 * Analysis Complete Trigger
 * Processes completed analysis results and updates document status
 * LicitaReview Cloud Functions
 */
/**
 * Trigger when analysis result is created
 */
export declare const onAnalysisResultCreated: import("firebase-functions/v2/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    resultId: string;
}>>;
/**
 * Trigger when analysis result is updated
 */
export declare const onAnalysisResultUpdated: import("firebase-functions/v2/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions").Change<import("firebase-functions/v2/firestore").QueryDocumentSnapshot> | undefined, {
    resultId: string;
}>>;
/**
 * Clean up old analysis results (could be run on a schedule)
 */
export declare function cleanupOldAnalysisResults(retentionDays?: number): Promise<void>;
//# sourceMappingURL=analysis-complete.d.ts.map