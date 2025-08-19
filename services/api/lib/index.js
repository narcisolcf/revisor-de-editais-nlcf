"use strict";
/**
 * LicitaReview Cloud Functions - Main Entry Point
 * Exports all Cloud Functions for deployment
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldAnalysisResults = exports.validateDocument = exports.generateDocumentPreview = exports.extractDocumentContent = exports.auditLogger = exports.notificationProcessor = exports.analyticsReporter = exports.healthCheck = exports.onAnalysisResultUpdated = exports.onAnalysisResultCreated = exports.onDocumentUpload = exports.analysisApi = exports.organizationConfig = exports.comissoesApi = exports.analysisConfigApi = exports.documentsApi = void 0;
// Setup global error handlers
const error_1 = require("./middleware/error");
(0, error_1.setupGlobalErrorHandlers)();
// Export API Functions
var documents_1 = require("./api/documents");
Object.defineProperty(exports, "documentsApi", { enumerable: true, get: function () { return documents_1.documentsApi; } });
var analysis_config_1 = require("./api/analysis-config");
Object.defineProperty(exports, "analysisConfigApi", { enumerable: true, get: function () { return analysis_config_1.analysisConfigApi; } });
var comissoes_api_1 = require("./api/comissoes-api");
Object.defineProperty(exports, "comissoesApi", { enumerable: true, get: function () { return comissoes_api_1.comissoesApi; } });
var organization_config_1 = require("./api/organization-config");
Object.defineProperty(exports, "organizationConfig", { enumerable: true, get: function () { return organization_config_1.organizationConfig; } });
// Import analysis router and create Cloud Function
const https_1 = require("firebase-functions/v2/https");
const analysis_1 = __importDefault(require("./api/analysis"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const analysisApp = (0, express_1.default)();
analysisApp.use((0, helmet_1.default)());
analysisApp.use((0, cors_1.default)({ origin: true }));
analysisApp.use(express_1.default.json({ limit: '10mb' }));
analysisApp.use('/analysis', analysis_1.default);
exports.analysisApi = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 300,
    maxInstances: 50
}, analysisApp);
// Export Trigger Functions  
var document_upload_1 = require("./triggers/document-upload");
Object.defineProperty(exports, "onDocumentUpload", { enumerable: true, get: function () { return document_upload_1.onDocumentUpload; } });
var analysis_complete_1 = require("./triggers/analysis-complete");
Object.defineProperty(exports, "onAnalysisResultCreated", { enumerable: true, get: function () { return analysis_complete_1.onAnalysisResultCreated; } });
Object.defineProperty(exports, "onAnalysisResultUpdated", { enumerable: true, get: function () { return analysis_complete_1.onAnalysisResultUpdated; } });
// Export Additional Functions
var health_1 = require("./api/health");
Object.defineProperty(exports, "healthCheck", { enumerable: true, get: function () { return health_1.healthCheck; } });
var analytics_1 = require("./api/analytics");
Object.defineProperty(exports, "analyticsReporter", { enumerable: true, get: function () { return analytics_1.analyticsReporter; } });
var notifications_1 = require("./api/notifications");
Object.defineProperty(exports, "notificationProcessor", { enumerable: true, get: function () { return notifications_1.notificationProcessor; } });
var audit_1 = require("./api/audit");
Object.defineProperty(exports, "auditLogger", { enumerable: true, get: function () { return audit_1.auditLogger; } });
// Additional utility functions that might be called directly
var document_upload_2 = require("./triggers/document-upload");
Object.defineProperty(exports, "extractDocumentContent", { enumerable: true, get: function () { return document_upload_2.extractDocumentContent; } });
Object.defineProperty(exports, "generateDocumentPreview", { enumerable: true, get: function () { return document_upload_2.generateDocumentPreview; } });
Object.defineProperty(exports, "validateDocument", { enumerable: true, get: function () { return document_upload_2.validateDocument; } });
var analysis_complete_2 = require("./triggers/analysis-complete");
Object.defineProperty(exports, "cleanupOldAnalysisResults", { enumerable: true, get: function () { return analysis_complete_2.cleanupOldAnalysisResults; } });
//# sourceMappingURL=index.js.map