import { DocumentUpload, DocumentAnalysis, DocumentClassification, DocumentClassificationSpecificAnalysis, Problem, AnalysisMetrics } from '@/types/document';

// Mock analysis engine to simulate document analysis based on classification
export class AnalysisEngine {
  static async analyzeDocument(document: DocumentUpload): Promise<DocumentAnalysis> {
    const classification = document.classification;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate analysis based on document classification
    const specificAnalysis = this.generateSpecificAnalysis(classification);
    const problems = this.generateProblems(classification);
    const score = this.calculateConformityScore(problems);
    const recommendations = this.generateRecommendations(classification, problems);

    return {
      id: `analysis_${Date.now()}`,
      documentoId: document.id,
      classification: document.classification,
      textoExtraido: 'Texto extraído simulado do documento...',
      scoreConformidade: score,
      problemasEncontrados: problems,
      recomendacoes: recommendations,
      metricas: {
        totalClauses: 45,
        validClauses: 35,
        missingClauses: 5,
        inconsistencies: 5,
        processingTime: 2.5
      },
      specificAnalysis,
      createdAt: new Date()
    };
  }

  private static generateSpecificAnalysis(classification: DocumentClassification): DocumentClassificationSpecificAnalysis {
    return {};
  }

  private static generateProblems(classification: DocumentClassification): Problem[] {
    const problems: Problem[] = [];

    if (classification.tipoDocumento === 'edital') {
      if (Math.random() > 0.6) {
        problems.push({
          tipo: 'prazo_inadequado',
          descricao: 'Prazo para entrega de propostas muito curto',
          gravidade: 'alta',
          localizacao: 'Cláusula 4.1',
          sugestaoCorrecao: 'Aumentar prazo para no mínimo 8 dias úteis',
          classification,
          categoria: 'juridico'
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
          score -= 20;
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

  private static generateRecommendations(classification: DocumentClassification, problems: Problem[]): string[] {
    const recommendations: string[] = [];
    
    problems.forEach(problem => {
      if (problem.sugestaoCorrecao) {
        recommendations.push(problem.sugestaoCorrecao);
      }
    });

    return [...new Set(recommendations)];
  }
}