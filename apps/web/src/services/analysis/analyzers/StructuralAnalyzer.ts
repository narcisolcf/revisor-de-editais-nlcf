import { BaseAnalyzer, AnalysisContext, AnalysisResult, AnalyzerConfig } from './BaseAnalyzer';
import { Problem } from '@/types/document';

export class StructuralAnalyzer extends BaseAnalyzer {
  constructor() {
    super({
      name: 'StructuralAnalyzer',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 10000,
      fallbackEnabled: true
    });
  }

  async analyze(context: AnalysisContext): Promise<AnalysisResult> {
    const { text, classification } = context;
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise de estrutura básica
    const structureAnalysis = this.analyzeDocumentStructure(text);
    problems.push(...structureAnalysis.problems);
    Object.assign(metrics, structureAnalysis.metrics);

    // Análise de formatação
    const formattingAnalysis = this.analyzeFormatting(text);
    problems.push(...formattingAnalysis.problems);
    Object.assign(metrics, formattingAnalysis.metrics);

    // Análise específica por tipo de documento
    const specificAnalysis = this.analyzeSpecificStructure(text, classification);
    problems.push(...specificAnalysis.problems);
    Object.assign(metrics, specificAnalysis.metrics);

    // Calcular score baseado nos problemas encontrados
    const score = this.calculateStructuralScore(problems);
    const confidence = this.calculateConfidence(problems, metrics);

    return {
      problems,
      metrics,
      score,
      confidence,
      processingTime: 0 // Será definido pelo método base
    };
  }

