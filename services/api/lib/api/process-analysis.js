"use strict";
/**
 * Cloud Function para processar tarefas de análise da fila
 * Chamada pelo TaskQueueService via Cloud Tasks
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
exports.processAnalysis = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const logger = functions.logger;
const AnalysisOrchestrator_1 = require("../services/AnalysisOrchestrator");
const config_1 = require("../config");
/**
 * Processa uma tarefa de análise da fila
 */
exports.processAnalysis = functions
    .region("us-central1")
    .runWith({
    memory: "1GB",
    timeoutSeconds: 540 // 9 minutos
})
    .https.onRequest(async (req, res) => {
    try {
        // Validar método HTTP
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }
        // Decodificar payload da tarefa
        let taskPayload;
        try {
            // O Cloud Tasks envia o body em base64
            const bodyStr = Buffer.from(req.body, 'base64').toString('utf-8');
            taskPayload = JSON.parse(bodyStr);
        }
        catch (parseError) {
            // Fallback para JSON direto (para testes)
            taskPayload = req.body;
        }
        const { analysisId, documentId, organizationId } = taskPayload;
        logger.info(`Processing analysis task`, {
            analysisId,
            documentId,
            organizationId,
            retryCount: taskPayload.retryCount || 0
        });
        // Buscar a requisição de análise no Firestore
        const analysisDoc = await config_1.firestore
            .collection('processing_queue')
            .where('payload.analysisId', '==', analysisId)
            .limit(1)
            .get();
        if (analysisDoc.empty) {
            logger.error(`Analysis request not found in queue: ${analysisId}`);
            res.status(404).json({ error: 'Analysis request not found' });
            return;
        }
        const queueData = analysisDoc.docs[0].data();
        const queuePayload = queueData.payload;
        // Construir AnalysisRequest com a estrutura correta
        const analysisRequest = {
            documentId: queuePayload.analysisRequest.documentId,
            organizationId: queuePayload.analysisRequest.organizationId,
            userId: queuePayload.analysisRequest.requestedBy || 'system',
            options: {
                includeAI: queuePayload.analysisRequest.options?.includeAIAnalysis || false,
                generateRecommendations: queuePayload.analysisRequest.options?.generateRecommendations || true,
                detailedMetrics: queuePayload.analysisRequest.options?.extractKeyMetrics || false,
                customRules: queuePayload.analysisRequest.options?.runCustomRules ? [] : undefined
            },
            priority: queuePayload.analysisRequest.priority || 'normal'
        };
        // Inicializar o AnalysisOrchestrator
        const orchestrator = new AnalysisOrchestrator_1.AnalysisOrchestrator(config_1.firestore, process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url', process.env.GOOGLE_CLOUD_PROJECT || 'licitareview');
        // Processar a análise
        await orchestrator.processAnalysis(analysisId, analysisRequest);
        // Remover tarefa da fila após processamento bem-sucedido
        await analysisDoc.docs[0].ref.delete();
        logger.info(`Analysis task completed successfully: ${analysisId}`);
        res.status(200).json({
            success: true,
            analysisId,
            message: 'Analysis processed successfully'
        });
    }
    catch (error) {
        logger.error('Error processing analysis task', error);
        // Para erros recuperáveis, retornar 500 para retry
        // Para erros não recuperáveis, retornar 400
        const isRetryable = !(error instanceof Error &&
            (error.message.includes('not found') ||
                error.message.includes('invalid') ||
                error.message.includes('unauthorized')));
        const statusCode = isRetryable ? 500 : 400;
        res.status(statusCode).json({
            error: 'Failed to process analysis',
            message: error instanceof Error ? error.message : String(error),
            retryable: isRetryable
        });
    }
});
//# sourceMappingURL=process-analysis.js.map