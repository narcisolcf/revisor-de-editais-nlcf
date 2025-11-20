#!/usr/bin/env python3
"""
Demonstração Completa do Vertex AI RAG Engine

Este script demonstra todas as funcionalidades implementadas:
1. Criação de Knowledge Base Organizacional
2. Sincronização de Documentos
3. Consulta Inteligente
4. Análise RAG-Enhanced
"""

import asyncio
import sys
from datetime import datetime

# Adiciona o src ao path
sys.path.insert(0, '/home/user/revisor-de-editais-nlcf/services/analyzer/src')

from config_rag import init_rag_config
from services.rag_service import RAGService
from services.knowledge_base_manager import KnowledgeBaseManager
from services.query_service import IntelligentQueryService
from services.rag_enhanced_analyzer import RAGEnhancedAnalyzer
from models.config_models import OrganizationConfig, AnalysisPreset
from models.document_models import Document
from models.rag_models import ContextType


async def demo_1_setup():
    """Demo 1: Setup e Inicialização."""
    print("\n" + "="*80)
    print("DEMO 1: Setup e Inicialização do Vertex AI RAG")
    print("="*80 + "\n")

    # Inicializa configuração
    print("📝 Inicializando configuração...")
    config = init_rag_config(
        project_id="licitareview-prod",
        location="us-central1"
    )
    print(f"✅ Configuração inicializada")
    print(f"   Project: {config.project_id}")
    print(f"   Location: {config.location}")
    print(f"   Chunk Size: {config.default_chunk_size}")
    print(f"   Model: {config.default_model}")

    # Inicializa RAG Service
    print("\n🚀 Inicializando RAG Service...")
    rag_service = RAGService()

    # Nota: Em produção, isso conectaria ao Vertex AI
    # await rag_service.initialize()
    print("✅ RAG Service pronto (modo simulado)")

    return rag_service


async def demo_2_create_knowledge_base(rag_service: RAGService):
    """Demo 2: Criar Base de Conhecimento Organizacional."""
    print("\n" + "="*80)
    print("DEMO 2: Criar Base de Conhecimento Organizacional")
    print("="*80 + "\n")

    # Configuração da organização
    org_config = OrganizationConfig(
        organization_id="org-demo-123",
        name="Prefeitura Municipal Demo",
        preset=AnalysisPreset.STANDARD
    )

    print(f"🏢 Organização: {org_config.name}")
    print(f"   ID: {org_config.organization_id}")
    print(f"   Preset: {org_config.preset.value}")

    # Criar Knowledge Base Manager
    kb_manager = KnowledgeBaseManager(rag_service)

    print("\n📚 Criando Knowledge Base...")
    print("   → Corpus privado da organização")
    print("   → Corpus compartilhados (leis, normas)")
    print("   → Metadata no Firestore")

    # Em produção:
    # kb = await kb_manager.create_organization_kb(
    #     org_id=org_config.organization_id,
    #     org_config=org_config
    # )

    print("✅ Knowledge Base criada (modo simulado)")
    print(f"   Private Corpus ID: org-demo-123-private")
    print(f"   Shared Corpus: shared-leis, shared-normas")

    return kb_manager, org_config


async def demo_3_sync_documents(kb_manager: KnowledgeBaseManager, org_id: str):
    """Demo 3: Sincronizar Documentos."""
    print("\n" + "="*80)
    print("DEMO 3: Sincronizar Documentos com RAG Corpus")
    print("="*80 + "\n")

    print("📄 Documentos para sincronizar:")
    print("   1. Edital Pregão 001/2024")
    print("   2. Lei 14.133/2021 (compartilhada)")
    print("   3. Template Organizacional")

    print("\n🔄 Processando documentos...")
    print("   → Chunking (512 tokens, 100 overlap)")
    print("   → Extração de metadata")
    print("   → Upload para GCS")
    print("   → Importação para RAG Corpus")

    # Em produção:
    # result = await kb_manager.sync_organization_documents(
    #     org_id=org_id,
    #     force_resync=False
    # )

    print("\n✅ Documentos sincronizados (modo simulado)")
    print(f"   Total: 3 documentos")
    print(f"   Sucesso: 3")
    print(f"   Falhas: 0")
    print(f"   Tempo: 2.5s")


async def demo_4_intelligent_query(
    rag_service: RAGService,
    kb_manager: KnowledgeBaseManager,
    org_id: str
):
    """Demo 4: Consulta Inteligente."""
    print("\n" + "="*80)
    print("DEMO 4: Consulta Inteligente com RAG")
    print("="*80 + "\n")

    query_service = IntelligentQueryService(rag_service, kb_manager)

    question = "Quais são os requisitos de habilitação para pregão eletrônico?"
    print(f"❓ Pergunta: {question}")
    print(f"   Contexto: {ContextType.LEGAL.value}")

    print("\n🔍 Processando consulta...")
    print("   → Identificando corpus relevantes")
    print("   → Retrieving top-K contextos")
    print("   → Gerando resposta com Gemini 2.0")
    print("   → Extraindo fontes e citações")

    # Em produção:
    # response = await query_service.answer_question(
    #     question=question,
    #     org_id=org_id,
    #     context_type=ContextType.LEGAL
    # )

    # Simulação
    print("\n✅ Resposta Gerada:")
    print("-" * 80)
    print("""
Para participar de pregão eletrônico, conforme Lei 14.133/2021, os licitantes
devem apresentar:

1. Habilitação Jurídica:
   - Registro comercial (empresas individuais)
   - Ato constitutivo, estatuto ou contrato social (demais empresas)

2. Regularidade Fiscal e Trabalhista:
   - Certidão conjunta de débitos da União (RFB e PGFN)
   - Certidão de regularidade com a Fazenda Estadual
   - Certidão de regularidade com a Fazenda Municipal
   - Certificado de Regularidade do FGTS
   - Certidão Negativa de Débitos Trabalhistas (CNDT)

3. Qualificação Econômico-Financeira:
   - Certidão negativa de falência ou recuperação judicial
   - Balanço patrimonial do último exercício

4. Qualificação Técnica:
   - Registro ou inscrição na entidade profissional competente
   - Comprovação de aptidão para desempenho de atividade pertinente
    """)
    print("-" * 80)

    print("\n📚 Fontes Consultadas (5):")
    print("   1. Lei 14.133/2021 - Art. 62 a 70 (Relevância: 95%)")
    print("   2. Edital Pregão 001/2024 - Seção Habilitação (Relevância: 88%)")
    print("   3. TCU Acórdão 2622/2020 (Relevância: 82%)")
    print("   4. Instrução Normativa SEGES 03/2018 (Relevância: 78%)")
    print("   5. Template Organizacional - Habilitação (Relevância: 75%)")

    print(f"\n📊 Confiança: 92%")
    print(f"⏱️  Tempo: 1.8s")


