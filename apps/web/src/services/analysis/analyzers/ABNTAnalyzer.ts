import { BaseAnalyzer, AnalysisContext, AnalysisResult, AnalyzerConfig } from './BaseAnalyzer';
import { Problem } from '@/types/document';

export class ABNTAnalyzer extends BaseAnalyzer {
  private abntRules: Map<string, ABNTRule[]> = new Map();
  private formattingPatterns: FormattingPattern[] = [];

  constructor() {
    super({
      name: 'ABNTAnalyzer',
      version: '1.0.0',
      enabled: true,
      priority: 4,
      timeout: 10000,
      fallbackEnabled: true
    });

    this.initializeABNTRules();
    this.initializeFormattingPatterns();
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const { text, classification } = context;
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise de formatação ABNT
    const formattingAnalysis = this.analyzeABNTFormatting(text);
    problems.push(...formattingAnalysis.problems);
    Object.assign(metrics, formattingAnalysis.metrics);

    // Análise de estrutura ABNT
    const structureAnalysis = this.analyzeABNTStructure(text);
    problems.push(...structureAnalysis.problems);
    Object.assign(metrics, structureAnalysis.metrics);

    // Análise de referências bibliográficas
    const referencesAnalysis = this.analyzeReferences(text);
    problems.push(...referencesAnalysis.problems);
    Object.assign(metrics, referencesAnalysis.metrics);

    // Análise de numeração e paginação
    const numberingAnalysis = this.analyzeNumberingAndPagination(text);
    problems.push(...numberingAnalysis.problems);
    Object.assign(metrics, numberingAnalysis.metrics);

    // Calcular score ABNT
    const score = this.calculateABNTScore(problems, metrics);
    const confidence = this.calculateConfidence(problems, metrics);

    return {
      problems,
      metrics,
      score,
      confidence,
      processingTime: 0
    };
  }

  private initializeABNTRules(): void {
    // Regras ABNT para documentos técnicos
    this.abntRules.set('tr', [
      {
        id: 'abnt_nbr_6023',
        description: 'Referências bibliográficas devem seguir NBR 6023',
        keywords: ['referência', 'bibliografia', 'citação'],
        severity: 'alta',
        category: 'tecnico',
        suggestion: 'Formatar referências conforme NBR 6023'
      },
      {
        id: 'abnt_nbr_6024',
        description: 'Numeração de seções deve seguir NBR 6024',
        keywords: ['seção', 'capítulo', 'numeração'],
        severity: 'media',
        category: 'tecnico',
        suggestion: 'Numerar seções conforme NBR 6024'
      }
    ]);

    // Regras ABNT para projetos básicos
    this.abntRules.set('projeto_basico', [
      {
        id: 'abnt_nbr_10007',
        description: 'Projeto básico deve seguir NBR 10007',
        keywords: ['projeto básico', 'memorial descritivo', 'planilha orçamentária'],
        severity: 'alta',
        category: 'tecnico',
        suggestion: 'Estruturar projeto conforme NBR 10007'
      }
    ]);

    // Regras ABNT para editais
    this.abntRules.set('edital', [
      {
        id: 'abnt_nbr_6028',
        description: 'Resumos devem seguir NBR 6028',
        keywords: ['resumo', 'abstract'],
        severity: 'media',
        category: 'tecnico',
        suggestion: 'Formatar resumo conforme NBR 6028'
      }
    ]);
  }

  private initializeFormattingPatterns(): void {
    this.formattingPatterns = [
      {
        pattern: /^\s*\d+\.\s+[A-Z][^.]*\./gm,
        type: 'numeracao_secoes',
        severity: 'media',
        description: 'Seções devem ser numeradas sequencialmente',
        suggestion: 'Verificar numeração sequencial das seções'
      },
      {
        pattern: /^\s*[A-Z][a-z]+\s*:\s*[^.]*\./gm,
        type: 'titulos_secoes',
        severity: 'baixa',
        description: 'Títulos de seções devem estar em negrito',
        suggestion: 'Destacar títulos de seções em negrito'
      },
      {
        pattern: /^\s*\d+\.\s*\d+\s+[^.]*\./gm,
        type: 'subsecoes',
        severity: 'baixa',
        description: 'Subseções devem ser numeradas adequadamente',
        suggestion: 'Verificar numeração hierárquica das subseções'
      }
    ];
  }

