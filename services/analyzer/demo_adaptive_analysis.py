#!/usr/bin/env python3
"""
🚀 LicitaReview - Demonstração do Motor de Análise Adaptativo

Este script demonstra como o mesmo documento pode ter scores diferentes
para diferentes organizações, baseado em seus parâmetros personalizados.

DIFERENCIAL COMPETITIVO: Análise 100% adaptável aos critérios de cada órgão.

Exemplo de uso:
    python demo_adaptive_analysis.py

Author: LicitaReview Team
"""

import asyncio
from datetime import datetime
import json

from src.models.document_models import Document
from src.models.config_models import (
    OrganizationConfig,
    AnalysisWeights,
    AnalysisPreset,
    CustomRule
)
from src.services.adaptive_analyzer import AdaptiveAnalyzer


async def create_sample_document() -> Document:
    """Cria documento de exemplo para análise."""
    content = """
    EDITAL DE PREGÃO ELETRÔNICO Nº 001/2024
    
    OBJETO: Aquisição de equipamentos de informática para modernização
    do parque tecnológico da administração municipal.
    
    VALOR ESTIMADO: R$ 150.000,00 (cento e cinquenta mil reais).
    
    PRAZO: 30 (trinta) dias corridos para entrega.
    
    DA HABILITAÇÃO:
    Para participar do certame, os licitantes deverão apresentar:
    a) Certidão de regularidade fiscal;
    b) Comprovação de aptidão técnica;
    c) Qualificação econômico-financeira.
    
    Este edital segue as disposições da Lei 8.666/93 e algumas normas internas.
    
    O critério da administração será utilizado para avaliar propostas.
    Poderá ser aceito equipamento equivalente conforme julgamento da comissão.
    """
    
    return Document(
        id="demo_doc_001",
        title="Edital de Pregão Eletrônico - Equipamentos de Informática",
        content=content,
        file_type="text/plain"
    )


async def create_rigorous_organization() -> OrganizationConfig:
    """Cria configuração de organização rigorosa (ex: TCU)."""
    
    # Regra personalizada para detectar linguagem subjetiva
    custom_rule = CustomRule(
        name="Detectar Critérios Subjetivos",
        description="Identifica uso de critério subjetivo sem parâmetros claros",
        pattern=r"critério\s+da\s+administração|a\s+seu\s+critério|julgamento\s+da\s+comissão",
        pattern_type="regex",
        severity="alta",
        category="juridico",
        message="Critério subjetivo identificado",
        suggestion="Definir parâmetros objetivos para avaliação"
    )
    
    config = OrganizationConfig.create_default_config(
        organization_id="org_tcu_001",
        organization_name="Tribunal de Contas da União - Fiscalização",
        preset=AnalysisPreset.RIGOROUS
    )
    
    config.add_custom_rule(custom_rule)
    
    return config


async def create_flexible_organization() -> OrganizationConfig:
    """Cria configuração de organização flexível (ex: Prefeitura Municipal)."""
    
    # Pesos mais balanceados
    flexible_weights = AnalysisWeights(
        structural=30.0,
        legal=25.0,
        clarity=35.0,  # Maior peso na clareza
        abnt=10.0
    )
    
    config = OrganizationConfig.create_default_config(
        organization_id="org_prefeitura_001",
        organization_name="Prefeitura Municipal de Example",
        preset=AnalysisPreset.FLEXIBLE
    )
    
    config.update_weights(flexible_weights)
    
    return config


async def create_technical_organization() -> OrganizationConfig:
    """Cria configuração de organização focada em aspectos técnicos."""
    
    # Regra para verificar especificações técnicas
    tech_rule = CustomRule(
        name="Verificar Especificações Técnicas",
        description="Garante presença de especificações técnicas detalhadas",
        pattern=r"especifica(ção|ções)?\s+técnica",
        pattern_type="regex",
        severity="media",
        category="abnt",
        message="Especificações técnicas encontradas",
        suggestion="Manter detalhamento técnico adequado"
    )
    
    config = OrganizationConfig.create_default_config(
        organization_id="org_engenharia_001",
        organization_name="Secretaria de Obras e Engenharia",
        preset=AnalysisPreset.TECHNICAL
    )
    
    config.add_custom_rule(tech_rule)
    
    return config


