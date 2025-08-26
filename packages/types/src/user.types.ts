/**
 * User Types
 * Tipos relacionados a usuários e autenticação
 */

import { z } from 'zod';

// Enums
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

// Schemas
export const UserProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional()
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  profile: UserProfileSchema,
  organizationId: z.string(),
  roles: z.array(z.nativeEnum(UserRole)),
  permissions: z.array(z.string()),
  status: z.nativeEnum(UserStatus).default(UserStatus.PENDING),
  lastLoginAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  metadata: z.record(z.unknown()).optional()
});

export const UserContextSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  organizationId: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string())
});

// Types
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserContext = z.infer<typeof UserContextSchema>;

// Request/Response types
export interface CreateUserRequest {
  email: string;
  profile: UserProfile;
  organizationId: string;
  roles: UserRole[];
}

export interface UpdateUserRequest {
  profile?: Partial<UserProfile>;
  roles?: UserRole[];
  status?: UserStatus;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}