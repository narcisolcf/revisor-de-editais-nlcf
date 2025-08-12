/**
 * Validation Utilities
 * LicitaReview Cloud Functions
 */

import { z } from "zod";
import { Request } from "firebase-functions/v2/https";
import { ApiResponse, ErrorResponse } from "../types";

// Generic validation function
export const validateSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): { success: true; data: T } | { success: false; error: string; details: any } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code
      }));
      
      const contextMsg = context ? ` in ${context}` : "";
      return {
        success: false,
        error: `Validation failed${contextMsg}`,
        details
      };
    }
    
    return {
      success: false,
      error: `Unexpected validation error${context ? ` in ${context}` : ""}`,
      details: error
    };
  }
};

// Request body validation middleware
export const validateRequestBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request): T => {
    if (!req.body) {
      throw new ValidationError("Request body is required");
    }
    
    const validation = validateSchema(schema, req.body, "request body");
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.details);
    }
    
    return validation.data;
  };
};

// Query parameters validation
export const validateQueryParams = <T>(schema: z.ZodSchema<T>, req: Request): T => {
  const validation = validateSchema(schema, req.query, "query parameters");
  if (!validation.success) {
    throw new ValidationError(validation.error, validation.details);
  }
  
  return validation.data;
};

// Path parameters validation  
export const validatePathParams = <T>(schema: z.ZodSchema<T>, params: any): T => {
  const validation = validateSchema(schema, params, "path parameters");
  if (!validation.success) {
    throw new ValidationError(validation.error, validation.details);
  }
  
  return validation.data;
};

// Custom validation error class
export class ValidationError extends Error {
  public details?: any;
  public statusCode: number = 400;
  
  constructor(message: string, details?: any) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

// Common validation schemas
export const UUIDSchema = z.string().uuid("Invalid UUID format");

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
});

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: "Start date must be before or equal to end date",
    path: ["dateRange"]
  }
);

// Organization validation
export const OrganizationIdSchema = z.object({
  organizationId: UUIDSchema
});

// File validation
export const FileValidationSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().positive().max(52428800), // 50MB
  fileType: z.string().refine(
    (type) => ["application/pdf", "application/msword", 
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
               "text/plain"].includes(type),
    { message: "Unsupported file type" }
  )
});

// Email validation
export const EmailSchema = z.string().email("Invalid email format");

// Password validation  
export const PasswordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Document content validation
export const DocumentContentSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().min(1).max(1000000), // 1MB text limit
  tags: z.array(z.string()).max(20).optional()
});

// Analysis weights validation (CORE DIFFERENTIATOR)
export const validateAnalysisWeights = (weights: {
  structural: number;
  legal: number;
  clarity: number;
  abnt: number;
}): boolean => {
  const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
  return Math.abs(total - 100) < 0.01;
};

// Custom rule pattern validation
export const validateRegexPattern = (pattern: string): boolean => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
};

export const sanitizeHtml = (input: string): string => {
  // Basic HTML sanitization - in production use a proper library like DOMPurify
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
};

// Response formatting
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
  requestId
});

export const createErrorResponse = (
  error: string,
  details?: any,
  requestId?: string
): ErrorResponse => ({
  success: false,
  error,
  details,
  timestamp: new Date().toISOString(),
  requestId
});

// Request ID generation
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Utility to check if string is valid JSON
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// Utility to safely parse JSON
export const safeJsonParse = <T = any>(str: string, defaultValue: T): T => {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
};

export type ValidationResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; details?: any };