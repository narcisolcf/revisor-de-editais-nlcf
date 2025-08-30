"use strict";
/**
 * Error Handling Middleware
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGlobalErrorHandlers = exports.formatValidationError = exports.corsError = exports.rateLimitError = exports.externalServiceError = exports.dbErrorHandler = exports.healthCheckError = exports.timeoutHandler = exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = exports.ServiceUnavailableError = exports.BadRequestError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
const firebase_functions_1 = require("firebase-functions");
const utils_1 = require("../utils");
const config_1 = require("../config");
// Custom error classes
class AppError extends Error {
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource, id) {
        super(`${resource}${id ? ` with id ${id}` : ""} not found`, 404, { resource, id });
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized access") {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden access") {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, details);
    }
}
exports.ConflictError = ConflictError;
class BadRequestError extends AppError {
    constructor(message, details) {
        super(message, 400, details);
    }
}
exports.BadRequestError = BadRequestError;
class ServiceUnavailableError extends AppError {
    constructor(message = "Service temporarily unavailable") {
        super(message, 503);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Error handling middleware - should be the last middleware
 */
const errorHandler = (error, req, res) => {
    // Ensure request ID exists
    if (!req.requestId) {
        req.requestId = (0, utils_1.generateRequestId)();
    }
    // Log error with context
    const errorContext = {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.uid,
        organizationId: req.user?.organizationId,
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        }
    };
    // Determine log level based on error type
    if (error instanceof AppError && error.statusCode < 500) {
        firebase_functions_1.logger.warn("Client error occurred", errorContext);
    }
    else if (error instanceof utils_1.ValidationError) {
        firebase_functions_1.logger.warn("Validation error occurred", errorContext);
    }
    else {
        firebase_functions_1.logger.error("Server error occurred", errorContext);
    }
    // Handle specific error types
    let statusCode = 500;
    let message = "Internal server error";
    let details = undefined;
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        message = error.message;
        details = error.details;
    }
    else if (error instanceof utils_1.ValidationError) {
        statusCode = 400;
        message = error.message;
        details = error.details;
    }
    else if (error.name === "UnauthorizedError" || error.message.includes("unauthorized")) {
        statusCode = 401;
        message = "Unauthorized access";
    }
    else if (error.name === "ForbiddenError" || error.message.includes("forbidden")) {
        statusCode = 403;
        message = "Forbidden access";
    }
    else if (error.message.includes("not found")) {
        statusCode = 404;
        message = "Resource not found";
    }
    else if (error.message.includes("timeout")) {
        statusCode = 408;
        message = "Request timeout";
    }
    else if (error.message.includes("too many")) {
        statusCode = 429;
        message = "Too many requests";
    }
    // Create error response
    const errorResponse = (0, utils_1.createErrorResponse)('INTERNAL_ERROR', message, config_1.config.isDevelopment ? details || error.stack : details, req.requestId);
    // Add additional error metadata in development
    if (config_1.config.isDevelopment) {
        errorResponse.debug = {
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
    }
    // Send response
    res.status(statusCode).json(errorResponse);
};
exports.errorHandler = errorHandler;
/**
 * Not found handler - for unmatched routes
 */
