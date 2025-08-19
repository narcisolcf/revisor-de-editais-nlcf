"use strict";
/**
 * Analysis Complete Trigger
 * Processes completed analysis results and updates document status
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onAnalysisResultUpdated = exports.onAnalysisResultCreated = void 0;
exports.cleanupOldAnalysisResults = cleanupOldAnalysisResults;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const utils_1 = require("../utils");
/**
 * Trigger when analysis result is created
 */
exports.onAnalysisResultCreated = (0, firestore_1.onDocumentCreated)({
    document: "analysisResults/{resultId}",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 20
}, async (event) => {
    var _a;
    const resultId = event.params.resultId;
    const analysisResult = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!analysisResult) {
        firebase_functions_1.logger.error(`No analysis result data found for ${resultId}`);
        return;
    }
    firebase_functions_1.logger.info(`Analysis result created: ${resultId}`, {
        documentId: analysisResult.documentId,
        organizationId: analysisResult.organizationId,
        status: analysisResult.status,
        weightedScore: analysisResult.weightedScore
    });
    try {
        // Only process completed analyses
        if (analysisResult.status === "completed") {
            await processCompletedAnalysis(resultId, analysisResult);
        }
        else if (analysisResult.status === "error") {
            await processFailedAnalysis(resultId, analysisResult);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing analysis result creation: ${resultId}`, error);
        throw error;
    }
});
/**
 * Trigger when analysis result is updated
 */
exports.onAnalysisResultUpdated = (0, firestore_1.onDocumentUpdated)({
    document: "analysisResults/{resultId}",
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 20
}, async (event) => {
    var _a, _b;
    const resultId = event.params.resultId;
    const beforeData = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const afterData = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!beforeData || !afterData) {
        firebase_functions_1.logger.error(`Missing analysis result data for update: ${resultId}`);
        return;
    }
    // Check if status changed to completed
    if (beforeData.status !== "completed" && afterData.status === "completed") {
        firebase_functions_1.logger.info(`Analysis completed: ${resultId}`, {
            documentId: afterData.documentId,
            organizationId: afterData.organizationId,
            executionTime: afterData.executionTimeSeconds,
            weightedScore: afterData.weightedScore
        });
        try {
            await processCompletedAnalysis(resultId, afterData);
        }
        catch (error) {
            firebase_functions_1.logger.error(`Error processing completed analysis: ${resultId}`, error);
            throw error;
        }
    }
    // Check if status changed to error
    if (beforeData.status !== "error" && afterData.status === "error") {
        firebase_functions_1.logger.error(`Analysis failed: ${resultId}`, {
            documentId: afterData.documentId,
            error: afterData.error
        });
        try {
            await processFailedAnalysis(resultId, afterData);
        }
        catch (error) {
            firebase_functions_1.logger.error(`Error processing failed analysis: ${resultId}`, error);
            throw error;
        }
    }
});
/**
 * Process completed analysis
 */
async function processCompletedAnalysis(resultId, analysisResult) {
    const { documentId, organizationId } = analysisResult;
    try {
        // Update document status
        await updateDocumentStatus(documentId, types_1.DocumentStatus.ANALYSIS_COMPLETE, {
            "metadata.processingCompletedAt": new Date(),
            "metadata.analysisResultId": resultId,
            "metadata.weightedScore": analysisResult.weightedScore,
            "metadata.totalFindings": analysisResult.findings.length
        });
        // Generate executive summary
        const executiveSummary = (0, types_1.generateExecutiveSummary)(analysisResult);
        // Store summary separately for quick access
        await firebase_1.collections.firestore
            .collection("analysisSummaries")
            .doc(resultId)
            .set(executiveSummary);
        firebase_functions_1.logger.info(`Executive summary generated for ${resultId}`, {
            overallScore: executiveSummary.overallScore,
            weightedScore: executiveSummary.weightedScore,
            totalFindings: executiveSummary.totalFindings,
            criticalIssues: executiveSummary.criticalIssues
        });
        // Create success notification
        await createAnalysisNotification(organizationId, documentId, resultId, "success", {
            executiveSummary,
            executionTime: (0, utils_1.formatDuration)(analysisResult.executionTimeSeconds),
            message: "Document analysis completed successfully"
        });
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
        const criticalFindings = analysisResult.findings.filter(f => f.severity === "CRITICA");
        if (criticalFindings.length > 0) {
            await createHighPriorityAlert(organizationId, documentId, resultId, criticalFindings.length);
        }
        // Update organization analytics
        await updateOrganizationAnalytics(organizationId, analysisResult);
        firebase_functions_1.logger.info(`Analysis processing completed: ${resultId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error in processCompletedAnalysis: ${resultId}`, error);
        // Try to update document with error status
        await updateDocumentStatus(documentId, types_1.DocumentStatus.ERROR, { error: `Post-analysis processing failed: ${error.message}` });
        throw error;
    }
}
/**
 * Process failed analysis
 */
async function processFailedAnalysis(resultId, analysisResult) {
    const { documentId, organizationId } = analysisResult;
    try {
        // Update document status to error
        await updateDocumentStatus(documentId, types_1.DocumentStatus.ERROR, {
            error: analysisResult.error || "Analysis failed with unknown error",
            "metadata.processingCompletedAt": new Date(),
            "metadata.analysisResultId": resultId
        });
        // Create error notification
        await createAnalysisNotification(organizationId, documentId, resultId, "error", {
            error: analysisResult.error,
            message: "Document analysis failed"
        });
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
        firebase_functions_1.logger.error(`Analysis failed processing completed: ${resultId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error in processFailedAnalysis: ${resultId}`, error);
        throw error;
    }
}
/**
 * Update document status with retry logic
 */
async function updateDocumentStatus(documentId, status, additionalData = {}) {
    await (0, utils_1.retry)(async () => {
        const updateData = Object.assign({ status, updatedAt: new Date() }, additionalData);
        await firebase_1.collections.documents.doc(documentId).update(updateData);
        firebase_functions_1.logger.info(`Document status updated: ${documentId}`, {
            status,
            additionalFields: Object.keys(additionalData)
        });
    }, 3, 1000);
}
/**
 * Create analysis notification
 */
async function createAnalysisNotification(organizationId, documentId, resultId, type, data) {
    var _a, _b;
    try {
        const notification = {
            userId: "system", // Will be updated with actual user when available
            organizationId,
            title: type === "success" ? "Analysis Complete" : "Analysis Failed",
            message: type === "success"
                ? `Document analysis completed with score ${(_b = (_a = data.executiveSummary) === null || _a === void 0 ? void 0 : _a.weightedScore) === null || _b === void 0 ? void 0 : _b.toFixed(1)}%`
                : `Document analysis failed: ${data.error}`,
            type: type === "success" ? "success" : "error",
            data: Object.assign({ documentId,
                resultId }, data),
            channels: type === "error" ? ["email", "push"] : ["push"]
        };
        await firebase_1.collections.firestore.collection("notifications").add(Object.assign(Object.assign({}, notification), { createdAt: new Date(), processed: false }));
        firebase_functions_1.logger.info(`Analysis notification created: ${resultId}`, {
            type,
            organizationId,
            documentId
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to create analysis notification: ${resultId}`, error);
    }
}
/**
 * Create high priority alert for critical findings
 */
async function createHighPriorityAlert(organizationId, documentId, resultId, criticalCount) {
    try {
        const alert = {
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
        await firebase_1.collections.firestore.collection("alerts").add(Object.assign(Object.assign({}, alert), { createdAt: new Date(), processed: false, severity: "critical" }));
        firebase_functions_1.logger.warn(`High priority alert created: ${resultId}`, {
            criticalCount,
            organizationId,
            documentId
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to create high priority alert: ${resultId}`, error);
    }
}
/**
 * Create audit log entry
 */
async function createAuditLog(logData) {
    try {
        const auditLog = Object.assign({ id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`, timestamp: new Date() }, logData);
        await firebase_1.collections.auditLogs.add(auditLog);
        firebase_functions_1.logger.info(`Audit log created: ${logData.action}`, {
            organizationId: logData.organizationId,
            resourceType: logData.resourceType,
            resourceId: logData.resourceId
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to create audit log:`, error);
    }
}
/**
 * Update organization analytics
 */
async function updateOrganizationAnalytics(organizationId, analysisResult) {
    try {
        const analyticsRef = firebase_1.collections.firestore
            .collection("organizationAnalytics")
            .doc(organizationId);
        const today = new Date().toISOString().split('T')[0];
        await analyticsRef.set({
            [`daily.${today}.analysesCompleted`]: firebase_1.collections.firestore.FieldValue.increment(1),
            [`daily.${today}.totalScore`]: firebase_1.collections.firestore.FieldValue.increment(analysisResult.weightedScore),
            [`daily.${today}.totalFindings`]: firebase_1.collections.firestore.FieldValue.increment(analysisResult.findings.length),
            [`daily.${today}.criticalFindings`]: firebase_1.collections.firestore.FieldValue.increment(analysisResult.findings.filter(f => f.severity === "CRITICA").length),
            [`daily.${today}.processingTime`]: firebase_1.collections.firestore.FieldValue.increment(analysisResult.executionTimeSeconds),
            lastUpdated: new Date(),
            organizationId
        }, { merge: true });
        firebase_functions_1.logger.info(`Organization analytics updated: ${organizationId}`, {
            date: today,
            score: analysisResult.weightedScore,
            findings: analysisResult.findings.length
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to update organization analytics: ${organizationId}`, error);
    }
}
/**
 * Clean up old analysis results (could be run on a schedule)
 */
async function cleanupOldAnalysisResults(retentionDays = 365) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        const oldResultsQuery = firebase_1.collections.analysisResults
            .where("createdAt", "<", cutoffDate)
            .limit(100); // Process in batches
        const snapshot = await oldResultsQuery.get();
        if (snapshot.empty) {
            firebase_functions_1.logger.info("No old analysis results to clean up");
            return;
        }
        const batch = firebase_1.collections.firestore.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        firebase_functions_1.logger.info(`Cleaned up ${snapshot.docs.length} old analysis results`, {
            cutoffDate: cutoffDate.toISOString(),
            retentionDays
        });
    }
    catch (error) {
        firebase_functions_1.logger.error("Error cleaning up old analysis results:", error);
        throw error;
    }
}
//# sourceMappingURL=analysis-complete.js.map