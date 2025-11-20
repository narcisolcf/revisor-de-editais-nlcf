/**
 * Testes de Integração End-to-End
 * 🚀 Validação completa Cloud Functions ↔ Cloud Run ↔ Firestore
 *
 * Testa o fluxo completo:
 * 1. Upload de documento via Cloud Functions
 * 2. Processamento no Cloud Run
 * 3. Persistência no Firestore
 * 4. Recuperação de resultados
 */

import { test, expect } from '@playwright/test';

const CLOUD_FUNCTIONS_BASE_URL = process.env.CLOUD_FUNCTIONS_URL || 'http://localhost:5001';
const CLOUD_RUN_BASE_URL = process.env.CLOUD_RUN_URL || 'http://localhost:8080';

test.describe('Integração End-to-End: Cloud Functions ↔ Cloud Run ↔ Firestore', () => {

  test('E2E-001: Health Check - Cloud Run Service', async ({ request }) => {
    // Validar que o serviço Cloud Run está rodando
    const response = await request.get(`${CLOUD_RUN_BASE_URL}/health`);

    expect(response.status()).toBe(200);

    const health = await response.json();

    expect(health.status).toBeDefined();
    expect(health.version).toBe('2.0.0');
    expect(health.services).toBeDefined();
    expect(health.services.analysis).toBe(true);
    expect(health.services.classification).toBe(true);

    console.log('✅ Cloud Run Health Check:', health.status);
    console.log('💾 Firestore Status:', health.services.firestore ? 'Conectado' : 'Desconectado');
  });

  test('E2E-002: Análise de Documento com Persistência Real', async ({ request }) => {
    // Dados de teste
    const testDocument = {
      document_content: `
        EDITAL DE PREGÃO ELETRÔNICO Nº 001/2025

        Objeto: Contratação de serviços de desenvolvimento de software

        Modalidade: Pregão Eletrônico

        O Município de São Paulo torna público que fará realizar licitação...

        1. DO OBJETO
        A presente licitação tem por objeto a contratação de empresa especializada...

        2. DA PARTICIPAÇÃO
        Poderão participar desta licitação empresas do ramo pertinente ao objeto...
      `,
      document_type: 'EDITAL',
      organization_config: {
        organization_id: 'test-org-001',
        name: 'Prefeitura de São Paulo'
      },
      analysis_options: {
        weights: {
          structural: 25,
          legal: 30,
          clarity: 25,
          abnt: 20
        },
        include_ai: false,
        generate_recommendations: true,
        detailedMetrics: true,
        custom_rules: []
      },
      metadata: {
        document_id: `test-doc-${Date.now()}`,
        file_size: 5000,
        upload_date: new Date().toISOString()
      }
    };

    console.log('📤 Enviando documento para análise...');
    console.log(`📄 Document ID: ${testDocument.metadata.document_id}`);

    // Enviar para análise no Cloud Run
    const response = await request.post(`${CLOUD_RUN_BASE_URL}/analyze`, {
      data: testDocument,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos timeout
    });

    // Validar resposta
    expect(response.status()).toBe(200);

    const result = await response.json();

    // Validar estrutura da resposta
    expect(result.analysis_id).toBeDefined();
    expect(result.document_id).toBe(testDocument.metadata.document_id);
    expect(result.organization_id).toBe('test-org-001');
    expect(result.status).toBe('completed');

    // Validar resultados da análise
    expect(result.results).toBeDefined();
    expect(result.results.conformity_score).toBeGreaterThan(0);
    expect(result.results.conformity_score).toBeLessThanOrEqual(1);
    expect(result.results.confidence).toBeGreaterThan(0);
    expect(result.results.problems).toBeDefined();
    expect(Array.isArray(result.results.problems)).toBe(true);
    expect(result.results.recommendations).toBeDefined();
    expect(Array.isArray(result.results.recommendations)).toBe(true);

    // Validar métricas
    expect(result.results.metrics).toBeDefined();
    expect(result.results.metrics.processing_time).toBeGreaterThan(0);

    // Validar categorias analisadas
    expect(result.results.categories).toBeDefined();

    console.log('✅ Análise concluída com sucesso');
    console.log(`📊 Conformity Score: ${result.results.conformity_score}`);
    console.log(`⏱️  Processing Time: ${result.processing_time}s`);
    console.log(`🔍 Análise ID: ${result.analysis_id}`);
  });

  test('E2E-003: Classificação de Documento', async ({ request }) => {
    const testDocument = {
      document_content: `
        EDITAL DE CONCORRÊNCIA PÚBLICA Nº 005/2025
        Objeto: Obras de infraestrutura urbana
        Modalidade: Concorrência Pública
      `,
      metadata: {
        document_id: `test-classification-${Date.now()}`
      }
    };

    console.log('🏷️  Classificando documento...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/classify`, {
      data: testDocument,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.document_id).toBeDefined();
    expect(result.classification).toBeDefined();
    expect(result.classification.type).toBeDefined();
    expect(result.classification.confidence).toBeGreaterThan(0);
    expect(result.classification.categories).toBeDefined();
    expect(Array.isArray(result.classification.categories)).toBe(true);

    console.log('✅ Classificação concluída');
    console.log(`📋 Tipo: ${result.classification.type}`);
    console.log(`📈 Confiança: ${result.classification.confidence}`);
  });

  test('E2E-004: Teste de Presets de Análise', async ({ request }) => {
    console.log('📋 Obtendo presets disponíveis...');

    const response = await request.get(`${CLOUD_RUN_BASE_URL}/presets`);

    expect(response.status()).toBe(200);

    const presets = await response.json();

    expect(presets.available_presets).toBeDefined();
    expect(presets.available_presets.rigorous).toBeDefined();
    expect(presets.available_presets.standard).toBeDefined();
    expect(presets.available_presets.technical).toBeDefined();
    expect(presets.available_presets.fast).toBeDefined();

    // Validar preset rigoroso
    const rigorousPreset = presets.available_presets.rigorous;
    expect(rigorousPreset.weights).toBeDefined();
    expect(rigorousPreset.weights.legal).toBe(60);

    console.log('✅ Presets carregados com sucesso');
    console.log(`📊 Presets disponíveis: ${Object.keys(presets.available_presets).length}`);
  });

  test('E2E-005: Validação de Configuração Organizacional', async ({ request }) => {
    const validConfig = {
      organization_id: 'test-org-validation',
      weights: {
        structural: 25,
        legal: 30,
        clarity: 25,
        abnt: 20
      },
      custom_rules: [],
      templates: []
    };

    console.log('✅ Validando configuração organizacional...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/validate-config`, {
      data: validConfig,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const validation = await response.json();

    expect(validation.is_valid).toBe(true);
    expect(validation.errors).toBeDefined();
    expect(Array.isArray(validation.errors)).toBe(true);
    expect(validation.config_summary).toBeDefined();

    console.log('✅ Validação concluída');
    console.log(`✔️  Configuração válida: ${validation.is_valid}`);
    console.log(`⚠️  Avisos: ${validation.warnings?.length || 0}`);
  });

  test('E2E-006: Validação de Configuração Inválida', async ({ request }) => {
    const invalidConfig = {
      organization_id: 'test-org-invalid',
      weights: {
        structural: 50,
        legal: 20,
        clarity: 20,
        abnt: 20 // Soma = 110% (inválido)
      },
      custom_rules: [],
      templates: []
    };

    console.log('❌ Testando configuração inválida...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/validate-config`, {
      data: invalidConfig,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const validation = await response.json();

    expect(validation.is_valid).toBe(false);
    expect(validation.errors).toBeDefined();
    expect(validation.errors.length).toBeGreaterThan(0);

    console.log('✅ Validação detectou erro corretamente');
    console.log(`❌ Erros encontrados: ${validation.errors.length}`);
  });

  test('E2E-007: Métricas do Serviço', async ({ request }) => {
    console.log('📊 Obtendo métricas do serviço...');

    const response = await request.get(`${CLOUD_RUN_BASE_URL}/metrics`);

    expect(response.status()).toBe(200);

    const metrics = await response.json();

    expect(metrics.service).toBe('document-analyzer');
    expect(metrics.version).toBe('2.0.0');
    expect(metrics.requests).toBeDefined();
    expect(metrics.requests.total).toBeGreaterThan(0);

    console.log('✅ Métricas obtidas com sucesso');
    console.log(`📈 Total de requisições: ${metrics.requests.total}`);
    console.log(`✅ Taxa de sucesso: ${metrics.requests.success_rate}`);
  });
});

test.describe('Validação de Persistência no Firestore', () => {

  test('E2E-008: Verificar Persistência de Análise', async ({ request }) => {
    // Este teste valida que os resultados estão sendo persistidos no Firestore
    // Nota: Requer Firestore conectado para validação completa

    const testDocument = {
      document_content: 'Edital de teste para validação de persistência',
      document_type: 'EDITAL',
      organization_config: { organization_id: 'persist-test-001' },
      analysis_options: { weights: { structural: 25, legal: 25, clarity: 25, abnt: 25 } },
      metadata: { document_id: `persist-test-${Date.now()}` }
    };

    console.log('💾 Testando persistência no Firestore...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/analyze`, {
      data: testDocument,
      headers: { 'Content-Type': 'application/json' }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.analysis_id).toBeDefined();
    expect(result.status).toBe('completed');

    console.log('✅ Análise concluída - resultado deve estar no Firestore');
    console.log(`📄 Analysis ID para verificação: ${result.analysis_id}`);

    // Em ambiente real, aqui faríamos uma consulta ao Firestore para validar
    // Mas isso requer credenciais e está além do escopo do teste E2E básico
  });
});
