"""
🚀 LicitaReview - Motor de Análise Adaptativo

CORE DIFERENCIAL: Sistema de análise que aplica parâmetros personalizados
por organização, permitindo que cada órgão tenha critérios específicos.

Este módulo implementa o AdaptiveAnalyzer, responsável por:
- Aplicar pesos personalizados por organização
- Executar regras customizadas específicas
- Validar conformidade com templates organizacionais
- Calcular scores ponderados adaptativos

Author: LicitaReview Team
Version: 2.0.0
"""

import asyncio
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
import logging
import structlog

from ..models.document_models import Document, DocumentType
from ..models.config_models import (
    OrganizationConfig, 
    AnalysisWeights, 
    CustomRule,
    OrganizationTemplate
)
from ..models.analysis_models import (
    AnalysisResult, 
    ConformityScore,
    AnalysisFinding, 
    ProblemSeverity,
    ProblemCategory,
    AnalysisStatus
)

logger = structlog.get_logger(__name__)


@dataclass
class AnalysisContext:
    """
    Contexto de análise com informações da organização e documento.
    """
    document: Document
    organization_config: OrganizationConfig
    analysis_type: str = "standard"
    custom_parameters: Dict[str, Any] = None
    minimum_confidence: float = 0.5
    
    def __post_init__(self):
        if self.custom_parameters is None:
            self.custom_parameters = {}


