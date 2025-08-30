#!/usr/bin/env node

/**
 * Script de Validação de Deploy
 * Executa verificações específicas após deploy para garantir que a nova versão está funcionando
 */

import { execSync } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface DeployValidationConfig {
  environment: 'staging' | 'production';
  baseUrl: string;
  apiUrl: string;
  expectedVersion?: string;
  rollbackUrl?: string;
  slackWebhook?: string;
  emailNotification?: string;
}

interface ValidationStep {
  name: string;
  critical: boolean;
  timeout: number;
  retries: number;
}

class DeployValidator {
  private config: DeployValidationConfig;
  private results: any[] = [];
  private startTime: number;

  constructor(config: DeployValidationConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  private async log(level: 'info' | 'success' | 'warning' | 'error', message: string, details?: any) {
    const timestamp = new Date().toISOString();
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`${icons[level]} [${timestamp}] ${message}`);
    
    if (details) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
    
    this.results.push({
      timestamp,
      level,
      message,
      details
    });
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

  private async retryOperation<T>(operation: () => Promise<T>, retries: number, delay: number = 2000): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        
        await this.log('warning', `Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`, { error });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Todas as tentativas falharam');
  }

  async validateApplicationStart(): Promise<boolean> {
    await this.log('info', 'Validando inicialização da aplicação...');
    
    try {
      const response = await this.retryOperation(async () => {
        return await this.makeRequest(`${this.config.baseUrl}/health`, { method: 'GET' }, 15000);
      }, 5, 3000);
      
      if (response.ok) {
        const data = await response.json();
        await this.log('success', 'Aplicação iniciada com sucesso', { 
          status: response.status,
          version: data.version,
          uptime: data.uptime
        });
        return true;
      } else {
        await this.log('error', `Falha na inicialização: HTTP ${response.status}`, { status: response.status });
        return false;
      }
    } catch (error: any) {
      await this.log('error', `Erro na validação de inicialização: ${error.message}`, { error: error.message });
      return false;
    }
  }