  private analyzeDocumentStructure(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Contar seções principais
    const sections = this.extractSections(text);
    metrics.totalSections = sections.length;
    metrics.sectionNames = sections.map(s => s.name);

    // Verificar seções obrigatórias
    const requiredSections = ['objeto', 'prazo', 'critério', 'especificação'];
    const missingSections = requiredSections.filter(req => 
      !sections.some(s => s.name.toLowerCase().includes(req))
    );

    if (missingSections.length > 0) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: `Seções obrigatórias ausentes: ${missingSections.join(', ')}`,
        gravidade: 'alta',
        localizacao: 'Estrutura do documento',
        sugestaoCorrecao: `Incluir seções: ${missingSections.join(', ')}`,
        categoria: 'formal'
      });
    }

    // Verificar hierarquia de seções
    const hierarchyIssues = this.checkSectionHierarchy(sections);
    problems.push(...hierarchyIssues);

    // Verificar tamanho das seções
    const sizeIssues = this.checkSectionSizes(sections);
    problems.push(...sizeIssues);

    return { problems, metrics };
  }

  private analyzeFormatting(text: string): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Verificar formatação de listas
    const listIssues = this.checkListFormatting(text);
    problems.push(...listIssues);

    // Verificar numeração de itens
    const numberingIssues = this.checkItemNumbering(text);
    problems.push(...numberingIssues);

    // Verificar espaçamento e parágrafos
    const spacingIssues = this.checkSpacingAndParagraphs(text);
    problems.push(...spacingIssues);

    // Verificar uso de negrito e itálico
    const emphasisIssues = this.checkTextEmphasis(text);
    problems.push(...emphasisIssues);

    metrics.formattingIssues = problems.length;

    return { problems, metrics };
  }

  private analyzeSpecificStructure(text: string, classification: any): { problems: Problem[]; metrics: Record<string, any> } {
    const problems: Problem[] = [];
    const metrics: Record<string, any> = {};

    // Análise específica para editais
    if (classification.tipoDocumento === 'edital') {
      const editalIssues = this.checkEditalStructure(text);
      problems.push(...editalIssues);
    }

    // Análise específica para termos de referência
    if (classification.tipoDocumento === 'tr') {
      const trIssues = this.checkTermoReferenciaStructure(text);
      problems.push(...trIssues);
    }

    // Análise específica para minutas de contrato
    if (classification.tipoDocumento === 'minuta_contrato') {
      const contratoIssues = this.checkContratoStructure(text);
      problems.push(...contratoIssues);
    }

    return { problems, metrics };
  }

  private extractSections(text: string): Array<{ name: string; content: string; level: number }> {
    const sections: Array<{ name: string; content: string; level: number }> = [];
    
    // Padrões comuns de seções
    const sectionPatterns = [
      /^(?:CAPÍTULO|CAPITULO)\s*(\d+)[:\s]+(.+)$/gmi,
      /^(?:SEÇÃO|SECAO)\s*(\d+)[:\s]+(.+)$/gmi,
      /^(\d+\.)\s*(.+)$/gm,
      /^([A-Z][A-Z\s]+):/gm
    ];

    const lines = text.split('\n');
    let currentSection: { name: string; content: string; level: number } | null = null;

    for (const line of lines) {
      let matched = false;
      
      for (const pattern of sectionPatterns) {
        const match = pattern.exec(line);
        if (match) {
          if (currentSection) {
            sections.push(currentSection);
          }
          
          const level = this.determineSectionLevel(line);
          currentSection = {
            name: match[2] || match[1] || line.trim(),
            content: line,
            level
          };
          matched = true;
          break;
        }
      }

      if (!matched && currentSection) {
        currentSection.content += '\n' + line;
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private determineSectionLevel(line: string): number {
    if (line.match(/^(?:CAPÍTULO|CAPITULO)/)) return 1;
    if (line.match(/^(?:SEÇÃO|SECAO)/)) return 2;
    if (line.match(/^\d+\./)) return 3;
    if (line.match(/^[A-Z][A-Z\s]+:/)) return 4;
    return 5;
  }

  private checkSectionHierarchy(sections: Array<{ name: string; content: string; level: number }>): Problem[] {
    const problems: Problem[] = [];
    
    for (let i = 1; i < sections.length; i++) {
      const prevLevel = sections[i - 1].level;
      const currLevel = sections[i].level;
      
      // Verificar se há saltos muito grandes no nível
      if (currLevel - prevLevel > 2) {
        problems.push({
          tipo: 'inconsistencia',
          descricao: `Quebra na hierarquia de seções: ${sections[i - 1].name} → ${sections[i].name}`,
          gravidade: 'media',
          localizacao: 'Estrutura hierárquica',
          sugestaoCorrecao: 'Reorganizar seções para manter hierarquia lógica',
          categoria: 'formal'
        });
      }
    }

    return problems;
  }

  private checkSectionSizes(sections: Array<{ name: string; content: string; level: number }>): Problem[] {
    const problems: Problem[] = [];
    
    sections.forEach(section => {
      const contentLength = section.content.length;
      
      if (contentLength < 50) {
        problems.push({
          tipo: 'especificacao_incompleta',
          descricao: `Seção "${section.name}" muito pequena (${contentLength} caracteres)`,
          gravidade: 'media',
          localizacao: section.name,
          sugestaoCorrecao: 'Expandir conteúdo da seção com mais detalhes',
          categoria: 'formal'
        });
      }
    });

    return problems;
  }

  private checkListFormatting(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar listas não numeradas
    const unnumberedLists = text.match(/^[-*•]\s+.+$/gm);
    if (unnumberedLists && unnumberedLists.length > 5) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Muitas listas não numeradas podem dificultar referências',
        gravidade: 'baixa',
        localizacao: 'Formatação de listas',
        sugestaoCorrecao: 'Considerar numeração para listas longas',
        categoria: 'formal'
      });
    }

    return problems;
  }

  private checkItemNumbering(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar sequência de numeração
    const numberedItems = text.match(/^\d+\.\s+.+$/gm);
    if (numberedItems) {
      const numbers = numberedItems.map(item => {
        const match = item.match(/^(\d+)\./);
        return match ? parseInt(match[1]) : 0;
      });

      // Verificar se há números faltando
      for (let i = 1; i <= Math.max(...numbers); i++) {
        if (!numbers.includes(i)) {
          problems.push({
            tipo: 'inconsistencia',
            descricao: `Item ${i} está faltando na numeração`,
            gravidade: 'media',
            localizacao: 'Numeração de itens',
            sugestaoCorrecao: 'Verificar e corrigir sequência de numeração',
            categoria: 'formal'
          });
        }
      }
    }

    return problems;
  }

  private checkSpacingAndParagraphs(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar parágrafos muito longos
    const paragraphs = text.split(/\n\s*\n/);
    const longParagraphs = paragraphs.filter(p => p.length > 500);
    
    if (longParagraphs.length > 0) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: `${longParagraphs.length} parágrafo(s) muito longo(s) podem dificultar leitura`,
        gravidade: 'baixa',
        localizacao: 'Formatação de parágrafos',
        sugestaoCorrecao: 'Dividir parágrafos longos em parágrafos menores',
        categoria: 'formal'
      });
    }

    return problems;
  }

  private checkTextEmphasis(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar uso excessivo de maiúsculas
    const upperCaseWords = text.match(/\b[A-Z]{3,}\b/g);
    if (upperCaseWords && upperCaseWords.length > 20) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Uso excessivo de palavras em maiúsculas pode dificultar leitura',
        gravidade: 'baixa',
        localizacao: 'Formatação de texto',
        sugestaoCorrecao: 'Usar maiúsculas apenas para títulos e nomes próprios',
        categoria: 'formal'
      });
    }

    return problems;
  }

  private checkEditalStructure(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar seções específicas de editais
    const requiredEditalSections = [
      'objeto da licitação',
      'critério de julgamento',
      'prazo para entrega',
      'local de entrega',
      'documentação necessária'
    ];

    requiredEditalSections.forEach(section => {
      if (!text.toLowerCase().includes(section)) {
        problems.push({
          tipo: 'clausula_faltante',
          descricao: `Seção "${section}" não encontrada no edital`,
          gravidade: 'alta',
          localizacao: 'Estrutura do edital',
          sugestaoCorrecao: `Incluir seção sobre ${section}`,
          categoria: 'juridico'
        });
      }
    });

    return problems;
  }

  private checkTermoReferenciaStructure(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar seções específicas de TR
    const requiredTRSections = [
      'especificações técnicas',
      'quantitativos',
      'cronograma',
      'critérios de aceitação'
    ];

    requiredTRSections.forEach(section => {
      if (!text.toLowerCase().includes(section)) {
        problems.push({
          tipo: 'especificacao_incompleta',
          descricao: `Seção "${section}" não encontrada no termo de referência`,
          gravidade: 'alta',
          localizacao: 'Estrutura do TR',
          sugestaoCorrecao: `Incluir seção sobre ${section}`,
          categoria: 'tecnico'
        });
      }
    });

    return problems;
  }

  private checkContratoStructure(text: string): Problem[] {
    const problems: Problem[] = [];
    
    // Verificar cláusulas obrigatórias de contratos
    const requiredContractClauses = [
      'objeto do contrato',
      'vigência',
      'valor',
      'forma de pagamento',
      'penalidades',
      'rescisão'
    ];

    requiredContractClauses.forEach(clause => {
      if (!text.toLowerCase().includes(clause)) {
        problems.push({
          tipo: 'clausula_faltante',
          descricao: `Cláusula "${clause}" não encontrada no contrato`,
          gravidade: 'alta',
          localizacao: 'Estrutura do contrato',
          sugestaoCorrecao: `Incluir cláusula sobre ${clause}`,
          categoria: 'juridico'
        });
      }
    });

    return problems;
  }

  private calculateStructuralScore(problems: Problem[]): number {
    let score = 100;
    
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          score -= 25;
          break;
        case 'alta':
          score -= 15;
          break;
        case 'media':
          score -= 10;
          break;
        case 'baixa':
          score -= 5;
          break;
      }
    });

    return Math.max(0, score);
  }

  private calculateConfidence(problems: Problem[], metrics: Record<string, any>): number {
    // Base de confiança de 80%
    let confidence = 80;
    
    // Aumentar confiança se há muitas seções bem estruturadas
    if (metrics.totalSections && metrics.totalSections > 5) {
      confidence += 10;
    }
    
    // Diminuir confiança se há muitos problemas
    if (problems.length > 5) {
      confidence -= 20;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  protected getCacheKey(context: AnalysisContext): string {
    const { text, classification } = context;
    const textHash = this.hashText(text.substring(0, 1000)); // Primeiros 1000 caracteres
    return `structural_${classification.tipoDocumento}_${textHash}`;
  }

  protected validateInput(context: AnalysisContext): boolean {
    return context.text.length > 100 && 
           context.text.length < 1000000 && // Máximo 1MB de texto
           !!context.classification?.tipoDocumento;
  }

  protected createFallbackResult(context: AnalysisContext): AnalysisResult {
    return {
      problems: [{
        tipo: 'inconsistencia',
        descricao: 'Análise estrutural básica devido a erro no analisador principal',
        gravidade: 'baixa',
        localizacao: 'Sistema de análise',
        sugestaoCorrecao: 'Verificar configurações do analisador estrutural',
        categoria: 'formal'
      }],
      metrics: { totalSections: 0, formattingIssues: 1 },
      score: 70,
      confidence: 30,
      processingTime: 0
    };
  }

  private hashText(text: string): string {
    // Hash simples para cache key
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
