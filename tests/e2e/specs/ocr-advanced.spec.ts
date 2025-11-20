/**
 * Testes de OCR Avançado com Google Vision API
 * 🔍 Validação completa de extração de texto, tabelas, layout e formulários
 *
 * Testa:
 * 1. Extração de texto básica
 * 2. Extração de tabelas
 * 3. Detecção de layout
 * 4. Extração de campos de formulário
 * 5. Múltiplos formatos (PDF, imagens)
 * 6. Estatísticas do serviço
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const CLOUD_RUN_BASE_URL = process.env.CLOUD_RUN_URL || 'http://localhost:8080';

test.describe('OCR Avançado: Google Vision API', () => {

  test('OCR-001: Health Check - Verificar Serviço OCR', async ({ request }) => {
    console.log('🏥 Verificando health check do serviço...');

    const response = await request.get(`${CLOUD_RUN_BASE_URL}/health`);
    expect(response.status()).toBe(200);

    const health = await response.json();

    expect(health.services).toBeDefined();
    expect(health.services.ocr).toBe(true);

    console.log('✅ Serviço OCR disponível');
  });

  test('OCR-002: Extração de Texto Básica - JSON com Base64', async ({ request }) => {
    // Criar um documento de texto simples para teste
    const testText = 'EDITAL DE LICITAÇÃO\nPREGÃO ELETRÔNICO Nº 001/2025\n\nObjeto: Contratação de serviços';
    const base64Content = Buffer.from(testText).toString('base64');

    console.log('📝 Testando extração de texto básica...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'test-document.txt',
        extract_tables: false,
        detect_layout: false,
        extract_forms: false
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.processing_time).toBeGreaterThan(0);
    expect(result.method).toBeDefined();

    console.log(`✅ Texto extraído: ${result.text.length} caracteres`);
    console.log(`📊 Confiança: ${result.confidence}`);
    console.log(`⏱️  Tempo: ${result.processing_time}s`);
  });

  test('OCR-003: Extração Completa com Todas as Features', async ({ request }) => {
    // Documento de teste mais complexo
    const testDocument = `
      FORMULÁRIO DE PROPOSTA COMERCIAL

      Empresa: ACME Solutions Ltda
      CNPJ: 12.345.678/0001-90

      Tabela de Preços:
      Item | Descrição | Quantidade | Valor Unitário | Total
      1 | Software | 10 | R$ 1.000,00 | R$ 10.000,00
      2 | Suporte | 12 | R$ 500,00 | R$ 6.000,00

      Total Geral: R$ 16.000,00
    `;

    const base64Content = Buffer.from(testDocument).toString('base64');

    console.log('🔍 Testando extração completa (texto + tabelas + layout + formulários)...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'proposta.txt',
        extract_tables: true,
        detect_layout: true,
        extract_forms: true
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    // Validar estrutura completa
    expect(result.success).toBe(true);
    expect(result.text).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.tables).toBeDefined();
    expect(Array.isArray(result.tables)).toBe(true);
    expect(result.layout_blocks).toBeDefined();
    expect(Array.isArray(result.layout_blocks)).toBe(true);
    expect(result.form_fields).toBeDefined();
    expect(Array.isArray(result.form_fields)).toBe(true);
    expect(result.metadata).toBeDefined();
    expect(result.stats).toBeDefined();

    console.log('✅ Extração completa realizada');
    console.log(`📝 Texto: ${result.stats.text_length} caracteres`);
    console.log(`📊 Tabelas: ${result.stats.tables_count}`);
    console.log(`📐 Blocos de layout: ${result.stats.layout_blocks_count}`);
    console.log(`📋 Campos de formulário: ${result.stats.form_fields_count}`);
  });

  test('OCR-004: Extração de Tabelas', async ({ request }) => {
    const tableDocument = `
      Tabela de Itens Licitados

      Item | Descrição | Unidade | Quantidade
      1 | Notebook Dell | UN | 50
      2 | Monitor LG 24" | UN | 100
      3 | Mouse USB | UN | 150
      4 | Teclado USB | UN | 150
    `;

    const base64Content = Buffer.from(tableDocument).toString('base64');

    console.log('📊 Testando extração de tabelas...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'tabela.txt',
        extract_tables: true,
        detect_layout: false,
        extract_forms: false
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.tables).toBeDefined();

    if (result.tables.length > 0) {
      const table = result.tables[0];
      expect(table.rows).toBeGreaterThan(0);
      expect(table.cols).toBeGreaterThan(0);
      expect(table.cells).toBeDefined();
      expect(Array.isArray(table.cells)).toBe(true);

      console.log(`✅ Tabela extraída: ${table.rows}x${table.cols}`);
      console.log(`📊 Células: ${table.cells.length}`);
    }
  });

  test('OCR-005: Extração de Campos de Formulário', async ({ request }) => {
    const formDocument = `
      DADOS DA EMPRESA

      Razão Social: ACME Solutions Ltda
      CNPJ: 12.345.678/0001-90
      Email: contato@acme.com.br
      Telefone: (11) 98765-4321

      DADOS BANCÁRIOS
      Banco: 001 - Banco do Brasil
      Agência: 1234-5
      Conta: 67890-1
    `;

    const base64Content = Buffer.from(formDocument).toString('base64');

    console.log('📋 Testando extração de campos de formulário...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'formulario.txt',
        extract_tables: false,
        detect_layout: false,
        extract_forms: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.form_fields).toBeDefined();
    expect(Array.isArray(result.form_fields)).toBe(true);

    if (result.form_fields.length > 0) {
      console.log(`✅ Campos extraídos: ${result.form_fields.length}`);

      // Validar estrutura dos campos
      const field = result.form_fields[0];
      expect(field.field_name).toBeDefined();
      expect(field.field_value).toBeDefined();
      expect(field.field_type).toBeDefined();
      expect(field.confidence).toBeGreaterThan(0);
    }
  });

  test('OCR-006: Detecção de Layout', async ({ request }) => {
    const layoutDocument = `
      TÍTULO DO DOCUMENTO

      Seção 1: Introdução
      Este é o primeiro parágrafo da introdução.

      Seção 2: Desenvolvimento
      Aqui está o desenvolvimento do documento.

      • Item de lista 1
      • Item de lista 2
      • Item de lista 3

      Conclusão
      Texto final do documento.
    `;

    const base64Content = Buffer.from(layoutDocument).toString('base64');

    console.log('📐 Testando detecção de layout...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'layout.txt',
        extract_tables: false,
        detect_layout: true,
        extract_forms: false
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.layout_blocks).toBeDefined();
    expect(Array.isArray(result.layout_blocks)).toBe(true);

    if (result.layout_blocks.length > 0) {
      console.log(`✅ Blocos de layout detectados: ${result.layout_blocks.length}`);

      // Validar estrutura dos blocos
      const block = result.layout_blocks[0];
      expect(block.type).toBeDefined();
      expect(block.text).toBeDefined();
      expect(block.confidence).toBeGreaterThan(0);
    }
  });

  test('OCR-007: Estatísticas do Serviço OCR', async ({ request }) => {
    console.log('📊 Obtendo estatísticas do serviço OCR...');

    const response = await request.get(`${CLOUD_RUN_BASE_URL}/ocr/stats`);

    expect(response.status()).toBe(200);

    const stats = await response.json();

    expect(stats).toBeDefined();
    expect(stats.total_extractions).toBeDefined();
    expect(stats.total_extractions).toBeGreaterThanOrEqual(0);

    console.log('✅ Estatísticas obtidas com sucesso');
    console.log(`📈 Total de extrações: ${stats.total_extractions}`);

    if (stats.vision_api_calls !== undefined) {
      console.log(`🔍 Chamadas Vision API: ${stats.vision_api_calls}`);
    }
    if (stats.fallback_calls !== undefined) {
      console.log(`⚠️  Chamadas Fallback: ${stats.fallback_calls}`);
    }
    if (stats.errors !== undefined) {
      console.log(`❌ Erros: ${stats.errors}`);
    }
  });

  test('OCR-008: Tratamento de Erro - Arquivo Vazio', async ({ request }) => {
    console.log('❌ Testando tratamento de erro com arquivo vazio...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: '',
        filename: 'empty.txt'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Deve retornar erro 400 ou 500
    expect([400, 500]).toContain(response.status());

    const result = await response.json();
    expect(result.error).toBeDefined();

    console.log('✅ Erro tratado corretamente');
  });

  test('OCR-009: Tratamento de Erro - Sem Content-Type', async ({ request }) => {
    console.log('❌ Testando requisição sem dados...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {},
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Deve retornar erro 400
    expect(response.status()).toBe(400);

    const result = await response.json();
    expect(result.error).toBeDefined();

    console.log('✅ Erro de validação tratado corretamente');
  });

  test('OCR-010: Teste de Performance - Documento Grande', async ({ request }) => {
    // Criar um documento grande para teste de performance
    let largeDocument = 'EDITAL DE LICITAÇÃO - DOCUMENTO EXTENSO\n\n';

    for (let i = 1; i <= 100; i++) {
      largeDocument += `Seção ${i}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. `;
      largeDocument += `Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n`;
    }

    const base64Content = Buffer.from(largeDocument).toString('base64');

    console.log('⚡ Testando performance com documento grande...');
    console.log(`📄 Tamanho do documento: ${largeDocument.length} caracteres`);

    const startTime = Date.now();

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'large-document.txt',
        extract_tables: true,
        detect_layout: true,
        extract_forms: true
      },
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutos para documentos grandes
    });

    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;

    expect(response.status()).toBe(200);

    const result = await response.json();

    expect(result.success).toBe(true);
    expect(result.text).toBeDefined();

    console.log('✅ Documento grande processado com sucesso');
    console.log(`⏱️  Tempo total: ${totalTime}s`);
    console.log(`⚡ Tempo de processamento OCR: ${result.processing_time}s`);
    console.log(`📊 Taxa: ${(largeDocument.length / result.processing_time).toFixed(0)} chars/s`);
  });
});

test.describe('OCR Avançado: Validação de Qualidade', () => {

  test('OCR-011: Validar Confiança Mínima', async ({ request }) => {
    const testText = 'Texto claro e legível para garantir alta confiança na extração.';
    const base64Content = Buffer.from(testText).toString('base64');

    console.log('📊 Validando níveis de confiança...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'confidence-test.txt'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    // A confiança deve ser razoável para texto simples
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.confidence).toBeLessThanOrEqual(1.0);

    console.log(`✅ Confiança: ${(result.confidence * 100).toFixed(1)}%`);
  });

  test('OCR-012: Validar Metadados Completos', async ({ request }) => {
    const testText = 'Documento de teste para validação de metadados.';
    const base64Content = Buffer.from(testText).toString('base64');

    console.log('🔍 Validando metadados completos...');

    const response = await request.post(`${CLOUD_RUN_BASE_URL}/ocr/extract`, {
      data: {
        file_content: base64Content,
        filename: 'metadata-test.pdf',
        extract_tables: true,
        detect_layout: true,
        extract_forms: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(200);

    const result = await response.json();

    // Validar todos os metadados obrigatórios
    expect(result.metadata).toBeDefined();
    expect(result.metadata.filename).toBe('metadata-test.pdf');
    expect(result.language).toBeDefined();
    expect(result.processing_time).toBeGreaterThan(0);
    expect(result.method).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.text_length).toBe(result.text.length);
    expect(result.stats.tables_count).toBe(result.tables.length);
    expect(result.stats.layout_blocks_count).toBe(result.layout_blocks.length);
    expect(result.stats.form_fields_count).toBe(result.form_fields.length);

    console.log('✅ Todos os metadados presentes e válidos');
  });
});
