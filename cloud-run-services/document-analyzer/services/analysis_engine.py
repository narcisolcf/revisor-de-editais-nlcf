#!/usr/bin/env python3
"""
Analysis Engine - Motor de análise adaptativo para documentos licitatórios

Implementa análise personalizada baseada em parâmetros organizacionais:
- Análise por categorias (Estrutural, Legal, Clareza, ABNT)
- Sistema de pesos personalizáveis
- Cache inteligente para otimização
- Sistema de fallback para robustez
"""

import os
import logging
import json
import hashlib
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import re
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class AnalysisWeights:
    """Pesos para diferentes categorias de análise."""
    structural: float = 0.25
    legal: float = 0.30
    clarity: float = 0.25
    abnt: float = 0.20
    
    def normalize(self):
        """Normalizar pesos para somar 1.0."""
        total = self.structural + self.legal + self.clarity + self.abnt
        if total > 0:
            self.structural /= total
            self.legal /= total
            self.clarity /= total
            self.abnt /= total

@dataclass
class CategoryAnalysis:
    """Resultado de análise por categoria."""
    score: float
    issues: List[Dict[str, Any]]
    recommendations: List[str]
    details: Dict[str, Any]
    confidence: float

@dataclass
class AnalysisResult:
    """Resultado completo da análise."""
    overall_score: float
    weighted_score: float
    categories: Dict[str, CategoryAnalysis]
    summary: Dict[str, Any]
    metadata: Dict[str, Any]
    timestamp: str
    processing_time: float

