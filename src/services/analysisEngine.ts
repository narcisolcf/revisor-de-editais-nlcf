import { DocumentType, DocumentAnalysis, Problem, AnalysisMetrics, DocumentTypeSpecificAnalysis, DocumentUpload } from '@/types/document';

// Engine de análise específica por tipo de documento
export class DocumentAnalysisEngine {
  
  static async analyzeDocument(document: DocumentUpload, extractedText: string): Promise<DocumentAnalysis> {
    const problems = this.analyzeByDocumentType(document.documentType, extractedText, document);
    const metrics = this.calculateMetrics(problems, extractedText);
    const specificAnalysis = this.performSpecificAnalysis(document.documentType, extractedText, document);
    const recommendations = this.generateRecommendations(document.documentType, problems, specificAnalysis);
    const score = this.calculateConformityScore(problems, specificAnalysis);

    return {
      id: `analysis_${document.id}_${Date.now()}`,
      documentoId: document.id,
      documentType: document.documentType,
      textoExtraido: extractedText,
      scoreConformidade: score,
      problemasEncontrados: problems,
      recomendacoes: recommendations,
      metricas: metrics,
      specificAnalysis,
      createdAt: new Date()
    };
  }

  private static analyzeByDocumentType(documentType: DocumentType, text: string, document: DocumentUpload): Problem[] {
    switch (documentType) {
      case 'edital':
        return this.analyzeEdital(text, document);
      case 'termo_referencia':
        return this.analyzeTermoReferencia(text, document);
      case 'minuta_contrato':
        return this.analyzeMinutaContrato(text, document);
      case 'projeto_basico':
        return this.analyzeProjetoBasico(text, document);
      case 'ata_registro_precos':
        return this.analyzeAtaRegistro(text, document);
      case 'parecer_juridico':
        return this.analyzeParecerJuridico(text, document);
      default:
        return this.analyzeGeneric(text, document);
    }
  }

  private static analyzeEdital(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    
    // Verificações específicas para edital
    if (!text.toLowerCase().includes('modalidade')) {
      problems.push({
        tipo: 'modalidade_incorreta',
        descricao: 'Modalidade de licitação não claramente especificada',
        gravidade: 'alta',
        documentType: 'edital',
        categoria: 'formal',
        sugestaoCorrecao: 'Especificar claramente a modalidade (pregão, concorrência, etc.)'
      });
    }

    if (!text.toLowerCase().includes('prazo') && !text.toLowerCase().includes('data limite')) {
      problems.push({
        tipo: 'prazo_inadequado',
        descricao: 'Prazos para entrega de propostas não especificados',
        gravidade: 'critica',
        documentType: 'edital',
        categoria: 'formal',
        sugestaoCorrecao: 'Definir claramente prazos para recebimento das propostas'
      });
    }

    if (!text.toLowerCase().includes('critério de julgamento')) {
      problems.push({
        tipo: 'criterio_irregular',
        descricao: 'Critérios de julgamento não claramente definidos',
        gravidade: 'alta',
        documentType: 'edital',
        categoria: 'tecnico',
        sugestaoCorrecao: 'Especificar se será menor preço, melhor técnica ou técnica e preço'
      });
    }

    return problems;
  }

  private static analyzeTermoReferencia(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    
    if (!text.toLowerCase().includes('especificação técnica')) {
      problems.push({
        tipo: 'especificacao_incompleta',
        descricao: 'Especificações técnicas insuficientes ou ausentes',
        gravidade: 'alta',
        documentType: 'termo_referencia',
        categoria: 'tecnico',
        sugestaoCorrecao: 'Detalhar especificações técnicas dos produtos/serviços'
      });
    }

    if (!text.toLowerCase().includes('quantitativo') && !text.toLowerCase().includes('quantidade')) {
      problems.push({
        tipo: 'quantitativo_inconsistente',
        descricao: 'Quantitativos não especificados adequadamente',
        gravidade: 'media',
        documentType: 'termo_referencia',
        categoria: 'tecnico',
        sugestaoCorrecao: 'Incluir tabela detalhada com quantitativos por item'
      });
    }

    if (!text.toLowerCase().includes('justificativa')) {
      problems.push({
        tipo: 'fundamentacao_fraca',
        descricao: 'Justificativa para contratação não apresentada',
        gravidade: 'alta',
        documentType: 'termo_referencia',
        categoria: 'juridico',
        sugestaoCorrecao: 'Incluir justificativa detalhada da necessidade de contratação'
      });
    }

    return problems;
  }

