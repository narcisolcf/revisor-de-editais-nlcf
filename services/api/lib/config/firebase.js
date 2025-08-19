"use strict";
/**
 * Firebase Admin SDK Configuration
 * LicitaReview Cloud Functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bucket = exports.collections = exports.messaging = exports.storage = exports.firestore = exports.auth = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.GOOGLE_CLOUD_PROJECT || "analisador-de-editais",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "analisador-de-editais.firebasestorage.app",
    });
}
// Export Firebase services
exports.auth = admin.auth();
exports.firestore = admin.firestore();
exports.storage = admin.storage();
exports.messaging = admin.messaging();
// Firestore collection references
exports.collections = {
    documents: exports.firestore.collection("documents"),
    organizations: exports.firestore.collection("organizations"),
    analysisResults: exports.firestore.collection("analysisResults"),
    configs: exports.firestore.collection("organizationConfigs"),
    users: exports.firestore.collection("users"),
    auditLogs: exports.firestore.collection("auditLogs"),
};
// Storage bucket reference
exports.bucket = exports.storage.bucket();
// Firestore settings for better performance
exports.firestore.settings({
    ignoreUndefinedProperties: true,
});
exports.default = admin;
//# sourceMappingURL=firebase.js.map