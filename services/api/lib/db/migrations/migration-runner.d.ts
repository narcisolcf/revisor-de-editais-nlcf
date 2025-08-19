/**
 * Migration Runner
 *
 * Executes and manages database migrations for LicitaReview
 */
import { Firestore } from 'firebase-admin/firestore';
export interface MigrationInfo {
    id: string;
    name: string;
    description: string;
    version: string;
    runAt?: Date;
    success?: boolean;
    error?: string;
}
export declare class MigrationRunner {
    private db;
    private migrationsCollection;
    constructor(db: Firestore);
    /**
     * Get list of available migrations
     */
    private getMigrations;
    /**
     * Check if migration has been run
     */
    private isMigrationRun;
    /**
     * Record migration execution
     */
    private recordMigration;
    /**
     * Run a specific migration
     */
    runMigration(migrationId: string): Promise<void>;
    /**
     * Run all pending migrations
     */
    runAllMigrations(): Promise<void>;
    /**
     * Rollback a specific migration
     */
    rollbackMigration(migrationId: string): Promise<void>;
    /**
     * Get migration status
     */
    getMigrationStatus(): Promise<Array<MigrationInfo & {
        available: boolean;
    }>>;
    /**
     * Reset all migrations (for testing)
     */
    resetAllMigrations(): Promise<void>;
    /**
     * Seed development data
     */
    seedDevelopmentData(): Promise<void>;
}
//# sourceMappingURL=migration-runner.d.ts.map