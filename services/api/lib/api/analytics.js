"use strict";
/**
 * Analytics API
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsReporter = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const zod_1 = require("zod");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = (0, utils_1.generateRequestId)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
app.use(auth_1.authenticateUser);
app.use(auth_1.requireOrganization);
/**
 * GET /analytics/usage
 * Get usage metrics for organization
 */
app.get("/usage", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(zod_1.z.object({
            period: zod_1.z.enum(["day", "week", "month", "year"]).default("month"),
            startDate: zod_1.z.coerce.date().optional(),
            endDate: zod_1.z.coerce.date().optional()
        }), req.query);
        if (!queryValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
            return;
        }
        const query = queryValidation.data;
        const organizationId = req.user.organizationId;
        // Calculate date range
        const endDate = query.endDate || new Date();
        const startDate = query.startDate || getStartDateForPeriod(query?.period || 'daily', endDate);
        // Query analytics data
        const analyticsSnapshot = await firebase_1.firestore
            .collection("organizationAnalytics")
            .doc(organizationId)
            .get();
        if (!analyticsSnapshot.exists) {
            res.json((0, utils_1.createSuccessResponse)({
                organizationId,
                period: query.period,
                startDate,
                endDate,
                metrics: getEmptyMetrics()
            }, req.requestId));
            return;
        }
        const analyticsData = analyticsSnapshot.data();
        const metrics = aggregateMetricsForPeriod(analyticsData?.daily || {}, startDate, endDate, query?.period || 'daily');
        res.json((0, utils_1.createSuccessResponse)({
            organizationId,
            period: query.period,
            startDate,
            endDate,
            metrics
        }, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error getting usage analytics:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get usage analytics", undefined, req.requestId));
    }
});
/**
 * GET /analytics/documents
 * Get document-related analytics
 */
app.get("/documents", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(zod_1.z.object({
            days: zod_1.z.coerce.number().min(1).max(365).default(30)
        }), req.query);
        if (!queryValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
            return;
        }
        const query = queryValidation.data;
        const organizationId = req.user.organizationId;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (query?.days || 7));
        // Get document statistics
        const documentsQuery = firebase_1.collections.documents
            .where("organizationId", "==", organizationId)
            .where("createdAt", ">=", startDate);
        const documentsSnapshot = await documentsQuery.get();
        const documentStats = {
            total: documentsSnapshot.size,
            byStatus: {},
            byType: {},
            byDay: {}
        };
        documentsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const status = data.status || "unknown";
            const type = data.classification?.documentType || "unknown";
            const day = data.createdAt.toDate().toISOString().split('T')[0];
            documentStats.byStatus[status] = (documentStats.byStatus[status] || 0) + 1;
            documentStats.byType[type] = (documentStats.byType[type] || 0) + 1;
            documentStats.byDay[day] = (documentStats.byDay[day] || 0) + 1;
        });
        res.json((0, utils_1.createSuccessResponse)({
            organizationId,
            period: `${query?.days || 7} days`,
            documentStats
        }));
        return;
    }
    catch (error) {
        console.error("Error getting document analytics:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get document analytics", undefined, req.requestId));
    }
});
/**
 * GET /analytics/analysis
 * Get analysis-related analytics
 */
app.get("/analysis", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(zod_1.z.object({
            days: zod_1.z.coerce.number().min(1).max(365).default(30)
        }), req.query);
        if (!queryValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
            return;
        }
        const query = queryValidation.data;
        const organizationId = req.user.organizationId;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (query?.days || 30));
        // Get analysis results statistics
        const analysisQuery = firebase_1.collections.analysisResults
            .where("organizationId", "==", organizationId)
            .where("createdAt", ">=", startDate);
        const analysisSnapshot = await analysisQuery.get();
        const analysisStats = {
            total: analysisSnapshot.size,
            byStatus: {},
            scoreDistribution: {
                excellent: 0, // 90-100
                good: 0, // 70-89
                fair: 0, // 50-69
                poor: 0 // 0-49
            },
            averageScore: 0,
            averageProcessingTime: 0,
            findingsBreakdown: {
                critical: 0,
                high: 0,
                medium: 0,
                low: 0
            }
        };
        let totalScore = 0;
        let totalProcessingTime = 0;
        let completedAnalyses = 0;
        analysisSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const status = data.status || "unknown";
            analysisStats.byStatus[status] = (analysisStats.byStatus[status] || 0) + 1;
            if (status === "completed" && data.weightedScore !== undefined) {
                completedAnalyses++;
                totalScore += data.weightedScore;
                totalProcessingTime += data.executionTimeSeconds || 0;
                // Score distribution
                if (data.weightedScore >= 90) {
                    analysisStats.scoreDistribution.excellent++;
                }
                else if (data.weightedScore >= 70) {
                    analysisStats.scoreDistribution.good++;
                }
                else if (data.weightedScore >= 50) {
                    analysisStats.scoreDistribution.fair++;
                }
                else {
                    analysisStats.scoreDistribution.poor++;
                }
                // Findings breakdown
                if (data.findings) {
                    data.findings.forEach((finding) => {
                        const severity = finding.severity?.toLowerCase() || "unknown";
                        if (severity === "critica") {
                            analysisStats.findingsBreakdown.critical++;
                        }
                        else if (severity === "alta") {
                            analysisStats.findingsBreakdown.high++;
                        }
                        else if (severity === "media") {
                            analysisStats.findingsBreakdown.medium++;
                        }
                        else if (severity === "baixa") {
                            analysisStats.findingsBreakdown.low++;
                        }
                    });
                }
            }
        });
        if (completedAnalyses > 0) {
            analysisStats.averageScore = totalScore / completedAnalyses;
            analysisStats.averageProcessingTime = totalProcessingTime / completedAnalyses;
        }
        res.json((0, utils_1.createSuccessResponse)({
            organizationId,
            period: `${query?.days || 30} days`,
            analysisStats
        }));
        return;
    }
    catch (error) {
        console.error("Error getting analysis analytics:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get analysis analytics", undefined, req.requestId));
    }
});
/**
 * GET /analytics/performance
 * Get performance metrics
 */
