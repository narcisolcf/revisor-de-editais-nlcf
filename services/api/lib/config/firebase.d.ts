/**
 * Firebase Admin SDK Configuration
 * LicitaReview Cloud Functions
 */
import * as admin from "firebase-admin";
export declare const auth: import("firebase-admin/auth").Auth;
export declare const firestore: admin.firestore.Firestore;
export declare const storage: import("firebase-admin/lib/storage/storage").Storage;
export declare const messaging: import("firebase-admin/lib/messaging/messaging").Messaging;
export declare const collections: {
    readonly documents: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly organizations: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly analysisResults: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly configs: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly users: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
    readonly auditLogs: admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
};
export declare const bucket: import("@google-cloud/storage").Bucket;
export default admin;
//# sourceMappingURL=firebase.d.ts.map