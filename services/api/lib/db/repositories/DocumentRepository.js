"use strict";
/**
 * Document Repository
 *
 * Handles all document-related data operations including:
 * - Document metadata
 * - Analysis results (🚀 with personalized scoring)
 * - Document versions
 * - Review comments
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewCommentRepository = exports.DocumentVersionRepository = exports.AnalysisRepository = exports.DocumentRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const document_schema_1 = require("../schemas/document.schema");
/**
 * Document Metadata Repository
 */
class DocumentRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'documents', document_schema_1.DocumentMetadataSchema);
    }
    /**
     * Find documents by organization
     */
    async findByOrganization(organizationId, options = {}) {
        return this.find({
            ...options,
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                ...(options.where || [])
            ]
        });
    }
    /**
     * Find documents by type
     */
    async findByDocumentType(organizationId, documentType, options = {}) {
        return this.find({
            ...options,
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'documentType', operator: '==', value: documentType },
                ...(options.where || [])
            ],
            orderBy: [{ field: 'createdAt', direction: 'desc' }]
        });
    }
    /**
     * Find documents by status
     */
    async findByStatus(organizationId, status, options = {}) {
        return this.find({
            ...options,
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'status', operator: '==', value: status },
                ...(options.where || [])
            ],
            orderBy: [{ field: 'updatedAt', direction: 'desc' }]
        });
    }
    /**
     * Search documents by title
     */
    async searchByTitle(organizationId, title) {
        const searchTerm = title.toLowerCase();
        return this.find({
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'title', operator: '>=', value: searchTerm },
                { field: 'title', operator: '<', value: searchTerm + '\uf8ff' }
            ],
            orderBy: [{ field: 'title', direction: 'asc' }]
        });
    }
    /**
     * Find documents by tags
     */
    async findByTag(organizationId, tag) {
        return this.find({
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'tags', operator: 'array-contains', value: tag }
            ],
            orderBy: [{ field: 'createdAt', direction: 'desc' }]
        });
    }
    /**
     * Find documents requiring review
     */
    async findPendingReview(organizationId) {
        return this.findByStatus(organizationId, 'UNDER_REVIEW');
    }
    /**
     * Find recently analyzed documents
     */
    async findRecentlyAnalyzed(organizationId, limit = 10) {
        return this.find({
            where: [
                { field: 'organizationId', operator: '==', value: organizationId },
                { field: 'status', operator: '==', value: 'ANALYZED' }
            ],
            orderBy: [{ field: 'updatedAt', direction: 'desc' }],
            limit
        });
    }
    /**
     * Update document status
     */
    async updateStatus(id, status, updatedBy) {
        return this.update(id, {
            status,
            lastModifiedBy: updatedBy
        });
    }
    /**
     * Update processing progress
     */
    async updateProcessingProgress(id, progress, currentStep) {
        const updateData = {
            'processing.progress': progress,
            updatedAt: new Date()
        };
        if (currentStep) {
            updateData['processing.currentStep'] = currentStep;
        }
        if (progress === 100) {
            updateData['processing.completedAt'] = new Date();
        }
        await this.getDocRef(id).update(updateData);
    }
    /**
     * Add processing error
     */
    async addProcessingError(id, error) {
        const docRef = this.getDocRef(id);
        const doc = await docRef.get();
        if (doc.exists) {
            const currentErrors = doc.data()?.processing?.errors || [];
            const newError = {
                ...error,
                timestamp: new Date()
            };
            await docRef.update({
                'processing.errors': [...currentErrors, newError],
                updatedAt: new Date()
            });
        }
    }
    /**
     * Update view statistics
     */
    async incrementViewCount(id) {
        const docRef = this.getDocRef(id);
        const doc = await docRef.get();
        if (doc.exists) {
            const currentCount = doc.data()?.statistics?.viewCount || 0;
            await docRef.update({
                'statistics.viewCount': currentCount + 1,
                'statistics.lastViewed': new Date(),
                updatedAt: new Date()
            });
        }
    }
}
exports.DocumentRepository = DocumentRepository;
/**
 * Analysis Result Repository (🚀 CORE DIFFERENTIATOR)
 */
class AnalysisRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'analyses', document_schema_1.AnalysisResultSchema);
    }
    /**
     * Get full collection path for document analyses
     */
    getCollectionPath(documentId) {
        return `documents/${documentId}/${document_schema_1.DOCUMENT_COLLECTIONS.ANALYSES}`;
    }
    /**
     * Find analyses by document
     */
    async findByDocument(documentId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        let query = collection.orderBy('createdAt', 'desc');
        if (options.where) {
            options.where.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = this.convertTimestamps(doc.data());
            return this.validate({ ...data, id: doc.id });
        });
    }
    /**
     * Find latest analysis for document
     */
    async findLatest(documentId) {
        const results = await this.findByDocument(documentId, { limit: 1 });
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Find analyses by organization
     */
    async findByOrganization(organizationId, options = {}) {
        // Note: This requires a composite index on organizationId and createdAt
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
     * Find analyses by configuration (🚀 CORE: Track which custom parameters were used)
     */
    async findByConfiguration(organizationId, configurationId) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'configurationId', operator: '==', value: configurationId }]
        });
    }
    /**
     * Find analyses by score range
     */
    async findByScoreRange(organizationId, minScore, maxScore) {
        return this.findByOrganization(organizationId, {
            where: [
                { field: 'scores.overall', operator: '>=', value: minScore },
                { field: 'scores.overall', operator: '<=', value: maxScore }
            ]
        });
    }
    /**
     * Find failed analyses
     */
    async findFailed(organizationId) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'status', operator: '==', value: 'FAILED' }]
        });
    }
    /**
     * Create analysis for document
     */
    async createForDocument(documentId, data) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        const docRef = collection.doc();
        const createData = {
            ...data,
            id: docRef.id,
            documentId,
            createdAt: new Date()
        };
        const prepared = this.prepareForStorage(createData);
        await docRef.set(prepared);
        return this.validate(createData);
    }
    /**
     * Update analysis status and completion
     */
    async complete(documentId, analysisId, results) {
        const docRef = this.db.collection(this.getCollectionPath(documentId)).doc(analysisId);
        await docRef.update({
            status: 'COMPLETED',
            results,
            'analysis.completedAt': new Date(),
            updatedAt: new Date()
        });
    }
    /**
     * Mark analysis as failed
     */
    async markAsFailed(documentId, analysisId, error) {
        const docRef = this.db.collection(this.getCollectionPath(documentId)).doc(analysisId);
        await docRef.update({
            status: 'FAILED',
            error,
            'analysis.completedAt': new Date(),
            updatedAt: new Date()
        });
    }
    /**
     * Get analysis statistics for organization
     */
    async getStatistics(organizationId, fromDate) {
        let query = this.db.collectionGroup(document_schema_1.DOCUMENT_COLLECTIONS.ANALYSES)
            .where('organizationId', '==', organizationId)
            .where('status', '==', 'COMPLETED');
        if (fromDate) {
            query = query.where('createdAt', '>=', fromDate);
        }
        const snapshot = await query.get();
        const analyses = snapshot.docs.map(doc => doc.data());
        // Calculate statistics
        const totalAnalyses = analyses.length;
        const averageScore = totalAnalyses > 0
            ? analyses.reduce((sum, a) => sum + (a.scores?.overall || 0), 0) / totalAnalyses
            : 0;
        const scoreDistribution = {
            excellent: analyses.filter(a => (a.scores?.overall || 0) >= 90).length,
            good: analyses.filter(a => (a.scores?.overall || 0) >= 75 && (a.scores?.overall || 0) < 90).length,
            acceptable: analyses.filter(a => (a.scores?.overall || 0) >= 60 && (a.scores?.overall || 0) < 75).length,
            poor: analyses.filter(a => (a.scores?.overall || 0) < 60).length
        };
        return {
            totalAnalyses,
            averageScore: Math.round(averageScore * 100) / 100,
            scoreDistribution,
            mostUsedConfiguration: this.getMostUsedConfiguration(analyses),
            averageAnalysisTime: this.getAverageAnalysisTime(analyses)
        };
    }
    getMostUsedConfiguration(analyses) {
        const configCounts = analyses.reduce((acc, analysis) => {
            const configId = analysis.configurationId;
            if (configId) {
                acc[configId] = (acc[configId] || 0) + 1;
            }
            return acc;
        }, {});
        const keys = Object.keys(configCounts);
        if (keys.length === 0)
            return null;
        return keys.reduce((a, b) => configCounts[a] > configCounts[b] ? a : b);
    }
    getAverageAnalysisTime(analyses) {
        const validDurations = analyses
            .filter(a => a.analysis?.duration)
            .map(a => a.analysis.duration);
        return validDurations.length > 0
            ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
            : 0;
    }
}
exports.AnalysisRepository = AnalysisRepository;
/**
 * Document Version Repository
 */
class DocumentVersionRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'versions', document_schema_1.DocumentVersionSchema);
    }
    /**
     * Get full collection path for document versions
     */
    getCollectionPath(documentId) {
        return `documents/${documentId}/${document_schema_1.DOCUMENT_COLLECTIONS.VERSIONS}`;
    }
    /**
     * Find versions by document
     */
    async findByDocument(documentId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        let query = collection.orderBy('createdAt', 'desc');
        if (options.where) {
            options.where.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = this.convertTimestamps(doc.data());
            return this.validate({ ...data, id: doc.id });
        });
    }
    /**
     * Find active version for document
     */
    async findActive(documentId) {
        const results = await this.findByDocument(documentId, {
            where: [{ field: 'isActive', operator: '==', value: true }],
            limit: 1
        });
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Create version for document
     */
    async createForDocument(documentId, data) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        const docRef = collection.doc();
        const createData = {
            ...data,
            id: docRef.id,
            documentId,
            createdAt: new Date()
        };
        const prepared = this.prepareForStorage(createData);
        await docRef.set(prepared);
        return this.validate(createData);
    }
    /**
     * Set version as active
     */
    async setAsActive(documentId, versionId) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        // First, deactivate all versions
        const allVersions = await collection.get();
        const batch = this.db.batch();
        allVersions.forEach(doc => {
            batch.update(doc.ref, { isActive: false });
        });
        // Then activate the specified version
        const versionRef = collection.doc(versionId);
        batch.update(versionRef, { isActive: true });
        await batch.commit();
    }
}
exports.DocumentVersionRepository = DocumentVersionRepository;
/**
 * Review Comment Repository
 */
class ReviewCommentRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'comments', document_schema_1.ReviewCommentSchema);
    }
    /**
     * Get full collection path for document comments
     */
    getCollectionPath(documentId) {
        return `documents/${documentId}/${document_schema_1.DOCUMENT_COLLECTIONS.COMMENTS}`;
    }
    /**
     * Find comments by document
     */
    async findByDocument(documentId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        let query = collection.orderBy('createdAt', 'asc');
        if (options.where) {
            options.where.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
        }
        if (options.limit) {
            query = query.limit(options.limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const data = this.convertTimestamps(doc.data());
            return this.validate({ ...data, id: doc.id });
        });
    }
    /**
     * Find comments by thread
     */
    async findByThread(documentId, threadId) {
        return this.findByDocument(documentId, {
            where: [{ field: 'threadId', operator: '==', value: threadId }]
        });
    }
    /**
     * Find open comments
     */
    async findOpen(documentId) {
        return this.findByDocument(documentId, {
            where: [{ field: 'status', operator: '==', value: 'OPEN' }]
        });
    }
    /**
     * Find comments by user
     */
    async findByUser(documentId, userId) {
        return this.findByDocument(documentId, {
            where: [{ field: 'createdBy', operator: '==', value: userId }]
        });
    }
    /**
     * Create comment for document
     */
    async createForDocument(documentId, data) {
        const collection = this.db.collection(this.getCollectionPath(documentId));
        const docRef = collection.doc();
        // Generate thread ID if not provided and it's not a reply
        const threadId = data.parentCommentId ? data.threadId : (data.threadId || docRef.id);
        const createData = {
            ...data,
            id: docRef.id,
            documentId,
            threadId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const prepared = this.prepareForStorage(createData);
        await docRef.set(prepared);
        return this.validate(createData);
    }
    /**
     * Resolve comment
     */
    async resolve(documentId, commentId, resolvedBy, resolution) {
        const docRef = this.db.collection(this.getCollectionPath(documentId)).doc(commentId);
        await docRef.update({
            status: 'RESOLVED',
            resolution: {
                resolvedBy,
                resolvedAt: new Date(),
                resolution
            },
            updatedAt: new Date()
        });
    }
    /**
     * Get comment statistics for document
     */
    async getStatistics(documentId) {
        const comments = await this.findByDocument(documentId);
        return {
            total: comments.length,
            open: comments.filter(c => c.status === 'OPEN').length,
            resolved: comments.filter(c => c.status === 'RESOLVED').length,
            byType: {
                general: comments.filter(c => c.type === 'GENERAL').length,
                suggestion: comments.filter(c => c.type === 'SUGGESTION').length,
                issue: comments.filter(c => c.type === 'ISSUE').length,
                question: comments.filter(c => c.type === 'QUESTION').length
            },
            threads: new Set(comments.map(c => c.threadId)).size
        };
    }
}
exports.ReviewCommentRepository = ReviewCommentRepository;
//# sourceMappingURL=DocumentRepository.js.map