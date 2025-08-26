/**
 * Configuration index
 * Exports all configuration settings
 */

export * from "./firebase";

// Environment configuration
export const config = {
  // Firebase
  projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID,
  // storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Temporarily disabled
  
  // API Configuration
  corsOrigin: process.env.CORS_ORIGIN || "*",
  maxRequestSize: process.env.MAX_REQUEST_SIZE || "10mb",
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100"), // 100 requests per window
  
  // Document processing
  maxDocumentSize: parseInt(process.env.MAX_DOCUMENT_SIZE || "52428800"), // 50MB
  allowedDocumentTypes: (process.env.ALLOWED_DOCUMENT_TYPES || "pdf,doc,docx,txt").split(","),
  
  // Analysis configuration
  defaultAnalysisTimeout: parseInt(process.env.DEFAULT_ANALYSIS_TIMEOUT || "300000"), // 5 minutes
  maxConcurrentAnalyses: parseInt(process.env.MAX_CONCURRENT_ANALYSES || "10"),
  
  // Security
  jwtSecret: process.env.JWT_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  
  // External services
  documentAnalyzerServiceUrl: process.env.DOCUMENT_ANALYZER_SERVICE_URL,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
  enableAuditLogs: process.env.ENABLE_AUDIT_LOGS === "true",
  
  // Environment
  nodeEnv: process.env.NODE_ENV || "development",
  isDevelopment: process.env.NODE_ENV !== "production",
} as const;

// Validation
if (!config.projectId) {
  throw new Error("GCLOUD_PROJECT or FIREBASE_PROJECT_ID environment variable is required");
}

export default config;