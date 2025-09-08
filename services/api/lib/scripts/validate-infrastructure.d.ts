#!/usr/bin/env node
/**
 * Script de validação da infraestrutura
 * Verifica se todos os serviços estão funcionando corretamente
 */
interface ValidationResult {
    service: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
    duration?: number;
}
declare class InfrastructureValidator {
    private results;
    private firebaseService;
    private cloudRunClient;
    private documentRepo;
    private analysisRepo;
    private organizationRepo;
    private parameterEngine;
    private metricsService;
    private auditService;
    private notificationService;
    private orchestrator;
    validate(): Promise<ValidationResult[]>;
    private validateFirebase;
    private initializeServices;
    private validateRepositories;
    private validateDocumentRepository;
    private validateAnalysisRepository;
    private validateOrganizationRepository;
    private validateCloudRun;
    private validateOrchestrator;
    private validateParameterGeneration;
    private validateRequestValidation;
    private validateEndToEnd;
    private createTestOrganization;
    private createTestDocument;
    private testParameterGeneration;
    private cleanupTestData;
    private addResult;
    private printSummary;
}
export { InfrastructureValidator, ValidationResult };
