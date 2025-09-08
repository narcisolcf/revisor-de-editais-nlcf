/**
 * Firebase Service
 *
 * Wrapper service for Firebase Admin SDK operations
 * Provides centralized Firebase initialization and access
 */
import { Firestore } from 'firebase-admin/firestore';
import { Auth } from 'firebase-admin/auth';
import { Storage } from 'firebase-admin/storage';
export declare class FirebaseService {
    private _db?;
    private _auth?;
    private _storage?;
    private _initialized;
    /**
     * Initialize Firebase Admin SDK if not already initialized
     */
    initialize(): Promise<void>;
    /**
     * Get Firestore instance
     */
    get db(): Firestore;
    /**
     * Get Auth instance
     */
    get auth(): Auth;
    /**
     * Get Storage instance
     */
    get storage(): Storage;
    /**
     * Check if service is initialized
     */
    get isInitialized(): boolean;
    /**
     * Shutdown Firebase services
     */
    shutdown(): Promise<void>;
}
