/**
 * Notifications Processor
 * LicitaReview Cloud Functions
 */

import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import express from "express";
import { logger } from "firebase-functions";
import { collections, messaging, firestore } from "../config/firebase";
import { NotificationPayload } from "../types";
import { authenticateService } from "../middleware/auth";
import { createSuccessResponse, createErrorResponse, generateRequestId } from "../utils";

const app = express();
app.use(express.json());

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = generateRequestId();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/**
 * POST /notifications/send
 * Send notification (service-to-service)
 */
app.post("/send",
  authenticateService,
  async (req, res) => {
    try {
      const notification = req.body as NotificationPayload;
      
      const result = await processNotification(notification);
      
      res.json(createSuccessResponse(
        result,
        req.requestId
      ));
    } catch (error) {
      logger.error("Error sending notification:", error);
      res.status(500).json(createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to send notification",
        { error: error instanceof Error ? error.message : String(error) },
        req.requestId
      ));
    }
  }
);

/**
 * Firestore trigger for new notifications
 */
export const onNotificationCreated = onDocumentCreated({
  document: "notifications/{notificationId}",
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 20
}, async (event) => {
  const notificationId = event.params.notificationId;
  const notificationData = event.data?.data();
  
  if (!notificationData || notificationData.processed) {
    return;
  }
  
  logger.info(`Processing notification: ${notificationId}`, {
    notificationId,
    userId: notificationData.userId,
    organizationId: notificationData.organizationId,
    type: notificationData.type,
    channels: notificationData.channels
  });
  
  try {
    await processNotification(notificationData as NotificationPayload);
    
    // Mark as processed
    await firestore
      .collection("notifications")
      .doc(notificationId)
      .update({
        processed: true,
        processedAt: new Date()
      });
      
    logger.info(`Notification processed successfully: ${notificationId}`);
  } catch (error) {
    logger.error(`Error processing notification ${notificationId}:`, error);
    
    // Mark as failed
    await firestore
      .collection("notifications")
      .doc(notificationId)
      .update({
        processed: false,
        processingError: error instanceof Error ? error.message : String(error),
        failedAt: new Date()
      });
  }
});

/**
 * Process notification through various channels
 */
async function processNotification(notification: NotificationPayload): Promise<{
  channels: Record<string, { success: boolean; details?: any }>
}> {
  const results: Record<string, { success: boolean; details?: any }> = {};
  
  // Process each channel
  for (const channel of notification.channels) {
    try {
      switch (channel) {
        case "push":
          results[channel] = await sendPushNotification(notification);
          break;
        case "email":
          results[channel] = await sendEmailNotification(notification);
          break;
        case "webhook":
          results[channel] = await sendWebhookNotification(notification);
          break;
        default:
          results[channel] = { 
            success: false, 
            details: { error: `Unsupported channel: ${channel}` }
          };
      }
    } catch (error) {
      logger.error(`Error sending notification via ${channel}:`, error);
      results[channel] = { 
        success: false, 
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }
  
  return { channels: results };
}

/**
 * Send push notification via Firebase Messaging
 */
async function sendPushNotification(notification: NotificationPayload): Promise<{
  success: boolean;
  details?: any;
}> {
  try {
    // Get user's FCM tokens
    const userTokensSnapshot = await firestore
      .collection("userTokens")
      .doc(notification.userId)
      .get();
    
    if (!userTokensSnapshot.exists) {
      return {
        success: false,
        details: { error: "No FCM tokens found for user" }
      };
    }
    
    const tokens = userTokensSnapshot.data()?.fcmTokens || [];
    
    if (tokens.length === 0) {
      return {
        success: false,
        details: { error: "No active FCM tokens" }
      };
    }
    
    // Create FCM message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        organizationId: notification.organizationId || "",
        ...(notification.data ? { data: JSON.stringify(notification.data) } : {})
      },
      tokens: tokens
    };
    
    // Send multicast message
    const response = await messaging.sendMulticast(message);
    
    logger.info(`Push notification sent`, {
      userId: notification.userId,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const invalidTokens: string[] = [];
      
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error?.code === "messaging/invalid-registration-token" ||
             resp.error?.code === "messaging/registration-token-not-registered")) {
          invalidTokens.push(tokens[idx]);
        }
      });
      
      if (invalidTokens.length > 0) {
        const validTokens = tokens.filter((token: string) => !invalidTokens.includes(token));
        await userTokensSnapshot.ref.update({ fcmTokens: validTokens });
      }
    }
    
    return {
      success: response.successCount > 0,
      details: {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokensRemoved: response.failureCount
      }
    };
    
  } catch (error) {
    logger.error("Error sending push notification:", error);
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(notification: NotificationPayload): Promise<{
  success: boolean;
  details?: any;
}> {
  try {
    // In a real implementation, you would integrate with an email service
    // like SendGrid, AWS SES, or similar
    
    // For now, just store the email request
    await firestore.collection("emailQueue").add({
      userId: notification.userId,
      organizationId: notification.organizationId,
      subject: notification.title,
      body: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: new Date(),
      processed: false
    });
    
    logger.info(`Email notification queued for user: ${notification.userId}`);
    
    return {
      success: true,
      details: { message: "Email queued for delivery" }
    };
    
  } catch (error) {
    logger.error("Error queuing email notification:", error);
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(notification: NotificationPayload): Promise<{
  success: boolean;
  details?: any;
}> {
  try {
    // Get organization webhook configuration
    const orgConfigSnapshot = await collections.configs
      .where("organizationId", "==", notification.organizationId)
      .where("isActive", "==", true)
      .limit(1)
      .get();
    
    if (orgConfigSnapshot.empty) {
      return {
        success: false,
        details: { error: "No webhook configuration found" }
      };
    }
    
    const config = orgConfigSnapshot.docs[0].data();
    const webhookUrl = config.settings?.webhookUrl;
    
    if (!webhookUrl) {
      return {
        success: false,
        details: { error: "No webhook URL configured" }
      };
    }
    
    // Prepare webhook payload
    const webhookPayload = {
      id: generateRequestId(),
      timestamp: new Date().toISOString(),
      type: "notification",
      data: {
        userId: notification.userId,
        organizationId: notification.organizationId,
        notification: {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data
        }
      }
    };
    
    // Send webhook (in production, consider using a queue for retry logic)
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LicitaReview-Webhook/1.0",
        "X-Webhook-Signature": generateWebhookSignature(webhookPayload, config.settings?.webhookSecret)
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const success = response.ok;
    
    logger.info(`Webhook notification sent`, {
      userId: notification.userId,
      webhookUrl,
      status: response.status,
      success
    });
    
    return {
      success,
      details: {
        status: response.status,
        statusText: response.statusText,
        url: webhookUrl
      }
    };
    
  } catch (error) {
    logger.error("Error sending webhook notification:", error);
    return {
      success: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Generate webhook signature for security
 */
function generateWebhookSignature(payload: any, secret?: string): string {
  if (!secret) return "";
  
  const crypto = require("crypto");
  const payloadString = JSON.stringify(payload);
  
  return crypto
    .createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}



// Export Cloud Function
export const notificationProcessor = onRequest({
  region: "us-central1",
  memory: "512MiB",
  timeoutSeconds: 300,
  maxInstances: 20,
  cors: false // Only service-to-service calls
}, app);