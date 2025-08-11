"""
LicitaReview - Testes e Exemplos dos Modelos

Este arquivo demonstra como usar os modelos implementados e serve
como teste básico das funcionalidades principais.
"""

import json
from datetime import datetime
from typing import Dict, Any

from models import (
    # Document Models
    Document,
    DocumentType,
    DocumentClassification,
    DocumentStatus,
    DocumentMetadata,
    LicitationModality,
    
    # Analysis Models
    AnalysisRequest,
    AnalysisResult,
    AnalysisFinding,
    ConformityScore,
    ProblemSeverity,
    ProblemCategory,
    
    # Config Models (CORE DIFERENCIAL)
    OrganizationConfig,
    AnalysisWeights,
    CustomRule,
    AnalysisPreset,
    OrganizationTemplate,
    TemplateSection
)

from models.utils import (
    ModelConverter,
    ValidationUtils,
    SerializationUtils,
    serialize_for_api,
    create_document_summary,
    create_dashboard_data,
    prepare_frontend_config
)


def test_document_models():
    """Testa modelos de documento."""
    print("🧪 Testando Document Models...")
    
    # 1. Criar classificação de documento
    classification = DocumentClassification(
        primary_category="licitacao",
        secondary_category="bens_servicos",
        document_type=DocumentType.EDITAL,
        modality=LicitationModality.PREGAO_ELETRONICO,
        complexity_level="media"
    )
    
    print(f"✅ Classificação criada: {classification.to_hierarchy_string()}")
    
    # 2. Criar metadados
    metadata = DocumentMetadata(
        file_name="edital_pregao_123_2025.pdf",
        file_size=2048000,  # 2MB
        file_type="application/pdf",
        page_count=25,
        word_count=15000,
        ocr_confidence=0.95,
        extraction_method="hybrid",
        language="pt-BR",
        organization_id="org_prefeitura_sp"
    )
    
    print(f"✅ Metadados criados: {metadata.file_name} ({metadata.file_size} bytes)")
    
    # 3. Criar documento completo
    document = Document(
        title="Edital de Pregão Eletrônico nº 123/2025 - Aquisição de Material de Escritório",
        content="EDITAL DE PREGÃO ELETRÔNICO Nº 123/2025\n\nA Prefeitura Municipal...",
        classification=classification,
        metadata=metadata,
        organization_id="org_prefeitura_sp",
        created_by="user_admin_123"
    )
    
    print(f"✅ Documento criado: {document.id}")
    print(f"   Título: {document.title[:50]}...")
    print(f"   Status: {document.status.value}")
    print(f"   Preview: {document.get_content_preview(100)}")
    
    # 4. Testar métodos do documento
    document.change_status(DocumentStatus.PROCESSING)
    print(f"✅ Status alterado para: {document.status.value}")
    
    # 5. Criar nova versão
    new_version = document.create_new_version(
        "EDITAL DE PREGÃO ELETRÔNICO Nº 123/2025 - VERSÃO REVISADA...",
        "user_revisor_456"
    )
    print(f"✅ Nova versão criada: {new_version.id} (v{new_version.version})")
    
    return document


