/**
 * Firestore Schema: Documents Collection
 * 
 * Collection: /documents/{docId}/
 * Structure for document-level data including metadata, analyses, versions, and comments
 */

import { z } from 'zod';

// Document Metadata Schema
export const DocumentMetadataSchema = z.object({
  // Basic Information
  id: z.string(),
  organizationId: z.string(),
  title: z.string().min(1, 'Document title is required'),
  description: z.string().optional(),
  
  // Document Classification
  documentType: z.enum([
    'EDITAL',
    'TERMO_REFERENCIA',
    'ATA_SESSAO', 
    'CONTRATO',
    'PROJETO_BASICO',
    'RECURSO',
    'IMPUGNACAO',
    'ESCLARECIMENTO'
  ]),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  
  // File Information
  file: z.object({
    originalName: z.string(),
    filename: z.string(), // Stored filename
    mimeType: z.string(),
    size: z.number().int().positive(),
    extension: z.string(),
    
    // Storage Information
    storagePath: z.string(),
    downloadURL: z.string().url(),
    
    // File Processing
    checksum: z.string().optional(), // MD5 or SHA256
    encoding: z.string().optional(),
    
    // OCR Results
    extractedText: z.string().optional(),
    ocrConfidence: z.number().min(0).max(1).optional(),
    pageCount: z.number().int().min(1).optional()
  }),
  
  // Document Status
  status: z.enum([
    'UPLOADED',
    'PROCESSING', 
    'ANALYZED',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'ARCHIVED',
    'DELETED'
  ]).default('UPLOADED'),
  
  // Processing Information
  processing: z.object({
    currentStep: z.string().optional(),
    progress: z.number().min(0).max(100).default(0),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    estimatedCompletion: z.date().optional(),
    
    // Error Handling
    errors: z.array(z.object({
      code: z.string(),
      message: z.string(),
      timestamp: z.date(),
      step: z.string().optional()
    })).default([]),
    
    // Processing Metrics
    metrics: z.object({
      ocrTime: z.number().optional(), // milliseconds
      analysisTime: z.number().optional(),
      totalProcessingTime: z.number().optional()
    }).optional()
  }).optional(),
  
  // Template Reference
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  
  // Tags & Classification
  tags: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  
  // Compliance & Legal
  compliance: z.object({
    requiredByLaw: z.boolean().default(false),
    legalBasis: z.array(z.string()).default([]), // Legal references
    complianceStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'UNDER_REVIEW']).optional(),
    expirationDate: z.date().optional(),
    retentionPeriod: z.number().int().positive().optional() // days
  }).optional(),
  
  // Workflow Information
  workflow: z.object({
    currentStage: z.string().optional(),
    assignedTo: z.string().optional(), // User ID
    dueDate: z.date().optional(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    
    // Approval Chain
    approvers: z.array(z.object({
      userId: z.string(),
      role: z.string(),
      required: z.boolean(),
      approvedAt: z.date().optional(),
      comments: z.string().optional()
    })).default([])
  }).optional(),
  
  // Statistics
  statistics: z.object({
    viewCount: z.number().int().min(0).default(0),
    downloadCount: z.number().int().min(0).default(0),
    analysisCount: z.number().int().min(0).default(0),
    commentCount: z.number().int().min(0).default(0),
    shareCount: z.number().int().min(0).default(0),
    
    // Timing Statistics
    averageReviewTime: z.number().optional(), // minutes
    lastViewed: z.date().optional(),
    lastDownloaded: z.date().optional()
  }).optional(),
  
  // Security & Access
  security: z.object({
    accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED', 'CONFIDENTIAL']).default('INTERNAL'),
    encryptionStatus: z.boolean().default(false),
    
    // Access Control
    allowedRoles: z.array(z.string()).default([]),
    allowedUsers: z.array(z.string()).default([]),
    
    // Audit Requirements
    auditRequired: z.boolean().default(false),
    dataClassification: z.string().optional()
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Version Control
  version: z.string().default('1.0.0'),
  parentDocumentId: z.string().optional(), // For document revisions
  
  // Metadata
  metadata: z.record(z.any()).optional()
});

// Analysis Result Schema
export const AnalysisResultSchema = z.object({
  // Basic Information
  id: z.string(),
  documentId: z.string(),
  organizationId: z.string(),
  
  // Analysis Configuration
  analysisType: z.enum(['FULL', 'QUICK', 'CUSTOM', 'COMPLIANCE_ONLY']),
  configurationId: z.string(), // Custom parameters used
  templateId: z.string().optional(),
  
  // 🚀 CORE: Weighted Scoring System
  scores: z.object({
    overall: z.number().min(0).max(100),
    
    // Category Scores
    structural: z.number().min(0).max(100),
    legal: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    abnt: z.number().min(0).max(100),
    
    // Weighted Scores (using organization weights)
    weightedStructural: z.number().min(0).max(100),
    weightedLegal: z.number().min(0).max(100),
    weightedClarity: z.number().min(0).max(100),
    weightedAbnt: z.number().min(0).max(100),
    
    // Confidence Metrics
    confidence: z.number().min(0).max(1),
    reliability: z.number().min(0).max(1).optional()
  }),
  
  // Analysis Results
  results: z.object({
    // Problems Found
    problems: z.array(z.object({
      id: z.string(),
      ruleId: z.string().optional(),
      category: z.enum(['ESTRUTURAL', 'JURIDICO', 'CLAREZA', 'ABNT', 'CONFORMIDADE', 'COMPLETUDE']),
      severity: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
      
      // Problem Details
      title: z.string(),
      description: z.string(),
      suggestion: z.string().optional(),
      
      // Location Information
      location: z.object({
        page: z.number().int().positive().optional(),
        paragraph: z.number().int().positive().optional(),
        section: z.string().optional(),
        startPosition: z.number().int().optional(),
        endPosition: z.number().int().optional(),
        context: z.string().optional() // Surrounding text
      }).optional(),
      
      // Problem Metadata
      impact: z.number().min(0).max(10),
      confidence: z.number().min(0).max(1),
      autoFixAvailable: z.boolean().default(false),
      
      // Resolution
      status: z.enum(['OPEN', 'ACKNOWLEDGED', 'FIXED', 'IGNORED', 'FALSE_POSITIVE']).default('OPEN'),
      resolvedBy: z.string().optional(),
      resolvedAt: z.date().optional(),
      resolution: z.string().optional()
    })),
    
    // Recommendations
    recommendations: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      category: z.string(),
      
      // Implementation
      actionRequired: z.string(),
      estimatedEffort: z.string().optional(), // "5 minutes", "1 hour", etc.
      
      // Benefits
      expectedImprovement: z.number().min(0).max(100).optional(),
      complianceImprovement: z.boolean().default(false)
    })),
    
    // Compliance Check
    compliance: z.object({
      overallCompliance: z.number().min(0).max(100),
      requiredItems: z.array(z.object({
        item: z.string(),
        present: z.boolean(),
        location: z.string().optional(),
        notes: z.string().optional()
      })),
      missingRequirements: z.array(z.string()),
      additionalNotes: z.string().optional()
    }).optional(),
    
    // Quality Metrics
    quality: z.object({
      readability: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
      completeness: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      
      // Detailed Metrics
      averageSentenceLength: z.number().optional(),
      complexWordsPercentage: z.number().min(0).max(100).optional(),
      passiveVoicePercentage: z.number().min(0).max(100).optional(),
      
      // Text Statistics
      wordCount: z.number().int().min(0),
      sentenceCount: z.number().int().min(0),
      paragraphCount: z.number().int().min(0)
    }).optional()
  }),
  
  // Analysis Metadata
  analysis: z.object({
    // Timing Information
    startedAt: z.date(),
    completedAt: z.date(),
    duration: z.number().min(0), // milliseconds
    
    // Processing Details
    engine: z.string().default('licitareview-v1'),
    engineVersion: z.string().default('1.0.0'),
    
    // Resource Usage
    resourceUsage: z.object({
      cpuTime: z.number().optional(), // milliseconds
      memoryUsed: z.number().optional(), // bytes
      apiCallsCount: z.number().int().min(0).optional()
    }).optional(),
    
    // Analysis Statistics
    rulesApplied: z.number().int().min(0),
    patternsMatched: z.number().int().min(0),
    sectionsAnalyzed: z.number().int().min(0)
  }),
  
  // Status
  status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']).default('RUNNING'),
  
  // Error Information
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional(),
    stack: z.string().optional()
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  createdBy: z.string()
});

