/**
 * Firestore Schema: Organizations Collection
 * 
 * Collection: /organizations/{orgId}/
 * Structure for organization-level data including profile, templates, rules, and parameters
 */

import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';

// Base Organization Profile Schema
export const OrganizationProfileSchema = z.object({
  // Basic Information
  id: z.string(),
  name: z.string().min(1, 'Organization name is required'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  
  // Government Information
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Invalid CNPJ format'),
  governmentLevel: z.enum(['FEDERAL', 'ESTADUAL', 'MUNICIPAL']),
  organizationType: z.enum([
    'TRIBUNAL_CONTAS',
    'PREFEITURA', 
    'GOVERNO_ESTADUAL',
    'MINISTERIO',
    'AUTARQUIA',
    'FUNDACAO',
    'EMPRESA_PUBLICA',
    'OUTROS'
  ]),
  
  // Contact Information
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string().default('BR')
    }).optional()
  }),
  
  // Settings
  settings: z.object({
    timezone: z.string().default('America/Sao_Paulo'),
    language: z.string().default('pt-BR'),
    defaultAnalysisPreset: z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']).default('STANDARD'),
    enableAIAnalysis: z.boolean().default(true),
    enableCustomRules: z.boolean().default(true),
    strictMode: z.boolean().default(false),
    autoApproval: z.boolean().default(false),
    requireDualApproval: z.boolean().default(false),
    retentionDays: z.number().int().positive().default(365),
    maxDocumentSize: z.number().positive().default(52428800), // 50MB
    allowedDocumentTypes: z.array(z.string()).default(['pdf', 'doc', 'docx'])
  }),
  
  // Status & Metadata
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_APPROVAL']).default('PENDING_APPROVAL'),
  subscriptionTier: z.enum(['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']).default('FREE'),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([])
});

// Document Template Schema
export const DocumentTemplateSchema = z.object({
  // Basic Information
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  
  // Template Configuration
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
  
  // Template Structure
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    order: z.number().int().min(0),
    required: z.boolean().default(false),
    
    // Field Definitions
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'MULTISELECT', 'FILE']),
      required: z.boolean().default(false),
      description: z.string().optional(),
      placeholder: z.string().optional(),
      validation: z.object({
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        options: z.array(z.string()).optional()
      }).optional(),
      defaultValue: z.any().optional()
    })),
    
    // Validation Rules for Section
    validationRules: z.array(z.string()).default([]),
    conditionalLogic: z.record(z.any()).optional()
  })),
  
  // Template Rules
  analysisRules: z.array(z.string()).default([]), // References to analysis rule IDs
  requiredFields: z.array(z.string()).default([]),
  
  // Status & Metadata  
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED']).default('DRAFT'),
  isDefault: z.boolean().default(false),
  isPublic: z.boolean().default(false), // Can be shared with other orgs
  
  // Usage Statistics
  usage: z.object({
    documentsCreated: z.number().int().min(0).default(0),
    lastUsed: z.date().optional(),
    averageCompletionTime: z.number().optional() // in minutes
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([])
});