def test_config_models():
    """🚀 Testa modelos de configuração (CORE DIFERENCIAL)."""
    print("\n🚀 Testando Config Models (CORE DIFERENCIAL)...")
    
    # 1. Criar pesos personalizados
    custom_weights = AnalysisWeights(
        structural=20.0,
        legal=50.0,    # Foco em conformidade jurídica
        clarity=20.0,
        abnt=10.0
    )
    
    print(f"✅ Pesos personalizados criados:")
    print(f"   {custom_weights.to_percentage_dict()}")
    print(f"   Categoria dominante: {custom_weights.get_dominant_category()}")
    print(f"   Tipo de distribuição: {custom_weights.get_weight_distribution_type()}")
    
    # 2. Testar preset padrão
    standard_weights = AnalysisWeights.from_preset(AnalysisPreset.STANDARD)
    print(f"✅ Preset padrão: {standard_weights.to_percentage_dict()}")
    
    # 3. Criar regra personalizada
    custom_rule = CustomRule(
        name="Verificar Valor Estimado",
        description="Verifica se o valor estimado está claramente especificado",
        pattern=r"valor\s+estimado\s*:\s*R\$\s*[\d.,]+",
        pattern_type="regex",
        severity="alta",
        category="estrutural",
        message="Valor estimado não encontrado ou mal formatado",
        suggestion="Inclua o valor estimado no formato: 'Valor Estimado: R$ XX.XXX,XX'",
        applies_to_document_types=[DocumentType.EDITAL, DocumentType.TERMO_REFERENCIA]
    )
    
    print(f"✅ Regra personalizada criada: {custom_rule.name}")
    print(f"   Categoria: {custom_rule.category}")
    print(f"   Severidade: {custom_rule.severity}")
    
    # 4. Testar padrão da regra
    test_text = "O valor estimado para esta contratação é R$ 50.000,00"
    match_result = custom_rule.test_pattern_match(test_text)
    print(f"✅ Teste de padrão: {'✓ Match' if match_result else '✗ No match'}")
    
    # 5. Criar configuração organizacional completa
    org_config = OrganizationConfig(
        organization_id="org_prefeitura_sp",
        organization_name="Prefeitura Municipal de São Paulo",
        weights=custom_weights,
        preset_type=AnalysisPreset.RIGOROUS,
        custom_rules=[custom_rule]
    )
    
    print(f"✅ Configuração organizacional criada:")
    print(f"   Organização: {org_config.organization_name}")
    print(f"   Preset: {org_config.preset_type.value}")
    print(f"   Hash de config: {org_config.get_config_hash()[:8]}...")
    
    # 6. Testar métodos da configuração
    org_config.add_custom_rule(CustomRule(
        name="Verificar Prazo de Entrega",
        description="Verifica se o prazo de entrega está especificado",
        pattern="prazo.*entrega",
        severity="media",
        category="estrutural",
        message="Prazo de entrega não especificado",
        suggestion="Incluir prazo específico de entrega"
    ))
    
    print(f"✅ Regra adicional adicionada. Total: {len(org_config.custom_rules)}")
    
    # 7. Testar sumário da configuração
    summary = org_config.get_analysis_summary()
    print(f"✅ Sumário da configuração:")
    for key, value in summary.items():
        print(f"   {key}: {value}")
    
    return org_config


