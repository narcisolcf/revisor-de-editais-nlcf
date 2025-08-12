import { DocumentUpload, DocumentAnalysis, DocumentClassification, Problem } from '@/types/document';
import supabase from '@/lib/supabase';
import mammoth from 'mammoth';
import { getRulesForClassification } from '@/data/analysisRules';
interface TextExtractionResult {
  text: string;
  pages?: number;
}

export class DocumentAnalysisService {
  
  static async extractTextFromFile(file: File): Promise<TextExtractionResult> {
    const fileType = file.type || '';
    const fileName = file.name ? String(file.name).toLowerCase() : '';
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await this.extractTextFromPDF(file);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await this.extractTextFromWord(file);
    } else {
      throw new Error('Formato não suportado. Envie PDF ou DOCX (.docx).');
    }
  }

  private static async extractTextFromPDF(file: File): Promise<TextExtractionResult> {
    try {
      // For now, simulate PDF text extraction
      // In production, you would use a proper PDF parser
      const text = `Texto extraído do PDF: ${file.name}
      
      Este é um documento de exemplo para demonstrar a extração de texto.
      O documento contém informações sobre licitação e processos de compra.
      
      Cláusulas importantes:
      - Prazo para entrega: 30 dias
      - Modalidade: Pregão Eletrônico
      - Critério de julgamento: Menor preço
      - Valor estimado: R$ 100.000,00
      
      Condições de participação:
      - Empresas regularmente constituídas
      - Certificado de regularidade fiscal
      - Atestado de capacidade técnica`;
      
      return { text, pages: 5 };
    } catch (error) {
      console.error('Erro na extração de texto do PDF:', error);
      throw new Error('Falha ao extrair texto do PDF');
    }
  }

  private static async extractTextFromWord(file: File): Promise<TextExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { text: result.value };
    } catch (error: unknown) {
      console.error('Erro na extração de texto do Word:', error);
      const message = error instanceof Error ? error.message : '';
      if (message.includes('central directory') || message.includes('zip file')) {
        throw new Error('Arquivo .docx inválido ou corrompido. Certifique-se de enviar um .docx válido (não .doc).');
      }
      throw new Error('Falha ao extrair texto do documento Word');
    }
  }

  static async analyzeDocument(document: DocumentUpload, extractedText: string): Promise<DocumentAnalysis> {
    const classification = document.classification;
    
    // Analyze based on document classification
    const problems = await this.analyzeConformity(extractedText, classification);
    const score = this.calculateConformityScore(problems);
    const recommendations = this.generateRecommendations(problems, classification);

    const analysis: DocumentAnalysis = {
      id: `analysis_${Date.now()}`,
      documentoId: document.id,
      classification: document.classification,
      textoExtraido: extractedText,
      scoreConformidade: score,
      problemasEncontrados: problems,
      recomendacoes: recommendations,
      metricas: {
        totalClauses: this.countClauses(extractedText),
        validClauses: this.countValidClauses(extractedText, problems),
        missingClauses: problems.filter(p => p.tipo === 'clausula_faltante').length,
        inconsistencies: problems.filter(p => p.tipo === 'inconsistencia').length,
        processingTime: 2.5
      },
      specificAnalysis: {},
      createdAt: new Date()
    };

    // Save analysis to Supabase
    await this.saveAnalysis(analysis);
    
    return analysis;
  }

