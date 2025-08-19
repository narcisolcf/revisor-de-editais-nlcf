"use strict";
/**
 * Jest Test Setup
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSupertestResponse = exports.createMockAnalysisResult = exports.createMockConfig = exports.createMockDocument = exports.createMockUser = exports.createMockNext = exports.createMockResponse = exports.createMockRequest = void 0;
const globals_1 = require("@jest/globals");
// Mock Firebase Admin SDK globally
globals_1.jest.mock("firebase-admin", () => ({
    initializeApp: globals_1.jest.fn(),
    credential: {
        applicationDefault: globals_1.jest.fn()
    },
    firestore: globals_1.jest.fn(() => ({
        collection: globals_1.jest.fn(),
        doc: globals_1.jest.fn(),
        batch: globals_1.jest.fn(),
        runTransaction: globals_1.jest.fn(),
        settings: globals_1.jest.fn(),
        FieldValue: {
            increment: globals_1.jest.fn(),
            arrayUnion: globals_1.jest.fn(),
            arrayRemove: globals_1.jest.fn(),
            serverTimestamp: globals_1.jest.fn()
        }
    })),
    auth: globals_1.jest.fn(() => ({
        verifyIdToken: globals_1.jest.fn(),
        getUser: globals_1.jest.fn(),
        setCustomUserClaims: globals_1.jest.fn(),
        createUser: globals_1.jest.fn(),
        updateUser: globals_1.jest.fn(),
        deleteUser: globals_1.jest.fn()
    })),
    storage: globals_1.jest.fn(() => ({
        bucket: globals_1.jest.fn(() => ({
            file: globals_1.jest.fn(),
            upload: globals_1.jest.fn(),
            getFiles: globals_1.jest.fn(),
            getMetadata: globals_1.jest.fn()
        }))
    })),
    messaging: globals_1.jest.fn(() => ({
        send: globals_1.jest.fn(),
        sendMulticast: globals_1.jest.fn(),
        sendToTopic: globals_1.jest.fn()
    })),
    apps: []
}));
// Mock Firebase Functions
globals_1.jest.mock("firebase-functions", () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    },
    config: globals_1.jest.fn(() => ({})),
    region: globals_1.jest.fn(() => ({
        https: {
            onRequest: globals_1.jest.fn(),
            onCall: globals_1.jest.fn()
        },
        firestore: {
            document: globals_1.jest.fn(() => ({
                onCreate: globals_1.jest.fn(),
                onUpdate: globals_1.jest.fn(),
                onDelete: globals_1.jest.fn(),
                onWrite: globals_1.jest.fn()
            }))
        },
        storage: {
            object: globals_1.jest.fn(() => ({
                onFinalize: globals_1.jest.fn(),
                onDelete: globals_1.jest.fn(),
                onMetadataUpdate: globals_1.jest.fn()
            }))
        }
    }))
}));
// Mock Firebase Functions v2
globals_1.jest.mock("firebase-functions/v2/https", () => ({
    onRequest: globals_1.jest.fn((config, handler) => handler),
    onCall: globals_1.jest.fn((config, handler) => handler)
}));
globals_1.jest.mock("firebase-functions/v2/firestore", () => ({
    onDocumentCreated: globals_1.jest.fn((config, handler) => handler),
    onDocumentUpdated: globals_1.jest.fn((config, handler) => handler),
    onDocumentDeleted: globals_1.jest.fn((config, handler) => handler),
    onDocumentWritten: globals_1.jest.fn((config, handler) => handler)
}));
globals_1.jest.mock("firebase-functions/v2/storage", () => ({
    onObjectFinalized: globals_1.jest.fn((config, handler) => handler),
    onObjectDeleted: globals_1.jest.fn((config, handler) => handler),
    onObjectMetadataUpdated: globals_1.jest.fn((config, handler) => handler)
}));
// Set up environment variables for testing
process.env.NODE_ENV = "test";
process.env.GCLOUD_PROJECT = "test-project";
process.env.FIREBASE_PROJECT_ID = "test-project";
process.env.FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.CORS_ORIGIN = "*";
process.env.RATE_LIMIT_WINDOW_MS = "900000";
process.env.RATE_LIMIT_MAX = "100";
process.env.MAX_DOCUMENT_SIZE = "52428800";
process.env.ALLOWED_DOCUMENT_TYPES = "pdf,doc,docx,txt";
process.env.LOG_LEVEL = "error"; // Reduce log noise during tests
// Global test timeout
globals_1.jest.setTimeout(30000);
// Mock console methods to reduce noise during tests
const originalConsole = console;
global.console = Object.assign(Object.assign({}, console), { log: globals_1.jest.fn(), info: globals_1.jest.fn(), warn: globals_1.jest.fn(), error: globals_1.jest.fn(), debug: globals_1.jest.fn() });
// Restore console after tests if needed
afterAll(() => {
    global.console = originalConsole;
});
// Clean up after each test
afterEach(() => {
    globals_1.jest.clearAllMocks();
});
// Global error handler for unhandled rejections in tests
process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
// Export common test utilities
const createMockRequest = (overrides = {}) => (Object.assign({ body: {}, query: {}, params: {}, headers: {}, get: globals_1.jest.fn((header) => { var _a; return (_a = overrides.headers) === null || _a === void 0 ? void 0 : _a[header]; }) }, overrides));
exports.createMockRequest = createMockRequest;
const createMockResponse = () => {
    const res = {
        status: globals_1.jest.fn(() => res),
        json: globals_1.jest.fn(() => res),
        send: globals_1.jest.fn(() => res),
        setHeader: globals_1.jest.fn(() => res),
        end: globals_1.jest.fn(() => res),
        on: globals_1.jest.fn(() => res)
    };
    return res;
};
exports.createMockResponse = createMockResponse;
const createMockNext = () => globals_1.jest.fn();
exports.createMockNext = createMockNext;
const createMockUser = (overrides = {}) => (Object.assign({ uid: "test-user-id", email: "test@example.com", organizationId: "test-org-id", roles: ["user"], permissions: ["documents:read"] }, overrides));
exports.createMockUser = createMockUser;
const createMockDocument = (overrides = {}) => (Object.assign({ id: "test-doc-id", title: "Test Document", content: "Test content", organizationId: "test-org-id", createdBy: "test-user-id", status: "DRAFT", createdAt: new Date(), updatedAt: new Date() }, overrides));
exports.createMockDocument = createMockDocument;
const createMockConfig = (overrides = {}) => (Object.assign({ id: "test-config-id", organizationId: "test-org-id", organizationName: "Test Organization", weights: {
        structural: 25.0,
        legal: 25.0,
        clarity: 25.0,
        abnt: 25.0
    }, presetType: "STANDARD", customRules: [], version: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), createdBy: "test-user-id" }, overrides));
exports.createMockConfig = createMockConfig;
const createMockAnalysisResult = (overrides = {}) => (Object.assign({ id: "test-analysis-id", documentId: "test-doc-id", organizationId: "test-org-id", conformityScores: {
        structural: 85.0,
        legal: 92.0,
        clarity: 78.0,
        abnt: 88.0,
        overall: 85.8
    }, weightedScore: 86.2, findings: [], recommendations: [], status: "completed", executionTimeSeconds: 12.5, createdAt: new Date(), completedAt: new Date() }, overrides));
exports.createMockAnalysisResult = createMockAnalysisResult;
// Mock supertest for API testing
const mockSupertestResponse = (statusCode, body) => ({
    status: statusCode,
    body,
    headers: {},
    get: globals_1.jest.fn()
});
exports.mockSupertestResponse = mockSupertestResponse;
exports.default = {};
//# sourceMappingURL=setup.js.map