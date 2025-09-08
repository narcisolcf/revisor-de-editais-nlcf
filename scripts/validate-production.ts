#!/usr/bin/env node

/**
 * Script de Validação de Ambiente de Produção
 * Executa verificações críticas após deploy para garantir que o sistema está funcionando
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

interface EnvironmentConfig {
  baseUrl: string;
  apiUrl: string;
  functionsUrl: string;
  cloudRunUrl: string;
  expectedServices: string[];
  healthCheckEndpoints: string[];
  criticalEndpoints: string[];
}

class ProductionValidator {
  private results: ValidationResult[] = [];
  private config: EnvironmentConfig;
  private startTime: number;

  constructor(environment: 'staging' | 'production') {
    this.startTime = Date.now();
    this.config = this.loadEnvironmentConfig(environment);
  }

  private loadEnvironmentConfig(env: 'staging' | 'production'): EnvironmentConfig {
    const configs = {
      staging: {
        baseUrl: 'https://staging.licitareview.com',
        apiUrl: 'https://api-staging.licitareview.com',
        functionsUrl: 'https://us-central1-licitareview-staging.cloudfunctions.net',
        cloudRunUrl: 'https://analyzer-staging-abc123-uc.a.run.app',
        expectedServices: ['web', 'api', 'analyzer', 'classifier'],
        healthCheckEndpoints: ['/health', '/api/health', '/api/status'],
        criticalEndpoints: ['/api/auth/status', '/api/documents', '/api/analysis']
      },
      production: {
        baseUrl: 'https://licitareview-prod.web.app',
        apiUrl: 'https://us-central1-licitareview-prod.cloudfunctions.net',
        functionsUrl: 'https://us-central1-licitareview-prod.cloudfunctions.net',
        cloudRunUrl: 'https://analyzer-prod-xyz789-uc.a.run.app',
        expectedServices: ['web', 'api', 'analyzer', 'classifier'],
        healthCheckEndpoints: ['/'],
        criticalEndpoints: ['/']
      }
    };

    return configs[env];
  }

  private async addResult(name: string, status: 'success' | 'error' | 'warning', message: string, details?: any, duration?: number) {
    this.results.push({ name, status, message, details, duration });
    
    const statusIcon = {
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[status];
    
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`${statusIcon} ${name}: ${message}${durationText}`);
    
    if (details && status === 'error') {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  private async makeRequest(url: string, options: any = {}, timeout: number = 10000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async validateHealthChecks(): Promise<void> {
    console.log('\n🔍 Validando Health Checks...');
    
    for (const endpoint of this.config.healthCheckEndpoints) {
      const startTime = Date.now();
      
      try {
        const url = `${this.config.baseUrl}${endpoint}`;
        const response = await this.makeRequest(url, { method: 'GET' });
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          await this.addResult(
            `Health Check ${endpoint}`,
            'success',
            `Status: ${response.status}`,
            data,
            duration
          );
        } else {
          await this.addResult(
            `Health Check ${endpoint}`,
            'error',
            `HTTP ${response.status}: ${response.statusText}`,
            { url, status: response.status },
            duration
          );
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await this.addResult(
          `Health Check ${endpoint}`,
          'error',
          `Falha na conexão: ${error.message}`,
          { url: `${this.config.baseUrl}${endpoint}`, error: error.message },
          duration
        );
      }
    }
  }

  async validateCriticalEndpoints(): Promise<void> {
    console.log('\n🔍 Validando Endpoints Críticos...');
    
    for (const endpoint of this.config.criticalEndpoints) {
      const startTime = Date.now();
      
      try {
        const url = `${this.config.baseUrl}${endpoint}`;
        const response = await this.makeRequest(url, { method: 'GET' });
        const duration = Date.now() - startTime;
        
        if (response.ok || response.status === 401) { // 401 é esperado para endpoints protegidos
          await this.addResult(
            `Endpoint ${endpoint}`,
            'success',
            `Respondendo corretamente (${response.status})`,
            { status: response.status },
            duration
          );
        } else {
          await this.addResult(
            `Endpoint ${endpoint}`,
            'error',
            `HTTP ${response.status}: ${response.statusText}`,
            { url, status: response.status },
            duration
          );
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await this.addResult(
          `Endpoint ${endpoint}`,
          'error',
          `Falha na conexão: ${error.message}`,
          { url: `${this.config.baseUrl}${endpoint}`, error: error.message },
          duration
        );
      }
    }
  }

  async validateCloudServices(): Promise<void> {
    console.log('\n🔍 Validando Serviços Cloud...');
    
    // Validar Cloud Functions
    const functionsToTest = [
      '/documentsApi',
      '/processAnalysis'
    ];
    
    for (const func of functionsToTest) {
      const startTime = Date.now();
      
      try {
        const url = `${this.config.functionsUrl}${func}`;
        const response = await this.makeRequest(url, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok || response.status === 400) { // 400 pode ser esperado para dados de teste
          await this.addResult(
            `Cloud Function ${func}`,
            'success',
            `Função ativa (${response.status})`,
            { status: response.status },
            duration
          );
        } else {
          await this.addResult(
            `Cloud Function ${func}`,
            'error',
            `HTTP ${response.status}: ${response.statusText}`,
            { url, status: response.status },
            duration
          );
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await this.addResult(
          `Cloud Function ${func}`,
          'error',
          `Falha na conexão: ${error.message}`,
          { error: error.message },
          duration
        );
      }
    }
    
    // Validar Cloud Run
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(`${this.config.cloudRunUrl}/health`);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        await this.addResult(
          'Cloud Run Service',
          'success',
          'Serviço ativo e respondendo',
          data,
          duration
        );
      } else {
        await this.addResult(
          'Cloud Run Service',
          'error',
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status },
          duration
        );
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.addResult(
        'Cloud Run Service',
        'error',
        `Falha na conexão: ${error.message}`,
        { error: error.message },
        duration
      );
    }
  }

  async validateDatabase(): Promise<void> {
    console.log('\n🔍 Validando Conexão com Banco de Dados...');
    
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/db/health`);
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        await this.addResult(
          'Database Connection',
          'success',
          'Conexão ativa',
          data,
          duration
        );
        
        // Verificar se as tabelas principais existem
        if (data.tables) {
          const requiredTables = ['users', 'documents', 'analyses', 'parameters'];
          const missingTables = requiredTables.filter(table => !data.tables.includes(table));
          
          if (missingTables.length === 0) {
            await this.addResult(
              'Database Schema',
              'success',
              'Todas as tabelas necessárias estão presentes',
              { tables: data.tables }
            );
          } else {
            await this.addResult(
              'Database Schema',
              'error',
              `Tabelas ausentes: ${missingTables.join(', ')}`,
              { missing: missingTables, existing: data.tables }
            );
          }
        }
      } else {
        await this.addResult(
          'Database Connection',
          'error',
          `HTTP ${response.status}: ${response.statusText}`,
          { status: response.status },
          duration
        );
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      await this.addResult(
        'Database Connection',
        'error',
        `Falha na conexão: ${error.message}`,
        { error: error.message },
        duration
      );
    }
  }

  async validateSSLCertificates(): Promise<void> {
    console.log('\n🔍 Validando Certificados SSL...');
    
    const urlsToCheck = [
      this.config.baseUrl,
      this.config.apiUrl,
      this.config.cloudRunUrl
    ];
    
    for (const url of urlsToCheck) {
      const startTime = Date.now();
      
      try {
        const response = await this.makeRequest(url, { method: 'HEAD' });
        const duration = Date.now() - startTime;
        
        // Se a requisição HTTPS foi bem-sucedida, o certificado é válido
        await this.addResult(
          `SSL Certificate ${new URL(url).hostname}`,
          'success',
          'Certificado SSL válido',
          { url },
          duration
        );
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        if (error.message.includes('certificate') || error.message.includes('SSL')) {
          await this.addResult(
            `SSL Certificate ${new URL(url).hostname}`,
            'error',
            `Problema com certificado SSL: ${error.message}`,
            { url, error: error.message },
            duration
          );
        } else {
          await this.addResult(
            `SSL Certificate ${new URL(url).hostname}`,
            'warning',
            `Não foi possível verificar SSL: ${error.message}`,
            { url, error: error.message },
            duration
          );
        }
      }
    }
  }

  async validatePerformance(): Promise<void> {
    console.log('\n🔍 Validando Performance...');
    
    const performanceTests = [
      { name: 'Homepage Load', url: this.config.baseUrl, maxTime: 3000 },
      { name: 'API Response', url: `${this.config.apiUrl}/api/health`, maxTime: 2000 },
      { name: 'Cloud Run Response', url: `${this.config.cloudRunUrl}/health`, maxTime: 5000 }
    ];
    
    for (const test of performanceTests) {
      const startTime = Date.now();
      
      try {
        const response = await this.makeRequest(test.url, { method: 'GET' }, test.maxTime + 1000);
        const duration = Date.now() - startTime;
        
        if (duration <= test.maxTime) {
          await this.addResult(
            test.name,
            'success',
            `Resposta em ${duration}ms (limite: ${test.maxTime}ms)`,
            { duration, limit: test.maxTime },
            duration
          );
        } else {
          await this.addResult(
            test.name,
            'warning',
            `Resposta lenta: ${duration}ms (limite: ${test.maxTime}ms)`,
            { duration, limit: test.maxTime },
            duration
          );
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        await this.addResult(
          test.name,
          'error',
          `Falha no teste de performance: ${error.message}`,
          { error: error.message, limit: test.maxTime },
          duration
        );
      }
    }
  }

  async validateEnvironmentVariables(): Promise<void> {
    console.log('\n🔍 Validando Variáveis de Ambiente...');
    
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/config/check`);
      
      if (response.ok) {
        const data = await response.json();
        
        const requiredVars = [
          'DATABASE_URL',
          'JWT_SECRET',
          'GOOGLE_CLOUD_PROJECT',
          'STORAGE_BUCKET'
        ];
        
        const missingVars = requiredVars.filter(varName => !data.configured?.includes(varName));
        
        if (missingVars.length === 0) {
          await this.addResult(
            'Environment Variables',
            'success',
            'Todas as variáveis necessárias estão configuradas',
            { configured: data.configured }
          );
        } else {
          await this.addResult(
            'Environment Variables',
            'error',
            `Variáveis ausentes: ${missingVars.join(', ')}`,
            { missing: missingVars, configured: data.configured }
          );
        }
      } else {
        await this.addResult(
          'Environment Variables',
          'warning',
          'Não foi possível verificar variáveis de ambiente',
          { status: response.status }
        );
      }
    } catch (error: any) {
      await this.addResult(
        'Environment Variables',
        'warning',
        `Erro ao verificar variáveis: ${error.message}`,
        { error: error.message }
      );
    }
  }

  async runSmokeTests(): Promise<void> {
    console.log('\n🔍 Executando Smoke Tests...');
    
    // Teste básico de upload (simulado)
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/upload/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok || response.status === 401) {
        await this.addResult(
          'Upload Endpoint',
          'success',
          'Endpoint de upload respondendo',
          { status: response.status }
        );
      } else {
        await this.addResult(
          'Upload Endpoint',
          'error',
          `Falha no endpoint de upload: ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error: any) {
      await this.addResult(
        'Upload Endpoint',
        'error',
        `Erro no teste de upload: ${error.message}`,
        { error: error.message }
      );
    }
    
    // Teste básico de análise (simulado)
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/analysis/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      
      if (response.ok || response.status === 401) {
        await this.addResult(
          'Analysis Endpoint',
          'success',
          'Endpoint de análise respondendo',
          { status: response.status }
        );
      } else {
        await this.addResult(
          'Analysis Endpoint',
          'error',
          `Falha no endpoint de análise: ${response.status}`,
          { status: response.status }
        );
      }
    } catch (error: any) {
      await this.addResult(
        'Analysis Endpoint',
        'error',
        `Erro no teste de análise: ${error.message}`,
        { error: error.message }
      );
    }
  }

  generateReport(): void {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE VALIDAÇÃO DE PRODUÇÃO');
    console.log('='.repeat(60));
    console.log(`⏱️  Tempo total: ${totalTime}ms`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️  Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${((successCount / this.results.length) * 100).toFixed(1)}%`);
    
    if (errorCount > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(result => {
          console.log(`   • ${result.name}: ${result.message}`);
        });
    }
    
    if (warningCount > 0) {
      console.log('\n⚠️  AVISOS:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => {
          console.log(`   • ${result.name}: ${result.message}`);
        });
    }
    
    // Salvar relatório em arquivo
    const reportData = {
      timestamp: new Date().toISOString(),
      environment: this.config.baseUrl,
      totalTime,
      summary: { successCount, errorCount, warningCount },
      results: this.results
    };
    
    const reportPath = path.join(process.cwd(), `validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
    
    // Exit code baseado nos resultados
    if (errorCount > 0) {
      console.log('\n🚨 Validação FALHOU - Erros críticos encontrados!');
      process.exit(1);
    } else if (warningCount > 0) {
      console.log('\n⚠️  Validação PASSOU com avisos');
      process.exit(0);
    } else {
      console.log('\n🎉 Validação PASSOU - Sistema funcionando perfeitamente!');
      process.exit(0);
    }
  }

  async runAllValidations(): Promise<void> {
    console.log('🚀 Iniciando validação de ambiente de produção...');
    console.log(`🌐 Ambiente: ${this.config.baseUrl}`);
    
    try {
      await this.validateHealthChecks();
      await this.validateCriticalEndpoints();
      await this.validateCloudServices();
      await this.validateDatabase();
      await this.validateSSLCertificates();
      await this.validatePerformance();
      await this.validateEnvironmentVariables();
      await this.runSmokeTests();
    } catch (error) {
      console.error('❌ Erro durante validação:', error);
      await this.addResult(
        'Validation Process',
        'error',
        `Erro inesperado: ${error}`,
        { error }
      );
    }
    
    this.generateReport();
  }
}

// Execução do script
if (import.meta.url === `file://${process.argv[1]}`) {
  const environment = process.argv[2] as 'staging' | 'production';
  
  if (!environment || !['staging', 'production'].includes(environment)) {
    console.error('❌ Uso: npm run validate:production <staging|production>');
    process.exit(1);
  }
  
  const validator = new ProductionValidator(environment);
  validator.runAllValidations().catch(error => {
    console.error('❌ Falha na validação:', error);
    process.exit(1);
  });
}

export { ProductionValidator };