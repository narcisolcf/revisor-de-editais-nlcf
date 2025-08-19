/**
 * Authentication Middleware
 * LicitaReview Cloud Functions
 */
import { Request, Response, NextFunction } from "express";
import { UserContext } from "../types";
declare global {
    namespace Express {
        interface Request {
            user?: UserContext;
            requestId?: string;
        }
    }
}
/**
 * Verify Firebase ID Token and extract user context
 */
export declare const authenticateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Require specific roles
 */
export declare const requireRoles: (requiredRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require specific permissions
 */
export declare const requirePermissions: (requiredPermissions: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Require organization access
 */
export declare const requireOrganization: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validate organization access for resource
 */
export declare const validateOrganizationAccess: (orgIdParam?: string) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * Service-to-service authentication using API keys
 */
export declare const authenticateService: (req: Request, res: Response, next: NextFunction) => void;
export declare const ROLES: {
    readonly SUPER_ADMIN: "super_admin";
    readonly ORG_ADMIN: "org_admin";
    readonly MANAGER: "manager";
    readonly ANALYST: "analyst";
    readonly USER: "user";
    readonly SERVICE: "service";
};
export declare const PERMISSIONS: {
    readonly DOCUMENTS_READ: "documents:read";
    readonly DOCUMENTS_WRITE: "documents:write";
    readonly DOCUMENTS_DELETE: "documents:delete";
    readonly ANALYSIS_READ: "analysis:read";
    readonly ANALYSIS_WRITE: "analysis:write";
    readonly CONFIG_READ: "config:read";
    readonly CONFIG_WRITE: "config:write";
    readonly USERS_READ: "users:read";
    readonly USERS_WRITE: "users:write";
    readonly AUDIT_READ: "audit:read";
};
export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
//# sourceMappingURL=auth.d.ts.map