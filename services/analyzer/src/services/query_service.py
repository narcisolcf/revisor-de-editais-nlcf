"""
Intelligent Query Service

Serviço para consultas inteligentes usando RAG.
Permite perguntas e respostas fundamentadas na base de conhecimento.
"""

import time
from typing import Optional
import structlog

from ..config_rag import get_rag_config
from ..models.rag_models import (
    QueryResponse,
    Source,
    ContextType,
)

from .rag_service import RAGService
from .knowledge_base_manager import KnowledgeBaseManager

logger = structlog.get_logger(__name__)


class IntelligentQueryService:
    """
    Serviço de consultas inteligentes com RAG.

    Features:
    - Responde perguntas usando base de conhecimento
    - Cita fontes específicas
    - Suporta diferentes tipos de contexto
    - Alta confiabilidade (fundamentado em documentos)
    """

    def __init__(
        self,
        rag_service: RAGService,
        kb_manager: KnowledgeBaseManager
    ):
        """
        Inicializa o serviço.

        Args:
            rag_service: Serviço RAG
            kb_manager: Gerenciador de knowledge base
        """
        self.config = get_rag_config()
        self.rag_service = rag_service
        self.kb_manager = kb_manager
        self.logger = structlog.get_logger(self.__class__.__name__)

    async def answer_question(
        self,
        question: str,
        org_id: str,
        context_type: ContextType = ContextType.ALL,
        include_reasoning: bool = True
    ) -> QueryResponse:
        """
        Responde pergunta usando base de conhecimento.

        Args:
            question: Pergunta do usuário
            org_id: ID da organização
            context_type: Tipo de contexto para busca
            include_reasoning: Incluir raciocínio na resposta

        Returns:
            Resposta com fontes citadas
        """
        self.logger.info(
            "❓ Answering question",
            org_id=org_id,
            question_length=len(question),
            context_type=context_type.value
        )

        start_time = time.time()

        try:
            # 1. Obtém corpus relevantes
            corpus_ids = await self.kb_manager.get_corpus_for_context(
                org_id,
                context_type
            )

            if not corpus_ids:
                return self._create_no_corpus_response(question, context_type)

            # 2. Usa o primeiro corpus (pode ser expandido para buscar em múltiplos)
            primary_corpus_id = corpus_ids[0]

            # 3. Recupera contextos relevantes
            retrieval_result = await self.rag_service.retrieve_contexts(
                corpus_id=primary_corpus_id,
                query=question,
                similarity_top_k=5  # Top 5 contextos mais relevantes
            )

            # 4. Monta prompt enriquecido
            enriched_prompt = self._build_query_prompt(
                question,
                retrieval_result.contexts,
                include_reasoning
            )

            # 5. Gera resposta com RAG
            rag_response = await self.rag_service.generate_with_rag(
                corpus_id=primary_corpus_id,
                query=enriched_prompt,
                temperature=0.2  # Mais determinístico para Q&A
            )

            # 6. Extrai fontes
            sources = self._convert_contexts_to_sources(
                retrieval_result.contexts
            )

            # Merge com fontes do RAG
            if rag_response.sources:
                sources.extend(rag_response.sources)

            # Remove duplicatas
            unique_sources = self._deduplicate_sources(sources)

            # 7. Calcula confiança
            confidence = self._calculate_confidence(
                retrieval_result.contexts,
                rag_response
            )

            generation_time = time.time() - start_time

            response = QueryResponse(
                question=question,
                answer=rag_response.answer,
                sources=unique_sources[:10],  # Top 10 fontes
                confidence=confidence,
                context_type=context_type,
                retrieval_info={
                    'corpus_ids_searched': corpus_ids,
                    'contexts_found': retrieval_result.total_found,
                    'generation_time_ms': generation_time * 1000
                }
            )

            self.logger.info(
                "✅ Question answered",
                org_id=org_id,
                confidence=f"{confidence:.2%}",
                sources_count=len(unique_sources),
                generation_time=f"{generation_time:.2f}s"
            )

            return response

        except Exception as e:
            self.logger.error(
                "❌ Failed to answer question",
                org_id=org_id,
                error=str(e)
            )

            return self._create_error_response(question, str(e), context_type)

    async def generate_suggestions(
        self,
        topic: str,
        org_id: str,
        max_suggestions: int = 5
    ) -> list[str]:
        """
        Gera sugestões de perguntas sobre um tópico.

        Args:
            topic: Tópico de interesse
            org_id: ID da organização
            max_suggestions: Número máximo de sugestões

        Returns:
            Lista de perguntas sugeridas
        """
        self.logger.info(
            "💡 Generating question suggestions",
            org_id=org_id,
            topic=topic
        )

        try:
            corpus_ids = await self.kb_manager.get_corpus_for_context(
                org_id,
                ContextType.ALL
            )

            if not corpus_ids:
                return []

            prompt = f"""
            Baseado nos documentos disponíveis sobre licitações públicas,
            sugira {max_suggestions} perguntas relevantes sobre: {topic}

            As perguntas devem ser:
            - Práticas e úteis para gestores públicos
            - Específicas e objetivas
            - Relacionadas a conformidade legal e boas práticas

            Liste apenas as perguntas, uma por linha.
            """

            rag_response = await self.rag_service.generate_with_rag(
                corpus_id=corpus_ids[0],
                query=prompt,
                temperature=0.7  # Mais criativo para sugestões
            )

            # Extrai perguntas do texto
            suggestions = self._extract_questions(rag_response.answer)

            self.logger.info(
                "✅ Suggestions generated",
                count=len(suggestions)
            )

            return suggestions[:max_suggestions]

        except Exception as e:
            self.logger.error(
                "❌ Failed to generate suggestions",
                error=str(e)
            )
            return []

    # ==================== Helper Methods ====================

    def _build_query_prompt(
        self,
        question: str,
        contexts: list,
        include_reasoning: bool
    ) -> str:
        """Monta prompt enriquecido para geração."""
        prompt = f"""
        Você é um especialista em licitações públicas e legislação brasileira.

        Pergunta: {question}

        """

        if include_reasoning:
            prompt += """
        Por favor:
        1. Analise a pergunta cuidadosamente
        2. Baseie sua resposta nos documentos fornecidos
        3. Cite as fontes específicas quando relevante
        4. Seja claro, objetivo e técnico
        5. Se não houver informação suficiente, indique isso

        """

        prompt += """
        Forneça uma resposta fundamentada e precisa.
        """

        return prompt

    def _convert_contexts_to_sources(self, contexts: list) -> list[Source]:
        """Converte contextos recuperados em fontes."""
        sources = []

        for ctx in contexts:
            source = Source(
                title=ctx.source_file_name,
                excerpt=ctx.chunk_text[:200] + "..." if len(ctx.chunk_text) > 200 else ctx.chunk_text,
                relevance_score=ctx.relevance_score,
                document_id=ctx.source_document_id,
                metadata=ctx.metadata
            )
            sources.append(source)

        return sources

    def _deduplicate_sources(self, sources: list[Source]) -> list[Source]:
        """Remove fontes duplicadas."""
        seen = set()
        unique_sources = []

        for source in sources:
            if source.document_id not in seen:
                seen.add(source.document_id)
                unique_sources.append(source)

        # Ordena por relevância
        unique_sources.sort(key=lambda s: s.relevance_score, reverse=True)

        return unique_sources

    def _calculate_confidence(
        self,
        contexts: list,
        rag_response
    ) -> float:
        """Calcula confiança na resposta."""
        if not contexts:
            return 0.1  # Baixa confiança sem contextos

        # Média das relevâncias dos top 3 contextos
        top_contexts = sorted(contexts, key=lambda c: c.relevance_score, reverse=True)[:3]
        avg_relevance = sum(c.relevance_score for c in top_contexts) / len(top_contexts)

        # Ajusta pela quantidade de contextos
        context_factor = min(len(contexts) / 5.0, 1.0)  # Max em 5 contextos

        # Confiança base do RAG
        base_confidence = rag_response.confidence

        # Combina fatores
        final_confidence = (avg_relevance * 0.5) + (context_factor * 0.2) + (base_confidence * 0.3)

        return min(final_confidence, 1.0)

    def _extract_questions(self, text: str) -> list[str]:
        """Extrai perguntas de um texto."""
        lines = text.strip().split('\n')
        questions = []

        for line in lines:
            line = line.strip()
            # Remove numeração
            line = line.lstrip('0123456789.-) ')

            if line and '?' in line:
                questions.append(line)

        return questions

    def _create_no_corpus_response(
        self,
        question: str,
        context_type: ContextType
    ) -> QueryResponse:
        """Cria resposta quando não há corpus disponível."""
        return QueryResponse(
            question=question,
            answer="Desculpe, não há base de conhecimento disponível para responder esta pergunta. "
                   "Por favor, sincronize os documentos da organização primeiro.",
            sources=[],
            confidence=0.0,
            context_type=context_type,
            retrieval_info={'error': 'no_corpus_available'}
        )

    def _create_error_response(
        self,
        question: str,
        error: str,
        context_type: ContextType
    ) -> QueryResponse:
        """Cria resposta de erro."""
        return QueryResponse(
            question=question,
            answer=f"Ocorreu um erro ao processar sua pergunta: {error}",
            sources=[],
            confidence=0.0,
            context_type=context_type,
            retrieval_info={'error': error}
        )
