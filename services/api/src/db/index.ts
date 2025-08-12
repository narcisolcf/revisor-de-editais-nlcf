/**
 * Database Module Index
 * 
 * Exports all database-related functionality including:
 * - Schemas and types
 * - Repository patterns
 * - Migration utilities
 */

// Schemas
export * from './schemas/organization.schema';
export * from './schemas/document.schema';

// Repositories
export * from './repositories/BaseRepository';
export * from './repositories/OrganizationRepository';
export * from './repositories/DocumentRepository';

// Migrations
export * from './migrations/migration-runner';
export * from './migrations/001-initial-data';

// Database initialization utility
import { Firestore, initializeApp, getApps, cert } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

let db: Firestore;

/**
 * Initialize Firestore connection
 */
export function initializeDatabase(serviceAccountKey?: any): Firestore {
  if (db) {
    return db;
  }

  try {
    // Check if Firebase app is already initialized
    if (getApps().length === 0) {
      const app = admin.initializeApp({
        credential: serviceAccountKey 
          ? cert(serviceAccountKey)
          : admin.credential.applicationDefault(),
        projectId: process.env.GCP_PROJECT_ID
      });
      
      db = getFirestore(app);
    } else {
      db = getFirestore();
    }

    console.log('✅ Firestore initialized successfully');
    return db;
    
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Firestore {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.terminate();
    console.log('✅ Database connection closed');
  }
}

/**
 * Database health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    if (!db) {
      return false;
    }

    // Try to read from a system collection
    await db.collection('_health').limit(1).get();
    return true;
    
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Repository factory functions for easy access
export function createOrganizationRepository(database?: Firestore) {
  const dbInstance = database || getDatabase();
  return {
    organizations: new (await import('./repositories/OrganizationRepository')).OrganizationRepository(dbInstance),
    templates: new (await import('./repositories/OrganizationRepository')).TemplateRepository(dbInstance),
    rules: new (await import('./repositories/OrganizationRepository')).AnalysisRuleRepository(dbInstance),
    parameters: new (await import('./repositories/OrganizationRepository')).CustomParametersRepository(dbInstance),
    users: new (await import('./repositories/OrganizationRepository')).OrganizationUserRepository(dbInstance)
  };
}

export function createDocumentRepository(database?: Firestore) {
  const dbInstance = database || getDatabase();
  return {
    documents: new (await import('./repositories/DocumentRepository')).DocumentRepository(dbInstance),
    analyses: new (await import('./repositories/DocumentRepository')).AnalysisRepository(dbInstance),
    versions: new (await import('./repositories/DocumentRepository')).DocumentVersionRepository(dbInstance),
    comments: new (await import('./repositories/DocumentRepository')).ReviewCommentRepository(dbInstance)
  };
}