  private static analyzeMinutaContrato(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    const clausulasObrigatorias = [
      'vigência', 'objeto', 'penalidades', 'rescisão', 'garantia',
      'fiscalização', 'pagamento', 'reajuste', 'alteração'
    ];

    clausulasObrigatorias.forEach(clausula => {
      if (!text.toLowerCase().includes(clausula)) {
        problems.push({
          tipo: 'clausula_faltante',
          descricao: `Cláusula de ${clausula} não encontrada`,
          gravidade: 'alta',
          documentType: 'minuta_contrato',
          categoria: 'juridico',
          sugestaoCorrecao: `Incluir cláusula específica sobre ${clausula}`
        });
      }
    });

    return problems;
  }

  private static analyzeProjetoBasico(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    
    if (!text.toLowerCase().includes('memorial descritivo')) {
      problems.push({
        tipo: 'especificacao_incompleta',
        descricao: 'Memorial descritivo não encontrado',
        gravidade: 'alta',
        documentType: 'projeto_basico',
        categoria: 'tecnico',
        sugestaoCorrecao: 'Incluir memorial descritivo detalhado do projeto'
      });
    }

    if (!text.toLowerCase().includes('planilha') && !text.toLowerCase().includes('orçamento')) {
      problems.push({
        tipo: 'planilha_inconsistente',
        descricao: 'Planilha orçamentária não identificada',
        gravidade: 'critica',
        documentType: 'projeto_basico',
        categoria: 'orcamentario',
        sugestaoCorrecao: 'Anexar planilha orçamentária detalhada'
      });
    }

    return problems;
  }

  private static analyzeAtaRegistro(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    
    if (!text.toLowerCase().includes('validade') && !text.toLowerCase().includes('vigência')) {
      problems.push({
        tipo: 'prazo_inadequado',
        descricao: 'Período de validade da ata não especificado',
        gravidade: 'alta',
        documentType: 'ata_registro_precos',
        categoria: 'formal',
        sugestaoCorrecao: 'Definir claramente o período de validade da ata'
      });
    }

    return problems;
  }

  private static analyzeParecerJuridico(text: string, document: DocumentUpload): Problem[] {
    const problems: Problem[] = [];
    
    if (!text.toLowerCase().includes('fundamentação legal')) {
      problems.push({
        tipo: 'fundamentacao_fraca',
        descricao: 'Fundamentação legal insuficiente',
        gravidade: 'alta',
        documentType: 'parecer_juridico',
        categoria: 'juridico',
        sugestaoCorrecao: 'Incluir base legal detalhada para as conclusões'
      });
    }

    if (!text.toLowerCase().includes('conclusão')) {
      problems.push({
        tipo: 'inconsistencia',
        descricao: 'Conclusão do parecer não claramente apresentada',
        gravidade: 'media',
        documentType: 'parecer_juridico',
        categoria: 'formal',
        sugestaoCorrecao: 'Apresentar conclusão objetiva e clara'
      });
    }

    return problems;
  }

  private static analyzeGeneric(text: string, document: DocumentUpload): Problem[] {
    // Análise genérica para tipos não específicos
    return [];
  }

