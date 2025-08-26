"use strict";
/**
 * Audit Logger
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLogger = void 0;
exports.createAuditLog = createAuditLog;
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
 * GET /audit/logs
 * Get audit logs for organization
 */
app.get("/logs", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(utils_1.PaginationSchema.extend({
            action: zod_1.z.string().optional(),
            resourceType: zod_1.z.string().optional(),
            resourceId: zod_1.z.string().optional(),
            userId: zod_1.z.string().optional(),
            startDate: zod_1.z.coerce.date().optional(),
            endDate: zod_1.z.coerce.date().optional()
        }), req.query);
        if (!queryValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
        }
        const query = queryValidation.data;
        const organizationId = req.user.organizationId;
        let auditQuery = firebase_1.collections.auditLogs
            .where("organizationId", "==", organizationId);
        // Apply filters
        if (query?.action) {
            auditQuery = auditQuery.where("action", "==", query.action);
        }
        if (query?.resourceType) {
            auditQuery = auditQuery.where("resourceType", "==", query.resourceType);
        }
        if (query?.resourceId) {
            auditQuery = auditQuery.where("resourceId", "==", query.resourceId);
        }
        if (query?.userId) {
            auditQuery = auditQuery.where("userId", "==", query.userId);
        }
        if (query?.startDate) {
            auditQuery = auditQuery.where("timestamp", ">=", query.startDate);
        }
        if (query?.endDate) {
            auditQuery = auditQuery.where("timestamp", "<=", query.endDate);
        }
        // Apply sorting
        auditQuery = auditQuery.orderBy("timestamp", "desc");
        // Count total logs
        const countQuery = await auditQuery.count().get();
        const total = countQuery.data().count;
        // Apply pagination
        const page = query?.page ?? 1;
        const limit = query?.limit ?? 20;
        const offset = (page - 1) * limit;
        auditQuery = auditQuery.offset(offset).limit(limit);
        const snapshot = await auditQuery.get();
        const auditLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const totalPages = Math.ceil(total / limit);
        res.json((0, utils_1.createSuccessResponse)({
            auditLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        }, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error getting audit logs:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get audit logs", undefined, req.requestId));
    }
});
/**
 * GET /audit/summary
 * Get audit summary statistics
 */
app.get("/summary", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const queryValidation = (0, utils_1.validateData)(zod_1.z.object({
            days: zod_1.z.coerce.number().min(1).max(365).default(30)
        }), req.query);
        if (!queryValidation.success) {
            return res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Invalid query parameters", queryValidation.details, req.requestId));
        }
        const query = queryValidation.data;
        const organizationId = req.user.organizationId;
        const days = query?.days ?? 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const auditQuery = firebase_1.collections.auditLogs
            .where("organizationId", "==", organizationId)
            .where("timestamp", ">=", startDate);
        const snapshot = await auditQuery.get();
        const summary = {
            totalEvents: snapshot.size,
            byAction: {},
            byResourceType: {},
            byUser: {},
            byDay: {},
            recentEvents: []
        };
        const auditLogs = [];
        snapshot.docs.forEach(doc => {
            const log = { id: doc.id, ...doc.data() };
            auditLogs.push(log);
            const action = log.action || "unknown";
            const resourceType = log.resourceType || "unknown";
            const userId = log.userId || "unknown";
            const day = (log.timestamp instanceof Date ? log.timestamp : log.timestamp?.toDate?.() || new Date()).toISOString().split('T')[0];
            summary.byAction[action] = (summary.byAction[action] || 0) + 1;
            summary.byResourceType[resourceType] = (summary.byResourceType[resourceType] || 0) + 1;
            summary.byUser[userId] = (summary.byUser[userId] || 0) + 1;
            summary.byDay[day] = (summary.byDay[day] || 0) + 1;
        });
        // Get recent events (last 10)
        summary.recentEvents = auditLogs
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 10);
        res.json((0, utils_1.createSuccessResponse)({
            organizationId,
            period: `${days} days`,
            summary
        }, req.requestId));
        return;
    }
    catch (error) {
        console.error("Error getting audit summary:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to get audit summary", undefined, req.requestId));
    }
});
/**
 * GET /audit/actions
 * Get list of available audit actions
 */