  private analyzeABNTFormatting(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    let formattingScore = 100;
    const formattingIssues: string[] = [];

    // Verificar margens e espaçamento
    const marginIssues = this.checkMarginsAndSpacing(text);
    problems.push(...marginIssues);
    formattingIssues.push(...marginIssues.map(p => p.descricao));

    // Verificar fontes e tamanhos
    const fontIssues = this.checkFontsAndSizes(text);
    problems.push(...fontIssues);
    formattingIssues.push(...fontIssues.map(p => p.descricao));

    // Verificar alinhamento de texto
    const alignmentIssues = this.checkTextAlignment(text);
    problems.push(...alignmentIssues);
    formattingIssues.push(...alignmentIssues.map(p => p.descricao));

    // Calcular score de formatação
    formattingScore -= problems.length * 10;
    metrics.formattingScore = Math.max(0, formattingScore);
    metrics.formattingIssues = formattingIssues;
    metrics.totalFormattingIssues = problems.length;

    return { problems, metrics };
  }

  private analyzeABNTStructure(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Verificar elementos pré-textuais
    const preTextualIssues = this.checkPreTextualElements(text);
    problems.push(...preTextualIssues);

    // Verificar elementos textuais
    const textualIssues = this.checkTextualElements(text);
    problems.push(...textualIssues);

    // Verificar elementos pós-textuais
    const postTextualIssues = this.checkPostTextualElements(text);
    problems.push(...postTextualIssues);

    // Verificar estrutura hierárquica
    const hierarchyIssues = this.checkHierarchicalStructure(text);
    problems.push(...hierarchyIssues);

    metrics.structureIssues = problems.length;
    metrics.preTextualElements = this.countPreTextualElements(text);
    metrics.textualElements = this.countTextualElements(text);
    metrics.postTextualElements = this.countPostTextualElements(text);

    return { problems, metrics };
  }

  private analyzeReferences(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Verificar citações no texto
    const citationIssues = this.checkCitations(text);
    problems.push(...citationIssues);

    // Verificar lista de referências
    const referenceListIssues = this.checkReferenceList(text);
    problems.push(...referenceListIssues);

    // Verificar formatação de referências
    const referenceFormatIssues = this.checkReferenceFormatting(text);
    problems.push(...referenceFormatIssues);

    metrics.citationIssues = citationIssues.length;
    metrics.referenceIssues = referenceListIssues.length + referenceFormatIssues.length;
    metrics.totalReferences = this.countReferences(text);

    return { problems, metrics };
  }

  private analyzeNumberingAndPagination(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Verificar numeração de páginas
    const paginationIssues = this.checkPagination(text);
    problems.push(...paginationIssues);

    // Verificar numeração de figuras e tabelas
    const figureTableIssues = this.checkFigureTableNumbering(text);
    problems.push(...figureTableIssues);

    // Verificar numeração de equações
    const equationIssues = this.checkEquationNumbering(text);
    problems.push(...equationIssues);

    metrics.paginationIssues = paginationIssues.length;
    metrics.figureTableIssues = figureTableIssues.length;
    metrics.equationIssues = equationIssues.length;

    return { problems, metrics };
  }