// Document Version Schema
export const DocumentVersionSchema = z.object({
  // Basic Information
  id: z.string(),
  documentId: z.string(),
  versionNumber: z.string(), // e.g., "1.0.0", "1.1.0"
  
  // Version Details
  title: z.string().optional(),
  description: z.string().optional(),
  changeLog: z.string().optional(),
  
  // File Information
  file: z.object({
    filename: z.string(),
    size: z.number().int().positive(),
    checksum: z.string(),
    storagePath: z.string(),
    downloadURL: z.string().url()
  }),
  
  // Version Type
  versionType: z.enum(['MAJOR', 'MINOR', 'PATCH', 'DRAFT']),
  
  // Comparison Data
  changes: z.object({
    addedSections: z.array(z.string()).default([]),
    modifiedSections: z.array(z.string()).default([]),
    deletedSections: z.array(z.string()).default([]),
    
    // Text Changes
    addedText: z.number().int().min(0).default(0), // characters
    deletedText: z.number().int().min(0).default(0),
    modifiedText: z.number().int().min(0).default(0),
    
    // Change Summary
    changePercentage: z.number().min(0).max(100).optional(),
    significantChanges: z.boolean().default(false)
  }).optional(),
  
  // Status
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'DEPRECATED']).default('DRAFT'),
  isActive: z.boolean().default(false), // Only one version can be active
  
  // Approval Information
  approval: z.object({
    required: z.boolean().default(false),
    approvedBy: z.string().optional(),
    approvedAt: z.date().optional(),
    approvalNotes: z.string().optional()
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
});