  private static performSpecificAnalysis(documentType: DocumentType, text: string, document: DocumentUpload): DocumentTypeSpecificAnalysis {
    const analysis: DocumentTypeSpecificAnalysis = {};

    switch (documentType) {
      case 'edital':
        analysis.prazosAdequados = text.toLowerCase().includes('prazo') || text.toLowerCase().includes('data limite');
        analysis.modalidadeCorreta = text.toLowerCase().includes('modalidade');
        analysis.criteriosHabilitacaoClaros = text.toLowerCase().includes('critério') && text.toLowerCase().includes('habilitação');
        analysis.especificacoesDetalhadas = text.length > 1000; // Heurística simples
        break;
      
      case 'termo_referencia':
        analysis.especificacoesTecnicasCompletas = text.toLowerCase().includes('especificação técnica');
        analysis.quantitativosDetalhados = text.toLowerCase().includes('quantitativo') || text.toLowerCase().includes('quantidade');
        analysis.justificativaFundamentada = text.toLowerCase().includes('justificativa');
        break;
      
      case 'minuta_contrato':
        const clausulasObrigatorias = ['vigência', 'objeto', 'penalidades', 'rescisão', 'garantia'];
        analysis.clausulasObrigatorias = clausulasObrigatorias.filter(c => text.toLowerCase().includes(c));
        analysis.clausulasFaltantes = clausulasObrigatorias.filter(c => !text.toLowerCase().includes(c));
        analysis.penalidadesDefinidas = text.toLowerCase().includes('penalidade') || text.toLowerCase().includes('multa');
        break;
      
      case 'projeto_basico':
        analysis.memorialAdequado = text.toLowerCase().includes('memorial descritivo');
        analysis.planilhaConsistente = text.toLowerCase().includes('planilha') || text.toLowerCase().includes('orçamento');
        analysis.cronogramaRealista = text.toLowerCase().includes('cronograma');
        break;
    }

    return analysis;
  }

  private static generateRecommendations(documentType: DocumentType, problems: Problem[], specificAnalysis: DocumentTypeSpecificAnalysis): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas nos problemas encontrados
    problems.forEach(problem => {
      if (problem.sugestaoCorrecao) {
        recommendations.push(problem.sugestaoCorrecao);
      }
    });

    // Recomendações específicas por tipo de documento
    switch (documentType) {
      case 'edital':
        if (!specificAnalysis.prazosAdequados) {
          recommendations.push('Revisar e ajustar prazos conforme complexidade do objeto');
        }
        if (!specificAnalysis.modalidadeCorreta) {
          recommendations.push('Verificar se a modalidade escolhida está adequada ao valor e objeto');
        }
        break;
      
      case 'termo_referencia':
        if (!specificAnalysis.especificacoesTecnicasCompletas) {
          recommendations.push('Detalhar melhor as especificações técnicas para evitar questionamentos');
        }
        break;
      
      case 'minuta_contrato':
        if (specificAnalysis.clausulasFaltantes && specificAnalysis.clausulasFaltantes.length > 0) {
          recommendations.push(`Incluir cláusulas obrigatórias: ${specificAnalysis.clausulasFaltantes.join(', ')}`);
        }
        break;
    }

    return recommendations;
  }

  private static calculateConformityScore(problems: Problem[], specificAnalysis: DocumentTypeSpecificAnalysis): number {
    let baseScore = 100;
    
    // Deduzir pontos baseado na gravidade dos problemas
    problems.forEach(problem => {
      switch (problem.gravidade) {
        case 'critica':
          baseScore -= 25;
          break;
        case 'alta':
          baseScore -= 15;
          break;
        case 'media':
          baseScore -= 8;
          break;
        case 'baixa':
          baseScore -= 3;
          break;
      }
    });

    return Math.max(0, baseScore);
  }

  private static calculateMetrics(problems: Problem[], text: string): AnalysisMetrics {
    return {
      totalClauses: Math.floor(text.length / 200), // Estimativa baseada no tamanho do texto
      validClauses: Math.floor(text.length / 200) - problems.length,
      missingClauses: problems.filter(p => p.tipo === 'clausula_faltante').length,
      inconsistencies: problems.filter(p => p.tipo === 'inconsistencia').length,
      processingTime: Math.random() * 5 + 2 // Simulação: 2-7 segundos
    };
  }
}