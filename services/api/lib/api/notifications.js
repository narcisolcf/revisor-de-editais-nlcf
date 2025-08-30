"use strict";
/**
 * Notifications Processor
 * LicitaReview Cloud Functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationProcessor = exports.onNotificationCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const express_1 = __importDefault(require("express"));
const firebase_functions_1 = require("firebase-functions");
const crypto_1 = __importDefault(require("crypto"));
const firebase_1 = require("../config/firebase");
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Request ID middleware
app.use((req, res, next) => {
    req.requestId = (0, utils_1.generateRequestId)();
    res.setHeader("X-Request-ID", req.requestId);
    next();
});
/**
 * POST /notifications/send
 * Send notification (service-to-service)
 */
app.post("/send", auth_1.authenticateService, async (req, res) => {
    try {
        const notification = req.body;
        const result = await processNotification(notification);
        res.json((0, utils_1.createSuccessResponse)(result, req.requestId));
    }
    catch (error) {
        firebase_functions_1.logger.error("Error sending notification:", error);
        res.status(500).json((0, utils_1.createErrorResponse)("INTERNAL_ERROR", "Failed to send notification", { error: error instanceof Error ? error.message : String(error) }, req.requestId));
    }
});
/**
 * Firestore trigger for new notifications
 */
exports.onNotificationCreated = (0, firestore_1.onDocumentCreated)({
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
    firebase_functions_1.logger.info(`Processing notification: ${notificationId}`, {
        notificationId,
        userId: notificationData.userId,
        organizationId: notificationData.organizationId,
        type: notificationData.type,
        channels: notificationData.channels
    });
    try {
        await processNotification(notificationData);
        // Mark as processed
        await firebase_1.firestore
            .collection("notifications")
            .doc(notificationId)
            .update({
            processed: true,
            processedAt: new Date()
        });
        firebase_functions_1.logger.info(`Notification processed successfully: ${notificationId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing notification ${notificationId}:`, error);
        // Mark as failed
        await firebase_1.firestore
            .collection("notifications")
            .doc(notificationId)
            .update({
            processed: false,
            processingError: error instanceof Error ? error.message : String(error),
            failedAt: new Date()
        });
    }
});
async function processNotification(notification) {
    const results = {};
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
        }
        catch (error) {
            firebase_functions_1.logger.error(`Error sending notification via ${channel}:`, error);
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
async function sendPushNotification(notification) {
    try {
        // Get user's FCM tokens
        const userTokensSnapshot = await firebase_1.firestore
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
        const response = await firebase_1.messaging.sendMulticast(message);
        firebase_functions_1.logger.info(`Push notification sent`, {
            userId: notification.userId,
            successCount: response.successCount,
            failureCount: response.failureCount
        });
        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success &&
                    (resp.error?.code === "messaging/invalid-registration-token" ||
                        resp.error?.code === "messaging/registration-token-not-registered")) {
                    invalidTokens.push(tokens[idx]);
                }
            });
            if (invalidTokens.length > 0) {
                const validTokens = tokens.filter((token) => !invalidTokens.includes(token));
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
    }
    catch (error) {
        firebase_functions_1.logger.error("Error sending push notification:", error);
        return {
            success: false,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
/**
 * Send email notification
 */
async function sendEmailNotification(notification) {
    try {
        // In a real implementation, you would integrate with an email service
        // like SendGrid, AWS SES, or similar
        // For now, just store the email request
        await firebase_1.firestore.collection("emailQueue").add({
            userId: notification.userId,
            organizationId: notification.organizationId,
            subject: notification.title,
            body: notification.message,
            type: notification.type,
            data: notification.data,
            createdAt: new Date(),
            processed: false
        });
        firebase_functions_1.logger.info(`Email notification queued for user: ${notification.userId}`);
        return {
            success: true,
            details: { message: "Email queued for delivery" }
        };
    }
    catch (error) {
        firebase_functions_1.logger.error("Error queuing email notification:", error);
        return {
            success: false,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
/**
 * Send webhook notification
 */
async function sendWebhookNotification(notification) {
    try {
        // Get organization webhook configuration
        const orgConfigSnapshot = await firebase_1.collections.configs
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
            id: (0, utils_1.generateRequestId)(),
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
        firebase_functions_1.logger.info(`Webhook notification sent`, {
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
    }
    catch (error) {
        firebase_functions_1.logger.error("Error sending webhook notification:", error);
        return {
            success: false,
            details: { error: error instanceof Error ? error.message : String(error) }
        };
    }
}
/**
 * Generate webhook signature for security
 */
function generateWebhookSignature(payload, secret) {
    if (!secret)
        return "";
    const payloadString = JSON.stringify(payload);
    return crypto_1.default
        .createHmac("sha256", secret)
        .update(payloadString)
        .digest("hex");
}
// Export Cloud Function
exports.notificationProcessor = (0, https_1.onRequest)({
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 300,
    maxInstances: 20,
    cors: false // Only service-to-service calls
}, app);
//# sourceMappingURL=notifications.js.map