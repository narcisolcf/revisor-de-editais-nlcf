/**
 * Testes unitários para DocumentRepository
 * LicitaReview - Sistema de Análise de Editais
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { testData } from '../setup';

// Mock do Firestore
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  batch: jest.fn(),
  runTransaction: jest.fn()
};

const mockCollection = {
  doc: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn()
};

const mockDoc = {
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  id: 'mock-doc-id'
};

const mockQuery = {
  get: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  endBefore: jest.fn()
};

const mockQuerySnapshot = {
  docs: [],
  empty: false,
  size: 0,
  forEach: jest.fn()
};

const mockDocSnapshot = {
  exists: true,
  id: 'mock-doc-id',
  data: jest.fn(),
  ref: mockDoc
};

// Mock do firebase-admin
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: () => mockFirestore
}));

describe('DocumentRepository', () => {
  let repository: DocumentRepository;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock chain
    mockFirestore.collection.mockReturnValue(mockCollection);
    mockCollection.doc.mockReturnValue(mockDoc);
    mockCollection.where.mockReturnValue(mockQuery);
    mockCollection.orderBy.mockReturnValue(mockQuery);
    mockCollection.limit.mockReturnValue(mockQuery);
    mockQuery.where.mockReturnValue(mockQuery);
    mockQuery.orderBy.mockReturnValue(mockQuery);
    mockQuery.limit.mockReturnValue(mockQuery);
    mockQuery.startAfter.mockReturnValue(mockQuery);
    mockQuery.endBefore.mockReturnValue(mockQuery);
    mockQuery.get.mockResolvedValue(mockQuerySnapshot);
    mockDoc.get.mockResolvedValue(mockDocSnapshot);

    repository = new DocumentRepository();
  });

  describe('create', () => {
    it('deve criar um novo documento com sucesso', async () => {
      // Arrange
      const documentData = {
        ...testData.document,
        id: undefined // Remove ID para criação
      };

      mockCollection.add.mockResolvedValue({
        id: 'new-document-id'
      });

      // Act
      const result = await repository.create(documentData);

      // Assert
      expect(result).toBe('new-document-id');
      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockCollection.add).toHaveBeenCalledWith({
        ...documentData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });

    it('deve lidar com erros de criação', async () => {
      // Arrange
      const documentData = { ...testData.document };
      const error = new Error('Firestore error');
      mockCollection.add.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.create(documentData)).rejects.toThrow('Firestore error');
    });
  });

  describe('findById', () => {
    it('deve encontrar documento por ID', async () => {
      // Arrange
      const documentId = 'test-document-id';
      mockDocSnapshot.exists = true;
      mockDocSnapshot.data.mockReturnValue(testData.document);

      // Act
      const result = await repository.findById(documentId);

      // Assert
      expect(result).toEqual({
        id: mockDocSnapshot.id,
        ...testData.document
      });
      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockCollection.doc).toHaveBeenCalledWith(documentId);
      expect(mockDoc.get).toHaveBeenCalled();
    });

    it('deve retornar null para documento inexistente', async () => {
      // Arrange
      const documentId = 'non-existent-id';
      mockDocSnapshot.exists = false;

      // Act
      const result = await repository.findById(documentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar documento existente', async () => {
      // Arrange
      const documentId = 'test-document-id';
      const updateData = {
        title: 'Título Atualizado',
        status: 'processed' as const
      };

      mockDoc.update.mockResolvedValue(undefined);

      // Act
      await repository.update(documentId, updateData);

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockCollection.doc).toHaveBeenCalledWith(documentId);
      expect(mockDoc.update).toHaveBeenCalledWith({
        ...updateData,
        updatedAt: expect.any(Date)
      });
    });

    it('deve lidar com erros de atualização', async () => {
      // Arrange
      const documentId = 'test-document-id';
      const updateData = { title: 'Novo Título' };
      const error = new Error('Update failed');
      mockDoc.update.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.update(documentId, updateData))
        .rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('deve deletar documento por ID', async () => {
      // Arrange
      const documentId = 'test-document-id';
      mockDoc.delete.mockResolvedValue(undefined);

      // Act
      await repository.delete(documentId);

      // Assert
      expect(mockFirestore.collection).toHaveBeenCalledWith('documents');
      expect(mockCollection.doc).toHaveBeenCalledWith(documentId);
      expect(mockDoc.delete).toHaveBeenCalled();
    });

    it('deve lidar com erros de deleção', async () => {
      // Arrange
      const documentId = 'test-document-id';
      const error = new Error('Delete failed');
      mockDoc.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.delete(documentId)).rejects.toThrow('Delete failed');
    });
  });

  describe('findByOrganization', () => {
    it('deve encontrar documentos por organização', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({ ...testData.document, organizationId })
        },
        {
          id: 'doc2',
          data: () => ({ ...testData.document, organizationId })
        }
      ];

      mockQuerySnapshot.docs = mockDocs;
      mockQuerySnapshot.empty = false;
      mockQuerySnapshot.size = 2;

      // Act
      const result = await repository.findByOrganization(organizationId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'doc1',
        ...testData.document,
        organizationId
      });
      expect(mockCollection.where).toHaveBeenCalledWith('organizationId', '==', organizationId);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('deve retornar array vazio quando não há documentos', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      mockQuerySnapshot.docs = [];
      mockQuerySnapshot.empty = true;
      mockQuerySnapshot.size = 0;

      // Act
      const result = await repository.findByOrganization(organizationId);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('findByStatus', () => {
    it('deve encontrar documentos por status', async () => {
      // Arrange
      const status = 'processing';
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({ ...testData.document, status })
        }
      ];

      mockQuerySnapshot.docs = mockDocs;
      mockQuerySnapshot.size = 1;

      // Act
      const result = await repository.findByStatus(status);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(status);
      expect(mockCollection.where).toHaveBeenCalledWith('status', '==', status);
    });
  });

  describe('findByDateRange', () => {
    it('deve encontrar documentos por intervalo de datas', async () => {
      // Arrange
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({ ...testData.document, createdAt: new Date('2024-01-15') })
        }
      ];

      mockQuerySnapshot.docs = mockDocs;
      mockQuerySnapshot.size = 1;

      // Act
      const result = await repository.findByDateRange(startDate, endDate);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockCollection.where).toHaveBeenCalledWith('createdAt', '>=', startDate);
      expect(mockQuery.where).toHaveBeenCalledWith('createdAt', '<=', endDate);
    });
  });

  describe('searchByTitle', () => {
    it('deve buscar documentos por título', async () => {
      // Arrange
      const searchTerm = 'edital';
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({ ...testData.document, title: 'Edital de Obras Públicas' })
        }
      ];

      mockQuerySnapshot.docs = mockDocs;
      mockQuerySnapshot.size = 1;

      // Act
      const result = await repository.searchByTitle(searchTerm);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Edital');
      // Verifica se a busca foi feita com os termos corretos
      expect(mockCollection.where).toHaveBeenCalledWith(
        'title',
        '>=',
        searchTerm.toLowerCase()
      );
      expect(mockQuery.where).toHaveBeenCalledWith(
        'title',
        '<=',
        searchTerm.toLowerCase() + '\uf8ff'
      );
    });
  });

  describe('getStatistics', () => {
    it('deve retornar estatísticas dos documentos', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      
      // Mock para diferentes status
      const mockProcessingDocs = { size: 5 };
      const mockCompletedDocs = { size: 10 };
      const mockFailedDocs = { size: 2 };

      mockQuery.get
        .mockResolvedValueOnce(mockProcessingDocs)
        .mockResolvedValueOnce(mockCompletedDocs)
        .mockResolvedValueOnce(mockFailedDocs);

      // Act
      const result = await repository.getStatistics(organizationId);

      // Assert
      expect(result).toEqual({
        total: 17,
        processing: 5,
        completed: 10,
        failed: 2,
        pending: 0
      });
    });
  });

  describe('pagination', () => {
    it('deve implementar paginação corretamente', async () => {
      // Arrange
      const organizationId = 'test-org-id';
      const limit = 10;
      const lastDocId = 'last-doc-id';

      const mockLastDoc = {
        id: lastDocId,
        data: () => testData.document
      };

      mockDoc.get.mockResolvedValue(mockLastDoc);
      mockQuerySnapshot.docs = [mockLastDoc];

      // Act
      await repository.findByOrganization(
        organizationId,
        { limit, lastDocId }
      );

      // Assert
      expect(mockCollection.where).toHaveBeenCalledWith('organizationId', '==', organizationId);
      expect(mockQuery.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(mockQuery.limit).toHaveBeenCalledWith(limit);
      expect(mockQuery.startAfter).toHaveBeenCalledWith(mockLastDoc);
    });
  });

  describe('batch operations', () => {
    it('deve executar operações em lote', async () => {
      // Arrange
      const documents = [
        { ...testData.document, id: 'doc1' },
        { ...testData.document, id: 'doc2' }
      ];

      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.batch.mockReturnValue(mockBatch);

      // Act
      await repository.batchUpdate(documents);

      // Assert
      expect(mockFirestore.batch).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('deve lidar com erros em operações batch', async () => {
      // Arrange
      const documents = [{ ...testData.document, id: 'doc1' }];
      const error = new Error('Batch operation failed');

      const mockBatch = {
        update: jest.fn(),
        commit: jest.fn().mockRejectedValue(error)
      };

      mockFirestore.batch.mockReturnValue(mockBatch);

      // Act & Assert
      await expect(repository.batchUpdate(documents))
        .rejects.toThrow('Batch operation failed');
    });
  });

  describe('transaction operations', () => {
    it('deve executar operações transacionais', async () => {
      // Arrange
      const documentId = 'test-doc-id';
      const updateData = { status: 'completed' as const };

      const mockTransaction = {
        get: jest.fn().mockResolvedValue(mockDocSnapshot),
        update: jest.fn()
      };

      mockFirestore.runTransaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      // Act
      await repository.updateWithTransaction(documentId, updateData);

      // Assert
      expect(mockFirestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.get).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalledWith(
        mockDoc,
        expect.objectContaining(updateData)
      );
    });
  });

  describe('error handling', () => {
    it('deve mapear erros do Firestore corretamente', async () => {
      // Arrange
      const firestoreError = {
        code: 'permission-denied',
        message: 'Missing or insufficient permissions'
      };

      mockDoc.get.mockRejectedValue(firestoreError);

      // Act & Assert
      await expect(repository.findById('test-id'))
        .rejects.toMatchObject({
          code: 'permission-denied',
          message: expect.stringContaining('permissions')
        });
    });

    it('deve lidar com timeouts', async () => {
      // Arrange
      const timeoutError = {
        code: 'deadline-exceeded',
        message: 'Deadline exceeded'
      };

      mockDoc.get.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(repository.findById('test-id'))
        .rejects.toMatchObject({
          code: 'deadline-exceeded'
        });
    });
  });
});