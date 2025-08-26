/**
 * Configuration index
 * Exports all configuration settings
 */
export * from "./firebase";
export declare const config: {
    readonly projectId: string | undefined;
    readonly corsOrigin: string;
    readonly maxRequestSize: string;
    readonly rateLimitWindowMs: number;
    readonly rateLimitMax: number;
    readonly maxDocumentSize: number;
    readonly allowedDocumentTypes: string[];
    readonly defaultAnalysisTimeout: number;
    readonly maxConcurrentAnalyses: number;
    readonly jwtSecret: string | undefined;
    readonly encryptionKey: string | undefined;
    readonly documentAnalyzerServiceUrl: string | undefined;
    readonly logLevel: string;
    readonly enableAuditLogs: boolean;
    readonly nodeEnv: string;
    readonly isDevelopment: boolean;
};
export default config;
//# sourceMappingURL=index.d.ts.map