  async validateVersionDeployment(): Promise<boolean> {
    if (!this.config.expectedVersion) {
      await this.log('warning', 'Versão esperada não especificada, pulando validação de versão');
      return true;
    }
    
    await this.log('info', `Validando deploy da versão ${this.config.expectedVersion}...`);
    
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/version`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.version === this.config.expectedVersion) {
          await this.log('success', `Versão ${this.config.expectedVersion} deployada com sucesso`, data);
          return true;
        } else {
          await this.log('error', `Versão incorreta deployada. Esperado: ${this.config.expectedVersion}, Atual: ${data.version}`, {
            expected: this.config.expectedVersion,
            actual: data.version
          });
          return false;
        }
      } else {
        await this.log('error', `Falha ao verificar versão: HTTP ${response.status}`);
        return false;
      }
    } catch (error: any) {
      await this.log('error', `Erro na validação de versão: ${error.message}`);
      return false;
    }
  }

  async validateCriticalPaths(): Promise<boolean> {
    await this.log('info', 'Validando caminhos críticos da aplicação...');
    
    const criticalPaths = [
      { path: '/', name: 'Homepage' },
      { path: '/login', name: 'Login Page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/api/health', name: 'API Health' },
      { path: '/api/auth/status', name: 'Auth Status' }
    ];
    
    let allPassed = true;
    
    for (const { path, name } of criticalPaths) {
      try {
        const url = path.startsWith('/api') ? `${this.config.apiUrl}${path}` : `${this.config.baseUrl}${path}`;
        const response = await this.makeRequest(url, { method: 'GET' }, 10000);
        
        if (response.ok || response.status === 401 || response.status === 302) {
          // 401 e 302 são aceitáveis para páginas protegidas
          await this.log('success', `${name} acessível`, { path, status: response.status });
        } else {
          await this.log('error', `${name} inacessível: HTTP ${response.status}`, { path, status: response.status });
          allPassed = false;
        }
      } catch (error: any) {
        await this.log('error', `Erro ao acessar ${name}: ${error.message}`, { path, error: error.message });
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async validateDatabaseConnectivity(): Promise<boolean> {
    await this.log('info', 'Validando conectividade com banco de dados...');
    
    try {
      const response = await this.makeRequest(`${this.config.apiUrl}/api/db/ping`, { method: 'GET' });
      
      if (response.ok) {
        const data = await response.json();
        await this.log('success', 'Banco de dados conectado', {
          latency: data.latency,
          connections: data.connections
        });
        return true;
      } else {
        await this.log('error', `Falha na conexão com banco: HTTP ${response.status}`);
        return false;
      }
    } catch (error: any) {
      await this.log('error', `Erro na validação do banco: ${error.message}`);
      return false;
    }
  }

  async validateExternalServices(): Promise<boolean> {
    await this.log('info', 'Validando serviços externos...');
    
    const services = [
      { name: 'Google Cloud Storage', endpoint: '/api/storage/health' },
      { name: 'Firebase Auth', endpoint: '/api/auth/health' },
      { name: 'Cloud Functions', endpoint: '/api/functions/health' }
    ];
    
    let allPassed = true;
    
    for (const service of services) {
      try {
        const response = await this.makeRequest(`${this.config.apiUrl}${service.endpoint}`);
        
        if (response.ok) {
          const data = await response.json();
          await this.log('success', `${service.name} conectado`, data);
        } else {
          await this.log('error', `${service.name} indisponível: HTTP ${response.status}`);
          allPassed = false;
        }
      } catch (error: any) {
        await this.log('error', `Erro ao validar ${service.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async validatePerformanceMetrics(): Promise<boolean> {
    await this.log('info', 'Validando métricas de performance...');
    
    const performanceTests = [
      { name: 'Homepage Load Time', url: this.config.baseUrl, maxTime: 3000 },
      { name: 'API Response Time', url: `${this.config.apiUrl}/api/health`, maxTime: 1000 },
      { name: 'Database Query Time', url: `${this.config.apiUrl}/api/db/ping`, maxTime: 500 }
    ];
    
    let allPassed = true;
    
    for (const test of performanceTests) {
      const startTime = Date.now();
      
      try {
        const response = await this.makeRequest(test.url, { method: 'GET' }, test.maxTime + 2000);
        const duration = Date.now() - startTime;
        
        if (duration <= test.maxTime && response.ok) {
          await this.log('success', `${test.name}: ${duration}ms (limite: ${test.maxTime}ms)`);
        } else if (duration > test.maxTime) {
          await this.log('warning', `${test.name} lento: ${duration}ms (limite: ${test.maxTime}ms)`);
          // Performance warnings não falham o deploy, mas são reportadas
        } else {
          await this.log('error', `${test.name} falhou: HTTP ${response.status}`);
          allPassed = false;
        }
      } catch (error: any) {
        await this.log('error', `Erro no teste ${test.name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async runSmokeTests(): Promise<boolean> {
    await this.log('info', 'Executando smoke tests...');
    
    const tests = [
      {
        name: 'User Registration Flow',
        test: async () => {
          const response = await this.makeRequest(`${this.config.apiUrl}/api/auth/register/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          return response.ok || response.status === 400; // 400 é esperado para dados de teste
        }
      },
      {
        name: 'Document Upload Flow',
        test: async () => {
          const response = await this.makeRequest(`${this.config.apiUrl}/api/upload/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          return response.ok || response.status === 401; // 401 é esperado sem autenticação
        }
      },
      {
        name: 'Analysis Processing Flow',
        test: async () => {
          const response = await this.makeRequest(`${this.config.apiUrl}/api/analysis/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
          });
          return response.ok || response.status === 401;
        }
      }
    ];
    
    let allPassed = true;
    
    for (const { name, test } of tests) {
      try {
        const passed = await test();
        
        if (passed) {
          await this.log('success', `Smoke test ${name} passou`);
        } else {
          await this.log('error', `Smoke test ${name} falhou`);
          allPassed = false;
        }
      } catch (error: any) {
        await this.log('error', `Erro no smoke test ${name}: ${error.message}`);
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  async sendNotification(success: boolean, summary: any): Promise<void> {
    const message = {
      environment: this.config.environment,
      success,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary,
      version: this.config.expectedVersion
    };
    
    // Slack notification
    if (this.config.slackWebhook) {
      try {
        const slackMessage = {
          text: success ? 
            `✅ Deploy ${this.config.environment} bem-sucedido!` : 
            `❌ Deploy ${this.config.environment} falhou!`,
          attachments: [{
            color: success ? 'good' : 'danger',
            fields: [
              { title: 'Ambiente', value: this.config.environment, short: true },
              { title: 'Versão', value: this.config.expectedVersion || 'N/A', short: true },
              { title: 'Duração', value: `${Math.round((Date.now() - this.startTime) / 1000)}s`, short: true },
              { title: 'Sucessos', value: summary.successCount.toString(), short: true },
              { title: 'Falhas', value: summary.errorCount.toString(), short: true }
            ]
          }]
        };
        
        await this.makeRequest(this.config.slackWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slackMessage)
        });
        
        await this.log('info', 'Notificação Slack enviada');
      } catch (error: any) {
        await this.log('warning', `Falha ao enviar notificação Slack: ${error.message}`);
      }
    }
    
    // Email notification (implementar conforme necessário)
    if (this.config.emailNotification) {
      await this.log('info', 'Email notification configurado mas não implementado ainda');
    }
  }

  async triggerRollback(): Promise<void> {
    if (!this.config.rollbackUrl) {
      await this.log('error', 'URL de rollback não configurada!');
      return;
    }
    
    await this.log('warning', 'Iniciando rollback automático...');
    
    try {
      const response = await this.makeRequest(this.config.rollbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: 'Deploy validation failed',
          timestamp: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        await this.log('success', 'Rollback iniciado com sucesso');
      } else {
        await this.log('error', `Falha no rollback: HTTP ${response.status}`);
      }
    } catch (error: any) {
      await this.log('error', `Erro durante rollback: ${error.message}`);
    }
  }

  generateReport(): any {
    const totalTime = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.level === 'success').length;
    const errorCount = this.results.filter(r => r.level === 'error').length;
    const warningCount = this.results.filter(r => r.level === 'warning').length;
    
    const summary = {
      environment: this.config.environment,
      totalTime,
      successCount,
      errorCount,
      warningCount,
      successRate: ((successCount / this.results.length) * 100).toFixed(1)
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE VALIDAÇÃO DE DEPLOY');
    console.log('='.repeat(60));
    console.log(`🌐 Ambiente: ${this.config.environment}`);
    console.log(`📦 Versão: ${this.config.expectedVersion || 'N/A'}`);
    console.log(`⏱️  Tempo total: ${totalTime}ms`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️  Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📈 Taxa de sucesso: ${summary.successRate}%`);
    
    // Salvar relatório
    const reportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      summary,
      results: this.results
    };
    
    const reportPath = path.join(process.cwd(), `deploy-validation-${this.config.environment}-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📄 Relatório salvo em: ${reportPath}`);
    
    return summary;
  }

  async runValidation(): Promise<boolean> {
    await this.log('info', `🚀 Iniciando validação de deploy para ${this.config.environment}...`);
    
    const validations = [
      { name: 'Application Start', fn: () => this.validateApplicationStart(), critical: true },
      { name: 'Version Deployment', fn: () => this.validateVersionDeployment(), critical: true },
      { name: 'Critical Paths', fn: () => this.validateCriticalPaths(), critical: true },
      { name: 'Database Connectivity', fn: () => this.validateDatabaseConnectivity(), critical: true },
      { name: 'External Services', fn: () => this.validateExternalServices(), critical: false },
      { name: 'Performance Metrics', fn: () => this.validatePerformanceMetrics(), critical: false },
      { name: 'Smoke Tests', fn: () => this.runSmokeTests(), critical: true }
    ];
    
    let criticalFailures = 0;
    let totalFailures = 0;
    
    for (const validation of validations) {
      await this.log('info', `Executando: ${validation.name}...`);
      
      try {
        const success = await validation.fn();
        
        if (!success) {
          totalFailures++;
          if (validation.critical) {
            criticalFailures++;
          }
        }
      } catch (error: any) {
        await this.log('error', `Erro em ${validation.name}: ${error.message}`);
        totalFailures++;
        if (validation.critical) {
          criticalFailures++;
        }
      }
    }
    
    const summary = this.generateReport();
    const success = criticalFailures === 0;
    
    await this.sendNotification(success, summary);
    
    if (!success) {
      await this.log('error', `❌ Validação FALHOU - ${criticalFailures} falhas críticas encontradas!`);
      
      if (this.config.environment === 'production') {
        await this.triggerRollback();
      }
      
      return false;
    } else {
      await this.log('success', '🎉 Validação PASSOU - Deploy bem-sucedido!');
      return true;
    }
  }
}

// Execução do script
if (require.main === module) {
  const environment = process.argv[2] as 'staging' | 'production';
  const version = process.argv[3];
  
  if (!environment || !['staging', 'production'].includes(environment)) {
    console.error('❌ Uso: npm run validate:deploy <staging|production> [version]');
    process.exit(1);
  }
  
  const config: DeployValidationConfig = {
    environment,
    expectedVersion: version,
    baseUrl: environment === 'production' ? 
      'https://licitareview.com' : 
      'https://staging.licitareview.com',
    apiUrl: environment === 'production' ? 
      'https://api.licitareview.com' : 
      'https://api-staging.licitareview.com',
    rollbackUrl: process.env.ROLLBACK_WEBHOOK_URL,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    emailNotification: process.env.EMAIL_NOTIFICATION
  };
  
  const validator = new DeployValidator(config);
  validator.runValidation().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Falha na validação de deploy:', error);
    process.exit(1);
  });
}

export { DeployValidator };