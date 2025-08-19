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
import { BaseRepository, QueryOptions, PaginatedResult } from './BaseRepository';
import {
  Analysis,
  AnalysisHistoryEntry,
  AnalysisStatistics,
  AnalysisSchema,
  AnalysisHistoryEntrySchema,
  AnalysisStatisticsSchema,
  ANALYSIS_COLLECTIONS
} from '../schemas/analysis.schema';

/**
 * Main Analysis Repository
 */
export class AnalysisRepository extends BaseRepository<Analysis> {
  constructor(db: Firestore) {
    super(db, ANALYSIS_COLLECTIONS.ANALYSES, AnalysisSchema);
  }

  /**
   * Find analyses by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  /**
   * Find analyses by document
   */
  async findByDocument(documentId: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'documentId', operator: '==', value: documentId },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  /**
   * Find analyses by user
   */
  async findByUser(userId: string, organizationId: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'organizationId', operator: '==', value: organizationId },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  /**
   * Find analyses by status
   */
  async findByStatus(organizationId: string, status: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'processing.status', operator: '==', value: status },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    });
  }

  /**
   * Find active/running analyses
   */
  async findActive(organizationId: string): Promise<Analysis[]> {
    return this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'processing.status', operator: 'in', value: ['PENDING', 'INITIALIZING', 'PROCESSING'] }
      ],
      orderBy: [{ field: 'createdAt', direction: 'asc' }]
    });
  }

  /**
   * Find completed analyses
   */
  async findCompleted(organizationId: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'processing.status', operator: '==', value: 'COMPLETED' },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'processing.completedAt', direction: 'desc' }]
    });
  }

  /**
   * Find failed analyses
   */
  async findFailed(organizationId: string, options: QueryOptions = {}): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'processing.status', operator: 'in', value: ['FAILED', 'TIMEOUT'] },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }]
    });
  }

  /**
   * Find analyses by score range
   */
  async findByScoreRange(
    organizationId: string, 
    minScore: number, 
    maxScore: number,
    options: QueryOptions = {}
  ): Promise<Analysis[]> {
    return this.find({
      ...options,
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'processing.status', operator: '==', value: 'COMPLETED' },
        { field: 'results.scores.overall', operator: '>=', value: minScore },
        { field: 'results.scores.overall', operator: '<=', value: maxScore },
        ...(options.where || [])
      ],
      orderBy: [{ field: 'results.scores.overall', direction: 'desc' }]
    });
  }

  /**
   * Find analyses by configuration
   */
  async findByConfiguration(organizationId: string, configurationId: string): Promise<Analysis[]> {
    return this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'configurationId', operator: '==', value: configurationId }
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  /**
   * Find recent analyses
   */
  async findRecent(organizationId: string, limit: number = 10): Promise<Analysis[]> {
    return this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId }
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit
    });
  }

  /**
   * Create new analysis
   */
  async createAnalysis(data: Partial<Analysis>): Promise<Analysis> {
    const analysisData = {
      ...data,
      processing: {
        status: 'PENDING' as const,
        progress: 0,
        ...data.processing
      },
      engine: {
        name: 'licitareview-v2',
        version: '2.0.0',
        fallbackUsed: false,
        cacheHit: false,
        ...data.engine
      },
      request: {
        priority: 'NORMAL' as const,
        options: {
          includeAI: true,
          generateRecommendations: true,
          detailedMetrics: false,
          customRules: []
        },
        timeout: 300,
        ...data.request
      }
    };

    return this.create(analysisData);
  }

  /**
   * Update analysis status
   */
  async updateStatus(
    id: string, 
    status: string, 
    progress?: number, 
    currentStep?: string,
    error?: any
  ): Promise<Analysis | null> {
    // Get current analysis to merge processing data
    const current = await this.findById(id);
    if (!current) return null;

    const updatedProcessing = {
      ...current.processing,
      status: status as any,
      ...(progress !== undefined && { progress }),
      ...(currentStep && { currentStep }),
      ...(status === 'PROCESSING' && !current.processing.startedAt && { startedAt: new Date() }),
      ...(status === 'COMPLETED' && { completedAt: new Date(), progress: 100 }),
      ...(error && { error })
    };

    return this.update(id, {
      processing: updatedProcessing,
      updatedAt: new Date()
    });
  }

  /**
   * Update analysis results
   */
  async updateResults(id: string, results: any): Promise<Analysis | null> {
    const current = await this.findById(id);
    if (!current) return null;

    return this.update(id, {
      results,
      processing: {
        ...current.processing,
        status: 'COMPLETED' as const,
        completedAt: new Date(),
        progress: 100
      },
      updatedAt: new Date()
    });
  }

  /**
   * Update processing metrics
   */
  async updateMetrics(id: string, metrics: any): Promise<Analysis | null> {
    const current = await this.findById(id);
    if (!current) return null;

    return this.update(id, {
      processing: {
        ...current.processing,
        metrics
      },
      updatedAt: new Date()
    });
  }

  /**
   * Cancel analysis
   */
  async cancelAnalysis(id: string, cancelledBy: string): Promise<Analysis | null> {
    const current = await this.findById(id);
    if (!current) return null;

    return this.update(id, {
      processing: {
        ...current.processing,
        status: 'CANCELLED' as const,
        completedAt: new Date()
      },
      updatedAt: new Date(),
      metadata: {
        ...current.metadata,
        cancelledBy,
        cancelledAt: new Date().toISOString()
      }
    });
  }

  /**
   * Get analysis statistics for organization
   */
  async getStatistics(organizationId: string, fromDate?: Date): Promise<any> {
    const whereConditions: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }> = [
      { field: 'organizationId', operator: '==', value: organizationId }
    ];

    if (fromDate) {
      whereConditions.push(
        { field: 'createdAt', operator: '>=', value: fromDate }
      );
    }

    const analyses = await this.find({
      where: whereConditions
    });

    const completedAnalyses = analyses.filter(a => a.processing.status === 'COMPLETED');
    const failedAnalyses = analyses.filter(a => a.processing.status === 'FAILED' || a.processing.status === 'TIMEOUT');
    
    const totalAnalyses = analyses.length;
    const completedCount = completedAnalyses.length;
    const failedCount = failedAnalyses.length;
    const successRate = totalAnalyses > 0 ? (completedCount / totalAnalyses) * 100 : 0;

    // Calculate average score
    const scoresSum = completedAnalyses
      .filter(a => a.results?.scores?.overall)
      .reduce((sum, a) => sum + (a.results?.scores?.overall || 0), 0);
    const averageScore = completedCount > 0 ? scoresSum / completedCount : 0;

    // Calculate average processing time
    const processingTimes = completedAnalyses
      .filter(a => a.processing.metrics?.totalProcessingTime)
      .map(a => a.processing.metrics?.totalProcessingTime || 0);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    // Score distribution
    const scoreDistribution = {
      excellent: 0, // 90-100
      good: 0,      // 75-89
      acceptable: 0, // 60-74
      poor: 0,      // 40-59
      critical: 0   // 0-39
    };

    completedAnalyses.forEach(analysis => {
      const score = analysis.results?.scores?.overall || 0;
      if (score >= 90) scoreDistribution.excellent++;
      else if (score >= 75) scoreDistribution.good++;
      else if (score >= 60) scoreDistribution.acceptable++;
      else if (score >= 40) scoreDistribution.poor++;
      else scoreDistribution.critical++;
    });

    // Common problems
    const problemCounts: { [key: string]: number } = {};
    completedAnalyses.forEach(analysis => {
      analysis.results?.problems?.forEach(problem => {
        const key = `${problem.category}:${problem.severity}`;
        problemCounts[key] = (problemCounts[key] || 0) + 1;
      });
    });

    const commonProblems = Object.entries(problemCounts)
      .map(([key, count]) => {
        const [category, severity] = key.split(':');
        return { category, severity, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalAnalyses,
      completedAnalyses: completedCount,
      failedAnalyses: failedCount,
      successRate,
      averageScore,
      averageProcessingTime,
      scoreDistribution,
      commonProblems,
      mostUsedConfiguration: this.getMostUsedConfiguration(analyses),
      peakUsageHours: this.getPeakUsageHours(analyses)
    };
  }

  /**
   * Get most used configuration
   */
  private getMostUsedConfiguration(analyses: Analysis[]): string | null {
    const configCounts: { [key: string]: number } = {};
    
    analyses.forEach(analysis => {
      if (analysis.configurationId) {
        configCounts[analysis.configurationId] = (configCounts[analysis.configurationId] || 0) + 1;
      }
    });

    const entries = Object.entries(configCounts);
    if (entries.length === 0) return null;
    
    return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }

  /**
   * Get peak usage hours
   */
  private getPeakUsageHours(analyses: Analysis[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    analyses.forEach(analysis => {
      const hour = analysis.createdAt.getHours();
      hourCounts[hour]++;
    });

    // Return top 3 peak hours
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);
  }

  /**
   * Clean up old analyses
   */
  async cleanupOldAnalyses(organizationId: string, daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const oldAnalyses = await this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'createdAt', operator: '<', value: cutoffDate }
      ]
    });

    const deletePromises = oldAnalyses.map(analysis => this.delete(analysis.id));
    await Promise.all(deletePromises);

    return oldAnalyses.length;
  }
}