class BaseAnalysisEngine:
    """
    Engine base para análises padrão antes da personalização.
    
    Implementa análises fundamentais de:
    - Estrutura do documento
    - Conformidade legal básica  
    - Clareza textual
    - Padrões ABNT
    """
    
    def __init__(self):
        self.logger = structlog.get_logger(self.__class__.__name__)
    
    async def analyze_structural(self, document: Document, template: Optional[OrganizationTemplate] = None) -> Dict[str, Any]:
        """
        Análise estrutural do documento.
        
        Args:
            document: Documento a ser analisado
            template: Template organizacional (opcional)
            
        Returns:
            Dict com score e findings estruturais
        """
        self.logger.info("Starting structural analysis", document_id=document.id)
        
        findings = []
        score = 100.0
        
        # Análises básicas de estrutura
        content = document.content or ""
        
        # Verifica estrutura básica
        if len(content.strip()) < 100:
            findings.append(AnalysisFinding(
                category=ProblemCategory.ESTRUTURAL,
                severity=ProblemSeverity.CRITICA,
                title="Documento muito curto",
                description="O documento parece estar incompleto ou muito resumido",
                suggestion="Verifique se todo o conteúdo foi incluído no documento",
                confidence=0.95
            ))
            score -= 30
        
        # Verifica seções básicas
        basic_sections = [
            ("objeto", r"objeto\s*:"),
            ("prazo", r"prazo\s*:"),
            ("valor", r"valor|orçamento"),
        ]
        
        missing_sections = []
        for section_name, pattern in basic_sections:
            if not re.search(pattern, content, re.IGNORECASE):
                missing_sections.append(section_name)
        
        if missing_sections:
            severity = ProblemSeverity.ALTA if len(missing_sections) > 1 else ProblemSeverity.MEDIA
            findings.append(AnalysisFinding(
                category=ProblemCategory.ESTRUTURAL,
                severity=severity,
                title=f"Seções básicas ausentes: {', '.join(missing_sections)}",
                description="Documento não possui seções fundamentais esperadas",
                suggestion="Incluir as seções obrigatórias no documento",
                confidence=0.8
            ))
            score -= len(missing_sections) * 10
        
        # Análise específica por template
        if template:
            template_validation = template.validate_document_structure(content)
            if not template_validation['is_valid']:
                for missing in template_validation['missing_required_sections']:
                    findings.append(AnalysisFinding(
                        category=ProblemCategory.ESTRUTURAL,
                        severity=ProblemSeverity.ALTA,
                        title=f"Seção obrigatória ausente: {missing}",
                        description=f"Template organizacional requer a seção '{missing}'",
                        suggestion=f"Incluir seção '{missing}' conforme template organizacional",
                        confidence=0.9,
                        is_custom_rule=True
                    ))
                    score -= 15
        
        # Verifica formatação básica
        if not re.search(r'\d', content):
            findings.append(AnalysisFinding(
                category=ProblemCategory.ESTRUTURAL,
                severity=ProblemSeverity.BAIXA,
                title="Ausência de numeração ou valores",
                description="Documento não contém números, o que pode indicar formatação inadequada",
                suggestion="Verificar se numeração e valores estão presentes",
                confidence=0.6
            ))
            score -= 5
        
        return {
            'score': max(0.0, min(100.0, score)),
            'findings': findings,
            'metadata': {
                'content_length': len(content),
                'missing_basic_sections': missing_sections,
                'template_applied': template.id if template else None
            }
        }
    
    async def analyze_legal(self, document: Document, custom_rules: List[CustomRule] = None) -> Dict[str, Any]:
        """
        Análise de conformidade legal.
        
        Args:
            document: Documento a ser analisado
            custom_rules: Regras legais personalizadas
            
        Returns:
            Dict com score e findings legais
        """
        self.logger.info("Starting legal analysis", document_id=document.id)
        
        findings = []
        score = 100.0
        content = document.content or ""
        
        # Referências legais básicas esperadas
        legal_references = [
            (r"lei\s+8\.?666", "Lei 8.666/93", "Lei de Licitações básica"),
            (r"lei\s+14\.?133", "Lei 14.133/21", "Nova Lei de Licitações"),
            (r"constituição|cf/88", "Constituição Federal", "Base constitucional"),
        ]
        
        missing_legal_refs = []
        for pattern, name, description in legal_references:
            if not re.search(pattern, content, re.IGNORECASE):
                missing_legal_refs.append((name, description))
        
        if missing_legal_refs and len(missing_legal_refs) >= 2:
            findings.append(AnalysisFinding(
                category=ProblemCategory.JURIDICO,
                severity=ProblemSeverity.MEDIA,
                title="Poucas referências legais identificadas",
                description="Documento pode carecer de fundamentação legal adequada",
                suggestion="Incluir referências à legislação aplicável",
                confidence=0.7,
                regulatory_reference="Lei 8.666/93, Art. 3º"
            ))
            score -= 15
        
        # Termos jurídicos problemáticos
        problematic_terms = [
            (r"poderá\s+ser\s+aceito", "Linguagem permissiva excessiva"),
            (r"critério\s+da\s+administração", "Critério subjetivo sem parâmetros"),
            (r"a\s+seu\s+exclusivo\s+critério", "Discricionariedade excessiva"),
        ]
        
        for pattern, issue in problematic_terms:
            if re.search(pattern, content, re.IGNORECASE):
                findings.append(AnalysisFinding(
                    category=ProblemCategory.JURIDICO,
                    severity=ProblemSeverity.MEDIA,
                    title=f"Linguagem jurídica problemática: {issue}",
                    description="Termo identificado pode gerar questionamentos jurídicos",
                    suggestion="Revisar redação para maior objetividade",
                    confidence=0.75
                ))
                score -= 8
        
        # Aplica regras personalizadas da organização
        if custom_rules:
            custom_findings = await self._apply_custom_legal_rules(content, custom_rules)
            findings.extend(custom_findings)
            
            # Ajusta score baseado em regras personalizadas
            custom_penalty = sum(f.impact_score for f in custom_findings if f.category == ProblemCategory.JURIDICO)
            score -= custom_penalty * 2  # Peso duplo para regras personalizadas
        
        return {
            'score': max(0.0, min(100.0, score)),
            'findings': findings,
            'metadata': {
                'missing_legal_references': missing_legal_refs,
                'custom_rules_applied': len(custom_rules) if custom_rules else 0,
                'problematic_terms_found': len([p for p, _ in problematic_terms if re.search(p, content, re.IGNORECASE)])
            }
        }
    
    async def analyze_clarity(self, document: Document, custom_rules: List[CustomRule] = None) -> Dict[str, Any]:
        """
        Análise de clareza e objetividade textual.
        
        Args:
            document: Documento a ser analisado
            custom_rules: Regras de clareza personalizadas
            
        Returns:
            Dict com score e findings de clareza
        """
        self.logger.info("Starting clarity analysis", document_id=document.id)
        
        findings = []
        score = 100.0
        content = document.content or ""
        
        if not content.strip():
            return {'score': 0.0, 'findings': [], 'metadata': {}}
        
        # Análise de readabilidade básica
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if sentences:
            avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences)
            
            if avg_sentence_length > 25:
                findings.append(AnalysisFinding(
                    category=ProblemCategory.CLAREZA,
                    severity=ProblemSeverity.MEDIA,
                    title="Sentenças muito longas",
                    description=f"Comprimento médio de {avg_sentence_length:.1f} palavras por sentença",
                    suggestion="Dividir sentenças longas para melhor compreensão",
                    confidence=0.8
                ))
                score -= 10
        
        # Termos técnicos sem definição
        technical_terms = [
            "objeto social", "habilitação técnica", "qualificação econômica",
            "envelope lacrado", "sessão pública", "proposta comercial"
        ]
        
        undefined_terms = []
        for term in technical_terms:
            if re.search(rf"\b{re.escape(term)}\b", content, re.IGNORECASE):
                # Verifica se há definição próxima
                definition_patterns = [
                    rf"{re.escape(term)}[^\w\s]*\s*(?:é|significa|define-se|entende-se)",
                    rf"(?:define-se|entende-se|considera-se)[\s\w,]*{re.escape(term)}"
                ]
                
                has_definition = any(re.search(p, content, re.IGNORECASE) for p in definition_patterns)
                if not has_definition:
                    undefined_terms.append(term)
        
        if undefined_terms:
            findings.append(AnalysisFinding(
                category=ProblemCategory.CLAREZA,
                severity=ProblemSeverity.BAIXA,
                title=f"Termos técnicos sem definição: {', '.join(undefined_terms[:3])}",
                description="Termos técnicos utilizados podem carecer de definições claras",
                suggestion="Incluir glossário ou definir termos técnicos utilizados",
                confidence=0.6
            ))
            score -= len(undefined_terms) * 2
        
        # Ambiguidades comuns
        ambiguous_patterns = [
            (r"poderá|poderão", "Uso de 'poderá' cria ambiguidade"),
            (r"aproximadamente|cerca\s+de|em\s+torno\s+de", "Linguagem imprecisa"),
            (r"adequado|apropriado|satisfatório", "Critérios subjetivos"),
        ]
        
        for pattern, issue in ambiguous_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if len(matches) > 3:  # Muitas ocorrências
                findings.append(AnalysisFinding(
                    category=ProblemCategory.CLAREZA,
                    severity=ProblemSeverity.BAIXA,
                    title=f"Linguagem ambígua: {issue}",
                    description=f"Encontradas {len(matches)} ocorrências de linguagem imprecisa",
                    suggestion="Utilizar linguagem mais objetiva e específica",
                    confidence=0.7
                ))
                score -= 5
        
        # Aplica regras personalizadas de clareza
        if custom_rules:
            custom_findings = await self._apply_custom_clarity_rules(content, custom_rules)
            findings.extend(custom_findings)
            
            custom_penalty = sum(f.impact_score for f in custom_findings if f.category == ProblemCategory.CLAREZA)
            score -= custom_penalty
        
        return {
            'score': max(0.0, min(100.0, score)),
            'findings': findings,
            'metadata': {
                'average_sentence_length': avg_sentence_length if sentences else 0,
                'undefined_technical_terms': len(undefined_terms),
                'sentences_count': len(sentences),
                'readability_score': max(0, 100 - (avg_sentence_length - 15) * 2) if sentences else 0
            }
        }
    
    async def analyze_abnt(self, document: Document, custom_rules: List[CustomRule] = None) -> Dict[str, Any]:
        """
        Análise de conformidade com normas ABNT.
        
        Args:
            document: Documento a ser analisado
            custom_rules: Regras ABNT personalizadas
            
        Returns:
            Dict com score e findings ABNT
        """
        self.logger.info("Starting ABNT analysis", document_id=document.id)
        
        findings = []
        score = 100.0
        content = document.content or ""
        
        # Verifica formatação básica de listas
        if re.search(r'^\s*[a-z]\)', content, re.MULTILINE):
            # Tem listas com letras minúsculas
            if not re.search(r'^\s*[A-Z]\)', content, re.MULTILINE):
                findings.append(AnalysisFinding(
                    category=ProblemCategory.ABNT,
                    severity=ProblemSeverity.BAIXA,
                    title="Inconsistência na formatação de listas",
                    description="Listas utilizam letras minúsculas sem seguir padrão ABNT",
                    suggestion="Padronizar formatação de listas conforme ABNT NBR 6024",
                    confidence=0.6,
                    regulatory_reference="ABNT NBR 6024:2012"
                ))
                score -= 5
        
        # Verifica numeração de seções
        section_numbers = re.findall(r'^\s*(\d+(?:\.\d+)*)', content, re.MULTILINE)
        if section_numbers:
            # Verifica sequência lógica
            for i in range(1, len(section_numbers)):
                current = section_numbers[i].split('.')
                previous = section_numbers[i-1].split('.')
                
                # Lógica básica de numeração hierárquica
                if len(current) > len(previous) + 1:
                    findings.append(AnalysisFinding(
                        category=ProblemCategory.ABNT,
                        severity=ProblemSeverity.MEDIA,
                        title="Numeração de seções incorreta",
                        description="Numeração hierárquica não segue sequência lógica",
                        suggestion="Ajustar numeração conforme ABNT NBR 6024",
                        confidence=0.8,
                        regulatory_reference="ABNT NBR 6024:2012"
                    ))
                    score -= 10
                    break
        
        # Verifica citações e referências
        citations = re.findall(r'\(.*?\d{4}.*?\)', content)  # Padrão básico (AUTOR, 2020)
        if citations:
            malformed_citations = [c for c in citations if not re.search(r'\w+.*\d{4}', c)]
            if malformed_citations:
                findings.append(AnalysisFinding(
                    category=ProblemCategory.ABNT,
                    severity=ProblemSeverity.BAIXA,
                    title="Citações malformadas identificadas",
                    description="Algumas citações não seguem padrão ABNT",
                    suggestion="Revisar formato das citações conforme ABNT NBR 10520",
                    confidence=0.7,
                    regulatory_reference="ABNT NBR 10520:2002"
                ))
                score -= 8
        
        # Verifica espaçamento e formatação
        double_spaces = len(re.findall(r'  +', content))  # Espaços duplos ou mais
        if double_spaces > 10:  # Muitos espaços duplos
            findings.append(AnalysisFinding(
                category=ProblemCategory.ABNT,
                severity=ProblemSeverity.BAIXA,
                title="Formatação de espaçamento irregular",
                description=f"Encontrados {double_spaces} casos de espaçamento irregular",
                suggestion="Revisar espaçamento conforme padrões de formatação",
                confidence=0.5
            ))
            score -= 3
        
        # Aplica regras ABNT personalizadas
        if custom_rules:
            custom_findings = await self._apply_custom_abnt_rules(content, custom_rules)
            findings.extend(custom_findings)
            
            custom_penalty = sum(f.impact_score for f in custom_findings if f.category == ProblemCategory.ABNT)
            score -= custom_penalty
        
        return {
            'score': max(0.0, min(100.0, score)),
            'findings': findings,
            'metadata': {
                'section_numbers_found': len(section_numbers),
                'citations_found': len(citations),
                'double_spaces_count': double_spaces,
                'formatting_issues': len([f for f in findings if 'formatação' in f.title.lower()])
            }
        }
    
    async def _apply_custom_legal_rules(self, content: str, rules: List[CustomRule]) -> List[AnalysisFinding]:
        """Aplica regras legais personalizadas."""
        findings = []
        
        for rule in rules:
            if rule.category != "juridico" or not rule.is_active:
                continue
            
            if rule.test_pattern_match(content):
                rule.increment_usage()
                findings.append(AnalysisFinding(
                    category=ProblemCategory.JURIDICO,
                    severity=ProblemSeverity(rule.severity),
                    title=rule.message,
                    description=rule.description,
                    suggestion=rule.suggestion,
                    confidence=0.85,
                    rule_id=rule.id,
                    is_custom_rule=True
                ))
        
        return findings
    
    async def _apply_custom_clarity_rules(self, content: str, rules: List[CustomRule]) -> List[AnalysisFinding]:
        """Aplica regras de clareza personalizadas."""
        findings = []
        
        for rule in rules:
            if rule.category != "clareza" or not rule.is_active:
                continue
            
            if rule.test_pattern_match(content):
                rule.increment_usage()
                findings.append(AnalysisFinding(
                    category=ProblemCategory.CLAREZA,
                    severity=ProblemSeverity(rule.severity),
                    title=rule.message,
                    description=rule.description,
                    suggestion=rule.suggestion,
                    confidence=0.85,
                    rule_id=rule.id,
                    is_custom_rule=True
                ))
        
        return findings
    
    async def _apply_custom_abnt_rules(self, content: str, rules: List[CustomRule]) -> List[AnalysisFinding]:
        """Aplica regras ABNT personalizadas."""
        findings = []
        
        for rule in rules:
            if rule.category != "abnt" or not rule.is_active:
                continue
            
            if rule.test_pattern_match(content):
                rule.increment_usage()
                findings.append(AnalysisFinding(
                    category=ProblemCategory.ABNT,
                    severity=ProblemSeverity(rule.severity),
                    title=rule.message,
                    description=rule.description,
                    suggestion=rule.suggestion,
                    confidence=0.85,
                    rule_id=rule.id,
                    is_custom_rule=True,
                    regulatory_reference="Regra organizacional customizada"
                ))
        
        return findings


