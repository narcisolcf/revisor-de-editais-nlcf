/**
 * Analytics API
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import { collections, firestore } from "../config/firebase";
import { 
  authenticateUser,
  requireOrganization,
  requirePermissions,
  PERMISSIONS
} from "../middleware/auth";
import {
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
  validateData
} from "../utils";
import { UsageMetrics, PerformanceMetrics } from "../types";
import { z } from "zod";


// Analytics-specific interfaces
interface FunctionMetrics {
  totalCalls: number;
  totalExecutionTime: number;
  totalMemoryUsed: number;
  successCount: number;
  errorCount: number;
  averageExecutionTime: number;
  averageMemoryUsed: number;
  successRate: number;
  errors: string[];
}

interface DailyMetrics {
  documentsProcessed?: number;
  analysesCompleted?: number;
  storageUsed?: number;
  apiCalls?: number;
}

const app = express();
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

app.use(authenticateUser);
app.use(requireOrganization);

/**
 * GET /analytics/usage
 * Get usage metrics for organization
 */
app.get("/usage",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const queryValidation = validateData(
        z.object({
          period: z.enum(["day", "week", "month", "year"]).default("month"),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional()
        }),
        req.query
      );
      
      if (!queryValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          queryValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = queryValidation.data!;
      
      const organizationId = (req as any).user!.organizationId;
      
      // Calculate date range
      const endDate = query.endDate || new Date();
      const startDate = query.startDate || getStartDateForPeriod(query.period || 'month', endDate);
      
      // Query analytics data
      const analyticsSnapshot = await firestore
        .collection("organizationAnalytics")
        .doc(organizationId)
        .get();
      
      if (!analyticsSnapshot.exists) {
        res.json(createSuccessResponse({
          organizationId,
          period: query.period,
          startDate,
          endDate,
          metrics: getEmptyMetrics()
        }, req.requestId));
        return;
      }
      
      const analyticsData = analyticsSnapshot.data();
      const metrics = aggregateMetricsForPeriod(
        analyticsData?.daily || {},
        startDate,
        endDate
      );
      
      res.json(createSuccessResponse({
        organizationId,
        period: query.period,
        startDate,
        endDate,
        metrics
      }, req.requestId));
      return;
      
    } catch (error) {
      console.error("Error getting usage analytics:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get usage analytics",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /analytics/documents
 * Get document-related analytics
 */
app.get("/documents",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const queryValidation = validateData(
        z.object({
          days: z.coerce.number().min(1).max(365).default(30)
        }),
        req.query
      );
      
      if (!queryValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          queryValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = queryValidation.data!;
      
      const organizationId = (req as any).user!.organizationId;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (query.days || 30));
      
      // Get document statistics
      const documentsQuery = collections.documents
        .where("organizationId", "==", organizationId)
        .where("createdAt", ">=", startDate);
      
      const documentsSnapshot = await documentsQuery.get();
      
      const documentStats = {
        total: documentsSnapshot.size,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        byDay: {} as Record<string, number>
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
      
      res.json(createSuccessResponse({
        organizationId,
        period: `${query.days || 30} days`,
        documentStats
      }));
      return;
      
    } catch (error) {
      console.error("Error getting document analytics:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get document analytics",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /analytics/analysis
 * Get analysis-related analytics
 */
app.get("/analysis",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const queryValidation = validateData(
        z.object({
          days: z.coerce.number().min(1).max(365).default(30)
        }),
        req.query
      );
      
      if (!queryValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          queryValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = queryValidation.data!;
      
      const organizationId = (req as any).user!.organizationId;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (query?.days || 30));
      
      // Get analysis results statistics
      const analysisQuery = collections.analysisResults
        .where("organizationId", "==", organizationId)
        .where("createdAt", ">=", startDate);
      
      const analysisSnapshot = await analysisQuery.get();
      
      const analysisStats = {
        total: analysisSnapshot.size,
        byStatus: {} as Record<string, number>,
        scoreDistribution: {
          excellent: 0, // 90-100
          good: 0,      // 70-89
          fair: 0,      // 50-69
          poor: 0       // 0-49
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
          } else if (data.weightedScore >= 70) {
            analysisStats.scoreDistribution.good++;
          } else if (data.weightedScore >= 50) {
            analysisStats.scoreDistribution.fair++;
          } else {
            analysisStats.scoreDistribution.poor++;
          }
          
          // Findings breakdown
          if (data.findings) {
            data.findings.forEach((finding: { severity?: string }) => {
              const severity = finding.severity?.toLowerCase() || "unknown";
              if (severity === "critica") {
                analysisStats.findingsBreakdown.critical++;
              } else if (severity === "alta") {
                analysisStats.findingsBreakdown.high++;
              } else if (severity === "media") {
                analysisStats.findingsBreakdown.medium++;
              } else if (severity === "baixa") {
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
      
      res.json(createSuccessResponse({
        organizationId,
        period: `${query?.days || 30} days`,
        analysisStats
      }));
      return;
      
    } catch (error) {
      console.error("Error getting analysis analytics:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get analysis analytics",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /analytics/dashboard
 * Get comprehensive dashboard metrics
 */
app.get("/dashboard",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const organizationId = (req as any).user!.organizationId;
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Get documents metrics
      const documentsSnapshot = await collections.documents
        .where("organizationId", "==", organizationId)
        .where("createdAt", ">=", last30Days)
        .get();
      
      const documents = documentsSnapshot.docs.map(doc => doc.data());
      const recentDocuments = documents.filter(doc => 
        doc.createdAt.toDate() >= last7Days
      );
      
      // Get analysis results
      const analysisSnapshot = await collections.analysisResults
        .where("organizationId", "==", organizationId)
        .where("createdAt", ">=", last30Days)
        .get();
      
      const analyses = analysisSnapshot.docs.map(doc => doc.data());
      const recentAnalyses = analyses.filter(analysis => 
        analysis.createdAt.toDate() >= last7Days
      );
      
      // Calculate metrics
      const completedAnalyses = analyses.filter(a => a.status === "completed");
      const avgScore = completedAnalyses.length > 0 
        ? completedAnalyses.reduce((sum, a) => sum + (a.weightedScore || 0), 0) / completedAnalyses.length
        : 0;
      
      const avgProcessingTime = completedAnalyses.length > 0
        ? completedAnalyses.reduce((sum, a) => sum + (a.executionTimeSeconds || 0), 0) / completedAnalyses.length
        : 0;
      
      const successRate = analyses.length > 0
        ? (completedAnalyses.length / analyses.length) * 100
        : 0;
      
      // Calculate trends (comparing last 7 days vs previous 7 days)
      const prev7Days = new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prevDocuments = documents.filter(doc => {
        const date = doc.createdAt.toDate();
        return date >= prev7Days && date < last7Days;
      });
      
      const prevAnalyses = analyses.filter(analysis => {
        const date = analysis.createdAt.toDate();
        return date >= prev7Days && date < last7Days;
      });
      
      const documentsTrend = prevDocuments.length > 0 
        ? ((recentDocuments.length - prevDocuments.length) / prevDocuments.length) * 100
        : recentDocuments.length > 0 ? 100 : 0;
      
      const analysesTrend = prevAnalyses.length > 0
        ? ((recentAnalyses.length - prevAnalyses.length) / prevAnalyses.length) * 100
        : recentAnalyses.length > 0 ? 100 : 0;
      
      res.json(createSuccessResponse({
        organizationId,
        period: "30 days",
        metrics: {
          totalDocuments: documents.length,
          totalAnalyses: analyses.length,
          averageScore: Math.round(avgScore * 100) / 100,
          averageProcessingTime: Math.round(avgProcessingTime * 100) / 100,
          successRate: Math.round(successRate * 100) / 100,
          trends: {
            documents: Math.round(documentsTrend * 100) / 100,
            analyses: Math.round(analysesTrend * 100) / 100
          }
        },
        recentActivity: {
          documentsLast7Days: recentDocuments.length,
          analysesLast7Days: recentAnalyses.length
        }
      }, req.requestId));
      
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get dashboard metrics",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /analytics/trends
 * Get trend analysis over time
 */
app.get("/trends",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const queryValidation = validateData(
        z.object({
          days: z.coerce.number().min(7).max(365).default(30),
          granularity: z.enum(["daily", "weekly", "monthly"]).default("daily")
        }),
        req.query
      );
      
      if (!queryValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          queryValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = queryValidation.data!;
      const organizationId = (req as any).user!.organizationId;
      const endDate = new Date();
      const days = query.days || 30;
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      // Get documents and analyses for the period
      const [documentsSnapshot, analysisSnapshot] = await Promise.all([
        collections.documents
          .where("organizationId", "==", organizationId)
          .where("createdAt", ">=", startDate)
          .get(),
        collections.analysisResults
          .where("organizationId", "==", organizationId)
          .where("createdAt", ">=", startDate)
          .get()
      ]);
      
      const documents = documentsSnapshot.docs.map(doc => doc.data());
      const analyses = analysisSnapshot.docs.map(doc => doc.data());
      
      // Group data by time period
      const granularity = query.granularity || 'daily';
      const trends = groupDataByPeriod(documents, analyses, granularity, startDate, endDate);
      
      res.json(createSuccessResponse({
        organizationId,
        period: `${query.days} days`,
        granularity: query.granularity,
        trends
      }, req.requestId));
      
    } catch (error) {
      console.error("Error getting trends:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get trends",
        undefined,
        req.requestId
      ));
    }
  }
);

/**
 * GET /analytics/performance
 * Get performance metrics
 */
app.get("/performance",
  requirePermissions([PERMISSIONS.AUDIT_READ]),
  async (req, res) => {
    try {
      const queryValidation = validateData(
        z.object({
          hours: z.coerce.number().min(1).max(168).default(24) // Max 1 week
        }),
        req.query
      );
      
      if (!queryValidation.success) {
        res.status(400).json(createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          queryValidation.details as Record<string, unknown>,
          req.requestId
        ));
        return;
      }
      
      const query = queryValidation.data!;
      
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - (query?.hours || 24));
      
      // Get performance metrics from logs or metrics collection
      const metricsSnapshot = await firestore
        .collection("performanceMetrics")
        .where("timestamp", ">=", startDate)
        .orderBy("timestamp", "desc")
        .limit(1000)
        .get();
      
      const metrics: PerformanceMetrics[] = metricsSnapshot.docs.map(doc => 
        doc.data() as PerformanceMetrics
      );
      
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
            errors: [] as string[]
          };
        }
        
        acc[functionName].totalCalls++;
        acc[functionName].totalExecutionTime += metric.executionTime;
        acc[functionName].totalMemoryUsed += metric.memoryUsed;
        
        if (metric.success) {
          acc[functionName].successCount++;
        } else {
          acc[functionName].errorCount++;
          if (metric.error && !acc[functionName].errors.includes(metric.error)) {
            acc[functionName].errors.push(metric.error);
          }
        }
        
        return acc;
      }, {} as Record<string, FunctionMetrics>);
      
      // Calculate averages and rates
      Object.values(functionMetrics).forEach((funcMetric: FunctionMetrics) => {
        funcMetric.averageExecutionTime = funcMetric.totalExecutionTime / funcMetric.totalCalls;
        funcMetric.averageMemoryUsed = funcMetric.totalMemoryUsed / funcMetric.totalCalls;
        funcMetric.successRate = (funcMetric.successCount / funcMetric.totalCalls) * 100;
      });
      
      res.json(createSuccessResponse({
        period: `${query?.hours || 24} hours`,
        totalMetrics: metrics.length,
        functionMetrics
      }));
      return;
      
    } catch (error) {
      console.error("Error getting performance analytics:", error);
      return res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to get performance analytics",
        undefined,
        req.requestId
      ));
    }
  }
);

// Helper functions
function getStartDateForPeriod(period: string, endDate: Date): Date {
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

function getEmptyMetrics(): UsageMetrics {
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

function aggregateMetricsForPeriod(
  dailyData: Record<string, DailyMetrics>,
  startDate: Date,
  endDate: Date
): UsageMetrics {
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

function groupDataByPeriod(
  documents: any[],
  analyses: any[],
  granularity: string,
  startDate: Date,
  endDate: Date
): Record<string, any> {
  const trends: Record<string, any> = {};
  
  const getDateKey = (date: Date): string => {
    switch (granularity) {
      case "daily":
        return date.toISOString().split('T')[0];
      case "weekly":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case "monthly":
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };
  
  // Initialize all periods with zero values
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const key = getDateKey(currentDate);
    if (!trends[key]) {
      trends[key] = {
        documents: 0,
        analyses: 0,
        completedAnalyses: 0,
        averageScore: 0,
        averageProcessingTime: 0
      };
    }
    
    // Increment by appropriate amount based on granularity
    switch (granularity) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }
  
  // Group documents
  documents.forEach(doc => {
    const key = getDateKey(doc.createdAt.toDate());
    if (trends[key]) {
      trends[key].documents++;
    }
  });
  
  // Group analyses
  analyses.forEach(analysis => {
    const key = getDateKey(analysis.createdAt.toDate());
    if (trends[key]) {
      trends[key].analyses++;
      if (analysis.status === "completed") {
        trends[key].completedAnalyses++;
        if (analysis.weightedScore !== undefined) {
          trends[key].totalScore = (trends[key].totalScore || 0) + analysis.weightedScore;
          trends[key].totalProcessingTime = (trends[key].totalProcessingTime || 0) + (analysis.executionTimeSeconds || 0);
        }
      }
    }
  });
  
  // Calculate averages
  Object.values(trends).forEach((trend: any) => {
    if (trend.completedAnalyses > 0) {
      trend.averageScore = (trend.totalScore || 0) / trend.completedAnalyses;
      trend.averageProcessingTime = (trend.totalProcessingTime || 0) / trend.completedAnalyses;
    }
    // Clean up temporary fields
    delete trend.totalScore;
    delete trend.totalProcessingTime;
  });
  
  return trends;
}

// Export Cloud Function
export const analyticsReporter = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 10,
  cors: true
}, app);