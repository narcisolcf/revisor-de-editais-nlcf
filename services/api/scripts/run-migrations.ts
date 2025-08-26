#!/usr/bin/env npx tsx
/**
 * Migration Runner Script
 * 
 * Usage:
 *   npm run migrate                    # Run all pending migrations
 *   npm run migrate -- --id 001       # Run specific migration
 *   npm run migrate -- --rollback 001 # Rollback specific migration
 *   npm run migrate -- --status       # Show migration status
 *   npm run migrate -- --reset        # Reset all migrations (DANGER)
 *   npm run migrate -- --seed         # Seed development data
 */

import { initializeDatabase } from '../src/db';
import { MigrationRunner } from '../src/db/migrations/migration-runner';

async function main() {
  const args = process.argv.slice(2);
  
  try {
    console.log('🔗 Initializing database connection...');
    const db = initializeDatabase();
    const runner = new MigrationRunner(db);
    
    // Parse command line arguments
    if (args.includes('--status')) {
      console.log('📋 Migration Status:');
      const status = await runner.getMigrationStatus();
      
      console.table(status.map(m => ({
        ID: m.id,
        Name: m.name,
        Status: m.success === true ? '✅ Completed' : 
                m.success === false ? '❌ Failed' : '⏸️ Pending',
        'Run At': m.runAt ? m.runAt.toISOString() : 'Never',
        Error: m.error || 'None'
      })));
      
    } else if (args.includes('--reset')) {
      console.log('⚠️  WARNING: This will reset all migrations and delete data!');
      console.log('Type "RESET" to confirm:');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const confirmation = await new Promise<string>((resolve) => {
        readline.question('> ', (answer: string) => {
          readline.close();
          resolve(answer);
        });
      });
      
      if (confirmation === 'RESET') {
        await runner.resetAllMigrations();
      } else {
        console.log('❌ Reset cancelled');
      }
      
    } else if (args.includes('--rollback')) {
      const idIndex = args.indexOf('--rollback');
      const migrationId = args[idIndex + 1];
      
      if (!migrationId) {
        console.error('❌ Please specify migration ID: --rollback <id>');
        process.exit(1);
      }
      
      await runner.rollbackMigration(migrationId);
      
    } else if (args.includes('--id')) {
      const idIndex = args.indexOf('--id');
      const migrationId = args[idIndex + 1];
      
      if (!migrationId) {
        console.error('❌ Please specify migration ID: --id <id>');
        process.exit(1);
      }
      
      await runner.runMigration(migrationId);
      
    } else if (args.includes('--seed')) {
      await runner.seedDevelopmentData();
      
    } else {
      // Run all migrations
      await runner.runAllMigrations();
    }
    
    console.log('✅ Migration script completed successfully');
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}