class AdaptiveAnalyzer:
    """
    🚀 MOTOR DE ANÁLISE ADAPTATIVO - CORE DIFERENCIAL DO LICITAREVIEW
    
    Este é o coração do sistema de análise personalizada. Cada organização
    pode ter seus próprios critérios, pesos e regras de análise.
    
    FUNCIONALIDADES PRINCIPAIS:
    - Aplicação de pesos personalizados por categoria
    - Execução de regras customizadas organizacionais  
    - Validação contra templates específicos
    - Cálculo de scores adaptativos
    - Geração de relatórios personalizados
    
    DIFERENCIAL COMPETITIVO:
    - Análise 100% adaptável aos critérios de cada órgão
    - Configuração granular de parâmetros
    - Templates organizacionais específicos
    - Regras de negócio customizáveis
    """
    
    def __init__(self, doc_type: str, org_config: OrganizationConfig):
        """
        Inicializa o analisador adaptativo.
        
        Args:
            doc_type: Tipo de documento sendo analisado
            org_config: Configuração organizacional com parâmetros personalizados
        """
        self.doc_type = doc_type
        self.weights = org_config.weights
        self.custom_rules = org_config.get_active_rules()
        self.templates = [t for t in org_config.templates if t.is_active]
        self.organization_config = org_config
        
        # Engines de análise base
        self.base_engine = BaseAnalysisEngine()
        
        # Logger estruturado
        self.logger = structlog.get_logger(
            self.__class__.__name__,
            organization_id=org_config.organization_id,
            doc_type=doc_type
        )
        
        self.logger.info(
            "🚀 AdaptiveAnalyzer initialized",
            weights=org_config.weights.dict(),
            custom_rules_count=len(self.custom_rules),
            templates_count=len(self.templates)
        )
    
    async def analyze_with_custom_params(self, document: Document) -> AnalysisResult:
        """
        🚨 MÉTODO PRINCIPAL - Executa análise completa com parâmetros personalizados.
        
        Este método coordena toda a análise adaptativa:
        1. Análises base por categoria
        2. Aplicação de regras personalizadas
        3. Validação contra templates
        4. Cálculo de scores ponderados
        5. Geração do resultado final
        
        Args:
            document: Documento a ser analisado
            
        Returns:
            AnalysisResult com análise completa personalizada
        """
        start_time = datetime.utcnow()
        
        self.logger.info(
            "🚀 Starting adaptive analysis",
            document_id=document.id,
            organization_id=self.organization_config.organization_id
        )
        
        try:
            # 1. Executa análises base por categoria
            analysis_results = await self._run_categorical_analysis(document)
            
            # 2. Aplica validações personalizadas adicionais
            custom_findings = await self.apply_custom_validations(document.content or "")
            
            # 3. Consolida findings
            all_findings = []
            for category_result in analysis_results.values():
                all_findings.extend(category_result['findings'])
            all_findings.extend(custom_findings)
            
            # 4. Calcula scores base
            base_scores = {
                'structural': analysis_results['structural']['score'],
                'legal': analysis_results['legal']['score'],
                'clarity': analysis_results['clarity']['score'],
                'abnt': analysis_results['abnt']['score']
            }
            
            # 5. Calcula score ponderado final
            weighted_score = self.calculate_weighted_score(base_scores)
            
            # 6. Cria objeto de scores de conformidade
            conformity_scores = ConformityScore(
                structural=base_scores['structural'],
                legal=base_scores['legal'],
                clarity=base_scores['clarity'],
                abnt=base_scores['abnt'],
                overall=sum(base_scores.values()) / 4  # Média simples para overall
            )
            
            # 7. Gera recomendações personalizadas
            recommendations = await self._generate_personalized_recommendations(
                all_findings, base_scores
            )
            
            # 8. Calcula tempo de execução
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            # 9. Cria resultado final
            result = AnalysisResult(
                document_id=document.id,
                organization_id=self.organization_config.organization_id,
                status=AnalysisStatus.COMPLETED,
                conformity_scores=conformity_scores,
                weighted_score=weighted_score,
                findings=all_findings,
                recommendations=recommendations,
                applied_config=self.organization_config,
                analysis_metadata={
                    'analysis_type': 'adaptive',
                    'doc_type': self.doc_type,
                    'base_scores': base_scores,
                    'weights_applied': self.weights.dict(),
                    'custom_rules_executed': len([f for f in all_findings if f.is_custom_rule]),
                    'templates_validated': len(self.templates),
                    'categories_analyzed': list(analysis_results.keys())
                },
                execution_time_seconds=execution_time,
                model_version="2.0.0-adaptive"
            )
            
            self.logger.info(
                "✅ Adaptive analysis completed successfully",
                document_id=document.id,
                weighted_score=weighted_score,
                total_findings=len(all_findings),
                execution_time=execution_time
            )
            
            return result
            
        except Exception as e:
            self.logger.error(
                "❌ Adaptive analysis failed",
                document_id=document.id,
                error=str(e),
                error_type=type(e).__name__
            )
            
            # Retorna resultado de falha
            return AnalysisResult(
                document_id=document.id,
                organization_id=self.organization_config.organization_id,
                status=AnalysisStatus.FAILED,
                conformity_scores=ConformityScore(
                    structural=0, legal=0, clarity=0, abnt=0, overall=0
                ),
                weighted_score=0.0,
                findings=[],
                recommendations=["Erro na análise. Verifique o documento e tente novamente."],
                applied_config=self.organization_config,
                analysis_metadata={'error': str(e), 'error_type': type(e).__name__},
                execution_time_seconds=(datetime.utcnow() - start_time).total_seconds()
            )
    
    def calculate_weighted_score(self, base_scores: Dict[str, float]) -> float:
        """
        🚨 MÉTODO CRÍTICO - Calcula score final ponderado pelos pesos organizacionais.
        
        Este é o diferencial competitivo: o mesmo documento pode ter scores
        diferentes para organizações diferentes, baseado nos pesos personalizados.
        
        Args:
            base_scores: Scores base por categoria (0-100)
            
        Returns:
            Score final ponderado (0-100)
        """
        self.logger.debug(
            "Calculating weighted score",
            base_scores=base_scores,
            weights=self.weights.dict()
        )
        
        # Validação dos scores base
        for category, score in base_scores.items():
            if not (0 <= score <= 100):
                self.logger.warning(
                    f"Score fora da faixa válida: {category} = {score}"
                )
                base_scores[category] = max(0, min(100, score))
        
        # Cálculo ponderado
        weighted_score = (
            base_scores['structural'] * (self.weights.structural / 100) +
            base_scores['legal'] * (self.weights.legal / 100) +
            base_scores['clarity'] * (self.weights.clarity / 100) +
            base_scores['abnt'] * (self.weights.abnt / 100)
        )
        
        # Garante faixa válida
        final_score = max(0.0, min(100.0, weighted_score))
        
        self.logger.info(
            "Weighted score calculated",
            final_score=final_score,
            weight_distribution=self.weights.get_weight_distribution_type(),
            dominant_category=self.weights.get_dominant_category()
        )
        
        return final_score
    
    async def apply_custom_validations(self, content: str) -> List[AnalysisFinding]:
        """
        Aplica validações personalizadas da organização.
        
        Executa todas as regras customizadas definidas pela organização
        que não foram aplicadas nas análises categóricas.
        
        Args:
            content: Conteúdo do documento
            
        Returns:
            Lista de findings das regras personalizadas
        """
        self.logger.info(
            "Applying custom validations",
            custom_rules_count=len(self.custom_rules)
        )
        
        findings = []
        
        for rule in self.custom_rules:
            if not rule.is_active:
                continue
            
            try:
                # Testa se a regra é aplicável ao tipo de documento atual
                if rule.applies_to_document_types:
                    doc_type_enum = DocumentType(self.doc_type.lower())
                    if doc_type_enum not in rule.applies_to_document_types:
                        continue
                
                # Executa teste da regra
                if rule.test_pattern_match(content):
                    self.logger.debug(
                        "Custom rule matched",
                        rule_id=rule.id,
                        rule_name=rule.name
                    )
                    
                    # Incrementa contador de uso
                    rule.increment_usage()
                    
                    # Cria finding personalizado
                    finding = AnalysisFinding(
                        category=ProblemCategory(rule.category),
                        severity=ProblemSeverity(rule.severity),
                        title=rule.message,
                        description=rule.description,
                        suggestion=rule.suggestion,
                        confidence=0.9,  # Alta confiança em regras organizacionais
                        rule_id=rule.id,
                        is_custom_rule=True,
                        regulatory_reference="Regra organizacional personalizada"
                    )
                    
                    findings.append(finding)
                    
            except Exception as e:
                self.logger.error(
                    "Error applying custom rule",
                    rule_id=rule.id,
                    rule_name=rule.name,
                    error=str(e)
                )
                continue
        
        self.logger.info(
            "Custom validations completed",
            custom_findings_count=len(findings)
        )
        
        return findings
    
    async def _run_categorical_analysis(self, document: Document) -> Dict[str, Dict[str, Any]]:
        """
        Executa análises por categoria usando engines base.
        
        Args:
            document: Documento a ser analisado
            
        Returns:
            Dict com resultados por categoria
        """
        # Encontra template aplicável
        applicable_template = None
        for template in self.templates:
            if template.document_type.value == self.doc_type.lower():
                applicable_template = template
                break
        
        # Separa regras por categoria
        structural_rules = self.organization_config.get_rules_by_category("estrutural")
        legal_rules = self.organization_config.get_rules_by_category("juridico")
        clarity_rules = self.organization_config.get_rules_by_category("clareza")
        abnt_rules = self.organization_config.get_rules_by_category("abnt")
        
        # Executa análises paralelas
        tasks = [
            self.base_engine.analyze_structural(document, applicable_template),
            self.base_engine.analyze_legal(document, legal_rules),
            self.base_engine.analyze_clarity(document, clarity_rules),
            self.base_engine.analyze_abnt(document, abnt_rules)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Mapeia resultados
        categories = ['structural', 'legal', 'clarity', 'abnt']
        analysis_results = {}
        
        for i, result in enumerate(results):
            category = categories[i]
            
            if isinstance(result, Exception):
                self.logger.error(
                    f"Error in {category} analysis",
                    error=str(result)
                )
                # Resultado de fallback
                analysis_results[category] = {
                    'score': 50.0,  # Score neutro em caso de erro
                    'findings': [],
                    'metadata': {'error': str(result)}
                }
            else:
                analysis_results[category] = result
        
        return analysis_results
    
    async def _generate_personalized_recommendations(
        self, 
        findings: List[AnalysisFinding], 
        base_scores: Dict[str, float]
    ) -> List[str]:
        """
        Gera recomendações personalizadas baseadas nos achados e configuração organizacional.
        
        Args:
            findings: Lista de findings identificados
            base_scores: Scores base por categoria
            
        Returns:
            Lista de recomendações personalizadas
        """
        recommendations = []
        
        # Identifica categoria com pior desempenho considerando os pesos
        weighted_scores = {
            category: score * (getattr(self.weights, category) / 100)
            for category, score in base_scores.items()
        }
        
        worst_category = min(weighted_scores.keys(), key=lambda k: weighted_scores[k])
        worst_score = base_scores[worst_category]
        
        # Recomendação para categoria mais problemática
        category_names = {
            'structural': 'estrutural',
            'legal': 'jurídica',
            'clarity': 'clareza',
            'abnt': 'padrões ABNT'
        }
        
        if worst_score < 70:
            recommendations.append(
                f"Priorizar melhorias na análise {category_names[worst_category]} "
                f"(score: {worst_score:.1f}), que tem peso de {getattr(self.weights, worst_category):.1f}% "
                f"na configuração da sua organização."
            )
        
        # Recomendações baseadas em findings críticos
        critical_findings = [f for f in findings if f.severity == ProblemSeverity.CRITICA]
        if critical_findings:
            recommendations.append(
                f"Resolver imediatamente {len(critical_findings)} problemas críticos "
                f"identificados antes de prosseguir com o processo."
            )
        
        # Recomendações para regras personalizadas violadas
        custom_violations = [f for f in findings if f.is_custom_rule]
        if custom_violations:
            recommendations.append(
                f"Atenção especial para {len(custom_violations)} violações de regras "
                f"específicas da sua organização."
            )
        
        # Recomendação baseada no peso dominante
        dominant_category = self.weights.get_dominant_category()
        dominant_score = base_scores[dominant_category]
        
        if dominant_score < 80:
            recommendations.append(
                f"Foco especial na categoria {category_names[dominant_category]} "
                f"(peso: {getattr(self.weights, dominant_category):.1f}%), que é prioritária "
                f"para sua organização mas está com score de {dominant_score:.1f}."
            )
        
        # Limita a 5 recomendações mais relevantes
        return recommendations[:5]
    
    def get_analysis_summary(self) -> Dict[str, Any]:
        """
        Retorna sumário da configuração de análise ativa.
        
        Returns:
            Dict com informações da configuração aplicada
        """
        return {
            'organization_config': self.organization_config.get_analysis_summary(),
            'adaptive_settings': {
                'document_type': self.doc_type,
                'custom_rules_active': len(self.custom_rules),
                'templates_available': len(self.templates),
                'weight_distribution': self.weights.get_weight_distribution_type(),
                'dominant_category': self.weights.get_dominant_category()
            },
            'engine_info': {
                'version': '2.0.0-adaptive',
                'capabilities': [
                    'weighted_scoring',
                    'custom_rules',
                    'organizational_templates',
                    'adaptive_analysis'
                ]
            }
        }