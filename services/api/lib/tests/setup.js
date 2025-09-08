"use strict";
/**
 * Configuração global para testes
 * LicitaReview - Sistema de Análise de Editais
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockDoc = exports.mockCollection = exports.mockFirestore = exports.clearMockDataStore = void 0;
const globals_1 = require("@jest/globals");
// Configurar timeout global para testes
globals_1.jest.setTimeout(30000);
// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.GCLOUD_PROJECT = 'test-project';
process.env.GOOGLE_CLOUD_PROJECT = 'test-project';
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.CLOUD_RUN_URL = 'http://localhost:8080';
process.env.CLOUD_RUN_SERVICE_ACCOUNT_EMAIL = 'test@test.com';
process.env.CLOUD_RUN_PRIVATE_KEY = 'test-key';
process.env.CLOUD_RUN_PROJECT_ID = 'test-project';
process.env.CLOUD_RUN_CLIENT_EMAIL = 'test@test.com';
process.env.CLOUD_RUN_CLIENT_ID = 'test-client-id';
process.env.CLOUD_RUN_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth';
process.env.CLOUD_RUN_TOKEN_URI = 'https://oauth2.googleapis.com/token';
process.env.CLOUD_RUN_AUTH_PROVIDER_X509_CERT_URL = 'https://www.googleapis.com/oauth2/v1/certs';
process.env.CLOUD_RUN_CLIENT_X509_CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test.com';
// Mock Firebase Admin SDK
const createMockTimestamp = (date = new Date()) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
});
// Mock data store para simular Firestore com separação por coleção
const mockDataStore = new Map();
// Tornar mockDataStore global para acesso nos testes
global.mockDataStore = mockDataStore;
const getCollectionStore = (collectionPath) => {
    if (!mockDataStore.has(collectionPath)) {
        mockDataStore.set(collectionPath, new Map());
    }
    const store = mockDataStore.get(collectionPath);
    // Wrap the Map methods to add logging
    const originalSet = store.set.bind(store);
    const originalGet = store.get.bind(store);
    store.set = function (key, value) {
        if (value?.request?.options?.customRules !== undefined) {
            console.log(`MAP SET - storing for key ${key}:`, value.request.options.customRules, 'isArray:', Array.isArray(value.request.options.customRules));
        }
        return originalSet(key, value);
    };
    store.get = function (key) {
        const result = originalGet(key);
        if (result?.request?.options?.customRules !== undefined) {
            console.log(`MAP GET - retrieved for key ${key}:`, result.request.options.customRules, 'isArray:', Array.isArray(result.request.options.customRules));
        }
        return result;
    };
    return store;
};
// Função para preservar tipos durante serialização/deserialização
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item));
    }
    const cloned = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            cloned[key] = deepClone(obj[key]);
        }
    }
    return cloned;
};
const createMockDoc = (id, collectionPath) => {
    const doc = {
        id,
        // @ts-ignore
        get: globals_1.jest.fn().mockImplementation(() => {
            const collectionStore = getCollectionStore(collectionPath || 'default');
            const data = collectionStore.get(id);
            const clonedData = deepClone(data);
            return Promise.resolve({
                id,
                exists: !!data,
                data: () => clonedData,
                ref: { id }
            });
        }),
        // @ts-ignore
        set: globals_1.jest.fn().mockImplementation(async (data) => {
            const collectionStore = getCollectionStore(collectionPath || 'default');
            const clonedData = deepClone(data);
            const docData = {
                ...clonedData,
                id, // Preservar o ID fornecido
                createdAt: data.createdAt || createMockTimestamp(),
                updatedAt: createMockTimestamp()
            };
            collectionStore.set(id, docData);
            return Promise.resolve();
        }),
        // @ts-ignore
        update: globals_1.jest.fn().mockImplementation(async (data) => {
            const collectionStore = getCollectionStore(collectionPath || 'default');
            const existing = collectionStore.get(id) || {};
            const updated = {
                ...deepClone(existing),
                ...deepClone(data),
                id, // Garantir que o ID seja preservado
                updatedAt: createMockTimestamp()
            };
            collectionStore.set(id, deepClone(updated));
            return Promise.resolve();
        }),
        // @ts-ignore
        delete: globals_1.jest.fn().mockImplementation(async () => {
            const collectionStore = getCollectionStore(collectionPath || 'default');
            collectionStore.delete(id);
            return Promise.resolve();
        }),
        onSnapshot: globals_1.jest.fn(),
        data: globals_1.jest.fn().mockImplementation(() => {
            const collectionStore = getCollectionStore(collectionPath || 'default');
            const data = collectionStore.get(id);
            const clonedData = deepClone(data);
            return clonedData;
        })
    };
    return doc;
};
const mockDoc = createMockDoc('mock-doc-id', 'default');
exports.mockDoc = mockDoc;
const clearMockDataStore = () => {
    mockDataStore.clear();
    console.log('Mock data store cleared');
};
exports.clearMockDataStore = clearMockDataStore;
// Limpar dados antes de cada teste
(0, globals_1.beforeEach)(() => {
    // Limpar apenas dados de teste, manter organizações
    const testCollections = ['documents', 'analyses', 'configs', 'users', 'auditLogs'];
    testCollections.forEach(collectionPath => {
        if (mockDataStore.has(collectionPath)) {
            mockDataStore.delete(collectionPath);
        }
    });
    // NÃO limpar 'organizations' para manter dados entre testes
});
const createMockCollection = (collectionPath = 'default') => {
    const collection = {
        doc: globals_1.jest.fn().mockImplementation((id) => {
            const docId = id || `mock-doc-${Date.now()}-${Math.random()}`;
            const doc = createMockDoc(docId, collectionPath);
            return doc;
        }),
        // @ts-ignore
        add: globals_1.jest.fn().mockImplementation(async (data) => {
            const docId = `mock-doc-${Date.now()}-${Math.random()}`;
            const collectionStore = getCollectionStore(collectionPath);
            const docData = {
                ...deepClone(data),
                id: docId,
                createdAt: createMockTimestamp(),
                updatedAt: createMockTimestamp()
            };
            collectionStore.set(docId, deepClone(docData));
            return Promise.resolve({ id: docId });
        }),
        where: globals_1.jest.fn().mockReturnThis(),
        orderBy: globals_1.jest.fn().mockReturnThis(),
        limit: globals_1.jest.fn().mockReturnThis(),
        offset: globals_1.jest.fn().mockReturnThis(),
        // @ts-ignore
        get: globals_1.jest.fn().mockImplementation(() => {
            // Retornar apenas documentos da coleção específica
            const collectionStore = getCollectionStore(collectionPath);
            const docs = Array.from(collectionStore.entries()).map(([id, data]) => ({
                id,
                data: () => deepClone(data),
                exists: true,
                ref: { id }
            }));
            return Promise.resolve({
                docs,
                size: docs.length,
                empty: docs.length === 0,
                forEach: globals_1.jest.fn((callback) => docs.forEach(callback))
            });
        }),
        onSnapshot: globals_1.jest.fn()
    };
    return collection;
};
const mockCollection = createMockCollection();
exports.mockCollection = mockCollection;
// Configure mock behaviors - já configurados nas funções createMockDoc e createMockCollection
// Create a single consistent mockFirestore instance with proper implementation
const mockFirestore = {
    collection: globals_1.jest.fn((collectionPath) => {
        const collection = createMockCollection(collectionPath);
        return collection;
    }),
    doc: globals_1.jest.fn((docPath) => {
        const id = docPath || `mock-doc-${Date.now()}`;
        return createMockDoc(id);
    }),
    batch: globals_1.jest.fn().mockReturnValue({
        set: globals_1.jest.fn(),
        update: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        // @ts-ignore
        commit: globals_1.jest.fn().mockResolvedValue(undefined)
    }),
    // @ts-ignore
    runTransaction: globals_1.jest.fn().mockImplementation((callback) => {
        return Promise.resolve(callback({
            // @ts-ignore
            get: globals_1.jest.fn().mockResolvedValue({ exists: false }),
            // @ts-ignore
            set: globals_1.jest.fn().mockResolvedValue(undefined),
            // @ts-ignore
            update: globals_1.jest.fn().mockResolvedValue(undefined),
            // @ts-ignore
            delete: globals_1.jest.fn().mockResolvedValue(undefined)
        }));
    }),
    settings: globals_1.jest.fn(),
    // Additional Firestore properties to match the interface
    databaseId: 'mock-database',
    collectionGroup: globals_1.jest.fn(),
    getAll: globals_1.jest.fn(),
    recursiveDelete: globals_1.jest.fn(),
    listCollections: globals_1.jest.fn(),
    listDocuments: globals_1.jest.fn(),
    terminate: globals_1.jest.fn(),
    waitForPendingWrites: globals_1.jest.fn(),
    FieldValue: {
        serverTimestamp: globals_1.jest.fn().mockReturnValue(createMockTimestamp(new Date())),
        arrayUnion: globals_1.jest.fn().mockImplementation((...elements) => ({ _methodName: 'arrayUnion', _elements: elements })),
        arrayRemove: globals_1.jest.fn().mockImplementation((...elements) => ({ _methodName: 'arrayRemove', _elements: elements })),
        increment: globals_1.jest.fn().mockImplementation((n) => ({ _methodName: 'increment', _operand: n })),
        delete: globals_1.jest.fn().mockReturnValue({ _methodName: 'delete' })
    }
};
exports.mockFirestore = mockFirestore;
globals_1.jest.mock('firebase-admin', () => ({
    apps: [],
    initializeApp: globals_1.jest.fn(),
    credential: {
        applicationDefault: globals_1.jest.fn()
    },
    auth: globals_1.jest.fn(() => ({
        verifyIdToken: globals_1.jest.fn(),
        createUser: globals_1.jest.fn(),
        updateUser: globals_1.jest.fn(),
        deleteUser: globals_1.jest.fn()
    })),
    firestore: globals_1.jest.fn(() => mockFirestore),
    storage: globals_1.jest.fn(() => ({
        bucket: globals_1.jest.fn()
    })),
    messaging: globals_1.jest.fn(() => ({
        send: globals_1.jest.fn()
    }))
}));
// Mock firebase-admin/firestore module specifically
globals_1.jest.mock('firebase-admin/firestore', () => ({
    Firestore: globals_1.jest.fn(() => mockFirestore),
    DocumentReference: globals_1.jest.fn(),
    CollectionReference: globals_1.jest.fn(),
    Query: globals_1.jest.fn(),
    Transaction: globals_1.jest.fn(),
    DocumentSnapshot: globals_1.jest.fn(),
    QuerySnapshot: globals_1.jest.fn(),
    Timestamp: {
        fromDate: globals_1.jest.fn((date) => ({ toDate: () => date })),
        now: globals_1.jest.fn(() => ({ toDate: () => new Date() }))
    }
}));
// Mock the firebase config module directly
globals_1.jest.mock('../config/firebase', () => {
    // Use the same mockFirestore instance
    const mockFirestoreInstance = mockFirestore;
    return {
        auth: {
            verifyIdToken: globals_1.jest.fn(),
            createUser: globals_1.jest.fn(),
            updateUser: globals_1.jest.fn(),
            deleteUser: globals_1.jest.fn()
        },
        firestore: mockFirestoreInstance,
        storage: {
            bucket: globals_1.jest.fn()
        },
        messaging: {
            send: globals_1.jest.fn()
        },
        collections: {
            documents: createMockCollection(),
            organizations: createMockCollection(),
            analysisResults: createMockCollection(),
            configs: createMockCollection(),
            users: createMockCollection(),
            auditLogs: createMockCollection()
        }
    };
});
// Mock básico do Firebase Functions
globals_1.jest.mock('firebase-functions', () => ({
    logger: {
        info: globals_1.jest.fn(),
        warn: globals_1.jest.fn(),
        error: globals_1.jest.fn(),
        debug: globals_1.jest.fn()
    }
}));
// Mock básico do Express
globals_1.jest.mock('express', () => {
    const mockApp = {
        use: globals_1.jest.fn(),
        get: globals_1.jest.fn(),
        post: globals_1.jest.fn(),
        put: globals_1.jest.fn(),
        delete: globals_1.jest.fn(),
        listen: globals_1.jest.fn()
    };
    const mockExpress = globals_1.jest.fn(() => mockApp);
    mockExpress.json = globals_1.jest.fn();
    mockExpress.Router = globals_1.jest.fn(() => mockApp);
    mockExpress.static = globals_1.jest.fn();
    return mockExpress;
});
// Mock de middlewares
globals_1.jest.mock('cors', () => globals_1.jest.fn(() => globals_1.jest.fn()));
globals_1.jest.mock('helmet', () => globals_1.jest.fn(() => globals_1.jest.fn()));
// Mock do Axios
globals_1.jest.mock('axios', () => ({
    create: globals_1.jest.fn(() => ({
        get: globals_1.jest.fn(),
        post: globals_1.jest.fn()
    })),
    get: globals_1.jest.fn(),
    post: globals_1.jest.fn()
}));
// Limpeza após cada teste
(0, globals_1.afterEach)(() => {
    // Não limpar os mocks do Firestore para manter a funcionalidade
    // jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map