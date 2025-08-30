"use strict";
/**
 * Health Check API
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
exports.healthCheck = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const firebase_1 = require("../config/firebase");
const utils_1 = require("../utils");
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
exports.healthCheck = functions
    .region("us-central1")
    .runWith({
    memory: "256MB",
    timeoutSeconds: 60
})
    .https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
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
//# sourceMappingURL=health.js.map