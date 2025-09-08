/**
 * Validadores específicos para entidades de domínio
 */

import { z } from 'zod';
import {
  STATUS,
  USER_ROLES,
  USER_CONTEXTS,
  ORGANIZATION_TYPES,
  ORGANIZATION_SIZES,
  ANALYSIS_TYPES,
  PRIORITIES,
  VALIDATION_LIMITS
} from '../constants';
import {
  idSchema,
  emailSchema,
  nameSchema,
  titleSchema,
  descriptionSchema,
  cpfSchema,
  cnpjSchema,
  phoneSchema,
  addressSchema,
  dateSchema
} from './common';

// Validadores de User
export const userRoleSchema = z.enum([
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.ANALYST,
  USER_ROLES.VIEWER
] as const);

export const userContextSchema = z.enum([
  USER_CONTEXTS.GOVERNMENT,
  USER_CONTEXTS.PRIVATE,
  USER_CONTEXTS.ACADEMIC,
  USER_CONTEXTS.NGO
] as const);

export const userStatusSchema = z.enum([
  STATUS.USER.ACTIVE,
  STATUS.USER.INACTIVE,
  STATUS.USER.SUSPENDED,
  STATUS.USER.PENDING_VERIFICATION
] as const);

export const userProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  cpf: cpfSchema.optional(),
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional()
});

export const userPermissionsSchema = z.object({
  canCreateDocuments: z.boolean().default(true),
  canEditDocuments: z.boolean().default(true),
  canDeleteDocuments: z.boolean().default(false),
  canCreateAnalysis: z.boolean().default(true),
  canViewAllAnalysis: z.boolean().default(false),
  canManageUsers: z.boolean().default(false),
  canManageOrganization: z.boolean().default(false)
});

export const userPreferencesSchema = z.object({
  language: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
  timezone: z.string().default('America/Sao_Paulo'),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(true),
    analysisComplete: z.boolean().default(true),
    documentShared: z.boolean().default(true),
    systemUpdates: z.boolean().default(false)
  }).default({})
});

export const userCreateSchema = z.object({
  email: emailSchema,
  profile: userProfileSchema,
  role: userRoleSchema.default(USER_ROLES.VIEWER),
  context: userContextSchema,
  organizationId: idSchema.optional(),
  permissions: userPermissionsSchema.optional(),
  preferences: userPreferencesSchema.optional()
});

export const userUpdateSchema = userCreateSchema.partial().omit({ email: true });

// Validadores de Organization
export const organizationTypeSchema = z.enum([
  ORGANIZATION_TYPES.GOVERNMENT,
  ORGANIZATION_TYPES.PRIVATE_COMPANY,
  ORGANIZATION_TYPES.UNIVERSITY,
  ORGANIZATION_TYPES.NGO,
  ORGANIZATION_TYPES.COOPERATIVE
] as const);

export const organizationSizeSchema = z.enum([
  ORGANIZATION_SIZES.MICRO,
  ORGANIZATION_SIZES.SMALL,
  ORGANIZATION_SIZES.MEDIUM,
  ORGANIZATION_SIZES.LARGE
] as const);

export const organizationStatusSchema = z.enum([
  STATUS.ORGANIZATION.ACTIVE,
  STATUS.ORGANIZATION.INACTIVE,
  STATUS.ORGANIZATION.SUSPENDED,
  STATUS.ORGANIZATION.PENDING
] as const);

export const organizationContactSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional(),
  website: z.string().url().optional(),
  address: addressSchema
});

export const organizationSettingsSchema = z.object({
  allowPublicDocuments: z.boolean().default(false),
  requireApprovalForAnalysis: z.boolean().default(true),
  maxDocumentsPerUser: z.number().int().min(1).max(1000).default(100),
  maxAnalysisPerMonth: z.number().int().min(1).max(10000).default(1000),
  retentionPeriodDays: z.number().int().min(30).max(3650).default(365),
  allowedFileTypes: z.array(z.string()).default([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ])
});

export const organizationMetricsSchema = z.object({
  totalUsers: z.number().int().min(0).default(0),
  totalDocuments: z.number().int().min(0).default(0),
  totalAnalysis: z.number().int().min(0).default(0),
  storageUsedMB: z.number().min(0).default(0),
  lastActivityAt: dateSchema.optional()
});

