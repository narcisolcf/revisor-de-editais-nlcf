/**
 * Organization Configuration Service
 * 
 * Serviço responsável por conectar as configurações organizacionais
 * armazenadas no Firestore com o Cloud Run analyzer service.
 * 
 * 🚀 CORE DIFFERENTIATOR: Integração entre configurações personalizadas
 * e o motor de análise adaptativo.
 */

import { Firestore } from 'firebase-admin/firestore';
import axios, { AxiosInstance } from 'axios';
import { OrganizationRepository, CustomParametersRepository } from '../db/repositories/OrganizationRepository';
import { OrganizationProfile, CustomParameters } from '../db/schemas/organization.schema';
import { logger } from 'firebase-functions';

export interface AnalysisConfig {
  organizationId: string;
  weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
  customRules: Array<{
    id: string;
    name: string;
    pattern: string;
    severity: 'baixa' | 'media' | 'alta';
    category: 'structural' | 'legal' | 'clarity' | 'abnt';
    message: string;
    suggestion: string;
    isActive: boolean;
  }>;
  preset: 'rigorous' | 'standard' | 'technical' | 'flexible' | 'custom';
  timeout: number;
  maxRetries: number;
}

export interface AnalyzerServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class OrganizationConfigService {
  private organizationRepo: OrganizationRepository;
  private customParamsRepo: CustomParametersRepository;
  private analyzerClient: AxiosInstance;
  private configCache: Map<string, { config: AnalysisConfig; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor(
    db: Firestore,
    analyzerConfig: AnalyzerServiceConfig
  ) {
    this.organizationRepo = new OrganizationRepository(db);
    this.customParamsRepo = new CustomParametersRepository(db);
    
    // Configurar cliente HTTP para o Cloud Run analyzer
    this.analyzerClient = axios.create({
      baseURL: analyzerConfig.baseUrl,
      timeout: analyzerConfig.timeout,
      headers: {
        'Authorization': `Bearer ${analyzerConfig.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para logging de requests
    this.analyzerClient.interceptors.request.use(
      (config) => {
        logger.info('Sending request to analyzer service', {
          url: config.url,
          method: config.method,
          organizationId: config.data?.organizationId
        });
        return config;
      },
      (error) => {
        logger.error('Request interceptor error', new Error(error.message));
        return Promise.reject(error);
      }
    );

    // Interceptor para logging de responses
    this.analyzerClient.interceptors.response.use(
      (response) => {
        logger.info('Received response from analyzer service', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Analyzer service error', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtém configuração de análise para uma organização
   */
  async getAnalysisConfig(organizationId: string): Promise<AnalysisConfig> {
    // Verificar cache primeiro
    const cached = this.configCache.get(organizationId);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      logger.debug('Returning cached config', { organizationId });
      return cached.config;
    }

    try {
      // Buscar organização
      const organization = await this.organizationRepo.findById(organizationId);
      if (!organization) {
        throw new Error(`Organization not found: ${organizationId}`);
      }

      // Buscar parâmetros customizados
      const customParams = await this.customParamsRepo.findByOrganization(organizationId);

      // Construir configuração de análise
      const config = this.buildAnalysisConfig(organization, customParams);

      // Armazenar no cache
      this.configCache.set(organizationId, {
        config,
        timestamp: Date.now()
      });

      logger.info('Built analysis config for organization', {
        organizationId,
        preset: config.preset,
        customRulesCount: config.customRules.length
      });

      return config;
    } catch (error) {
      logger.error(
        'Error getting analysis config',
        error instanceof Error ? error : new Error(String(error)),
        {
          organizationId
        }
      );
      throw error;
    }
  }

  /**
   * Sincroniza configuração com o Cloud Run analyzer
   */
  async syncConfigWithAnalyzer(organizationId: string): Promise<void> {
    try {
      const config = await this.getAnalysisConfig(organizationId);
      
      // Enviar configuração para o analyzer service
      await this.analyzerClient.post('/config/sync', {
        organizationId,
        config
      });

      logger.info('Config synced with analyzer service', { organizationId });
    } catch (error) {
      logger.error(
        'Error syncing config with analyzer',
        error instanceof Error ? error : new Error(String(error)),
        {
          organizationId
        }
      );
      throw error;
    }
  }

  /**
   * Valida configuração com o analyzer service
   */
  async validateConfig(config: AnalysisConfig): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await this.analyzerClient.post('/config/validate', config);
      return response.data;
    } catch (error) {
      logger.error(
        'Error validating config',
        error instanceof Error ? error : new Error(String(error)),
        {
          organizationId: config.organizationId
        }
      );
      throw error;
    }
  }

  /**
   * Obtém presets disponíveis do analyzer service
   */
  async getAvailablePresets(): Promise<Array<{ id: string; name: string; description: string; weights: any }>> {
    try {
      const response = await this.analyzerClient.get('/config/presets');
      return response.data;
    } catch (error) {
      logger.error(
        'Error getting available presets',
        error instanceof Error ? error : new Error(String(error)),
        {}
      );
      throw error;
    }
  }

  /**
   * Limpa cache de configuração
   */
  clearConfigCache(organizationId?: string): void {
    if (organizationId) {
      this.configCache.delete(organizationId);
      logger.debug('Cleared config cache for organization', { organizationId });
    } else {
      this.configCache.clear();
      logger.debug('Cleared all config cache');
    }
  }

  /**
   * Alias para clearConfigCache
   */
  async clearCache(organizationId: string): Promise<void> {
    this.clearConfigCache(organizationId);
  }

  /**
   * Obter presets disponíveis para uma organização
   */
  async getPresets(organizationId: string): Promise<any[]> {
    try {
      const organization = await this.organizationRepo.findById(organizationId);
      if (!organization) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      // Retornar presets padrão + customizados da organização
      const defaultPresets = [
        { id: 'RIGOROUS', name: 'Rigoroso', description: 'Análise detalhada e rigorosa' },
        { id: 'STANDARD', name: 'Padrão', description: 'Análise equilibrada' },
        { id: 'TECHNICAL', name: 'Técnico', description: 'Foco em aspectos técnicos' },
        { id: 'FAST', name: 'Rápido', description: 'Análise rápida e básica' }
      ];

      // Buscar presets customizados da organização
      const customPresets = await this.customParamsRepo.findByOrganization(organizationId);
      
      return [
        ...defaultPresets,
        ...customPresets.map(preset => ({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          custom: true
        }))
      ];
    } catch (error) {
      logger.error(
        'Error getting presets',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId }
      );
      throw error;
    }
  }

  /**
   * Criar novo preset customizado
   */
  async createPreset(organizationId: string, presetData: any): Promise<any> {
    try {
      const organization = await this.organizationRepo.findById(organizationId);
      if (!organization) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      const preset = {
         id: presetData.id || `custom_${Date.now()}`,
         organizationId,
         name: presetData.name,
         description: presetData.description,
         weights: presetData.weights,
         customRules: presetData.customRules || [],
         presetType: 'CUSTOM' as const,
         status: 'ACTIVE' as const,
         isDefault: false,
         version: '1.0.0',
         createdBy: 'system',
         createdAt: new Date(),
         updatedAt: new Date()
       };

      await this.customParamsRepo.create(preset);
      
      // Limpar cache
      this.clearConfigCache(organizationId);
      
      return preset;
    } catch (error) {
      logger.error(
        'Error creating preset',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId }
      );
      throw error;
    }
  }

  /**
   * Obter estatísticas de uso das configurações
   */
  async getUsageStats(organizationId: string): Promise<any> {
    try {
      const organization = await this.organizationRepo.findById(organizationId);
      if (!organization) {
        throw new Error(`Organization ${organizationId} not found`);
      }

      // Estatísticas básicas (em um cenário real, viria de métricas/analytics)
      return {
        organizationId,
        totalAnalyses: 0, // Seria obtido do banco de dados
        configChanges: 0, // Seria obtido do histórico
        lastConfigUpdate: organization.updatedAt,
        activePresets: await this.customParamsRepo.findByOrganization(organizationId).then(p => p.length),
        cacheHits: 0, // Seria obtido de métricas
        avgAnalysisTime: 0 // Seria calculado das análises
      };
    } catch (error) {
      logger.error(
        'Error getting usage stats',
        error instanceof Error ? error : new Error(String(error)),
        { organizationId }
      );
      throw error;
    }
  }

  /**
   * Sincronizar configurações com o analisador
   */
  async syncWithAnalyzer(organizationId: string): Promise<void> {
     try {
       const organization = await this.organizationRepo.findById(organizationId);
       if (!organization) {
         throw new Error(`Organization ${organizationId} not found`);
       }

       const config = this.buildAnalysisConfig(organization, []);
       
       // Enviar configuração para o analisador via HTTP
       const response = await this.analyzerClient.post('/config/sync', {
         organizationId,
         config
       });
       
       if (response.status !== 200) {
         throw new Error(`Failed to sync with analyzer: ${response.statusText}`);
       }
       
       logger.info('Configuration synced with analyzer', { organizationId });
     } catch (error) {
       logger.error(
         'Error syncing with analyzer',
         error instanceof Error ? error : new Error(String(error)),
         { organizationId }
       );
       throw error;
     }
   }

  /**
   * Constrói configuração de análise baseada nos dados da organização
   */
  private buildAnalysisConfig(
    organization: OrganizationProfile,
    customParams: CustomParameters[]
  ): AnalysisConfig {
    // Pesos padrão baseados no tipo de organização
    const defaultWeights = this.getDefaultWeightsByType(organization.organizationType);
    
    // Aplicar pesos customizados se existirem
    const weights = customParams.length > 0 
      ? this.mergeCustomWeights(defaultWeights, customParams)
      : defaultWeights;

    // Construir regras customizadas
    const customRules = customParams
      .filter(param => param.customRules && param.customRules.length > 0 && param.status === 'ACTIVE')
      .flatMap(param => param.customRules.map(ruleId => ({
        id: ruleId,
        name: `Regra ${ruleId}`,
        pattern: '',
        severity: 'media' as const,
        category: 'legal' as const,
        message: `Regra customizada ativada`,
        suggestion: 'Verificar conformidade',
        isActive: true
      })));

    // Determinar preset baseado no tipo de organização
    const preset = this.determinePreset(organization.organizationType, customParams);

    return {
      organizationId: organization.id!,
      weights,
      customRules,
      preset,
      timeout: 300, // Default timeout
      maxRetries: 3 // Default max retries
    };
  }

  /**
   * Obtém pesos padrão baseados no tipo de organização
   */
  private getDefaultWeightsByType(orgType: string): AnalysisConfig['weights'] {
    const weightPresets = {
      'tribunal_contas': { structural: 0.25, legal: 0.50, clarity: 0.20, abnt: 0.05 }, // Rigoroso
      'prefeitura': { structural: 0.25, legal: 0.25, clarity: 0.25, abnt: 0.25 },      // Padrão
      'secretaria_obras': { structural: 0.40, legal: 0.20, clarity: 0.10, abnt: 0.30 }, // Técnico
      'orgao_federal': { structural: 0.30, legal: 0.40, clarity: 0.20, abnt: 0.10 },   // Rigoroso moderado
      'empresa_publica': { structural: 0.30, legal: 0.30, clarity: 0.30, abnt: 0.10 }  // Flexível
    };

    return weightPresets[orgType as keyof typeof weightPresets] || weightPresets.prefeitura;
  }

  /**
   * Mescla pesos customizados com os padrão
   */
  private mergeCustomWeights(
    defaultWeights: AnalysisConfig['weights'],
    customParams: CustomParameters[]
  ): AnalysisConfig['weights'] {
    // Encontrar parâmetros de peso ativos
    const weightParams = customParams.filter(p => p.weights && p.status === 'ACTIVE');
    
    if (weightParams.length === 0) {
      return defaultWeights;
    }

    // Usar os pesos do primeiro parâmetro ativo encontrado
    const activeParam = weightParams[0];
    return {
      structural: activeParam.weights.structural,
      legal: activeParam.weights.legal,
      clarity: activeParam.weights.clarity,
      abnt: activeParam.weights.abnt
    };
  }

  /**
   * Determina preset baseado no tipo de organização e parâmetros customizados
   */
  private determinePreset(
    orgType: string,
    customParams: CustomParameters[]
  ): AnalysisConfig['preset'] {
    // Se há parâmetros customizados significativos, usar preset custom
    const hasCustomWeights = customParams.some(p => p.weights && p.status === 'ACTIVE');
    const hasCustomRules = customParams.some(p => p.customRules && p.customRules.length > 0 && p.status === 'ACTIVE');
    
    if (hasCustomWeights || hasCustomRules) {
      return 'custom';
    }

    // Mapear tipo de organização para preset
    const presetMap = {
      'tribunal_contas': 'rigorous' as const,
      'prefeitura': 'standard' as const,
      'secretaria_obras': 'technical' as const,
      'orgao_federal': 'rigorous' as const,
      'empresa_publica': 'flexible' as const
    };

    return presetMap[orgType as keyof typeof presetMap] || 'standard';
  }

  /**
   * Obtém estatísticas de uso de configurações
   */
  async getConfigUsageStats(organizationId: string): Promise<{
    totalAnalyses: number;
    avgScore: number;
    lastUsed: Date | null;
    configVersion: number;
  }> {
    // Implementar busca de estatísticas no AnalysisRepository
    // Por enquanto, retornar dados mock
    return {
      totalAnalyses: 0,
      avgScore: 0,
      lastUsed: null,
      configVersion: 1
    };
  }
}

/**
 * Factory function para criar instância do serviço
 */
export function createOrganizationConfigService(
  db: Firestore,
  analyzerConfig: AnalyzerServiceConfig
): OrganizationConfigService {
  return new OrganizationConfigService(db, analyzerConfig);
}