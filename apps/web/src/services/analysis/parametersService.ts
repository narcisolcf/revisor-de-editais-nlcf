/**
 * Serviço de Parâmetros de Análise
 * 
 * Gerencia parâmetros personalizáveis para análise de documentos,
 * incluindo pesos por categoria, configurações específicas e templates.
 */

import { apiClient } from '../core/api';
import { globalCache } from '../core/cache';
import { loggingService } from '../core/logging';
import { validationService } from '../core/validation';
import { errorService } from '../core/error';

// Types
export interface AnalysisWeights {
  structural: number;
  legal: number;
  clarity: number;
  abnt: number;
}

export interface AnalysisParameters {
  weights: AnalysisWeights;
  enableOcr: boolean;
  enableConformityCheck: boolean;
  language: 'pt' | 'en';
  documentType?: string;
  customRules?: CustomRule[];
  thresholds?: AnalysisThresholds;
  features?: FeatureFlags;
}

export interface CustomRule {
  id: string;
  category: 'structural' | 'legal' | 'clarity' | 'abnt';
  name: string;
  description: string;
  pattern?: string;
  weight: number;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalysisThresholds {
  structural: {
    minSections: number;
    minNumberingScore: number;
    requireIndex: boolean;
  };
  legal: {
    minLegalReferences: number;
    minClauses: number;
    minDeadlineScore: number;
  };
  clarity: {
    minReadabilityScore: number;
    maxJargonScore: number;
    minConsistencyScore: number;
  };
  abnt: {
    minCitationScore: number;
    minFormattingScore: number;
    requirePageNumbers: boolean;
  };
}

export interface FeatureFlags {
  advancedOcr: boolean;
  mlClassification: boolean;
  conformityCheck: boolean;
  batchProcessing: boolean;
  webhookNotifications: boolean;
}

export interface ParameterTemplate {
  id: string;
  name: string;
  description: string;
  documentType: string;
  parameters: AnalysisParameters;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ParameterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class ParametersService {
  private readonly logger = loggingService.createLogger('parameters');
  private readonly cache = globalCache;
  private readonly api = apiClient;
  private readonly validator = validationService;
  private readonly errorService = errorService;

  private readonly CACHE_KEYS = {
    TEMPLATES: 'analysis_parameter_templates',
    DEFAULT_PARAMS: 'default_analysis_parameters',
    CUSTOM_RULES: 'custom_analysis_rules'
  } as const;

  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutos

  /**
   * Obter parâmetros padrão para um tipo de documento
   */
  async getDefaultParameters(documentType: string): Promise<AnalysisParameters> {
    try {
      const cacheKey = `${this.CACHE_KEYS.DEFAULT_PARAMS}_${documentType}`;
      
      // Verificar cache
      const cached = this.cache.get<AnalysisParameters>(cacheKey);
      if (cached) {
        this.logger.debug('Parâmetros padrão obtidos do cache', { documentType });
        return cached;
      }

      // Buscar do backend
      const response = await this.api.get<AnalysisParameters>(
        `/analysis/parameters/default/${documentType}`
      );

      // Cache do resultado
      this.cache.set(cacheKey, response.data, this.CACHE_TTL);
      
      this.logger.info('Parâmetros padrão carregados', { documentType });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao obter parâmetros padrão', error instanceof Error ? error : new Error(String(error)), { documentType });
      
      // Fallback para parâmetros hardcoded
      return this.getFallbackParameters(documentType);
    }
  }

  /**
   * Salvar parâmetros personalizados
   */
  async saveCustomParameters(
    parameters: AnalysisParameters,
    templateName?: string
  ): Promise<ParameterTemplate> {
    try {
      // Validar parâmetros
      const validation = this.validateParameters(parameters);
      if (!validation.isValid) {
        throw new Error(`Parâmetros inválidos: ${validation.errors.join(', ')}`);
      }

      const payload = {
        parameters,
        templateName,
        timestamp: new Date().toISOString()
      };

      const response = await this.api.post<ParameterTemplate>(
        '/analysis/parameters/custom',
        payload
      );

      // Invalidar cache de templates
      this.cache.delete(this.CACHE_KEYS.TEMPLATES);
      
      this.logger.info('Parâmetros personalizados salvos', { templateName });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao salvar parâmetros personalizados', error instanceof Error ? error : new Error(String(error)));
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Listar templates de parâmetros
   */
  async getParameterTemplates(documentType?: string): Promise<ParameterTemplate[]> {
    try {
      const cacheKey = documentType 
        ? `${this.CACHE_KEYS.TEMPLATES}_${documentType}`
        : this.CACHE_KEYS.TEMPLATES;
      
      // Verificar cache
      const cached = this.cache.get<ParameterTemplate[]>(cacheKey);
      if (cached) {
        this.logger.debug('Templates obtidos do cache', { documentType });
        return cached;
      }

      // Buscar do backend
      const url = documentType 
        ? `/analysis/parameters/templates?documentType=${documentType}`
        : '/analysis/parameters/templates';
      
      const response = await this.api.get<ParameterTemplate[]>(url);

      // Cache do resultado
      this.cache.set(cacheKey, response.data, this.CACHE_TTL);
      
      this.logger.info('Templates de parâmetros carregados', { 
        count: response.data.length,
        documentType 
      });
      
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao obter templates de parâmetros', error instanceof Error ? error : new Error(String(error)));
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Obter template específico
   */
  async getParameterTemplate(templateId: string): Promise<ParameterTemplate> {
    try {
      const response = await this.api.get<ParameterTemplate>(
        `/analysis/parameters/templates/${templateId}`
      );

      this.logger.info('Template de parâmetros obtido', { templateId });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao obter template de parâmetros', error instanceof Error ? error : new Error(String(error)), { templateId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Atualizar template de parâmetros
   */
  async updateParameterTemplate(
    templateId: string,
    updates: Partial<ParameterTemplate>
  ): Promise<ParameterTemplate> {
    try {
      // Validar parâmetros se fornecidos
      if (updates.parameters) {
        const validation = this.validateParameters(updates.parameters);
        if (!validation.isValid) {
          throw new Error(`Parâmetros inválidos: ${validation.errors.join(', ')}`);
        }
      }

      const response = await this.api.put<ParameterTemplate>(
        `/analysis/parameters/templates/${templateId}`,
        updates
      );

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.TEMPLATES);
      
      this.logger.info('Template de parâmetros atualizado', { templateId });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao atualizar template de parâmetros', error instanceof Error ? error : new Error(String(error)), { templateId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Deletar template de parâmetros
   */
  async deleteParameterTemplate(templateId: string): Promise<void> {
    try {
      await this.api.delete(`/analysis/parameters/templates/${templateId}`);

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.TEMPLATES);
      
      this.logger.info('Template de parâmetros deletado', { templateId });

    } catch (error) {
      this.logger.error('Erro ao deletar template de parâmetros', error instanceof Error ? error : new Error(String(error)), { templateId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Validar parâmetros de análise
   */
  validateParameters(parameters: AnalysisParameters): ParameterValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validar pesos
      const { weights } = parameters;
      const totalWeight = weights.structural + weights.legal + weights.clarity + weights.abnt;
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        errors.push('A soma dos pesos deve ser igual a 1.0');
      }

      // Validar cada peso individualmente
      Object.entries(weights).forEach(([category, weight]) => {
        if (weight < 0 || weight > 1) {
          errors.push(`Peso da categoria ${category} deve estar entre 0 e 1`);
        }
        if (weight === 0) {
          warnings.push(`Categoria ${category} com peso zero será ignorada`);
        }
      });

      // Validar thresholds se fornecidos
      if (parameters.thresholds) {
        this.validateThresholds(parameters.thresholds, errors, warnings);
      }

      // Validar regras customizadas
      if (parameters.customRules) {
        this.validateCustomRules(parameters.customRules, errors, warnings);
      }

      // Validar idioma
      if (!['pt', 'en'].includes(parameters.language)) {
        errors.push('Idioma deve ser "pt" ou "en"');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      this.logger.error('Erro na validação de parâmetros', error instanceof Error ? error : new Error(String(error)));
      return {
        isValid: false,
        errors: ['Erro interno na validação'],
        warnings: []
      };
    }
  }

  /**
   * Obter regras customizadas
   */
  async getCustomRules(category?: string): Promise<CustomRule[]> {
    try {
      const cacheKey = category 
        ? `${this.CACHE_KEYS.CUSTOM_RULES}_${category}`
        : this.CACHE_KEYS.CUSTOM_RULES;
      
      // Verificar cache
      const cached = this.cache.get<CustomRule[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Buscar do backend
      const url = category 
        ? `/analysis/parameters/rules?category=${category}`
        : '/analysis/parameters/rules';
      
      const response = await this.api.get<CustomRule[]>(url);

      // Cache do resultado
      this.cache.set(cacheKey, response.data, this.CACHE_TTL);
      
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao obter regras customizadas', error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }

  /**
   * Criar regra customizada
   */
  async createCustomRule(rule: Omit<CustomRule, 'id'>): Promise<CustomRule> {
    try {
      const response = await this.api.post<CustomRule>(
        '/analysis/parameters/rules',
        rule
      );

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.CUSTOM_RULES);
      
      this.logger.info('Regra customizada criada', { ruleName: rule.name });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao criar regra customizada', error instanceof Error ? error : new Error(String(error)));
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Atualizar regra customizada
   */
  async updateCustomRule(
    ruleId: string,
    updates: Partial<CustomRule>
  ): Promise<CustomRule> {
    try {
      const response = await this.api.put<CustomRule>(
        `/analysis/parameters/rules/${ruleId}`,
        updates
      );

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.CUSTOM_RULES);
      
      this.logger.info('Regra customizada atualizada', { ruleId });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao atualizar regra customizada', error instanceof Error ? error : new Error(String(error)), { ruleId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Deletar regra customizada
   */
  async deleteCustomRule(ruleId: string): Promise<void> {
    try {
      await this.api.delete(`/analysis/parameters/rules/${ruleId}`);

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.CUSTOM_RULES);
      
      this.logger.info('Regra customizada deletada', { ruleId });

    } catch (error) {
      this.logger.error('Erro ao deletar regra customizada', error instanceof Error ? error : new Error(String(error)), { ruleId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Exportar configuração de parâmetros
   */
  async exportParameters(templateId: string): Promise<Blob> {
    try {
      const response = await this.api.get<Blob>(
        `/analysis/parameters/templates/${templateId}/export`,
        { responseType: 'blob' }
      );

      this.logger.info('Parâmetros exportados', { templateId });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao exportar parâmetros', error instanceof Error ? error : new Error(String(error)), { templateId });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Importar configuração de parâmetros
   */
  async importParameters(file: File): Promise<ParameterTemplate> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post<ParameterTemplate>(
        '/analysis/parameters/import',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Invalidar cache
      this.cache.delete(this.CACHE_KEYS.TEMPLATES);
      
      this.logger.info('Parâmetros importados', { fileName: file.name });
      return response.data;

    } catch (error) {
      this.logger.error('Erro ao importar parâmetros', error instanceof Error ? error : new Error(String(error)), { fileName: file.name });
      throw this.errorService.handle(error as Error);
    }
  }

  /**
   * Obter parâmetros de fallback
   */
  private getFallbackParameters(documentType: string): AnalysisParameters {
    const baseParams: AnalysisParameters = {
      weights: {
        structural: 0.3,
        legal: 0.4,
        clarity: 0.2,
        abnt: 0.1
      },
      enableOcr: true,
      enableConformityCheck: true,
      language: 'pt'
    };

    // Ajustar pesos baseado no tipo de documento
    switch (documentType) {
      case 'edital_licitacao':
        baseParams.weights = {
          structural: 0.25,
          legal: 0.45,
          clarity: 0.25,
          abnt: 0.05
        };
        break;
      case 'contrato':
        baseParams.weights = {
          structural: 0.2,
          legal: 0.5,
          clarity: 0.25,
          abnt: 0.05
        };
        break;
      case 'termo_referencia':
        baseParams.weights = {
          structural: 0.35,
          legal: 0.3,
          clarity: 0.25,
          abnt: 0.1
        };
        break;
    }

    return baseParams;
  }

  /**
   * Validar thresholds
   */
  private validateThresholds(
    thresholds: AnalysisThresholds,
    errors: string[],
    warnings: string[]
  ): void {
    // Validar thresholds estruturais
    if (thresholds.structural.minSections < 0) {
      errors.push('Número mínimo de seções deve ser positivo');
    }
    if (thresholds.structural.minNumberingScore < 0 || thresholds.structural.minNumberingScore > 1) {
      errors.push('Score mínimo de numeração deve estar entre 0 e 1');
    }

    // Validar thresholds legais
    if (thresholds.legal.minLegalReferences < 0) {
      errors.push('Número mínimo de referências legais deve ser positivo');
    }
    if (thresholds.legal.minDeadlineScore < 0 || thresholds.legal.minDeadlineScore > 1) {
      errors.push('Score mínimo de prazos deve estar entre 0 e 1');
    }

    // Validar thresholds de clareza
    if (thresholds.clarity.minReadabilityScore < 0 || thresholds.clarity.minReadabilityScore > 1) {
      errors.push('Score mínimo de legibilidade deve estar entre 0 e 1');
    }
    if (thresholds.clarity.maxJargonScore < 0 || thresholds.clarity.maxJargonScore > 1) {
      errors.push('Score máximo de jargão deve estar entre 0 e 1');
    }

    // Validar thresholds ABNT
    if (thresholds.abnt.minCitationScore < 0 || thresholds.abnt.minCitationScore > 1) {
      errors.push('Score mínimo de citações deve estar entre 0 e 1');
    }
  }

  /**
   * Validar regras customizadas
   */
  private validateCustomRules(
    rules: CustomRule[],
    errors: string[],
    warnings: string[]
  ): void {
    rules.forEach((rule, index) => {
      if (!rule.name || rule.name.trim().length === 0) {
        errors.push(`Regra ${index + 1}: Nome é obrigatório`);
      }
      if (rule.weight < 0 || rule.weight > 1) {
        errors.push(`Regra ${index + 1}: Peso deve estar entre 0 e 1`);
      }
      if (!['structural', 'legal', 'clarity', 'abnt'].includes(rule.category)) {
        errors.push(`Regra ${index + 1}: Categoria inválida`);
      }
      if (!['low', 'medium', 'high', 'critical'].includes(rule.severity)) {
        errors.push(`Regra ${index + 1}: Severidade inválida`);
      }
    });
  }
}

export const parametersService = new ParametersService();
export default parametersService;