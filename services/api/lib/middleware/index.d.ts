/**
 * Middleware Index - Export all middleware
 * LicitaReview Cloud Functions
 */
export * from "./auth";
export * from "./error";
import { Request, Response, NextFunction } from "express";
/**
 * Request logging middleware
 */
export declare const requestLogger: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Security headers middleware
 */
export declare const securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request size limiter
 */
export declare const requestSizeLimiter: (maxSize?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * API version middleware
 */
export declare const apiVersion: (version?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Maintenance mode middleware
 */
export declare const maintenanceMode: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Cache control middleware
 */
export declare const cacheControl: (maxAge?: number) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * ETag middleware for caching
 */
export declare const etag: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Request correlation middleware for distributed tracing
 */
export declare const correlation: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Feature flag middleware
 */
export declare const featureFlag: (flagName: string, defaultValue?: boolean) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Response time middleware
 */
export declare const responseTime: (req: Request, res: Response, next: NextFunction) => void;
declare global {
    namespace Express {
        interface Request {
            requestId?: string;
            correlationId?: string;
            apiVersion?: string;
        }
    }
}
//# sourceMappingURL=index.d.ts.map