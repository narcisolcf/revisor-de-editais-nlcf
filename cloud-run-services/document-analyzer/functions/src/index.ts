/**
 * LicitaReview Cloud Functions - Main Entry Point
 * Exports all Cloud Functions for deployment
 */

// Setup global error handlers
import { setupGlobalErrorHandlers } from "./middleware/error";
setupGlobalErrorHandlers();

// Export API Functions
export { documentsApi } from "./api/documents";
export { analysisConfigApi } from "./api/analysis-config";

// Export Trigger Functions  
export { onDocumentUpload } from "./triggers/document-upload";
export { onAnalysisResultCreated, onAnalysisResultUpdated } from "./triggers/analysis-complete";

// Export Additional Functions
export { healthCheck } from "./api/health";
export { analyticsReporter } from "./api/analytics";
export { notificationProcessor } from "./api/notifications";
export { auditLogger } from "./api/audit";

// Additional utility functions that might be called directly
export { 
  extractDocumentContent,
  generateDocumentPreview,
  validateDocument
} from "./triggers/document-upload";

export {
  cleanupOldAnalysisResults
} from "./triggers/analysis-complete";