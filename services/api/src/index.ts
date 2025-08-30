/**
 * LicitaReview Cloud Functions - Main Entry Point
 * Exports all Cloud Functions for deployment
 * TEMPORARY: Simplified version for testing deployment
 */

// Setup global error handlers - temporarily disabled for deployment
// import { setupGlobalErrorHandlers } from "./middleware/error";
// setupGlobalErrorHandlers();

// API Functions
export { comissoesApi } from "./api/comissoes-api";
export { healthCheck } from "./api/health";
export { processAnalysis } from "./api/process-analysis";
export { organizationConfig } from "./api/organization-config";
export { analysisConfigApi } from "./api/analysis-config";
export { feedbackApi } from "./api/feedback";
export { monitoringApi } from "./api/monitoring";
export { callbacksApi } from "./api/callbacks";

// Triggers
export { onAnalysisResultCreated, onAnalysisResultUpdated } from "./triggers/analysis-complete";