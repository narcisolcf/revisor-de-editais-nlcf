/**
 * Error Handling Middleware
 * LicitaReview Cloud Functions
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "firebase-functions";
import { ValidationError, createErrorResponse, generateRequestId } from "../utils";
import { config } from "../config";

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ""} not found`,
      404,
      { resource, id }
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden access") {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, 503);
  }
}

/**
 * Error handling middleware - should be the last middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Ensure request ID exists
  if (!req.requestId) {
    req.requestId = generateRequestId();
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
    logger.warn("Client error occurred", errorContext);
  } else if (error instanceof ValidationError) {
    logger.warn("Validation error occurred", errorContext);
  } else {
    logger.error("Server error occurred", errorContext);
  }

  // Handle specific error types
  let statusCode = 500;
  let message = "Internal server error";
  let details = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    message = error.message;
    details = error.details;
  } else if (error.name === "UnauthorizedError" || error.message.includes("unauthorized")) {
    statusCode = 401;
    message = "Unauthorized access";
  } else if (error.name === "ForbiddenError" || error.message.includes("forbidden")) {
    statusCode = 403;
    message = "Forbidden access";
  } else if (error.message.includes("not found")) {
    statusCode = 404;
    message = "Resource not found";
  } else if (error.message.includes("timeout")) {
    statusCode = 408;
    message = "Request timeout";
  } else if (error.message.includes("too many")) {
    statusCode = 429;
    message = "Too many requests";
  }

  // Create error response
  const errorResponse = createErrorResponse(
    'INTERNAL_ERROR',
    message,
    config.isDevelopment ? details || error.stack : details,
    req.requestId
  );

  // Add additional error metadata in development
  if (config.isDevelopment) {
    errorResponse.debug = {
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler - for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = createErrorResponse(
    "NOT_FOUND",
    `Route not found: ${req.method} ${req.path}`,
    {
      method: req.method,
      path: req.path,
      availableRoutes: "Check API documentation for available routes"
    },
    req.requestId
  );

  res.status(404).json(error);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Timeout handler
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      const error = new AppError(
        `Request timeout after ${timeoutMs}ms`,
        408,
        { timeout: timeoutMs }
      );
      next(error);
    }, timeoutMs);

    // Clear timeout when response is sent
    res.on("finish", () => clearTimeout(timeout));
    res.on("close", () => clearTimeout(timeout));

    next();
  };
};

/**
 * Health check error handler
 */
export const healthCheckError = (serviceName: string, error: Error) => {
  logger.error(`Health check failed for ${serviceName}`, {
    service: serviceName,
    error: error.message,
    stack: error.stack
  });

  return {
    service: serviceName,
    status: "unhealthy" as const,
    timestamp: new Date(),
    error: error.message,
    details: config.isDevelopment ? error.stack : undefined
  };
};

/**
 * Database connection error handler
 */
export const dbErrorHandler = (operation: string, error: any) => {
  const errorMessage = `Database operation failed: ${operation}`;
  
  logger.error(errorMessage, {
    operation,
    error: error?.message || error,
    code: error?.code,
    details: error?.details
  });

  // Map Firestore errors to appropriate HTTP status codes
  if (error?.code === "not-found") {
    throw new NotFoundError("Resource");
  } else if (error?.code === "permission-denied") {
    throw new ForbiddenError("Insufficient permissions for database operation");
  } else if (error?.code === "already-exists") {
    throw new ConflictError("Resource already exists");
  } else if (error?.code === "resource-exhausted") {
    throw new ServiceUnavailableError("Database resources exhausted");
  } else if (error?.code === "deadline-exceeded") {
    throw new AppError("Database operation timeout", 408);
  } else {
    throw new AppError(errorMessage, 500, { operation, originalError: error?.message });
  }
};

/**
 * External service error handler
 */
export const externalServiceError = (serviceName: string, error: any) => {
  const errorMessage = `External service error: ${serviceName}`;
  
  logger.error(errorMessage, {
    service: serviceName,
    error: error?.message || error,
    status: error?.status || error?.statusCode,
    response: error?.response?.data
  });

  if (error?.status >= 400 && error?.status < 500) {
    throw new AppError(
      `${serviceName} service error: ${error.message}`,
      error.status,
      { service: serviceName }
    );
  } else {
    throw new ServiceUnavailableError(`${serviceName} service is currently unavailable`);
  }
};

/**
 * Rate limit error handler
 */
export const rateLimitError = (req: Request, res: Response) => {
  const error = createErrorResponse(
    "RATE_LIMIT_EXCEEDED",
    "Rate limit exceeded",
    {
      limit: "100 requests per 15 minutes",
      retryAfter: "15 minutes",
      documentation: "https://docs.api.com/rate-limits"
    },
    req.requestId
  );

  res.status(429).json(error);
};

/**
 * CORS error handler
 */
export const corsError = (req: Request, res: Response) => {
  const error = createErrorResponse(
    "CORS_VIOLATION",
    "CORS policy violation",
    {
      origin: req.headers.origin,
      allowedOrigins: config.corsOrigin,
      documentation: "https://docs.api.com/cors"
    },
    req.requestId
  );

  res.status(403).json(error);
};

/**
 * Validation error formatter
 */
export const formatValidationError = (error: ValidationError) => {
  return createErrorResponse(
    "VALIDATION_ERROR",
    error.message,
    {
      validationErrors: error.details,
      documentation: "https://docs.api.com/validation"
    }
  );
};

/**
 * Global unhandled rejection handler
 */
export const setupGlobalErrorHandlers = () => {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    logger.error("Unhandled Rejection at:", {
      promise: promise.toString(),
      reason: reason?.message || reason
    });

    // In production, you might want to exit the process
    if (config.nodeEnv === "production") {
      process.exit(1);
    }
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error("Uncaught Exception:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Exit the process for uncaught exceptions
    process.exit(1);
  });
};

// Error response types for TypeScript
export interface ErrorDetails {
  field?: string;
  message: string;
  code?: string;
  value?: any;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}

export interface ExternalServiceError {
  service: string;
  status?: number;
  message: string;
  response?: any;
}