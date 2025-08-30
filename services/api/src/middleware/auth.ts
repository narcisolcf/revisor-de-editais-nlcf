/**
 * Authentication Middleware
 * LicitaReview Cloud Functions
 */

import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";
import { createErrorResponse } from "../utils";


/**
 * Verify Firebase ID Token and extract user context
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json(createErrorResponse(
        "AUTH_MISSING_TOKEN",
        "Missing or invalid authorization header",
        { expected: "Bearer <token>" },
        req.requestId
      ));
      return;
    }
    
    const token = authHeader.split("Bearer ")[1];
    
    try {
      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);
      
      // Get user record for additional claims
      const userRecord = await auth.getUser(decodedToken.uid);
      
      // Extract organization ID and roles from custom claims
      const customClaims = userRecord.customClaims || {};
      
      // Set user context
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        organizationId: customClaims.organizationId || "",
        roles: customClaims.roles || ["user"],
        permissions: customClaims.permissions || []
      };
      
      next();
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      res.status(401).json(createErrorResponse(
        "AUTH_INVALID_TOKEN",
        "Invalid or expired token",
        { error: String(tokenError) },
        req.requestId
      ));
      return;
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json(createErrorResponse(
      "AUTH_FAILED",
      "Authentication service error",
      { error: String(error) },
      req.requestId
    ));
    return;
  }
};

/**
 * Require specific roles
 */
export const requireRoles = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse(
        "AUTH_USER_NOT_AUTHENTICATED",
        "User not authenticated",
        undefined,
        req.requestId
      ));
      return;
    }
    
    const hasRequiredRole = requiredRoles.some(role => 
      req.user!.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      res.status(403).json(createErrorResponse(
        "AUTH_INSUFFICIENT_PERMISSIONS",
        "Insufficient permissions",
        { 
          required: requiredRoles,
          current: req.user.roles
        },
        req.requestId
      ));
      return;
    }
    
    next();
  };
};

/**
 * Require specific permissions
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse(
        "AUTH_USER_NOT_AUTHENTICATED",
        "User not authenticated",
        undefined,
        req.requestId
      ));
      return;
    }
    
    const hasAllPermissions = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );
    
    if (!hasAllPermissions) {
      res.status(403).json(createErrorResponse(
        "AUTH_MISSING_PERMISSIONS",
        "Missing required permissions",
        {
          required: requiredPermissions,
          current: req.user.permissions
        },
        req.requestId
      ));
      return;
    }
    
    next();
  };
};

/**
 * Require organization access
 */
export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json(createErrorResponse(
      "AUTH_USER_NOT_AUTHENTICATED",
      "User not authenticated",
      undefined,
      req.requestId
    ));
    return;
  }
  
  if (!req.user.organizationId) {
    res.status(403).json(createErrorResponse(
      "AUTH_NO_ORGANIZATION",
      "No organization associated with user",
      undefined,
      req.requestId
    ));
    return;
  }
  
  next();
};

/**
 * Validate organization access for resource
 */
export const validateOrganizationAccess = (orgIdParam: string = "organizationId") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(createErrorResponse(
        "AUTH_USER_NOT_AUTHENTICATED",
        "User not authenticated",
        undefined,
        req.requestId
      ));
      return;
    }
    
    const resourceOrgId = req.params[orgIdParam] || req.body[orgIdParam];
    
    if (!resourceOrgId) {
      res.status(400).json(createErrorResponse(
        "AUTH_MISSING_ORG_ID",
        "Organization ID not provided in request",
        { parameter: orgIdParam },
        req.requestId
      ));
      return;
    }
    
    // Super admin can access any organization
    if (req.user.roles.includes("super_admin")) {
      next();
      return;
    }
    
    // User must belong to the same organization
    if (req.user.organizationId !== resourceOrgId) {
      res.status(403).json(createErrorResponse(
        "AUTH_ORG_ACCESS_DENIED",
        "Access denied to organization resource",
        {
          userOrganization: req.user.organizationId,
          requestedOrganization: resourceOrgId
        },
        req.requestId
      ));
      return;
    }
    
    next();
  };
};

/**
 * Optional authentication - sets user if token is valid but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      
      try {
        const decodedToken = await auth.verifyIdToken(token);
        const userRecord = await auth.getUser(decodedToken.uid);
        const customClaims = userRecord.customClaims || {};
        
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          organizationId: customClaims.organizationId || "",
          roles: customClaims.roles || ["user"],
          permissions: customClaims.permissions || []
        };
      } catch (tokenError) {
        // Ignore token errors in optional auth
        console.warn("Optional auth token verification failed:", String(tokenError));
      }
    }
    
    next();
  } catch (error) {
    // Log error but don't fail the request
    console.error("Optional auth middleware error:", error);
    next();
  }
};

/**
 * Service-to-service authentication using API keys
 */
export const authenticateService = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers["x-api-key"] as string;
  
  if (!apiKey) {
    res.status(401).json(createErrorResponse(
      "AUTH_API_KEY_REQUIRED",
      "API key required for service authentication",
      undefined,
      req.requestId
    ));
    return;
  }
  
  // In production, validate against a secure API key store
  const validApiKeys = process.env.VALID_API_KEYS?.split(",") || [];
  
  if (!validApiKeys.includes(apiKey)) {
    res.status(401).json(createErrorResponse(
      "AUTH_INVALID_API_KEY",
      "Invalid API key",
      undefined,
      req.requestId
    ));
    return;
  }
  
  // Set service context
  req.user = {
    uid: "service",
    organizationId: "system",
    roles: ["service"],
    permissions: ["*"]
  };
  
  next();
};

// Common role definitions
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ORG_ADMIN: "org_admin", 
  MANAGER: "manager",
  ANALYST: "analyst",
  USER: "user",
  SERVICE: "service"
} as const;

// Common permission definitions
export const PERMISSIONS = {
  DOCUMENTS_READ: "documents:read",
  DOCUMENTS_WRITE: "documents:write",
  DOCUMENTS_DELETE: "documents:delete",
  ANALYSIS_READ: "analysis:read",
  ANALYSIS_WRITE: "analysis:write",
  CONFIG_READ: "config:read",
  CONFIG_WRITE: "config:write",
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  AUDIT_READ: "audit:read"
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];