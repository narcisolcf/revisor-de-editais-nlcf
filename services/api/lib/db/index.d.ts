/**
 * Database Module Index
 *
 * Exports all database-related functionality including:
 * - Schemas and types
 * - Repository patterns
 * - Migration utilities
 */
export * from './schemas/organization.schema';
export * from './schemas/document.schema';
export * from './repositories/BaseRepository';
export * from './repositories/OrganizationRepository';
export * from './repositories/DocumentRepository';
export * from './migrations/migration-runner';
export * from './migrations/001-initial-data';
import { Firestore } from 'firebase-admin/firestore';
/**
 * Initialize Firestore connection
 */
export declare function initializeDatabase(serviceAccountKey?: any): Firestore;
/**
 * Get database instance
 */
export declare function getDatabase(): Firestore;
/**
 * Close database connection
 */
export declare function closeDatabase(): Promise<void>;
/**
 * Database health check
 */
export declare function healthCheck(): Promise<boolean>;
export declare function createOrganizationRepository(database?: Firestore): Promise<{
    organizations: import("./repositories/OrganizationRepository").OrganizationRepository;
    templates: import("./repositories/OrganizationRepository").TemplateRepository;
    rules: import("./repositories/OrganizationRepository").AnalysisRuleRepository;
    parameters: import("./repositories/OrganizationRepository").CustomParametersRepository;
    users: import("./repositories/OrganizationRepository").OrganizationUserRepository;
}>;
export declare function createDocumentRepository(database?: Firestore): Promise<{
    documents: import("./repositories/DocumentRepository").DocumentRepository;
    analyses: import("./repositories/DocumentRepository").AnalysisRepository;
    versions: import("./repositories/DocumentRepository").DocumentVersionRepository;
    comments: import("./repositories/DocumentRepository").ReviewCommentRepository;
}>;
//# sourceMappingURL=index.d.ts.map