class AnalysisEngine:
    """Motor de análise adaptativo para documentos licitatórios."""
    
    def __init__(self):
        """Inicializar motor de análise."""
        self.cache = {}  # Cache de resultados
        self.default_weights = AnalysisWeights()
        
        # Regras de análise por categoria
        self._load_analysis_rules()
        
        logger.info("Analysis Engine inicializado")
    
    def analyze_with_custom_params(self, content: str, document_type: str,
                                 org_config: Dict[str, Any],
                                 custom_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executar análise com parâmetros personalizados.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            org_config: Configurações da organização
            custom_params: Parâmetros personalizados
            
        Returns:
            Resultado completo da análise
        """
        import time
        start_time = time.time()
        
        try:
            # Verificar cache
            cache_key = self._generate_cache_key(content, document_type, org_config, custom_params)
            if cache_key in self.cache:
                logger.info("Resultado obtido do cache")
                return self.cache[cache_key]
            
            # Extrair pesos personalizados
            weights = self._extract_weights(custom_params)
            
            # Executar análise por categoria
            structural_analysis = self._analyze_structural(content, document_type, custom_params)
            legal_analysis = self._analyze_legal(content, document_type, custom_params)
            clarity_analysis = self._analyze_clarity(content, document_type, custom_params)
            abnt_analysis = self._analyze_abnt(content, document_type, custom_params)
            
            # Calcular scores ponderados
            category_scores = {
                'structural': structural_analysis.score,
                'legal': legal_analysis.score,
                'clarity': clarity_analysis.score,
                'abnt': abnt_analysis.score
            }
            
            overall_score = np.mean(list(category_scores.values()))
            weighted_score = (
                structural_analysis.score * weights.structural +
                legal_analysis.score * weights.legal +
                clarity_analysis.score * weights.clarity +
                abnt_analysis.score * weights.abnt
            )
            
            # Criar resultado
            result = AnalysisResult(
                overall_score=overall_score,
                weighted_score=weighted_score,
                categories={
                    'structural': structural_analysis,
                    'legal': legal_analysis,
                    'clarity': clarity_analysis,
                    'abnt': abnt_analysis
                },
                summary=self._generate_summary(category_scores, weights),
                metadata={
                    'document_type': document_type,
                    'content_length': len(content),
                    'word_count': len(content.split()),
                    'weights_used': asdict(weights),
                    'custom_params': custom_params,
                    'org_config': org_config
                },
                timestamp=datetime.now().isoformat(),
                processing_time=time.time() - start_time
            )
            
            # Converter para dict para serialização
            result_dict = asdict(result)
            
            # Armazenar no cache
            self.cache[cache_key] = result_dict
            
            logger.info(f"Análise concluída: score geral {overall_score:.2f}, ponderado {weighted_score:.2f}")
            
            return result_dict
            
        except Exception as e:
            logger.error(f"Erro na análise: {str(e)}")
            raise
    
    def _analyze_structural(self, content: str, document_type: str, 
                          custom_params: Dict[str, Any]) -> CategoryAnalysis:
        """
        Analisar aspectos estruturais do documento.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            custom_params: Parâmetros personalizados
            
        Returns:
            CategoryAnalysis com resultado da análise estrutural
        """
        issues = []
        recommendations = []
        details = {}
        
        # Verificar estrutura básica
        structure_score = 0.0
        max_points = 0
        
        # 1. Presença de seções obrigatórias
        required_sections = self._get_required_sections(document_type)
        sections_found = 0
        
        for section in required_sections:
            if self._find_section(content, section):
                sections_found += 1
            else:
                issues.append({
                    'type': 'missing_section',
                    'severity': 'high',
                    'description': f'Seção obrigatória ausente: {section}',
                    'section': section
                })
                recommendations.append(f'Adicionar seção: {section}')
        
        if required_sections:
            section_score = sections_found / len(required_sections)
            structure_score += section_score * 0.4
            max_points += 0.4
        
        details['sections_found'] = sections_found
        details['sections_required'] = len(required_sections)
        
        # 2. Numeração e hierarquia
        numbering_score = self._check_numbering(content)
        structure_score += numbering_score * 0.2
        max_points += 0.2
        
        if numbering_score < 0.7:
            issues.append({
                'type': 'poor_numbering',
                'severity': 'medium',
                'description': 'Numeração inconsistente ou ausente'
            })
            recommendations.append('Revisar numeração de seções e subseções')
        
        details['numbering_score'] = numbering_score
        
        # 3. Índice/Sumário
        has_index = self._check_index(content)
        if has_index:
            structure_score += 0.15
        else:
            issues.append({
                'type': 'missing_index',
                'severity': 'medium',
                'description': 'Índice ou sumário ausente'
            })
            recommendations.append('Incluir índice ou sumário')
        
        max_points += 0.15
        details['has_index'] = has_index
        
        # 4. Formatação consistente
        formatting_score = self._check_formatting(content)
        structure_score += formatting_score * 0.25
        max_points += 0.25
        
        if formatting_score < 0.6:
            issues.append({
                'type': 'inconsistent_formatting',
                'severity': 'low',
                'description': 'Formatação inconsistente'
            })
            recommendations.append('Padronizar formatação do documento')
        
        details['formatting_score'] = formatting_score
        
        # Normalizar score
        final_score = (structure_score / max_points) if max_points > 0 else 0.0
        confidence = min(0.9, 0.5 + (len(content.split()) / 1000) * 0.4)
        
        return CategoryAnalysis(
            score=final_score,
            issues=issues,
            recommendations=recommendations,
            details=details,
            confidence=confidence
        )
    
    def _analyze_legal(self, content: str, document_type: str,
                      custom_params: Dict[str, Any]) -> CategoryAnalysis:
        """
        Analisar conformidade legal do documento.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            custom_params: Parâmetros personalizados
            
        Returns:
            CategoryAnalysis com resultado da análise legal
        """
        issues = []
        recommendations = []
        details = {}
        
        legal_score = 0.0
        max_points = 0
        
        # 1. Referências legais obrigatórias
        required_laws = self._get_required_laws(document_type)
        laws_found = 0
        
        for law in required_laws:
            if self._find_legal_reference(content, law):
                laws_found += 1
            else:
                issues.append({
                    'type': 'missing_legal_reference',
                    'severity': 'high',
                    'description': f'Referência legal obrigatória ausente: {law}',
                    'law': law
                })
                recommendations.append(f'Incluir referência à {law}')
        
        if required_laws:
            law_score = laws_found / len(required_laws)
            legal_score += law_score * 0.5
            max_points += 0.5
        
        details['laws_found'] = laws_found
        details['laws_required'] = len(required_laws)
        
        # 2. Cláusulas obrigatórias
        required_clauses = self._get_required_clauses(document_type)
        clauses_found = 0
        
        for clause in required_clauses:
            if self._find_clause(content, clause):
                clauses_found += 1
            else:
                issues.append({
                    'type': 'missing_clause',
                    'severity': 'high',
                    'description': f'Cláusula obrigatória ausente: {clause}',
                    'clause': clause
                })
                recommendations.append(f'Incluir cláusula: {clause}')
        
        if required_clauses:
            clause_score = clauses_found / len(required_clauses)
            legal_score += clause_score * 0.3
            max_points += 0.3
        
        details['clauses_found'] = clauses_found
        details['clauses_required'] = len(required_clauses)
        
        # 3. Prazos e datas
        deadline_score = self._check_deadlines(content)
        legal_score += deadline_score * 0.2
        max_points += 0.2
        
        if deadline_score < 0.7:
            issues.append({
                'type': 'unclear_deadlines',
                'severity': 'medium',
                'description': 'Prazos não claramente especificados'
            })
            recommendations.append('Especificar claramente todos os prazos')
        
        details['deadline_score'] = deadline_score
        
        # Normalizar score
        final_score = (legal_score / max_points) if max_points > 0 else 0.0
        confidence = min(0.95, 0.6 + (laws_found / max(len(required_laws), 1)) * 0.35)
        
        return CategoryAnalysis(
            score=final_score,
            issues=issues,
            recommendations=recommendations,
            details=details,
            confidence=confidence
        )
    
    def _analyze_clarity(self, content: str, document_type: str,
                        custom_params: Dict[str, Any]) -> CategoryAnalysis:
        """
        Analisar clareza e legibilidade do documento.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            custom_params: Parâmetros personalizados
            
        Returns:
            CategoryAnalysis com resultado da análise de clareza
        """
        issues = []
        recommendations = []
        details = {}
        
        clarity_score = 0.0
        max_points = 0
        
        # 1. Legibilidade (Flesch Reading Ease adaptado)
        readability_score = self._calculate_readability(content)
        clarity_score += readability_score * 0.3
        max_points += 0.3
        
        if readability_score < 0.6:
            issues.append({
                'type': 'poor_readability',
                'severity': 'medium',
                'description': 'Texto de difícil leitura'
            })
            recommendations.append('Simplificar linguagem e estrutura das frases')
        
        details['readability_score'] = readability_score
        
        # 2. Jargão técnico excessivo
        jargon_score = self._check_jargon(content)
        clarity_score += jargon_score * 0.2
        max_points += 0.2
        
        if jargon_score < 0.7:
            issues.append({
                'type': 'excessive_jargon',
                'severity': 'low',
                'description': 'Uso excessivo de jargão técnico'
            })
            recommendations.append('Definir termos técnicos ou usar linguagem mais acessível')
        
        details['jargon_score'] = jargon_score
        
        # 3. Consistência terminológica
        consistency_score = self._check_terminology_consistency(content)
        clarity_score += consistency_score * 0.25
        max_points += 0.25
        
        if consistency_score < 0.8:
            issues.append({
                'type': 'inconsistent_terminology',
                'severity': 'medium',
                'description': 'Terminologia inconsistente'
            })
            recommendations.append('Padronizar terminologia ao longo do documento')
        
        details['consistency_score'] = consistency_score
        
        # 4. Ambiguidades
        ambiguity_score = self._check_ambiguities(content)
        clarity_score += ambiguity_score * 0.25
        max_points += 0.25
        
        if ambiguity_score < 0.7:
            issues.append({
                'type': 'ambiguous_language',
                'severity': 'high',
                'description': 'Linguagem ambígua detectada'
            })
            recommendations.append('Esclarecer passagens ambíguas')
        
        details['ambiguity_score'] = ambiguity_score
        
        # Normalizar score
        final_score = (clarity_score / max_points) if max_points > 0 else 0.0
        confidence = min(0.85, 0.5 + (len(content.split()) / 500) * 0.35)
        
        return CategoryAnalysis(
            score=final_score,
            issues=issues,
            recommendations=recommendations,
            details=details,
            confidence=confidence
        )
    
    def _analyze_abnt(self, content: str, document_type: str,
                     custom_params: Dict[str, Any]) -> CategoryAnalysis:
        """
        Analisar conformidade com normas ABNT.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            custom_params: Parâmetros personalizados
            
        Returns:
            CategoryAnalysis com resultado da análise ABNT
        """
        issues = []
        recommendations = []
        details = {}
        
        abnt_score = 0.0
        max_points = 0
        
        # 1. Citações e referências (NBR 6023)
        citation_score = self._check_citations(content)
        abnt_score += citation_score * 0.4
        max_points += 0.4
        
        if citation_score < 0.7:
            issues.append({
                'type': 'poor_citations',
                'severity': 'medium',
                'description': 'Citações não seguem padrão ABNT'
            })
            recommendations.append('Revisar formato das citações conforme NBR 6023')
        
        details['citation_score'] = citation_score
        
        # 2. Numeração de páginas
        page_numbering_score = self._check_page_numbering(content)
        abnt_score += page_numbering_score * 0.2
        max_points += 0.2
        
        if page_numbering_score < 0.8:
            issues.append({
                'type': 'poor_page_numbering',
                'severity': 'low',
                'description': 'Numeração de páginas não conforme'
            })
            recommendations.append('Ajustar numeração de páginas conforme ABNT')
        
        details['page_numbering_score'] = page_numbering_score
        
        # 3. Margens e espaçamento
        formatting_abnt_score = self._check_abnt_formatting(content)
        abnt_score += formatting_abnt_score * 0.2
        max_points += 0.2
        
        if formatting_abnt_score < 0.6:
            issues.append({
                'type': 'poor_abnt_formatting',
                'severity': 'low',
                'description': 'Formatação não segue padrões ABNT'
            })
            recommendations.append('Ajustar margens e espaçamento conforme ABNT')
        
        details['formatting_abnt_score'] = formatting_abnt_score
        
        # 4. Estrutura de documento técnico
        structure_abnt_score = self._check_abnt_structure(content, document_type)
        abnt_score += structure_abnt_score * 0.2
        max_points += 0.2
        
        if structure_abnt_score < 0.7:
            issues.append({
                'type': 'poor_abnt_structure',
                'severity': 'medium',
                'description': 'Estrutura não segue padrões ABNT'
            })
            recommendations.append('Reorganizar documento conforme estrutura ABNT')
        
        details['structure_abnt_score'] = structure_abnt_score
        
        # Normalizar score
        final_score = (abnt_score / max_points) if max_points > 0 else 0.0
        confidence = 0.75  # Confiança moderada para análise ABNT
        
        return CategoryAnalysis(
            score=final_score,
            issues=issues,
            recommendations=recommendations,
            details=details,
            confidence=confidence
        )
    
    def _extract_weights(self, custom_params: Dict[str, Any]) -> AnalysisWeights:
        """
        Extrair pesos personalizados dos parâmetros.
        
        Args:
            custom_params: Parâmetros personalizados
            
        Returns:
            AnalysisWeights com pesos extraídos ou padrão
        """
        weights = AnalysisWeights()
        
        if 'weights' in custom_params:
            weight_config = custom_params['weights']
            weights.structural = weight_config.get('structural', weights.structural)
            weights.legal = weight_config.get('legal', weights.legal)
            weights.clarity = weight_config.get('clarity', weights.clarity)
            weights.abnt = weight_config.get('abnt', weights.abnt)
        
        weights.normalize()
        return weights
    
    def _generate_summary(self, category_scores: Dict[str, float], 
                         weights: AnalysisWeights) -> Dict[str, Any]:
        """
        Gerar resumo da análise.
        
        Args:
            category_scores: Scores por categoria
            weights: Pesos utilizados
            
        Returns:
            Resumo da análise
        """
        # Identificar pontos fortes e fracos
        sorted_scores = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
        
        strengths = [cat for cat, score in sorted_scores if score >= 0.8]
        weaknesses = [cat for cat, score in sorted_scores if score < 0.6]
        
        # Calcular impacto dos pesos
        weight_impact = {
            'structural': weights.structural,
            'legal': weights.legal,
            'clarity': weights.clarity,
            'abnt': weights.abnt
        }
        
        return {
            'strengths': strengths,
            'weaknesses': weaknesses,
            'category_scores': category_scores,
            'weight_impact': weight_impact,
            'overall_assessment': self._get_overall_assessment(category_scores)
        }
    
    def _get_overall_assessment(self, scores: Dict[str, float]) -> str:
        """
        Obter avaliação geral baseada nos scores.
        
        Args:
            scores: Scores por categoria
            
        Returns:
            Avaliação textual
        """
        avg_score = np.mean(list(scores.values()))
        
        if avg_score >= 0.9:
            return 'Excelente'
        elif avg_score >= 0.8:
            return 'Muito Bom'
        elif avg_score >= 0.7:
            return 'Bom'
        elif avg_score >= 0.6:
            return 'Satisfatório'
        elif avg_score >= 0.5:
            return 'Necessita Melhorias'
        else:
            return 'Inadequado'
    
    def _generate_cache_key(self, content: str, document_type: str,
                           org_config: Dict[str, Any], 
                           custom_params: Dict[str, Any]) -> str:
        """
        Gerar chave de cache para o resultado.
        
        Args:
            content: Conteúdo do documento
            document_type: Tipo do documento
            org_config: Configurações da organização
            custom_params: Parâmetros personalizados
            
        Returns:
            Chave de cache
        """
        # Criar hash do conteúdo e parâmetros
        content_hash = hashlib.md5(content.encode()).hexdigest()[:16]
        params_str = json.dumps({
            'type': document_type,
            'org': org_config,
            'custom': custom_params
        }, sort_keys=True)
        params_hash = hashlib.md5(params_str.encode()).hexdigest()[:16]
        
        return f"{content_hash}_{params_hash}"
    
    def _load_analysis_rules(self):
        """
        Carregar regras de análise específicas.
        """
        # Implementação das regras será carregada de arquivos de configuração
        # Por enquanto, usar regras básicas hardcoded
        pass
    
    # Métodos auxiliares para análises específicas
    def _get_required_sections(self, document_type: str) -> List[str]:
        """Obter seções obrigatórias por tipo de documento."""
        sections_map = {
            'edital_licitacao': [
                'objeto', 'condições de participação', 'documentação',
                'proposta', 'julgamento', 'recursos', 'adjudicação'
            ],
            'termo_referencia': [
                'objeto', 'justificativa', 'especificações técnicas',
                'cronograma', 'orçamento estimado'
            ],
            'projeto_basico': [
                'objeto', 'justificativa', 'especificações',
                'cronograma', 'orçamento', 'responsável técnico'
            ]
        }
        return sections_map.get(document_type, [])
    
    def _find_section(self, content: str, section: str) -> bool:
        """Verificar se uma seção está presente no documento."""
        patterns = [
            rf'\b{re.escape(section)}\b',
            rf'\d+\.?\s*{re.escape(section)}',
            rf'{re.escape(section)}\s*:'
        ]
        
        content_lower = content.lower()
        section_lower = section.lower()
        
        for pattern in patterns:
            if re.search(pattern.lower(), content_lower):
                return True
        
        return False
    
    def _check_numbering(self, content: str) -> float:
        """Verificar qualidade da numeração."""
        # Procurar por padrões de numeração
        numbering_patterns = [
            r'\d+\.',  # 1., 2., 3.
            r'\d+\.\d+',  # 1.1, 1.2
            r'[a-z]\)',  # a), b), c)
            r'[IVX]+\.',  # I., II., III.
        ]
        
        total_matches = 0
        for pattern in numbering_patterns:
            matches = len(re.findall(pattern, content))
            total_matches += matches
        
        # Normalizar baseado no tamanho do documento
        expected_numbering = len(content.split('\n')) * 0.1
        score = min(1.0, total_matches / max(expected_numbering, 1))
        
        return score
    
    def _check_index(self, content: str) -> bool:
        """Verificar presença de índice ou sumário."""
        index_indicators = [
            r'\bíndice\b', r'\bsumário\b', r'\bconteúdo\b',
            r'\btable of contents\b', r'\bsummary\b'
        ]
        
        content_lower = content.lower()
        for indicator in index_indicators:
            if re.search(indicator, content_lower):
                return True
        
        return False
    
    def _check_formatting(self, content: str) -> float:
        """Verificar consistência da formatação."""
        # Análise simples baseada em padrões de formatação
        lines = content.split('\n')
        
        # Verificar consistência de espaçamento
        empty_lines = sum(1 for line in lines if line.strip() == '')
        spacing_score = min(1.0, empty_lines / max(len(lines) * 0.1, 1))
        
        # Verificar consistência de capitalização em títulos
        title_lines = [line for line in lines if len(line.strip()) < 100 and line.strip().isupper()]
        title_score = min(1.0, len(title_lines) / max(len(lines) * 0.05, 1))
        
        return (spacing_score + title_score) / 2
    
    def _get_required_laws(self, document_type: str) -> List[str]:
        """Obter leis obrigatórias por tipo de documento."""
        laws_map = {
            'edital_licitacao': [
                'Lei 8.666/93', 'Lei 10.520/02', 'Lei 14.133/21'
            ],
            'termo_referencia': [
                'Lei 8.666/93', 'Lei 14.133/21'
            ],
            'projeto_basico': [
                'Lei 8.666/93', 'Lei 14.133/21'
            ]
        }
        return laws_map.get(document_type, [])
    
    def _find_legal_reference(self, content: str, law: str) -> bool:
        """Verificar se uma referência legal está presente."""
        # Normalizar referência legal
        law_pattern = re.escape(law).replace(r'\/', r'[/\-]?')
        pattern = rf'\b{law_pattern}\b'
        
        return bool(re.search(pattern, content, re.IGNORECASE))
    
    def _get_required_clauses(self, document_type: str) -> List[str]:
        """Obter cláusulas obrigatórias por tipo de documento."""
        clauses_map = {
            'edital_licitacao': [
                'habilitação', 'julgamento', 'recursos', 'adjudicação',
                'homologação', 'penalidades'
            ],
            'contrato': [
                'objeto', 'prazo', 'valor', 'pagamento', 'penalidades',
                'rescisão', 'foro'
            ]
        }
        return clauses_map.get(document_type, [])
    
    def _find_clause(self, content: str, clause: str) -> bool:
        """Verificar se uma cláusula está presente."""
        return self._find_section(content, clause)
    
    def _check_deadlines(self, content: str) -> float:
        """Verificar clareza dos prazos especificados."""
        # Procurar por padrões de data e prazo
        date_patterns = [
            r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}',  # dd/mm/yyyy
            r'\d{1,2}\s+de\s+\w+\s+de\s+\d{4}',  # dd de mês de yyyy
            r'\d+\s+dias?\b',  # X dias
            r'\d+\s+meses?\b',  # X meses
            r'prazo\s+de\s+\d+',  # prazo de X
        ]
        
        deadline_count = 0
        for pattern in date_patterns:
            matches = len(re.findall(pattern, content, re.IGNORECASE))
            deadline_count += matches
        
        # Normalizar baseado no tamanho do documento
        expected_deadlines = len(content.split()) / 1000  # Aproximadamente 1 prazo por 1000 palavras
        score = min(1.0, deadline_count / max(expected_deadlines, 1))
        
        return score
    
    def _calculate_readability(self, content: str) -> float:
        """Calcular score de legibilidade (adaptado para português)."""
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        
        if not words or not sentences:
            return 0.0
        
        avg_sentence_length = len(words) / len(sentences)
        avg_word_length = sum(len(word) for word in words) / len(words)
        
        # Fórmula adaptada (valores menores = melhor legibilidade)
        readability = 206.835 - (1.015 * avg_sentence_length) - (84.6 * (avg_word_length / 4.7))
        
        # Normalizar para 0-1 (invertido, pois valores altos = boa legibilidade)
        normalized = max(0, min(100, readability)) / 100
        
        return normalized
    
    def _check_jargon(self, content: str) -> float:
        """Verificar uso excessivo de jargão técnico."""
        # Lista de termos técnicos comuns em licitações
        technical_terms = [
            'adjudicação', 'homologação', 'habilitação', 'inexigibilidade',
            'dispensa', 'pregão', 'concorrência', 'tomada de preços',
            'convite', 'registro de preços', 'ata', 'aditivo'
        ]
        
        words = content.lower().split()
        technical_count = sum(1 for word in words if any(term in word for term in technical_terms))
        
        # Score alto = pouco jargão (melhor)
        jargon_ratio = technical_count / len(words) if words else 0
        score = max(0, 1 - (jargon_ratio * 10))  # Penalizar uso excessivo
        
        return min(1.0, score)
    
    def _check_terminology_consistency(self, content: str) -> float:
        """Verificar consistência terminológica."""
        # Implementação simplificada - verificar variações de termos importantes
        variations = {
            'licitação': ['licitacao', 'licitações', 'licitacoes'],
            'contrato': ['contratos'],
            'proposta': ['propostas'],
        }
        
        consistency_score = 1.0
        content_lower = content.lower()
        
        for main_term, variants in variations.items():
            main_count = content_lower.count(main_term)
            variant_count = sum(content_lower.count(variant) for variant in variants)
            
            if main_count + variant_count > 0:
                consistency = main_count / (main_count + variant_count)
                consistency_score *= consistency
        
        return consistency_score
    
    def _check_ambiguities(self, content: str) -> float:
        """Verificar presença de linguagem ambígua."""
        # Palavras/frases que podem indicar ambiguidade
        ambiguous_indicators = [
            'pode ser', 'talvez', 'possivelmente', 'eventualmente',
            'conforme necessário', 'quando apropriado', 'se necessário',
            'aproximadamente', 'cerca de', 'mais ou menos'
        ]
        
        content_lower = content.lower()
        ambiguity_count = sum(1 for indicator in ambiguous_indicators 
                             if indicator in content_lower)
        
        # Normalizar pelo tamanho do documento
        words_count = len(content.split())
        ambiguity_ratio = ambiguity_count / max(words_count / 100, 1)  # Por 100 palavras
        
        # Score alto = pouca ambiguidade
        score = max(0, 1 - ambiguity_ratio)
        
        return min(1.0, score)
    
    def _check_citations(self, content: str) -> float:
        """Verificar formato das citações conforme ABNT."""
        # Padrões básicos de citação ABNT
        citation_patterns = [
            r'\([A-Z]+,\s*\d{4}\)',  # (AUTOR, 2023)
            r'[A-Z]+\s*\(\d{4}\)',   # AUTOR (2023)
            r'\w+\s+et\s+al\.\s*\(\d{4}\)',  # Autor et al. (2023)
        ]
        
        citation_count = 0
        for pattern in citation_patterns:
            matches = len(re.findall(pattern, content))
            citation_count += matches
        
        # Se não há citações, score neutro
        if citation_count == 0:
            return 0.8
        
        # Verificar se citações seguem padrão
        total_possible_citations = len(re.findall(r'\([^)]*\d{4}[^)]*\)', content))
        
        if total_possible_citations == 0:
            return 0.8
        
        score = citation_count / total_possible_citations
        return min(1.0, score)
    
    def _check_page_numbering(self, content: str) -> float:
        """Verificar numeração de páginas."""
        # Procurar por indicadores de numeração de página
        page_indicators = [
            r'página\s+\d+', r'pág\.?\s+\d+', r'p\.\s+\d+',
            r'\d+\s*/\s*\d+',  # 1/10, 2/10, etc.
        ]
        
        page_count = 0
        for pattern in page_indicators:
            matches = len(re.findall(pattern, content, re.IGNORECASE))
            page_count += matches
        
        # Se documento parece ter múltiplas páginas mas sem numeração
        estimated_pages = len(content) / 3000  # ~3000 chars por página
        
        if estimated_pages > 2 and page_count == 0:
            return 0.3
        elif page_count > 0:
            return 0.9
        else:
            return 0.8  # Documento curto, numeração não crítica
    
    def _check_abnt_formatting(self, content: str) -> float:
        """Verificar formatação conforme ABNT."""
        # Verificações básicas de formatação ABNT
        score = 0.0
        checks = 0
        
        # Verificar espaçamento duplo após pontos
        double_space_after_period = len(re.findall(r'\.\s{2,}', content))
        single_space_after_period = len(re.findall(r'\.\s{1}[A-Z]', content))
        
        if double_space_after_period > single_space_after_period:
            score += 1
        checks += 1
        
        # Verificar recuo de parágrafo
        indented_paragraphs = len(re.findall(r'^\s{4,}\w', content, re.MULTILINE))
        total_paragraphs = len(re.findall(r'^\w', content, re.MULTILINE))
        
        if total_paragraphs > 0:
            indent_ratio = indented_paragraphs / total_paragraphs
            if indent_ratio > 0.5:
                score += 1
            checks += 1
        
        return score / checks if checks > 0 else 0.5
    
    def _check_abnt_structure(self, content: str, document_type: str) -> float:
        """Verificar estrutura conforme ABNT."""
        # Elementos estruturais esperados conforme ABNT
        abnt_elements = [
            'resumo', 'abstract', 'introdução', 'desenvolvimento',
            'conclusão', 'referências', 'bibliografia'
        ]
        
        elements_found = 0
        content_lower = content.lower()
        
        for element in abnt_elements:
            if element in content_lower:
                elements_found += 1
        
        # Normalizar baseado no tipo de documento
        if document_type in ['termo_referencia', 'projeto_basico']:
            expected_elements = 4  # Documentos técnicos
        else:
            expected_elements = 3  # Documentos administrativos
        
        score = min(1.0, elements_found / expected_elements)
        
        return score
    
    def clear_cache(self):
        """Limpar cache de análises."""
        self.cache.clear()
        logger.info("Cache de análises limpo")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obter estatísticas do cache."""
        return {
            'cache_size': len(self.cache),
            'supported_types': list(self._get_required_sections('').keys())
        }