/**
 * LicitaReview Cloud Functions - Main Entry Point
 * Exports all Cloud Functions for deployment
 * TEMPORARY: Simplified version for testing deployment
 */
export { comissoesApi } from "./api/comissoes-api";
export { documentsApi } from "./api/documents";
export { healthCheck } from "./api/health";
export { processAnalysis } from "./api/process-analysis";
export { organizationConfig } from "./api/organization-config";
export { analysisConfigApi } from "./api/analysis-config";
export { feedbackApi } from "./api/feedback";
export { monitoringApi } from "./api/monitoring";
export { callbacksApi } from "./api/callbacks";
export { onAnalysisResultCreated, onAnalysisResultUpdated } from "./triggers/analysis-complete";
