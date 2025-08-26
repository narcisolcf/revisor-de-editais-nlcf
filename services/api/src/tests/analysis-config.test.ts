/**
 * Analysis Configuration API Tests
 * LicitaReview Cloud Functions
 */

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import request from "supertest";
import { AnalysisPreset, AnalysisWeights } from "../types";

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
  count: jest.fn(),
  batch: jest.fn(),
  FieldValue: {
    increment: jest.fn()
  }
};

const mockAuth = {
  verifyIdToken: jest.fn(),
  getUser: jest.fn()
};

jest.mock("../config/firebase", () => ({
  collections: {
    configs: mockFirestore
  },
  auth: mockAuth
}));

// Import the API after mocking
import { analysisConfigApi } from "../api/analysis-config";

describe("Analysis Configuration API", () => {
  const validToken = "valid-jwt-token";
  const mockUser = {
    uid: "test-user-id",
    email: "test@example.com",
    organizationId: "test-org-id",
    roles: ["org_admin"],
    permissions: ["config:read", "config:write"]
  };

  const mockConfig = {
    id: "test-config-id",
    organizationId: "test-org-id",
    organizationName: "Test Organization",
    weights: {
      structural: 25.0,
      legal: 25.0,
      clarity: 25.0,
      abnt: 25.0
    } as AnalysisWeights,
    presetType: AnalysisPreset.STANDARD,
    customRules: [],
    templates: [],
    version: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "test-user-id"
  };

  beforeEach(() => {
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

  describe("GET /configs/current", () => {
    it("should return current organization config", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: mockConfig.id,
              data: () => mockConfig
            }
          ]
        })
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const response = await request(analysisConfigApi)
        .get("/current")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockConfig.id);
      expect(response.body.data.organizationId).toBe(mockConfig.organizationId);
    });

    it("should create default config if none exists", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: []
        })
      };

      const mockDocRef = {
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue(mockQuery);
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .get("/current")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.presetType).toBe(AnalysisPreset.STANDARD);
      expect(mockDocRef.set).toHaveBeenCalled();
    });
  });

  describe("GET /configs/:id", () => {
    it("should return config by ID", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockConfig.id,
          data: () => mockConfig
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .get(`/${mockConfig.id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockConfig.id);
    });

    it("should return 404 for non-existent config", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: false
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .get("/non-existent-id")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /configs", () => {
    const createConfigRequest = {
      organizationId: "test-org-id",
      organizationName: "Test Organization",
      weights: {
        structural: 30.0,
        legal: 40.0,
        clarity: 20.0,
        abnt: 10.0
      },
      presetType: AnalysisPreset.RIGOROUS,
      customRules: [],
      createdBy: "test-user-id"
    };

    it("should create new config", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: true,
          docs: []
        })
      };

      const mockDocRef = {
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.collection.mockReturnValue(mockQuery);
      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createConfigRequest);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organizationId).toBe(createConfigRequest.organizationId);
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it("should validate weights sum to 100%", async () => {
      const invalidRequest = {
        ...createConfigRequest,
        weights: {
          structural: 30.0,
          legal: 30.0,
          clarity: 30.0,
          abnt: 20.0 // Total = 110%
        }
      };

      const response = await request(analysisConfigApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("100%");
    });

    it("should prevent duplicate active configs", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              id: "existing-config-id",
              data: () => ({ ...mockConfig, isActive: true })
            }
          ]
        })
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const response = await request(analysisConfigApi)
        .post("/")
        .set("Authorization", `Bearer ${validToken}`)
        .send(createConfigRequest);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already exists");
    });
  });

  describe("PUT /configs/:id", () => {
    const updateRequest = {
      organizationName: "Updated Organization Name",
      weights: {
        structural: 20.0,
        legal: 50.0,
        clarity: 20.0,
        abnt: 10.0
      }
    };

    it("should update existing config", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockConfig.id,
          data: () => mockConfig
        }),
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .put(`/${mockConfig.id}`)
        .set("Authorization", `Bearer ${validToken}`)
        .send(updateRequest);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.organizationName).toBe(updateRequest.organizationName);
      expect(response.body.data.version).toBe(mockConfig.version + 1);
      expect(mockDocRef.set).toHaveBeenCalled();
    });

    it("should validate updated weights", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockConfig.id,
          data: () => mockConfig
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const invalidUpdate = {
        weights: {
          structural: 25.0,
          legal: 25.0,
          clarity: 25.0,
          abnt: 30.0 // Total = 105%
        }
      };

      const response = await request(analysisConfigApi)
        .put(`/${mockConfig.id}`)
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /configs/:id/clone", () => {
    it("should clone existing config", async () => {
      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockConfig.id,
          data: () => mockConfig
        })
      };

      const mockNewDocRef = {
        set: jest.fn().mockResolvedValue(undefined)
      };

      mockFirestore.doc
        .mockReturnValueOnce(mockDocRef) // First call for getting source config
        .mockReturnValueOnce(mockNewDocRef); // Second call for setting cloned config

      const response = await request(analysisConfigApi)
        .post(`/${mockConfig.id}/clone`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe(mockConfig.version + 1);
      expect(response.body.data.isActive).toBe(false);
      expect(mockNewDocRef.set).toHaveBeenCalled();
    });
  });

  describe("GET /presets", () => {
    it("should return available presets", async () => {
      const response = await request(analysisConfigApi)
        .get("/presets")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      interface PresetData {
        preset: string;
        weights: {
          structural: number;
          legal: number;
          clarity: number;
          abnt: number;
        };
      }
      
      const standardPreset = response.body.data.find(
        (p: PresetData) => p.preset === AnalysisPreset.STANDARD
      );
      expect(standardPreset).toBeDefined();
      expect(standardPreset.weights).toEqual({
        structural: 25.0,
        legal: 25.0,
        clarity: 25.0,
        abnt: 25.0
      });
    });
  });

  describe("POST /validate-weights", () => {
    it("should validate correct weights", async () => {
      const validWeights = {
        structural: 25.0,
        legal: 25.0,
        clarity: 25.0,
        abnt: 25.0
      };

      const response = await request(analysisConfigApi)
        .post("/validate-weights")
        .set("Authorization", `Bearer ${validToken}`)
        .send(validWeights);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.total).toBe(100);
    });

    it("should reject incorrect weights", async () => {
      const invalidWeights = {
        structural: 30.0,
        legal: 30.0,
        clarity: 30.0,
        abnt: 30.0 // Total = 120%
      };

      const response = await request(analysisConfigApi)
        .post("/validate-weights")
        .set("Authorization", `Bearer ${validToken}`)
        .send(invalidWeights);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.total).toBe(120);
      expect(response.body.data.error).toContain("100%");
    });
  });

  describe("POST /test-rule", () => {
    it("should test regex pattern matching", async () => {
      const testData = {
        pattern: "lei\\s+14\\.133",
        text: "Este edital se baseia na Lei 14.133/2021",
        patternType: "regex"
      };

      const response = await request(analysisConfigApi)
        .post("/test-rule")
        .set("Authorization", `Bearer ${validToken}`)
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBe(true);
    });

    it("should test keyword pattern matching", async () => {
      const testData = {
        pattern: "sustentabilidade",
        text: "Critérios de sustentabilidade ambiental",
        patternType: "keyword"
      };

      const response = await request(analysisConfigApi)
        .post("/test-rule")
        .set("Authorization", `Bearer ${validToken}`)
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBe(true);
    });

    it("should handle invalid regex patterns", async () => {
      const testData = {
        pattern: "[invalid regex",
        text: "Test text",
        patternType: "regex"
      };

      const response = await request(analysisConfigApi)
        .post("/test-rule")
        .set("Authorization", `Bearer ${validToken}`)
        .send(testData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.matches).toBe(false);
      expect(response.body.data.error).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("should require appropriate permissions", async () => {
      const limitedUser = {
        ...mockUser,
        permissions: ["documents:read"] // No config permissions
      };

      mockAuth.getUser.mockResolvedValue({
        uid: limitedUser.uid,
        email: limitedUser.email,
        customClaims: {
          organizationId: limitedUser.organizationId,
          roles: limitedUser.roles,
          permissions: limitedUser.permissions
        }
      });

      const response = await request(analysisConfigApi)
        .get("/current")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("permissions");
    });

    it("should prevent cross-organization access", async () => {
      const otherOrgConfig = {
        ...mockConfig,
        organizationId: "other-org-id"
      };

      const mockDocRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          id: mockConfig.id,
          data: () => otherOrgConfig
        })
      };

      mockFirestore.doc.mockReturnValue(mockDocRef);

      const response = await request(analysisConfigApi)
        .get(`/${mockConfig.id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Access denied");
    });
  });

  describe("Error Handling", () => {
    it("should handle Firestore errors", async () => {
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockRejectedValue(new Error("Firestore error"))
      };

      mockFirestore.collection.mockReturnValue(mockQuery);

      const response = await request(analysisConfigApi)
        .get("/current")
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });
});