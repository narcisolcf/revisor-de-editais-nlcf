/**
 * Organization Repository
 * 
 * Handles all organization-related data operations including:
 * - Organization profiles
 * - Templates management
 * - Analysis rules
 * - Custom parameters (🚀 CORE DIFFERENTIATOR)
 * - User management
 */

import { Firestore } from 'firebase-admin/firestore';
import { BaseRepository, QueryOptions, PaginatedResult } from './BaseRepository';
import {
  OrganizationProfile,
  DocumentTemplate,
  AnalysisRule,
  CustomParameters,
  OrganizationUser,
  OrganizationProfileSchema,
  DocumentTemplateSchema,
  AnalysisRuleSchema,
  CustomParametersSchema,
  OrganizationUserSchema,
  ORGANIZATION_COLLECTIONS
} from '../schemas/organization.schema';

/**
 * Organization Profile Repository
 */
export class OrganizationRepository extends BaseRepository<OrganizationProfile> {
  constructor(db: Firestore) {
    super(db, 'organizations', OrganizationProfileSchema);
  }

  /**
   * Find organization by CNPJ
   */
  async findByCNPJ(cnpj: string): Promise<OrganizationProfile | null> {
    const results = await this.find({
      where: [{ field: 'cnpj', operator: '==', value: cnpj }],
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find organizations by type
   */
  async findByType(organizationType: string): Promise<OrganizationProfile[]> {
    return this.find({
      where: [{ field: 'organizationType', operator: '==', value: organizationType }],
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  /**
   * Find active organizations
   */
  async findActive(): Promise<OrganizationProfile[]> {
    return this.find({
      where: [{ field: 'status', operator: '==', value: 'ACTIVE' }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }]
    });
  }

  /**
   * Search organizations by name
   */
  async searchByName(name: string): Promise<OrganizationProfile[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple starts-with search
    const searchTerm = name.toLowerCase();
    
    return this.find({
      where: [
        { field: 'name', operator: '>=', value: searchTerm },
        { field: 'name', operator: '<', value: searchTerm + '\uf8ff' }
      ],
      orderBy: [{ field: 'name', direction: 'asc' }]
    });
  }

  /**
   * Update organization status
   */
  async updateStatus(id: string, status: string, updatedBy: string): Promise<OrganizationProfile | null> {
    return this.update(id, { 
      status, 
      lastModifiedBy: updatedBy 
    } as any);
  }
}

/**
 * Document Template Repository
 */
export class TemplateRepository extends BaseRepository<DocumentTemplate> {
  constructor(db: Firestore) {
    super(db, 'templates', DocumentTemplateSchema);
  }

  /**
   * Get full collection path for organization templates
   */
  protected getCollectionPath(organizationId: string): string {
    return `organizations/${organizationId}/${ORGANIZATION_COLLECTIONS.TEMPLATES}`;
  }

  /**
   * Find templates by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<DocumentTemplate[]> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
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
   * Find templates by document type
   */
  async findByDocumentType(organizationId: string, documentType: string): Promise<DocumentTemplate[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'documentType', operator: '==', value: documentType }]
    });
  }

  /**
   * Find active templates
   */
  async findActive(organizationId: string): Promise<DocumentTemplate[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'status', operator: '==', value: 'ACTIVE' }]
    });
  }

  /**
   * Find default template for document type
   */
  async findDefault(organizationId: string, documentType: string): Promise<DocumentTemplate | null> {
    const results = await this.findByOrganization(organizationId, {
      where: [
        { field: 'documentType', operator: '==', value: documentType },
        { field: 'isDefault', operator: '==', value: true }
      ],
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Create template for organization
   */
  async createForOrganization(organizationId: string, data: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const docRef = collection.doc();
    
    const createData = {
      ...data,
      id: docRef.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const prepared = this.prepareForStorage(createData);
    await docRef.set(prepared);
    
    return this.validate(createData);
  }

  /**
   * Update template usage statistics
   */
  async updateUsageStats(organizationId: string, templateId: string): Promise<void> {
    const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(templateId);
    
    await docRef.update({
      'usage.documentsCreated': (await docRef.get()).data()?.usage?.documentsCreated + 1 || 1,
      'usage.lastUsed': new Date(),
      updatedAt: new Date()
    });
  }
}

/**
 * Analysis Rule Repository  
 */
export class AnalysisRuleRepository extends BaseRepository<AnalysisRule> {
  constructor(db: Firestore) {
    super(db, 'analysis_rules', AnalysisRuleSchema);
  }

  /**
   * Get full collection path for organization rules
   */
  protected getCollectionPath(organizationId: string): string {
    return `organizations/${organizationId}/${ORGANIZATION_COLLECTIONS.ANALYSIS_RULES}`;
  }

  /**
   * Find rules by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<AnalysisRule[]> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
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
   * Find enabled rules by category
   */
  async findEnabledByCategory(organizationId: string, category: string): Promise<AnalysisRule[]> {
    return this.findByOrganization(organizationId, {
      where: [
        { field: 'category', operator: '==', value: category },
        { field: 'enabled', operator: '==', value: true }
      ],
      orderBy: [{ field: 'priority', direction: 'desc' }]
    });
  }

  /**
   * Find rules applicable to document type
   */
  async findByDocumentType(organizationId: string, documentType: string): Promise<AnalysisRule[]> {
    return this.findByOrganization(organizationId, {
      where: [
        { field: 'appliesToDocumentTypes', operator: 'array-contains', value: documentType },
        { field: 'enabled', operator: '==', value: true }
      ]
    });
  }

  /**
   * Create rule for organization
   */
  async createForOrganization(organizationId: string, data: Partial<AnalysisRule>): Promise<AnalysisRule> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const docRef = collection.doc();
    
    const createData = {
      ...data,
      id: docRef.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const prepared = this.prepareForStorage(createData);
    await docRef.set(prepared);
    
    return this.validate(createData);
  }

  /**
   * Update rule performance stats
   */
  async updatePerformanceStats(
    organizationId: string, 
    ruleId: string, 
    executionTime: number
  ): Promise<void> {
    const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(ruleId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const currentData = doc.data();
      const currentCount = currentData?.performance?.executionCount || 0;
      const currentAverage = currentData?.performance?.averageExecutionTime || 0;
      
      // Calculate new average
      const newAverage = (currentAverage * currentCount + executionTime) / (currentCount + 1);
      
      await docRef.update({
        'performance.executionCount': currentCount + 1,
        'performance.averageExecutionTime': newAverage,
        'performance.lastExecuted': new Date(),
        updatedAt: new Date()
      });
    }
  }
}

/**
 * Custom Parameters Repository (🚀 CORE DIFFERENTIATOR)
 */
export class CustomParametersRepository extends BaseRepository<CustomParameters> {
  constructor(db: Firestore) {
    super(db, 'custom_params', CustomParametersSchema);
  }

  /**
   * Get full collection path for organization parameters
   */
  protected getCollectionPath(organizationId: string): string {
    return `organizations/${organizationId}/${ORGANIZATION_COLLECTIONS.CUSTOM_PARAMS}`;
  }

  /**
   * Find parameters by organization
   */
  async findByOrganization(organizationId: string): Promise<CustomParameters[]> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const query = collection.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = this.convertTimestamps(doc.data());
      return this.validate({ ...data, id: doc.id });
    });
  }

  /**
   * Find active parameters
   */
  async findActive(organizationId: string): Promise<CustomParameters[]> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const query = collection.where('status', '==', 'ACTIVE').orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = this.convertTimestamps(doc.data());
      return this.validate({ ...data, id: doc.id });
    });
  }

  /**
   * Find default parameters for organization
   */
  async findDefault(organizationId: string): Promise<CustomParameters | null> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const query = collection.where('isDefault', '==', true).limit(1);
    
    const snapshot = await query.get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    const data = this.convertTimestamps(doc.data());
    return this.validate({ ...data, id: doc.id });
  }

  /**
   * Create parameters for organization
   */
  async createForOrganization(organizationId: string, data: Partial<CustomParameters>): Promise<CustomParameters> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const docRef = collection.doc();
    
    const createData = {
      ...data,
      id: docRef.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const prepared = this.prepareForStorage(createData);
    await docRef.set(prepared);
    
    return this.validate(createData);
  }

  /**
   * Set as default parameters
   */
  async setAsDefault(organizationId: string, parametersId: string): Promise<void> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    
    // First, unset all current defaults
    const currentDefaults = await collection.where('isDefault', '==', true).get();
    const batch = this.db.batch();
    
    currentDefaults.forEach(doc => {
      batch.update(doc.ref, { isDefault: false, updatedAt: new Date() });
    });
    
    // Set new default
    const newDefaultRef = collection.doc(parametersId);
    batch.update(newDefaultRef, { isDefault: true, updatedAt: new Date() });
    
    await batch.commit();
  }

  /**
   * Update usage statistics
   */
  async updateUsageStats(organizationId: string, parametersId: string, analysisTime: number): Promise<void> {
    const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(parametersId);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const currentData = doc.data();
      const currentCount = currentData?.usage?.documentsAnalyzed || 0;
      const currentTotal = currentData?.usage?.totalAnalysisTime || 0;
      
      await docRef.update({
        'usage.documentsAnalyzed': currentCount + 1,
        'usage.totalAnalysisTime': currentTotal + analysisTime,
        'usage.lastUsed': new Date(),
        updatedAt: new Date()
      });
    }
  }
}

