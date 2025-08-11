/**
 * Jest Test Setup
 * LicitaReview Cloud Functions
 */

import { jest } from "@jest/globals";

// Mock Firebase Admin SDK globally
jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn()
  },
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    batch: jest.fn(),
    runTransaction: jest.fn(),
    settings: jest.fn(),
    FieldValue: {
      increment: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
      serverTimestamp: jest.fn()
    }
  })),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  })),
  storage: jest.fn(() => ({
    bucket: jest.fn(() => ({
      file: jest.fn(),
      upload: jest.fn(),
      getFiles: jest.fn(),
      getMetadata: jest.fn()
    }))
  })),
  messaging: jest.fn(() => ({
    send: jest.fn(),
    sendMulticast: jest.fn(),
    sendToTopic: jest.fn()
  })),
  apps: []
}));

// Mock Firebase Functions
jest.mock("firebase-functions", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  config: jest.fn(() => ({})),
  region: jest.fn(() => ({
    https: {
      onRequest: jest.fn(),
      onCall: jest.fn()
    },
    firestore: {
      document: jest.fn(() => ({
        onCreate: jest.fn(),
        onUpdate: jest.fn(),
        onDelete: jest.fn(),
        onWrite: jest.fn()
      }))
    },
    storage: {
      object: jest.fn(() => ({
        onFinalize: jest.fn(),
        onDelete: jest.fn(),
        onMetadataUpdate: jest.fn()
      }))
    }
  }))
}));

// Mock Firebase Functions v2
jest.mock("firebase-functions/v2/https", () => ({
  onRequest: jest.fn((config, handler) => handler),
  onCall: jest.fn((config, handler) => handler)
}));

jest.mock("firebase-functions/v2/firestore", () => ({
  onDocumentCreated: jest.fn((config, handler) => handler),
  onDocumentUpdated: jest.fn((config, handler) => handler),
  onDocumentDeleted: jest.fn((config, handler) => handler),
  onDocumentWritten: jest.fn((config, handler) => handler)
}));

jest.mock("firebase-functions/v2/storage", () => ({
  onObjectFinalized: jest.fn((config, handler) => handler),
  onObjectDeleted: jest.fn((config, handler) => handler),
  onObjectMetadataUpdated: jest.fn((config, handler) => handler)
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
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsole = console;
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Restore console after tests if needed
afterAll(() => {
  global.console = originalConsole;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled rejections in tests
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Export common test utilities
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {},
  get: jest.fn((header: string) => overrides.headers?.[header]),
  ...overrides
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    setHeader: jest.fn(() => res),
    end: jest.fn(() => res),
    on: jest.fn(() => res)
  };
  return res;
};

export const createMockNext = () => jest.fn();

export const createMockUser = (overrides: any = {}) => ({
  uid: "test-user-id",
  email: "test@example.com",
  organizationId: "test-org-id",
  roles: ["user"],
  permissions: ["documents:read"],
  ...overrides
});

export const createMockDocument = (overrides: any = {}) => ({
  id: "test-doc-id",
  title: "Test Document",
  content: "Test content",
  organizationId: "test-org-id",
  createdBy: "test-user-id",
  status: "DRAFT",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockConfig = (overrides: any = {}) => ({
  id: "test-config-id",
  organizationId: "test-org-id",
  organizationName: "Test Organization",
  weights: {
    structural: 25.0,
    legal: 25.0,
    clarity: 25.0,
    abnt: 25.0
  },
  presetType: "STANDARD",
  customRules: [],
  version: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "test-user-id",
  ...overrides
});

export const createMockAnalysisResult = (overrides: any = {}) => ({
  id: "test-analysis-id",
  documentId: "test-doc-id",
  organizationId: "test-org-id",
  conformityScores: {
    structural: 85.0,
    legal: 92.0,
    clarity: 78.0,
    abnt: 88.0,
    overall: 85.8
  },
  weightedScore: 86.2,
  findings: [],
  recommendations: [],
  status: "completed",
  executionTimeSeconds: 12.5,
  createdAt: new Date(),
  completedAt: new Date(),
  ...overrides
});

// Mock supertest for API testing
export const mockSupertestResponse = (statusCode: number, body: any) => ({
  status: statusCode,
  body,
  headers: {},
  get: jest.fn()
});

export default {};