/**
 * Analysis History Repository
 */
export class AnalysisHistoryRepository extends BaseRepository<AnalysisHistoryEntry> {
  constructor(db: Firestore) {
    super(db, ANALYSIS_COLLECTIONS.HISTORY, AnalysisHistoryEntrySchema);
  }

  /**
   * Add history entry
   */
  async addEntry(
    analysisId: string,
    documentId: string,
    organizationId: string,
    changeType: string,
    description: string,
    triggeredBy: string,
    previousValue?: any,
    newValue?: any,
    metadata?: any
  ): Promise<AnalysisHistoryEntry> {
    const entry = {
      analysisId,
      documentId,
      organizationId,
      changeType: changeType as any,
      description,
      triggeredBy,
      previousValue,
      newValue,
      timestamp: new Date(),
      metadata
    };

    return this.create(entry);
  }

  /**
   * Get history for analysis
   */
  async getAnalysisHistory(analysisId: string): Promise<AnalysisHistoryEntry[]> {
    return this.find({
      where: [
        { field: 'analysisId', operator: '==', value: analysisId }
      ],
      orderBy: [{ field: 'timestamp', direction: 'asc' }]
    });
  }

  /**
   * Get history for document
   */
  async getDocumentHistory(documentId: string): Promise<AnalysisHistoryEntry[]> {
    return this.find({
      where: [
        { field: 'documentId', operator: '==', value: documentId }
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    });
  }

  /**
   * Get recent history for organization
   */
  async getRecentHistory(organizationId: string, limit: number = 50): Promise<AnalysisHistoryEntry[]> {
    return this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId }
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit
    });
  }
}