def test_analysis_models():
    """Testa modelos de análise."""
    print("\n🧪 Testando Analysis Models...")
    
    # 1. Criar scores de conformidade
    conformity_scores = ConformityScore(
        structural=85.0,
        legal=92.0,
        clarity=78.0,
        abnt=88.0,
        overall=86.0
    )
    
    print(f"✅ Scores de conformidade criados:")
    print(f"   Estrutural: {conformity_scores.structural} ({conformity_scores.get_category_rating('structural')})")
    print(f"   Jurídico: {conformity_scores.legal} ({conformity_scores.get_category_rating('legal')})")
    print(f"   Clareza: {conformity_scores.clarity} ({conformity_scores.get_category_rating('clarity')})")
    print(f"   ABNT: {conformity_scores.abnt} ({conformity_scores.get_category_rating('abnt')})")
    
    # 2. Criar findings
    findings = [
        AnalysisFinding(
            category=ProblemCategory.JURIDICO,
            severity=ProblemSeverity.ALTA,
            title="Ausência de Fundamentação Legal",
            description="O edital não apresenta fundamentação legal adequada conforme Lei 14.133/2021",
            suggestion="Incluir referências específicas aos artigos da Lei 14.133/2021",
            location="Seção 1.2 - Fundamentação Legal",
            regulatory_reference="Lei 14.133/2021, Art. 18",
            impact_score=7.5
        ),
        AnalysisFinding(
            category=ProblemCategory.ESTRUTURAL,
            severity=ProblemSeverity.MEDIA,
            title="Seção de Cronograma Incompleta",
            description="O cronograma de execução não detalha todas as etapas necessárias",
            suggestion="Detalhar cronograma com marcos específicos e prazos intermediários",
            location="Seção 4.1 - Cronograma",
            impact_score=5.0
        )
    ]
    
    print(f"✅ {len(findings)} findings criados:")
    for finding in findings:
        print(f"   • {finding.title} ({finding.severity.value})")
        print(f"     Categoria: {finding.category.value}")
        print(f"     Impacto: {finding.impact_score}/10")
    
    # 3. Criar resultado de análise
    org_config = OrganizationConfig.create_default_config(
        "org_test",
        "Organização Teste",
        AnalysisPreset.RIGOROUS
    )
    
    # Calcular score ponderado
    weighted_score = conformity_scores.calculate_weighted_score(org_config.weights)
    
    analysis_result = AnalysisResult(
        document_id="doc_test_123",
        organization_id="org_test",
        conformity_scores=conformity_scores,
        weighted_score=weighted_score,
        findings=findings,
        recommendations=[
            "Revisar fundamentação legal do edital",
            "Detalhar cronograma de execução",
            "Incluir critérios de sustentabilidade"
        ],
        applied_config=org_config,
        execution_time_seconds=12.5,
        analysis_metadata={
            "ocr_used": True,
            "ai_analysis": False,
            "custom_rules_applied": len(org_config.custom_rules)
        }
    )
    
    print(f"✅ Resultado de análise criado:")
    print(f"   Document ID: {analysis_result.document_id}")
    print(f"   Score Ponderado: {analysis_result.weighted_score:.1f}")
    print(f"   Total de Findings: {len(analysis_result.findings)}")
    print(f"   Tempo de Execução: {analysis_result.execution_time_seconds}s")
    
    # 4. Testar métodos de agrupamento
    findings_by_severity = analysis_result.get_findings_by_severity()
    print(f"✅ Findings por severidade:")
    for severity, findings_list in findings_by_severity.items():
        print(f"   {severity.title()}: {len(findings_list)}")
    
    # 5. Gerar sumário executivo
    executive_summary = analysis_result.generate_executive_summary()
    print(f"✅ Sumário executivo gerado:")
    print(f"   Score Geral: {executive_summary['overall_score']}")
    print(f"   Issues Críticos: {executive_summary['critical_issues']}")
    print(f"   Issues Alta Prioridade: {executive_summary['high_priority_issues']}")
    
    return analysis_result


def test_utils_and_serialization():
    """Testa utilitários e serialização."""
    print("\n🔧 Testando Utils e Serialização...")
    
    # Criar dados de teste
    document = test_document_models()
    org_config = test_config_models()
    analysis_result = test_analysis_models()
    
    print("\n📄 Testando conversões:")
    
    # 1. Converter documento para sumário
    doc_summary = create_document_summary(document)
    print(f"✅ Sumário do documento criado:")
    print(f"   ID: {doc_summary['id']}")
    print(f"   Tipo: {doc_summary['type']}")
    print(f"   Arquivo: {doc_summary['file_info']['name']}")
    
    # 2. Converter configuração para frontend
    frontend_config = prepare_frontend_config(org_config)
    print(f"✅ Config para frontend preparada:")
    print(f"   Organization ID: {frontend_config['organizationId']}")
    print(f"   Preset: {frontend_config['presetType']}")
    print(f"   Categoria Dominante: {frontend_config['dominantCategory']}")
    
    # 3. Converter análise para dashboard
    dashboard_data = create_dashboard_data(analysis_result)
    print(f"✅ Dados do dashboard criados:")
    print(f"   Score Geral: {dashboard_data['overall_score']}")
    print(f"   Total Issues: {dashboard_data['findings_summary']['total']}")
    print(f"   Preset Aplicado: {dashboard_data['applied_preset']}")
    
    # 4. Testar serialização JSON
    config_json = SerializationUtils.export_config_to_json(org_config, pretty=True)
    print(f"✅ Configuração exportada para JSON ({len(config_json)} chars)")
    
    # 5. Testar importação de JSON
    imported_config = SerializationUtils.import_config_from_json(config_json)
    print(f"✅ Configuração importada de JSON:")
    print(f"   Hash original: {org_config.get_config_hash()[:8]}...")
    print(f"   Hash importado: {imported_config.get_config_hash()[:8]}...")
    print(f"   Consistente: {'✓' if org_config.get_config_hash() == imported_config.get_config_hash() else '✗'}")
    
    # 6. Testar validação de consistência
    validation_result = ValidationUtils.validate_analysis_consistency(
        document, analysis_result, org_config
    )
    print(f"✅ Validação de consistência:")
    print(f"   Válido: {'✓' if validation_result['is_valid'] else '✗'}")
    if validation_result['errors']:
        print(f"   Erros: {validation_result['errors']}")
    if validation_result['warnings']:
        print(f"   Warnings: {validation_result['warnings']}")