// Review Comment Schema
export const ReviewCommentSchema = z.object({
  // Basic Information
  id: z.string(),
  documentId: z.string(),
  organizationId: z.string(),
  
  // Comment Details
  content: z.string().min(1, 'Comment content is required'),
  type: z.enum(['GENERAL', 'SUGGESTION', 'ISSUE', 'APPROVAL', 'QUESTION']),
  
  // Location Information
  location: z.object({
    page: z.number().int().positive().optional(),
    section: z.string().optional(),
    paragraph: z.number().int().positive().optional(),
    
    // Text Selection
    startPosition: z.number().int().optional(),
    endPosition: z.number().int().optional(),
    selectedText: z.string().optional(),
    
    // Visual Coordinates (for annotations)
    coordinates: z.object({
      x: z.number(),
      y: z.number(),
      width: z.number().optional(),
      height: z.number().optional()
    }).optional()
  }).optional(),
  
  // Threading
  parentCommentId: z.string().optional(), // For reply threads
  threadId: z.string().optional(),
  
  // Status & Resolution
  status: z.enum(['OPEN', 'RESOLVED', 'ACKNOWLEDGED', 'DISMISSED']).default('OPEN'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  
  // Resolution Information
  resolution: z.object({
    resolvedBy: z.string(),
    resolvedAt: z.date(),
    resolution: z.string(),
    actionTaken: z.string().optional()
  }).optional(),
  
  // Metadata
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'PRIVATE']).default('INTERNAL'),
  mentions: z.array(z.string()).default([]), // User IDs mentioned
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number().int().positive(),
    mimeType: z.string()
  })).default([]),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
});

// Type exports
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type ReviewComment = z.infer<typeof ReviewCommentSchema>;

// Collection References
export const DOCUMENT_COLLECTIONS = {
  METADATA: 'metadata',
  ANALYSES: 'analyses',
  VERSIONS: 'versions',
  COMMENTS: 'comments'
} as const;