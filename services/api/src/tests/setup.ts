/**
 * Configuração global para testes
 * LicitaReview - Sistema de Análise de Editais
 */

import { jest, afterEach, beforeEach } from '@jest/globals';

// Configurar timeout global para testes
jest.setTimeout(30000);

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
const createMockTimestamp = (date: Date = new Date()) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000
});

// Mock data store para simular Firestore com separação por coleção
const mockDataStore = new Map<string, Map<string, any>>();

// Tornar mockDataStore global para acesso nos testes
(global as any).mockDataStore = mockDataStore;

const getCollectionStore = (collectionPath: string): Map<string, any> => {
  if (!mockDataStore.has(collectionPath)) {
    mockDataStore.set(collectionPath, new Map<string, any>());
  }
  const store = mockDataStore.get(collectionPath)!;
  
  // Wrap the Map methods to add logging
  const originalSet = store.set.bind(store);
  const originalGet = store.get.bind(store);
  
  store.set = function(key: string, value: any) {
    if (value?.request?.options?.customRules !== undefined) {
      console.log(`MAP SET - storing for key ${key}:`, value.request.options.customRules, 'isArray:', Array.isArray(value.request.options.customRules));
    }
    return originalSet(key, value);
  };
  
  store.get = function(key: string) {
    const result = originalGet(key);
    if (result?.request?.options?.customRules !== undefined) {
      console.log(`MAP GET - retrieved for key ${key}:`, result.request.options.customRules, 'isArray:', Array.isArray(result.request.options.customRules));
    }
    return result;
  };
  
  return store;
};

// Função para preservar tipos durante serialização/deserialização
const deepClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
};

const createMockDoc = (id: string, collectionPath?: string) => {
  const doc: any = {
    id,
    // @ts-ignore
    get: jest.fn().mockImplementation(() => {
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
    set: jest.fn().mockImplementation(async (data: any) => {
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
    update: jest.fn().mockImplementation(async (data: any) => {
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
    delete: jest.fn().mockImplementation(async () => {
      const collectionStore = getCollectionStore(collectionPath || 'default');
      collectionStore.delete(id);
      return Promise.resolve();
    }),
    onSnapshot: jest.fn(),
    data: jest.fn().mockImplementation(() => {
      const collectionStore = getCollectionStore(collectionPath || 'default');
      const data = collectionStore.get(id);
      const clonedData = deepClone(data);
      return clonedData;
    })
  };
  
  return doc;
};

const mockDoc: any = createMockDoc('mock-doc-id', 'default');

const clearMockDataStore = () => {
  mockDataStore.clear();
  console.log('Mock data store cleared');
};

// Função para limpar o mock data store
export { clearMockDataStore };

// Limpar dados antes de cada teste
beforeEach(() => {
  // Limpar apenas dados de teste, manter organizações
  const testCollections = ['documents', 'analyses', 'configs', 'users', 'auditLogs'];
  testCollections.forEach(collectionPath => {
    if (mockDataStore.has(collectionPath)) {
      mockDataStore.delete(collectionPath);
    }
  });
  // NÃO limpar 'organizations' para manter dados entre testes
});

const createMockCollection = (collectionPath: string = 'default'): any => {
  const collection = {
    doc: jest.fn().mockImplementation((id?: any) => {
      const docId = id || `mock-doc-${Date.now()}-${Math.random()}`;
      const doc = createMockDoc(docId, collectionPath);
      return doc;
    }),
    // @ts-ignore
    add: jest.fn().mockImplementation(async (data: any) => {
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
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    // @ts-ignore
    get: jest.fn().mockImplementation(() => {
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
        forEach: jest.fn((callback: any) => docs.forEach(callback))
      });
    }),
    onSnapshot: jest.fn()
  };
  
  return collection;
};

const mockCollection: any = createMockCollection();

// Configure mock behaviors - já configurados nas funções createMockDoc e createMockCollection

// Create a single consistent mockFirestore instance with proper implementation
const mockFirestore: any = {
  collection: jest.fn((collectionPath: any) => {
    const collection = createMockCollection(collectionPath);
    return collection;
  }),
  doc: jest.fn((docPath: any) => {
    const id = docPath || `mock-doc-${Date.now()}`;
    return createMockDoc(id);
  }),
  batch: jest.fn().mockReturnValue({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // @ts-ignore
    commit: jest.fn().mockResolvedValue(undefined)
  }),
  // @ts-ignore
    runTransaction: jest.fn().mockImplementation((callback: any) => {
      return Promise.resolve(callback({
        // @ts-ignore
        get: jest.fn().mockResolvedValue({ exists: false }),
        // @ts-ignore
        set: jest.fn().mockResolvedValue(undefined),
        // @ts-ignore
        update: jest.fn().mockResolvedValue(undefined),
        // @ts-ignore
        delete: jest.fn().mockResolvedValue(undefined)
      }));
    }),
  settings: jest.fn(),
  // Additional Firestore properties to match the interface
  databaseId: 'mock-database',
  collectionGroup: jest.fn(),
  getAll: jest.fn(),
  recursiveDelete: jest.fn(),
  listCollections: jest.fn(),
  listDocuments: jest.fn(),
  terminate: jest.fn(),
  waitForPendingWrites: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn().mockReturnValue(createMockTimestamp(new Date())),
    arrayUnion: jest.fn().mockImplementation((...elements) => ({ _methodName: 'arrayUnion', _elements: elements })),
    arrayRemove: jest.fn().mockImplementation((...elements) => ({ _methodName: 'arrayRemove', _elements: elements })),
    increment: jest.fn().mockImplementation((n) => ({ _methodName: 'increment', _operand: n })),
    delete: jest.fn().mockReturnValue({ _methodName: 'delete' })
  }
};

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn()
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn()
  })),
  firestore: jest.fn(() => mockFirestore),
  storage: jest.fn(() => ({
    bucket: jest.fn()
  })),
  messaging: jest.fn(() => ({
    send: jest.fn()
  }))
}));

