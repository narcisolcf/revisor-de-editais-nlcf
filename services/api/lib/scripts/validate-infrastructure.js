#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfrastructureValidator = void 0;
const FirebaseService_1 = require("../services/FirebaseService");
const CloudRunClient_1 = require("../services/CloudRunClient");
const DocumentRepository_1 = require("../db/repositories/DocumentRepository");
const AnalysisRepository_1 = require("../db/repositories/AnalysisRepository");
const OrganizationRepository_1 = require("../db/repositories/OrganizationRepository");
const ParameterEngine_1 = require("../services/ParameterEngine");
const MetricsService_1 = require("../services/MetricsService");
const AuditService_1 = require("../services/AuditService");
const LoggingService_1 = require("../services/LoggingService");
const NotificationService_1 = require("../services/NotificationService");
// ErrorService removido - não existe no projeto
const AnalysisOrchestrator_1 = require("../services/AnalysisOrchestrator");
class InfrastructureValidator {
    constructor() {
        this.results = [];
    }
    async validate() {
        console.log('🔍 Iniciando validação da infraestrutura...');
        console.log('='.repeat(60));
        try {
            await this.validateFirebase();
            await this.initializeServices();
            await this.validateRepositories();
            await this.validateCloudRun();
            await this.validateOrchestrator();
            await this.validateEndToEnd();
            this.printSummary();
            return this.results;
        }
        catch (error) {
            console.error('❌ Erro crítico na validação:', error);
            this.addResult('infrastructure', 'error', `Erro crítico: ${error}`);
            return this.results;
        }
    }
    async validateFirebase() {
        console.log('\n🔥 Validando Firebase...');
        try {
            const startTime = Date.now();
            this.firebaseService = new FirebaseService_1.FirebaseService();
            await this.firebaseService.initialize();
            const duration = Date.now() - startTime;
            this.addResult('firebase', 'success', 'Firebase inicializado com sucesso', { duration });
            console.log('✅ Firebase: OK');
        }
        catch (error) {
            this.addResult('firebase', 'error', `Erro no Firebase: ${error}`);
            console.log('❌ Firebase: ERRO');
            throw error;
        }
    }
    async initializeServices() {
        console.log('\n⚙️ Inicializando serviços...');
        try {
            // Repositórios
            this.documentRepo = new DocumentRepository_1.DocumentRepository(this.firebaseService.db);
            this.analysisRepo = new AnalysisRepository_1.AnalysisRepository(this.firebaseService.db);
            this.organizationRepo = new OrganizationRepository_1.OrganizationRepository(this.firebaseService.db);
            // Serviços
            this.parameterEngine = new ParameterEngine_1.ParameterEngine(this.firebaseService.db);
            this.cloudRunClient = new CloudRunClient_1.CloudRunClient('https://test-cloud-run-service.com');
            this.metricsService = new MetricsService_1.MetricsService('validation-script', 'development');
            const loggingService = new LoggingService_1.LoggingService('validation-script', 'development');
            this.auditService = new AuditService_1.AuditService(loggingService);
            this.notificationService = new NotificationService_1.NotificationService('test-project-id');
            // this.errorService = new ErrorService(this.firebaseService); // Removido - não existe no projeto
            // Orquestrador
            this.orchestrator = new AnalysisOrchestrator_1.AnalysisOrchestrator(this.firebaseService.db, 'https://test-cloud-run-service.com', 'test-project-id');
            this.addResult('services', 'success', 'Todos os serviços inicializados');
            console.log('✅ Serviços: OK');
        }
        catch (error) {
            this.addResult('services', 'error', `Erro na inicialização: ${error}`);
            console.log('❌ Serviços: ERRO');
            throw error;
        }
    }
    async validateRepositories() {
        console.log('\n📊 Validando repositórios...');
        // Validar DocumentRepository
        await this.validateDocumentRepository();
        // Validar AnalysisRepository
        await this.validateAnalysisRepository();
        // Validar OrganizationRepository
        await this.validateOrganizationRepository();
    }
    async validateDocumentRepository() {
        try {
            const startTime = Date.now();
            // Testar busca (deve retornar array vazio ou com dados)
            const documents = await this.documentRepo.findByOrganization('test-validation');
            const duration = Date.now() - startTime;
            this.addResult('document-repository', 'success', 'DocumentRepository funcionando', {
                documentsFound: documents.length,
                duration
            });
            console.log('✅ DocumentRepository: OK');
        }
        catch (error) {
            this.addResult('document-repository', 'error', `Erro no DocumentRepository: ${error}`);
            console.log('❌ DocumentRepository: ERRO');
        }
    }
    async validateAnalysisRepository() {
        try {
            const startTime = Date.now();
            // Testar busca (deve retornar array vazio ou com dados)
            const analyses = await this.analysisRepo.findByOrganization('test-validation');
            const duration = Date.now() - startTime;
            this.addResult('analysis-repository', 'success', 'AnalysisRepository funcionando', {
                analysesFound: analyses.length,
                duration
            });
            console.log('✅ AnalysisRepository: OK');
        }
        catch (error) {
            this.addResult('analysis-repository', 'error', `Erro no AnalysisRepository: ${error}`);
            console.log('❌ AnalysisRepository: ERRO');
        }
    }
    async validateOrganizationRepository() {
        try {
            const startTime = Date.now();
            // Testar busca por ID inexistente (deve retornar null)
            const organization = await this.organizationRepo.findById('test-validation-nonexistent');
            const duration = Date.now() - startTime;
            this.addResult('organization-repository', 'success', 'OrganizationRepository funcionando', {
                organizationFound: organization !== null,
                duration
            });
            console.log('✅ OrganizationRepository: OK');
        }
        catch (error) {
            this.addResult('organization-repository', 'error', `Erro no OrganizationRepository: ${error}`);
            console.log('❌ OrganizationRepository: ERRO');
        }
    }
    async validateCloudRun() {
        console.log('\n☁️ Validando Cloud Run...');
        try {
            const startTime = Date.now();
            // Testar conectividade (pode falhar se serviço não estiver rodando)
            try {
                const healthCheck = await this.cloudRunClient.healthCheck();
                const duration = Date.now() - startTime;
                this.addResult('cloud-run', 'success', 'Cloud Run acessível', {
                    healthStatus: healthCheck,
                    duration
                });
                console.log('✅ Cloud Run: OK');
            }
            catch (error) {
                // Cloud Run pode não estar rodando em desenvolvimento
                this.addResult('cloud-run', 'warning', 'Cloud Run não acessível (normal em dev)', {
                    error: error.message || String(error)
                });
                console.log('⚠️ Cloud Run: AVISO (não acessível)');
            }
        }
        catch (error) {
            this.addResult('cloud-run', 'error', `Erro no Cloud Run: ${error}`);
            console.log('❌ Cloud Run: ERRO');
        }
    }
    async validateOrchestrator() {
        console.log('\n🎼 Validando AnalysisOrchestrator...');
        try {
            // Testar geração de parâmetros
            await this.validateParameterGeneration();
            // Testar validação de requests
            await this.validateRequestValidation();
            console.log('✅ AnalysisOrchestrator: OK');
        }
        catch (error) {
            this.addResult('orchestrator', 'error', `Erro no AnalysisOrchestrator: ${error}`);
            console.log('❌ AnalysisOrchestrator: ERRO');
        }
    }
    async validateParameterGeneration() {
        try {
            const startTime = Date.now();
            const parameters = await this.parameterEngine.generateParameters('test-validation-org');
            const duration = Date.now() - startTime;
            this.addResult('parameter-engine', 'success', 'ParameterEngine funcionando', {
                parametersGenerated: Object.keys(parameters).length,
                duration
            });
        }
        catch (error) {
            this.addResult('parameter-engine', 'error', `Erro no ParameterEngine: ${error}`);
        }
    }
    async validateRequestValidation() {
        try {
            // Testar validação com request inválido
            const invalidRequest = {
                documentId: '', // ID vazio deve falhar
                organizationId: 'test-validation',
                userId: 'test-user',
                priority: 'normal',
                parameters: {},
                options: {
                    includeAI: false,
                    generateRecommendations: false,
                    detailedMetrics: false,
                    customRules: []
                }
            };
            try {
                await this.orchestrator.startAnalysis(invalidRequest);
                // Se chegou aqui, a validação não funcionou
                this.addResult('request-validation', 'error', 'Validação de request não funcionou');
            }
            catch (error) {
                // Erro esperado - validação funcionou
                this.addResult('request-validation', 'success', 'Validação de request funcionando', {
                    errorType: error.constructor?.name || 'UnknownError'
                });
            }
        }
        catch (error) {
            this.addResult('request-validation', 'error', `Erro na validação de request: ${error}`);
        }
    }
    async validateEndToEnd() {
        console.log('\n🔄 Validando fluxo end-to-end...');
        const testOrgId = `test-validation-${Date.now()}`;
        const testUserId = `test-user-${Date.now()}`;
        const testDocId = `test-doc-${Date.now()}`;
        try {
            // 1. Criar organização de teste
            await this.createTestOrganization(testOrgId);
            // 2. Criar documento de teste
            await this.createTestDocument(testDocId, testOrgId, testUserId);
            // 3. Testar geração de parâmetros
            await this.testParameterGeneration(testOrgId);
            // 4. Limpar dados de teste
            await this.cleanupTestData(testOrgId, testDocId);
            this.addResult('end-to-end', 'success', 'Fluxo end-to-end funcionando');
            console.log('✅ End-to-End: OK');
        }
        catch (error) {
            this.addResult('end-to-end', 'error', `Erro no fluxo end-to-end: ${error}`);
            console.log('❌ End-to-End: ERRO');
            // Tentar limpar mesmo com erro
            try {
                await this.cleanupTestData(testOrgId, testDocId);
            }
            catch (cleanupError) {
                console.warn('⚠️ Erro na limpeza:', cleanupError);
            }
        }
    }
    async createTestOrganization(orgId) {
        await this.organizationRepo.create({
            id: orgId,
            name: 'Organização de Validação',
            // type: 'EMPRESA_PRIVADA', // Removido - não existe no schema
            settings: {
                timezone: 'America/Sao_Paulo',
                language: 'pt-BR',
                defaultAnalysisPreset: 'STANDARD',
                enableAIAnalysis: false,
                enableCustomRules: false,
                strictMode: false,
                autoApproval: false,
                requireDualApproval: false,
                retentionDays: 365,
                maxDocumentSize: 52428800,
                allowedDocumentTypes: ['pdf', 'doc', 'docx']
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    async createTestDocument(docId, orgId, userId) {
        await this.documentRepo.create({
            id: docId,
            title: 'Documento de Validação',
            documentType: 'EDITAL',
            file: {
                originalName: 'validacao.pdf',
                filename: 'validacao.pdf',
                mimeType: 'application/pdf',
                size: 1024,
                extension: 'pdf',
                storagePath: '/test/validacao.pdf',
                downloadURL: 'https://test.com/validacao.pdf',
                checksum: 'validation123',
                encoding: 'utf-8',
                extractedText: 'Conteúdo de validação',
                ocrConfidence: 0.95,
                pageCount: 1
            },
            organizationId: orgId,
            createdBy: userId,
            status: 'UPLOADED',
            tags: ['validacao'],
            createdAt: new Date(),
            updatedAt: new Date()
        }, docId);
    }
    async testParameterGeneration(orgId) {
        const parameters = await this.parameterEngine.generateParameters(orgId);
        if (!parameters || typeof parameters !== 'object') {
            throw new Error('Parâmetros não gerados corretamente');
        }
    }
    async cleanupTestData(orgId, docId) {
        try {
            await this.documentRepo.delete(docId);
        }
        catch (error) {
            console.warn('Erro ao deletar documento de teste:', error);
        }
        try {
            await this.organizationRepo.delete(orgId);
        }
        catch (error) {
            console.warn('Erro ao deletar organização de teste:', error);
        }
    }
    addResult(service, status, message, details) {
        this.results.push({
            service,
            status,
            message,
            details,
            duration: details?.duration
        });
    }
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 RESUMO DA VALIDAÇÃO');
        console.log('='.repeat(60));
        const successCount = this.results.filter(r => r.status === 'success').length;
        const warningCount = this.results.filter(r => r.status === 'warning').length;
        const errorCount = this.results.filter(r => r.status === 'error').length;
        console.log(`\n✅ Sucessos: ${successCount}`);
        console.log(`⚠️ Avisos: ${warningCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log('\n📊 DETALHES:');
        this.results.forEach(result => {
            const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            const duration = result.duration ? ` (${result.duration}ms)` : '';
            console.log(`${icon} ${result.service}: ${result.message}${duration}`);
            if (result.details && Object.keys(result.details).length > 0) {
                console.log(`   Detalhes: ${JSON.stringify(result.details, null, 2)}`);
            }
        });
        console.log('\n' + '='.repeat(60));
        if (errorCount === 0) {
            console.log('🎉 INFRAESTRUTURA VALIDADA COM SUCESSO!');
        }
        else {
            console.log('🚨 PROBLEMAS ENCONTRADOS NA INFRAESTRUTURA');
        }
        console.log('='.repeat(60));
    }
}
exports.InfrastructureValidator = InfrastructureValidator;
// Executar validação se chamado diretamente
if (require.main === module) {
    const validator = new InfrastructureValidator();
    validator.validate()
        .then(results => {
        const hasErrors = results.some(r => r.status === 'error');
        process.exit(hasErrors ? 1 : 0);
    })
        .catch(error => {
        console.error('❌ Erro fatal na validação:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=validate-infrastructure.js.map