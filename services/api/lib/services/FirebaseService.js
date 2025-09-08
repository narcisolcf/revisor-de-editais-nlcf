"use strict";
/**
 * Firebase Service
 *
 * Wrapper service for Firebase Admin SDK operations
 * Provides centralized Firebase initialization and access
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
exports.FirebaseService = void 0;
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const storage_1 = require("firebase-admin/storage");
const admin = __importStar(require("firebase-admin"));
class FirebaseService {
    constructor() {
        this._initialized = false;
    }
    /**
     * Initialize Firebase Admin SDK if not already initialized
     */
    async initialize() {
        if (this._initialized) {
            return;
        }
        try {
            // Initialize Firebase Admin SDK if not already done
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: process.env.GOOGLE_CLOUD_PROJECT || 'licitareview-prod',
                });
            }
            this._db = (0, firestore_1.getFirestore)();
            this._auth = (0, auth_1.getAuth)();
            this._storage = (0, storage_1.getStorage)();
            this._initialized = true;
            console.log('✅ Firebase Admin SDK initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Firebase Admin SDK:', error);
            throw error;
        }
    }
    /**
     * Get Firestore instance
     */
    get db() {
        if (!this._db) {
            throw new Error('FirebaseService not initialized. Call initialize() first.');
        }
        return this._db;
    }
    /**
     * Get Auth instance
     */
    get auth() {
        if (!this._auth) {
            throw new Error('FirebaseService not initialized. Call initialize() first.');
        }
        return this._auth;
    }
    /**
     * Get Storage instance
     */
    get storage() {
        if (!this._storage) {
            throw new Error('FirebaseService not initialized. Call initialize() first.');
        }
        return this._storage;
    }
    /**
     * Check if service is initialized
     */
    get isInitialized() {
        return this._initialized;
    }
    /**
     * Shutdown Firebase services
     */
    async shutdown() {
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app?.delete()));
        }
        this._initialized = false;
        this._db = undefined;
        this._auth = undefined;
        this._storage = undefined;
    }
}
exports.FirebaseService = FirebaseService;
//# sourceMappingURL=FirebaseService.js.map