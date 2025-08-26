"use strict";
/**
 * Health Check API
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const firebase_1 = require("../config/firebase");
const utils_1 = require("../utils");
const config_1 = require("../config");
const app = (0, express_1.default)();
app.use(express_1.default.json());
/**
 * GET /health
 * Basic health check endpoint
 */
app.get("/", async (req, res) => {
    try {
        const systemHealth = await checkSystemHealth();
        const statusCode = systemHealth.overall === "healthy" ? 200 :
            systemHealth.overall === "degraded" ? 200 : 503;
        res.status(statusCode).json((0, utils_1.createSuccessResponse)(systemHealth));
    }
    catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json((0, utils_1.createErrorResponse)("HEALTH_CHECK_FAILED", "Health check failed", { error: error instanceof Error ? error.message : String(error) }, undefined));
    }
});
/**
 * GET /health/detailed
 * Detailed health check with all services
 */
app.get("/detailed", async (req, res) => {
    try {
        const services = await Promise.allSettled([
            checkFirestore(),
            checkStorage(),
            checkAuth(),
            checkMemory(),
            checkEnvironment()
        ]);
        const serviceResults = services.map((result, index) => {
            const serviceNames = ["firestore", "storage", "auth", "memory", "environment"];
            if (result.status === "fulfilled") {
                return result.value;
            }
            else {
                return {
                    service: serviceNames[index],
                    status: "unhealthy",
                    timestamp: new Date(),
                    details: { error: result.reason?.message || "Unknown error" }
                };
            }
        });
        const overall = determineOverallHealth(serviceResults);
        const systemHealth = {
            overall,
            services: serviceResults,
            timestamp: new Date(),
            version: process.env.npm_package_version || "1.0.0",
            uptime: process.uptime()
        };
        const statusCode = overall === "healthy" ? 200 :
            overall === "degraded" ? 200 : 503;
        res.status(statusCode).json((0, utils_1.createSuccessResponse)(systemHealth));
    }
    catch (error) {
        console.error("Detailed health check failed:", error);
        res.status(503).json((0, utils_1.createErrorResponse)("DETAILED_HEALTH_CHECK_FAILED", "Detailed health check failed", { error: error instanceof Error ? error.message : String(error) }, undefined));
    }
});
/**
 * GET /health/liveness
 * Kubernetes liveness probe endpoint
 */
app.get("/liveness", (req, res) => {
    res.status(200).json({
        status: "alive",
        timestamp: new Date().toISOString()
    });
});
/**
 * GET /health/readiness
 * Kubernetes readiness probe endpoint
 */
app.get("/readiness", async (req, res) => {
    try {
        // Check critical services for readiness
        await Promise.all([
            checkFirestore(),
            checkAuth()
        ]);
        res.status(200).json({
            status: "ready",
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(503).json({
            status: "not ready",
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
    }
});
// Individual service health checks
async function checkSystemHealth() {
    // const startTime = Date.now(); // Not used
    const services = await Promise.allSettled([
        checkFirestore(),
        checkStorage(),
        checkAuth()
    ]);
    const serviceResults = services.map((result, index) => {
        const serviceNames = ["firestore", "storage", "auth"];
        if (result.status === "fulfilled") {
            return result.value;
        }
        else {
            return {
                service: serviceNames[index],
                status: "unhealthy",
                timestamp: new Date(),
                details: { error: result.reason?.message || "Unknown error" }
            };
        }
    });
    // const responseTime = Date.now() - startTime; // Not used
    return {
        overall: determineOverallHealth(serviceResults),
        services: serviceResults,
        timestamp: new Date(),
        version: process.env.npm_package_version || "1.0.0",
        uptime: process.uptime()
    };
}
async function checkFirestore() {
    const startTime = Date.now();
    try {
        // Simple read operation to test connectivity
        await firebase_1.firestore.collection("health").limit(1).get();
        return {
            service: "firestore",
            status: "healthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            service: "firestore",
            status: "unhealthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
async function checkStorage() {
    const startTime = Date.now();
    // Temporarily disabled storage check
    return {
        service: "storage",
        status: "degraded",
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: { error: "Storage bucket not configured" }
    };
}
async function checkAuth() {
    const startTime = Date.now();
    try {
        // Test auth service by getting service config
        await firebase_1.auth.getUsers([]);
        return {
            service: "auth",
            status: "healthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime
        };
    }
    catch (error) {
        return {
            service: "auth",
            status: "unhealthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
async function checkMemory() {
    const startTime = Date.now();
    try {
        const used = process.memoryUsage();
        const totalMB = used.heapTotal / 1024 / 1024;
        const usedMB = used.heapUsed / 1024 / 1024;
        const usagePercent = (usedMB / totalMB) * 100;
        const status = usagePercent > 90 ? "unhealthy" :
            usagePercent > 75 ? "degraded" : "healthy";
        return {
            service: "memory",
            status,
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: {
                heapUsed: `${Math.round(usedMB)}MB`,
                heapTotal: `${Math.round(totalMB)}MB`,
                usagePercent: `${Math.round(usagePercent)}%`,
                external: `${Math.round(used.external / 1024 / 1024)}MB`,
                rss: `${Math.round(used.rss / 1024 / 1024)}MB`
            }
        };
    }
    catch (error) {
        return {
            service: "memory",
            status: "unhealthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
async function checkEnvironment() {
    const startTime = Date.now();
    try {
        const requiredEnvVars = [
            "GCLOUD_PROJECT",
            "FIREBASE_PROJECT_ID"
        ];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        const status = missingVars.length === 0 ? "healthy" : "unhealthy";
        return {
            service: "environment",
            status,
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: {
                nodeVersion: process.version,
                platform: process.platform,
                environment: process.env.NODE_ENV || "development",
                missingVariables: missingVars.length > 0 ? missingVars : undefined,
                functionRegion: process.env.FUNCTION_REGION,
                projectId: config_1.config.projectId
            }
        };
    }
    catch (error) {
        return {
            service: "environment",
            status: "unhealthy",
            timestamp: new Date(),
            responseTime: Date.now() - startTime,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
function determineOverallHealth(services) {
    const unhealthyServices = services.filter(s => s.status === "unhealthy");
    const degradedServices = services.filter(s => s.status === "degraded");
    if (unhealthyServices.length > 0) {
        // If critical services are unhealthy, mark as unhealthy
        const criticalServices = ["firestore", "auth"];
        const criticalUnhealthy = unhealthyServices.some(s => criticalServices.includes(s.service));
        if (criticalUnhealthy) {
            return "unhealthy";
        }
        else {
            return "degraded";
        }
    }
    if (degradedServices.length > 0) {
        return "degraded";
    }
    return "healthy";
}
// Export Cloud Function
exports.healthCheck = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 10,
    cors: true
}, app);
//# sourceMappingURL=health.js.map