// Mock firebase-admin/firestore module specifically
jest.mock('firebase-admin/firestore', () => ({
  Firestore: jest.fn(() => mockFirestore),
  DocumentReference: jest.fn(),
  CollectionReference: jest.fn(),
  Query: jest.fn(),
  Transaction: jest.fn(),
  DocumentSnapshot: jest.fn(),
  QuerySnapshot: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

// Mock the firebase config module directly
jest.mock('../config/firebase', () => {
  // Use the same mockFirestore instance
  const mockFirestoreInstance = mockFirestore;
  
  return {
    auth: {
      verifyIdToken: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn()
    },
    firestore: mockFirestoreInstance,
    storage: {
      bucket: jest.fn()
    },
    messaging: {
      send: jest.fn()
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

// Export mocks for use in tests
export { mockFirestore, mockCollection, mockDoc };

// Mock básico do Firebase Functions
jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock básico do Express
jest.mock('express', () => {
  const mockApp = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    listen: jest.fn()
  };
  
  interface MockExpress {
    (): typeof mockApp;
    json: jest.Mock;
    Router: jest.Mock;
    static: jest.Mock;
  }
  
  const mockExpress = jest.fn(() => mockApp) as unknown as MockExpress;
  mockExpress.json = jest.fn();
  mockExpress.Router = jest.fn(() => mockApp);
  mockExpress.static = jest.fn();
  return mockExpress;
});

// Mock de middlewares
jest.mock('cors', () => jest.fn(() => jest.fn()));
jest.mock('helmet', () => jest.fn(() => jest.fn()));

// Mock do Axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn()
  })),
  get: jest.fn(),
  post: jest.fn()
}));

// Limpeza após cada teste
afterEach(() => {
  // Não limpar os mocks do Firestore para manter a funcionalidade
  // jest.clearAllMocks();
});