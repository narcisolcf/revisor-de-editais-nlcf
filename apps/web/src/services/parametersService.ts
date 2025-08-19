/**
 * Serviço de gerenciamento de parâmetros personalizáveis para análise de documentos
 */

import { apiClient } from './core/api';
import { globalCache } from './core/cache';
import { loggingService } from './core/logging';
import { validationService } from './core/validation';
import { errorService } from './core/error';

/** Pesos para cada categoria de análise */
export interface AnalysisWeights {
  /** Peso da análise estrutural (0-1) */
  structural: number;
  /** Peso da análise legal (0-1) */
  legal: number;
  /** Peso da análise de clareza (0-1) */
  clarity: number;
  /** Peso da análise ABNT (0-1) */
  abnt: number;
}

/** Configurações específicas por categoria */
export interface CategoryConfig {
  /** Se a categoria está habilitada */
  enabled: boolean;
  /** Configurações específicas da categoria */
  settings: Record<string, unknown>;
  /** Regras customizadas para a categoria */
  customRules: string[];
}

/** Parâmetros de análise personalizáveis */
export interface AnalysisParameters {
  /** ID único dos parâmetros */
  id?: string;
  /** Nome dos parâmetros */
  name: string;
  /** Descrição dos parâmetros */
  description?: string;
  /** Pesos das categorias */
  weights: AnalysisWeights;
  /** Configurações por categoria */
  categories: {
    structural: CategoryConfig;
    legal: CategoryConfig;
    clarity: CategoryConfig;
    abnt: CategoryConfig;
  };
  /** Thresholds de qualidade */
  thresholds: AnalysisThresholds;
  /** Feature flags */
  features: FeatureFlags;
  /** Metadados */
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author?: string;
  };
}

/** Regra customizada de análise */
export interface CustomRule {
  /** ID único da regra */
  id: string;
  /** Nome da regra */
  name: string;
  /** Descrição da regra */
  description: string;
  /** Categoria da regra */
  category: 'structural' | 'legal' | 'clarity' | 'abnt';
  /** Padrão regex ou texto a verificar */
  pattern: string;
  /** Tipo de padrão */
  patternType: 'regex' | 'text' | 'keyword';
  /** Peso da regra (0-1) */
  weight: number;
  /** Se é obrigatória */
  required: boolean;
  /** Mensagem de erro/aviso */
  message: string;
  /** Se está ativa */
  active: boolean;
}

/** Thresholds de qualidade */
export interface AnalysisThresholds {
  /** Score mínimo para aprovação (0-100) */
  approval: number;
  /** Score mínimo para aviso (0-100) */
  warning: number;
  /** Score mínimo para cada categoria */
  categories: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
}

/** Feature flags para funcionalidades */
export interface FeatureFlags {
  /** Análise de sentimento */
  sentimentAnalysis: boolean;
  /** Detecção de inconsistências */
  inconsistencyDetection: boolean;
  /** Sugestões automáticas */
  autoSuggestions: boolean;
  /** Análise de complexidade */
  complexityAnalysis: boolean;
  /** Verificação de acessibilidade */
  accessibilityCheck: boolean;
}

/** Template de parâmetros */
export interface ParametersTemplate {
  /** ID único do template */
  id: string;
  /** Nome do template */
  name: string;
  /** Descrição do template */
  description: string;
  /** Parâmetros do template */
  parameters: AnalysisParameters;
  /** Se é template padrão do sistema */
  isDefault: boolean;
  /** Se é público */
  isPublic: boolean;
  /** Tags para categorização */
  tags: string[];
  /** Metadados */
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author: string;
    usage: number;
  };
}

/** Configuração exportável */
export interface ExportableConfig {
  /** Parâmetros */
  parameters: AnalysisParameters;
  /** Templates */
  templates: ParametersTemplate[];
  /** Regras customizadas */
  customRules: CustomRule[];
  /** Metadados da exportação */
  exportMetadata: {
    exportedAt: string;
    version: string;
    source: string;
  };
}

/**
 * Serviço de gerenciamento de parâmetros de análise
 */