  private checkMarginsAndSpacing(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar espaçamento entre parágrafos
    const paragraphs = text.split(/\n\s*\n/);
    const spacingIssues = paragraphs.filter(p => p.trim().length > 0).length;

    if (spacingIssues > 0 && spacingIssues < paragraphs.length * 0.8) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Espaçamento entre parágrafos inconsistente',
        gravidade: 'baixa',
        localizacao: 'Formatação de parágrafos',
        sugestaoCorrecao: 'Manter espaçamento consistente entre parágrafos',
        categoria: 'formal'
      });
    }

    return problems;
  }

  private checkFontsAndSizes(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar uso de maiúsculas excessivo
    const upperCaseWords = text.match(/\b[A-Z]{3,}\b/g);
    if (upperCaseWords && upperCaseWords.length > 15) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Uso excessivo de palavras em maiúsculas',
        gravidade: 'baixa',
        localizacao: 'Formatação de texto',
        sugestaoCorrecao: 'Usar maiúsculas apenas para títulos e nomes próprios',
        categoria: 'formal'
      });
    }

    return problems;
  }

  private checkTextAlignment(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar alinhamento de listas
    const listItems = text.match(/^[-*•]\s+.+$/gm);
    if (listItems) {
      const misalignedItems = listItems.filter(item => !item.startsWith('- ') && !item.startsWith('* ') && !item.startsWith('• '));
      
      if (misalignedItems.length > 0) {
        problems.push({
          tipo: 'inconsistencia',
          descricao: 'Alinhamento inconsistente em listas',
          gravidade: 'baixa',
          localizacao: 'Formatação de listas',
          sugestaoCorrecao: 'Alinhar itens de lista consistentemente',
          categoria: 'formal'
        });
      }
    }

    return problems;
  }

  private checkPreTextualElements(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar elementos pré-textuais básicos
    const preTextualElements = ['capa', 'folha de rosto', 'sumário', 'resumo'];
    const missingElements = preTextualElements.filter(element => 
      !text.toLowerCase().includes(element)
    );

    if (missingElements.length > 0) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: `Elementos pré-textuais ausentes: ${missingElements.join(', ')}`,
        gravidade: 'media',
        localizacao: 'Estrutura do documento',
        sugestaoCorrecao: 'Incluir elementos pré-textuais obrigatórios',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkTextualElements(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar introdução
    if (!text.toLowerCase().includes('introdução') && !text.toLowerCase().includes('1. introdução')) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: 'Seção de introdução não encontrada',
        gravidade: 'media',
        localizacao: 'Estrutura textual',
        sugestaoCorrecao: 'Incluir seção de introdução',
        categoria: 'tecnico'
      });
    }

    // Verificar desenvolvimento
    if (!text.toLowerCase().includes('desenvolvimento') && !text.toLowerCase().includes('fundamentação')) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: 'Seção de desenvolvimento não encontrada',
        gravidade: 'alta',
        localizacao: 'Estrutura textual',
        sugestaoCorrecao: 'Incluir seção de desenvolvimento ou fundamentação',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkPostTextualElements(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar elementos pós-textuais básicos
    const postTextualElements = ['conclusão', 'referências', 'apêndice', 'anexo'];
    const missingElements = postTextualElements.filter(element => 
      !text.toLowerCase().includes(element)
    );

    if (missingElements.length > 2) { // Pelo menos 2 elementos devem estar presentes
      problems.push({
        tipo: 'clausula_faltante',
        descricao: `Elementos pós-textuais insuficientes: ${missingElements.join(', ')}`,
        gravidade: 'media',
        localizacao: 'Estrutura do documento',
        sugestaoCorrecao: 'Incluir mais elementos pós-textuais',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkHierarchicalStructure(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar hierarquia de seções
    const sectionPatterns = [
      /^(?:CAPÍTULO|CAPITULO)\s*(\d+)/gmi,
      /^(?:SEÇÃO|SECAO)\s*(\d+)/gmi,
      /^(\d+\.)\s+/gm,
      /^(\d+\.\d+)\s+/gm
    ];

    const sections: Array<{ level: number; number: string; line: string }> = [];

    sectionPatterns.forEach((pattern, index) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        sections.push({
          level: index,
          number: match[1] || match[0],
          line: match[0]
        });
      }
    });

    // Verificar sequência lógica
    for (let i = 1; i < sections.length; i++) {
      const prev = sections[i - 1];
      const curr = sections[i];
      
      if (curr.level < prev.level && curr.level !== 0) {
        problems.push({
          tipo: 'inconsistencia',
          descricao: `Quebra na hierarquia de seções: ${prev.line} → ${curr.line}`,
          gravidade: 'media',
          localizacao: 'Estrutura hierárquica',
          sugestaoCorrecao: 'Manter sequência lógica na hierarquia de seções',
          categoria: 'tecnico'
        });
      }
    }

    return problems;
  }

  private checkCitations(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar citações diretas
    const directCitations = text.match(/"[^"]{20,}"/g);
    if (directCitations) {
      directCitations.forEach(citation => {
        if (citation.length > 100) {
          problems.push({
            tipo: 'inconsistencia',
            descricao: 'Citação direta muito longa',
            gravidade: 'baixa',
            localizacao: 'Citações',
            sugestaoCorrecao: 'Considerar resumir citações longas',
            categoria: 'tecnico'
          });
        }
      });
    }

    // Verificar citações indiretas
    const indirectCitations = text.match(/\b(?:segundo|conforme|de acordo com|conforme)\b/gi);
    if (indirectCitations && indirectCitations.length > 10) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Muitas citações indiretas podem indicar falta de originalidade',
        gravidade: 'baixa',
        localizacao: 'Citações',
        sugestaoCorrecao: 'Balancear citações com análise própria',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkReferenceList(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar se há lista de referências
    if (!text.toLowerCase().includes('referências') && !text.toLowerCase().includes('bibliografia')) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: 'Lista de referências não encontrada',
        gravidade: 'alta',
        localizacao: 'Referências',
        sugestaoCorrecao: 'Incluir lista de referências bibliográficas',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkReferenceFormatting(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar formatação básica de referências
    const referencePatterns = [
      /^[A-Z][a-z]+,\s*[A-Z]\.\s*[^.]*\./gm,
      /^[A-Z][a-z]+\s*\([0-9]{4}\)/gm
    ];

    const hasFormattedReferences = referencePatterns.some(pattern => 
      text.match(pattern)
    );

    if (!hasFormattedReferences) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Referências não estão formatadas conforme ABNT',
        gravidade: 'media',
        localizacao: 'Formatação de referências',
        sugestaoCorrecao: 'Formatar referências conforme NBR 6023',
        categoria: 'tecnico'
      });
    }

    return problems;
  }

  private checkPagination(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar numeração de páginas
    const pageNumbers = text.match(/\b(?:página|pág|pg)\s*\d+\b/gi);
    if (pageNumbers) {
      const numbers = pageNumbers.map(p => {
        const match = p.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });

      // Verificar sequência
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] <= numbers[i - 1]) {
          problems.push({
            tipo: 'inconsistencia',
            descricao: 'Numeração de páginas não sequencial',
            gravidade: 'baixa',
            localizacao: 'Numeração de páginas',
            sugestaoCorrecao: 'Verificar sequência de numeração de páginas',
            categoria: 'tecnico'
          });
          break;
        }
      }
    }

    return problems;
  }

  private checkFigureTableNumbering(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar numeração de figuras
    const figures = text.match(/\b(?:figura|fig)\s*\d+/gi);
    if (figures) {
      const figureNumbers = figures.map(f => {
        const match = f.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });

      // Verificar sequência
      for (let i = 1; i < figureNumbers.length; i++) {
        if (figureNumbers[i] !== figureNumbers[i - 1] + 1) {
          problems.push({
            tipo: 'inconsistencia',
            descricao: 'Numeração de figuras não sequencial',
            gravidade: 'baixa',
            localizacao: 'Numeração de figuras',
            sugestaoCorrecao: 'Verificar sequência de numeração de figuras',
            categoria: 'tecnico'
          });
          break;
        }
      }
    }

    return problems;
  }

  private checkEquationNumbering(text: string): Problem[] {
    const problems: Problem[] = [];

    // Verificar numeração de equações
    const equations = text.match(/\b(?:equação|eq)\s*\d+/gi);
    if (equations) {
      const equationNumbers = equations.map(e => {
        const match = e.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      });

      // Verificar sequência
      for (let i = 1; i < equationNumbers.length; i++) {
        if (equationNumbers[i] !== equationNumbers[i - 1] + 1) {
          problems.push({
            tipo: 'inconsistencia',
            descricao: 'Numeração de equações não sequencial',
            gravidade: 'baixa',
            localizacao: 'Numeração de equações',
            sugestaoCorrecao: 'Verificar sequência de numeração de equações',
            categoria: 'tecnico'
          });
          break;
        }
      }
    }

    return problems;
  }

  private countPreTextualElements(text: string): number {
    const elements = ['capa', 'folha de rosto', 'sumário', 'resumo', 'abstract'];
    return elements.filter(element => text.toLowerCase().includes(element)).length;
  }

  private countTextualElements(text: string): number {
    const elements = ['introdução', 'desenvolvimento', 'fundamentação', 'conclusão'];
    return elements.filter(element => text.toLowerCase().includes(element)).length;
  }

  private countPostTextualElements(text: string): number {
    const elements = ['conclusão', 'referências', 'bibliografia', 'apêndice', 'anexo'];
    return elements.filter(element => text.toLowerCase().includes(element)).length;
  }

  private countReferences(text: string): number {
    const referencePatterns = [
      /^[A-Z][a-z]+,\s*[A-Z]\.\s*[^.]*\./gm,
      /^[A-Z][a-z]+\s*\([0-9]{4}\)/gm
    ];

    let count = 0;
    referencePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) count += matches.length;
    });

    return count;
  }

  private calculateABNTScore(problems: Problem[], metrics: Record<string, any>): number {
    let score = 100;
    
    // Reduzir score baseado nos problemas
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          score -= 30;
          break;
        case 'alta':
          score -= 25;
          break;
        case 'media':
          score -= 20;
          break;
        case 'baixa':
          score -= 15;
          break;
      }
    });

    // Ajustar score baseado nas métricas
    if (metrics.formattingScore) {
      score = Math.min(score, metrics.formattingScore);
    }

    return Math.max(0, score);
  }

  private calculateConfidence(problems: Problem[], metrics: Record<string, any>): number {
    let confidence = 75; // Base média para análises ABNT
    
    // Aumentar confiança se há muitas métricas calculadas
    if (metrics.totalReferences && metrics.totalReferences > 5) {
      confidence += 10;
    }
    
    if (metrics.preTextualElements && metrics.preTextualElements > 2) {
      confidence += 5;
    }
    
    // Diminuir confiança se há muitos problemas
    if (problems.length > 5) {
      confidence -= 20;
    }

    return Math.min(100, Math.max(0, confidence));
  }

  protected getCacheKey(context: AnalysisContext): string {
    const { text, classification } = context;
    const textHash = this.hashText(text.substring(0, 1000)); // Primeiros 1000 caracteres para análise ABNT
    return `abnt_${classification.tipoDocumento}_${textHash}`;
  }

  protected validateInput(context: AnalysisContext): boolean {
    return context.text.length > 200 && 
           context.text.length < 1000000 && // Máximo 1MB para análise ABNT
           !!context.classification?.tipoDocumento;
  }

  protected createFallbackResult(context: AnalysisContext): AnalysisResult {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise ABNT básica devido a erro no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise ABNT',
        sugestaoCorrecao: 'Verificar configurações do analisador ABNT',
        categoria: 'tecnico'
      }],
      metrics: { 
        totalClauses: 0,
        validClauses: 0,
        missingClauses: 0,
        inconsistencies: 1,
        processingTime: 0
      },
      score: 65,
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

interface ABNTRule {
  id: string;
  description: string;
  keywords: string[];
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  category: 'juridico' | 'tecnico' | 'orcamentario' | 'formal';
  suggestion: string;
}

interface FormattingPattern {
  pattern: RegExp;
  type: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  description: string;
  suggestion: string;
}
