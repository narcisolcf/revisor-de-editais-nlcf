/**
 * Document Repository
 *
 * Handles all document-related data operations including:
 * - Document metadata
 * - Analysis results (🚀 with personalized scoring)
 * - Document versions
 * - Review comments
 */
import { Firestore } from 'firebase-admin/firestore';
import { BaseRepository, QueryOptions } from './BaseRepository';
import { DocumentMetadata, AnalysisResult, DocumentVersion, ReviewComment } from '../schemas/document.schema';
/**
 * Document Metadata Repository
 */
export declare class DocumentRepository extends BaseRepository<DocumentMetadata> {
    constructor(db: Firestore);
    /**
     * Find documents by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<DocumentMetadata[]>;
    /**
     * Find documents by type
     */
    findByDocumentType(organizationId: string, documentType: string, options?: QueryOptions): Promise<DocumentMetadata[]>;
    /**
     * Find documents by status
     */
    findByStatus(organizationId: string, status: string, options?: QueryOptions): Promise<DocumentMetadata[]>;
    /**
     * Search documents by title
     */
    searchByTitle(organizationId: string, title: string): Promise<DocumentMetadata[]>;
    /**
     * Find documents by tags
     */
    findByTag(organizationId: string, tag: string): Promise<DocumentMetadata[]>;
    /**
     * Find documents requiring review
     */
    findPendingReview(organizationId: string): Promise<DocumentMetadata[]>;
    /**
     * Find recently analyzed documents
     */
    findRecentlyAnalyzed(organizationId: string, limit?: number): Promise<DocumentMetadata[]>;
    /**
     * Update document status
     */
    updateStatus(id: string, status: string, updatedBy: string): Promise<DocumentMetadata | null>;
    /**
     * Update processing progress
     */
    updateProcessingProgress(id: string, progress: number, currentStep?: string): Promise<void>;
    /**
     * Add processing error
     */
    addProcessingError(id: string, error: {
        code: string;
        message: string;
        step?: string;
    }): Promise<void>;
    /**
     * Update view statistics
     */
    incrementViewCount(id: string): Promise<void>;
}
/**
 * Analysis Result Repository (🚀 CORE DIFFERENTIATOR)
 */
export declare class AnalysisRepository extends BaseRepository<AnalysisResult> {
    constructor(db: Firestore);
    /**
     * Get full collection path for document analyses
     */
    protected getCollectionPath(documentId: string): string;
    /**
     * Find analyses by document
     */
    findByDocument(documentId: string, options?: QueryOptions): Promise<AnalysisResult[]>;
    /**
     * Find latest analysis for document
     */
    findLatest(documentId: string): Promise<AnalysisResult | null>;
    /**
     * Find analyses by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<AnalysisResult[]>;
    /**
     * Find analyses by configuration (🚀 CORE: Track which custom parameters were used)
     */
    findByConfiguration(organizationId: string, configurationId: string): Promise<AnalysisResult[]>;
    /**
     * Find analyses by score range
     */
    findByScoreRange(organizationId: string, minScore: number, maxScore: number): Promise<AnalysisResult[]>;
    /**
     * Find failed analyses
     */
    findFailed(organizationId: string): Promise<AnalysisResult[]>;
    /**
     * Create analysis for document
     */
    createForDocument(documentId: string, data: Partial<AnalysisResult>): Promise<AnalysisResult>;
    /**
     * Update analysis status and completion
     */
    complete(documentId: string, analysisId: string, results: any): Promise<void>;
    /**
     * Mark analysis as failed
     */
    markAsFailed(documentId: string, analysisId: string, error: any): Promise<void>;
    /**
     * Get analysis statistics for organization
     */
    getStatistics(organizationId: string, fromDate?: Date): Promise<any>;
    private getMostUsedConfiguration;
    private getAverageAnalysisTime;
}
/**
 * Document Version Repository
 */
export declare class DocumentVersionRepository extends BaseRepository<DocumentVersion> {
    constructor(db: Firestore);
    /**
     * Get full collection path for document versions
     */
    protected getCollectionPath(documentId: string): string;
    /**
     * Find versions by document
     */
    findByDocument(documentId: string, options?: QueryOptions): Promise<DocumentVersion[]>;
    /**
     * Find active version for document
     */
    findActive(documentId: string): Promise<DocumentVersion | null>;
    /**
     * Create version for document
     */
    createForDocument(documentId: string, data: Partial<DocumentVersion>): Promise<DocumentVersion>;
    /**
     * Set version as active
     */
    setAsActive(documentId: string, versionId: string): Promise<void>;
}
/**
 * Review Comment Repository
 */
export declare class ReviewCommentRepository extends BaseRepository<ReviewComment> {
    constructor(db: Firestore);
    /**
     * Get full collection path for document comments
     */
    protected getCollectionPath(documentId: string): string;
    /**
     * Find comments by document
     */
    findByDocument(documentId: string, options?: QueryOptions): Promise<ReviewComment[]>;
    /**
     * Find comments by thread
     */
    findByThread(documentId: string, threadId: string): Promise<ReviewComment[]>;
    /**
     * Find open comments
     */
    findOpen(documentId: string): Promise<ReviewComment[]>;
    /**
     * Find comments by user
     */
    findByUser(documentId: string, userId: string): Promise<ReviewComment[]>;
    /**
     * Create comment for document
     */
    createForDocument(documentId: string, data: Partial<ReviewComment>): Promise<ReviewComment>;
    /**
     * Resolve comment
     */
    resolve(documentId: string, commentId: string, resolvedBy: string, resolution: string): Promise<void>;
    /**
     * Get comment statistics for document
     */
    getStatistics(documentId: string): Promise<any>;
}
