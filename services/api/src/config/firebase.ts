/**
 * Firebase Admin SDK Configuration
 * LicitaReview Cloud Functions
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "licitareview-prod",
  });
}

// Export Firebase services
export const auth = admin.auth();
export const firestore = admin.firestore();
export const storage = admin.storage();
export const messaging = admin.messaging();

// Firestore collection references
export const collections = {
  documents: firestore.collection("documents"),
  organizations: firestore.collection("organizations"),
  analysisResults: firestore.collection("analysisResults"),
  configs: firestore.collection("organizationConfigs"),
  users: firestore.collection("users"),
  auditLogs: firestore.collection("auditLogs"),
} as const;

// Storage bucket reference
// export const bucket = storage.bucket();

// Firestore settings for better performance
firestore.settings({
  ignoreUndefinedProperties: true,
});

export default admin;