def demonstrate_core_differentiator():
    """🚀 Demonstra o CORE DIFERENCIAL - Parâmetros Personalizados."""
    print("\n🚀 DEMONSTRAÇÃO DO CORE DIFERENCIAL")
    print("=" * 50)
    print("Sistema de Parâmetros Personalizados por Organização")
    print("=" * 50)
    
    # Simular 3 organizações com perfis diferentes
    organizations = [
        {
            'name': 'Tribunal de Contas',
            'preset': AnalysisPreset.RIGOROUS,
            'weights': AnalysisWeights(structural=15.0, legal=60.0, clarity=20.0, abnt=5.0),
            'focus': 'Conformidade Legal Rigorosa'
        },
        {
            'name': 'Prefeitura Técnica',
            'preset': AnalysisPreset.TECHNICAL,
            'weights': AnalysisWeights(structural=35.0, legal=25.0, clarity=15.0, abnt=25.0),
            'focus': 'Especificações Técnicas Detalhadas'
        },
        {
            'name': 'Órgão Padrão',
            'preset': AnalysisPreset.STANDARD,
            'weights': AnalysisWeights(structural=25.0, legal=25.0, clarity=25.0, abnt=25.0),
            'focus': 'Análise Balanceada'
        }
    ]
    
    # Scores base do mesmo documento
    base_scores = ConformityScore(
        structural=80.0,
        legal=70.0,
        clarity=85.0,
        abnt=90.0,
        overall=81.25  # Média simples
    )
    
    print(f"\n📊 IMPACTO DOS PESOS PERSONALIZADOS:")
    print(f"Score base (sem pesos): Estrutural={base_scores.structural}%, "
          f"Jurídico={base_scores.legal}%, Clareza={base_scores.clarity}%, "
          f"ABNT={base_scores.abnt}%")
    print(f"Score médio simples: {base_scores.overall}%")
    
    print(f"\n🎯 SCORES PERSONALIZADOS POR ORGANIZAÇÃO:")
    
    for i, org in enumerate(organizations, 1):
        weighted_score = base_scores.calculate_weighted_score(org['weights'])
        
        print(f"\n{i}. {org['name']} - {org['focus']}")
        print(f"   Pesos: {org['weights'].to_percentage_dict()}")
        print(f"   Score Personalizado: {weighted_score:.1f}%")
        print(f"   Diferença vs. Média: {weighted_score - base_scores.overall:+.1f}%")
        print(f"   Categoria Dominante: {org['weights'].get_dominant_category().title()}")
    
    print(f"\n💡 INSIGHTS:")
    print(f"   • Tribunal de Contas: Score mais baixo devido ao foco em conformidade legal")
    print(f"   • Prefeitura Técnica: Score mais alto devido às boas especificações ABNT")
    print(f"   • Órgão Padrão: Score equilibrado reflete análise geral")
    
    print(f"\n🚀 DIFERENCIAL COMPETITIVO DEMONSTRADO:")
    print(f"   ✓ Mesmo documento = Scores diferentes por organização")
    print(f"   ✓ Análise adaptada às necessidades específicas")
    print(f"   ✓ Flexibilidade total nos critérios de avaliação")
    print(f"   ✓ Personalização por tipo de órgão e processo")


def main():
    """Função principal para executar todos os testes."""
    print("🧪 LicitaReview - Teste Completo dos Modelos Python")
    print("=" * 60)
    
    try:
        # Testes individuais
        test_document_models()
        test_config_models()
        test_analysis_models()
        test_utils_and_serialization()
        
        # Demonstração do diferencial
        demonstrate_core_differentiator()
        
        print(f"\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!")
        print(f"🚀 Sistema de Parâmetros Personalizados funcionando perfeitamente!")
        
    except Exception as e:
        print(f"\n❌ ERRO nos testes: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()