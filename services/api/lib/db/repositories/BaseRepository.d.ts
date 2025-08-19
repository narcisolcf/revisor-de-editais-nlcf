/**
 * Base Repository Pattern for Firestore Operations
 *
 * Provides common CRUD operations and query functionality for all repositories
 */
import { Firestore, DocumentReference, CollectionReference, Transaction } from 'firebase-admin/firestore';
import { z } from 'zod';
export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    where?: Array<{
        field: string;
        operator: FirebaseFirestore.WhereFilterOp;
        value: any;
    }>;
}
export interface PaginatedResult<T> {
    data: T[];
    total: number;
    hasMore: boolean;
    nextPageToken?: string;
}
export declare abstract class BaseRepository<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
    protected db: Firestore;
    protected collectionPath: string;
    protected schema: z.ZodSchema<T>;
    constructor(db: Firestore, collectionPath: string, schema: z.ZodSchema<T>);
    /**
     * Get collection reference
     */
    protected getCollection(): CollectionReference;
    /**
     * Get document reference
     */
    protected getDocRef(id: string): DocumentReference;
    /**
     * Validate data against schema
     */
    protected validate(data: unknown): T;
    /**
     * Convert Firestore timestamp to Date
     */
    protected convertTimestamps(data: any): any;
    /**
     * Convert Date to Firestore timestamp for storage
     */
    protected prepareForStorage(data: any): any;
    /**
     * Create a new document
     */
    create(data: CreateT, id?: string): Promise<T>;
    /**
     * Get document by ID
     */
    findById(id: string): Promise<T | null>;
    /**
     * Update document
     */
    update(id: string, data: UpdateT): Promise<T | null>;
    /**
     * Delete document
     */
    delete(id: string): Promise<void>;
    /**
     * Check if document exists
     */
    exists(id: string): Promise<boolean>;
    /**
     * Find documents with query options
     */
    find(options?: QueryOptions): Promise<T[]>;
    /**
     * Find documents with pagination
     */
    findPaginated(options?: QueryOptions & {
        pageSize?: number;
        pageToken?: string;
    }): Promise<PaginatedResult<T>>;
    /**
     * Count documents matching query
     */
    count(options?: Omit<QueryOptions, 'limit' | 'offset' | 'orderBy'>): Promise<number>;
    /**
     * Batch operations
     */
    batchCreate(items: CreateT[]): Promise<T[]>;
    /**
     * Batch update
     */
    batchUpdate(updates: Array<{
        id: string;
        data: UpdateT;
    }>): Promise<void>;
    /**
     * Batch delete
     */
    batchDelete(ids: string[]): Promise<void>;
    /**
     * Transaction support
     */
    runTransaction<R>(updateFunction: (transaction: Transaction) => Promise<R>): Promise<R>;
    /**
     * Listen to real-time changes
     */
    onSnapshot(callback: (data: T[]) => void, errorCallback?: (error: Error) => void, options?: QueryOptions): () => void;
    /**
     * Listen to single document changes
     */
    onDocumentSnapshot(id: string, callback: (data: T | null) => void, errorCallback?: (error: Error) => void): () => void;
}
//# sourceMappingURL=BaseRepository.d.ts.map