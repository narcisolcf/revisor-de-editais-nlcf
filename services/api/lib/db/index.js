"use strict";
/**
 * Database Module Index
 *
 * Exports all database-related functionality including:
 * - Schemas and types
 * - Repository patterns
 * - Migration utilities
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.initializeDatabase = initializeDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
exports.healthCheck = healthCheck;
exports.createOrganizationRepository = createOrganizationRepository;
exports.createDocumentRepository = createDocumentRepository;
// Schemas
__exportStar(require("./schemas/organization.schema"), exports);
__exportStar(require("./schemas/document.schema"), exports);
// Repositories
__exportStar(require("./repositories/BaseRepository"), exports);
__exportStar(require("./repositories/OrganizationRepository"), exports);
__exportStar(require("./repositories/DocumentRepository"), exports);
// Migrations
__exportStar(require("./migrations/migration-runner"), exports);
__exportStar(require("./migrations/001-initial-data"), exports);
// Database initialization utility
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const admin = __importStar(require("firebase-admin"));
let db;
/**
 * Initialize Firestore connection
 */
function initializeDatabase(serviceAccountKey) {
    if (db) {
        return db;
    }
    try {
        // Check if Firebase app is already initialized
        if ((0, app_1.getApps)().length === 0) {
            if (serviceAccountKey) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccountKey),
                    projectId: serviceAccountKey.project_id
                });
            }
            else {
                // Use default credentials (for Cloud Functions/Cloud Run)
                admin.initializeApp();
            }
        }
        db = (0, firestore_1.getFirestore)();
        console.log('✅ Firestore database initialized successfully');
        return db;
    }
    catch (error) {
        console.error('❌ Failed to initialize Firestore:', error);
        throw new Error(`Database initialization failed: ${error}`);
    }
}
/**
 * Get database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
}
/**
 * Close database connection
 */
async function closeDatabase() {
    if (db) {
        await db.terminate();
        console.log('✅ Database connection closed');
    }
}
/**
 * Database health check
 */
async function healthCheck() {
    try {
        if (!db) {
            return false;
        }
        // Try to read from a system collection
        await db.collection('_health').limit(1).get();
        return true;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
}
// Repository factory functions for easy access
async function createOrganizationRepository(database) {
    const dbInstance = database || getDatabase();
    return {
        organizations: new (await Promise.resolve().then(() => __importStar(require('./repositories/OrganizationRepository')))).OrganizationRepository(dbInstance),
        templates: new (await Promise.resolve().then(() => __importStar(require('./repositories/OrganizationRepository')))).TemplateRepository(dbInstance),
        rules: new (await Promise.resolve().then(() => __importStar(require('./repositories/OrganizationRepository')))).AnalysisRuleRepository(dbInstance),
        parameters: new (await Promise.resolve().then(() => __importStar(require('./repositories/OrganizationRepository')))).CustomParametersRepository(dbInstance),
        users: new (await Promise.resolve().then(() => __importStar(require('./repositories/OrganizationRepository')))).OrganizationUserRepository(dbInstance)
    };
}
async function createDocumentRepository(database) {
    const dbInstance = database || getDatabase();
    return {
        documents: new (await Promise.resolve().then(() => __importStar(require('./repositories/DocumentRepository')))).DocumentRepository(dbInstance),
        analyses: new (await Promise.resolve().then(() => __importStar(require('./repositories/DocumentRepository')))).AnalysisRepository(dbInstance),
        versions: new (await Promise.resolve().then(() => __importStar(require('./repositories/DocumentRepository')))).DocumentVersionRepository(dbInstance),
        comments: new (await Promise.resolve().then(() => __importStar(require('./repositories/DocumentRepository')))).ReviewCommentRepository(dbInstance)
    };
}
//# sourceMappingURL=index.js.map