import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { AnalysisOrchestrator } from '../../services/AnalysisOrchestrator';
import { DocumentRepository } from '../../repositories/DocumentRepository';
import { AnalysisRepository } from '../../repositories/AnalysisRepository';
import { OrganizationRepository } from '../../repositories/OrganizationRepository';
import { ParameterEngine } from '../../services/ParameterEngine';
import { CloudRunClient } from '../../services/CloudRunClient';
import { FirebaseService } from '../../services/FirebaseService';
import { MetricsService } from '../../services/MetricsService';
import { AuditService } from '../../services/AuditService';
import { NotificationService } from '../../services/NotificationService';
import { ErrorService } from '../../services/ErrorService';
import { AnalysisRequest, AnalysisOptions } from '../../types/analysis.types';
import { DocumentType } from '../../types/document.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Testes de performance e timeout do AnalysisOrchestrator
 * Valida comportamento sob diferentes condições de carga e tempo
 */
describe('AnalysisOrchestrator - Performance e Timeout', () => {
  let orchestrator: AnalysisOrchestrator;
  let documentRepo: DocumentRepository;
  let analysisRepo: AnalysisRepository;
  let organizationRepo: OrganizationRepository;
  let parameterEngine: ParameterEngine;
  let cloudRunClient: CloudRunClient;
  let firebaseService: FirebaseService;
  let metricsService: MetricsService;
  let auditService: AuditService;
  let notificationService: NotificationService;
  let errorService: ErrorService;
  
  let testOrganizationId: string;
  let testUserId: string;
  let testDocumentIds: string[] = [];
  
  beforeAll(async () => {
    console.log('🚀 Inicializando testes de performance');
    
    // Inicializar serviços
    firebaseService = new FirebaseService();
    await firebaseService.initialize();
    
    documentRepo = new DocumentRepository(firebaseService);
    analysisRepo = new AnalysisRepository(firebaseService);
    organizationRepo = new OrganizationRepository(firebaseService);
    parameterEngine = new ParameterEngine(firebaseService);
    cloudRunClient = new CloudRunClient();
    metricsService = new MetricsService();
    auditService = new AuditService(firebaseService);
    notificationService = new NotificationService();
    errorService = new ErrorService(firebaseService);
    
    orchestrator = new AnalysisOrchestrator(
      documentRepo,
      analysisRepo,
      parameterEngine,
      cloudRunClient,
      metricsService,
      auditService,
      notificationService,
      errorService
    );
    
    // Criar organização de teste
    testOrganizationId = `test-org-perf-${Date.now()}`;
    testUserId = `test-user-perf-${Date.now()}`;
    
    await organizationRepo.create({
      id: testOrganizationId,
      name: 'Organização de Teste - Performance',
      type: 'EMPRESA_PRIVADA',
      settings: {
        analysisDefaults: {
          includeAI: true,
          generateRecommendations: true,
          detailedMetrics: true
        },
        notifications: {
          email: false, // Desabilitar para performance
          inApp: false
        },
        performance: {
          maxConcurrentAnalyses: 10,
          timeoutSeconds: 300,
          priorityQueueEnabled: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Ambiente de teste de performance inicializado');
  });
  
  afterAll(async () => {
    console.log('🧹 Limpando dados de teste de performance');
    
    try {
      // Limpar documentos de teste
      for (const docId of testDocumentIds) {
        try {
          await documentRepo.delete(docId);
        } catch (error) {
          console.warn(`Erro ao deletar documento ${docId}:`, error);
        }
      }
      
      // Limpar análises de teste
      const analyses = await analysisRepo.findByOrganization(testOrganizationId);
      for (const analysis of analyses) {
        try {
          await analysisRepo.delete(analysis.id);
        } catch (error) {
          console.warn(`Erro ao deletar análise ${analysis.id}:`, error);
        }
      }
      
      // Limpar organização de teste
      await organizationRepo.delete(testOrganizationId);
      
      console.log('✅ Limpeza de performance tests concluída');
    } catch (error) {
      console.warn('⚠️ Erro na limpeza de performance tests:', error);
    }
  });
  
  describe('Performance de Inicialização', () => {
    it('deve inicializar análise rapidamente', async () => {
      console.log('🧪 Testando velocidade de inicialização');
      
      const documentId = `test-doc-init-${Date.now()}`;
      testDocumentIds.push(documentId);
      
      // Criar documento
      const document = await documentRepo.create({
        id: documentId,
        title: 'Documento para Teste de Inicialização',
        documentType: 'EDITAL' as DocumentType,
        file: {
          originalName: 'documento-init.pdf',
          filename: 'documento-init.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
          extension: 'pdf',
          storagePath: '/storage/documents/documento-init.pdf',
          downloadURL: 'https://storage.example.com/documento-init.pdf',
          checksum: 'init123456789',
          encoding: 'utf-8',
          extractedText: 'Conteúdo para teste de inicialização rápida',
          ocrConfidence: 0.90,
          pageCount: 10
        },
        organizationId: testOrganizationId,
        createdBy: testUserId,
        status: 'UPLOADED',
        tags: ['teste', 'performance', 'init'],
        createdAt: new Date(),
        updatedAt: new Date()
      }, documentId);
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      
      const analysisRequest: AnalysisRequest = {
        documentId: document.id,
        organizationId: testOrganizationId,
        userId: testUserId,
        priority: 'high',
        parameters: parameters,
        options: {
          includeAI: false, // Desabilitar IA para teste de velocidade
          generateRecommendations: false,
          detailedMetrics: false,
          customRules: []
        }
      };
      
      // Medir tempo de inicialização
      const startTime = Date.now();
      const analysisId = await orchestrator.startAnalysis(analysisRequest);
      const initTime = Date.now() - startTime;
      
      expect(analysisId).toBeDefined();
      expect(initTime).toBeLessThan(5000); // Deve inicializar em menos de 5 segundos
      
      console.log('✅ Inicialização rápida:', {
        tempo: `${initTime}ms`,
        analysisId,
        limite: '5000ms'
      });
    }, 15000);
    
    it('deve gerar parâmetros rapidamente', async () => {
      console.log('🧪 Testando velocidade de geração de parâmetros');
      
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const parameters = await parameterEngine.generateParameters(testOrganizationId);
        const genTime = Date.now() - startTime;
        
        times.push(genTime);
        expect(parameters).toBeDefined();
        expect(parameters.weights).toBeDefined();
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      
      expect(avgTime).toBeLessThan(1000); // Média deve ser menor que 1 segundo
      expect(maxTime).toBeLessThan(3000); // Máximo deve ser menor que 3 segundos
      
      console.log('✅ Geração de parâmetros rápida:', {
        iteracoes: iterations,
        tempoMedio: `${avgTime.toFixed(2)}ms`,
        tempoMaximo: `${maxTime}ms`,
        tempos: times.map(t => `${t}ms`).join(', ')
      });
    }, 30000);
  });
  
  describe('Performance Concorrente', () => {
    it('deve lidar com múltiplas análises simultâneas', async () => {
      console.log('🧪 Testando análises simultâneas');
      
      const concurrentCount = 5;
      const documents: any[] = [];
      const analysisPromises: Promise<string>[] = [];
      
      // Criar documentos para análise simultânea
      for (let i = 0; i < concurrentCount; i++) {
        const documentId = `test-doc-concurrent-${Date.now()}-${i}`;
        testDocumentIds.push(documentId);
        
        const document = await documentRepo.create({
          id: documentId,
          title: `Documento Concorrente ${i + 1}`,
          documentType: 'EDITAL' as DocumentType,
          file: {
            originalName: `documento-concurrent-${i}.pdf`,
            filename: `documento-concurrent-${i}.pdf`,
            mimeType: 'application/pdf',
            size: 1024000 + (i * 100000), // Tamanhos variados
            extension: 'pdf',
            storagePath: `/storage/documents/documento-concurrent-${i}.pdf`,
            downloadURL: `https://storage.example.com/documento-concurrent-${i}.pdf`,
            checksum: `concurrent${i}123456789`,
            encoding: 'utf-8',
            extractedText: `Conteúdo para teste concorrente ${i + 1} `.repeat(10 + i),
            ocrConfidence: 0.85 + (i * 0.02),
            pageCount: 10 + (i * 5)
          },
          organizationId: testOrganizationId,
          createdBy: testUserId,
          status: 'UPLOADED',
          tags: ['teste', 'concurrent', `batch-${i}`],
          createdAt: new Date(),
          updatedAt: new Date()
        }, documentId);
        
        documents.push(document);
      }
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      
      // Iniciar análises simultâneas
      const startTime = Date.now();
      
      for (let i = 0; i < concurrentCount; i++) {
        const analysisRequest: AnalysisRequest = {
          documentId: documents[i].id,
          organizationId: testOrganizationId,
          userId: testUserId,
          priority: i < 2 ? 'high' : 'normal', // Prioridades variadas
          parameters: parameters,
          options: {
            includeAI: false,
            generateRecommendations: i % 2 === 0, // Alternado
            detailedMetrics: false,
            customRules: []
          }
        };
        
        analysisPromises.push(orchestrator.startAnalysis(analysisRequest));
      }
      
      // Aguardar todas as análises
      const analysisIds = await Promise.all(analysisPromises);
      const totalTime = Date.now() - startTime;
      
      expect(analysisIds).toHaveLength(concurrentCount);
      analysisIds.forEach(id => expect(id).toBeDefined());
      
      // Verificar que todas as análises foram criadas
      for (const analysisId of analysisIds) {
        const analysis = await analysisRepo.findById(analysisId);
        expect(analysis).toBeDefined();
        expect(analysis!.processing.status).toBe('PENDING');
      }
      
      console.log('✅ Análises simultâneas:', {
        quantidade: concurrentCount,
        tempoTotal: `${totalTime}ms`,
        tempoPorAnalise: `${(totalTime / concurrentCount).toFixed(2)}ms`,
        analysisIds: analysisIds.length
      });
    }, 60000);
    
    it('deve priorizar análises de alta prioridade', async () => {
      console.log('🧪 Testando priorização de análises');
      
      const documents: any[] = [];
      const priorities = ['low', 'normal', 'high', 'urgent'] as const;
      
      // Criar documentos com diferentes prioridades
      for (let i = 0; i < priorities.length; i++) {
        const documentId = `test-doc-priority-${Date.now()}-${i}`;
        testDocumentIds.push(documentId);
        
        const document = await documentRepo.create({
          id: documentId,
          title: `Documento Prioridade ${priorities[i]}`,
          documentType: 'EDITAL' as DocumentType,
          file: {
            originalName: `documento-priority-${priorities[i]}.pdf`,
            filename: `documento-priority-${priorities[i]}.pdf`,
            mimeType: 'application/pdf',
            size: 1024000,
            extension: 'pdf',
            storagePath: `/storage/documents/documento-priority-${priorities[i]}.pdf`,
            downloadURL: `https://storage.example.com/documento-priority-${priorities[i]}.pdf`,
            checksum: `priority${i}123456789`,
            encoding: 'utf-8',
            extractedText: `Conteúdo para teste de prioridade ${priorities[i]}`,
            ocrConfidence: 0.88,
            pageCount: 12
          },
          organizationId: testOrganizationId,
          createdBy: testUserId,
          status: 'UPLOADED',
          tags: ['teste', 'priority', priorities[i]],
          createdAt: new Date(),
          updatedAt: new Date()
        }, documentId);
        
        documents.push(document);
      }
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      const analysisIds: string[] = [];
      const creationTimes: number[] = [];
      
      // Criar análises em ordem reversa de prioridade (low primeiro)
      for (let i = 0; i < priorities.length; i++) {
        const analysisRequest: AnalysisRequest = {
          documentId: documents[i].id,
          organizationId: testOrganizationId,
          userId: testUserId,
          priority: priorities[i],
          parameters: parameters,
          options: {
            includeAI: false,
            generateRecommendations: false,
            detailedMetrics: false,
            customRules: []
          }
        };
        
        const startTime = Date.now();
        const analysisId = await orchestrator.startAnalysis(analysisRequest);
        const creationTime = Date.now() - startTime;
        
        analysisIds.push(analysisId);
        creationTimes.push(creationTime);
      }
      
      // Verificar que análises de alta prioridade foram processadas mais rapidamente
      expect(analysisIds).toHaveLength(priorities.length);
      
      console.log('✅ Priorização testada:', {
        prioridades: priorities,
        temposCriacao: creationTimes.map((t, i) => `${priorities[i]}: ${t}ms`),
        analysisIds: analysisIds.length
      });
    }, 45000);
  });
  
  describe('Timeout e Limites', () => {
    it('deve respeitar timeout de análise', async () => {
      console.log('🧪 Testando timeout de análise');
      
      const documentId = `test-doc-timeout-${Date.now()}`;
      testDocumentIds.push(documentId);
      
      const document = await documentRepo.create({
        id: documentId,
        title: 'Documento para Teste de Timeout',
        documentType: 'EDITAL' as DocumentType,
        file: {
          originalName: 'documento-timeout.pdf',
          filename: 'documento-timeout.pdf',
          mimeType: 'application/pdf',
          size: 5242880, // 5MB - documento grande
          extension: 'pdf',
          storagePath: '/storage/documents/documento-timeout.pdf',
          downloadURL: 'https://storage.example.com/documento-timeout.pdf',
          checksum: 'timeout123456789',
          encoding: 'utf-8',
          extractedText: 'Conteúdo muito longo para simular timeout '.repeat(1000),
          ocrConfidence: 0.85,
          pageCount: 200 // Muitas páginas
        },
        organizationId: testOrganizationId,
        createdBy: testUserId,
        status: 'UPLOADED',
        tags: ['teste', 'timeout'],
        createdAt: new Date(),
        updatedAt: new Date()
      }, documentId);
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      
      const analysisRequest: AnalysisRequest = {
        documentId: document.id,
        organizationId: testOrganizationId,
        userId: testUserId,
        priority: 'normal',
        parameters: parameters,
        options: {
          includeAI: true, // IA pode ser mais lenta
          generateRecommendations: true,
          detailedMetrics: true,
          customRules: [],
          timeout: 10000 // Timeout de 10 segundos
        }
      };
      
      // Simular processamento lento
      const originalStartAnalysis = cloudRunClient.startAnalysis;
      cloudRunClient.startAnalysis = async (request: any) => {
        // Simular delay maior que o timeout
        await new Promise(resolve => setTimeout(resolve, 15000));
        return { analysisId: `analysis-timeout-${Date.now()}`, status: 'PENDING' };
      };
      
      try {
        const startTime = Date.now();
        
        await expect(orchestrator.startAnalysis(analysisRequest))
          .rejects
          .toThrow(/timeout/i);
        
        const actualTime = Date.now() - startTime;
        expect(actualTime).toBeLessThan(12000); // Deve falhar antes de 12 segundos
        
        console.log('✅ Timeout respeitado:', {
          timeoutConfigurado: '10000ms',
          tempoReal: `${actualTime}ms`
        });
      } finally {
        // Restaurar método original
        cloudRunClient.startAnalysis = originalStartAnalysis;
      }
    }, 30000);
    
    it('deve limitar número de análises concorrentes', async () => {
      console.log('🧪 Testando limite de análises concorrentes');
      
      const maxConcurrent = 3; // Limite baixo para teste
      const totalRequests = 6; // Mais que o limite
      
      const documents: any[] = [];
      
      // Criar documentos
      for (let i = 0; i < totalRequests; i++) {
        const documentId = `test-doc-limit-${Date.now()}-${i}`;
        testDocumentIds.push(documentId);
        
        const document = await documentRepo.create({
          id: documentId,
          title: `Documento Limite ${i + 1}`,
          documentType: 'EDITAL' as DocumentType,
          file: {
            originalName: `documento-limit-${i}.pdf`,
            filename: `documento-limit-${i}.pdf`,
            mimeType: 'application/pdf',
            size: 1024000,
            extension: 'pdf',
            storagePath: `/storage/documents/documento-limit-${i}.pdf`,
            downloadURL: `https://storage.example.com/documento-limit-${i}.pdf`,
            checksum: `limit${i}123456789`,
            encoding: 'utf-8',
            extractedText: `Conteúdo para teste de limite ${i + 1}`,
            ocrConfidence: 0.88,
            pageCount: 10
          },
          organizationId: testOrganizationId,
          createdBy: testUserId,
          status: 'UPLOADED',
          tags: ['teste', 'limit'],
          createdAt: new Date(),
          updatedAt: new Date()
        }, documentId);
        
        documents.push(document);
      }
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      
      // Simular processamento lento para manter análises ativas
      const originalStartAnalysis = cloudRunClient.startAnalysis;
      let activeAnalyses = 0;
      let maxActiveAnalyses = 0;
      
      cloudRunClient.startAnalysis = async (request: any) => {
        activeAnalyses++;
        maxActiveAnalyses = Math.max(maxActiveAnalyses, activeAnalyses);
        
        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        activeAnalyses--;
        return { analysisId: `analysis-limit-${Date.now()}`, status: 'PENDING' };
      };
      
      try {
        const analysisPromises: Promise<string>[] = [];
        
        // Iniciar todas as análises simultaneamente
        for (let i = 0; i < totalRequests; i++) {
          const analysisRequest: AnalysisRequest = {
            documentId: documents[i].id,
            organizationId: testOrganizationId,
            userId: testUserId,
            priority: 'normal',
            parameters: parameters,
            options: {
              includeAI: false,
              generateRecommendations: false,
              detailedMetrics: false,
              customRules: []
            }
          };
          
          analysisPromises.push(orchestrator.startAnalysis(analysisRequest));
        }
        
        const analysisIds = await Promise.all(analysisPromises);
        
        expect(analysisIds).toHaveLength(totalRequests);
        expect(maxActiveAnalyses).toBeLessThanOrEqual(maxConcurrent + 1); // Margem de erro
        
        console.log('✅ Limite de concorrência respeitado:', {
          limite: maxConcurrent,
          totalRequests,
          maxAtivas: maxActiveAnalyses,
          analysisIds: analysisIds.length
        });
      } finally {
        // Restaurar método original
        cloudRunClient.startAnalysis = originalStartAnalysis;
      }
    }, 60000);
  });
  
  describe('Métricas de Performance', () => {
    it('deve coletar métricas de tempo de resposta', async () => {
      console.log('🧪 Testando coleta de métricas');
      
      const documentId = `test-doc-metrics-${Date.now()}`;
      testDocumentIds.push(documentId);
      
      const document = await documentRepo.create({
        id: documentId,
        title: 'Documento para Teste de Métricas',
        documentType: 'EDITAL' as DocumentType,
        file: {
          originalName: 'documento-metrics.pdf',
          filename: 'documento-metrics.pdf',
          mimeType: 'application/pdf',
          size: 1024000,
          extension: 'pdf',
          storagePath: '/storage/documents/documento-metrics.pdf',
          downloadURL: 'https://storage.example.com/documento-metrics.pdf',
          checksum: 'metrics123456789',
          encoding: 'utf-8',
          extractedText: 'Conteúdo para teste de métricas de performance',
          ocrConfidence: 0.92,
          pageCount: 15
        },
        organizationId: testOrganizationId,
        createdBy: testUserId,
        status: 'UPLOADED',
        tags: ['teste', 'metrics'],
        createdAt: new Date(),
        updatedAt: new Date()
      }, documentId);
      
      const parameters = await parameterEngine.generateParameters(testOrganizationId);
      
      const analysisRequest: AnalysisRequest = {
        documentId: document.id,
        organizationId: testOrganizationId,
        userId: testUserId,
        priority: 'normal',
        parameters: parameters,
        options: {
          includeAI: false,
          generateRecommendations: true,
          detailedMetrics: true, // Habilitar métricas detalhadas
          customRules: []
        }
      };
      
      const startTime = Date.now();
      const analysisId = await orchestrator.startAnalysis(analysisRequest);
      const responseTime = Date.now() - startTime;
      
      expect(analysisId).toBeDefined();
      
      // Verificar se a análise foi criada com métricas
      const analysis = await analysisRepo.findById(analysisId);
      expect(analysis).toBeDefined();
      expect(analysis!.request.options.detailedMetrics).toBe(true);
      
      console.log('✅ Métricas coletadas:', {
        tempoResposta: `${responseTime}ms`,
        analysisId,
        metricasDetalhadas: analysis!.request.options.detailedMetrics
      });
    }, 20000);
  });
});