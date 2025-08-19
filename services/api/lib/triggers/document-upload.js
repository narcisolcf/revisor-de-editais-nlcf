"use strict";
/**
 * Document Upload Trigger
 * Processes documents when uploaded to Cloud Storage
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.onDocumentUpload = void 0;
exports.extractDocumentContent = extractDocumentContent;
exports.generateDocumentPreview = generateDocumentPreview;
exports.validateDocument = validateDocument;
const storage_1 = require("firebase-functions/v2/storage");
const firebase_functions_1 = require("firebase-functions");
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const config_1 = require("../config");
const utils_1 = require("../utils");
const bucket = firebase_1.storage.bucket();
/**
 * Trigger when document is uploaded to Storage
 */
exports.onDocumentUpload = (0, storage_1.onObjectFinalized)({
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 540,
    maxInstances: 10,
    bucket: config_1.config.storageBucket
}, async (event) => {
    const filePath = event.data.name;
    const fileSize = parseInt(event.data.size || "0", 10);
    const contentType = event.data.contentType || "";
    const timeCreated = event.data.timeCreated;
    firebase_functions_1.logger.info(`Document upload detected: ${filePath}`, {
        filePath,
        fileSize: (0, utils_1.formatFileSize)(fileSize),
        contentType,
        timeCreated
    });
    // Check if this is a document upload (not a system file)
    if (!filePath.startsWith("documents/") ||
        filePath.includes("/temp/") ||
        filePath.includes("/.") ||
        filePath.endsWith("/")) {
        firebase_functions_1.logger.info(`Skipping non-document file: ${filePath}`);
        return;
    }
    // Validate file type
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain"
    ];
    if (!allowedTypes.includes(contentType)) {
        firebase_functions_1.logger.warn(`Unsupported file type: ${contentType} for ${filePath}`);
        await markDocumentAsError(filePath, `Unsupported file type: ${contentType}`);
        return;
    }
    // Check file size
    if (fileSize > config_1.config.maxDocumentSize) {
        firebase_functions_1.logger.warn(`File too large: ${(0, utils_1.formatFileSize)(fileSize)} for ${filePath}`);
        await markDocumentAsError(filePath, `File too large: ${(0, utils_1.formatFileSize)(fileSize)}`);
        return;
    }
    try {
        // Extract document ID from file path
        // Expected format: documents/{organizationId}/{documentId}/{filename}
        const pathParts = filePath.split("/");
        if (pathParts.length < 4) {
            firebase_functions_1.logger.error(`Invalid file path structure: ${filePath}`);
            return;
        }
        const [, organizationId, documentId] = pathParts;
        const fileName = pathParts.slice(3).join("/");
        firebase_functions_1.logger.info(`Processing document upload`, {
            organizationId,
            documentId,
            fileName,
            filePath
        });
        // Get document record from Firestore
        const docRef = firebase_1.collections.documents.doc(documentId);
        const docSnapshot = await docRef.get();
        if (!docSnapshot.exists) {
            firebase_functions_1.logger.error(`Document not found in Firestore: ${documentId}`);
            await createUploadNotification(organizationId, documentId, "error", {
                error: "Document record not found",
                filePath
            });
            return;
        }
        const document = Object.assign({ id: docSnapshot.id }, docSnapshot.data());
        // Verify organization match
        if (document.organizationId !== organizationId) {
            firebase_functions_1.logger.error(`Organization mismatch: ${document.organizationId} vs ${organizationId}`);
            await markDocumentAsError(documentId, "Organization ID mismatch");
            return;
        }
        // Update document with upload information
        const updateData = {
            status: types_1.DocumentStatus.UPLOADED,
            "metadata.uploadedAt": new Date(),
            "metadata.fileSize": fileSize,
            "metadata.fileType": contentType,
            "metadata.fileName": fileName,
            updatedAt: new Date()
        };
        await (0, utils_1.retry)(async () => {
            await docRef.update(updateData);
        }, 3, 1000);
        firebase_functions_1.logger.info(`Document status updated to UPLOADED: ${documentId}`);
        // Start document processing
        await startDocumentProcessing(document, filePath);
        // Send success notification
        await createUploadNotification(organizationId, documentId, "success", {
            fileName,
            fileSize: (0, utils_1.formatFileSize)(fileSize),
            message: "Document uploaded successfully and processing started"
        });
        firebase_functions_1.logger.info(`Document upload processing completed: ${documentId}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error processing document upload: ${filePath}`, error);
        // Try to extract document ID for error marking
        const pathParts = filePath.split("/");
        if (pathParts.length >= 3) {
            const documentId = pathParts[2];
            await markDocumentAsError(documentId, `Upload processing error: ${error.message}`);
        }
        throw error; // Re-throw to trigger retry
    }
});
/**
 * Start document processing pipeline
 */
