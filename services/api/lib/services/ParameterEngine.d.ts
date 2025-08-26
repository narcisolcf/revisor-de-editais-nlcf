/**
 * ParameterEngine - Motor de Parâmetros de Análise
 *
 * Serviço responsável por gerenciar e aplicar parâmetros de análise
 * personalizados para cada organização, incluindo pesos, regras customizadas
 * e configurações avançadas.
 *
 * 🚀 CORE DIFFERENTIATOR: Engine adaptativo que personaliza análises
 * baseado no perfil e histórico da organização.
 */
import { Firestore } from 'firebase-admin/firestore';
import { AnalysisWeights, CustomRule, AnalysisPreset } from '../types/config.types';
import { Analysis } from '../db/schemas/analysis.schema';
export interface ParameterEngineConfig {
    enableAdaptiveWeights: boolean;
    enableLearningMode: boolean;
    adaptationThreshold: number;
    maxWeightAdjustment: number;
    cacheTimeout: number;
}
export interface AnalysisParameters {
    organizationId: string;
    weights: AnalysisWeights;
    customRules: CustomRule[];
    preset: AnalysisPreset;
    adaptiveAdjustments?: {
        weightAdjustments: Partial<AnalysisWeights>;
        confidenceScore: number;
        basedOnAnalyses: number;
        lastUpdated: Date;
    };
    metadata: {
        configVersion: number;
        engineVersion: string;
        generatedAt: Date;
        expiresAt: Date;
    };
}
export interface ParameterOptimization {
    suggestedWeights: AnalysisWeights;
    reasoning: string;
    confidence: number;
    basedOnAnalyses: number;
    improvements: {
        category: string;
        currentWeight: number;
        suggestedWeight: number;
        expectedImprovement: number;
    }[];
}
export declare class ParameterEngine {
    private organizationRepo;
    private customParamsRepo;
    private analysisRepo;
    private config;
    private parameterCache;
    private readonly ENGINE_VERSION;
    constructor(firestore: Firestore, config?: Partial<ParameterEngineConfig>);
    /**
     * Gera parâmetros de análise otimizados para uma organização
     */
    generateParameters(organizationId: string, forceRefresh?: boolean): Promise<AnalysisParameters>;
    /**
     * Gera parâmetros base baseados na configuração da organização
     */
    private generateBaseParameters;
    /**
     * Aplica otimizações adaptativas baseadas no histórico de análises
     */
    private applyAdaptiveOptimizations;
    /**
     * Analisa padrões de performance para sugerir otimizações
     */
    private analyzePerformancePatterns;
    /**
     * Calcula performance por categoria
     */
    private calculateCategoryPerformance;
    /**
     * Determina o preset ótimo para uma organização
     */
    private determineOptimalPreset;
    /**
     * Mescla pesos customizados com pesos base
     */
    private mergeCustomWeights;
    /**
     * Compila regras customizadas ativas
     */
    private compileCustomRules;
    /**
     * Busca análises recentes para aprendizado adaptativo
     */
    private getRecentAnalyses;
    /**
     * Aplica ajustes de peso baseados na otimização
     */
    private applyWeightAdjustments;
    /**
     * Normaliza pesos para somar 100%
     */
    private normalizeWeights;
    /**
     * Calcula diferenças entre pesos
     */
    private calculateWeightDifferences;
    /**
     * Calcula variância de pesos nas análises
     */
    private calculateWeightVariance;
    /**
     * Otimiza parâmetros baseado no histórico de análises
     */
    optimizeParameters(organizationId: string, analysisHistory?: Analysis[]): Promise<ParameterOptimization>;
    /**
     * Limpa cache de parâmetros
     */
    clearCache(organizationId?: string): void;
    /**
     * Obtém estatísticas do engine
     */
    getEngineStats(): {
        version: string;
        config: ParameterEngineConfig;
        cacheSize: number;
        cacheHitRate?: number;
    };
}
//# sourceMappingURL=ParameterEngine.d.ts.map