export const organizationCreateSchema = z.object({
  name: z.string()
    .min(VALIDATION_LIMITS.ORGANIZATION_NAME.MIN)
    .max(VALIDATION_LIMITS.ORGANIZATION_NAME.MAX),
  description: z.string()
    .min(VALIDATION_LIMITS.ORGANIZATION_DESCRIPTION.MIN)
    .max(VALIDATION_LIMITS.ORGANIZATION_DESCRIPTION.MAX)
    .optional(),
  type: organizationTypeSchema,
  size: organizationSizeSchema,
  cnpj: cnpjSchema.optional(),
  contact: organizationContactSchema,
  settings: organizationSettingsSchema.optional(),
  ownerId: idSchema
});

export const organizationUpdateSchema = organizationCreateSchema
  .partial()
  .omit({ ownerId: true });

// Validadores de Document
export const documentStatusSchema = z.enum([
  STATUS.DOCUMENT.DRAFT,
  STATUS.DOCUMENT.PUBLISHED,
  STATUS.DOCUMENT.ARCHIVED,
  STATUS.DOCUMENT.DELETED
] as const);

export const documentMetadataSchema = z.object({
  fileSize: z.number().int().min(0),
  pageCount: z.number().int().min(0).optional(),
  wordCount: z.number().int().min(0).optional(),
  language: z.string().default('pt-BR'),
  encoding: z.string().default('UTF-8'),
  checksum: z.string().optional()
});

export const documentCreateSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.optional(),
  content: z.string().min(1),
  type: z.string().default('edital'),
  organizationId: idSchema,
  uploadedBy: idSchema,
  metadata: documentMetadataSchema.optional(),
  tags: z.array(z.string()).default([]),
  isPublic: z.boolean().default(false)
});

export const documentUpdateSchema = documentCreateSchema
  .partial()
  .omit({ organizationId: true, uploadedBy: true });

// Validadores de Analysis
export const analysisTypeSchema = z.enum([
  ANALYSIS_TYPES.COMPLIANCE,
  ANALYSIS_TYPES.RISK,
  ANALYSIS_TYPES.OPPORTUNITY,
  ANALYSIS_TYPES.TECHNICAL,
  ANALYSIS_TYPES.FINANCIAL
] as const);

export const analysisStatusSchema = z.enum([
  STATUS.ANALYSIS.PENDING,
  STATUS.ANALYSIS.PROCESSING,
  STATUS.ANALYSIS.COMPLETED,
  STATUS.ANALYSIS.FAILED,
  STATUS.ANALYSIS.CANCELLED
] as const);

export const analysisPrioritySchema = z.enum([
  PRIORITIES.LOW,
  PRIORITIES.MEDIUM,
  PRIORITIES.HIGH,
  PRIORITIES.CRITICAL
] as const);

export const analysisConfigSchema = z.object({
  includeCompliance: z.boolean().default(true),
  includeRiskAssessment: z.boolean().default(true),
  includeOpportunities: z.boolean().default(true),
  includeTechnicalReview: z.boolean().default(false),
  includeFinancialAnalysis: z.boolean().default(false),
  customPrompts: z.array(z.string()).default([]),
  outputFormat: z.enum(['json', 'markdown', 'pdf']).default('json'),
  language: z.string().default('pt-BR')
});

export const analysisResultSchema = z.object({
  summary: z.string(),
  score: z.number().min(0).max(100),
  findings: z.array(z.object({
    type: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    title: z.string(),
    description: z.string(),
    recommendation: z.string().optional(),
    references: z.array(z.string()).default([])
  })),
  compliance: z.object({
    score: z.number().min(0).max(100),
    issues: z.array(z.string()),
    recommendations: z.array(z.string())
  }).optional(),
  risks: z.array(z.object({
    type: z.string(),
    probability: z.enum(['low', 'medium', 'high']),
    impact: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    mitigation: z.string().optional()
  })).default([]),
  opportunities: z.array(z.object({
    type: z.string(),
    potential: z.enum(['low', 'medium', 'high']),
    description: z.string(),
    actionPlan: z.string().optional()
  })).default([]),
  metadata: z.object({
    processingTime: z.number().min(0),
    tokensUsed: z.number().int().min(0).optional(),
    modelVersion: z.string().optional(),
    confidence: z.number().min(0).max(1).optional()
  })
});

export const analysisCreateSchema = z.object({
  documentId: idSchema,
  type: analysisTypeSchema,
  priority: analysisPrioritySchema.default(PRIORITIES.MEDIUM),
  requestedBy: idSchema,
  organizationId: idSchema,
  config: analysisConfigSchema.optional(),
  scheduledFor: dateSchema.optional()
});

export const analysisUpdateSchema = analysisCreateSchema
  .partial()
  .omit({ documentId: true, requestedBy: true, organizationId: true });