/**
 * Organization User Repository
 */
export class OrganizationUserRepository extends BaseRepository<OrganizationUser> {
  constructor(db: Firestore) {
    super(db, 'users', OrganizationUserSchema);
  }

  /**
   * Get full collection path for organization users
   */
  protected getCollectionPath(organizationId: string): string {
    return `organizations/${organizationId}/${ORGANIZATION_COLLECTIONS.USERS}`;
  }

  /**
   * Find users by organization
   */
  async findByOrganization(organizationId: string, options: QueryOptions = {}): Promise<OrganizationUser[]> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
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
   * Find user by UID
   */
  async findByUID(organizationId: string, uid: string): Promise<OrganizationUser | null> {
    const results = await this.findByOrganization(organizationId, {
      where: [{ field: 'uid', operator: '==', value: uid }],
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find users by role
   */
  async findByRole(organizationId: string, role: string): Promise<OrganizationUser[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'role', operator: '==', value: role }]
    });
  }

  /**
   * Find active users
   */
  async findActive(organizationId: string): Promise<OrganizationUser[]> {
    return this.findByOrganization(organizationId, {
      where: [{ field: 'status', operator: '==', value: 'ACTIVE' }]
    });
  }

  /**
   * Create user for organization
   */
  async createForOrganization(organizationId: string, data: Partial<OrganizationUser>): Promise<OrganizationUser> {
    const collection = this.db.collection(this.getCollectionPath(organizationId));
    const docRef = collection.doc();
    
    const createData = {
      ...data,
      id: docRef.id,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const prepared = this.prepareForStorage(createData);
    await docRef.set(prepared);
    
    return this.validate(createData);
  }

  /**
   * Update user activity
   */
  async updateActivity(organizationId: string, userId: string): Promise<void> {
    const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(userId);
    
    await docRef.update({
      'activity.lastLogin': new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Update user permissions
   */
  async updatePermissions(organizationId: string, userId: string, permissions: string[]): Promise<void> {
    const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(userId);
    
    await docRef.update({
      permissions,
      updatedAt: new Date()
    });
  }
}