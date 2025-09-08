/**
 * Configurações da aplicação LicitaReview
 */

export const config = {
  // Configurações de análise
  analysis: {
    defaultTimeout: 30000, // 30 segundos
    maxRetries: 3,
    enableCache: true,
    batchSize: 10
  },
  
  // Configurações de UI
  ui: {
    theme: 'light',
    language: 'pt-BR',
    autoSave: true,
    autoSaveInterval: 5000 // 5 segundos
  },
  
  // Configurações de validação
  validation: {
    enableRealTime: true,
    showPreview: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.txt']
  },
  
  // Configurações de organização padrão
  organization: {
    defaultId: 'default',
    name: 'Organização Padrão'
  }
};

export default config;