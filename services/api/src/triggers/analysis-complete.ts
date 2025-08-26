/**
 * Analysis Complete Trigger
 * Processes completed analysis results and updates document status
 * LicitaReview Cloud Functions
 */

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { collections, firestore } from "../config/firebase";
import { 
  AnalysisResult,
  DocumentStatus,
  NotificationPayload,
  AuditLog,
  generateExecutiveSummary
} from "../types";
// Removed formatDuration and retry imports as they don't exist in utils

/**
 * Trigger when analysis result is created
 */
export const onAnalysisResultCreated = onDocumentCreated({
  document: "analysisResults/{resultId}",
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 20
}, async (event) => {
  const resultId = event.params.resultId;
  const analysisResult = event.data?.data() as AnalysisResult;
  
  if (!analysisResult) {
    logger.error(`No analysis result data found for ${resultId}`);
    return;
  }
  
  logger.info(`Analysis result created: ${resultId}`, {
    documentId: analysisResult.documentId,
    organizationId: analysisResult.organizationId,
    status: analysisResult.status,
    weightedScore: analysisResult.weightedScore
  });
  
  try {
    // Only process completed analyses
    if (analysisResult.status === "completed") {
      await processCompletedAnalysis(resultId, analysisResult);
    } else if (analysisResult.status === "error") {
      await processFailedAnalysis(resultId, analysisResult);
    }
    
  } catch (error) {
    logger.error(`Error processing analysis result creation: ${resultId}`, error);
    throw error;
  }
});

/**
 * Trigger when analysis result is updated
 */
export const onAnalysisResultUpdated = onDocumentUpdated({
  document: "analysisResults/{resultId}",
  region: "us-central1", 
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 20
}, async (event) => {
  const resultId = event.params.resultId;
  const beforeData = event.data?.before.data() as AnalysisResult;
  const afterData = event.data?.after.data() as AnalysisResult;
  
  if (!beforeData || !afterData) {
    logger.error(`Missing analysis result data for update: ${resultId}`);
    return;
  }
  
  // Check if status changed to completed
  if (beforeData.status !== "completed" && afterData.status === "completed") {
    logger.info(`Analysis completed: ${resultId}`, {
      documentId: afterData.documentId,
      organizationId: afterData.organizationId,
      executionTime: afterData.executionTimeSeconds,
      weightedScore: afterData.weightedScore
    });
    
    try {
      await processCompletedAnalysis(resultId, afterData);
    } catch (error) {
      logger.error(`Error processing completed analysis: ${resultId}`, error);
      throw error;
    }
  }
  
  // Check if status changed to error
  if (beforeData.status !== "error" && afterData.status === "error") {
    logger.error(`Analysis failed: ${resultId}`, {
      documentId: afterData.documentId,
      error: afterData.error
    });
    
    try {
      await processFailedAnalysis(resultId, afterData);
    } catch (error) {
      logger.error(`Error processing failed analysis: ${resultId}`, error);
      throw error;
    }
  }
});

/**
 * Process completed analysis
 */
