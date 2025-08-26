/**
 * Serviço para gerenciar notificações do sistema
 */
export interface NotificationPayload {
    userId: string;
    organizationId: string;
    type: 'analysis_complete' | 'analysis_failed' | 'document_uploaded' | 'system_alert';
    title: string;
    message: string;
    data?: Record<string, any>;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}
export interface EmailNotification {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    htmlContent: string;
    textContent?: string;
    attachments?: Array<{
        filename: string;
        content: Buffer;
        contentType: string;
    }>;
}
export interface PushNotification {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: string;
}
export declare class NotificationService {
    constructor(projectId: string);
    /**
     * Envia notificação para um usuário específico
     */
    sendNotification(payload: NotificationPayload): Promise<void>;
    /**
     * Envia notificação por email
     */
    sendEmailNotification(notification: EmailNotification): Promise<void>;
    /**
     * Envia notificação push
     */
    sendPushNotification(notification: PushNotification): Promise<void>;
    /**
     * Notifica sobre conclusão de análise
     */
    notifyAnalysisComplete(userId: string, organizationId: string, analysisId: string, documentName: string, results: any): Promise<void>;
    /**
     * Notifica sobre falha na análise
     */
    notifyAnalysisFailure(userId: string, organizationId: string, analysisId: string, documentName: string, error: string): Promise<void>;
    /**
     * Notifica sobre upload de documento
     */
    notifyDocumentUploaded(userId: string, organizationId: string, documentId: string, documentName: string): Promise<void>;
    /**
     * Envia alerta do sistema
     */
    sendSystemAlert(userIds: string[], organizationId: string, title: string, message: string, data?: Record<string, any>): Promise<void>;
    /**
     * Simula envio de notificação (para desenvolvimento/teste)
     */
    private simulateNotificationSend;
    /**
     * Simula envio de email (para desenvolvimento/teste)
     */
    private simulateEmailSend;
    /**
     * Simula envio de push notification (para desenvolvimento/teste)
     */
    private simulatePushSend;
    /**
     * Obtém preferências de notificação do usuário
     */
    getUserNotificationPreferences(userId: string): Promise<{
        email: boolean;
        push: boolean;
        sms: boolean;
        types: string[];
    }>;
    /**
     * Atualiza preferências de notificação do usuário
     */
    updateUserNotificationPreferences(userId: string, preferences: {
        email?: boolean;
        push?: boolean;
        sms?: boolean;
        types?: string[];
    }): Promise<void>;
}
//# sourceMappingURL=NotificationService.d.ts.map