const notFoundHandler = (req, res) => {
    const error = (0, utils_1.createErrorResponse)("NOT_FOUND", `Route not found: ${req.method} ${req.path}`, {
        method: req.method,
        path: req.path,
        availableRoutes: "Check API documentation for available routes"
    }, req.requestId);
    res.status(404).json(error);
};
exports.notFoundHandler = notFoundHandler;
/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (
// eslint-disable-next-line no-unused-vars
fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Timeout handler
 */
const timeoutHandler = (timeoutMs = 30000) => {
    return (req, res, next) => {
        const timeout = setTimeout(() => {
            const error = new AppError(`Request timeout after ${timeoutMs}ms`, 408, { timeout: timeoutMs });
            next(error);
        }, timeoutMs);
        // Clear timeout when response is sent
        res.on("finish", () => clearTimeout(timeout));
        res.on("close", () => clearTimeout(timeout));
        next();
    };
};
exports.timeoutHandler = timeoutHandler;
/**
 * Health check error handler
 */
const healthCheckError = (serviceName, error) => {
    firebase_functions_1.logger.error(`Health check failed for ${serviceName}`, {
        service: serviceName,
        error: error.message,
        stack: error.stack
    });
    return {
        service: serviceName,
        status: "unhealthy",
        timestamp: new Date(),
        error: error.message,
        details: config_1.config.isDevelopment ? error.stack : undefined
    };
};
exports.healthCheckError = healthCheckError;
/**
 * Database connection error handler
 */
const dbErrorHandler = (operation, error) => {
    const errorMessage = `Database operation failed: ${operation}`;
    firebase_functions_1.logger.error(errorMessage, {
        operation,
        error: error?.message || error,
        code: error?.code,
        details: error?.details
    });
    // Map Firestore errors to appropriate HTTP status codes
    if (error?.code === "not-found") {
        throw new NotFoundError("Resource");
    }
    else if (error?.code === "permission-denied") {
        throw new ForbiddenError("Insufficient permissions for database operation");
    }
    else if (error?.code === "already-exists") {
        throw new ConflictError("Resource already exists");
    }
    else if (error?.code === "resource-exhausted") {
        throw new ServiceUnavailableError("Database resources exhausted");
    }
    else if (error?.code === "deadline-exceeded") {
        throw new AppError("Database operation timeout", 408);
    }
    else {
        throw new AppError(errorMessage, 500, { operation, originalError: error?.message });
    }
};
exports.dbErrorHandler = dbErrorHandler;
/**
 * External service error handler
 */
const externalServiceError = (serviceName, error) => {
    const errorMessage = `External service error: ${serviceName}`;
    firebase_functions_1.logger.error(errorMessage, {
        service: serviceName,
        error: error?.message || error,
        status: error?.status || error?.statusCode,
        response: error?.response?.data
    });
    if (error?.status >= 400 && error?.status < 500) {
        throw new AppError(`${serviceName} service error: ${error.message}`, error.status, { service: serviceName });
    }
    else {
        throw new ServiceUnavailableError(`${serviceName} service is currently unavailable`);
    }
};
exports.externalServiceError = externalServiceError;
/**
 * Rate limit error handler
 */
const rateLimitError = (req, res) => {
    const error = (0, utils_1.createErrorResponse)("RATE_LIMIT_EXCEEDED", "Rate limit exceeded", {
        limit: "100 requests per 15 minutes",
        retryAfter: "15 minutes",
        documentation: "https://docs.api.com/rate-limits"
    }, req.requestId);
    res.status(429).json(error);
};
exports.rateLimitError = rateLimitError;
/**
 * CORS error handler
 */
const corsError = (req, res) => {
    const error = (0, utils_1.createErrorResponse)("CORS_VIOLATION", "CORS policy violation", {
        origin: req.headers.origin,
        allowedOrigins: config_1.config.corsOrigin,
        documentation: "https://docs.api.com/cors"
    }, req.requestId);
    res.status(403).json(error);
};
exports.corsError = corsError;
/**
 * Validation error formatter
 */
const formatValidationError = (error) => {
    return (0, utils_1.createErrorResponse)("VALIDATION_ERROR", error.message, {
        validationErrors: error.details,
        documentation: "https://docs.api.com/validation"
    });
};
exports.formatValidationError = formatValidationError;
/**
 * Global unhandled rejection handler
 */
const setupGlobalErrorHandlers = () => {
    process.on("unhandledRejection", (reason, promise) => {
        firebase_functions_1.logger.error("Unhandled Rejection at:", {
            promise: promise.toString(),
            reason: reason?.message || reason
        });
        // In production, you might want to exit the process
        if (config_1.config.nodeEnv === "production") {
            process.exit(1);
        }
    });
    process.on("uncaughtException", (error) => {
        firebase_functions_1.logger.error("Uncaught Exception:", {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        // Exit the process for uncaught exceptions
        process.exit(1);
    });
};
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
//# sourceMappingURL=error.js.map