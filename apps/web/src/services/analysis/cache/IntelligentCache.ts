import { AnalysisContext, AnalysisResult } from '../analyzers/BaseAnalyzer';

export interface CacheEntry {
  result: AnalysisResult;
  timestamp: number;
  parameters: Record<string, any>;
  textHash: string;
  classificationHash: string;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number;
  ttl: number; // Time to live em milissegundos
  similarityThreshold: number; // Threshold para considerar análises similares
  enableCompression: boolean;
  enableMetrics: boolean;
}

export interface CacheMetrics {
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  cacheSize: number;
  entryCount: number;
  averageHitRate: number;
  compressionRatio: number;
  evictionCount: number;
}

export class IntelligentCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics;
  private similarityIndex: Map<string, string[]> = new Map(); // textHash -> similar hashes

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100, // 100MB
      maxEntries: 1000,
      ttl: 24 * 60 * 60 * 1000, // 24 horas
      similarityThreshold: 0.85,
      enableCompression: true,
      enableMetrics: true,
      ...config
    };

    this.metrics = {
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      cacheSize: 0,
      entryCount: 0,
      averageHitRate: 0,
      compressionRatio: 1.0,
      evictionCount: 0
    };

    // Iniciar limpeza periódica
    this.startPeriodicCleanup();
  }

  async get(context: AnalysisContext): Promise<AnalysisResult | null> {
    this.metrics.totalRequests++;
    
    const cacheKey = this.generateCacheKey(context);
    
    // Tentar cache direto primeiro
    const directHit = this.cache.get(cacheKey);
    if (directHit && this.isValid(directHit)) {
      this.updateAccessMetrics(directHit);
      this.metrics.totalHits++;
      return directHit.result;
    }

    // Tentar cache por similaridade
    const similarHit = await this.findSimilarAnalysis(context);
    if (similarHit) {
      this.metrics.totalHits++;
      return similarHit;
    }

    this.metrics.totalMisses++;
    return null;
  }

  async set(context: AnalysisContext, result: AnalysisResult): Promise<void> {
    const cacheKey = this.generateCacheKey(context);
    const textHash = this.hashText(context.text);
    const classificationHash = this.hashClassification(context.classification);
    
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      parameters: context.parameters,
      textHash,
      classificationHash,
      accessCount: 1,
      lastAccessed: Date.now(),
      size: this.calculateEntrySize(result)
    };

    // Verificar se há espaço suficiente
    await this.ensureCacheSpace(entry.size);

    // Adicionar ao cache
    this.cache.set(cacheKey, entry);
    
    // Atualizar índice de similaridade
    this.updateSimilarityIndex(textHash, classificationHash);

    // Atualizar métricas
    this.updateCacheMetrics(entry.size);
  }

  async invalidateByParameters(parameters: Record<string, any>): Promise<number> {
    let invalidatedCount = 0;
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.hasParameterChanges(entry.parameters, parameters)) {
        keysToRemove.push(key);
        invalidatedCount++;
      }
    }

    // Remover entradas invalidadas
    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.updateCacheMetrics(-entry.size);
        this.cache.delete(key);
      }
    });

    this.metrics.evictionCount += invalidatedCount;
    return invalidatedCount;
  }

  async invalidateByClassification(classification: any): Promise<number> {
    let invalidatedCount = 0;
    const classificationHash = this.hashClassification(classification);
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.classificationHash === classificationHash) {
        keysToRemove.push(key);
        invalidatedCount++;
      }
    }

    // Remover entradas invalidadas
    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.updateCacheMetrics(-entry.size);
        this.cache.delete(key);
      }
    });

    this.metrics.evictionCount += invalidatedCount;
    return invalidatedCount;
  }

  async invalidateByTextSimilarity(text: string, threshold: number = 0.9): Promise<number> {
    let invalidatedCount = 0;
    const textHash = this.hashText(text);
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const similarity = this.calculateTextSimilarity(textHash, entry.textHash);
      if (similarity >= threshold) {
        keysToRemove.push(key);
        invalidatedCount++;
      }
    }

    // Remover entradas invalidadas
    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.updateCacheMetrics(-entry.size);
        this.cache.delete(key);
      }
    });

    this.metrics.evictionCount += invalidatedCount;
    return invalidatedCount;
  }

  clear(): void {
    this.cache.clear();
    this.similarityIndex.clear();
    this.metrics = {
      totalHits: 0,
      totalMisses: 0,
      totalRequests: 0,
      cacheSize: 0,
      entryCount: 0,
      averageHitRate: 0,
      compressionRatio: 1.0,
      evictionCount: 0
    };
  }

  getMetrics(): CacheMetrics {
    if (this.metrics.totalRequests > 0) {
      this.metrics.averageHitRate = this.metrics.totalHits / this.metrics.totalRequests;
    }
    
    return { ...this.metrics };
  }

  getCacheStats(): { size: number; entryCount: number; hitRate: number } {
    return {
      size: this.metrics.cacheSize,
      entryCount: this.metrics.entryCount,
      hitRate: this.metrics.averageHitRate
    };
  }

  private generateCacheKey(context: AnalysisContext): string {
    const { text, classification, parameters } = context;
    
    // Criar hash composto
    const textHash = this.hashText(text.substring(0, 500)); // Primeiros 500 caracteres
    const classificationHash = this.hashClassification(classification);
    const parametersHash = this.hashParameters(parameters);
    
    return `${classificationHash}_${textHash}_${parametersHash}`;
  }

  private async findSimilarAnalysis(context: AnalysisContext): Promise<AnalysisResult | null> {
    const textHash = this.hashText(context.text);
    const classificationHash = this.hashClassification(context.classification);
    
    let bestMatch: { entry: CacheEntry; similarity: number } | null = null;

    for (const [_, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) continue;

      // Verificar similaridade de classificação
      if (entry.classificationHash !== classificationHash) continue;

      // Calcular similaridade de texto
      const textSimilarity = this.calculateTextSimilarity(textHash, entry.textHash);
      
      // Calcular similaridade de parâmetros
      const parameterSimilarity = this.calculateParameterSimilarity(context.parameters, entry.parameters);
      
      // Similaridade combinada
      const combinedSimilarity = (textSimilarity * 0.7) + (parameterSimilarity * 0.3);

      if (combinedSimilarity >= this.config.similarityThreshold) {
        if (!bestMatch || combinedSimilarity > bestMatch.similarity) {
          bestMatch = { entry, similarity: combinedSimilarity };
        }
      }
    }

    if (bestMatch) {
      this.updateAccessMetrics(bestMatch.entry);
      return bestMatch.entry.result;
    }

    return null;
  }

  private calculateTextSimilarity(hash1: string, hash2: string): number {
    // Implementação simples de similaridade baseada em hash
    // Em produção, usar algoritmos mais sofisticados como Jaccard, Cosine, etc.
    
    if (hash1 === hash2) return 1.0;
    
    // Calcular distância de Hamming simples
    const maxLength = Math.max(hash1.length, hash2.length);
    let differences = 0;
    
    for (let i = 0; i < maxLength; i++) {
      if (hash1[i] !== hash2[i]) differences++;
    }
    
    return 1 - (differences / maxLength);
  }

  private calculateParameterSimilarity(params1: Record<string, any>, params2: Record<string, any>): number {
    const keys1 = Object.keys(params1);
    const keys2 = Object.keys(params2);
    
    if (keys1.length === 0 && keys2.length === 0) return 1.0;
    if (keys1.length === 0 || keys2.length === 0) return 0.0;
    
    const commonKeys = keys1.filter(key => keys2.includes(key));
    const totalKeys = new Set([...keys1, ...keys2]).size;
    
    if (commonKeys.length === 0) return 0.0;
    
    let matchingValues = 0;
    commonKeys.forEach(key => {
      if (JSON.stringify(params1[key]) === JSON.stringify(params2[key])) {
        matchingValues++;
      }
    });
    
    return (matchingValues / totalKeys) * (commonKeys.length / totalKeys);
  }

  private hasParameterChanges(oldParams: Record<string, any>, newParams: Record<string, any>): boolean {
    const keys = new Set([...Object.keys(oldParams), ...Object.keys(newParams)]);
    
    for (const key of keys) {
      const oldValue = oldParams[key];
      const newValue = newParams[key];
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        return true;
      }
    }
    
    return false;
  }

  private async ensureCacheSpace(requiredSize: number): Promise<void> {
    while (this.metrics.cacheSize + requiredSize > this.config.maxSize * 1024 * 1024 || 
           this.metrics.entryCount >= this.config.maxEntries) {
      
      // Encontrar entrada para remover (LRU + LFU)
      const entryToRemove = this.findEntryToEvict();
      if (entryToRemove) {
        this.cache.delete(entryToRemove);
        const entry = this.cache.get(entryToRemove);
        if (entry) {
          this.updateCacheMetrics(-entry.size);
        }
        this.metrics.evictionCount++;
      } else {
        break; // Não foi possível remover mais entradas
      }
    }
  }

  private findEntryToEvict(): string | null {
    let worstEntry: { key: string; score: number } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        return key; // Remover entradas expiradas primeiro
      }
      
      // Calcular score de evição (LRU + LFU)
      const timeScore = (Date.now() - entry.lastAccessed) / (1000 * 60 * 60); // Horas
      const accessScore = 1 / (entry.accessCount + 1);
      const evictionScore = timeScore * 0.7 + accessScore * 0.3;
      
      if (!worstEntry || evictionScore > worstEntry.score) {
        worstEntry = { key, score: evictionScore };
      }
    }
    
    return worstEntry?.key || null;
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < this.config.ttl;
  }

  private updateAccessMetrics(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private updateCacheMetrics(sizeChange: number): void {
    this.metrics.cacheSize = Math.max(0, this.metrics.cacheSize + sizeChange);
    this.metrics.entryCount = this.cache.size;
  }

  private updateSimilarityIndex(textHash: string, classificationHash: string): void {
    const key = `${classificationHash}_${textHash}`;
    
    if (!this.similarityIndex.has(key)) {
      this.similarityIndex.set(key, []);
    }
    
    // Adicionar hashes similares
    for (const [existingKey, _] of this.cache.entries()) {
      if (existingKey !== key) {
        const existingHashes = this.similarityIndex.get(existingKey);
        if (existingHashes && !existingHashes.includes(key)) {
          existingHashes.push(key);
        }
      }
    }
  }

  private calculateEntrySize(result: AnalysisResult): number {
    // Estimativa simples do tamanho da entrada
    const resultSize = JSON.stringify(result).length;
    const overhead = 200; // Overhead de metadados
    return resultSize + overhead;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private hashClassification(classification: any): string {
    return this.hashText(JSON.stringify(classification));
  }

  private hashParameters(parameters: Record<string, any>): string {
    return this.hashText(JSON.stringify(parameters));
  }

  private startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.updateCacheMetrics(-entry.size);
        this.cache.delete(key);
      }
    });

    this.metrics.evictionCount += keysToRemove.length;
  }
}
