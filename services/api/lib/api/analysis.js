"use strict";
/**
 * API de análise de documentos
 * Sprint 1 - LicitaReview
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const firestore_1 = require("firebase-admin/firestore");
const validation_1 = require("../utils/validation");
const utils_1 = require("../utils");
const AnalysisOrchestrator_1 = require("../services/AnalysisOrchestrator");
const auth_1 = require("../middleware/auth");
const error_1 = require("../middleware/error");
const router = (0, express_1.Router)();
const firestore = (0, firestore_1.getFirestore)();
// Inicializar AnalysisOrchestrator
const orchestrator = new AnalysisOrchestrator_1.AnalysisOrchestrator(firestore, process.env.CLOUD_RUN_SERVICE_URL || 'https://document-analyzer-123456789-uc.a.run.app', process.env.GOOGLE_CLOUD_PROJECT || 'analisador-de-editais');
/**
 * POST /analysis
 * Criar nova análise de documento
 */
router.post('/', auth_1.authenticateUser, (0, validation_1.validateBody)(validation_1.AnalysisRequestSchema), async (req, res) => {
    var _a, _b;
    const requestId = (0, utils_1.getRequestId)(req);
    try {
        const { documentId, options } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
        if (!userId) {
            (0, utils_1.sendErrorResponse)(res, 'UNAUTHORIZED', 'Usuário não autenticado', 401, undefined, requestId);
            return;
        }
        if (!organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'MISSING_ORGANIZATION', 'Organização não encontrada', 400, undefined, requestId);
            return;
        }
        // Verificar se o documento existe e pertence à organização
        const docRef = firestore.collection('documents').doc(documentId);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            (0, utils_1.sendErrorResponse)(res, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado', 404, undefined, requestId);
            return;
        }
        const docData = docSnap.data();
        if ((docData === null || docData === void 0 ? void 0 : docData.organizationId) !== organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'FORBIDDEN', 'Acesso negado ao documento', 403, undefined, requestId);
            return;
        }
        // Iniciar análise
        const analysisRequest = {
            documentId,
            organizationId,
            userId,
            options: options || {},
            priority: 'normal'
        };
        const analysisId = await orchestrator.startAnalysis(analysisRequest);
        // Salvar registro da análise no Firestore
        await firestore.collection('analyses').doc(analysisId).set({
            id: analysisId,
            documentId,
            organizationId,
            userId,
            status: 'pending',
            options,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        (0, utils_1.sendSuccessResponse)(res, {
            analysisId,
            status: 'pending',
            message: 'Análise iniciada com sucesso'
        }, 201, requestId);
    }
    catch (error) {
        console.error('Erro ao criar análise:', error);
        (0, utils_1.sendErrorResponse)(res, 'INTERNAL_ERROR', 'Erro interno do servidor', 500, undefined, requestId);
    }
});
/**
 * GET /analysis/:analysisId
 * Obter resultado de análise específica
 */
router.get('/:analysisId', auth_1.authenticateUser, (0, validation_1.validatePathParams)(zod_1.z.object({ analysisId: validation_1.AnalysisIdSchema })), async (req, res) => {
    var _a, _b;
    const requestId = (0, utils_1.getRequestId)(req);
    const { analysisId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
    const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
    try {
        if (!userId || !organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'UNAUTHORIZED', 'Usuário não autenticado', 401, undefined, requestId);
            return;
        }
        // Buscar análise no Firestore
        const analysisRef = firestore.collection('analyses').doc(analysisId);
        const analysisSnap = await analysisRef.get();
        if (!analysisSnap.exists) {
            (0, utils_1.sendErrorResponse)(res, 'ANALYSIS_NOT_FOUND', 'Análise não encontrada', 404, undefined, requestId);
            return;
        }
        const analysisData = analysisSnap.data();
        // Verificar permissões
        if ((analysisData === null || analysisData === void 0 ? void 0 : analysisData.organizationId) !== organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'FORBIDDEN', 'Acesso negado à análise', 403, undefined, requestId);
            return;
        }
        // Obter progresso do orchestrator
        const progress = await orchestrator.getAnalysisProgress(analysisId);
        (0, utils_1.sendSuccessResponse)(res, Object.assign(Object.assign({}, analysisData), { progress }), 200, requestId);
    }
    catch (error) {
        console.error('Erro ao obter análise:', error);
        (0, utils_1.sendErrorResponse)(res, 'INTERNAL_ERROR', 'Erro interno do servidor', 500, undefined, requestId);
    }
});
/**
 * GET /analysis
 * Listar análises do usuário/organização
 */
