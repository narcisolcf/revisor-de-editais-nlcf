"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationUserRepository = exports.CustomParametersRepository = exports.AnalysisRuleRepository = exports.TemplateRepository = exports.OrganizationRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const organization_schema_1 = require("../schemas/organization.schema");
/**
 * Organization Profile Repository
 */
class OrganizationRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'organizations', organization_schema_1.OrganizationProfileSchema);
    }
    /**
     * Find organization by CNPJ
     */
    async findByCNPJ(cnpj) {
        const results = await this.find({
            where: [{ field: 'cnpj', operator: '==', value: cnpj }],
            limit: 1
        });
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Find organizations by type
     */
    async findByType(organizationType) {
        return this.find({
            where: [{ field: 'organizationType', operator: '==', value: organizationType }],
            orderBy: [{ field: 'name', direction: 'asc' }]
        });
    }
    /**
     * Find active organizations
     */
    async findActive() {
        return this.find({
            where: [{ field: 'status', operator: '==', value: 'ACTIVE' }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }]
        });
    }
    /**
     * Search organizations by name
     */
    async searchByName(name) {
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
    async updateStatus(id, status, updatedBy) {
        return this.update(id, {
            status,
            lastModifiedBy: updatedBy
        });
    }
}
exports.OrganizationRepository = OrganizationRepository;
/**
 * Document Template Repository
 */
class TemplateRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'templates', organization_schema_1.DocumentTemplateSchema);
    }
    /**
     * Get full collection path for organization templates
     */
    getCollectionPath(organizationId) {
        return `organizations/${organizationId}/${organization_schema_1.ORGANIZATION_COLLECTIONS.TEMPLATES}`;
    }
    /**
     * Find templates by organization
     */
    async findByOrganization(organizationId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(organizationId));
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
     * Find templates by document type
     */
    async findByDocumentType(organizationId, documentType) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'documentType', operator: '==', value: documentType }]
        });
    }
    /**
     * Find active templates
     */
    async findActive(organizationId) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'status', operator: '==', value: 'ACTIVE' }]
        });
    }
    /**
     * Find default template for document type
     */
    async findDefault(organizationId, documentType) {
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
    async createForOrganization(organizationId, data) {
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
    async updateUsageStats(organizationId, templateId) {
        const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(templateId);
        await docRef.update({
            'usage.documentsCreated': (await docRef.get()).data()?.usage?.documentsCreated + 1 || 1,
            'usage.lastUsed': new Date(),
            updatedAt: new Date()
        });
    }
}
exports.TemplateRepository = TemplateRepository;
/**
 * Analysis Rule Repository
 */
class AnalysisRuleRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'analysis_rules', organization_schema_1.AnalysisRuleSchema);
    }
    /**
     * Get full collection path for organization rules
     */
    getCollectionPath(organizationId) {
        return `organizations/${organizationId}/${organization_schema_1.ORGANIZATION_COLLECTIONS.ANALYSIS_RULES}`;
    }
    /**
     * Find rules by organization
     */
    async findByOrganization(organizationId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(organizationId));
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
     * Find enabled rules by category
     */
    async findEnabledByCategory(organizationId, category) {
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
    async findByDocumentType(organizationId, documentType) {
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
    async createForOrganization(organizationId, data) {
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
    async updatePerformanceStats(organizationId, ruleId, executionTime) {
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
exports.AnalysisRuleRepository = AnalysisRuleRepository;
/**
 * Custom Parameters Repository (🚀 CORE DIFFERENTIATOR)
 */
class CustomParametersRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'custom_params', organization_schema_1.CustomParametersSchema);
    }
    /**
     * Get full collection path for organization parameters
     */
    getCollectionPath(organizationId) {
        return `organizations/${organizationId}/${organization_schema_1.ORGANIZATION_COLLECTIONS.CUSTOM_PARAMS}`;
    }
    /**
     * Find parameters by organization
     */
    async findByOrganization(organizationId) {
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
    async findActive(organizationId) {
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
    async findDefault(organizationId) {
        const collection = this.db.collection(this.getCollectionPath(organizationId));
        const query = collection.where('isDefault', '==', true).limit(1);
        const snapshot = await query.get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        const data = this.convertTimestamps(doc.data());
        return this.validate({ ...data, id: doc.id });
    }
    /**
     * Create parameters for organization
     */
    async createForOrganization(organizationId, data) {
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
    async setAsDefault(organizationId, parametersId) {
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
    async updateUsageStats(organizationId, parametersId, analysisTime) {
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
exports.CustomParametersRepository = CustomParametersRepository;
/**
 * Organization User Repository
 */
class OrganizationUserRepository extends BaseRepository_1.BaseRepository {
    constructor(db) {
        super(db, 'users', organization_schema_1.OrganizationUserSchema);
    }
    /**
     * Get full collection path for organization users
     */
    getCollectionPath(organizationId) {
        return `organizations/${organizationId}/${organization_schema_1.ORGANIZATION_COLLECTIONS.USERS}`;
    }
    /**
     * Find users by organization
     */
    async findByOrganization(organizationId, options = {}) {
        const collection = this.db.collection(this.getCollectionPath(organizationId));
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
     * Find user by UID
     */
    async findByUID(organizationId, uid) {
        const results = await this.findByOrganization(organizationId, {
            where: [{ field: 'uid', operator: '==', value: uid }],
            limit: 1
        });
        return results.length > 0 ? results[0] : null;
    }
    /**
     * Find users by role
     */
    async findByRole(organizationId, role) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'role', operator: '==', value: role }]
        });
    }
    /**
     * Find active users
     */
    async findActive(organizationId) {
        return this.findByOrganization(organizationId, {
            where: [{ field: 'status', operator: '==', value: 'ACTIVE' }]
        });
    }
    /**
     * Create user for organization
     */
    async createForOrganization(organizationId, data) {
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
    async updateActivity(organizationId, userId) {
        const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(userId);
        await docRef.update({
            'activity.lastLogin': new Date(),
            updatedAt: new Date()
        });
    }
    /**
     * Update user permissions
     */
    async updatePermissions(organizationId, userId, permissions) {
        const docRef = this.db.collection(this.getCollectionPath(organizationId)).doc(userId);
        await docRef.update({
            permissions,
            updatedAt: new Date()
        });
    }
}
exports.OrganizationUserRepository = OrganizationUserRepository;
//# sourceMappingURL=OrganizationRepository.js.map