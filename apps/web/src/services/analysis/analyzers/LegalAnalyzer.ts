import { BaseAnalyzer, AnalysisContext, AnalysisResult, AnalyzerConfig } from './BaseAnalyzer';
import { Problem, DocumentClassification } from '@/types/document';

export class LegalAnalyzer extends BaseAnalyzer {
  private legalRules: Map<string, LegalRule[]> = new Map();
  private riskPatterns: RiskPattern[] = [];

  constructor() {
    super({
      name: 'LegalAnalyzer',
      version: '1.0.0',
      enabled: true,
      priority: 2,
      timeout: 15000,
      fallbackEnabled: true
    });

    this.initializeLegalRules();
    this.initializeRiskPatterns();
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const { text, classification } = context;
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise de conformidade legal
    const complianceAnalysis = this.analyzeLegalCompliance(text, classification);
    problems.push(...complianceAnalysis.problems);
    Object.assign(metrics, complianceAnalysis.metrics);

    // Análise de riscos legais
    const riskAnalysis = this.analyzeLegalRisks(text, classification);
    problems.push(...riskAnalysis.problems);
    Object.assign(metrics, riskAnalysis.metrics);

    // Análise de cláusulas obrigatórias
    const mandatoryClausesAnalysis = this.analyzeMandatoryClauses(text, classification);
    problems.push(...mandatoryClausesAnalysis.problems);
    Object.assign(metrics, mandatoryClausesAnalysis.metrics);

    // Análise de prazos e vencimentos
    const deadlineAnalysis = this.analyzeDeadlinesAndTerms(text, classification);
    problems.push(...deadlineAnalysis.problems);
    Object.assign(metrics, deadlineAnalysis.metrics);

    // Calcular score legal
    const score = this.calculateLegalScore(problems);
    const confidence = this.calculateConfidence(problems, metrics);

    return {
      problems,
      metrics,
      score,
      confidence,
      processingTime: 0
    };
  }

  private initializeLegalRules(): void {
    // Regras para editais
    this.legalRules.set('edital', [
      {
        id: 'lei_8666_art40',
        description: 'Objeto da licitação deve estar claramente definido',
        keywords: ['objeto', 'finalidade', 'escopo'],
        severity: 'alta',
        category: 'juridico',
        suggestion: 'Definir claramente o objeto conforme art. 40, I da Lei 8.666/93'
      },
      {
        id: 'lei_8666_art45',
        description: 'Critério de julgamento deve ser especificado',
        keywords: ['critério de julgamento', 'menor preço', 'melhor técnica'],
        severity: 'alta',
        category: 'juridico',
        suggestion: 'Especificar critério de julgamento conforme art. 45 da Lei 8.666/93'
      },
      {
        id: 'lei_8666_art37',
        description: 'Prazo para entrega de propostas deve ser adequado',
        keywords: ['prazo', 'entrega', 'proposta'],
        severity: 'media',
        category: 'juridico',
        suggestion: 'Estabelecer prazo adequado para entrega de propostas'
      }
    ]);

    // Regras para contratos
    this.legalRules.set('minuta_contrato', [
      {
        id: 'lei_8666_art55',
        description: 'Cláusula de vigência deve estar presente',
        keywords: ['vigência', 'duração', 'prazo de vigência'],
        severity: 'alta',
        category: 'juridico',
        suggestion: 'Incluir cláusula de vigência do contrato'
      },
      {
        id: 'lei_8666_art57',
        description: 'Cláusula de rescisão deve estar presente',
        keywords: ['rescisão', 'termino', 'extinção'],
        severity: 'alta',
        category: 'juridico',
        suggestion: 'Incluir cláusula de rescisão contratual'
      }
    ]);

    // Regras para termos de referência
    this.legalRules.set('tr', [
      {
        id: 'lei_8666_art7',
        description: 'Justificativa para contratação deve estar fundamentada',
        keywords: ['justificativa', 'fundamentação', 'motivo'],
        severity: 'media',
        category: 'juridico',
        suggestion: 'Fundamentar adequadamente a justificativa para contratação'
      }
    ]);
  }

  private initializeRiskPatterns(): void {
    this.riskPatterns = [
      {
        pattern: /prazo\s+(?:de\s+)?(?:entrega|execução|conclusão)\s*:\s*(\d+)\s*(?:dias?|meses?)/i,
        riskType: 'prazo_inadequado',
        severity: 'media',
        description: 'Prazo pode ser inadequado para execução',
        suggestion: 'Verificar adequação do prazo estabelecido'
      },
      {
        pattern: /valor\s+(?:estimado|máximo|limite)\s*:\s*R?\$?\s*([\d.,]+)/i,
        riskType: 'valor_inadequado',
        severity: 'baixa',
        description: 'Valor pode estar inadequado',
        suggestion: 'Verificar adequação do valor estabelecido'
      },
      {
        pattern: /(?:dispensa|inexigibilidade)\s+(?:de\s+)?licitação/i,
        riskType: 'dispensa_licitacao',
        severity: 'alta',
        description: 'Dispensa de licitação requer justificativa robusta',
        suggestion: 'Verificar se justificativa atende requisitos legais'
      },
      {
        pattern: /(?:penalidade|multa)\s+(?:por\s+)?(?:atraso|descumprimento)/i,
        riskType: 'penalidades',
        severity: 'media',
        description: 'Penalidades devem estar adequadamente definidas',
        suggestion: 'Verificar adequação das penalidades estabelecidas'
      }
    ];
  }