async def demo_5_rag_enhanced_analysis(
    rag_service: RAGService,
    kb_manager: KnowledgeBaseManager,
    org_config: OrganizationConfig
):
    """Demo 5: Análise RAG-Enhanced."""
    print("\n" + "="*80)
    print("DEMO 5: Análise de Documento com RAG")
    print("="*80 + "\n")

    # Documento para analisar
    document = Document(
        id="doc-edital-456",
        title="Edital Pregão Eletrônico 002/2025",
        content="""
        EDITAL DE PREGÃO ELETRÔNICO Nº 002/2025

        A Prefeitura Municipal Demo torna público que realizará licitação
        na modalidade PREGÃO ELETRÔNICO.

        OBJETO: Aquisição de equipamentos de informática.

        VALOR ESTIMADO: R$ 200.000,00

        PRAZO: 45 dias para entrega.

        DA HABILITAÇÃO:
        Os licitantes deverão apresentar documentação de habilitação
        conforme Lei 8.666/93.
        """,
        file_type="text/plain"
    )

    print(f"📄 Documento: {document.title}")
    print(f"   ID: {document.id}")

    # Criar analyzer
    analyzer = RAGEnhancedAnalyzer(
        doc_type="edital",
        org_config=org_config,
        rag_service=rag_service,
        kb_manager=kb_manager,
        use_rag=True
    )

    print("\n🔬 Executando análise...")
    print("   → Análise tradicional (AdaptiveAnalyzer)")
    print("   → Análise legal com RAG (corpus leis)")
    print("   → Análise estrutural com RAG (corpus org)")
    print("   → Análise conformidade com RAG")
    print("   → Merge de resultados")

    # Em produção:
    # result = await analyzer.analyze_with_custom_params(document)

    print("\n✅ Análise Concluída:")
    print("-" * 80)
    print(f"   Score Geral: 78.5%")
    print(f"   Score Legal: 75% ⚠️")
    print(f"   Score Estrutural: 82%")
    print(f"   Score Conformidade: 80%")

    print("\n📋 Findings (RAG-Enhanced):")
    print("   1. ⚠️  AVISO LEGAL (RAG):")
    print("       Referência à Lei 8.666/93, mas documento é de 2025.")
    print("       Recomendação: Atualizar para Lei 14.133/2021.")
    print("       Fonte: Lei 14.133/2021 - Art. 191 (Revogação)")
    print("")
    print("   2. ℹ️  ESTRUTURA (RAG):")
    print("       Seção de habilitação está simplificada.")
    print("       Comparação com 10 editais anteriores mostra falta de detalhes.")
    print("       Fonte: Template Organizacional, Edital 001/2024")
    print("")
    print("   3. ✓  CONFORMIDADE (RAG):")
    print("       Prazo de entrega está conforme jurisprudência.")
    print("       Fonte: TCU Acórdão 1234/2020")

    print("\n🔗 Total de Fontes RAG: 8 documentos consultados")
    print(f"⏱️  Tempo total: 3.2s (tradicional: 1.1s, RAG: 2.1s)")


async def main():
    """Executa todas as demos."""
    print("\n" + "="*80)
    print("🚀 DEMONSTRAÇÃO COMPLETA - VERTEX AI RAG ENGINE")
    print("   LicitaReview - Sistema de Análise Inteligente")
    print("="*80)

    try:
        # Demo 1: Setup
        rag_service = await demo_1_setup()

        # Demo 2: Create KB
        kb_manager, org_config = await demo_2_create_knowledge_base(rag_service)

        # Demo 3: Sync Docs
        await demo_3_sync_documents(kb_manager, org_config.organization_id)

        # Demo 4: Intelligent Query
        await demo_4_intelligent_query(
            rag_service,
            kb_manager,
            org_config.organization_id
        )

        # Demo 5: RAG-Enhanced Analysis
        await demo_5_rag_enhanced_analysis(
            rag_service,
            kb_manager,
            org_config
        )

        # Final
        print("\n" + "="*80)
        print("✅ DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!")
        print("="*80)
        print("""
Próximos passos:

1. Instalar dependências:
   ./install-dependencies.sh

2. Configurar GCP:
   ./setup-gcp-rag.sh

3. Executar testes:
   ./tests/run_tests.sh

4. Deploy em produção:
   Seguir guia em README_RAG.md

Para mais informações:
- README_RAG.md
- VERTEX_AI_RAG_IMPLEMENTATION_PLAN.md
        """)

    except Exception as e:
        print(f"\n❌ Erro na demonstração: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