async def demonstrate_adaptive_analysis():
    """
    Demonstra como o mesmo documento tem scores diferentes
    para organizações com configurações diferentes.
    """
    print("🚀 LicitaReview - Demonstração do Motor de Análise Adaptativo")
    print("=" * 70)
    
    # Cria documento de exemplo
    document = await create_sample_document()
    print(f"📄 Documento: {document.title}")
    print(f"📏 Tamanho: {len(document.content)} caracteres")
    print()
    
    # Cria configurações de diferentes organizações
    organizations = [
        await create_rigorous_organization(),
        await create_flexible_organization(),
        await create_technical_organization()
    ]
    
    print("🏛️  Organizações configuradas:")
    for org in organizations:
        print(f"  • {org.organization_name}")
        print(f"    Preset: {org.preset_type.value}")
        print(f"    Pesos: {org.weights.to_percentage_dict()}")
        print(f"    Regras personalizadas: {len(org.get_active_rules())}")
    print()
    
    # Executa análises adaptativas
    results = []
    
    for org_config in organizations:
        print(f"🔍 Analisando para: {org_config.organization_name}")
        print(f"   Configuração: {org_config.weights.get_weight_distribution_type()}")
        
        # Cria analisador adaptativo
        analyzer = AdaptiveAnalyzer(
            doc_type="pregao",
            org_config=org_config
        )
        
        # Executa análise
        result = await analyzer.analyze_with_custom_params(document)
        results.append((org_config, result))
        
        print(f"   ✅ Score ponderado: {result.weighted_score:.1f}")
        print(f"   📊 Findings: {len(result.findings)} ({len([f for f in result.findings if f.is_custom_rule])} personalizados)")
        print()
    
    # Mostra comparação detalhada
    print("📊 COMPARAÇÃO DETALHADA DOS RESULTADOS")
    print("=" * 70)
    
    for org_config, result in results:
        print(f"\n🏛️  {org_config.organization_name}")
        print(f"   Score Final: {result.weighted_score:.1f}/100")
        
        # Scores por categoria
        scores = result.conformity_scores
        print("   Scores por categoria:")
        print(f"     • Estrutural: {scores.structural:.1f} (peso: {org_config.weights.structural:.1f}%)")
        print(f"     • Jurídico:   {scores.legal:.1f} (peso: {org_config.weights.legal:.1f}%)")
        print(f"     • Clareza:    {scores.clarity:.1f} (peso: {org_config.weights.clarity:.1f}%)")
        print(f"     • ABNT:       {scores.abnt:.1f} (peso: {org_config.weights.abnt:.1f}%)")
        
        # Findings mais críticos
        critical_findings = [f for f in result.findings if f.severity.value == "critica"]
        if critical_findings:
            print(f"   ⚠️  Problemas críticos: {len(critical_findings)}")
            for finding in critical_findings[:2]:  # Mostra primeiros 2
                print(f"      - {finding.title}")
        
        # Regras personalizadas aplicadas
        custom_findings = [f for f in result.findings if f.is_custom_rule]
        if custom_findings:
            print(f"   🎯 Regras personalizadas: {len(custom_findings)}")
            for finding in custom_findings:
                print(f"      - {finding.title}")
    
    # Análise comparativa
    print(f"\n🔍 ANÁLISE COMPARATIVA")
    print("=" * 70)
    
    scores_comparison = [(org.organization_name, result.weighted_score) for org, result in results]
    scores_comparison.sort(key=lambda x: x[1], reverse=True)
    
    print("Ranking por score final:")
    for i, (org_name, score) in enumerate(scores_comparison, 1):
        print(f"{i}. {org_name}: {score:.1f}")
    
    # Diferencial competitivo
    max_score = max(score for _, score in scores_comparison)
    min_score = min(score for _, score in scores_comparison)
    score_variation = max_score - min_score
    
    print(f"\n🚀 DIFERENCIAL COMPETITIVO DEMONSTRADO:")
    print(f"   • Variação de score: {score_variation:.1f} pontos")
    print(f"   • Score mais alto: {max_score:.1f} ({scores_comparison[0][0]})")
    print(f"   • Score mais baixo: {min_score:.1f} ({scores_comparison[-1][0]})")
    print(f"   • Mesmo documento, critérios diferentes = resultados diferentes! ✨")
    
    print(f"\n✅ Demonstração concluída com sucesso!")
    return results


async def main():
    """Função principal."""
    try:
        results = await demonstrate_adaptive_analysis()
        
        # Salva resultados em arquivo para análise posterior
        output = {
            'demonstration_timestamp': datetime.utcnow().isoformat(),
            'organizations_analyzed': len(results),
            'results_summary': [
                {
                    'organization_name': org.organization_name,
                    'organization_id': org.organization_id,
                    'preset_type': org.preset_type.value,
                    'weights': org.weights.dict(),
                    'weighted_score': result.weighted_score,
                    'total_findings': len(result.findings),
                    'custom_findings': len([f for f in result.findings if f.is_custom_rule]),
                    'executive_summary': result.generate_executive_summary()
                }
                for org, result in results
            ]
        }
        
        with open('/tmp/adaptive_analysis_demo_results.json', 'w') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Resultados salvos em: /tmp/adaptive_analysis_demo_results.json")
        
    except Exception as e:
        print(f"❌ Erro na demonstração: {e}")
        raise


if __name__ == "__main__":
    print("🚀 Iniciando demonstração do motor de análise adaptativo...")
    asyncio.run(main())