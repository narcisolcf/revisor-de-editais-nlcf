"use strict";
/**
 * Analysis API - Endpoints para análise de documentos
 * LicitaReview Cloud Functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const auth_1 = require("../middleware/auth");
const AnalysisOrchestrator_1 = require("../services/AnalysisOrchestrator");
const firebase_1 = require("../config/firebase");
const zod_1 = require("zod");
const error_1 = require("../middleware/error");
const auth_2 = require("../middleware/auth");
const utils_1 = require("../utils");
// Schemas de validação
const StartAnalysisRequestSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1, 'Document ID is required'),
    analysisType: zod_1.z.enum(['compliance', 'risk', 'completeness', 'all']).default('all'),
    options: zod_1.z.object({
        priority: zod_1.z.enum(['low', 'normal', 'high']).default('normal'),
        includeRecommendations: zod_1.z.boolean().default(true),
        detailedReport: zod_1.z.boolean().default(false)
    }).default({})
});
const AnalysisIdSchema = zod_1.z.object({
    analysisId: zod_1.z.string().min(1, 'Analysis ID is required')
});
const DocumentIdSchema = zod_1.z.object({
    documentId: zod_1.z.string().min(1, 'Document ID is required')
});
// Inicializar o orquestrador de análises
const orchestrator = new AnalysisOrchestrator_1.AnalysisOrchestrator(firebase_1.firestore, process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url', process.env.GOOGLE_CLOUD_PROJECT || 'default-project');
// Helper functions - using imported utilities
// Path validation handled inline with validateData
const router = express.Router();
/**
 * POST /analysis/start
 * Inicia uma nova análise de documento
 */
router.post('/start', auth_2.authenticateUser, auth_2.requireOrganization, (0, auth_2.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_WRITE]), async (req, res) => {
    try {
        const bodyValidation = (0, utils_1.validateData)(StartAnalysisRequestSchema, req.body);
        if (!bodyValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Dados da requisição inválidos', bodyValidation.details, req.headers['x-request-id']));
        }
        const { documentId, options } = bodyValidation.data;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId) {
            return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'ID da organização é obrigatório', {}, req.headers['x-request-id']));
        }
        // Verificar se o documento existe e pertence à organização
        const docSnapshot = await firebase_1.collections.documents.doc(documentId).get();
        if (!docSnapshot.exists) {
            return res.status(404).json((0, utils_1.createErrorResponse)('NOT_FOUND', 'Documento não encontrado'));
        }
        const document = docSnapshot.data();
        if (document?.organizationId !== organizationId) {
            return res.status(403).json((0, utils_1.createErrorResponse)('FORBIDDEN', 'Acesso negado ao documento', { documentId }, req.headers['x-request-id']));
        }
        // Iniciar análise via AnalysisOrchestrator
        const analysisId = await orchestrator.startAnalysis({
            documentId,
            organizationId,
            userId,
            options: {
                includeAI: true,
                generateRecommendations: options?.includeRecommendations ?? true,
                detailedMetrics: options?.detailedReport ?? false,
                customRules: [],
                ...options
            },
            priority: options?.priority || 'normal'
        });
        res.status(202).json((0, utils_1.createSuccessResponse)({
            analysisId,
            status: 'queued',
            message: 'Analysis started successfully'
        }));
        return;
    }
    catch (error) {
        return (0, error_1.errorHandler)(error, req, res, () => { });
    }
});
/**
 * GET /analysis/:analysisId/progress
 * Obtém o progresso de uma análise
 */
router.get('/:analysisId/progress', auth_2.authenticateUser, auth_2.requireOrganization, (0, auth_2.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
    const pathValidation = (0, utils_1.validateData)(AnalysisIdSchema, req.params);
    if (!pathValidation.success) {
        return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos', pathValidation.details, req.headers['x-request-id']));
    }
    try {
        const { analysisId } = req.params;
        const progress = await orchestrator.getAnalysisProgress(analysisId);
        if (!progress) {
            return res.status(404).json((0, utils_1.createErrorResponse)('ANALYSIS_NOT_FOUND', 'Analysis not found'));
        }
        res.json((0, utils_1.createSuccessResponse)(progress));
        return;
    }
    catch (error) {
        return (0, error_1.errorHandler)(error, req, res, () => { });
    }
});
/**
 * DELETE /analysis/:analysisId
 * Cancela uma análise em andamento
 */