private static async analyzeConformity(text: string, classification: DocumentClassification): Promise<Problem[]> {
  const textLower = text.toLowerCase();

  // 1) Executa regras centralizadas
  let problems: Problem[] = await this.evaluateRules(textLower, classification);

  // 2) Regras específicas existentes (mantidas como hooks adicionais)
  if (classification.tipoDocumento === 'edital') {
    await this.validateEdital(textLower, problems, classification);
  } else if (classification.tipoDocumento === 'tr') {
    await this.validateTermoReferencia(textLower, problems, classification);
  }

  if (classification.modalidadePrincipal === 'processo_licitatorio') {
    await this.validateProcessoLicitatorio(textLower, problems, classification);
  }

  // 3) Deduplicação básica por (tipo|descrição)
  const seen = new Set<string>();
  problems = problems.filter((p) => {
    const key = `${p.tipo}|${p.descricao}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return problems;
}

  private static async validateEdital(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('objeto') && !text.includes('finalidade')) {
      problems.push({
        tipo: 'clausula_faltante',
        descricao: 'Objeto da licitação não está claramente definido',
        gravidade: 'critica',
        localizacao: 'Cláusula de objeto',
        sugestaoCorrecao: 'Definir claramente o objeto da licitação conforme art. 40, I da Lei 8.666/93',
        classification,
        categoria: 'juridico'
      });
    }

    if (!text.includes('critério') && !text.includes('julgamento')) {
      problems.push({
        tipo: 'criterio_irregular',
        descricao: 'Critério de julgamento não especificado',
        gravidade: 'alta',
        localizacao: 'Cláusula de julgamento',
        sugestaoCorrecao: 'Especificar o critério de julgamento (menor preço, melhor técnica, etc.)',
        classification,
        categoria: 'juridico'
      });
    }
  }

  private static async validateTermoReferencia(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('especificação') && !text.includes('detalhamento')) {
      problems.push({
        tipo: 'especificacao_incompleta',
        descricao: 'Especificações técnicas insuficientes ou ausentes',
        gravidade: 'alta',
        localizacao: 'Especificações técnicas',
        sugestaoCorrecao: 'Detalhar especificações técnicas conforme necessidades da Administração',
        classification,
        categoria: 'tecnico'
      });
    }
  }

  private static async validateProcessoLicitatorio(text: string, problems: Problem[], classification: DocumentClassification): Promise<void> {
    if (!text.includes('sistema') && !text.includes('eletrônico')) {
      problems.push({
        tipo: 'modalidade_incorreta',
        descricao: 'Documento não menciona utilização de sistema eletrônico',
        gravidade: 'media',
        localizacao: 'Disposições gerais',
        sugestaoCorrecao: 'Especificar o sistema eletrônico a ser utilizado para o pregão',
        classification,
        categoria: 'formal'
      });
    }
  }

  private static async evaluateRules(textLower: string, classification: DocumentClassification): Promise<Problem[]> {
    const rules = getRulesForClassification(classification);
    const problems: Problem[] = [];

    for (const rule of rules) {
      let failed = false;

      if (rule.type === 'keyword_presence') {
        const list = rule.keywordsAll ?? [];
        if (list.length > 0) {
          failed = list.some((kw) => !textLower.includes(kw.toLowerCase()));
        }
      } else if (rule.type === 'keyword_any') {
        const list = rule.keywordsAny ?? [];
        if (list.length > 0) {
          failed = !list.some((kw) => textLower.includes(kw.toLowerCase()));
        }
      } else if (rule.type === 'pattern') {
        if (rule.pattern) {
          try {
            const regex = new RegExp(rule.pattern, 'i');
            failed = !regex.test(textLower);
          } catch (e) {
            // Se regex inválida, ignora a regra
            failed = false;
          }
        }
      }

      if (failed) {
        problems.push({
          tipo: rule.problemType ?? 'inconsistencia',
          descricao: rule.description,
          gravidade: rule.severity,
          localizacao: 'Documento geral',
          sugestaoCorrecao: rule.suggestion,
          classification,
          categoria: rule.category,
        });
      }
    }

    return problems;
  }

  private static calculateConformityScore(problems: Problem[]): number {
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

  private static generateRecommendations(problems: Problem[], classification: DocumentClassification): string[] {
    const recommendations = new Set<string>();
    
    problems.forEach(problem => {
      if (problem.sugestaoCorrecao) {
        recommendations.add(problem.sugestaoCorrecao);
      }
    });

    // Add general recommendations based on classification
    if (classification.tipoDocumento === 'edital') {
      recommendations.add('Revisar conformidade com Lei 8.666/93 e Lei 10.520/02');
      recommendations.add('Verificar adequação às normas do TCU');
    }

    return Array.from(recommendations);
  }

  private static countClauses(text: string): number {
    // Simple clause counting based on patterns
    const clausePatterns = /cláusula|artigo|item|parágrafo/gi;
    const matches = text.match(clausePatterns);
    return matches ? matches.length : 0;
  }

  private static countValidClauses(text: string, problems: Problem[]): number {
    const totalClauses = this.countClauses(text);
    const invalidClauses = problems.filter(p => 
      p.tipo === 'clausula_faltante' || p.tipo === 'especificacao_incompleta'
    ).length;
    return Math.max(0, totalClauses - invalidClauses);
  }

  private static async saveAnalysis(analysis: DocumentAnalysis): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_analyses')
        .insert([{
          id: analysis.id,
          document_id: analysis.documentoId,
          classification: analysis.classification,
          extracted_text: analysis.textoExtraido,
          conformity_score: analysis.scoreConformidade,
          problems: analysis.problemasEncontrados,
          recommendations: analysis.recomendacoes,
          metrics: analysis.metricas,
          specific_analysis: analysis.specificAnalysis,
          created_at: analysis.createdAt.toISOString()
        }]);

      if (error) {
        console.error('Erro ao salvar análise:', error);
        // Don't throw error - analysis can still work without persistence
      }
    } catch (error) {
      console.error('Erro ao conectar com Supabase:', error);
      // Don't throw error - analysis can still work without persistence
    }
  }

  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        documentoId: data.document_id,
        classification: data.classification,
        textoExtraido: data.extracted_text,
        scoreConformidade: data.conformity_score,
        problemasEncontrados: data.problems,
        recomendacoes: data.recommendations,
        metricas: data.metrics,
        specificAnalysis: data.specific_analysis,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      return null;
    }
  }
}