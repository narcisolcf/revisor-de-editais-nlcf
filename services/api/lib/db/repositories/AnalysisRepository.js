"use strict";
/**
 * Analysis Repository
 *
 * Handles all analysis-related data operations including:
 * - Independent analysis records
 * - Analysis history tracking
 * - Analysis statistics and analytics
 * - Performance monitoring
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalysisStatisticsRepository = exports.AnalysisHistoryRepository = exports.AnalysisRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const analysis_schema_1 = require("../schemas/analysis.schema");
/**
 * Main Analysis Repository
 */
class AnalysisRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, analysis_schema_1.ANALYSIS_COLLECTIONS.ANALYSES, analysis_schema_1.AnalysisSchema);
    }
    /**
     * Find analyses by organization
     */
    async findByOrganization(organizationId, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                ...(options.where || [])
            ], orderBy: [{ field: 'createdAt', direction: 'desc' }] }));
    }
    /**
     * Find analyses by document
     */
    async findByDocument(documentId, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'documentId', operator: '==', value: documentId },
                ...(options.where || [])
            ], orderBy: [{ field: 'createdAt', direction: 'desc' }] }));
    }
    /**
     * Find analyses by user
     */
    async findByUser(userId, organizationId, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'userId', operator: '==', value: userId },
                { field: 'organizationId', operator: '==', value: organizationId },
                ...(options.where || [])
            ], orderBy: [{ field: 'createdAt', direction: 'desc' }] }));
    }
    /**
     * Find analyses by status
     */
    async findByStatus(organizationId, status, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'processing.status', operator: '==', value: status },
                ...(options.where || [])
            ], orderBy: [{ field: 'updatedAt', direction: 'desc' }] }));
    }
    /**
     * Find active/running analyses
     */
    async findActive(organizationId) {
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
    async findCompleted(organizationId, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'processing.status', operator: '==', value: 'COMPLETED' },
                ...(options.where || [])
            ], orderBy: [{ field: 'processing.completedAt', direction: 'desc' }] }));
    }
    /**
     * Find failed analyses
     */
    async findFailed(organizationId, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'processing.status', operator: 'in', value: ['FAILED', 'TIMEOUT'] },
                ...(options.where || [])
            ], orderBy: [{ field: 'updatedAt', direction: 'desc' }] }));
    }
    /**
     * Find analyses by score range
     */
    async findByScoreRange(organizationId, minScore, maxScore, options = {}) {
        return this.find(Object.assign(Object.assign({}, options), { where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'processing.status', operator: '==', value: 'COMPLETED' },
                { field: 'results.scores.overall', operator: '>=', value: minScore },
                { field: 'results.scores.overall', operator: '<=', value: maxScore },
                ...(options.where || [])
            ], orderBy: [{ field: 'results.scores.overall', direction: 'desc' }] }));
    }
    /**
     * Find analyses by configuration
     */
    async findByConfiguration(organizationId, configurationId) {
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
    async findRecent(organizationId, limit = 10) {
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
    async createAnalysis(data) {
        const analysisData = Object.assign(Object.assign({}, data), { processing: Object.assign({ status: 'PENDING', progress: 0 }, data.processing), engine: Object.assign({ name: 'licitareview-v2', version: '2.0.0', fallbackUsed: false, cacheHit: false }, data.engine), request: Object.assign({ priority: 'NORMAL', options: {
                    includeAI: true,
                    generateRecommendations: true,
                    detailedMetrics: false,
                    customRules: []
                }, timeout: 300 }, data.request) });
        return this.create(analysisData);
    }
    /**
     * Update analysis status
     */
    async updateStatus(id, status, progress, currentStep, error) {
        // Get current analysis to merge processing data
        const current = await this.findById(id);
        if (!current)
            return null;
        const updatedProcessing = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, current.processing), { status: status }), (progress !== undefined && { progress })), (currentStep && { currentStep })), (status === 'PROCESSING' && !current.processing.startedAt && { startedAt: new Date() })), (status === 'COMPLETED' && { completedAt: new Date(), progress: 100 })), (error && { error }));
        return this.update(id, {
            processing: updatedProcessing,
            updatedAt: new Date()
        });
    }
    /**
     * Update analysis results
     */
    async updateResults(id, results) {
        const current = await this.findById(id);
        if (!current)
            return null;
        return this.update(id, {
            results,
            processing: Object.assign(Object.assign({}, current.processing), { status: 'COMPLETED', completedAt: new Date(), progress: 100 }),
            updatedAt: new Date()
        });
    }
    /**
     * Update processing metrics
     */
    async updateMetrics(id, metrics) {
        const current = await this.findById(id);
        if (!current)
            return null;
        return this.update(id, {
            processing: Object.assign(Object.assign({}, current.processing), { metrics }),
            updatedAt: new Date()
        });
    }
    /**
     * Cancel analysis
     */
    async cancelAnalysis(id, cancelledBy) {
        const current = await this.findById(id);
        if (!current)
            return null;
        return this.update(id, {
            processing: Object.assign(Object.assign({}, current.processing), { status: 'CANCELLED', completedAt: new Date() }),
            updatedAt: new Date(),
            metadata: Object.assign(Object.assign({}, current.metadata), { cancelledBy, cancelledAt: new Date().toISOString() })
        });
    }
    /**
     * Get analysis statistics for organization
     */
    async getStatistics(organizationId, fromDate) {
        const whereConditions = [
            { field: 'organizationId', operator: '==', value: organizationId }
        ];
        if (fromDate) {
            whereConditions.push({ field: 'createdAt', operator: '>=', value: fromDate });
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
            .filter(a => { var _a, _b; return (_b = (_a = a.results) === null || _a === void 0 ? void 0 : _a.scores) === null || _b === void 0 ? void 0 : _b.overall; })
            .reduce((sum, a) => { var _a, _b; return sum + (((_b = (_a = a.results) === null || _a === void 0 ? void 0 : _a.scores) === null || _b === void 0 ? void 0 : _b.overall) || 0); }, 0);
        const averageScore = completedCount > 0 ? scoresSum / completedCount : 0;
        // Calculate average processing time
        const processingTimes = completedAnalyses
            .filter(a => { var _a; return (_a = a.processing.metrics) === null || _a === void 0 ? void 0 : _a.totalProcessingTime; })
            .map(a => { var _a; return ((_a = a.processing.metrics) === null || _a === void 0 ? void 0 : _a.totalProcessingTime) || 0; });
        const averageProcessingTime = processingTimes.length > 0
            ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
            : 0;
        // Score distribution
        const scoreDistribution = {
            excellent: 0, // 90-100
            good: 0, // 75-89
            acceptable: 0, // 60-74
            poor: 0, // 40-59
            critical: 0 // 0-39
        };
        completedAnalyses.forEach(analysis => {
            var _a, _b;
            const score = ((_b = (_a = analysis.results) === null || _a === void 0 ? void 0 : _a.scores) === null || _b === void 0 ? void 0 : _b.overall) || 0;
            if (score >= 90)
                scoreDistribution.excellent++;
            else if (score >= 75)
                scoreDistribution.good++;
            else if (score >= 60)
                scoreDistribution.acceptable++;
            else if (score >= 40)
                scoreDistribution.poor++;
            else
                scoreDistribution.critical++;
        });
        // Common problems
        const problemCounts = {};
        completedAnalyses.forEach(analysis => {
            var _a, _b;
            (_b = (_a = analysis.results) === null || _a === void 0 ? void 0 : _a.problems) === null || _b === void 0 ? void 0 : _b.forEach(problem => {
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
    getMostUsedConfiguration(analyses) {
        const configCounts = {};
        analyses.forEach(analysis => {
            if (analysis.configurationId) {
                configCounts[analysis.configurationId] = (configCounts[analysis.configurationId] || 0) + 1;
            }
        });
        const entries = Object.entries(configCounts);
        if (entries.length === 0)
            return null;
        return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
    }
    /**
     * Get peak usage hours
     */
    getPeakUsageHours(analyses) {
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
    async cleanupOldAnalyses(organizationId, daysOld = 90) {
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
exports.AnalysisRepository = AnalysisRepository;
/**
 * Analysis History Repository
 */
class AnalysisHistoryRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, analysis_schema_1.ANALYSIS_COLLECTIONS.HISTORY, analysis_schema_1.AnalysisHistoryEntrySchema);
    }
    /**
     * Add history entry
     */
    async addEntry(analysisId, documentId, organizationId, changeType, description, triggeredBy, previousValue, newValue, metadata) {
        const entry = {
            analysisId,
            documentId,
            organizationId,
            changeType: changeType,
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
    async getAnalysisHistory(analysisId) {
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
    async getDocumentHistory(documentId) {
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
    async getRecentHistory(organizationId, limit = 50) {
        return this.find({
            where: [
                { field: 'organizationId', operator: '==', value: organizationId }
            ],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit
        });
    }
}
exports.AnalysisHistoryRepository = AnalysisHistoryRepository;
/**
 * Analysis Statistics Repository
 */
class AnalysisStatisticsRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, analysis_schema_1.ANALYSIS_COLLECTIONS.STATISTICS, analysis_schema_1.AnalysisStatisticsSchema);
    }
    /**
     * Generate statistics for period
     */
    async generateStatistics(organizationId, period, startDate, endDate) {
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
    async getStatistics(organizationId, period, date) {
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
exports.AnalysisStatisticsRepository = AnalysisStatisticsRepository;
//# sourceMappingURL=AnalysisRepository.js.map