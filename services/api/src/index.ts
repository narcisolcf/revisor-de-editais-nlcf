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
export { comissoesApi } from "./api/comissoes-api";
export { organizationConfig } from "./api/organization-config";
// Import analysis router and create Cloud Function
import { onRequest } from "firebase-functions/v2/https";
import analysisRouter from "./api/analysis";
import express from "express";
import cors from "cors";
import helmet from "helmet";

const analysisApp = express();
analysisApp.use(helmet());
analysisApp.use(cors({ origin: true }));
analysisApp.use(express.json({ limit: '10mb' }));
analysisApp.use('/analysis', analysisRouter);

export const analysisApi = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 300,
  maxInstances: 50
}, analysisApp);

// Export Process Analysis Function
export { processAnalysis } from "./api/process-analysis";

// Export Trigger Functions  
// export { onDocumentUpload } from "./triggers/document-upload"; // Temporarily disabled due to storage bucket issues
// export { onAnalysisResultCreated, onAnalysisResultUpdated } from "./triggers/analysis-complete"; // Temporarily disabled due to deployment issues

// Export Additional Functions
export { healthCheck } from "./api/health";
export { analyticsReporter } from "./api/analytics";
export { notificationProcessor } from "./api/notifications";
export { auditLogger } from "./api/audit";

// Additional utility functions that might be called directly
// export { 
//   extractDocumentContent,
//   generateDocumentPreview,
//   validateDocument
// } from "./triggers/document-upload"; // Temporarily disabled due to storage bucket issues

export {
  cleanupOldAnalysisResults
} from "./triggers/analysis-complete";