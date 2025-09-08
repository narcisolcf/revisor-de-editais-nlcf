/**
 * Organization Types
 * Tipos relacionados a organizações
 */

import { z } from 'zod';

// Enums
/* eslint-disable no-unused-vars */
export enum OrganizationType {
  FEDERAL = 'federal',
  STATE = 'state',
  MUNICIPAL = 'municipal',
  PRIVATE = 'private'
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  TRIAL = 'trial'
}
/* eslint-enable no-unused-vars */

// Schemas
export const OrganizationSettingsSchema = z.object({
  analysisRules: z.array(z.string()).default([]),
  customParameters: z.record(z.unknown()).default({}),
  documentRetentionDays: z.number().default(365),
  maxDocumentSize: z.number().default(50 * 1024 * 1024), // 50MB
  allowedFileTypes: z.array(z.string()).default(['pdf', 'doc', 'docx']),
  autoAnalysis: z.boolean().default(true),
  notificationSettings: z.object({
    email: z.boolean().default(true),
    inApp: z.boolean().default(true),
    webhook: z.string().url().optional()
  }).default({})
});

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.nativeEnum(OrganizationType),
  status: z.nativeEnum(OrganizationStatus).default(OrganizationStatus.TRIAL),
  cnpj: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('BR')
  }).optional(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().optional(),
    website: z.string().url().optional()
  }),
  config: OrganizationSettingsSchema.default({}),
  subscription: z.object({
    plan: z.string(),
    startDate: z.date(),
    endDate: z.date().optional(),
    maxUsers: z.number().default(10),
    maxDocuments: z.number().default(1000)
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  metadata: z.record(z.unknown()).optional()
});

// Types
export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;

// Request/Response types
export interface CreateOrganizationRequest {
  name: string;
  type: OrganizationType;
  cnpj?: string;
  contact: {
    email: string;
    phone?: string;
    website?: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
}

export interface UpdateOrganizationRequest {
  name?: string;
  contact?: Partial<Organization['contact']>;
  address?: Partial<Organization['address']>;
  config?: Partial<OrganizationSettings>;
}

export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
  page: number;
  limit: number;
}