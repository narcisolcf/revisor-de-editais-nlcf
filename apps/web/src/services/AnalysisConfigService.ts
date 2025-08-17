import { 
  AnalysisParameter, 
  AnalysisRule, 
  OrganizationConfig, 
  ConfigTemplate, 
  AnalysisConfigFilters 
} from '@/hooks/useAnalysisConfig';

// Tipos para validação
export interface CreateConfigRequest {
  organizationId: string;
  name: string;
  description: string;
  parameters: Omit<AnalysisParameter, 'id' | 'createdAt' | 'updatedAt'>[];
  rules: Omit<AnalysisRule, 'id' | 'createdAt' | 'updatedAt'>[];
  isDefault?: boolean;
  isActive?: boolean;
  version?: string;
}

export interface UpdateConfigRequest {
  name?: string;
  description?: string;
  parameters?: Partial<AnalysisParameter>[];
  rules?: Partial<AnalysisRule>[];
  isDefault?: boolean;
  isActive?: boolean;
  version?: string;
}

export interface BatchUpdateRequest {
  configIds: string[];
  updates: Partial<UpdateConfigRequest>;
}

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ConfigImpactAnalysis {
  affectedDocuments: number;
  estimatedScoreChange: number;
  riskLevel: 'baixa' | 'media' | 'alta';
  recommendations: string[];
}

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_TIMEOUT = 30000; // 30 segundos

