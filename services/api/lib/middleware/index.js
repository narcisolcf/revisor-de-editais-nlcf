"use strict";
/**
 * Middleware Index - Export all middleware
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
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
exports.responseTime = exports.featureFlag = exports.correlation = exports.etag = exports.cacheControl = exports.maintenanceMode = exports.apiVersion = exports.requestSizeLimiter = exports.securityHeaders = exports.requestLogger = void 0;
__exportStar(require("./auth"), exports);
__exportStar(require("./error"), exports);
const firebase_functions_1 = require("firebase-functions");
const utils_1 = require("../utils");
const crypto = __importStar(require("crypto"));
/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
    // Generate request ID if not exists
    if (!req.requestId) {
        req.requestId = (0, utils_1.generateRequestId)();
        res.setHeader("X-Request-ID", req.requestId);
    }
    const startTime = Date.now();
    // Log request start
    firebase_functions_1.logger.info("Request started", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.uid,
        organizationId: req.user?.organizationId
    });
    // Log response when finished
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        firebase_functions_1.logger.info("Request completed", {
            requestId: req.requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            contentLength: res.get("content-length")
        });
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
    // Set security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // HSTS header for HTTPS
    if (req.secure || req.get("x-forwarded-proto") === "https") {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    // Content Security Policy
    res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'");
    next();
};
exports.securityHeaders = securityHeaders;
/**
 * Request size limiter
 */
const requestSizeLimiter = (maxSize = "10mb") => {
    return (req, res, next) => {
        const contentLength = parseInt(req.get("content-length") || "0", 10);
        const maxSizeBytes = parseSize(maxSize);
        if (contentLength > maxSizeBytes) {
            res.status(413).json({
                success: false,
                error: "Request entity too large",
                details: {
                    maxSize: maxSize,
                    receivedSize: formatBytes(contentLength)
                },
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
            return;
        }
        next();
    };
};
exports.requestSizeLimiter = requestSizeLimiter;
/**
 * API version middleware
 */
const apiVersion = (version = "v1") => {
    return (req, res, next) => {
        res.setHeader("API-Version", version);
        req.apiVersion = version;
        next();
    };
};
exports.apiVersion = apiVersion;
/**
 * Maintenance mode middleware
 */
const maintenanceMode = (req, res, next) => {
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === "true";
    if (isMaintenanceMode) {
        // Allow certain endpoints during maintenance
        const allowedPaths = ["/health", "/status"];
        if (!allowedPaths.includes(req.path)) {
            res.status(503).json({
                success: false,
                error: "Service temporarily unavailable for maintenance",
                details: {
                    message: "The service is currently undergoing maintenance. Please try again later.",
                    estimatedDowntime: process.env.MAINTENANCE_ETA || "Unknown"
                },
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
            return;
        }
    }
    next();
};
exports.maintenanceMode = maintenanceMode;
/**
 * Cache control middleware
 */
const cacheControl = (maxAge = 300) => {
    return (req, res, next) => {
        if (req.method === "GET") {
            res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
        }
        else {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
        next();
    };
};
exports.cacheControl = cacheControl;
/**
 * ETag middleware for caching
 */
const etag = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (req.method === "GET" && res.statusCode === 200) {
            const hash = crypto
                .createHash("md5")
                .update(body)
                .digest("hex");
            res.setHeader("ETag", `"${hash}"`);
            // Check if client has cached version
            if (req.get("If-None-Match") === `"${hash}"`) {
                res.status(304).end();
                return res;
            }
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.etag = etag;
/**
 * Request correlation middleware for distributed tracing
 */
const correlation = (req, res, next) => {
    // Use existing correlation ID from headers or generate new one
    const correlationId = req.get("x-correlation-id") ||
        req.get("x-trace-id") ||
        (0, utils_1.generateRequestId)();
    req.correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);
    // Add to all logs for this request
    const originalLog = firebase_functions_1.logger.info;
    firebase_functions_1.logger.info = (message, data) => {
        originalLog(message, { ...data, correlationId });
    };
    next();
};
exports.correlation = correlation;
/**
 * Feature flag middleware
 */
const featureFlag = (flagName, defaultValue = false) => {
    return (req, res, next) => {
        const isEnabled = process.env[`FEATURE_${flagName.toUpperCase()}`] === "true" || defaultValue;
        if (!isEnabled) {
            res.status(404).json({
                success: false,
                error: "Feature not available",
                details: {
                    feature: flagName,
                    message: "This feature is currently disabled"
                },
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            });
            return;
        }
        next();
    };
};
exports.featureFlag = featureFlag;
/**
 * Response time middleware
 */
const responseTime = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        res.setHeader("X-Response-Time", `${duration}ms`);
        // Log slow requests
        if (duration > 5000) { // 5 seconds
            firebase_functions_1.logger.warn("Slow request detected", {
                requestId: req.requestId,
                method: req.method,
                path: req.path,
                duration: `${duration}ms`
            });
        }
    });
    next();
};
exports.responseTime = responseTime;
// Helper functions
function parseSize(size) {
    const units = {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024
    };
    const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)$/);
    if (!match) {
        throw new Error(`Invalid size format: ${size}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    return value * units[unit];
}
function formatBytes(bytes) {
    if (bytes === 0)
        return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
// Express Request type extensions are defined in ../types/express.d.ts
//# sourceMappingURL=index.js.map