  private analyzeLegalCompliance(text: string, classification: DocumentClassification): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    const rules = this.legalRules.get(classification.tipoDocumento) || [];
    let complianceScore = 100;

    rules.forEach(rule => {
      const hasKeywords = rule.keywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasKeywords) {
        problems.push({
          tipo: 'clausula_faltante',
          descricao: rule.description,
          gravidade: rule.severity,
          localizacao: 'Conformidade legal',
          sugestaoCorrecao: rule.suggestion,
          categoria: rule.category
        });

        // Reduzir score de conformidade
        switch (rule.severity) {
          case 'alta':
            complianceScore -= 25;
            break;
          case 'media':
            complianceScore -= 15;
            break;
          case 'baixa':
            complianceScore -= 10;
            break;
        }
      }
    });

    metrics.legalComplianceScore = Math.max(0, complianceScore);
    metrics.rulesChecked = rules.length;
    metrics.rulesFailed = problems.length;

    return { problems, metrics };
  }

  private analyzeLegalRisks(text: string, classification: DocumentClassification): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    let riskScore = 0;
    const foundRisks: string[] = [];

    this.riskPatterns.forEach(pattern => {
      const matches = text.match(pattern.pattern);
      if (matches) {
        foundRisks.push(pattern.riskType);
        
        problems.push({
          tipo: pattern.riskType as any,
          descricao: pattern.description,
          gravidade: pattern.severity,
          localizacao: 'Análise de riscos',
          sugestaoCorrecao: pattern.suggestion,
          categoria: 'juridico'
        });

        // Aumentar score de risco
        switch (pattern.severity) {
          case 'alta':
            riskScore += 30;
            break;
          case 'media':
            riskScore += 20;
            break;
          case 'baixa':
            riskScore += 10;
            break;
        }
      }
    });

    metrics.riskScore = Math.min(100, riskScore);
    metrics.risksFound = foundRisks;
    metrics.totalRiskPatterns = this.riskPatterns.length;

    return { problems, metrics };
  }

  private analyzeMandatoryClauses(text: string, classification: DocumentClassification): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    const mandatoryClauses = this.getMandatoryClauses(classification);
    const foundClauses: string[] = [];
    const missingClauses: string[] = [];

    mandatoryClauses.forEach(clause => {
      if (text.toLowerCase().includes(clause.keyword.toLowerCase())) {
        foundClauses.push(clause.name);
      } else {
        missingClauses.push(clause.name);
        problems.push({
          tipo: 'clausula_faltante',
          descricao: `Cláusula obrigatória ausente: ${clause.name}`,
          gravidade: clause.severity,
          localizacao: 'Cláusulas obrigatórias',
          sugestaoCorrecao: clause.suggestion,
          categoria: 'juridico'
        });
      }
    });

    metrics.mandatoryClausesFound = foundClauses.length;
    metrics.mandatoryClausesMissing = missingClauses.length;
    metrics.mandatoryClausesTotal = mandatoryClauses.length;

    return { problems, metrics };
  }

  private analyzeDeadlinesAndTerms(text: string, classification: DocumentClassification): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Extrair prazos do texto
    const deadlinePatterns = [
      /prazo\s+(?:de\s+)?(?:entrega|execução|conclusão)\s*:\s*(\d+)\s*(dias?|meses?|anos?)/gi,
      /vigência\s*:\s*(\d+)\s*(dias?|meses?|anos?)/gi,
      /duração\s*:\s*(\d+)\s*(dias?|meses?|anos?)/gi
    ];

    const deadlines: Array<{ value: number; unit: string; context: string }> = [];

    deadlinePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const value = parseInt(match[1]);
        const unit = match[2];
        const context = match[0];
        
        deadlines.push({ value, unit, context });
      }
    });

    // Analisar adequação dos prazos
    deadlines.forEach(deadline => {
      const isAdequate = this.isDeadlineAdequate(deadline, classification);
      
      if (!isAdequate) {
        problems.push({
          tipo: 'prazo_inadequado',
          descricao: `Prazo pode ser inadequado: ${deadline.value} ${deadline.unit}`,
          gravidade: 'media',
          localizacao: deadline.context,
          sugestaoCorrecao: 'Verificar adequação do prazo estabelecido',
          categoria: 'juridico'
        });
      }
    });

    metrics.deadlinesFound = deadlines.length;
    metrics.inadequateDeadlines = problems.filter(p => p.tipo === 'prazo_inadequado').length;

    return { problems, metrics };
  }

  private getMandatoryClauses(classification: DocumentClassification): Array<{ name: string; keyword: string; severity: 'baixa' | 'media' | 'alta' | 'critica'; suggestion: string }> {
    const clauses = [];

    if (classification.tipoDocumento === 'edital') {
      clauses.push(
        { name: 'Objeto da licitação', keyword: 'objeto', severity: 'alta', suggestion: 'Definir claramente o objeto da licitação' },
        { name: 'Critério de julgamento', keyword: 'critério de julgamento', severity: 'alta', suggestion: 'Especificar critério de julgamento' },
        { name: 'Prazo para entrega', keyword: 'prazo para entrega', severity: 'media', suggestion: 'Estabelecer prazo adequado' },
        { name: 'Local de entrega', keyword: 'local de entrega', severity: 'media', suggestion: 'Especificar local de entrega' }
      );
    }

    if (classification.tipoDocumento === 'minuta_contrato') {
      clauses.push(
        { name: 'Objeto do contrato', keyword: 'objeto do contrato', severity: 'alta', suggestion: 'Definir objeto do contrato' },
        { name: 'Vigência', keyword: 'vigência', severity: 'alta', suggestion: 'Estabelecer vigência do contrato' },
        { name: 'Valor', keyword: 'valor', severity: 'alta', suggestion: 'Definir valor contratual' },
        { name: 'Forma de pagamento', keyword: 'forma de pagamento', severity: 'media', suggestion: 'Especificar forma de pagamento' }
      );
    }

    if (classification.tipoDocumento === 'tr') {
      clauses.push(
        { name: 'Especificações técnicas', keyword: 'especificações técnicas', severity: 'alta', suggestion: 'Detalhar especificações técnicas' },
        { name: 'Quantitativos', keyword: 'quantitativos', severity: 'media', suggestion: 'Especificar quantitativos' },
        { name: 'Justificativa', keyword: 'justificativa', severity: 'media', suggestion: 'Fundamentar justificativa' }
      );
    }

    return clauses;
  }

  private isDeadlineAdequate(deadline: { value: number; unit: string }, classification: DocumentClassification): boolean {
    // Lógica básica para verificar adequação de prazos
    // Em produção, isso seria mais sofisticado
    
    if (deadline.unit.includes('dia')) {
      if (deadline.value < 1) return false;
      if (deadline.value > 365) return false;
    }
    
    if (deadline.unit.includes('mes')) {
      if (deadline.value < 1) return false;
      if (deadline.value > 60) return false;
    }
    
    if (deadline.unit.includes('ano')) {
      if (deadline.value < 1) return false;
      if (deadline.value > 10) return false;
    }

    return true;
  }

  private calculateLegalScore(problems: Problem[]): number {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          score -= 30;
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

    return Math.max(0, score);
  }

  private calculateConfidence(problems: Problem[], metrics: Record<string, any>): number {
    let confidence = 85; // Base alta para análises legais
    
    // Aumentar confiança se muitas regras foram verificadas
    if (metrics.rulesChecked && metrics.rulesChecked > 5) {
      confidence += 10;
    }
    
    // Diminuir confiança se há muitos problemas
    if (problems.length > 3) {
      confidence -= 15;
    }
    
    // Aumentar confiança se score de conformidade é alto
    if (metrics.legalComplianceScore && metrics.legalComplianceScore > 80) {
      confidence += 5;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  protected getCacheKey(context: AnalysisContext): string {
    const { text, classification } = context;
    const textHash = this.hashText(text.substring(0, 2000)); // Primeiros 2000 caracteres para análise legal
    return `legal_${classification.tipoDocumento}_${classification.modalidadePrincipal}_${textHash}`;
  }

  protected validateInput(context: AnalysisContext): boolean {
    return context.text.length > 200 && 
           context.text.length < 2000000 && // Máximo 2MB para análise legal
           !!context.classification?.tipoDocumento &&
           !!context.classification?.modalidadePrincipal;
  }

  protected createFallbackResult(context: AnalysisContext): AnalysisResult {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise legal básica devido a erro no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise legal',
        sugestaoCorrecao: 'Verificar configurações do analisador legal',
        categoria: 'juridico'
      }],
      metrics: { 
        totalClauses: 0,
        validClauses: 0,
        missingClauses: 1,
        inconsistencies: 0,
        processingTime: 100
      },
      score: 60,
      confidence: 25,
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

interface LegalRule {
  id: string;
  description: string;
  keywords: string[];
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'juridico' | 'tecnico' | 'orcamentario' | 'formal';
  suggestion: string;
}

interface RiskPattern {
  pattern: RegExp;
  riskType: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  description: string;
  suggestion: string;
}
