/**
 * Cloud Function para processar tarefas de análise da fila
 * Chamada pelo TaskQueueService via Cloud Tasks
 */

import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { AnalysisOrchestrator } from "../services/AnalysisOrchestrator";
import { firestore } from "../config";
import { TaskPayload } from "../services/TaskQueueService";


/**
 * Processa uma tarefa de análise da fila
 */
export const processAnalysis = onRequest({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 540, // 9 minutos
  maxInstances: 10
}, async (req, res) => {
  try {
    // Validar método HTTP
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Decodificar payload da tarefa
    let taskPayload: TaskPayload;
    try {
      // O Cloud Tasks envia o body em base64
      const bodyStr = Buffer.from(req.body, 'base64').toString('utf-8');
      taskPayload = JSON.parse(bodyStr);
    } catch (parseError) {
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
    const analysisDoc = await firestore
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
    const orchestrator = new AnalysisOrchestrator(
      firestore,
      process.env.CLOUD_RUN_SERVICE_URL || 'https://analysis-service-url',
      process.env.GOOGLE_CLOUD_PROJECT || 'licitareview'
    );

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

  } catch (error) {
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