router.get('/', auth_1.authenticateUser, (0, validation_1.validateQuery)(validation_1.PaginationSchema.extend({
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
    documentId: validation_1.DocumentIdSchema.optional()
})), async (req, res) => {
    var _a, _b;
    const requestId = (0, utils_1.getRequestId)(req);
    const { page = 1, limit = 20, status, documentId } = req.query;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
    const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
    try {
        if (!userId || !organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'UNAUTHORIZED', 'Usuário não autenticado', 401, undefined, requestId);
            return;
        }
        // Construir query
        let query = firestore
            .collection('analyses')
            .where('organizationId', '==', organizationId)
            .orderBy('createdAt', 'desc');
        if (status) {
            query = query.where('status', '==', status);
        }
        if (documentId) {
            query = query.where('documentId', '==', documentId);
        }
        // Paginação
        const offset = (page - 1) * limit;
        const snapshot = await query.offset(offset).limit(limit).get();
        const analyses = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Contar total
        const countSnapshot = await query.get();
        const total = countSnapshot.size;
        (0, utils_1.sendSuccessResponse)(res, {
            analyses,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 200, requestId);
    }
    catch (error) {
        console.error('Erro ao listar análises:', error);
        (0, utils_1.sendErrorResponse)(res, 'INTERNAL_ERROR', 'Erro interno do servidor', 500, undefined, requestId);
    }
});
/**
 * DELETE /analysis/:analysisId
 * Cancelar análise em andamento
 */
router.delete('/:analysisId', auth_1.authenticateUser, (0, validation_1.validatePathParams)(zod_1.z.object({ analysisId: validation_1.AnalysisIdSchema })), async (req, res) => {
    var _a, _b;
    const requestId = (0, utils_1.getRequestId)(req);
    const { analysisId } = req.params;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
    const organizationId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.organizationId;
    try {
        if (!userId || !organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'UNAUTHORIZED', 'Usuário não autenticado', 401, undefined, requestId);
            return;
        }
        // Verificar se a análise existe e pertence à organização
        const analysisRef = firestore.collection('analyses').doc(analysisId);
        const analysisSnap = await analysisRef.get();
        if (!analysisSnap.exists) {
            (0, utils_1.sendErrorResponse)(res, 'ANALYSIS_NOT_FOUND', 'Análise não encontrada', 404, undefined, requestId);
            return;
        }
        const analysisData = analysisSnap.data();
        if ((analysisData === null || analysisData === void 0 ? void 0 : analysisData.organizationId) !== organizationId) {
            (0, utils_1.sendErrorResponse)(res, 'FORBIDDEN', 'Acesso negado à análise', 403, undefined, requestId);
            return;
        }
        // Cancelar análise no orchestrator
        await orchestrator.cancelAnalysis(analysisId);
        // Atualizar status no Firestore
        await analysisRef.update({
            status: 'cancelled',
            updatedAt: new Date()
        });
        (0, utils_1.sendSuccessResponse)(res, {
            message: 'Análise cancelada com sucesso'
        }, 200, requestId);
    }
    catch (error) {
        console.error('Erro ao cancelar análise:', error);
        (0, utils_1.sendErrorResponse)(res, 'INTERNAL_ERROR', 'Erro interno do servidor', 500, undefined, requestId);
    }
});
// Middleware de tratamento de erros
router.use(error_1.errorHandler);
exports.default = router;
//# sourceMappingURL=analysis.js.map