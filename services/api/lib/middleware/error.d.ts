/**
 * Error Handling Middleware
 * LicitaReview Cloud Functions
 */
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils";
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string, id?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: any);
}
export declare class BadRequestError extends AppError {
    constructor(message: string, details?: any);
}
export declare class ServiceUnavailableError extends AppError {
    constructor(message?: string);
}
/**
 * Error handling middleware - should be the last middleware
 */
export declare const errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => void;
/**
 * Not found handler - for unmatched routes
 */
export declare const notFoundHandler: (req: Request, res: Response) => void;
/**
 * Async error wrapper for route handlers
 */
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Timeout handler
 */
export declare const timeoutHandler: (timeoutMs?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Health check error handler
 */
export declare const healthCheckError: (serviceName: string, error: Error) => {
    service: string;
    status: "unhealthy";
    timestamp: Date;
    error: string;
    details: string | undefined;
};
/**
 * Database connection error handler
 */
export declare const dbErrorHandler: (operation: string, error: any) => never;
/**
 * External service error handler
 */
export declare const externalServiceError: (serviceName: string, error: any) => never;
/**
 * Rate limit error handler
 */
export declare const rateLimitError: (req: Request, res: Response) => void;
/**
 * CORS error handler
 */
export declare const corsError: (req: Request, res: Response) => void;
/**
 * Validation error formatter
 */
export declare const formatValidationError: (error: ValidationError) => import("../utils").ErrorResponse;
/**
 * Global unhandled rejection handler
 */
export declare const setupGlobalErrorHandlers: () => void;
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
//# sourceMappingURL=error.d.ts.map