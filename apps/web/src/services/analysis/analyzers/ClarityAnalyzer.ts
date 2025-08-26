import { BaseAnalyzer, AnalysisContext, AnalysisResult, AnalyzerConfig } from './BaseAnalyzer';
import { Problem } from '@/types/document';

export class ClarityAnalyzer extends BaseAnalyzer {
  private ambiguityPatterns: AmbiguityPattern[] = [];
  private readabilityMetrics: ReadabilityMetric[] = [];

  constructor() {
    super({
      name: 'ClarityAnalyzer',
      version: '1.0.0',
      enabled: true,
      priority: 3,
      timeout: 12000,
      fallbackEnabled: true
    });

    this.initializeAmbiguityPatterns();
    this.initializeReadabilityMetrics();
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const { text, classification } = context;
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise de ambiguidade
    const ambiguityAnalysis = this.analyzeAmbiguity(text);
    problems.push(...ambiguityAnalysis.problems);
    Object.assign(metrics, ambiguityAnalysis.metrics);

    // Análise de legibilidade
    const readabilityAnalysis = this.analyzeReadability(text);
    problems.push(...readabilityAnalysis.problems);
    Object.assign(metrics, readabilityAnalysis.metrics);

    // Análise de clareza específica por tipo de documento
    const specificClarityAnalysis = this.analyzeSpecificClarity(text, classification);
    problems.push(...specificClarityAnalysis.problems);
    Object.assign(metrics, specificClarityAnalysis.metrics);

    // Análise de consistência terminológica
    const terminologyAnalysis = this.analyzeTerminologyConsistency(text);
    problems.push(...terminologyAnalysis.problems);
    Object.assign(metrics, terminologyAnalysis.metrics);

    // Calcular score de clareza
    const score = this.calculateClarityScore(problems, metrics);
    const confidence = this.calculateConfidence(problems, metrics);

    return {
      problems,
      metrics,
      score,
      confidence,
      processingTime: 0
    };
  }

  private initializeAmbiguityPatterns(): void {
    this.ambiguityPatterns = [
      {
        pattern: /\b(?:pode|poderá|eventualmente|possivelmente)\b/gi,
        type: 'ambiguidade_modal',
        severity: 'media',
        description: 'Uso de verbos modais pode criar ambiguidade',
        suggestion: 'Especificar condições e responsabilidades de forma clara'
      },
      {
        pattern: /\b(?:adequado|apropriado|suficiente|razoável)\b/gi,
        type: 'ambiguidade_subjetiva',
        severity: 'alta',
        description: 'Termos subjetivos podem gerar interpretações divergentes',
        suggestion: 'Substituir por critérios objetivos e mensuráveis'
      },
      {
        pattern: /\b(?:etc|e outros|e similares|e afins)\b/gi,
        type: 'ambiguidade_generalizacao',
        severity: 'media',
        description: 'Generalizações podem deixar escopo indefinido',
        suggestion: 'Listar especificamente todos os itens necessários'
      },
      {
        pattern: /\b(?:quando necessário|se for o caso|conforme apropriado)\b/gi,
        type: 'ambiguidade_condicional',
        severity: 'alta',
        description: 'Condições vagas podem gerar incerteza',
        suggestion: 'Definir critérios objetivos para quando ações são necessárias'
      },
      {
        pattern: /\b(?:em tempo hábil|com antecedência|prontamente)\b/gi,
        type: 'ambiguidade_temporal',
        severity: 'media',
        description: 'Prazos vagos podem gerar interpretações divergentes',
        suggestion: 'Especificar prazos em dias, horas ou minutos'
      }
    ];
  }

