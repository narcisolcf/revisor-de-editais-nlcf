/**
 * Firebase Admin SDK Configuration
 * LicitaReview Cloud Functions
 */
import * as admin from "firebase-admin";
export declare const auth: import("firebase-admin/auth").Auth;
export declare const firestore: admin.firestore.Firestore;
export declare const storage: import("firebase-admin/storage").Storage;
export declare const messaging: import("firebase-admin/lib/messaging/messaging").Messaging;
export declare const collections: {
    readonly documents: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly organizations: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly analysisResults: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly analysis: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly configs: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly users: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly auditLogs: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
};
export default admin;
