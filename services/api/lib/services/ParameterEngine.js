"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParameterEngine = void 0;
const firebase_functions_1 = require("firebase-functions");
const config_types_1 = require("../types/config.types");
const analysis_types_1 = require("../types/analysis.types");
const OrganizationRepository_1 = require("../db/repositories/OrganizationRepository");
const AnalysisRepository_1 = require("../db/repositories/AnalysisRepository");
class ParameterEngine {
    constructor(firestore, config = {}) {
        this.parameterCache = new Map();
        this.ENGINE_VERSION = '1.0.0';
        this.organizationRepo = new OrganizationRepository_1.OrganizationRepository(firestore);
        this.customParamsRepo = new OrganizationRepository_1.CustomParametersRepository(firestore);
        this.analysisRepo = new AnalysisRepository_1.AnalysisRepository(firestore);
        // Configuração padrão
        this.config = {
            enableAdaptiveWeights: true,
            enableLearningMode: true,
            adaptationThreshold: 10,
            maxWeightAdjustment: 15.0,
            cacheTimeout: 30 * 60 * 1000, // 30 minutos
            ...config
        };
        firebase_functions_1.logger.info('ParameterEngine initialized', {
            version: this.ENGINE_VERSION,
            config: this.config
        });
    }
    /**
     * Gera parâmetros de análise otimizados para uma organização
     */
    async generateParameters(organizationId, forceRefresh = false) {
        const cacheKey = `params_${organizationId}`;
        // Verificar cache
        if (!forceRefresh && this.parameterCache.has(cacheKey)) {
            const cached = this.parameterCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                firebase_functions_1.logger.debug('Returning cached parameters', { organizationId });
                return cached.params;
            }
        }
        try {
            // Buscar dados da organização
            const [organization, customParams, recentAnalyses] = await Promise.all([
                this.organizationRepo.findById(organizationId),
                this.customParamsRepo.findByOrganization(organizationId),
                this.getRecentAnalyses(organizationId)
            ]);
            if (!organization) {
                throw new Error(`Organization not found: ${organizationId}`);
            }
            // Gerar parâmetros base
            const baseParams = await this.generateBaseParameters(organization, customParams);
            // Aplicar otimizações adaptativas se habilitado
            let finalParams = baseParams;
            if (this.config.enableAdaptiveWeights && recentAnalyses.length >= this.config.adaptationThreshold) {
                finalParams = await this.applyAdaptiveOptimizations(baseParams, recentAnalyses);
            }
            // Adicionar metadata
            const parameters = {
                ...finalParams,
                metadata: {
                    configVersion: customParams.length > 0 ? Math.max(...customParams.map(p => parseInt(p.version) || 1)) : 1,
                    engineVersion: this.ENGINE_VERSION,
                    generatedAt: new Date(),
                    expiresAt: new Date(Date.now() + this.config.cacheTimeout)
                }
            };
            // Atualizar cache
            this.parameterCache.set(cacheKey, {
                params: parameters,
                timestamp: Date.now()
            });
            firebase_functions_1.logger.info('Generated analysis parameters', {
                organizationId,
                preset: parameters.preset,
                customRulesCount: parameters.customRules.length,
                hasAdaptiveAdjustments: !!parameters.adaptiveAdjustments
            });
            return parameters;
        }
        catch (error) {
            firebase_functions_1.logger.error('Error generating parameters', {
                organizationId,
                error: error instanceof Error ? error.message : error
            });
            throw error;
        }
    }
    /**
     * Gera parâmetros base baseados na configuração da organização
     */
    async generateBaseParameters(organization, customParams) {
        // Determinar preset baseado no tipo de organização
        const preset = this.determineOptimalPreset(organization, customParams);
        // Obter pesos base
        let weights = config_types_1.PRESET_WEIGHTS[preset];
        // Aplicar customizações de peso se existirem
        if (customParams.length > 0) {
            weights = this.mergeCustomWeights(weights, customParams);
        }
        // Validar pesos
        if (!(0, config_types_1.validateWeights)(weights)) {
            firebase_functions_1.logger.warn('Invalid weights detected, using preset weights', {
                organizationId: organization.id,
                invalidWeights: weights,
                preset
            });
            weights = config_types_1.PRESET_WEIGHTS[preset];
        }
        // Compilar regras customizadas
        const customRules = this.compileCustomRules(customParams);
        return {
            organizationId: organization.id,
            weights,
            customRules,
            preset
        };
    }
    /**
     * Aplica otimizações adaptativas baseadas no histórico de análises
     */
    async applyAdaptiveOptimizations(baseParams, recentAnalyses) {
        if (!this.config.enableLearningMode) {
            return baseParams;
        }
        try {
            // Analisar padrões de performance
            const optimization = await this.analyzePerformancePatterns(recentAnalyses, baseParams.weights);
            if (optimization.confidence < 0.7) {
                firebase_functions_1.logger.debug('Low confidence optimization, skipping adaptive adjustments', {
                    organizationId: baseParams.organizationId,
                    confidence: optimization.confidence
                });
                return baseParams;
            }
            // Aplicar ajustes adaptativos
            const adaptiveWeights = this.applyWeightAdjustments(baseParams.weights, optimization);
            return {
                ...baseParams,
                weights: adaptiveWeights,
                adaptiveAdjustments: {
                    weightAdjustments: this.calculateWeightDifferences(baseParams.weights, adaptiveWeights),
                    confidenceScore: optimization.confidence,
                    basedOnAnalyses: recentAnalyses.length,
                    lastUpdated: new Date()
                }
            };
        }
        catch (error) {
            firebase_functions_1.logger.error('Error applying adaptive optimizations', {
                organizationId: baseParams.organizationId,
                error: error instanceof Error ? error.message : error
            });
            return baseParams;
        }
    }
    /**
     * Analisa padrões de performance para sugerir otimizações
     */
    async analyzePerformancePatterns(analyses, currentWeights) {
        // Calcular métricas de performance por categoria
        const categoryPerformance = this.calculateCategoryPerformance(analyses);
        // Identificar categorias com baixa performance
        const underperformingCategories = Object.entries(categoryPerformance)
            .filter(([, performance]) => performance.averageScore < 70)
            .map(([category]) => category);
        // Gerar sugestões de ajuste
        const suggestedWeights = { ...currentWeights };
        const improvements = [];
        for (const category of underperformingCategories) {
            const currentWeight = currentWeights[category];
            const performance = categoryPerformance[category];
            // Calcular ajuste sugerido baseado na performance
            const adjustmentFactor = Math.min(this.config.maxWeightAdjustment, (70 - performance.averageScore) * 0.3);
            const suggestedWeight = Math.min(100, currentWeight + adjustmentFactor);
            improvements.push({
                category,
                currentWeight,
                suggestedWeight,
                expectedImprovement: adjustmentFactor * 0.5
            });
            suggestedWeights[category] = suggestedWeight;
        }
        // Normalizar pesos para somar 100%
        const normalizedWeights = this.normalizeWeights(suggestedWeights);
        // Calcular confiança baseada no número de análises e consistência
        const confidence = Math.min(0.95, analyses.length / 50) *
            (1 - this.calculateWeightVariance(analyses) / 100);
        return {
            suggestedWeights: normalizedWeights,
            reasoning: `Otimização baseada em ${analyses.length} análises recentes. ` +
                `Categorias com baixa performance: ${underperformingCategories.join(', ')}`,
            confidence,
            basedOnAnalyses: analyses.length,
            improvements
        };
    }
    /**
     * Calcula performance por categoria
     */
    calculateCategoryPerformance(analyses) {
        const categories = ['structural', 'legal', 'clarity', 'abnt'];
        const performance = {};
        for (const category of categories) {
            const scores = analyses
                .filter(a => a.results?.scores?.[category] !== undefined)
                .map(a => a.results?.scores?.[category])
                .filter((score) => score !== undefined);
            performance[category] = {
                averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
                count: scores.length
            };
        }
        return performance;
    }
    /**
     * Determina o preset ótimo para uma organização
     */
    determineOptimalPreset(organization, customParams) {
        // Se há parâmetros customizados ativos, usar CUSTOM
        if (customParams.some(p => p.status === 'ACTIVE' && p.presetType === 'CUSTOM')) {
            return config_types_1.AnalysisPreset.CUSTOM;
        }
        // Determinar baseado no tipo de organização
        switch (organization.organizationType) {
            case 'TRIBUNAL_CONTAS':
            case 'MINISTERIO':
                return config_types_1.AnalysisPreset.RIGOROUS;
            case 'PREFEITURA':
            case 'GOVERNO_ESTADUAL':
                return config_types_1.AnalysisPreset.STANDARD;
            case 'EMPRESA_PUBLICA':
            case 'FUNDACAO':
            case 'AUTARQUIA':
                return config_types_1.AnalysisPreset.TECHNICAL;
            default:
                return config_types_1.AnalysisPreset.STANDARD;
        }
    }
    /**
     * Mescla pesos customizados com pesos base
     */
    mergeCustomWeights(baseWeights, customParams) {
        const activeParams = customParams.filter(p => p.status === 'ACTIVE');
        if (activeParams.length === 0) {
            return baseWeights;
        }
        // Usar o parâmetro mais recente ou o marcado como padrão
        const primaryParam = activeParams.find(p => p.isDefault) ||
            activeParams.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        return primaryParam.weights || baseWeights;
    }
    /**
     * Compila regras customizadas ativas
     */
    compileCustomRules(customParams) {
        const rules = [];
        for (const param of customParams.filter(p => p.status === 'ACTIVE')) {
            if (param.customRules && param.customRules.length > 0) {
                // Converter IDs de regras em objetos CustomRule
                // Por enquanto, criar regras básicas - isso pode ser expandido
                for (const ruleId of param.customRules) {
                    rules.push({
                        id: ruleId,
                        name: `Regra Customizada ${ruleId}`,
                        description: `Regra customizada para ${param.name}`,
                        pattern: '', // Seria preenchido com dados reais
                        patternType: 'regex',
                        severity: analysis_types_1.ProblemSeverity.MEDIA,
                        category: analysis_types_1.ProblemCategory.JURIDICO,
                        message: 'Regra customizada ativada',
                        isActive: true,
                        weight: 1,
                        createdAt: param.createdAt,
                        updatedAt: param.updatedAt
                    });
                }
            }
        }
        return rules;
    }
    /**
     * Busca análises recentes para aprendizado adaptativo
     */
    async getRecentAnalyses(organizationId, limit = 50) {
        try {
            return await this.analysisRepo.findByOrganization(organizationId, {
                orderBy: [{ field: 'createdAt', direction: 'desc' }],
                limit
            });
        }
        catch (error) {
            firebase_functions_1.logger.warn('Error fetching recent analyses for adaptive learning', {
                organizationId,
                error: error instanceof Error ? error.message : error
            });
            return [];
        }
    }
    /**
     * Aplica ajustes de peso baseados na otimização
     */
    applyWeightAdjustments(baseWeights, optimization) {
        const adjustedWeights = { ...baseWeights };
        for (const improvement of optimization.improvements) {
            const category = improvement.category;
            const maxAdjustment = this.config.maxWeightAdjustment;
            const adjustment = Math.min(maxAdjustment, improvement.suggestedWeight - improvement.currentWeight);
            adjustedWeights[category] = Math.max(0, Math.min(100, baseWeights[category] + adjustment));
        }
        return this.normalizeWeights(adjustedWeights);
    }
    /**
     * Normaliza pesos para somar 100%
     */
    normalizeWeights(weights) {
        const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
        if (Math.abs(total - 100) < 0.01) {
            return weights;
        }
        const factor = 100 / total;
        return {
            structural: Math.round(weights.structural * factor * 10) / 10,
            legal: Math.round(weights.legal * factor * 10) / 10,
            clarity: Math.round(weights.clarity * factor * 10) / 10,
            abnt: Math.round(weights.abnt * factor * 10) / 10
        };
    }
    /**
     * Calcula diferenças entre pesos
     */
    calculateWeightDifferences(original, adjusted) {
        return {
            structural: adjusted.structural - original.structural,
            legal: adjusted.legal - original.legal,
            clarity: adjusted.clarity - original.clarity,
            abnt: adjusted.abnt - original.abnt
        };
    }
    /**
     * Calcula variância de pesos nas análises
     */
    calculateWeightVariance(analyses) {
        // Implementação simplificada - calcular variância baseada nos scores
        const scores = analyses.map(a => a.results?.scores?.overall || 0);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
        return Math.sqrt(variance);
    }
    /**
     * Otimiza parâmetros baseado no histórico de análises
     */
    async optimizeParameters(organizationId, analysisHistory) {
        try {
            firebase_functions_1.logger.info(`Otimizando parâmetros para organização: ${organizationId}`);
            // Buscar análises recentes se não fornecidas
            const analyses = analysisHistory || await this.getRecentAnalyses(organizationId, 100);
            if (analyses.length < this.config.adaptationThreshold) {
                throw new Error(`Histórico insuficiente para otimização. Mínimo: ${this.config.adaptationThreshold}, atual: ${analyses.length}`);
            }
            // Obter parâmetros atuais
            const currentParams = await this.generateParameters(organizationId);
            // Analisar padrões de performance
            const optimization = await this.analyzePerformancePatterns(analyses, currentParams.weights);
            firebase_functions_1.logger.info(`Otimização gerada para ${organizationId}:`, {
                confidence: optimization.confidence,
                basedOnAnalyses: optimization.basedOnAnalyses,
                improvements: optimization.improvements.length
            });
            return optimization;
        }
        catch (error) {
            firebase_functions_1.logger.error(`Erro ao otimizar parâmetros para ${organizationId}:`, error);
            throw error;
        }
    }
    /**
     * Limpa cache de parâmetros
     */
    clearCache(organizationId) {
        if (organizationId) {
            this.parameterCache.delete(`params_${organizationId}`);
        }
        else {
            this.parameterCache.clear();
        }
        firebase_functions_1.logger.info('Parameter cache cleared', { organizationId });
    }
    /**
     * Obtém estatísticas do engine
     */
    getEngineStats() {
        return {
            version: this.ENGINE_VERSION,
            config: this.config,
            cacheSize: this.parameterCache.size
        };
    }
}
exports.ParameterEngine = ParameterEngine;
//# sourceMappingURL=ParameterEngine.js.map