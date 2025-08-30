/**
 * Health Check API
 * LicitaReview Cloud Functions
 */

import * as functions from 'firebase-functions/v1';
import { firestore, auth } from "../config/firebase";
import { SystemHealth, HealthCheckResult } from "../types";
import { createSuccessResponse, createErrorResponse } from "../utils";

// Individual service health checks
async function checkSystemHealth(): Promise<SystemHealth> {
  // const startTime = Date.now(); // Not used
  
  const services = await Promise.allSettled([
    checkFirestore(),
    checkStorage(),
    checkAuth()
  ]);
  
  const serviceResults: HealthCheckResult[] = services.map((result, index) => {
    const serviceNames = ["firestore", "storage", "auth"];
    
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        service: serviceNames[index],
        status: "unhealthy" as const,
        timestamp: new Date(),
        details: { error: result.reason?.message || "Unknown error" }
      };
    }
  });
  
  // const responseTime = Date.now() - startTime; // Not used
  
  return {
    overall: determineOverallHealth(serviceResults),
    services: serviceResults,
    timestamp: new Date(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: process.uptime()
  };
}

async function checkFirestore(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Simple read operation to test connectivity
    await firestore.collection("health").limit(1).get();
    
    return {
      service: "firestore",
      status: "healthy",
      timestamp: new Date(),
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      service: "firestore",
      status: "unhealthy",
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

async function checkStorage(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  // Temporarily disabled storage check
  return {
    service: "storage",
    status: "degraded",
    timestamp: new Date(),
    responseTime: Date.now() - startTime,
    details: { error: "Storage bucket not configured" }
  };
}

async function checkAuth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Test auth service by getting service config
    await auth.getUsers([]);
    
    return {
      service: "auth",
      status: "healthy",
      timestamp: new Date(),
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    return {
      service: "auth",
      status: "unhealthy",
      timestamp: new Date(),
      responseTime: Date.now() - startTime,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}



function determineOverallHealth(services: HealthCheckResult[]): "healthy" | "degraded" | "unhealthy" {
  const unhealthyServices = services.filter(s => s.status === "unhealthy");
  const degradedServices = services.filter(s => s.status === "degraded");
  
  if (unhealthyServices.length > 0) {
    // If critical services are unhealthy, mark as unhealthy
    const criticalServices = ["firestore", "auth"];
    const criticalUnhealthy = unhealthyServices.some(s => 
      criticalServices.includes(s.service)
    );
    
    if (criticalUnhealthy) {
      return "unhealthy";
    } else {
      return "degraded";
    }
  }
  
  if (degradedServices.length > 0) {
    return "degraded";
  }
  
  return "healthy";
}

// Export Cloud Function
export const healthCheck = functions
  .region("us-central1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 60
  })
  .https.onRequest(async (req: functions.Request, res: functions.Response) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
  try {
    const systemHealth = await checkSystemHealth();
    
    const statusCode = systemHealth.overall === "healthy" ? 200 : 
                      systemHealth.overall === "degraded" ? 200 : 503;
    
    res.status(statusCode).json(createSuccessResponse(systemHealth));
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(503).json(createErrorResponse(
      "HEALTH_CHECK_FAILED",
      "Health check failed", 
      { error: error instanceof Error ? error.message : String(error) },
      undefined
    ));
  }
});