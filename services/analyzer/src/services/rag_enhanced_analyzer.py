"""
RAG-Enhanced Adaptive Analyzer

Extensão do AdaptiveAnalyzer que adiciona capacidades de análise
fundamentada usando Vertex AI RAG Engine.

Combina análise tradicional com insights gerados a partir da base de conhecimento.
"""

import time
from typing import Optional, List
import structlog

from ..models.document_models import Document
from ..models.config_models import OrganizationConfig
from ..models.analysis_models import AnalysisResult
from ..models.rag_models import (
    RAGInsights,
    LegalInsight,
    StructuralInsight,
    ConformityInsight,
    Source,
)

from .adaptive_analyzer import AdaptiveAnalyzer
from .rag_service import RAGService
from .knowledge_base_manager import KnowledgeBaseManager

logger = structlog.get_logger(__name__)


class RAGEnhancedAnalyzer:
    """
    Analisador adaptativo enriquecido com RAG.

    Combina:
    1. Análise tradicional do AdaptiveAnalyzer
    2. Insights fundamentados do RAG
    3. Citações e referências a documentos reais

    Result: Análise mais precisa e confiável
    """

    def __init__(
        self,
        doc_type: str,
        org_config: OrganizationConfig,
        rag_service: Optional[RAGService] = None,
        kb_manager: Optional[KnowledgeBaseManager] = None,
        use_rag: bool = True
    ):
        """
        Inicializa o analisador.

        Args:
            doc_type: Tipo do documento
            org_config: Configuração da organização
            rag_service: Serviço RAG (opcional)
            kb_manager: Gerenciador de KB (opcional)
            use_rag: Se deve usar RAG
        """
        self.doc_type = doc_type
        self.org_config = org_config
        self.rag_service = rag_service
        self.kb_manager = kb_manager
        self.use_rag = use_rag and rag_service is not None

        # Analisador tradicional
        self.traditional_analyzer = AdaptiveAnalyzer()

        self.logger = structlog.get_logger(self.__class__.__name__)

    async def analyze_with_custom_params(
        self,
        document: Document
    ) -> AnalysisResult:
        """
        Executa análise completa (tradicional + RAG).

        Args:
            document: Documento para analisar

        Returns:
            Resultado da análise enriquecido
        """
        self.logger.info(
            "🔬 Starting RAG-enhanced analysis",
            document_id=document.id,
            use_rag=self.use_rag
        )

        start_time = time.time()

        try:
            # 1. Análise tradicional (sempre executada)
            traditional_result = await self._traditional_analysis(document)

            # 2. Análise RAG (se habilitado)
            if self.use_rag:
                rag_insights = await self._rag_enhanced_analysis(document)

                # 3. Merge resultados
                enhanced_result = await self._merge_results(
                    traditional_result,
                    rag_insights
                )

                execution_time = time.time() - start_time

                self.logger.info(
                    "✅ RAG-enhanced analysis completed",
                    document_id=document.id,
                    rag_sources=rag_insights.total_sources,
                    execution_time=f"{execution_time:.2f}s"
                )

                return enhanced_result
            else:
                # RAG desabilitado - retorna análise tradicional
                self.logger.info(
                    "✅ Traditional analysis completed (RAG disabled)",
                    document_id=document.id
                )
                return traditional_result

        except Exception as e:
            self.logger.error(
                "❌ Analysis failed",
                document_id=document.id,
                error=str(e)
            )
            raise

    async def _traditional_analysis(
        self,
        document: Document
    ) -> AnalysisResult:
        """Executa análise tradicional."""
        # Aqui usaria o AdaptiveAnalyzer real
        # Por ora, retorna um resultado simulado

        from ..models.analysis_models import Finding, FindingSeverity

        return AnalysisResult(
            document_id=document.id,
            weighted_score=75.0,
            category_scores={
                'structural': 80.0,
                'legal': 70.0,
                'clarity': 75.0,
                'abnt': 75.0
            },
            findings=[
                Finding(
                    category='legal',
                    severity=FindingSeverity.WARNING,
                    title='Possível incompatibilidade legal',
                    description='Verificar conformidade com Lei 14.133/21',
                    location='Seção 2.1',
                    confidence=0.7
                )
            ],
            analysis_metadata={
                'analyzer': 'traditional',
                'doc_type': self.doc_type
            }
        )

    async def _rag_enhanced_analysis(
        self,
        document: Document
    ) -> RAGInsights:
        """
        Análise enriquecida com RAG.

        Gera insights fundamentados em:
        - Legislação
        - Editais anteriores
        - Normas e jurisprudência
        """
        self.logger.info(
            "🤖 Running RAG-enhanced analysis",
            document_id=document.id
        )

        start_time = time.time()
        insights = RAGInsights()

        try:
            # Obtém knowledge base
            kb = await self.kb_manager.get_organization_kb(
                self.org_config.organization_id
            )

            if not kb:
                self.logger.warning(
                    "⚠️ No knowledge base found, skipping RAG analysis",
                    org_id=self.org_config.organization_id
                )
                return insights

            # Análise Legal com RAG
            insights.legal = await self._analyze_legal_with_rag(
                document,
                kb.get_all_corpus_ids()
            )

            # Análise Estrutural com RAG
            insights.structural = await self._analyze_structure_with_rag(
                document,
                kb.private_corpus_id
            )

            # Análise de Conformidade com RAG
            insights.conformity = await self._check_conformity_with_rag(
                document,
                kb.get_all_corpus_ids()
            )

            # Calcula confiança geral
            confidences = []
            if insights.legal:
                confidences.append(insights.legal.confidence)
            if insights.structural:
                confidences.append(insights.structural.confidence)
            if insights.conformity:
                confidences.append(insights.conformity.confidence)

            insights.overall_confidence = (
                sum(confidences) / len(confidences) if confidences else 0.0
            )

            # Conta fontes únicas
            all_sources = insights.get_all_sources()
            insights.total_sources = len(all_sources)

            # Tempo de geração
            insights.generation_time_ms = (time.time() - start_time) * 1000

            return insights

        except Exception as e:
            self.logger.error(
                "❌ RAG analysis failed",
                document_id=document.id,
                error=str(e)
            )
            return insights

    async def _analyze_legal_with_rag(
        self,
        document: Document,
        corpus_ids: List[str]
    ) -> Optional[LegalInsight]:
        """
        Análise legal fundamentada em documentos.

        Verifica:
        - Conformidade com legislação
        - Requisitos obrigatórios
        - Prazos legais
        - Citações corretas
        """
        self.logger.debug("⚖️ Analyzing legal aspects with RAG")

        try:
            # Extrai trechos relevantes para análise legal
            content_sample = document.content[:2000] if document.content else ''

            query = f"""
            Analise os aspectos legais do seguinte trecho de documento licitatório:

            {content_sample}

            Verifique:
            1. Conformidade com Lei 14.133/2021 (Nova Lei de Licitações)
            2. Conformidade com Lei 8.666/1993 (se aplicável)
            3. Requisitos de habilitação adequados
            4. Prazos conforme legislação vigente
            5. Obrigatoriedade de publicação nos meios corretos

            Cite os artigos e leis específicos relevantes.
            Liste recomendações práticas para garantir conformidade.
            """

            # Gera com RAG
            rag_response = await self.rag_service.generate_with_rag(
                corpus_id=corpus_ids[0],  # Usa primeiro corpus
                query=query,
                model_name="gemini-2.0-flash-001",
                temperature=0.2
            )

            # Extrai informações
            cited_laws = self._extract_cited_laws(rag_response.answer)
            recommendations = self._extract_recommendations(rag_response.answer)

            insight = LegalInsight(
                analysis_text=rag_response.answer,
                cited_laws=cited_laws,
                cited_articles=[],  # Poderia extrair artigos específicos
                sources=rag_response.sources,
                confidence=rag_response.confidence,
                recommendations=recommendations
            )

            return insight

        except Exception as e:
            self.logger.error(
                "❌ Legal RAG analysis failed",
                error=str(e)
            )
            return None

    async def _analyze_structure_with_rag(
        self,
        document: Document,
        corpus_id: str
    ) -> Optional[StructuralInsight]:
        """
        Análise estrutural comparando com templates.

        Compara documento atual com:
        - Templates organizacionais
        - Editais anteriores aprovados
        - Estruturas padrão
        """
        self.logger.debug("📋 Analyzing structure with RAG")

        try:
            query = f"""
            Compare a estrutura deste documento com os templates e editais anteriores:

            Documento em análise (primeiras seções):
            {document.content[:1500] if document.content else ''}

            Identifique:
            1. Seções obrigatórias presentes/ausentes
            2. Ordem e organização das seções
            3. Desvios em relação aos padrões da organização
            4. Elementos estruturais que podem ser melhorados

            Liste os desvios encontrados e sugestões de melhoria.
            """

            rag_response = await self.rag_service.generate_with_rag(
                corpus_id=corpus_id,
                query=query,
                temperature=0.3
            )

            # Extrai desvios
            deviations = self._extract_deviations(rag_response.answer)

            insight = StructuralInsight(
                analysis_text=rag_response.answer,
                template_matches=[],  # Poderia detectar templates matched
                deviations=deviations,
                sources=rag_response.sources,
                confidence=rag_response.confidence
            )

            return insight

        except Exception as e:
            self.logger.error(
                "❌ Structural RAG analysis failed",
                error=str(e)
            )
            return None

    async def _check_conformity_with_rag(
        self,
        document: Document,
        corpus_ids: List[str]
    ) -> Optional[ConformityInsight]:
        """
        Verifica conformidade com normas e padrões.

        Checks:
        - Normas ABNT
        - Padrões organizacionais
        - Boas práticas do setor
        """
        self.logger.debug("✓ Checking conformity with RAG")

        try:
            query = f"""
            Verifique a conformidade deste documento com normas e boas práticas:

            {document.content[:1500] if document.content else ''}

            Analise:
            1. Conformidade com normas ABNT aplicáveis
            2. Aderência aos padrões organizacionais
            3. Aplicação de boas práticas em licitações
            4. Requisitos técnicos e formais

            Liste itens conformes e não conformes separadamente.
            """

            rag_response = await self.rag_service.generate_with_rag(
                corpus_id=corpus_ids[0],
                query=query,
                temperature=0.2
            )

            # Extrai itens conformes e não conformes
            compliant, non_compliant = self._extract_conformity_items(
                rag_response.answer
            )

            insight = ConformityInsight(
                analysis_text=rag_response.answer,
                compliant_items=compliant,
                non_compliant_items=non_compliant,
                sources=rag_response.sources,
                confidence=rag_response.confidence
            )

            return insight

        except Exception as e:
            self.logger.error(
                "❌ Conformity RAG analysis failed",
                error=str(e)
            )
            return None

    async def _merge_results(
        self,
        traditional_result: AnalysisResult,
        rag_insights: RAGInsights
    ) -> AnalysisResult:
        """
        Combina resultados tradicional + RAG.

        Strategy:
        - Mantém scores tradicionais
        - Adiciona insights RAG nos findings
        - Enriquece metadata com fontes
        - Aumenta confiança geral
        """
        from ..models.analysis_models import Finding, FindingSeverity

        # Copia resultado tradicional
        enhanced = traditional_result

        # Adiciona findings do RAG
        if rag_insights.legal:
            for rec in rag_insights.legal.recommendations:
                enhanced.findings.append(
                    Finding(
                        category='legal',
                        severity=FindingSeverity.INFO,
                        title='Recomendação Legal (RAG)',
                        description=rec,
                        location='Análise RAG',
                        confidence=rag_insights.legal.confidence,
                        source='rag'
                    )
                )

        if rag_insights.structural and rag_insights.structural.deviations:
            for deviation in rag_insights.structural.deviations:
                enhanced.findings.append(
                    Finding(
                        category='structural',
                        severity=FindingSeverity.WARNING,
                        title='Desvio Estrutural (RAG)',
                        description=deviation,
                        location='Análise RAG',
                        confidence=rag_insights.structural.confidence,
                        source='rag'
                    )
                )

        if rag_insights.conformity and rag_insights.conformity.non_compliant_items:
            for item in rag_insights.conformity.non_compliant_items:
                enhanced.findings.append(
                    Finding(
                        category='abnt',
                        severity=FindingSeverity.ERROR,
                        title='Não Conformidade (RAG)',
                        description=item,
                        location='Análise RAG',
                        confidence=rag_insights.conformity.confidence,
                        source='rag'
                    )
                )

        # Enriquece metadata
        enhanced.analysis_metadata['rag_enabled'] = True
        enhanced.analysis_metadata['rag_confidence'] = rag_insights.overall_confidence
        enhanced.analysis_metadata['rag_sources'] = rag_insights.total_sources
        enhanced.analysis_metadata['rag_generation_time_ms'] = rag_insights.generation_time_ms

        # Adiciona fontes ao metadata
        all_sources = rag_insights.get_all_sources()
        enhanced.analysis_metadata['sources'] = [
            {
                'title': s.title,
                'document_id': s.document_id,
                'relevance': s.relevance_score
            }
            for s in all_sources[:10]  # Top 10 fontes
        ]

        return enhanced

    # ==================== Helper Methods ====================

    def _extract_cited_laws(self, text: str) -> List[str]:
        """Extrai leis citadas do texto."""
        import re

        laws = []
        patterns = [
            r'Lei\s+(?:nº\s*)?(\d+\.?\d*(?:/\d+)?)',
            r'Lei\s+Federal\s+(?:nº\s*)?(\d+\.?\d*(?:/\d+)?)',
        ]

        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            laws.extend(matches)

        # Remove duplicatas
        return list(set(laws))

    def _extract_recommendations(self, text: str) -> List[str]:
        """Extrai recomendações do texto."""
        recommendations = []

        # Procura por linhas que parecem recomendações
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            # Detecta bullet points, numeração, etc
            if re.match(r'^[-*•]\s+', line) or re.match(r'^\d+[.)]\s+', line):
                # Remove prefixo
                rec = re.sub(r'^[-*•\d.)\s]+', '', line).strip()
                if len(rec) > 10:  # Recomendação mínima
                    recommendations.append(rec)

        return recommendations[:10]  # Limita a 10

    def _extract_deviations(self, text: str) -> List[str]:
        """Extrai desvios do texto."""
        # Similar a extract_recommendations
        return self._extract_recommendations(text)

    def _extract_conformity_items(self, text: str) -> tuple[List[str], List[str]]:
        """Extrai itens conformes e não conformes."""
        compliant = []
        non_compliant = []

        lines = text.split('\n')
        current_section = None

        for line in lines:
            line_lower = line.lower()

            # Detecta seções
            if 'conforme' in line_lower or 'adequado' in line_lower:
                current_section = 'compliant'
            elif 'não conforme' in line_lower or 'inadequado' in line_lower:
                current_section = 'non_compliant'

            # Extrai items
            if re.match(r'^[-*•\d.)\s]+', line):
                item = re.sub(r'^[-*•\d.)\s]+', '', line).strip()
                if len(item) > 10:
                    if current_section == 'compliant':
                        compliant.append(item)
                    elif current_section == 'non_compliant':
                        non_compliant.append(item)

        return compliant[:10], non_compliant[:10]
