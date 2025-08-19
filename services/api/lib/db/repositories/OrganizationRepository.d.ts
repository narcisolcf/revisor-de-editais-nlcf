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
import { BaseRepository, QueryOptions } from './BaseRepository';
import { OrganizationProfile, DocumentTemplate, AnalysisRule, CustomParameters, OrganizationUser } from '../schemas/organization.schema';
/**
 * Organization Profile Repository
 */
export declare class OrganizationRepository extends BaseRepository<OrganizationProfile> {
    constructor(db: Firestore);
    /**
     * Find organization by CNPJ
     */
    findByCNPJ(cnpj: string): Promise<OrganizationProfile | null>;
    /**
     * Find organizations by type
     */
    findByType(organizationType: string): Promise<OrganizationProfile[]>;
    /**
     * Find active organizations
     */
    findActive(): Promise<OrganizationProfile[]>;
    /**
     * Search organizations by name
     */
    searchByName(name: string): Promise<OrganizationProfile[]>;
    /**
     * Update organization status
     */
    updateStatus(id: string, status: string, updatedBy: string): Promise<OrganizationProfile | null>;
}
/**
 * Document Template Repository
 */
export declare class TemplateRepository extends BaseRepository<DocumentTemplate> {
    constructor(db: Firestore);
    /**
     * Get full collection path for organization templates
     */
    protected getCollectionPath(organizationId: string): string;
    /**
     * Find templates by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<DocumentTemplate[]>;
    /**
     * Find templates by document type
     */
    findByDocumentType(organizationId: string, documentType: string): Promise<DocumentTemplate[]>;
    /**
     * Find active templates
     */
    findActive(organizationId: string): Promise<DocumentTemplate[]>;
    /**
     * Find default template for document type
     */
    findDefault(organizationId: string, documentType: string): Promise<DocumentTemplate | null>;
    /**
     * Create template for organization
     */
    createForOrganization(organizationId: string, data: Partial<DocumentTemplate>): Promise<DocumentTemplate>;
    /**
     * Update template usage statistics
     */
    updateUsageStats(organizationId: string, templateId: string): Promise<void>;
}
/**
 * Analysis Rule Repository
 */
export declare class AnalysisRuleRepository extends BaseRepository<AnalysisRule> {
    constructor(db: Firestore);
    /**
     * Get full collection path for organization rules
     */
    protected getCollectionPath(organizationId: string): string;
    /**
     * Find rules by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<AnalysisRule[]>;
    /**
     * Find enabled rules by category
     */
    findEnabledByCategory(organizationId: string, category: string): Promise<AnalysisRule[]>;
    /**
     * Find rules applicable to document type
     */
    findByDocumentType(organizationId: string, documentType: string): Promise<AnalysisRule[]>;
    /**
     * Create rule for organization
     */
    createForOrganization(organizationId: string, data: Partial<AnalysisRule>): Promise<AnalysisRule>;
    /**
     * Update rule performance stats
     */
    updatePerformanceStats(organizationId: string, ruleId: string, executionTime: number): Promise<void>;
}
/**
 * Custom Parameters Repository (🚀 CORE DIFFERENTIATOR)
 */
export declare class CustomParametersRepository extends BaseRepository<CustomParameters> {
    constructor(db: Firestore);
    /**
     * Get full collection path for organization parameters
     */
    protected getCollectionPath(organizationId: string): string;
    /**
     * Find parameters by organization
     */
    findByOrganization(organizationId: string): Promise<CustomParameters[]>;
    /**
     * Find active parameters
     */
    findActive(organizationId: string): Promise<CustomParameters[]>;
    /**
     * Find default parameters for organization
     */
    findDefault(organizationId: string): Promise<CustomParameters | null>;
    /**
     * Create parameters for organization
     */
    createForOrganization(organizationId: string, data: Partial<CustomParameters>): Promise<CustomParameters>;
    /**
     * Set as default parameters
     */
    setAsDefault(organizationId: string, parametersId: string): Promise<void>;
    /**
     * Update usage statistics
     */
    updateUsageStats(organizationId: string, parametersId: string, analysisTime: number): Promise<void>;
}
/**
 * Organization User Repository
 */
export declare class OrganizationUserRepository extends BaseRepository<OrganizationUser> {
    constructor(db: Firestore);
    /**
     * Get full collection path for organization users
     */
    protected getCollectionPath(organizationId: string): string;
    /**
     * Find users by organization
     */
    findByOrganization(organizationId: string, options?: QueryOptions): Promise<OrganizationUser[]>;
    /**
     * Find user by UID
     */
    findByUID(organizationId: string, uid: string): Promise<OrganizationUser | null>;
    /**
     * Find users by role
     */
    findByRole(organizationId: string, role: string): Promise<OrganizationUser[]>;
    /**
     * Find active users
     */
    findActive(organizationId: string): Promise<OrganizationUser[]>;
    /**
     * Create user for organization
     */
    createForOrganization(organizationId: string, data: Partial<OrganizationUser>): Promise<OrganizationUser>;
    /**
     * Update user activity
     */
    updateActivity(organizationId: string, userId: string): Promise<void>;
    /**
     * Update user permissions
     */
    updatePermissions(organizationId: string, userId: string, permissions: string[]): Promise<void>;
}
//# sourceMappingURL=OrganizationRepository.d.ts.map