/**
 * Analysis Statistics Repository
 */
export class AnalysisStatisticsRepository extends BaseRepository<AnalysisStatistics> {
  constructor(db: Firestore) {
    super(db, ANALYSIS_COLLECTIONS.STATISTICS, AnalysisStatisticsSchema);
  }

  /**
   * Generate statistics for period
   */
  async generateStatistics(
    organizationId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: Date,
    endDate: Date
  ): Promise<AnalysisStatistics> {
    // This would typically aggregate data from the main analysis collection
    // For now, we'll create a placeholder implementation
    
    const stats = {
      organizationId,
      period,
      startDate,
      endDate,
      totalAnalyses: 0,
      completedAnalyses: 0,
      failedAnalyses: 0,
      cancelledAnalyses: 0,
      averageProcessingTime: 0,
      averageScore: 0,
      scoreDistribution: {
        excellent: 0,
        good: 0,
        acceptable: 0,
        poor: 0,
        critical: 0
      },
      commonProblems: [],
      analysisTypeDistribution: {},
      peakUsageHours: [],
      generatedAt: new Date()
    };

    return this.create(stats);
  }

  /**
   * Get statistics for period
   */
  async getStatistics(
    organizationId: string,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    date: Date
  ): Promise<AnalysisStatistics | null> {
    const results = await this.find({
      where: [
        { field: 'organizationId', operator: '==', value: organizationId },
        { field: 'period', operator: '==', value: period },
        { field: 'startDate', operator: '<=', value: date },
        { field: 'endDate', operator: '>=', value: date }
      ],
      limit: 1
    });

    return results.length > 0 ? results[0] : null;
  }
}