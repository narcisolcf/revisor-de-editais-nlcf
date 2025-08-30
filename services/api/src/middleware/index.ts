/**
 * Middleware Index - Export all middleware
 * LicitaReview Cloud Functions
 */

export * from "./auth";
export * from "./error";

import { Request, Response, NextFunction } from "express";
import { logger } from "firebase-functions";
import { generateRequestId } from "../utils";
import * as crypto from "crypto";


/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID if not exists
  if (!req.requestId) {
    req.requestId = generateRequestId();
    res.setHeader("X-Request-ID", req.requestId);
  }

  const startTime = Date.now();
  
  // Log request start
  logger.info("Request started", {
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
    
    logger.info("Request completed", {
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

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
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
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'"
  );

  next();
};

/**
 * Request size limiter
 */
export const requestSizeLimiter = (maxSize: string = "10mb") => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * API version middleware
 */
export const apiVersion = (version: string = "v1") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader("API-Version", version);
    req.apiVersion = version;
    next();
  };
};

/**
 * Maintenance mode middleware
 */
export const maintenanceMode = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Cache control middleware
 */
export const cacheControl = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", `public, max-age=${maxAge}`);
    } else {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    next();
  };
};

/**
 * ETag middleware for caching
 */
export const etag = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
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

/**
 * Request correlation middleware for distributed tracing
 */
export const correlation = (req: Request, res: Response, next: NextFunction): void => {
  // Use existing correlation ID from headers or generate new one
  const correlationId = req.get("x-correlation-id") || 
                       req.get("x-trace-id") || 
                       generateRequestId();
  
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  
  // Add to all logs for this request
  const originalLog = logger.info;
  logger.info = (message: string, data?: any) => {
    originalLog(message, { ...data, correlationId });
  };
  
  next();
};

/**
 * Feature flag middleware
 */
export const featureFlag = (flagName: string, defaultValue: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Response time middleware
 */
export const responseTime = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    res.setHeader("X-Response-Time", `${duration}ms`);
    
    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn("Slow request detected", {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        duration: `${duration}ms`
      });
    }
  });
  
  next();
};

// Helper functions
function parseSize(size: string): number {
  const units: Record<string, number> = {
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Express Request type extensions are defined in ../types/express.d.ts