class AnalysisConfigService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: API_TIMEOUT,
    };

    const response = await fetch(url, {
      ...defaultOptions,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // CRUD Operations para Configurações
  async getOrganizationConfigs(
    organizationId: string, 
    filters?: AnalysisConfigFilters
  ): Promise<OrganizationConfig[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('organizationId', organizationId);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    return this.makeRequest<OrganizationConfig[]>(`/analysis-configs?${queryParams}`);
  }

  async getConfigById(id: string): Promise<OrganizationConfig> {
    return this.makeRequest<OrganizationConfig>(`/analysis-configs/${id}`);
  }

  async getActiveConfig(organizationId: string): Promise<OrganizationConfig | null> {
    try {
      return await this.makeRequest<OrganizationConfig>(`/analysis-configs/active/${organizationId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createConfig(config: CreateConfigRequest): Promise<OrganizationConfig> {
    // Validação client-side
    const validation = this.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Configuração inválida: ${validation.errors.join(', ')}`);
    }

    return this.makeRequest<OrganizationConfig>('/analysis-configs', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async updateConfig(id: string, updates: UpdateConfigRequest): Promise<OrganizationConfig> {
    // Validação client-side
    if (updates.parameters || updates.rules) {
      const validation = this.validateConfig({ ...updates, organizationId: '' } as CreateConfigRequest);
      if (!validation.isValid) {
        throw new Error(`Atualizações inválidas: ${validation.errors.join(', ')}`);
      }
    }

    return this.makeRequest<OrganizationConfig>(`/analysis-configs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteConfig(id: string): Promise<string> {
    return this.makeRequest<{ deletedId: string }>(`/analysis-configs/${id}`, {
      method: 'DELETE',
    }).then(result => result.deletedId);
  }

  // Batch Operations
  async batchUpdateConfigs(request: BatchUpdateRequest): Promise<OrganizationConfig[]> {
    return this.makeRequest<OrganizationConfig[]>('/analysis-configs/batch', {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async batchDeleteConfigs(configIds: string[]): Promise<string[]> {
    return this.makeRequest<{ deletedIds: string[] }>('/analysis-configs/batch', {
      method: 'DELETE',
      body: JSON.stringify({ configIds }),
    }).then(result => result.deletedIds);
  }

  async duplicateConfig(id: string): Promise<OrganizationConfig> {
    return this.makeRequest<OrganizationConfig>(`/analysis-configs/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Template Operations
  async getTemplates(category?: string): Promise<ConfigTemplate[]> {
    const endpoint = category ? `/analysis-templates?category=${category}` : '/analysis-templates';
    return this.makeRequest<ConfigTemplate[]>(endpoint);
  }

  async getTemplateById(id: string): Promise<ConfigTemplate> {
    return this.makeRequest<ConfigTemplate>(`/analysis-templates/${id}`);
  }

  async applyTemplate(templateId: string, organizationId: string): Promise<OrganizationConfig> {
    return this.makeRequest<OrganizationConfig>(`/analysis-templates/${templateId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  async createTemplate(template: Omit<ConfigTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConfigTemplate> {
    return this.makeRequest<ConfigTemplate>('/analysis-templates', {
      method: 'POST',
      body: JSON.stringify(template),
    });
  }

  // Validação e Análise de Impacto
  validateConfig(config: CreateConfigRequest | UpdateConfigRequest): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações básicas
    if ('name' in config && (!config.name || config.name.trim().length < 3)) {
      errors.push('Nome deve ter pelo menos 3 caracteres');
    }

    if ('description' in config && (!config.description || config.description.trim().length < 10)) {
      errors.push('Descrição deve ter pelo menos 10 caracteres');
    }

    // Validação de parâmetros
    if ('parameters' in config && config.parameters) {
      config.parameters.forEach((param, index) => {
        if (!param.name || param.name.trim().length === 0) {
          errors.push(`Parâmetro ${index + 1}: Nome é obrigatório`);
        }

        if (param.weight < 0 || param.weight > 100) {
          errors.push(`Parâmetro ${param.name}: Peso deve estar entre 0 e 100`);
        }

        if (param.type === 'range') {
          if (param.min !== undefined && param.max !== undefined && param.min >= param.max) {
            errors.push(`Parâmetro ${param.name}: Valor mínimo deve ser menor que o máximo`);
          }
        }

        if (param.type === 'select' && (!param.options || param.options.length === 0)) {
          errors.push(`Parâmetro ${param.name}: Opções são obrigatórias para tipo select`);
        }
      });
    }

    // Validação de regras
    if ('rules' in config && config.rules) {
      config.rules.forEach((rule, index) => {
        if (!rule.name || rule.name.trim().length === 0) {
          errors.push(`Regra ${index + 1}: Nome é obrigatório`);
        }

        if (!rule.description || rule.description.trim().length === 0) {
          errors.push(`Regra ${index + 1}: Descrição é obrigatória`);
        }

        if (rule.type === 'keyword_presence' && (!rule.keywordsAll || rule.keywordsAll.length === 0)) {
          errors.push(`Regra ${rule.name}: Palavras-chave são obrigatórias para tipo keyword_presence`);
        }

        if (rule.type === 'keyword_any' && (!rule.keywordsAny || rule.keywordsAny.length === 0)) {
          errors.push(`Regra ${rule.name}: Palavras-chave são obrigatórias para tipo keyword_any`);
        }

        if (rule.type === 'pattern' && (!rule.pattern || rule.pattern.trim().length === 0)) {
          errors.push(`Regra ${rule.name}: Padrão regex é obrigatório para tipo pattern`);
        }

        // Validar regex se for válida
        if (rule.type === 'pattern' && rule.pattern) {
          try {
            new RegExp(rule.pattern);
          } catch {
            errors.push(`Regra ${rule.name}: Padrão regex inválido`);
          }
        }
      });
    }

    // Warnings
    if ('parameters' in config && config.parameters && config.parameters.length === 0) {
      warnings.push('Nenhum parâmetro configurado - análise pode não ser efetiva');
    }

    if ('rules' in config && config.rules && config.rules.length === 0) {
      warnings.push('Nenhuma regra configurada - análise pode não ser efetiva');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async analyzeConfigImpact(
    configId: string, 
    organizationId: string
  ): Promise<ConfigImpactAnalysis> {
    return this.makeRequest<ConfigImpactAnalysis>(`/analysis-configs/${configId}/impact-analysis`, {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  async previewConfigChanges(
    configId: string, 
    changes: UpdateConfigRequest
  ): Promise<{
    currentScore: number;
    projectedScore: number;
    changes: string[];
    risks: string[];
  }> {
    return this.makeRequest(`/analysis-configs/${configId}/preview`, {
      method: 'POST',
      body: JSON.stringify(changes),
    });
  }

  // A/B Testing
  async createABTest(
    configA: string, 
    configB: string, 
    organizationId: string,
    duration: number // dias
  ): Promise<{
    testId: string;
    status: 'active' | 'completed' | 'cancelled';
    startDate: Date;
    endDate: Date;
  }> {
    return this.makeRequest('/analysis-configs/ab-test', {
      method: 'POST',
      body: JSON.stringify({ configA, configB, organizationId, duration }),
    });
  }

  async getABTestResults(testId: string): Promise<{
    configAScore: number;
    configBScore: number;
    winner: 'A' | 'B' | 'tie';
    confidence: number;
    sampleSize: number;
  }> {
    return this.makeRequest(`/analysis-configs/ab-test/${testId}/results`);
  }

  // Analytics e Performance
  async getConfigPerformanceMetrics(
    configId: string, 
    timeRange: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    averageScore: number;
    totalAnalyses: number;
    successRate: number;
    averageProcessingTime: number;
    topIssues: Array<{ issue: string; count: number }>;
  }> {
    return this.makeRequest(`/analysis-configs/${configId}/performance?timeRange=${timeRange}`);
  }

  async getOrganizationAnalytics(
    organizationId: string,
    timeRange: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    totalConfigs: number;
    activeConfigs: number;
    averageScore: number;
    totalAnalyses: number;
    configUsage: Array<{ configId: string; usageCount: number; averageScore: number }>;
    performanceTrend: Array<{ date: string; score: number; count: number }>;
  }> {
    return this.makeRequest(`/analysis-configs/organization/${organizationId}/analytics?timeRange=${timeRange}`);
  }

  // Cache Management
  async invalidateConfigCache(organizationId: string): Promise<void> {
    await this.makeRequest(`/analysis-configs/cache/invalidate`, {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    });
  }

  async getConfigCacheStats(organizationId: string): Promise<{
    cacheSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
  }> {
    return this.makeRequest(`/analysis-configs/cache/stats/${organizationId}`);
  }

  // Error Handling e Retry
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    
    throw lastError!;
  }

  // Métodos com retry automático
  async createConfigWithRetry(config: CreateConfigRequest): Promise<OrganizationConfig> {
    return this.retryRequest(() => this.createConfig(config));
  }

  async updateConfigWithRetry(id: string, updates: UpdateConfigRequest): Promise<OrganizationConfig> {
    return this.retryRequest(() => this.updateConfig(id, updates));
  }

  async deleteConfigWithRetry(id: string): Promise<string> {
    return this.retryRequest(() => this.deleteConfig(id));
  }
}

// Exportar instância singleton
export const analysisConfigService = new AnalysisConfigService();

// Exportar classe para casos onde é necessário múltiplas instâncias
export { AnalysisConfigService };
