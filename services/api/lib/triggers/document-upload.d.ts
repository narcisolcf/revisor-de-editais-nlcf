/**
 * Document Upload Trigger
 * Processes documents when uploaded to Cloud Storage
 * LicitaReview Cloud Functions
 */
import { Document } from "../types";
/**
 * Trigger when document is uploaded to Storage
 */
export declare const onDocumentUpload: import("firebase-functions/v2/core").CloudFunction<import("firebase-functions/v2/storage").StorageEvent>;
/**
 * Extract document content from uploaded file
 */
export declare function extractDocumentContent(filePath: string): Promise<string>;
/**
 * Generate document preview
 */
export declare function generateDocumentPreview(filePath: string, maxLength?: number): Promise<string>;
/**
 * Validate document structure and content
 */
export declare function validateDocument(filePath: string, document: Document): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
}>;
//# sourceMappingURL=document-upload.d.ts.map