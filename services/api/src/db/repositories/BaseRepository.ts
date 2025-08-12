/**
 * Base Repository Pattern for Firestore Operations
 * 
 * Provides common CRUD operations and query functionality for all repositories
 */

import { 
  Firestore, 
  DocumentReference, 
  CollectionReference, 
  Query, 
  WriteBatch,
  Transaction,
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp
} from 'firebase-admin/firestore';
import { z } from 'zod';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  where?: Array<{ field: string; operator: FirebaseFirestore.WhereFilterOp; value: any }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextPageToken?: string;
}

export abstract class BaseRepository<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  protected db: Firestore;
  protected collectionPath: string;
  protected schema: z.ZodSchema<T>;

  constructor(
    db: Firestore,
    collectionPath: string, 
    schema: z.ZodSchema<T>
  ) {
    this.db = db;
    this.collectionPath = collectionPath;
    this.schema = schema;
  }

  /**
   * Get collection reference
   */
  protected getCollection(): CollectionReference {
    return this.db.collection(this.collectionPath);
  }

  /**
   * Get document reference
   */
  protected getDocRef(id: string): DocumentReference {
    return this.getCollection().doc(id);
  }

  /**
   * Validate data against schema
   */
  protected validate(data: unknown): T {
    return this.schema.parse(data);
  }

  /**
   * Convert Firestore timestamp to Date
   */
  protected convertTimestamps(data: any): any {
    if (!data) return data;
    
    const converted = { ...data };
    
    Object.keys(converted).forEach(key => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        converted[key] = this.convertTimestamps(converted[key]);
      }
    });
    
    return converted;
  }

  /**
   * Convert Date to Firestore timestamp for storage
   */
  protected prepareForStorage(data: any): any {
    if (!data) return data;
    
    const prepared = { ...data };
    
    Object.keys(prepared).forEach(key => {
      if (prepared[key] instanceof Date) {
        prepared[key] = Timestamp.fromDate(prepared[key]);
      } else if (typeof prepared[key] === 'object' && prepared[key] !== null) {
        prepared[key] = this.prepareForStorage(prepared[key]);
      }
    });
    
    return prepared;
  }

  /**
   * Create a new document
   */
  async create(data: CreateT, id?: string): Promise<T> {
    const docRef = id ? this.getDocRef(id) : this.getCollection().doc();
    
    const createData = {
      ...data,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const prepared = this.prepareForStorage(createData);
    await docRef.set(prepared);
    
    return this.validate({ ...createData, id: docRef.id });
  }

  /**
   * Get document by ID
   */
  async findById(id: string): Promise<T | null> {
    const doc = await this.getDocRef(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = this.convertTimestamps(doc.data());
    return this.validate({ ...data, id: doc.id });
  }

  /**
   * Update document
   */
  async update(id: string, data: UpdateT): Promise<T | null> {
    const docRef = this.getDocRef(id);
    
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const prepared = this.prepareForStorage(updateData);
    await docRef.update(prepared);
    
    return this.findById(id);
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<void> {
    await this.getDocRef(id).delete();
  }

  /**
   * Check if document exists
   */
  async exists(id: string): Promise<boolean> {
    const doc = await this.getDocRef(id).get();
    return doc.exists;
  }

  /**
   * Find documents with query options
   */
  async find(options: QueryOptions = {}): Promise<T[]> {
    let query: Query = this.getCollection();
    
    // Apply where clauses
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }
    
    // Apply ordering
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    }
    
    // Apply offset
    if (options.offset) {
      query = query.offset(options.offset);
    }
    
    // Apply limit
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
   * Find documents with pagination
   */
  async findPaginated(options: QueryOptions & { pageSize?: number; pageToken?: string } = {}): Promise<PaginatedResult<T>> {
    const pageSize = options.pageSize || 20;
    let query: Query = this.getCollection();
    
    // Apply where clauses
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }
    
    // Apply ordering
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    } else {
      // Default ordering by createdAt for consistent pagination
      query = query.orderBy('createdAt', 'desc');
    }
    
    // Handle pagination
    if (options.pageToken) {
      const tokenDoc = await this.getDocRef(options.pageToken).get();
      if (tokenDoc.exists) {
        query = query.startAfter(tokenDoc);
      }
    }
    
    // Get one extra document to check if there are more pages
    query = query.limit(pageSize + 1);
    
    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, pageSize);
    const hasMore = snapshot.docs.length > pageSize;
    
    const data = docs.map(doc => {
      const docData = this.convertTimestamps(doc.data());
      return this.validate({ ...docData, id: doc.id });
    });
    
    const nextPageToken = hasMore && docs.length > 0 ? docs[docs.length - 1].id : undefined;
    
    return {
      data,
      total: snapshot.size, // This is approximate for Firestore
      hasMore,
      nextPageToken
    };
  }

  /**
   * Count documents matching query
   */
  async count(options: Omit<QueryOptions, 'limit' | 'offset' | 'orderBy'> = {}): Promise<number> {
    let query: Query = this.getCollection();
    
    // Apply where clauses
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  /**
   * Batch operations
   */
  async batchCreate(items: CreateT[]): Promise<T[]> {
    const batch = this.db.batch();
    const results: T[] = [];
    
    for (const item of items) {
      const docRef = this.getCollection().doc();
      const createData = {
        ...item,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const prepared = this.prepareForStorage(createData);
      batch.set(docRef, prepared);
      results.push(this.validate(createData));
    }
    
    await batch.commit();
    return results;
  }

  /**
   * Batch update
   */
  async batchUpdate(updates: Array<{ id: string; data: UpdateT }>): Promise<void> {
    const batch = this.db.batch();
    
    for (const update of updates) {
      const docRef = this.getDocRef(update.id);
      const updateData = {
        ...update.data,
        updatedAt: new Date()
      };
      
      const prepared = this.prepareForStorage(updateData);
      batch.update(docRef, prepared);
    }
    
    await batch.commit();
  }

  /**
   * Batch delete
   */
  async batchDelete(ids: string[]): Promise<void> {
    const batch = this.db.batch();
    
    for (const id of ids) {
      const docRef = this.getDocRef(id);
      batch.delete(docRef);
    }
    
    await batch.commit();
  }

  /**
   * Transaction support
   */
  async runTransaction<R>(
    updateFunction: (transaction: Transaction) => Promise<R>
  ): Promise<R> {
    return this.db.runTransaction(updateFunction);
  }

  /**
   * Listen to real-time changes
   */
  onSnapshot(
    callback: (data: T[]) => void,
    errorCallback?: (error: Error) => void,
    options: QueryOptions = {}
  ): () => void {
    let query: Query = this.getCollection();
    
    // Apply query options
    if (options.where) {
      options.where.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }
    
    if (options.orderBy) {
      options.orderBy.forEach(order => {
        query = query.orderBy(order.field, order.direction);
      });
    }
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    return query.onSnapshot(
      (snapshot: QuerySnapshot) => {
        const data = snapshot.docs.map(doc => {
          const docData = this.convertTimestamps(doc.data());
          return this.validate({ ...docData, id: doc.id });
        });
        callback(data);
      },
      errorCallback
    );
  }

  /**
   * Listen to single document changes
   */
  onDocumentSnapshot(
    id: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    return this.getDocRef(id).onSnapshot(
      (doc: DocumentSnapshot) => {
        if (doc.exists) {
          const data = this.convertTimestamps(doc.data());
          callback(this.validate({ ...data, id: doc.id }));
        } else {
          callback(null);
        }
      },
      errorCallback
    );
  }
}