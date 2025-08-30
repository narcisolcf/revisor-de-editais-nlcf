/**
 * Firebase Service
 * 
 * Wrapper service for Firebase Admin SDK operations
 * Provides centralized Firebase initialization and access
 */

import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { Auth, getAuth } from 'firebase-admin/auth';
import { Storage, getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';

export class FirebaseService {
  private _db?: Firestore;
  private _auth?: Auth;
  private _storage?: Storage;
  private _initialized = false;

  /**
   * Initialize Firebase Admin SDK if not already initialized
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      return;
    }

    try {
      // Initialize Firebase Admin SDK if not already done
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.GOOGLE_CLOUD_PROJECT || 'licitareview-prod',
        });
      }

      this._db = getFirestore();
      this._auth = getAuth();
      this._storage = getStorage();
      this._initialized = true;

      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Get Firestore instance
   */
  get db(): Firestore {
    if (!this._db) {
      throw new Error('FirebaseService not initialized. Call initialize() first.');
    }
    return this._db;
  }

  /**
   * Get Auth instance
   */
  get auth(): Auth {
    if (!this._auth) {
      throw new Error('FirebaseService not initialized. Call initialize() first.');
    }
    return this._auth;
  }

  /**
   * Get Storage instance
   */
  get storage(): Storage {
    if (!this._storage) {
      throw new Error('FirebaseService not initialized. Call initialize() first.');
    }
    return this._storage;
  }

  /**
   * Check if service is initialized
   */
  get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Shutdown Firebase services
   */
  async shutdown(): Promise<void> {
    if (admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app?.delete()));
    }
    this._initialized = false;
    this._db = undefined;
    this._auth = undefined;
    this._storage = undefined;
  }
}