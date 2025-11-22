"""
RAG Enhancements - Melhorias Avançadas para o Sistema RAG

Este módulo implementa técnicas avançadas de RAG para melhorar
a qualidade das análises e respostas do sistema.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple, Any
from enum import Enum
import re
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class ChunkingStrategy(str, Enum):
    """Estratégias de chunking."""
    FIXED = "fixed"              # Tamanho fixo
    SEMANTIC = "semantic"        # Por semântica (parágrafos, seções)
    HYBRID = "hybrid"            # Combinação
    ADAPTIVE = "adaptive"        # Adaptativo por tipo de documento


class QueryExpansionMethod(str, Enum):
    """Métodos de expansão de query."""
    SYNONYMS = "synonyms"        # Sinônimos
    LEGAL_TERMS = "legal_terms"  # Termos jurídicos relacionados
    ACRONYMS = "acronyms"        # Expansão de siglas
    CONTEXT = "context"          # Contexto do domínio


@dataclass
class ChunkMetadata:
    """Metadata enriquecida para chunks."""
    chunk_id: str
    document_id: str
    chunk_index: int

    # Positioning
    start_char: int
    end_char: int
    section: Optional[str] = None
    subsection: Optional[str] = None

    # Content analysis
    has_numbers: bool = False
    has_values: bool = False
    has_dates: bool = False
    has_legal_refs: bool = False

    # Quality metrics
    completeness_score: float = 0.0
    coherence_score: float = 0.0

    # Semantic info
    main_topics: List[str] = field(default_factory=list)
    entities: List[str] = field(default_factory=list)


@dataclass
class EnhancedChunk:
    """Chunk com metadata enriquecida."""
    text: str
    metadata: ChunkMetadata
    embedding: Optional[List[float]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            'text': self.text,
            'metadata': {
                'chunk_id': self.metadata.chunk_id,
                'document_id': self.metadata.document_id,
                'chunk_index': self.metadata.chunk_index,
                'start_char': self.metadata.start_char,
                'end_char': self.metadata.end_char,
                'section': self.metadata.section,
                'has_numbers': self.metadata.has_numbers,
                'has_values': self.metadata.has_values,
                'has_dates': self.metadata.has_dates,
                'completeness_score': self.metadata.completeness_score,
                'main_topics': self.metadata.main_topics,
            }
        }


class AdaptiveChunker:
    """
    Chunker adaptativo que ajusta a estratégia baseado no tipo de documento.

    Diferentes tipos de documentos (editais, contratos, leis) têm estruturas
    diferentes e requerem estratégias de chunking específicas.
    """

    def __init__(self):
        # Tamanhos adaptativos por tipo de documento
        self.chunk_sizes = {
            'edital': 700,      # Editais são mais estruturados
            'contrato': 600,    # Contratos têm cláusulas
            'lei': 800,         # Leis têm artigos longos
            'default': 512,
        }

        # Padrões para detecção de seções
        self.section_patterns = {
            'edital': r'(?:ANEXO|CAPÍTULO|SEÇÃO|ITEM)\s+[IVX0-9]+',
            'contrato': r'CLÁUSULA\s+[IVX0-9]+',
            'lei': r'Art\.?\s*\d+|Artigo\s+\d+|CAPÍTULO\s+[IVX]+',
        }

    def chunk_document(
        self,
        text: str,
        document_id: str,
        document_type: str = 'default',
        strategy: ChunkingStrategy = ChunkingStrategy.ADAPTIVE
    ) -> List[EnhancedChunk]:
        """
        Divide documento em chunks adaptativos.

        Args:
            text: Texto do documento
            document_id: ID do documento
            document_type: Tipo do documento (edital, contrato, lei)
            strategy: Estratégia de chunking

        Returns:
            Lista de chunks enriquecidos
        """
        if strategy == ChunkingStrategy.SEMANTIC:
            return self._semantic_chunking(text, document_id, document_type)
        elif strategy == ChunkingStrategy.ADAPTIVE:
            return self._adaptive_chunking(text, document_id, document_type)
        else:
            return self._fixed_chunking(text, document_id, document_type)

    def _adaptive_chunking(
        self,
        text: str,
        document_id: str,
        document_type: str
    ) -> List[EnhancedChunk]:
        """Chunking adaptativo baseado na estrutura do documento."""
        chunks = []
        chunk_size = self.chunk_sizes.get(document_type, 512)

        # Detectar seções
        sections = self._detect_sections(text, document_type)

        if sections:
            # Chunking por seção
            for section_name, section_text, start_pos in sections:
                section_chunks = self._chunk_section(
                    section_text,
                    document_id,
                    section_name,
                    start_pos,
                    chunk_size
                )
                chunks.extend(section_chunks)
        else:
            # Fallback para chunking fixo
            chunks = self._fixed_chunking(text, document_id, document_type)

        return chunks

    def _semantic_chunking(
        self,
        text: str,
        document_id: str,
        document_type: str
    ) -> List[EnhancedChunk]:
        """Chunking semântico por parágrafos e seções."""
        chunks = []

        # Dividir por parágrafos duplos
        paragraphs = re.split(r'\n\s*\n', text)

        current_chunk = []
        current_size = 0
        chunk_size = self.chunk_sizes.get(document_type, 512)
        start_pos = 0

        for i, para in enumerate(paragraphs):
            para = para.strip()
            if not para:
                continue

            para_size = len(para)

            if current_size + para_size > chunk_size and current_chunk:
                # Criar chunk
                chunk_text = '\n\n'.join(current_chunk)
                metadata = self._create_metadata(
                    chunk_text,
                    document_id,
                    len(chunks),
                    start_pos,
                    start_pos + len(chunk_text)
                )
                chunks.append(EnhancedChunk(text=chunk_text, metadata=metadata))

                # Reset
                current_chunk = [para]
                current_size = para_size
                start_pos = start_pos + len(chunk_text)
            else:
                current_chunk.append(para)
                current_size += para_size

        # Último chunk
        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            metadata = self._create_metadata(
                chunk_text,
                document_id,
                len(chunks),
                start_pos,
                start_pos + len(chunk_text)
            )
            chunks.append(EnhancedChunk(text=chunk_text, metadata=metadata))

        return chunks

    def _fixed_chunking(
        self,
        text: str,
        document_id: str,
        document_type: str
    ) -> List[EnhancedChunk]:
        """Chunking com tamanho fixo e overlap."""
        chunk_size = self.chunk_sizes.get(document_type, 512)
        overlap = 100
        chunks = []

        start = 0
        chunk_idx = 0

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]

            metadata = self._create_metadata(
                chunk_text,
                document_id,
                chunk_idx,
                start,
                end
            )

            chunks.append(EnhancedChunk(text=chunk_text, metadata=metadata))

            start = end - overlap
            chunk_idx += 1

        return chunks

    def _detect_sections(
        self,
        text: str,
        document_type: str
    ) -> List[Tuple[str, str, int]]:
        """
        Detecta seções no documento.

        Returns:
            Lista de (nome_seção, texto_seção, posição_inicial)
        """
        pattern = self.section_patterns.get(document_type)
        if not pattern:
            return []

        sections = []
        matches = list(re.finditer(pattern, text, re.IGNORECASE))

        for i, match in enumerate(matches):
            section_name = match.group(0)
            start_pos = match.start()

            # Pegar texto até próxima seção
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(text)

            section_text = text[start_pos:end_pos]
            sections.append((section_name, section_text, start_pos))

        return sections

    def _chunk_section(
        self,
        section_text: str,
        document_id: str,
        section_name: str,
        section_start: int,
        chunk_size: int
    ) -> List[EnhancedChunk]:
        """Divide uma seção em chunks."""
        chunks = []
        overlap = 100

        start = 0
        chunk_idx = 0

        while start < len(section_text):
            end = start + chunk_size
            chunk_text = section_text[start:end]

            metadata = self._create_metadata(
                chunk_text,
                document_id,
                chunk_idx,
                section_start + start,
                section_start + end,
                section=section_name
            )

            chunks.append(EnhancedChunk(text=chunk_text, metadata=metadata))

            start = end - overlap
            chunk_idx += 1

        return chunks

    def _create_metadata(
        self,
        text: str,
        document_id: str,
        chunk_idx: int,
        start_char: int,
        end_char: int,
        section: Optional[str] = None
    ) -> ChunkMetadata:
        """Cria metadata enriquecida para o chunk."""
        # Análise de conteúdo
        has_numbers = bool(re.search(r'\d+', text))
        has_values = bool(re.search(r'R\$\s*[\d.,]+', text))
        has_dates = bool(re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', text))
        has_legal_refs = bool(re.search(r'Lei\s+n[°º]?\s*\d+|Art\.?\s*\d+', text, re.IGNORECASE))

        # Score de completude (heurística simples)
        completeness_score = self._calculate_completeness(text)

        # Extrair tópicos principais (palavras-chave)
        main_topics = self._extract_topics(text)

        return ChunkMetadata(
            chunk_id=f"{document_id}-chunk-{chunk_idx}",
            document_id=document_id,
            chunk_index=chunk_idx,
            start_char=start_char,
            end_char=end_char,
            section=section,
            has_numbers=has_numbers,
            has_values=has_values,
            has_dates=has_dates,
            has_legal_refs=has_legal_refs,
            completeness_score=completeness_score,
            main_topics=main_topics,
        )

    def _calculate_completeness(self, text: str) -> float:
        """
        Calcula score de completude do chunk.

        Chunks completos têm:
        - Sentenças completas
        - Não terminam no meio de palavra
        - Têm pontuação adequada
        """
        score = 0.0

        # Termina com pontuação
        if text.strip() and text.strip()[-1] in '.!?':
            score += 0.4

        # Não tem palavras cortadas no final
        if not re.search(r'\w+$', text.strip()):
            score += 0.3

        # Tem pelo menos 2 sentenças completas
        sentences = re.split(r'[.!?]+', text)
        if len([s for s in sentences if len(s.strip()) > 20]) >= 2:
            score += 0.3

        return min(score, 1.0)

    def _extract_topics(self, text: str, top_n: int = 5) -> List[str]:
        """Extrai tópicos principais (palavras-chave) do texto."""
        # Stopwords PT-BR
        stopwords = {
            'o', 'a', 'de', 'da', 'do', 'em', 'para', 'com', 'que', 'e',
            'os', 'as', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'por', 'ao',
        }

        # Tokenizar e filtrar
        words = re.findall(r'\b[a-záàâãéêíóôõúç]{4,}\b', text.lower())
        words = [w for w in words if w not in stopwords]

        # Contar frequência
        word_counts = Counter(words)

        # Retornar top N
        return [word for word, _ in word_counts.most_common(top_n)]


class QueryExpander:
    """
    Expansão de queries para melhorar recall do RAG.

    Expande queries com sinônimos, termos relacionados e contexto
    específico do domínio de licitações.
    """

    def __init__(self):
        # Dicionário de sinônimos do domínio
        self.synonyms = {
            'licitação': ['certame', 'processo licitatório', 'concorrência pública'],
            'contrato': ['ajuste', 'pacto', 'acordo'],
            'edital': ['instrumento convocatório', 'publicação'],
            'pregão': ['modalidade pregão', 'leilão reverso'],
            'proposta': ['oferta', 'lance'],
            'habilitação': ['qualificação', 'capacitação'],
            'impugnação': ['contestação', 'recurso'],
            'prazo': ['período', 'tempo', 'deadline'],
            'valor': ['preço', 'montante', 'quantia'],
        }

        # Expansão de siglas
        self.acronyms = {
            'CPL': 'Comissão Permanente de Licitação',
            'UASG': 'Unidade Administrativa de Serviços Gerais',
            'TCU': 'Tribunal de Contas da União',
            'DOU': 'Diário Oficial da União',
            'SRP': 'Sistema de Registro de Preços',
            'ARP': 'Ata de Registro de Preços',
        }

        # Termos jurídicos relacionados
        self.legal_terms = {
            'Lei 8666': ['lei de licitações', 'modalidades de licitação'],
            'Lei 14133': ['nova lei de licitações', 'marco legal'],
            'pregão eletrônico': ['pregão', 'modalidade eletrônica'],
        }

    def expand_query(
        self,
        query: str,
        methods: List[QueryExpansionMethod] = None
    ) -> List[str]:
        """
        Expande query com múltiplos métodos.

        Args:
            query: Query original
            methods: Métodos de expansão a usar

        Returns:
            Lista de queries expandidas
        """
        if methods is None:
            methods = [
                QueryExpansionMethod.SYNONYMS,
                QueryExpansionMethod.ACRONYMS,
                QueryExpansionMethod.LEGAL_TERMS,
            ]

        expanded_queries = [query]  # Sempre incluir query original

        if QueryExpansionMethod.SYNONYMS in methods:
            expanded_queries.extend(self._expand_with_synonyms(query))

        if QueryExpansionMethod.ACRONYMS in methods:
            expanded_queries.extend(self._expand_acronyms(query))

        if QueryExpansionMethod.LEGAL_TERMS in methods:
            expanded_queries.extend(self._expand_legal_terms(query))

        # Remover duplicatas mantendo ordem
        seen = set()
        unique_queries = []
        for q in expanded_queries:
            if q.lower() not in seen:
                seen.add(q.lower())
                unique_queries.append(q)

        logger.info(f"Query expandida de 1 para {len(unique_queries)} variações")
        return unique_queries

    def _expand_with_synonyms(self, query: str) -> List[str]:
        """Expande com sinônimos."""
        expanded = []
        query_lower = query.lower()

        for term, synonyms in self.synonyms.items():
            if term in query_lower:
                for synonym in synonyms:
                    expanded_query = query_lower.replace(term, synonym)
                    expanded.append(expanded_query)

        return expanded

    def _expand_acronyms(self, query: str) -> List[str]:
        """Expande siglas."""
        expanded = []

        for acronym, full_form in self.acronyms.items():
            if acronym in query:
                # Adicionar forma expandida
                expanded_query = query.replace(acronym, full_form)
                expanded.append(expanded_query)
            elif full_form.lower() in query.lower():
                # Adicionar sigla
                expanded_query = query.replace(full_form, acronym)
                expanded.append(expanded_query)

        return expanded

    def _expand_legal_terms(self, query: str) -> List[str]:
        """Expande termos jurídicos."""
        expanded = []
        query_lower = query.lower()

        for term, related_terms in self.legal_terms.items():
            if term.lower() in query_lower:
                for related in related_terms:
                    expanded.append(f"{query} {related}")

        return expanded


class SemanticDeduplicator:
    """
    Remove chunks semanticamente duplicados ou muito similares.

    Evita redundância no corpus RAG, melhorando qualidade e reduzindo custos.
    """

    def __init__(self, similarity_threshold: float = 0.95):
        """
        Args:
            similarity_threshold: Threshold de similaridade (0-1)
                                 para considerar duplicado
        """
        self.similarity_threshold = similarity_threshold

    def deduplicate(
        self,
        chunks: List[EnhancedChunk],
        embeddings: List[List[float]]
    ) -> Tuple[List[EnhancedChunk], List[int]]:
        """
        Remove chunks duplicados baseado em similaridade semântica.

        Args:
            chunks: Lista de chunks
            embeddings: Embeddings correspondentes

        Returns:
            (chunks_únicos, índices_removidos)
        """
        if not chunks:
            return [], []

        unique_chunks = []
        unique_embeddings = []
        removed_indices = []

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            is_duplicate = False

            # Comparar com chunks já aceitos
            for existing_emb in unique_embeddings:
                similarity = self._cosine_similarity(embedding, existing_emb)

                if similarity >= self.similarity_threshold:
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_chunks.append(chunk)
                unique_embeddings.append(embedding)
            else:
                removed_indices.append(i)

        logger.info(
            f"Deduplicação: {len(chunks)} → {len(unique_chunks)} chunks "
            f"({len(removed_indices)} removidos)"
        )

        return unique_chunks, removed_indices

    def _cosine_similarity(
        self,
        vec1: List[float],
        vec2: List[float]
    ) -> float:
        """Calcula similaridade de cosseno entre dois vetores."""
        if len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return dot_product / (norm1 * norm2)


class CitationQualityScorer:
    """
    Avalia a qualidade das citações retornadas pelo RAG.

    Citações de alta qualidade devem:
    - Ser relevantes para a query
    - Ter contexto completo
    - Conter informações verificáveis
    """

    def score_citation(
        self,
        citation_text: str,
        query: str,
        metadata: ChunkMetadata
    ) -> Dict[str, float]:
        """
        Calcula score de qualidade da citação.

        Returns:
            Dicionário com scores individuais e score total
        """
        scores = {
            'relevance': self._score_relevance(citation_text, query),
            'completeness': metadata.completeness_score,
            'specificity': self._score_specificity(citation_text, metadata),
            'verifiability': self._score_verifiability(citation_text, metadata),
        }

        # Score total (média ponderada)
        weights = {
            'relevance': 0.4,
            'completeness': 0.2,
            'specificity': 0.2,
            'verifiability': 0.2,
        }

        scores['total'] = sum(
            scores[key] * weights[key]
            for key in weights
        )

        return scores

    def _score_relevance(self, citation: str, query: str) -> float:
        """Score de relevância baseado em overlap de termos."""
        citation_lower = citation.lower()
        query_terms = set(re.findall(r'\b\w+\b', query.lower()))

        if not query_terms:
            return 0.0

        matches = sum(1 for term in query_terms if term in citation_lower)
        return matches / len(query_terms)

    def _score_specificity(
        self,
        citation: str,
        metadata: ChunkMetadata
    ) -> float:
        """
        Score de especificidade.

        Citações específicas contêm números, valores, datas, referências.
        """
        score = 0.0

        if metadata.has_numbers:
            score += 0.25
        if metadata.has_values:
            score += 0.25
        if metadata.has_dates:
            score += 0.25
        if metadata.has_legal_refs:
            score += 0.25

        return score

    def _score_verifiability(
        self,
        citation: str,
        metadata: ChunkMetadata
    ) -> float:
        """
        Score de verificabilidade.

        Citações verificáveis têm seção/artigo identificado e refs legais.
        """
        score = 0.0

        if metadata.section:
            score += 0.5

        if metadata.has_legal_refs:
            score += 0.5

        return score