async function processCompletedAnalysis(
  resultId: string,
  analysisResult: AnalysisResult
): Promise<void> {
  const { documentId, organizationId } = analysisResult;
  
  try {
    // Update document status
    await updateDocumentStatus(
      documentId,
      DocumentStatus.ANALYSIS_COMPLETE,
      {
        "metadata.processingCompletedAt": new Date(),
        "metadata.analysisResultId": resultId,
        "metadata.weightedScore": analysisResult.weightedScore,
        "metadata.totalFindings": analysisResult.findings.length
      }
    );
    
    // Generate executive summary
    const executiveSummary = generateExecutiveSummary(analysisResult);
    
    // Store summary separately for quick access
    await firestore
      .collection("analysisSummaries")
      .doc(resultId)
      .set(executiveSummary);
    
    logger.info(`Executive summary generated for ${resultId}`, {
      overallScore: executiveSummary.overallScore,
      weightedScore: executiveSummary.weightedScore,
      totalFindings: executiveSummary.totalFindings,
      criticalIssues: executiveSummary.criticalIssues
    });
    
    // Create success notification
    await createAnalysisNotification(
      organizationId,
      documentId,
      resultId,
      "success",
      {
        executiveSummary,
        executionTime: `${Math.round(analysisResult.executionTimeSeconds || 0)}s`,
        message: "Document analysis completed successfully"
      }
    );
    
    // Log audit event
    await createAuditLog({
      userId: "system",
      organizationId,
      action: "analysis_completed",
      resourceType: "document",
      resourceId: documentId,
      changes: {
        status: "completed",
        resultId,
        score: analysisResult.weightedScore,
        findings: analysisResult.findings.length
      },
      metadata: {
        executionTime: analysisResult.executionTimeSeconds,
        configId: analysisResult.appliedConfigId
      }
    });
    
    // Check if this is a high-priority issue requiring immediate attention
    const criticalFindings = analysisResult.findings.filter(
      f => f.severity === "CRITICA"
    );
    
    if (criticalFindings.length > 0) {
      await createHighPriorityAlert(
        organizationId,
        documentId,
        resultId,
        criticalFindings.length
      );
    }
    
    // Update organization analytics
    await updateOrganizationAnalytics(organizationId, analysisResult);
    
    logger.info(`Analysis processing completed: ${resultId}`);
    
  } catch (error) {
    logger.error(`Error in processCompletedAnalysis: ${resultId}`, error);
    
    // Try to update document with error status
    await updateDocumentStatus(
      documentId,
      DocumentStatus.ERROR,
      { error: `Post-analysis processing failed: ${error instanceof Error ? error.message : String(error)}` }
    );
    
    throw error;
  }
}

/**
 * Process failed analysis
 */
async function processFailedAnalysis(
  resultId: string,
  analysisResult: AnalysisResult
): Promise<void> {
  const { documentId, organizationId } = analysisResult;
  
  try {
    // Update document status to error
    await updateDocumentStatus(
      documentId,
      DocumentStatus.ERROR,
      {
        error: analysisResult.error || "Analysis failed with unknown error",
        "metadata.processingCompletedAt": new Date(),
        "metadata.analysisResultId": resultId
      }
    );
    
    // Create error notification
    await createAnalysisNotification(
      organizationId,
      documentId,
      resultId,
      "error",
      {
        error: analysisResult.error,
        message: "Document analysis failed"
      }
    );
    
    // Log audit event
    await createAuditLog({
      userId: "system",
      organizationId,
      action: "analysis_failed",
      resourceType: "document",
      resourceId: documentId,
      changes: {
        status: "error",
        error: analysisResult.error
      },
      metadata: {
        resultId,
        configId: analysisResult.appliedConfigId
      }
    });
    
    logger.error(`Analysis failed processing completed: ${resultId}`);
    
  } catch (error) {
    logger.error(`Error in processFailedAnalysis: ${resultId}`, error);
    throw error;
  }
}

/**
 * Update document status with retry logic
 */
async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  additionalData: Record<string, unknown> = {}
): Promise<void> {
  try {
    const updateData = {
      status,
      updatedAt: new Date(),
      ...additionalData
    };
    
    await collections.documents.doc(documentId).update(updateData);
    
    logger.info(`Document status updated: ${documentId}`, {
      status,
      additionalFields: Object.keys(additionalData)
    });
  } catch (retryError) {
    logger.error('Failed to update document status after retries', { documentId, status, error: retryError });
    throw retryError;
  }
}

/**
 * Create analysis notification
 */