export class ParametersService {
  private readonly cacheKey = 'analysis_parameters';
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtém os parâmetros padrão do sistema
   */
  async getDefaultParameters(): Promise<AnalysisParameters> {
    try {
      loggingService.info('Obtendo parâmetros padrão');

      // Tenta buscar do cache primeiro
      const cached = await globalCache.get<AnalysisParameters>(`${this.cacheKey}_default`);
      if (cached) {
        loggingService.debug('Parâmetros padrão obtidos do cache');
        return cached;
      }

      // Busca da API
      const response = await apiClient.get<AnalysisParameters>('/parameters/default');
      
      // Armazena no cache
      await globalCache.set(`${this.cacheKey}_default`, response.data, this.cacheTimeout);
      
      loggingService.info('Parâmetros padrão obtidos com sucesso');
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao obter parâmetros padrão', err instanceof Error ? err : undefined);
      
      const error = errorService.createSystemError(
        `Falha ao obter parâmetros padrão: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'getDefaultParameters',
        true,
        undefined,
        { originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Salva parâmetros personalizados
   */
  async saveCustomParameters(parameters: Partial<AnalysisParameters>): Promise<AnalysisParameters> {
    try {
      loggingService.info('Salvando parâmetros personalizados', { parametersId: parameters.id });

      // Valida os parâmetros
      const validation = await this.validateParameters(parameters);
      if (!validation.isValid) {
        throw new Error(`Parâmetros inválidos: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Salva na API
      const response = await apiClient.post<AnalysisParameters>('/parameters/custom', parameters);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_${response.data.id}`);
      await globalCache.delete(`${this.cacheKey}_list`);
      
      loggingService.info('Parâmetros personalizados salvos com sucesso', { parametersId: response.data.id });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao salvar parâmetros personalizados', err instanceof Error ? err : undefined, { parameters });
      
      const error = errorService.createSystemError(
        `Falha ao salvar parâmetros: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'saveCustomParameters',
        true,
        undefined,
        { parameters, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Lista todos os templates disponíveis
   */
  async listTemplates(): Promise<ParametersTemplate[]> {
    try {
      loggingService.info('Listando templates de parâmetros');

      // Tenta buscar do cache primeiro
      const cached = await globalCache.get<ParametersTemplate[]>(`${this.cacheKey}_templates`);
      if (cached) {
        loggingService.debug('Templates obtidos do cache');
        return cached;
      }

      // Busca da API
      const response = await apiClient.get<ParametersTemplate[]>('/parameters/templates');
      
      // Armazena no cache
      await globalCache.set(`${this.cacheKey}_templates`, response.data, this.cacheTimeout);
      
      loggingService.info('Templates listados com sucesso', { count: response.data.length });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao listar templates', err instanceof Error ? err : undefined);
      
      const error = errorService.createSystemError(
        `Falha ao listar templates: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'listTemplates',
        true,
        undefined,
        { originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Obtém um template específico
   */
  async getTemplate(templateId: string): Promise<ParametersTemplate> {
    try {
      loggingService.info('Obtendo template', { templateId });

      // Tenta buscar do cache primeiro
      const cached = await globalCache.get<ParametersTemplate>(`${this.cacheKey}_template_${templateId}`);
      if (cached) {
        loggingService.debug('Template obtido do cache', { templateId });
        return cached;
      }

      // Busca da API
      const response = await apiClient.get<ParametersTemplate>(`/parameters/templates/${templateId}`);
      
      // Armazena no cache
      await globalCache.set(`${this.cacheKey}_template_${templateId}`, response.data, this.cacheTimeout);
      
      loggingService.info('Template obtido com sucesso', { templateId });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao obter template', err instanceof Error ? err : undefined, { templateId });
      
      const error = errorService.createSystemError(
        `Falha ao obter template: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'getTemplate',
        true,
        undefined,
        { templateId, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Salva um novo template
   */
  async saveTemplate(template: Omit<ParametersTemplate, 'id' | 'metadata'>): Promise<ParametersTemplate> {
    try {
      loggingService.info('Salvando template', { templateName: template.name });

      // Salva na API
      const response = await apiClient.post<ParametersTemplate>('/parameters/templates', template);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_templates`);
      
      loggingService.info('Template salvo com sucesso', { templateId: response.data.id });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao salvar template', err instanceof Error ? err : undefined, { template });
      
      const error = errorService.createSystemError(
        `Falha ao salvar template: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'saveTemplate',
        true,
        undefined,
        { template, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Atualiza um template existente
   */
  async updateTemplate(templateId: string, updates: Partial<ParametersTemplate>): Promise<ParametersTemplate> {
    try {
      loggingService.info('Atualizando template', { templateId });

      // Atualiza na API
      const response = await apiClient.put<ParametersTemplate>(`/parameters/templates/${templateId}`, updates);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_template_${templateId}`);
      await globalCache.delete(`${this.cacheKey}_templates`);
      
      loggingService.info('Template atualizado com sucesso', { templateId });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao atualizar template', err instanceof Error ? err : undefined, { templateId, updates });
      
      const error = errorService.createSystemError(
        `Falha ao atualizar template: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'updateTemplate',
        true,
        undefined,
        { templateId, updates, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Deleta um template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      loggingService.info('Deletando template', { templateId });

      // Deleta da API
      await apiClient.delete(`/parameters/templates/${templateId}`);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_template_${templateId}`);
      await globalCache.delete(`${this.cacheKey}_templates`);
      
      loggingService.info('Template deletado com sucesso', { templateId });
    } catch (err) {
      loggingService.error('Erro ao deletar template', err instanceof Error ? err : undefined, { templateId });
      
      const error = errorService.createSystemError(
        `Falha ao deletar template: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'deleteTemplate',
        true,
        undefined,
        { templateId, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Valida parâmetros de análise
   */
  async validateParameters(parameters: Partial<AnalysisParameters>): Promise<{ isValid: boolean; errors: Array<{ field: string; message: string }> }> {
    const errors: Array<{ field: string; message: string }> = [];

    // Valida pesos
    if (parameters.weights) {
      const { structural, legal, clarity, abnt } = parameters.weights;
      const total = structural + legal + clarity + abnt;
      
      if (Math.abs(total - 1) > 0.01) {
        errors.push({ field: 'weights', message: 'A soma dos pesos deve ser igual a 1' });
      }
      
      if ([structural, legal, clarity, abnt].some(w => w < 0 || w > 1)) {
        errors.push({ field: 'weights', message: 'Todos os pesos devem estar entre 0 e 1' });
      }
    }

    // Valida thresholds
    if (parameters.thresholds) {
      const { approval, warning } = parameters.thresholds;
      
      if (approval < 0 || approval > 100) {
        errors.push({ field: 'thresholds.approval', message: 'Threshold de aprovação deve estar entre 0 e 100' });
      }
      
      if (warning < 0 || warning > 100) {
        errors.push({ field: 'thresholds.warning', message: 'Threshold de aviso deve estar entre 0 e 100' });
      }
      
      if (warning >= approval) {
        errors.push({ field: 'thresholds', message: 'Threshold de aviso deve ser menor que o de aprovação' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtém regras customizadas
   */
  async getCustomRules(): Promise<CustomRule[]> {
    try {
      loggingService.info('Obtendo regras customizadas');

      // Tenta buscar do cache primeiro
      const cached = await globalCache.get<CustomRule[]>(`${this.cacheKey}_custom_rules`);
      if (cached) {
        loggingService.debug('Regras customizadas obtidas do cache');
        return cached;
      }

      // Busca da API
      const response = await apiClient.get<CustomRule[]>('/parameters/custom-rules');
      
      // Armazena no cache
      await globalCache.set(`${this.cacheKey}_custom_rules`, response.data, this.cacheTimeout);
      
      loggingService.info('Regras customizadas obtidas com sucesso', { count: response.data.length });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao obter regras customizadas', err instanceof Error ? err : undefined);
      
      const error = errorService.createSystemError(
        `Falha ao obter regras customizadas: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'getCustomRules',
        true,
        undefined,
        { originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Cria uma nova regra customizada
   */
  async createCustomRule(rule: Omit<CustomRule, 'id'>): Promise<CustomRule> {
    try {
      loggingService.info('Criando regra customizada', { ruleName: rule.name });

      // Cria na API
      const response = await apiClient.post<CustomRule>('/parameters/custom-rules', rule);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_custom_rules`);
      
      loggingService.info('Regra customizada criada com sucesso', { ruleId: response.data.id });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao criar regra customizada', err instanceof Error ? err : undefined, { rule });
      
      const error = errorService.createSystemError(
        `Falha ao criar regra customizada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'createCustomRule',
        true,
        undefined,
        { rule, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Atualiza uma regra customizada
   */
  async updateCustomRule(ruleId: string, updates: Partial<CustomRule>): Promise<CustomRule> {
    try {
      loggingService.info('Atualizando regra customizada', { ruleId });

      // Atualiza na API
      const response = await apiClient.put<CustomRule>(`/parameters/custom-rules/${ruleId}`, updates);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_custom_rules`);
      
      loggingService.info('Regra customizada atualizada com sucesso', { ruleId });
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao atualizar regra customizada', err instanceof Error ? err : undefined, { ruleId, updates });
      
      const error = errorService.createSystemError(
        `Falha ao atualizar regra customizada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'updateCustomRule',
        true,
        undefined,
        { ruleId, updates, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Deleta uma regra customizada
   */
  async deleteCustomRule(ruleId: string): Promise<void> {
    try {
      loggingService.info('Deletando regra customizada', { ruleId });

      // Deleta da API
      await apiClient.delete(`/parameters/custom-rules/${ruleId}`);
      
      // Limpa cache relacionado
      await globalCache.delete(`${this.cacheKey}_custom_rules`);
      
      loggingService.info('Regra customizada deletada com sucesso', { ruleId });
    } catch (err) {
      loggingService.error('Erro ao deletar regra customizada', err instanceof Error ? err : undefined, { ruleId });
      
      const error = errorService.createSystemError(
        `Falha ao deletar regra customizada: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'deleteCustomRule',
        true,
        undefined,
        { ruleId, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Exporta configuração completa
   */
  async exportConfiguration(): Promise<ExportableConfig> {
    try {
      loggingService.info('Exportando configuração');

      // Busca dados da API
      const response = await apiClient.get<ExportableConfig>('/parameters/export');
      
      loggingService.info('Configuração exportada com sucesso');
      return response.data;
    } catch (err) {
      loggingService.error('Erro ao exportar configuração', err instanceof Error ? err : undefined);
      
      const error = errorService.createSystemError(
        `Falha ao exportar configurações: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'exportConfiguration',
        true,
        undefined,
        { originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Importa configuração
   */
  async importConfiguration(config: ExportableConfig): Promise<void> {
    try {
      loggingService.info('Importando configuração');

      // Importa na API
      await apiClient.post('/parameters/import', config);
      
      // Limpa todo o cache relacionado
      await globalCache.delete(`${this.cacheKey}_default`);
      await globalCache.delete(`${this.cacheKey}_templates`);
      await globalCache.delete(`${this.cacheKey}_custom_rules`);
      
      loggingService.info('Configuração importada com sucesso');
    } catch (err) {
      loggingService.error('Erro ao importar configuração', err instanceof Error ? err : undefined, { config });
      
      const error = errorService.createSystemError(
        `Falha ao importar configurações: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        'ParametersService',
        'importConfiguration',
        true,
        undefined,
        { config, originalError: err }
      );
      throw errorService.handle(error);
    }
  }

  /**
   * Obtém parâmetros de fallback em caso de erro
   */
  getFallbackParameters(): AnalysisParameters {
    return {
      id: 'fallback',
      name: 'Parâmetros de Fallback',
      description: 'Parâmetros padrão utilizados em caso de erro',
      weights: {
        structural: 0.3,
        legal: 0.3,
        clarity: 0.25,
        abnt: 0.15
      },
      categories: {
        structural: {
          enabled: true,
          settings: {},
          customRules: []
        },
        legal: {
          enabled: true,
          settings: {},
          customRules: []
        },
        clarity: {
          enabled: true,
          settings: {},
          customRules: []
        },
        abnt: {
          enabled: true,
          settings: {},
          customRules: []
        }
      },
      thresholds: {
        approval: 70,
        warning: 50,
        categories: {
          structural: 60,
          legal: 70,
          clarity: 60,
          abnt: 50
        }
      },
      features: {
        sentimentAnalysis: false,
        inconsistencyDetection: true,
        autoSuggestions: true,
        complexityAnalysis: false,
        accessibilityCheck: false
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        author: 'system'
      }
    };
  }
}

// Instância singleton do serviço
export const parametersService = new ParametersService();

// Exportações de conveniência
export default parametersService;