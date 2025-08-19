"use strict";
/**
 * Migration Runner
 *
 * Executes and manages database migrations for LicitaReview
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
const _001_initial_data_1 = require("./001-initial-data");
class MigrationRunner {
    constructor(db) {
        this.migrationsCollection = 'migrations';
        this.db = db;
    }
    /**
     * Get list of available migrations
     */
    getMigrations() {
        return [
            {
                id: '001',
                name: 'Initial Data',
                description: 'Creates initial organizations, templates, rules, and configurations',
                migration: _001_initial_data_1.InitialDataMigration
            }
        ];
    }
    /**
     * Check if migration has been run
     */
    async isMigrationRun(migrationId) {
        var _a;
        const doc = await this.db.collection(this.migrationsCollection).doc(migrationId).get();
        return doc.exists && ((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.success) === true;
    }
    /**
     * Record migration execution
     */
    async recordMigration(migrationId, name, description, success, error) {
        const migrationInfo = {
            id: migrationId,
            name,
            description,
            version: '1.0.0',
            runAt: new Date(),
            success,
            error
        };
        await this.db.collection(this.migrationsCollection).doc(migrationId).set(migrationInfo);
    }
    /**
     * Run a specific migration
     */
    async runMigration(migrationId) {
        const availableMigrations = this.getMigrations();
        const migrationConfig = availableMigrations.find(m => m.id === migrationId);
        if (!migrationConfig) {
            throw new Error(`Migration ${migrationId} not found`);
        }
        // Check if already run
        const alreadyRun = await this.isMigrationRun(migrationId);
        if (alreadyRun) {
            console.log(`⚠️  Migration ${migrationId} has already been run`);
            return;
        }
        console.log(`🚀 Running migration ${migrationId}: ${migrationConfig.name}`);
        try {
            const migration = new migrationConfig.migration(this.db);
            await migration.run();
            await this.recordMigration(migrationId, migrationConfig.name, migrationConfig.description, true);
            console.log(`✅ Migration ${migrationId} completed successfully`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await this.recordMigration(migrationId, migrationConfig.name, migrationConfig.description, false, errorMessage);
            console.error(`❌ Migration ${migrationId} failed: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Run all pending migrations
     */
    async runAllMigrations() {
        const migrations = this.getMigrations();
        console.log(`📋 Found ${migrations.length} migrations`);
        for (const migration of migrations) {
            const alreadyRun = await this.isMigrationRun(migration.id);
            if (!alreadyRun) {
                await this.runMigration(migration.id);
            }
            else {
                console.log(`⏭️  Skipping migration ${migration.id} (already run)`);
            }
        }
        console.log('🎉 All migrations completed!');
    }
    /**
     * Rollback a specific migration
     */
    async rollbackMigration(migrationId) {
        const availableMigrations = this.getMigrations();
        const migrationConfig = availableMigrations.find(m => m.id === migrationId);
        if (!migrationConfig) {
            throw new Error(`Migration ${migrationId} not found`);
        }
        console.log(`🔄 Rolling back migration ${migrationId}: ${migrationConfig.name}`);
        try {
            const migration = new migrationConfig.migration(this.db);
            if (typeof migration.rollback === 'function') {
                await migration.rollback();
                // Remove migration record
                await this.db.collection(this.migrationsCollection).doc(migrationId).delete();
                console.log(`✅ Migration ${migrationId} rolled back successfully`);
            }
            else {
                console.log(`⚠️  Migration ${migrationId} does not support rollback`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`❌ Rollback of migration ${migrationId} failed: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Get migration status
     */
    async getMigrationStatus() {
        const availableMigrations = this.getMigrations();
        const results = [];
        for (const migration of availableMigrations) {
            const doc = await this.db.collection(this.migrationsCollection).doc(migration.id).get();
            if (doc.exists) {
                const data = doc.data();
                results.push(Object.assign(Object.assign({}, data), { available: true }));
            }
            else {
                results.push({
                    id: migration.id,
                    name: migration.name,
                    description: migration.description,
                    version: '1.0.0',
                    available: true
                });
            }
        }
        return results;
    }
    /**
     * Reset all migrations (for testing)
     */
    async resetAllMigrations() {
        console.log('🧹 Resetting all migrations...');
        const migrations = this.getMigrations();
        // Rollback in reverse order
        for (const migration of migrations.reverse()) {
            try {
                await this.rollbackMigration(migration.id);
            }
            catch (error) {
                console.warn(`⚠️  Could not rollback migration ${migration.id}:`, error);
            }
        }
        // Clear migration records
        const migrationDocs = await this.db.collection(this.migrationsCollection).get();
        const batch = this.db.batch();
        migrationDocs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('✅ All migrations reset');
    }
    /**
     * Seed development data
     */
    async seedDevelopmentData() {
        console.log('🌱 Seeding development data...');
        // Run initial data migration if not already run
        const initialDataRun = await this.isMigrationRun('001');
        if (!initialDataRun) {
            await this.runMigration('001');
        }
        // Add additional development-specific data here
        // For example: test documents, additional users, etc.
        console.log('✅ Development data seeded');
    }
}
exports.MigrationRunner = MigrationRunner;
//# sourceMappingURL=migration-runner.js.map