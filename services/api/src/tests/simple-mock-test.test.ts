/**
 * Teste simples para verificar se o mock do Firestore está funcionando
 */

import { describe, it, expect } from '@jest/globals';
import { mockFirestore } from './setup';

describe('Teste Simples do Mock Firestore', () => {
  it('deve ter mockFirestore definido', () => {
    console.log('🔧 mockFirestore:', mockFirestore);
    console.log('🔧 mockFirestore.collection:', mockFirestore?.collection);
    
    expect(mockFirestore).toBeDefined();
    expect(mockFirestore.collection).toBeDefined();
  });
  
  it('deve retornar uma coleção válida', () => {
    const collection = mockFirestore.collection('test');
    console.log('🔧 collection:', collection);
    console.log('🔧 collection.doc:', collection?.doc);
    
    expect(collection).toBeDefined();
    expect(collection.doc).toBeDefined();
  });
  
  it('deve retornar um documento válido', () => {
    const collection = mockFirestore.collection('test');
    const doc = collection.doc('test-doc');
    console.log('🔧 doc:', doc);
    
    expect(doc).toBeDefined();
    expect(doc.id).toBe('test-doc');
  });
});