async function startDocumentProcessing(document, filePath) {
    try {
        // Update document status to processing
        await firebase_1.collections.documents.doc(document.id).update({
            status: types_1.DocumentStatus.PROCESSING,
            "metadata.processingStartedAt": new Date(),
            updatedAt: new Date()
        });
        firebase_functions_1.logger.info(`Started processing for document: ${document.id}`);
        // Get organization configuration for analysis
        const configSnapshot = await firebase_1.collections.configs
            .where("organizationId", "==", document.organizationId)
            .where("isActive", "==", true)
            .limit(1)
            .get();
        let configId = undefined;
        if (!configSnapshot.empty) {
            configId = configSnapshot.docs[0].id;
        }
        // Create analysis request
        const analysisRequest = {
            documentId: document.id,
            organizationId: document.organizationId,
            configId,
            priority: "normal",
            analysisType: "standard",
            options: {
                includeAIAnalysis: false,
                runCustomRules: true,
                generateRecommendations: true,
                extractKeyMetrics: true
            },
            requestedBy: document.createdBy,
            requestedAt: new Date()
        };
        // Create processing task
        const taskPayload = {
            id: `process_${document.id}_${Date.now()}`,
            type: "document_analysis",
            data: {
                document,
                filePath,
                analysisRequest
            },
            priority: "normal",
            maxRetries: 3,
            currentRetries: 0,
            createdAt: new Date()
        };
        // Add to processing queue (could use Cloud Tasks or Pub/Sub)
        await firebase_1.collections.firestore.collection("processing_queue").add(taskPayload);
        firebase_functions_1.logger.info(`Document queued for analysis: ${document.id}`, {
            taskId: taskPayload.id,
            configId
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error starting document processing: ${document.id}`, error);
        await markDocumentAsError(document.id, `Processing start error: ${error.message}`);
        throw error;
    }
}
/**
 * Mark document as having an error
 */
async function markDocumentAsError(documentId, errorMessage) {
    try {
        await firebase_1.collections.documents.doc(documentId).update({
            status: types_1.DocumentStatus.ERROR,
            error: errorMessage,
            updatedAt: new Date()
        });
        firebase_functions_1.logger.error(`Document marked as error: ${documentId} - ${errorMessage}`);
    }
    catch (updateError) {
        firebase_functions_1.logger.error(`Failed to mark document as error: ${documentId}`, updateError);
    }
}
/**
 * Create upload notification
 */
async function createUploadNotification(organizationId, documentId, type, data) {
    try {
        const notification = {
            userId: "system", // Will be updated with actual user when implemented
            organizationId,
            title: type === "success" ? "Document Upload Successful" : "Document Upload Error",
            message: type === "success"
                ? `Document ${documentId} uploaded and processing started`
                : `Document ${documentId} upload failed: ${data.error}`,
            type: type === "success" ? "success" : "error",
            data: Object.assign({ documentId }, data),
            channels: ["push"] // Could include "email" if critical
        };
        await firebase_1.collections.firestore.collection("notifications").add(Object.assign(Object.assign({}, notification), { createdAt: new Date(), processed: false }));
        firebase_functions_1.logger.info(`Notification created for document: ${documentId}`, {
            type,
            organizationId
        });
    }
    catch (error) {
        firebase_functions_1.logger.error(`Failed to create notification: ${documentId}`, error);
    }
}
/**
 * Extract document content from uploaded file
 */
async function extractDocumentContent(filePath) {
    try {
        const file = bucket.file(filePath);
        // Check if file exists
        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`File not found: ${filePath}`);
        }
        // Get file metadata
        const [metadata] = await file.getMetadata();
        const contentType = metadata.contentType || "";
        if (contentType === "text/plain") {
            // For text files, read directly
            const [buffer] = await file.download();
            return buffer.toString("utf-8");
        }
        else if (contentType === "application/pdf" ||
            contentType.includes("word")) {
            // For PDF and Word documents, we would need to use
            // document processing services like Google Document AI
            // For now, return placeholder
            return `[Content extraction for ${contentType} files requires document processing service]`;
        }
        throw new Error(`Unsupported content type for extraction: ${contentType}`);
    }
    catch (error) {
        firebase_functions_1.logger.error(`Error extracting content from ${filePath}:`, error);
        throw error;
    }
}
/**
 * Generate document preview
 */
async function generateDocumentPreview(filePath, maxLength = 500) {
    try {
        const content = await extractDocumentContent(filePath);
        if (content.length <= maxLength) {
            return content;
        }
        return content.substring(0, maxLength) + "...";
    }
    catch (error) {
        firebase_functions_1.logger.warn(`Failed to generate preview for ${filePath}:`, error);
        return `[Preview not available for this document type]`;
    }
}
/**
 * Validate document structure and content
 */
async function validateDocument(filePath, document) {
    const errors = [];
    const warnings = [];
    try {
        // Check file accessibility
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        if (!exists) {
            errors.push("File not found in storage");
        }
        else {
            // Get file metadata for additional validation
            const [metadata] = await file.getMetadata();
            const actualSize = parseInt(metadata.size || "0", 10);
            // Validate file size matches metadata
            if (Math.abs(actualSize - document.metadata.fileSize) > 1024) { // 1KB tolerance
                warnings.push(`File size mismatch: expected ${document.metadata.fileSize}, actual ${actualSize}`);
            }
            // Validate content type
            if (metadata.contentType !== document.metadata.fileType) {
                warnings.push(`Content type mismatch: expected ${document.metadata.fileType}, actual ${metadata.contentType}`);
            }
        }
        // Additional document-specific validations could be added here
        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
    catch (error) {
        errors.push(`Validation error: ${error.message}`);
        return { isValid: false, errors, warnings };
    }
}
//# sourceMappingURL=document-upload.js.map