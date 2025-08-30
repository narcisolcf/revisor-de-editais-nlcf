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
export declare class OrganizationConfigService {
    private organizationRepo;
    private customParamsRepo;
    private analyzerClient;
    private configCache;
    private readonly CACHE_TTL;
    constructor(db: Firestore, analyzerConfig: AnalyzerServiceConfig);
    /**
     * Obtém configuração de análise para uma organização
     */
    getAnalysisConfig(organizationId: string): Promise<AnalysisConfig>;
    /**
     * Sincroniza configuração com o Cloud Run analyzer
     */
    syncConfigWithAnalyzer(organizationId: string): Promise<void>;
    /**
     * Valida configuração com o analyzer service
     */
    validateConfig(config: AnalysisConfig): Promise<{
        isValid: boolean;
        errors: string[];
    }>;
    /**
     * Obtém presets disponíveis do analyzer service
     */
    getAvailablePresets(): Promise<Array<{
        id: string;
        name: string;
        description: string;
        weights: any;
    }>>;
    /**
     * Limpa cache de configuração
     */
    clearConfigCache(organizationId?: string): void;
    /**
     * Alias para clearConfigCache
     */
    clearCache(organizationId: string): Promise<void>;
    /**
     * Obter presets disponíveis para uma organização
     */
    getPresets(organizationId: string): Promise<any[]>;
    /**
     * Criar novo preset customizado
     */
    createPreset(organizationId: string, presetData: any): Promise<any>;
    /**
     * Obter estatísticas de uso das configurações
     */
    getUsageStats(organizationId: string): Promise<any>;
    /**
     * Sincronizar configurações com o analisador
     */
    syncWithAnalyzer(organizationId: string): Promise<void>;
    /**
     * Constrói configuração de análise baseada nos dados da organização
     */
    private buildAnalysisConfig;
    /**
     * Obtém pesos padrão baseados no tipo de organização
     */
    private getDefaultWeightsByType;
    /**
     * Mescla pesos customizados com os padrão
     */
    private mergeCustomWeights;
    /**
     * Determina preset baseado no tipo de organização e parâmetros customizados
     */
    private determinePreset;
    /**
     * Obtém estatísticas de uso de configurações
     */
    getConfigUsageStats(organizationId: string): Promise<{
        totalAnalyses: number;
        avgScore: number;
        lastUsed: Date | null;
        configVersion: number;
    }>;
}
/**
 * Factory function para criar instância do serviço
 */
export declare function createOrganizationConfigService(db: Firestore, analyzerConfig: AnalyzerServiceConfig): OrganizationConfigService;