// Analysis Rule Schema  
export const AnalysisRuleSchema = z.object({
  // Basic Information
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1, 'Rule name is required'),
  description: z.string(),
  
  // Rule Configuration
  category: z.enum(['ESTRUTURAL', 'JURIDICO', 'CLAREZA', 'ABNT', 'CONFORMIDADE', 'COMPLETUDE']),
  severity: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
  
  // Pattern Matching
  pattern: z.string(), // Regex or keyword pattern
  patternType: z.enum(['regex', 'keyword', 'phrase', 'nlp']).default('regex'),
  caseSensitive: z.boolean().default(false),
  
  // Rule Logic
  condition: z.object({
    type: z.enum(['CONTAINS', 'NOT_CONTAINS', 'MATCHES', 'NOT_MATCHES', 'CUSTOM']),
    value: z.string(),
    flags: z.array(z.string()).optional()
  }),
  
  // Action Configuration
  action: z.object({
    type: z.enum(['FLAG', 'SUGGEST', 'AUTO_FIX', 'BLOCK']),
    message: z.string(),
    suggestion: z.string().optional(),
    autoFixTemplate: z.string().optional()
  }),
  
  // Applicability
  appliesToDocumentTypes: z.array(z.string()).optional(),
  appliesToSections: z.array(z.string()).optional(),
  
  // Rule Weighting
  weight: z.number().min(0).max(10).default(1),
  priority: z.number().int().min(1).max(5).default(3),
  
  // Advanced Configuration
  enabled: z.boolean().default(true),
  testMode: z.boolean().default(false), // For testing rules without affecting scores
  
  // Performance & Statistics
  performance: z.object({
    executionCount: z.number().int().min(0).default(0),
    averageExecutionTime: z.number().min(0).default(0), // milliseconds
    falsePositiveRate: z.number().min(0).max(1).optional(),
    lastExecuted: z.date().optional()
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([])
});

// Custom Parameters Schema (🚀 CORE DIFFERENTIATOR)
export const CustomParametersSchema = z.object({
  // Basic Information
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1, 'Configuration name is required'),
  description: z.string().optional(),
  version: z.string().default('1.0.0'),
  
  // Analysis Weights (Must sum to 100%)
  weights: z.object({
    structural: z.number().min(0).max(100),
    legal: z.number().min(0).max(100), 
    clarity: z.number().min(0).max(100),
    abnt: z.number().min(0).max(100)
  }).refine(
    (data) => {
      const total = data.structural + data.legal + data.clarity + data.abnt;
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: 'Analysis weights must sum to exactly 100%',
      path: ['weights']
    }
  ),
  
  // Preset Configuration
  presetType: z.enum(['RIGOROUS', 'STANDARD', 'TECHNICAL', 'FAST', 'CUSTOM']),
  
  // Scoring Thresholds
  thresholds: z.object({
    excellent: z.number().min(0).max(100).default(90),
    good: z.number().min(0).max(100).default(75),
    acceptable: z.number().min(0).max(100).default(60),
    poor: z.number().min(0).max(100).default(40),
    critical: z.number().min(0).max(100).default(25)
  }),
  
  // Advanced Settings
  advanced: z.object({
    enableContextualAnalysis: z.boolean().default(true),
    enableSemanticAnalysis: z.boolean().default(false),
    strictCompliance: z.boolean().default(false),
    autoCorrection: z.boolean().default(false),
    
    // Timeout Settings
    analysisTimeout: z.number().int().min(30).max(600).default(300), // seconds
    maxRetries: z.number().int().min(0).max(5).default(3),
    
    // Performance Settings
    batchSize: z.number().int().min(1).max(100).default(10),
    parallelProcessing: z.boolean().default(true)
  }).optional(),
  
  // Referenced Rules
  customRules: z.array(z.string()).default([]), // Array of rule IDs
  
  // Status & Usage
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  isDefault: z.boolean().default(false),
  
  // Usage Statistics
  usage: z.object({
    documentsAnalyzed: z.number().int().min(0).default(0),
    totalAnalysisTime: z.number().min(0).default(0), // minutes
    averageScore: z.number().min(0).max(100).optional(),
    lastUsed: z.date().optional()
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  lastModifiedBy: z.string().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([])
});

// Organization User Schema
export const OrganizationUserSchema = z.object({
  // Basic Information
  id: z.string(),
  organizationId: z.string(),
  uid: z.string(), // Firebase Auth UID
  email: z.string().email(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  
  // Role & Permissions
  role: z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'GUEST']),
  permissions: z.array(z.enum([
    'READ_DOCUMENTS',
    'WRITE_DOCUMENTS', 
    'DELETE_DOCUMENTS',
    'MANAGE_TEMPLATES',
    'MANAGE_RULES',
    'MANAGE_CONFIGS',
    'MANAGE_USERS',
    'VIEW_ANALYTICS',
    'EXPORT_DATA',
    'MANAGE_BILLING'
  ])).default(['READ_DOCUMENTS']),
  
  // Status
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_INVITATION', 'SUSPENDED']).default('PENDING_INVITATION'),
  
  // User Preferences
  preferences: z.object({
    language: z.string().default('pt-BR'),
    timezone: z.string().default('America/Sao_Paulo'),
    emailNotifications: z.boolean().default(true),
    dashboardLayout: z.string().optional(),
    defaultView: z.string().optional()
  }).optional(),
  
  // Activity Tracking
  activity: z.object({
    lastLogin: z.date().optional(),
    documentCount: z.number().int().min(0).default(0),
    analysisCount: z.number().int().min(0).default(0),
    averageSessionTime: z.number().min(0).optional() // minutes
  }).optional(),
  
  // Audit Fields
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  invitedBy: z.string().optional(),
  invitedAt: z.date().optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
});

// Type exports
export type OrganizationProfile = z.infer<typeof OrganizationProfileSchema>;
export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;
export type AnalysisRule = z.infer<typeof AnalysisRuleSchema>;
export type CustomParameters = z.infer<typeof CustomParametersSchema>;
export type OrganizationUser = z.infer<typeof OrganizationUserSchema>;

// Collection References
export const ORGANIZATION_COLLECTIONS = {
  PROFILE: 'profile',
  TEMPLATES: 'templates',
  ANALYSIS_RULES: 'analysis_rules',
  CUSTOM_PARAMS: 'custom_params',
  USERS: 'users'
} as const;