  private initializeReadabilityMetrics(): void {
    this.readabilityMetrics = [
      {
        name: 'sentences_per_paragraph',
        maxValue: 3,
        severity: 'baixa',
        description: 'Parágrafos muito longos dificultam leitura',
        suggestion: 'Dividir parágrafos longos em parágrafos menores'
      },
      {
        name: 'words_per_sentence',
        maxValue: 25,
        severity: 'media',
        description: 'Frases muito longas dificultam compreensão',
        suggestion: 'Dividir frases longas em frases menores'
      },
      {
        name: 'syllables_per_word',
        maxValue: 3,
        severity: 'baixa',
        description: 'Palavras muito longas podem dificultar leitura',
        suggestion: 'Usar sinônimos mais simples quando possível'
      }
    ];
  }

  private analyzeAmbiguity(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    let totalAmbiguities = 0;
    const ambiguityTypes: Record<string, number> = {};

    this.ambiguityPatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        totalAmbiguities += matches.length;
        ambiguityTypes[pattern.type] = (ambiguityTypes[pattern.type] || 0) + matches.length;

        // Criar problema para cada tipo de ambiguidade encontrado
        if (matches.length > 2) { // Só criar problema se houver muitas ocorrências
          problems.push({
            tipo: 'inconsistencia',
            descricao: pattern.description,
            gravidade: pattern.severity,
            localizacao: 'Clareza do texto',
            sugestaoCorrecao: pattern.suggestion,
            categoria: 'formal'
          });
        }
      }
    });

    metrics.totalAmbiguities = totalAmbiguities;
    metrics.ambiguityTypes = ambiguityTypes;
    metrics.inconsistencies = totalAmbiguities;

    return { problems, metrics };
  }

  private analyzeReadability(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise de parágrafos
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const sentencesPerParagraph = paragraphs.map(p => {
      const sentences = p.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.length;
    });

    const avgSentencesPerParagraph = sentencesPerParagraph.reduce((a, b) => a + b, 0) / sentencesPerParagraph.length;
    metrics.avgSentencesPerParagraph = avgSentencesPerParagraph;

    if (avgSentencesPerParagraph > 3) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: `Média de ${avgSentencesPerParagraph.toFixed(1)} frases por parágrafo (recomendado: máximo 3)`,
        gravidade: 'baixa',
        localizacao: 'Legibilidade do texto',
        sugestaoCorrecao: 'Dividir parágrafos longos em parágrafos menores',
        categoria: 'formal'
      });
    }

    // Análise de frases
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const wordsPerSentence = sentences.map(s => {
      const words = s.trim().split(/\s+/).filter(w => w.length > 0);
      return words.length;
    });

    const avgWordsPerSentence = wordsPerSentence.reduce((a, b) => a + b, 0) / wordsPerSentence.length;
    metrics.avgWordsPerSentence = avgWordsPerSentence;

    if (avgWordsPerSentence > 25) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: `Média de ${avgWordsPerSentence.toFixed(1)} palavras por frase (recomendado: máximo 25)`,
        gravidade: 'media',
        localizacao: 'Legibilidade do texto',
        sugestaoCorrecao: 'Dividir frases longas em frases menores',
        categoria: 'formal'
      });
    }

    // Análise de palavras
    const words = text.toLowerCase().match(/\b[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]+\b/g) || [];
    const syllablesPerWord = words.map(w => this.countSyllables(w));
    const avgSyllablesPerWord = syllablesPerWord.reduce((a, b) => a + b, 0) / syllablesPerWord.length;
    metrics.avgSyllablesPerWord = avgSyllablesPerWord;

    if (avgSyllablesPerWord > 3) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: `Média de ${avgSyllablesPerWord.toFixed(1)} sílabas por palavra (recomendado: máximo 3)`,
        gravidade: 'baixa',
        localizacao: 'Legibilidade do texto',
        sugestaoCorrecao: 'Usar sinônimos mais simples quando possível',
        categoria: 'formal'
      });
    }

    // Calcular índice de legibilidade Flesch-Kincaid
    const fleschScore = this.calculateFleschKincaid(avgWordsPerSentence, avgSyllablesPerWord);
    metrics.fleschKincaidScore = fleschScore;
    metrics.readabilityLevel = this.getReadabilityLevel(fleschScore);

    return { problems, metrics };
  }

  private analyzeSpecificClarity(text: string, classification: any): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise específica para editais
    if (classification.tipoDocumento === 'edital') {
      const editalClarityIssues = this.checkEditalClarity(text);
      problems.push(...editalClarityIssues);
    }

    // Análise específica para termos de referência
    if (classification.tipoDocumento === 'tr') {
      const trClarityIssues = this.checkTermoReferenciaClarity(text);
      problems.push(...trClarityIssues);
    }

    // Análise específica para contratos
    if (classification.tipoDocumento === 'minuta_contrato') {
      const contratoClarityIssues = this.checkContratoClarity(text);
      problems.push(...contratoClarityIssues);
    }

    return { problems, metrics };
  }

  private analyzeTerminologyConsistency(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Verificar consistência de termos técnicos
    const technicalTerms = [
      'licitação', 'edital', 'proposta', 'contrato', 'execução', 'vigência',
      'prazo', 'valor', 'especificação', 'quantitativo', 'qualitativo'
    ];

    const termVariations: Record<string, string[]> = {};
    let inconsistencyCount = 0;

    technicalTerms.forEach(term => {
      const variations = text.match(new RegExp(`\\b${term}s?\\b`, 'gi')) || [];
      if (variations.length > 1) {
        const uniqueVariations = [...new Set(variations.map(v => v.toLowerCase()))];
        if (uniqueVariations.length > 1) {
          termVariations[term] = uniqueVariations;
          inconsistencyCount++;
        }
      }
    });

    if (inconsistencyCount > 0) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: `${inconsistencyCount} termo(s) técnico(s) com variações inconsistentes`,
        gravidade: 'media',
        localizacao: 'Consistência terminológica',
        sugestaoCorrecao: 'Padronizar uso de termos técnicos em todo o documento',
        categoria: 'formal'
      });
    }

    metrics.terminologyInconsistencies = inconsistencyCount;
    metrics.termVariations = termVariations;

    return { problems, metrics };
  }

  private checkEditalClarity(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar clareza de critérios de habilitação
    if (text.includes('critério') && text.includes('habilitação')) {
      const hasClearCriteria = /\d+\.\s+[^.]*habilitação[^.]*\./i.test(text);
      if (!hasClearCriteria) {
        problems.push({
          tipo: 'especificacao_incompleta',
          descricao: 'Critérios de habilitação não estão claramente numerados',
          gravidade: 'alta',
          localizacao: 'Critérios de habilitação',
          sugestaoCorrecao: 'Numerar claramente cada critério de habilitação',
          categoria: 'formal'
        });
      }
    }

    // Verificar clareza de critérios de julgamento
    if (text.includes('critério') && text.includes('julgamento')) {
      const hasClearJudgmentCriteria = /\d+\.\s+[^.]*julgamento[^.]*\./i.test(text);
      if (!hasClearJudgmentCriteria) {
        problems.push({
          tipo: 'especificacao_incompleta',
          descricao: 'Critérios de julgamento não estão claramente numerados',
          gravidade: 'alta',
          localizacao: 'Critérios de julgamento',
          sugestaoCorrecao: 'Numerar claramente cada critério de julgamento',
          categoria: 'formal'
        });
      }
    }

    return problems;
  }

  private checkTermoReferenciaClarity(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar clareza de especificações técnicas
    if (text.includes('especificação') && text.includes('técnica')) {
      const hasNumberedSpecs = /\d+\.\s+[^.]*especificação[^.]*\./i.test(text);
      if (!hasNumberedSpecs) {
        problems.push({
          tipo: 'especificacao_incompleta',
          descricao: 'Especificações técnicas não estão claramente numeradas',
          gravidade: 'alta',
          localizacao: 'Especificações técnicas',
          sugestaoCorrecao: 'Numerar claramente cada especificação técnica',
          categoria: 'tecnico'
        });
      }
    }

    return problems;
  }

  private checkContratoClarity(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar clareza de cláusulas contratuais
    if (text.includes('cláusula')) {
      const hasNumberedClauses = /\d+\.\s+[^.]*cláusula[^.]*\./i.test(text);
      if (!hasNumberedClauses) {
        problems.push({
          tipo: 'inconsistencia',
          descricao: 'Cláusulas contratuais não estão claramente numeradas',
          gravidade: 'media',
          localizacao: 'Cláusulas contratuais',
          sugestaoCorrecao: 'Numerar claramente cada cláusula contratual',
          categoria: 'formal'
        });
      }
    }

    return problems;
  }

  private countSyllables(word: string): number {
    // Algoritmo simples para contar sílabas em português
    const vowels = 'aeiouàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ';
    let count = 0;
    let prevIsVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !prevIsVowel) {
        count++;
      }
      prevIsVowel = isVowel;
    }

    return Math.max(1, count);
  }

  private calculateFleschKincaid(avgWordsPerSentence: number, avgSyllablesPerWord: number): number {
    // Fórmula Flesch-Kincaid para português (adaptada)
    return 248.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  }

  private getReadabilityLevel(score: number): string {
    if (score >= 90) return 'Muito fácil';
    if (score >= 80) return 'Fácil';
    if (score >= 70) return 'Razoavelmente fácil';
    if (score >= 60) return 'Padrão';
    if (score >= 50) return 'Razoavelmente difícil';
    if (score >= 30) return 'Difícil';
    return 'Muito difícil';
  }

  private calculateClarityScore(problems: Problem[], metrics: Record<string, any>): number {
    let score = 100;
    
    // Reduzir score baseado nos problemas
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          score -= 25;
          break;
        case 'alta':
          score -= 20;
          break;
        case 'media':
          score -= 15;
          break;
        case 'baixa':
          score -= 10;
          break;
      }
    });

    // Ajustar score baseado nas métricas de legibilidade
    if (metrics.inconsistencies !== undefined) {
      score = Math.max(0, 100 - (metrics.inconsistencies * 5));
    }

    if (metrics.fleschKincaidScore && metrics.fleschKincaidScore < 60) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private calculateConfidence(problems: Problem[], metrics: Record<string, any>): number {
    let confidence = 80;
    
    // Aumentar confiança se há muitas métricas calculadas
    if (metrics.fleschKincaidScore !== undefined) {
      confidence += 10;
    }
    
    if (metrics.avgWordsPerSentence !== undefined) {
      confidence += 5;
    }
    
    // Diminuir confiança se há muitos problemas
    if (problems.length > 5) {
      confidence -= 15;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  protected getCacheKey(context: AnalysisContext): string {
    const { text, classification } = context;
    const textHash = this.hashText(text.substring(0, 1500)); // Primeiros 1500 caracteres para análise de clareza
    return `clarity_${classification.tipoDocumento}_${textHash}`;
  }

  protected validateInput(context: AnalysisContext): boolean {
    return context.text.length > 100 && 
           context.text.length < 1500000 && // Máximo 1.5MB para análise de clareza
           !!context.classification?.tipoDocumento;
  }

  protected createFallbackResult(context: AnalysisContext): AnalysisResult {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise de clareza básica devido a erro no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise de clareza',
        sugestaoCorrecao: 'Verificar configurações do analisador de clareza',
        categoria: 'formal'
      }],
      metrics: { 
        totalClauses: 0,
        validClauses: 0,
        missingClauses: 1,
        inconsistencies: 0,
        processingTime: 0
      },
      score: 70,
      confidence: 30,
      processingTime: 0
    };
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
}

interface AmbiguityPattern {
  pattern: RegExp;
  type: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  description: string;
  suggestion: string;
}

interface ReadabilityMetric {
  name: string;
  maxValue: number;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  description: string;
  suggestion: string;
}
