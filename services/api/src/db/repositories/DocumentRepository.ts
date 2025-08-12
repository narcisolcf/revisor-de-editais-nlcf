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
import { BaseRepository, QueryOptions, PaginatedResult } from './BaseRepository';
import {
  DocumentMetadata,
  AnalysisResult,
  DocumentVersion,
  ReviewComment,
  DocumentMetadataSchema,
  AnalysisResultSchema,
  DocumentVersionSchema,
  ReviewCommentSchema,
  DOCUMENT_COLLECTIONS
} from '../schemas/document.schema';

/**
 * Document Metadata Repository
 */
export class DocumentRepository extends BaseRepository<DocumentMetadata> {
  constructor(db: Firestore) {
    super(db, 'documents', DocumentMetadataSchema);
  }

  /**
   * Find documents by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<DocumentMetadata[]> {
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
  async findByDocumentType(organizationId: string, documentType: string, options: QueryOptions = {}): Promise<DocumentMetadata[]> {
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
  async findByStatus(organizationId: string, status: string, options: QueryOptions = {}): Promise<DocumentMetadata[]> {
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
  async searchByTitle(organizationId: string, title: string): Promise<DocumentMetadata[]> {
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
  async findByTag(organizationId: string, tag: string): Promise<DocumentMetadata[]> {
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
  async findPendingReview(organizationId: string): Promise<DocumentMetadata[]> {
    return this.findByStatus(organizationId, 'UNDER_REVIEW');
  }

  /**
   * Find recently analyzed documents
   */
  async findRecentlyAnalyzed(organizationId: string, limit: number = 10): Promise<DocumentMetadata[]> {
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
  async updateStatus(id: string, status: string, updatedBy: string): Promise<DocumentMetadata | null> {
    return this.update(id, { 
      status, 
      lastModifiedBy: updatedBy 
    } as any);
  }

  /**
   * Update processing progress
   */
  async updateProcessingProgress(id: string, progress: number, currentStep?: string): Promise<void> {
    const updateData: any = {
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
  async addProcessingError(id: string, error: { code: string; message: string; step?: string }): Promise<void> {
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
  async incrementViewCount(id: string): Promise<void> {
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

/**
 * Analysis Result Repository (🚀 CORE DIFFERENTIATOR)
 */
export class AnalysisRepository extends BaseRepository<AnalysisResult> {
  constructor(db: Firestore) {
    super(db, 'analyses', AnalysisResultSchema);
  }

  /**
   * Get full collection path for document analyses
   */
  protected getCollectionPath(documentId: string): string {
    return `documents/${documentId}/${DOCUMENT_COLLECTIONS.ANALYSES}`;
  }

  /**
   * Find analyses by document
   */
  async findByDocument(documentId: string, options: QueryOptions = {}): Promise<AnalysisResult[]> {
    const collection = this.db.collection(this.getCollectionPath(documentId));
    let query = collection.orderBy('createdAt', 'desc');
    
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value) as any;
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
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
  async findLatest(documentId: string): Promise<AnalysisResult | null> {
    const results = await this.findByDocument(documentId, { limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find analyses by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<AnalysisResult[]> {
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
  async findByConfiguration(organizationId: string, configurationId: string): Promise<AnalysisResult[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'configurationId', operator: '==', value: configurationId }]
    });
  }

  /**
   * Find analyses by score range
   */
  async findByScoreRange(organizationId: string, minScore: number, maxScore: number): Promise<AnalysisResult[]> {
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
  async findFailed(organizationId: string): Promise<AnalysisResult[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'status', operator: '==', value: 'FAILED' }]
    });
  }

  /**
   * Create analysis for document
   */
  async createForDocument(documentId: string, data: Partial<AnalysisResult>): Promise<AnalysisResult> {
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
  async complete(documentId: string, analysisId: string, results: any): Promise<void> {
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
  async markAsFailed(documentId: string, analysisId: string, error: any): Promise<void> {
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
  async getStatistics(organizationId: string, fromDate?: Date): Promise<any> {
    let query = this.db.collectionGroup(DOCUMENT_COLLECTIONS.ANALYSES)
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

  private getMostUsedConfiguration(analyses: any[]): string | null {
    const configCounts = analyses.reduce((acc, analysis) => {
      const configId = analysis.configurationId;
      if (configId) {
        acc[configId] = (acc[configId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(configCounts).reduce((a, b) => 
      configCounts[a] > configCounts[b] ? a : b, null
    );
  }

  private getAverageAnalysisTime(analyses: any[]): number {
    const validDurations = analyses
      .filter(a => a.analysis?.duration)
      .map(a => a.analysis.duration);
    
    return validDurations.length > 0
      ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
      : 0;
  }
}

/**
 * Document Version Repository
 */
export class DocumentVersionRepository extends BaseRepository<DocumentVersion> {
  constructor(db: Firestore) {
    super(db, 'versions', DocumentVersionSchema);
  }

  /**
   * Get full collection path for document versions
   */
  protected getCollectionPath(documentId: string): string {
    return `documents/${documentId}/${DOCUMENT_COLLECTIONS.VERSIONS}`;
  }

  /**
   * Find versions by document
   */
  async findByDocument(documentId: string, options: QueryOptions = {}): Promise<DocumentVersion[]> {
    const collection = this.db.collection(this.getCollectionPath(documentId));
    let query = collection.orderBy('createdAt', 'desc');
    
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value) as any;
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
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
  async findActive(documentId: string): Promise<DocumentVersion | null> {
    const results = await this.findByDocument(documentId, {
      where: [{ field: 'isActive', operator: '==', value: true }],
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create version for document
   */
  async createForDocument(documentId: string, data: Partial<DocumentVersion>): Promise<DocumentVersion> {
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
  async setAsActive(documentId: string, versionId: string): Promise<void> {
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

/**
 * Review Comment Repository
 */
export class ReviewCommentRepository extends BaseRepository<ReviewComment> {
  constructor(db: Firestore) {
    super(db, 'comments', ReviewCommentSchema);
  }

  /**
   * Get full collection path for document comments
   */
  protected getCollectionPath(documentId: string): string {
    return `documents/${documentId}/${DOCUMENT_COLLECTIONS.COMMENTS}`;
  }

  /**
   * Find comments by document
   */
  async findByDocument(documentId: string, options: QueryOptions = {}): Promise<ReviewComment[]> {
    const collection = this.db.collection(this.getCollectionPath(documentId));
    let query = collection.orderBy('createdAt', 'asc');
    
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value) as any;
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit) as any;
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
  async findByThread(documentId: string, threadId: string): Promise<ReviewComment[]> {
    return this.findByDocument(documentId, {
      where: [{ field: 'threadId', operator: '==', value: threadId }]
    });
  }

  /**
   * Find open comments
   */
  async findOpen(documentId: string): Promise<ReviewComment[]> {
    return this.findByDocument(documentId, {
      where: [{ field: 'status', operator: '==', value: 'OPEN' }]
    });
  }

  /**
   * Find comments by user
   */
  async findByUser(documentId: string, userId: string): Promise<ReviewComment[]> {
    return this.findByDocument(documentId, {
      where: [{ field: 'createdBy', operator: '==', value: userId }]
    });
  }

  /**
   * Create comment for document
   */
  async createForDocument(documentId: string, data: Partial<ReviewComment>): Promise<ReviewComment> {
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
  async resolve(documentId: string, commentId: string, resolvedBy: string, resolution: string): Promise<void> {
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
  async getStatistics(documentId: string): Promise<any> {
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