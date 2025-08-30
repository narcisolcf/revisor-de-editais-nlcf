/**
 * Dados de teste para testes E2E
 */

export const testUsers = {
  admin: {
    email: 'admin@licitareview.com',
    password: 'AdminTest123!',
    displayName: 'Administrador Teste',
    role: 'admin'
  },
  analyst: {
    email: 'analyst@licitareview.com',
    password: 'AnalystTest123!',
    displayName: 'Analista Teste',
    role: 'analyst'
  },
  viewer: {
    email: 'viewer@licitareview.com',
    password: 'ViewerTest123!',
    displayName: 'Visualizador Teste',
    role: 'viewer'
  }
};

export const testDocuments = {
  validPdf: {
    name: 'edital-valido.pdf',
    type: 'application/pdf',
    size: 2048576, // 2MB
    content: 'Conteúdo de edital válido para teste'
  },
  largePdf: {
    name: 'edital-grande.pdf',
    type: 'application/pdf',
    size: 10485760, // 10MB
    content: 'Conteúdo de edital grande para teste de performance'
  },
  invalidFile: {
    name: 'arquivo-invalido.txt',
    type: 'text/plain',
    size: 1024,
    content: 'Arquivo de tipo inválido'
  },
  corruptedPdf: {
    name: 'edital-corrompido.pdf',
    type: 'application/pdf',
    size: 1024,
    content: 'Conteúdo corrompido que não é um PDF válido'
  }
};

export const testAnalysisParameters = {
  default: {
    evaluationCriteria: {
      'technical-requirements': 30,
      'financial-criteria': 25,
      'legal-compliance': 25,
      'experience-qualification': 20
    },
    thresholds: {
      'minimum-score': 70,
      'technical-threshold': 60,
      'financial-threshold': 80
    },
    customRules: [
      'Verificar certificações obrigatórias',
      'Validar experiência mínima de 3 anos',
      'Confirmar regularidade fiscal'
    ]
  },
  strict: {
    evaluationCriteria: {
      'technical-requirements': 40,
      'financial-criteria': 30,
      'legal-compliance': 30,
      'experience-qualification': 0
    },
    thresholds: {
      'minimum-score': 85,
      'technical-threshold': 80,
      'financial-threshold': 90
    },
    customRules: [
      'Verificar todas as certificações',
      'Validar experiência mínima de 5 anos',
      'Confirmar regularidade fiscal e trabalhista'
    ]
  },
  lenient: {
    evaluationCriteria: {
      'technical-requirements': 20,
      'financial-criteria': 20,
      'legal-compliance': 20,
      'experience-qualification': 40
    },
    thresholds: {
      'minimum-score': 50,
      'technical-threshold': 40,
      'financial-threshold': 60
    },
    customRules: [
      'Verificar certificações básicas',
      'Validar experiência mínima de 1 ano'
    ]
  }
};

export const testScenarios = {
  successfulAnalysis: {
    description: 'Análise bem-sucedida de edital válido',
    expectedDuration: 25000, // 25 segundos
    expectedResult: 'success',
    expectedScore: 85
  },
  failedAnalysis: {
    description: 'Análise falhada por documento inválido',
    expectedDuration: 5000, // 5 segundos
    expectedResult: 'error',
    expectedError: 'Documento inválido ou corrompido'
  },
  timeoutAnalysis: {
    description: 'Análise que excede tempo limite',
    expectedDuration: 35000, // 35 segundos
    expectedResult: 'timeout',
    expectedError: 'Tempo limite excedido'
  }
};

export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh'
  },
  documents: {
    upload: '/api/documents/upload',
    list: '/api/documents',
    get: (id: string) => `/api/documents/${id}`,
    delete: (id: string) => `/api/documents/${id}`
  },
  analysis: {
    start: '/api/analysis/start',
    status: (id: string) => `/api/analysis/${id}/status`,
    result: (id: string) => `/api/analysis/${id}/result`,
    cancel: (id: string) => `/api/analysis/${id}/cancel`
  },
  parameters: {
    get: '/api/parameters',
    update: '/api/parameters',
    reset: '/api/parameters/reset'
  }
};

export const performanceThresholds = {
  pageLoad: 3000, // 3 segundos
  apiResponse: 2000, // 2 segundos
  analysisComplete: 30000, // 30 segundos
  fileUpload: 10000, // 10 segundos
  firstContentfulPaint: 1500, // 1.5 segundos
  largestContentfulPaint: 2500 // 2.5 segundos
};

export const errorMessages = {
  auth: {
    invalidCredentials: 'Credenciais inválidas',
    sessionExpired: 'Sessão expirada',
    accessDenied: 'Acesso negado'
  },
  upload: {
    fileTooBig: 'Arquivo muito grande',
    invalidFormat: 'Formato de arquivo inválido',
    uploadFailed: 'Falha no upload do arquivo'
  },
  analysis: {
    processingError: 'Erro no processamento',
    timeoutError: 'Tempo limite excedido',
    invalidDocument: 'Documento inválido'
  },
  network: {
    connectionError: 'Erro de conexão',
    serverError: 'Erro interno do servidor',
    serviceUnavailable: 'Serviço indisponível'
  }
};

/**
 * Utilitário para criar dados de teste dinâmicos
 */
export class TestDataFactory {
  static createUser(overrides: Partial<typeof testUsers.admin> = {}) {
    const timestamp = Date.now();
    return {
      email: `test-${timestamp}@example.com`,
      password: 'TestPassword123!',
      displayName: `Usuário Teste ${timestamp}`,
      role: 'analyst',
      ...overrides
    };
  }

  static createDocument(overrides: Partial<typeof testDocuments.validPdf> = {}) {
    const timestamp = Date.now();
    return {
      name: `edital-${timestamp}.pdf`,
      type: 'application/pdf',
      size: 1024576,
      content: `Conteúdo de teste ${timestamp}`,
      ...overrides
    };
  }

  static createAnalysisResult(overrides: any = {}) {
    return {
      id: `analysis-${Date.now()}`,
      documentId: `doc-${Date.now()}`,
      status: 'completed',
      score: 75,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      results: {
        technicalScore: 80,
        financialScore: 70,
        legalScore: 75,
        overallRecommendation: 'approved'
      },
      ...overrides
    };
  }
}