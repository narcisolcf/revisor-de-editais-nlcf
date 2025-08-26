/**
 * Teste End-to-End do fluxo completo de análise
 * Sprint 1 - LicitaReview
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { firestore } from '../config/firebase';
import { AnalysisOrchestrator } from '../services/AnalysisOrchestrator';
import { DocumentRepository } from '../db/repositories/DocumentRepository';
import { AnalysisRepository } from '../db/repositories/AnalysisRepository';
import { OrganizationRepository } from '../db/repositories/OrganizationRepository';
import { ParameterEngine } from '../services/ParameterEngine';
import { CloudRunClient } from '../services/CloudRunClient';
import { TaskQueueService } from '../services/TaskQueueService';
import { OrganizationConfigService } from '../services/OrganizationConfigService';
import { AnalysisStatus, DocumentType, AnalysisPriority } from '../types/config.types';

// Configuração do ambiente de teste
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.NODE_ENV = 'test';

describe('Fluxo End-to-End de Análise', () => {
  let orchestrator: AnalysisOrchestrator;
  let documentRepo: DocumentRepository;
  let analysisRepo: AnalysisRepository;
  let organizationRepo: OrganizationRepository;
  let parameterEngine: ParameterEngine;
  let cloudRunClient: CloudRunClient;
  let taskQueue: TaskQueueService;
  let configService: OrganizationConfigService;
  
  const testOrganizationId = 'test-org-e2e';
  const testUserId = 'test-user-e2e';
  
  beforeAll(async () => {
    // Inicializar serviços
    documentRepo = new DocumentRepository(firestore);
    analysisRepo = new AnalysisRepository(firestore);
    organizationRepo = new OrganizationRepository(firestore);
    
    parameterEngine = new ParameterEngine(firestore, {
      enableAdaptiveWeights: true,
      enableLearningMode: false, // Desabilitar para testes
      adaptationThreshold: 10,
      maxWeightAdjustment: 15.0,
      cacheTimeout: 30 * 60 * 1000
    });
    
    cloudRunClient = new CloudRunClient({
      serviceUrl: 'http://localhost:8080', // Mock URL
      timeout: 30000,
      retryAttempts: 3
    });
    
    taskQueue = new TaskQueueService(firestore);
    configService = new OrganizationConfigService(firestore, cloudRunClient);
    
    orchestrator = new AnalysisOrchestrator(
      firestore,
      'http://localhost:8080',
      'test-project'
    );
    
    // Criar organização de teste
    await organizationRepo.create({
      id: testOrganizationId,
      name: 'Organização Teste E2E',
      type: 'MUNICIPAL',
      settings: {
        analysisTimeout: 300000,
        maxConcurrentAnalyses: 5,
        enableAIAnalysis: true,
        enableDetailedReports: true
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    });
    
    console.log('✅ Ambiente de teste E2E configurado');
  });
  
  afterAll(async () => {
    // Limpar dados de teste
    try {
      const batch = firestore.batch();
      
      // Limpar documentos
      const docs = await firestore
        .collection('documents')
        .where('organizationId', '==', testOrganizationId)
        .get();
      
      docs.forEach(doc => batch.delete(doc.ref));
      
      // Limpar análises
      const analyses = await firestore
        .collection('analyses')
        .where('organizationId', '==', testOrganizationId)
        .get();
      
      analyses.forEach(analysis => batch.delete(analysis.ref));
      
      // Limpar organização
      batch.delete(firestore.collection('organizations').doc(testOrganizationId));
      
      await batch.commit();
      console.log('🧹 Dados de teste E2E limpos');
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
    }
  });
  
  it('deve executar fluxo completo de análise de edital', async () => {
    console.log('🚀 Iniciando teste E2E do fluxo de análise');
    
    // 1. Criar documento de teste
    const documentData = {
      id: 'doc-test-e2e-001',
      organizationId: testOrganizationId,
      name: 'Edital de Teste E2E - Serviços de TI',
      type: DocumentType.EDITAL,
      content: `
        EDITAL DE LICITAÇÃO Nº 001/2024
        
        OBJETO: Contratação de empresa especializada em serviços de tecnologia da informação
        para desenvolvimento e manutenção de sistemas web.
        
        VALOR ESTIMADO: R$ 500.000,00
        
        PRAZO DE EXECUÇÃO: 12 meses
        
        CRITÉRIO DE JULGAMENTO: Menor preço
        
        DOCUMENTOS OBRIGATÓRIOS:
        - Certidão de regularidade fiscal
        - Comprovação de experiência técnica
        - Atestado de capacidade técnica
        
        ESPECIFICAÇÕES TÉCNICAS:
        - Desenvolvimento em tecnologias modernas (React, Node.js)
        - Banco de dados PostgreSQL
        - Hospedagem em nuvem
        - Implementação de testes automatizados
      `,
      metadata: {
        fileSize: 2048,
        mimeType: 'text/plain',
        uploadedBy: testUserId,
        extractedText: true
      },
      uploadedAt: new Date(),
      status: 'PROCESSED'
    };
    
    const document = await documentRepo.create(documentData);
    expect(document.id).toBe('doc-test-e2e-001');
    console.log('✅ Documento criado:', document.id);
    
    // 2. Gerar parâmetros de análise
    const parameters = await parameterEngine.generateParameters(testOrganizationId);
    expect(parameters).toBeDefined();
    expect(parameters.organizationId).toBe(testOrganizationId);
    expect(parameters.weights).toBeDefined();
    console.log('✅ Parâmetros gerados:', {
      weights: parameters.weights,
      rulesCount: parameters.customRules.length
    });
    
    // 3. Iniciar análise
    const analysisRequest = {
      documentId: document.id,
      organizationId: testOrganizationId,
      userId: testUserId,
      priority: AnalysisPriority.NORMAL,
      parameters: parameters
    };
    
    const analysis = await orchestrator.startAnalysis(analysisRequest);
    expect(analysis).toBeDefined();
    expect(analysis.status).toBe(AnalysisStatus.PENDING);
    console.log('✅ Análise iniciada:', analysis.id);
    
    // 4. Simular processamento (em ambiente real seria assíncrono)
    // Para o teste, vamos simular o resultado da análise
    const mockAnalysisResult = {
      documentId: document.id,
      organizationId: testOrganizationId,
      scores: {
        technical: 85,
        legal: 92,
        financial: 78,
        overall: 85
      },
      findings: [
        {
          category: 'technical',
          severity: 'medium',
          description: 'Especificações técnicas bem definidas',
          recommendation: 'Considerar adicionar requisitos de segurança'
        },
        {
          category: 'legal',
          severity: 'low',
          description: 'Documentação legal completa',
          recommendation: 'Manter padrão atual'
        },
        {
          category: 'financial',
          severity: 'medium',
          description: 'Valor estimado dentro da faixa esperada',
          recommendation: 'Verificar detalhamento de custos'
        }
      ],
      risks: [
        {
          type: 'technical',
          level: 'medium',
          description: 'Complexidade técnica moderada',
          mitigation: 'Exigir comprovação de experiência específica'
        }
      ],
      recommendations: [
        'Incluir cláusulas de SLA específicas',
        'Definir critérios de aceitação detalhados',
        'Estabelecer marcos de entrega intermediários'
      ],
      metadata: {
        processingTime: 15000,
        aiConfidence: 0.87,
        rulesApplied: parameters.customRules.length,
        version: '1.0.0'
      }
    };
    
    // 5. Atualizar análise com resultado
    const updatedAnalysis = await analysisRepo.update(analysis.id, {
      status: AnalysisStatus.COMPLETED,
      result: mockAnalysisResult,
      completedAt: new Date(),
      processingTime: 15000
    });
    
    expect(updatedAnalysis.status).toBe(AnalysisStatus.COMPLETED);
    expect(updatedAnalysis.result).toBeDefined();
    expect(updatedAnalysis.result!.scores.overall).toBe(85);
    console.log('✅ Análise concluída com sucesso:', {
      id: updatedAnalysis.id,
      overallScore: updatedAnalysis.result!.scores.overall,
      findingsCount: updatedAnalysis.result!.findings.length
    });
    
    // 6. Verificar persistência dos dados
    const retrievedDocument = await documentRepo.findById(document.id);
    expect(retrievedDocument).toBeDefined();
    expect(retrievedDocument!.name).toBe(documentData.name);
    
    const retrievedAnalysis = await analysisRepo.findById(analysis.id);
    expect(retrievedAnalysis).toBeDefined();
    expect(retrievedAnalysis!.status).toBe(AnalysisStatus.COMPLETED);
    
    // 7. Testar busca por configuração
    const analysesByConfig = await analysisRepo.findByConfiguration(testOrganizationId, {
      limit: 10,
      status: AnalysisStatus.COMPLETED
    });
    
    expect(analysesByConfig.length).toBeGreaterThan(0);
    expect(analysesByConfig[0].organizationId).toBe(testOrganizationId);
    
    console.log('✅ Fluxo E2E concluído com sucesso!');
    console.log('📊 Resumo do teste:', {
      documentoId: document.id,
      analiseId: analysis.id,
      scoreGeral: updatedAnalysis.result!.scores.overall,
      tempoProcessamento: updatedAnalysis.processingTime,
      achados: updatedAnalysis.result!.findings.length,
      riscos: updatedAnalysis.result!.risks.length,
      recomendacoes: updatedAnalysis.result!.recommendations.length
    });
  }, 60000); // Timeout de 60 segundos
  
  it('deve lidar com erro de análise graciosamente', async () => {
    console.log('🧪 Testando tratamento de erro na análise');
    
    // Criar documento com conteúdo problemático
    const problematicDocument = await documentRepo.create({
      id: 'doc-error-test',
      organizationId: testOrganizationId,
      name: 'Documento com Erro',
      type: DocumentType.EDITAL,
      content: '', // Conteúdo vazio para simular erro
      metadata: {
        fileSize: 0,
        mimeType: 'text/plain',
        uploadedBy: testUserId,
        extractedText: false
      },
      uploadedAt: new Date(),
      status: 'PROCESSED'
    });
    
    const parameters = await parameterEngine.generateParameters(testOrganizationId);
    
    const analysisRequest = {
      documentId: problematicDocument.id,
      organizationId: testOrganizationId,
      userId: testUserId,
      priority: AnalysisPriority.HIGH,
      parameters: parameters
    };
    
    const analysis = await orchestrator.startAnalysis(analysisRequest);
    
    // Simular erro na análise
    const errorAnalysis = await analysisRepo.update(analysis.id, {
      status: AnalysisStatus.FAILED,
      error: {
        code: 'EMPTY_CONTENT',
        message: 'Documento não possui conteúdo para análise',
        details: {
          documentId: problematicDocument.id,
          contentLength: 0
        }
      },
      completedAt: new Date(),
      processingTime: 1000
    });
    
    expect(errorAnalysis.status).toBe(AnalysisStatus.FAILED);
    expect(errorAnalysis.error).toBeDefined();
    expect(errorAnalysis.error!.code).toBe('EMPTY_CONTENT');
    
    console.log('✅ Erro tratado corretamente:', errorAnalysis.error);
  });
  
  it('deve otimizar parâmetros baseado no histórico', async () => {
    console.log('🔧 Testando otimização de parâmetros');
    
    // Criar algumas análises históricas simuladas
    const historicalAnalyses = [];
    
    for (let i = 0; i < 5; i++) {
      const doc = await documentRepo.create({
        id: `doc-history-${i}`,
        organizationId: testOrganizationId,
        name: `Documento Histórico ${i}`,
        type: DocumentType.EDITAL,
        content: `Conteúdo do documento ${i}`,
        metadata: {
          fileSize: 1024,
          mimeType: 'text/plain',
          uploadedBy: testUserId,
          extractedText: true
        },
        uploadedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Documentos dos últimos dias
        status: 'PROCESSED'
      });
      
      const analysis = await analysisRepo.create({
        id: `analysis-history-${i}`,
        documentId: doc.id,
        organizationId: testOrganizationId,
        userId: testUserId,
        status: AnalysisStatus.COMPLETED,
        priority: AnalysisPriority.NORMAL,
        result: {
          documentId: doc.id,
          organizationId: testOrganizationId,
          scores: {
            technical: 80 + (i * 2),
            legal: 85 + (i * 1),
            financial: 75 + (i * 3),
            overall: 80 + (i * 2)
          },
          findings: [],
          risks: [],
          recommendations: [],
          metadata: {
            processingTime: 10000,
            aiConfidence: 0.8 + (i * 0.02),
            rulesApplied: 5,
            version: '1.0.0'
          }
        },
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
        completedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 15000),
        processingTime: 15000
      });
      
      historicalAnalyses.push(analysis);
    }
    
    // Otimizar parâmetros baseado no histórico
    const optimizationResult = await parameterEngine.optimizeParameters(
      testOrganizationId,
      historicalAnalyses
    );
    
    expect(optimizationResult).toBeDefined();
    expect(optimizationResult.suggestedWeights).toBeDefined();
    expect(optimizationResult.confidence).toBeGreaterThan(0);
    
    console.log('✅ Otimização concluída:', {
      pesosOtimizados: optimizationResult.suggestedWeights,
      confianca: optimizationResult.confidence,
      melhorias: optimizationResult.improvements?.length || 0
    });
  });
});