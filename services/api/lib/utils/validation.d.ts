import { z } from 'zod';
/**
 * Classe de erro de validação
 */
export declare class ValidationError extends Error {
    details: any;
    constructor(message: string, details?: any);
}
/**
 * Resultado da validação
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: any;
}
/**
 * Valida dados usando schema Zod
 */
export declare function validateData<T>(schema: z.ZodSchema<T>, data: any): ValidationResult<T>;
/**
 * Middleware para validar body da requisição
 */
export declare function validateBody<T>(schema: z.ZodSchema<T>): (req: any, res: any, next: any) => void;
/**
 * Middleware para validar query parameters
 */
export declare function validateQuery<T>(schema: z.ZodSchema<T>): (req: any, res: any, next: any) => void;
/**
 * Middleware para validar path parameters
 */
export declare function validatePathParams<T>(schema: z.ZodSchema<T>): (req: any, res: any, next: any) => void;
export declare const DocumentIdSchema: z.ZodObject<{
    documentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    documentId: string;
}, {
    documentId: string;
}>;
export declare const AnalysisIdSchema: z.ZodObject<{
    analysisId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    analysisId: string;
}, {
    analysisId: string;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
}, {
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const AnalysisRequestSchema: z.ZodObject<{
    documentId: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
    analysisType: z.ZodDefault<z.ZodEnum<["basic", "detailed", "comprehensive"]>>;
    options: z.ZodOptional<z.ZodObject<{
        includeAI: z.ZodDefault<z.ZodBoolean>;
        generateRecommendations: z.ZodDefault<z.ZodBoolean>;
        detailedMetrics: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        includeAI: boolean;
        generateRecommendations: boolean;
        detailedMetrics: boolean;
    }, {
        includeAI?: boolean | undefined;
        generateRecommendations?: boolean | undefined;
        detailedMetrics?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    documentId: string;
    priority: "low" | "normal" | "high";
    analysisType: "basic" | "detailed" | "comprehensive";
    options?: {
        includeAI: boolean;
        generateRecommendations: boolean;
        detailedMetrics: boolean;
    } | undefined;
}, {
    documentId: string;
    options?: {
        includeAI?: boolean | undefined;
        generateRecommendations?: boolean | undefined;
        detailedMetrics?: boolean | undefined;
    } | undefined;
    priority?: "low" | "normal" | "high" | undefined;
    analysisType?: "basic" | "detailed" | "comprehensive" | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map