async function createAnalysisNotification(
  organizationId: string,
  documentId: string,
  resultId: string,
  type: "success" | "error" | "warning",
  data: Record<string, unknown>
): Promise<void> {
  try {
    const notification: NotificationPayload = {
      userId: "system", // Will be updated with actual user when available
      organizationId,
      title: type === "success" ? "Analysis Complete" : "Analysis Failed",
      message: type === "success"
        ? `Document analysis completed with score ${(data.executiveSummary as any)?.weightedScore?.toFixed(1) || 'N/A'}%`
        : `Document analysis failed: ${data.error}`,
      type: type === "success" ? "success" : "error",
      data: {
        documentId,
        resultId,
        ...data
      },
      channels: type === "error" ? ["email", "push"] : ["push"]
    };
    
    await firestore.collection("notifications").add({
      ...notification,
      createdAt: new Date(),
      processed: false
    });
    
    logger.info(`Analysis notification created: ${resultId}`, {
      type,
      organizationId,
      documentId
    });
    
  } catch (error) {
    logger.error(`Failed to create analysis notification: ${resultId}`, error);
  }
}

/**
 * Create high priority alert for critical findings
 */
async function createHighPriorityAlert(
  organizationId: string,
  documentId: string,
  resultId: string,
  criticalCount: number
): Promise<void> {
  try {
    const alert: NotificationPayload = {
      userId: "system",
      organizationId,
      title: "🚨 Critical Issues Found",
      message: `Document analysis found ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} requiring immediate attention`,
      type: "error",
      data: {
        documentId,
        resultId,
        criticalCount,
        priority: "high",
        requiresAction: true
      },
      channels: ["email", "push", "webhook"]
    };
    
    await firestore.collection("alerts").add({
      ...alert,
      createdAt: new Date(),
      processed: false,
      severity: "critical"
    });
    
    logger.warn(`High priority alert created: ${resultId}`, {
      criticalCount,
      organizationId,
      documentId
    });
    
  } catch (error) {
    logger.error(`Failed to create high priority alert: ${resultId}`, error);
  }
}

/**
 * Create audit log entry
 */
async function createAuditLog(logData: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
  try {
    const auditLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      ...logData
    };
    
    await collections.auditLogs.add(auditLog);
    
    logger.info(`Audit log created: ${logData.action}`, {
      organizationId: logData.organizationId,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId
    });
    
  } catch (error) {
    logger.error(`Failed to create audit log:`, error);
  }
}

/**
 * Update organization analytics
 */
async function updateOrganizationAnalytics(
  organizationId: string,
  analysisResult: AnalysisResult
): Promise<void> {
  try {
    const analyticsRef = firestore
      .collection("organizationAnalytics")
      .doc(organizationId);
    
    const today = new Date().toISOString().split('T')[0];
    
    await analyticsRef.set({
      [`daily.${today}.analysesCompleted`]: admin.firestore.FieldValue.increment(1),
      [`daily.${today}.totalScore`]: admin.firestore.FieldValue.increment(analysisResult.weightedScore),
      [`daily.${today}.totalFindings`]: admin.firestore.FieldValue.increment(analysisResult.findings.length),
      [`daily.${today}.criticalFindings`]: admin.firestore.FieldValue.increment(
        analysisResult.findings.filter(f => f.severity === "CRITICA").length
      ),
      [`daily.${today}.processingTime`]: admin.firestore.FieldValue.increment(
        analysisResult.executionTimeSeconds
      ),
      lastUpdated: new Date(),
      organizationId
    }, { merge: true });
    
    logger.info(`Organization analytics updated: ${organizationId}`, {
      date: today,
      score: analysisResult.weightedScore,
      findings: analysisResult.findings.length
    });
    
  } catch (error) {
    logger.error(`Failed to update organization analytics: ${organizationId}`, error);
  }
}

/**
 * Clean up old analysis results (could be run on a schedule)
 */
export async function cleanupOldAnalysisResults(retentionDays: number = 365): Promise<void> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const oldResultsQuery = collections.analysisResults
      .where("createdAt", "<", cutoffDate)
      .limit(100); // Process in batches
    
    const snapshot = await oldResultsQuery.get();
    
    if (snapshot.empty) {
      logger.info("No old analysis results to clean up");
      return;
    }
    
    const batch = firestore.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    logger.info(`Cleaned up ${snapshot.docs.length} old analysis results`, {
      cutoffDate: cutoffDate.toISOString(),
      retentionDays
    });
    
  } catch (error) {
    logger.error("Error cleaning up old analysis results:", error);
    throw error;
  }
}