app.get("/performance", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(zod_1.z.object({
            hours: zod_1.z.coerce.number().min(1).max(168).default(24) // Max 1 week
        }), req.query);
        if (!queryValidation.success) {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
            return;
        }
        const query = queryValidation.data;
        const startDate = new Date();
        startDate.setHours(startDate.getHours() - (query?.hours || 24));
        // Get performance metrics from logs or metrics collection
        const metricsSnapshot = await firebase_1.firestore
            .collection("performanceMetrics")
            .where("timestamp", ">=", startDate)
            .orderBy("timestamp", "desc")
            .limit(1000)
            .get();
        const metrics = metricsSnapshot.docs.map(doc => doc.data());
        // Aggregate metrics by function
        const functionMetrics = metrics.reduce((acc, metric) => {
            const functionName = metric.functionName;
            if (!acc[functionName]) {
                acc[functionName] = {
                    totalCalls: 0,
                    totalExecutionTime: 0,
                    totalMemoryUsed: 0,
                    successCount: 0,
                    errorCount: 0,
                    averageExecutionTime: 0,
                    averageMemoryUsed: 0,
                    successRate: 0,
                    errors: []
                };
            }
            acc[functionName].totalCalls++;
            acc[functionName].totalExecutionTime += metric.executionTime;
            acc[functionName].totalMemoryUsed += metric.memoryUsed;
            if (metric.success) {
                acc[functionName].successCount++;
            }
            else {
                acc[functionName].errorCount++;
                if (metric.error && !acc[functionName].errors.includes(metric.error)) {
                    acc[functionName].errors.push(metric.error);
                }
            }
            return acc;
        }, {});
        // Calculate averages and rates
        Object.values(functionMetrics).forEach((funcMetric) => {
            funcMetric.averageExecutionTime = funcMetric.totalExecutionTime / funcMetric.totalCalls;
            funcMetric.averageMemoryUsed = funcMetric.totalMemoryUsed / funcMetric.totalCalls;
            funcMetric.successRate = (funcMetric.successCount / funcMetric.totalCalls) * 100;
        });
        res.json((0, utils_1.createSuccessResponse)({
            period: `${query?.hours || 24} hours`,
            totalMetrics: metrics.length,
            functionMetrics
        }));
        return;
    }
    catch (error) {
        console.error("Error getting performance analytics:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get performance analytics", undefined, req.requestId));
    }
});
// Helper functions
function getStartDateForPeriod(period, endDate) {
    const start = new Date(endDate);
    switch (period) {
        case "day":
            start.setDate(start.getDate() - 1);
            break;
        case "week":
            start.setDate(start.getDate() - 7);
            break;
        case "month":
            start.setMonth(start.getMonth() - 1);
            break;
        case "year":
            start.setFullYear(start.getFullYear() - 1);
            break;
    }
    return start;
}
function getEmptyMetrics() {
    return {
        organizationId: "",
        period: "",
        documentsProcessed: 0,
        analysesCompleted: 0,
        storageUsed: 0,
        apiCalls: 0,
        errorRate: 0,
        averageProcessingTime: 0,
        activeUsers: 0
    };
}
function aggregateMetricsForPeriod(dailyData, startDate, endDate, period) {
    const metrics = getEmptyMetrics();
    // Iterate through date range and aggregate data
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const dayData = dailyData[dateKey];
        if (dayData) {
            metrics.documentsProcessed += dayData.documentsProcessed || 0;
            metrics.analysesCompleted += dayData.analysesCompleted || 0;
            metrics.storageUsed += dayData.storageUsed || 0;
            metrics.apiCalls += dayData.apiCalls || 0;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return metrics;
}
// Export Cloud Function
exports.analyticsReporter = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 10,
    cors: true
}, app);
//# sourceMappingURL=analytics.js.map