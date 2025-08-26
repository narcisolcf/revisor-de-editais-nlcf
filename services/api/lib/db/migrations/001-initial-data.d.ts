/**
 * Initial Data Migration Script
 *
 * Populates Firestore with:
 * - Default analysis rules by document type
 * - Official GOV.BR templates
 * - Example organizations
 * - Default analysis configurations
 */
import { Firestore } from 'firebase-admin/firestore';
export declare class InitialDataMigration {
    private db;
    private orgRepo;
    private templateRepo;
    private ruleRepo;
    private paramsRepo;
    constructor(db: Firestore);
    /**
     * Run the complete migration
     */
    run(): Promise<void>;
    /**
     * Create example organizations
     */
    private createExampleOrganizations;
    /**
     * Create default analysis rules by document type
     */
    private createDefaultAnalysisRules;
    /**
     * Create official GOV.BR templates
     */
    private createGovBRTemplates;
    /**
     * Create default analysis configurations (🚀 CORE DIFFERENTIATOR)
     */
    private createDefaultConfigurations;
    /**
     * Rollback migration (for testing)
     */
    rollback(): Promise<void>;
}
//# sourceMappingURL=001-initial-data.d.ts.map