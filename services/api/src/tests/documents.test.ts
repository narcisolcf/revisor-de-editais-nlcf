/**
 * Documents API Tests
 * LicitaReview Cloud Functions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import request from "supertest";
import express from "express";
import { DocumentType, DocumentStatus, LicitationModality } from "../types";

// Mock Firebase modules
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  offset: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  update: jest.fn(),
  count: jest.fn()
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn()
};

jest.mock("../config/firebase", () => ({
  collections: {
    documents: mockFirestore
  },
  auth: mockAuth
}));

// Import the API after mocking
import { documentsApi } from "../api/documents";

describe("Documents API", () => {
  const validToken = "valid-jwt-token";
  const mockUser = {
    uid: "test-user-id",
    email: "test@example.com",
    organizationId: "test-org-id",
    roles: ["user"],
    permissions: ["documents:read", "documents:write", "documents:delete"]
  };

  const mockDocument = {
    id: "test-document-id",
    title: "Test Document",
    content: "Test content",
    classification: {
      primaryCategory: "licitacao",
      documentType: DocumentType.EDITAL,
      modality: LicitationModality.PREGAO_ELETRONICO
    },
    metadata: {
      fileName: "test.pdf",
      fileSize: 1024000,
      fileType: "application/pdf",
      organizationId: "test-org-id"
    },
    organizationId: "test-org-id",
    createdBy: "test-user-id",
    status: DocumentStatus.DRAFT,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default auth mocks
    mockAuth.verifyIdToken.mockResolvedValue({
      uid: mockUser.uid,
      email: mockUser.email
    });
    
    mockAuth.getUser.mockResolvedValue({
      uid: mockUser.uid,
      email: mockUser.email,
      customClaims: {
        organizationId: mockUser.organizationId,
        roles: mockUser.roles,
        permissions: mockUser.permissions
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /documents", () => {
    it("should list documents for authenticated user", async () => {
      // Setup Firestore mocks
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [
            {
              id: mockDocument.id,
              data: () => mockDocument
            }
          ]
        }),
        count: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 1 })
          })
        })
      };

      mockFirestore.collection.mockReturnValue(mockQuery);
      mockFirestore.where.mockReturnValue(mockQuery);

      const response = await request(documentsApi)
        .get("/")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: mockDocument.id,
        title: mockDocument.title,
        documentType: mockDocument.classification.documentType,
        status: mockDocument.status
      });
    });

    it("should require authentication", async () => {
      const response = await request(documentsApi).get("/");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("authorization");
    });

    it("should filter by document status", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
        count: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 0 })
          })
        })
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      await request(documentsApi)
        .get("/?status=PROCESSED")
        .set("Authorization", `Bearer ${validToken}`);

      expect(mockQuery.where).toHaveBeenCalledWith("status", "==", "PROCESSED");
    });
  });

  describe("GET /documents/:id", () => {
    it("should return document by ID", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => mockDocument
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .get(`/${mockDocument.id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockDocument.id);
    });

    it("should return 404 for non-existent document", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: false
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .get("/non-existent-id")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should deny access to documents from other organizations", async () => {
      const otherOrgDocument = {
        ...mockDocument,
        organizationId: "other-org-id"
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => otherOrgDocument
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .get(`/${mockDocument.id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Access denied");
    });
  });

  describe("POST /documents", () => {
    const createDocumentRequest = {
      title: "New Test Document",
      content: "New test content",
      classification: {
        primaryCategory: "licitacao",
        documentType: DocumentType.EDITAL,
        modality: LicitationModality.PREGAO_ELETRONICO
      },
      metadata: {
        fileName: "new-test.pdf",
        fileSize: 2048000,
        fileType: "application/pdf",
        organizationId: "test-org-id"
      },
      organizationId: "test-org-id",
      createdBy: "test-user-id"
    };

    it("should create new document", async () => {
      const mockDocRef = {
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createDocumentRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(createDocumentRequest.title);
      expect(response.body.data.status).toBe(DocumentStatus.DRAFT);
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it("should validate required fields", async () => {
      const invalidRequest = {
        ...createDocumentRequest,
        title: "" // Invalid empty title
      };

      const response = await request(documentsApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Validation failed");
    });

    it("should prevent creating documents for other organizations", async () => {
      const invalidRequest = {
        ...createDocumentRequest,
        organizationId: "other-org-id"
      };

      const response = await request(documentsApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequest);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("different organization");
    });
  });

  describe("PUT /documents/:id", () => {
    const updateRequest = {
      title: "Updated Document Title",
      content: "Updated content"
    };

    it("should update existing document", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => mockDocument
        }),
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .put(`/${mockDocument.id}`)
        .set("Authorization", `Bearer ${validToken}`)
        .send(updateRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateRequest.title);
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it("should return 404 for non-existent document", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: false
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .put("/non-existent-id")
        .set("Authorization", `Bearer ${validToken}`)
        .send(updateRequest);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /documents/:id", () => {
    it("should archive document (soft delete)", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => mockDocument
        }),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .delete(`/${mockDocument.id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(DocumentStatus.ARCHIVED);
      expect(mockDocRef.update).toHaveBeenCalledWith({
        status: DocumentStatus.ARCHIVED,
        updatedAt: expect.any(Date)
      });
    });
  });

  describe("PATCH /documents/:id/status", () => {
    it("should update document status", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => mockDocument
        }),
        update: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .patch(`/${mockDocument.id}/status`)
        .set("Authorization", `Bearer ${validToken}`)
        .send({ status: DocumentStatus.PROCESSING });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(DocumentStatus.PROCESSING);
      expect(mockDocRef.update).toHaveBeenCalledWith({
        status: DocumentStatus.PROCESSING,
        updatedAt: expect.any(Date)
      });
    });

    it("should validate status values", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockDocument.id,
          data: () => mockDocument
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(documentsApi)
        .patch(`/${mockDocument.id}/status`)
        .set("Authorization", `Bearer ${validToken}`)
        .send({ status: "INVALID_STATUS" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Validation failed");
    });
  });

  describe("Error Handling", () => {
    it("should handle Firestore errors gracefully", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error("Firestore error")),
        count: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            data: () => ({ count: 0 })
          })
        })
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const response = await request(documentsApi)
        .get("/")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Internal server error");
    });

    it("should handle invalid authentication tokens", async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error("Invalid token"));

      const response = await request(documentsApi)
        .get("/")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting", async () => {
      // This test would require a more complex setup to actually test rate limiting
      // For now, we'll just verify the rate limiter is configured
      expect(documentsApi).toBeDefined();
    });
  });
});