/**
 * Notifications Processor
 * LicitaReview Cloud Functions
 */
/**
 * Firestore trigger for new notifications
 */
export declare const onNotificationCreated: import("firebase-functions/v2/core").CloudFunction<import("firebase-functions/v2/firestore").FirestoreEvent<import("firebase-functions/v2/firestore").QueryDocumentSnapshot | undefined, {
    notificationId: string;
}>>;
export declare const notificationProcessor: import("firebase-functions/v2/https").HttpsFunction;
//# sourceMappingURL=notifications.d.ts.map