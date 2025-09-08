"use strict";
/**
 * LicitaReview Cloud Functions - Main Entry Point
 * Exports all Cloud Functions for deployment
 * TEMPORARY: Simplified version for testing deployment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAnalysisResultUpdated = exports.onAnalysisResultCreated = exports.callbacksApi = exports.monitoringApi = exports.feedbackApi = exports.analysisConfigApi = exports.organizationConfig = exports.processAnalysis = exports.healthCheck = exports.documentsApi = exports.comissoesApi = void 0;
// Setup global error handlers - temporarily disabled for deployment
// import { setupGlobalErrorHandlers } from "./middleware/error";
// setupGlobalErrorHandlers();
// API Functions
var comissoes_api_1 = require("./api/comissoes-api");
Object.defineProperty(exports, "comissoesApi", { enumerable: true, get: function () { return comissoes_api_1.comissoesApi; } });
var documents_1 = require("./api/documents");
Object.defineProperty(exports, "documentsApi", { enumerable: true, get: function () { return documents_1.documentsApi; } });
var health_1 = require("./api/health");
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return health_1.healthCheck; } });
var process_analysis_1 = require("./api/process-analysis");
Object.defineProperty(exports, "processAnalysis", { enumerable: true, get: function () { return process_analysis_1.processAnalysis; } });
var organization_config_1 = require("./api/organization-config");
Object.defineProperty(exports, "organizationConfig", { enumerable: true, get: function () { return organization_config_1.organizationConfig; } });
var analysis_config_1 = require("./api/analysis-config");
Object.defineProperty(exports, "analysisConfigApi", { enumerable: true, get: function () { return analysis_config_1.analysisConfigApi; } });
var feedback_1 = require("./api/feedback");
Object.defineProperty(exports, "feedbackApi", { enumerable: true, get: function () { return feedback_1.feedbackApi; } });
var monitoring_1 = require("./api/monitoring");
Object.defineProperty(exports, "monitoringApi", { enumerable: true, get: function () { return monitoring_1.monitoringApi; } });
var callbacks_1 = require("./api/callbacks");
Object.defineProperty(exports, "callbacksApi", { enumerable: true, get: function () { return callbacks_1.callbacksApi; } });
// Triggers
var analysis_complete_1 = require("./triggers/analysis-complete");
Object.defineProperty(exports, "onAnalysisResultCreated", { enumerable: true, get: function () { return analysis_complete_1.onAnalysisResultCreated; } });
Object.defineProperty(exports, "onAnalysisResultUpdated", { enumerable: true, get: function () { return analysis_complete_1.onAnalysisResultUpdated; } });
//# sourceMappingURL=index.js.map