app.get("/actions", (req, res) => {
    const actions = [
        "user_login",
        "user_logout",
        "document_created",
        "document_updated",
        "document_deleted",
        "document_uploaded",
        "analysis_started",
        "analysis_completed",
        "analysis_failed",
        "config_created",
        "config_updated",
        "config_activated",
        "user_created",
        "user_updated",
        "user_deleted",
        "organization_created",
        "organization_updated",
        "permission_granted",
        "permission_revoked"
    ];
    res.json((0, utils_1.createSuccessResponse)(actions, req.requestId));
});
/**
 * GET /audit/resource-types
 * Get list of available resource types
 */
app.get("/resource-types", (req, res) => {
    const resourceTypes = [
        "document",
        "analysis",
        "config",
        "user",
        "organization",
        "permission",
        "session",
        "api_key"
    ];
    res.json((0, utils_1.createSuccessResponse)(resourceTypes, req.requestId));
});
/**
 * POST /audit/export
 * Export audit logs to CSV
 */
app.post("/export", (0, auth_1.requirePermissions)([auth_1.PERMISSIONS.AUDIT_READ]), async (req, res) => {
    try {
        const { filters, format = "csv" } = req.body;
        const organizationId = req.user.organizationId;
        let auditQuery = firebase_1.collections.auditLogs
            .where("organizationId", "==", organizationId);
        // Apply filters if provided
        if (filters?.startDate) {
            auditQuery = auditQuery.where("timestamp", ">=", new Date(filters.startDate));
        }
        if (filters?.endDate) {
            auditQuery = auditQuery.where("timestamp", "<=", new Date(filters.endDate));
        }
        if (filters?.action) {
            auditQuery = auditQuery.where("action", "==", filters.action);
        }
        // Limit large exports
        auditQuery = auditQuery.orderBy("timestamp", "desc").limit(10000);
        const snapshot = await auditQuery.get();
        const auditLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        let exportData;
        let contentType;
        if (format === "csv") {
            exportData = convertToCSV(auditLogs);
            contentType = "text/csv";
        }
        else if (format === "json") {
            exportData = JSON.stringify(auditLogs, null, 2);
            contentType = "application/json";
        }
        else {
            res.status(400).json((0, utils_1.createErrorResponse)("VALIDATION_ERROR", "Unsupported export format", { supportedFormats: ["csv", "json"] }, req.requestId));
            return;
        }
        const filename = `audit-logs-${organizationId}-${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(exportData);
        return;
    }
    catch (error) {
        console.error("Error exporting audit logs:", error);
        return res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to export audit logs", undefined, req.requestId));
    }
});
/**
 * Convert audit logs to CSV format
 */
function convertToCSV(auditLogs) {
    if (auditLogs.length === 0) {
        return "No audit logs found";
    }
    const headers = [
        "ID",
        "Timestamp",
        "User ID",
        "Organization ID",
        "Action",
        "Resource Type",
        "Resource ID",
        "IP Address",
        "User Agent",
        "Changes",
        "Metadata"
    ];
    const csvRows = [headers.join(",")];
    auditLogs.forEach(log => {
        const row = [
            log.id || "",
            log.timestamp?.toISOString() || "",
            log.userId || "",
            log.organizationId || "",
            log.action || "",
            log.resourceType || "",
            log.resourceId || "",
            log.ipAddress || "",
            `"${(log.userAgent || "").replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.changes || {}).replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
    });
    return csvRows.join("\n");
}
/**
 * Create audit log entry (utility function)
 */
async function createAuditLog(logData) {
    try {
        const auditLog = {
            id: (0, utils_1.generateRequestId)(),
            timestamp: new Date(),
            ...logData
        };
        await firebase_1.collections.auditLogs.add(auditLog);
    }
    catch (error) {
        console.error("Failed to create audit log:", error);
        // Don't throw error to avoid disrupting main operations
    }
}
// Export Cloud Function
exports.auditLogger = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 10,
    cors: true
}, app);
//# sourceMappingURL=audit.js.map