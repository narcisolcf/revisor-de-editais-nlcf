/**
 * Analysis Repository
 *
 * Handles all analysis-related data operations including:
 * - Independent analysis records
 * - Analysis history tracking
 * - Analysis statistics and analytics
 * - Performance monitoring
 */
import { Firestore } from 'firebase-admin/firestore';
import { BaseRepository, QueryOptions } from './BaseRepository';
import { Analysis, AnalysisHistoryEntry, AnalysisStatistics } from '../schemas/analysis.schema';
/**
 * Main Analysis Repository
 */
export declare class AnalysisRepository extends BaseRepository<Analysis> {
    constructor(db: Firestore);
    /**
     * Find analyses by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find analyses by document
     */
    findByDocument(documentId: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find analyses by user
     */
    findByUser(userId: string, organizationId: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find analyses by status
     */
    findByStatus(organizationId: string, status: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find active/running analyses
     */
    findActive(organizationId: string): Promise<Analysis[]>;
    /**
     * Find completed analyses
     */
    findCompleted(organizationId: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find failed analyses
     */
    findFailed(organizationId: string, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find analyses by score range
     */
    findByScoreRange(organizationId: string, minScore: number, maxScore: number, options?: QueryOptions): Promise<Analysis[]>;
    /**
     * Find analyses by configuration
     */
    findByConfiguration(organizationId: string, configurationId: string): Promise<Analysis[]>;
    /**
     * Find recent analyses
     */
    findRecent(organizationId: string, limit?: number): Promise<Analysis[]>;
    /**
     * Create new analysis
     */
    createAnalysis(data: Partial<Analysis>): Promise<Analysis>;
    /**
     * Update analysis status
     */
    updateStatus(id: string, status: string, progress?: number, currentStep?: string, error?: any): Promise<Analysis | null>;
    /**
     * Update analysis results
     */
    updateResults(id: string, results: any): Promise<Analysis | null>;
    /**
     * Update processing metrics
     */
    updateMetrics(id: string, metrics: any): Promise<Analysis | null>;
    /**
     * Cancel analysis
     */
    cancelAnalysis(id: string, cancelledBy: string): Promise<Analysis | null>;
    /**
     * Get analysis statistics for organization
     */
    getStatistics(organizationId: string, fromDate?: Date): Promise<any>;
    /**
     * Get most used configuration
     */
    private getMostUsedConfiguration;
    /**
     * Get peak usage hours
     */
    private getPeakUsageHours;
    /**
     * Clean up old analyses
     */
    cleanupOldAnalyses(organizationId: string, daysOld?: number): Promise<number>;
}
/**
 * Analysis History Repository
 */
export declare class AnalysisHistoryRepository extends BaseRepository<AnalysisHistoryEntry> {
    constructor(db: Firestore);
    /**
     * Add history entry
     */
    addEntry(analysisId: string, documentId: string, organizationId: string, changeType: string, description: string, triggeredBy: string, previousValue?: any, newValue?: any, metadata?: any): Promise<AnalysisHistoryEntry>;
    /**
     * Get history for analysis
     */
    getAnalysisHistory(analysisId: string): Promise<AnalysisHistoryEntry[]>;
    /**
     * Get history for document
     */
    getDocumentHistory(documentId: string): Promise<AnalysisHistoryEntry[]>;
    /**
     * Get recent history for organization
     */
    getRecentHistory(organizationId: string, limit?: number): Promise<AnalysisHistoryEntry[]>;
}
/**
 * Analysis Statistics Repository
 */
export declare class AnalysisStatisticsRepository extends BaseRepository<AnalysisStatistics> {
    constructor(db: Firestore);
    /**
     * Generate statistics for period
     */
    generateStatistics(organizationId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY', startDate: Date, endDate: Date): Promise<AnalysisStatistics>;
    /**
     * Get statistics for period
     */
    getStatistics(organizationId: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY', date: Date): Promise<AnalysisStatistics | null>;
}