router.delete('/:analysisId', auth_2.authenticateUser, auth_2.requireOrganization, (0, auth_2.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_WRITE]), async (req, res) => {
    const pathValidation = (0, utils_1.validateData)(AnalysisIdSchema, req.params);
    if (!pathValidation.success) {
        return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos'));
    }
    try {
        const { analysisId } = req.params;
        const organizationId = req.user?.organizationId;
        const userId = req.user?.uid;
        if (!organizationId) {
            return res.status(400).json((0, utils_1.createErrorResponse)('ORGANIZATION_REQUIRED', 'Organization ID is required'));
        }
        // Verificar se a análise existe
        const activeAnalyses = orchestrator.getActiveAnalyses();
        const analysis = activeAnalyses.find(a => a.analysisId === analysisId);
        if (!analysis) {
            return res.status(404).json((0, utils_1.createErrorResponse)('ANALYSIS_NOT_FOUND', 'Analysis not found or access denied'));
        }
        await orchestrator.cancelAnalysis(analysisId, userId);
        res.json((0, utils_1.createSuccessResponse)({ message: 'Analysis cancelled successfully' }, req.headers['x-request-id']));
        return;
    }
    catch (error) {
        return (0, error_1.errorHandler)(error, req, res, () => { });
    }
});
/**
 * GET /analysis/list
 * Lista análises da organização
 */
router.get('/list', auth_2.authenticateUser, auth_2.requireOrganization, (0, auth_2.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        // Por enquanto, retornamos as análises ativas
        // TODO: Implementar filtro por organização quando a propriedade estiver disponível
        const allAnalyses = orchestrator.getActiveAnalyses();
        const filteredAnalyses = allAnalyses;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedAnalyses = filteredAnalyses.slice(startIndex, endIndex);
        const analyses = {
            data: paginatedAnalyses,
            total: filteredAnalyses.length,
            page,
            limit,
            totalPages: Math.ceil(filteredAnalyses.length / limit)
        };
        res.json((0, utils_1.createSuccessResponse)(analyses, req.headers['x-request-id']));
        return;
    }
    catch (error) {
        return (0, error_1.errorHandler)(error, req, res, () => { });
    }
});
/**
 * GET /analysis/result/:documentId
 * Obtém o resultado da análise de um documento
 */
router.get('/result/:documentId', auth_2.authenticateUser, auth_2.requireOrganization, (0, auth_2.requirePermissions)([auth_1.PERMISSIONS.ANALYSIS_READ]), async (req, res) => {
    const pathValidation = (0, utils_1.validateData)(DocumentIdSchema, req.params);
    if (!pathValidation.success) {
        return res.status(400).json((0, utils_1.createErrorResponse)('VALIDATION_ERROR', 'Parâmetros de caminho inválidos'));
    }
    try {
        const { documentId } = req.params;
        const organizationId = req.user?.organizationId;
        // Verificar se o documento pertence à organização
        const docSnapshot = await firebase_1.collections.documents.doc(documentId).get();
        if (!docSnapshot.exists) {
            return res.status(404).json((0, utils_1.createErrorResponse)('DOCUMENT_NOT_FOUND', 'Document not found'));
        }
        const document = docSnapshot.data();
        if (document?.organizationId !== organizationId) {
            return res.status(403).json((0, utils_1.createErrorResponse)('ACCESS_DENIED', 'Access denied to document'));
        }
        // Buscar resultado da análise no Firestore
        const resultQuery = await firebase_1.firestore
            .collection('analysisResults')
            .where('documentId', '==', documentId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();
        if (resultQuery.empty) {
            return res.status(404).json((0, utils_1.createErrorResponse)('RESULT_NOT_FOUND', 'Analysis result not found'));
        }
        const result = resultQuery.docs[0].data();
        res.json((0, utils_1.createSuccessResponse)(result, req.headers['x-request-id']));
        return;
    }
    catch (error) {
        return (0, error_1.errorHandler)(error, req, res, () => { });
    }
});
exports.default = router;
//# sourceMappingURL=analysis.js.map