#!/usr/bin/env python3
"""
Conformity Checker - Verificação de conformidade para documentos licitatórios

Implementa verificações específicas de conformidade:
- Validação de requisitos obrigatórios
- Verificação de completude
- Análise de riscos de conformidade
- Geração de relatórios de conformidade
"""

import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)

class ConformityLevel(Enum):
    """Níveis de conformidade."""
    COMPLIANT = "compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    NON_COMPLIANT = "non_compliant"
    UNKNOWN = "unknown"

class RiskLevel(Enum):
    """Níveis de risco."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ConformityIssue:
    """Questão de conformidade identificada."""
    id: str
    category: str
    severity: RiskLevel
    description: str
    requirement: str
    recommendation: str
    legal_reference: Optional[str] = None
    impact: Optional[str] = None

@dataclass
class ConformityResult:
    """Resultado da verificação de conformidade."""
    overall_level: ConformityLevel
    compliance_score: float
    issues: List[ConformityIssue]
    requirements_met: List[str]
    requirements_missing: List[str]
    risk_assessment: Dict[str, Any]
    recommendations: List[str]
    metadata: Dict[str, Any]

class ConformityChecker:
    """Verificador de conformidade para documentos licitatórios."""
    
    def __init__(self):
        """Inicializar verificador de conformidade."""
        # Carregar regras de conformidade
        self._load_conformity_rules()
        
        logger.info("Conformity Checker inicializado")
    
    def check_conformity(self, analysis_result: Dict[str, Any], 
                        document_type: str) -> Dict[str, Any]:
        """
        Verificar conformidade do documento baseado no resultado da análise.
        
        Args:
            analysis_result: Resultado da análise do documento
            document_type: Tipo do documento
            
        Returns:
            Resultado da verificação de conformidade
        """
        try:
            # Obter regras específicas para o tipo de documento
            rules = self._get_conformity_rules(document_type)
            
            # Verificar cada categoria de conformidade
            issues = []
            requirements_met = []
            requirements_missing = []
            
            # 1. Verificar conformidade estrutural
            structural_issues = self._check_structural_conformity(
                analysis_result, rules.get('structural', {})
            )
            issues.extend(structural_issues)
            
            # 2. Verificar conformidade legal
            legal_issues = self._check_legal_conformity(
                analysis_result, rules.get('legal', {})
            )
            issues.extend(legal_issues)
            
            # 3. Verificar conformidade de clareza
            clarity_issues = self._check_clarity_conformity(
                analysis_result, rules.get('clarity', {})
            )
            issues.extend(clarity_issues)
            
            # 4. Verificar conformidade ABNT
            abnt_issues = self._check_abnt_conformity(
                analysis_result, rules.get('abnt', {})
            )
            issues.extend(abnt_issues)
            
            # Calcular score de conformidade
            compliance_score = self._calculate_compliance_score(analysis_result, issues)
            
            # Determinar nível geral de conformidade
            overall_level = self._determine_conformity_level(compliance_score, issues)
            
            # Avaliar riscos
            risk_assessment = self._assess_risks(issues, document_type)
            
            # Gerar recomendações
            recommendations = self._generate_recommendations(issues, analysis_result)
            
            # Identificar requisitos atendidos e faltantes
            requirements_met, requirements_missing = self._analyze_requirements(
                analysis_result, rules
            )
            
            result = ConformityResult(
                overall_level=overall_level,
                compliance_score=compliance_score,
                issues=issues,
                requirements_met=requirements_met,
                requirements_missing=requirements_missing,
                risk_assessment=risk_assessment,
                recommendations=recommendations,
                metadata={
                    'document_type': document_type,
                    'analysis_timestamp': analysis_result.get('timestamp'),
                    'total_issues': len(issues),
                    'critical_issues': len([i for i in issues if i.severity == RiskLevel.CRITICAL]),
                    'high_risk_issues': len([i for i in issues if i.severity == RiskLevel.HIGH])
                }
            )
            
            logger.info(f"Conformidade verificada: {overall_level.value} (score: {compliance_score:.2f})")
            
            return asdict(result)
            
        except Exception as e:
            logger.error(f"Erro na verificação de conformidade: {str(e)}")
            raise
    
    def _check_structural_conformity(self, analysis_result: Dict[str, Any],
                                   rules: Dict[str, Any]) -> List[ConformityIssue]:
        """
        Verificar conformidade estrutural.
        
        Args:
            analysis_result: Resultado da análise
            rules: Regras estruturais
            
        Returns:
            Lista de questões de conformidade estrutural
        """
        issues = []
        structural_data = analysis_result.get('categories', {}).get('structural', {})
        
        if not structural_data:
            return issues
        
        score = structural_data.get('score', 0)
        details = structural_data.get('details', {})
        
        # Verificar seções obrigatórias
        sections_required = details.get('sections_required', 0)
        sections_found = details.get('sections_found', 0)
        
        if sections_required > 0:
            missing_sections = sections_required - sections_found
            if missing_sections > 0:
                severity = RiskLevel.CRITICAL if missing_sections > sections_required * 0.5 else RiskLevel.HIGH
                issues.append(ConformityIssue(
                    id="STRUCT_001",
                    category="structural",
                    severity=severity,
                    description=f"Faltam {missing_sections} seções obrigatórias",
                    requirement="Documento deve conter todas as seções obrigatórias",
                    recommendation="Incluir todas as seções obrigatórias conforme tipo de documento",
                    impact="Pode resultar em desclassificação ou questionamentos jurídicos"
                ))
        
        # Verificar numeração
        numbering_score = details.get('numbering_score', 0)
        if numbering_score < 0.6:
            issues.append(ConformityIssue(
                id="STRUCT_002",
                category="structural",
                severity=RiskLevel.MEDIUM,
                description="Numeração inconsistente ou inadequada",
                requirement="Documento deve ter numeração clara e consistente",
                recommendation="Revisar e padronizar numeração de seções e subseções",
                impact="Dificulta navegação e referenciação do documento"
            ))
        
        # Verificar índice
        has_index = details.get('has_index', False)
        if not has_index and sections_required > 5:
            issues.append(ConformityIssue(
                id="STRUCT_003",
                category="structural",
                severity=RiskLevel.LOW,
                description="Índice ou sumário ausente",
                requirement="Documentos extensos devem conter índice",
                recommendation="Incluir índice ou sumário no início do documento",
                impact="Reduz usabilidade do documento"
            ))
        
        # Verificar formatação
        formatting_score = details.get('formatting_score', 0)
        if formatting_score < 0.5:
            issues.append(ConformityIssue(
                id="STRUCT_004",
                category="structural",
                severity=RiskLevel.LOW,
                description="Formatação inconsistente",
                requirement="Documento deve ter formatação padronizada",
                recommendation="Aplicar formatação consistente em todo o documento",
                impact="Prejudica apresentação profissional"
            ))
        
        return issues
    
    def _check_legal_conformity(self, analysis_result: Dict[str, Any],
                              rules: Dict[str, Any]) -> List[ConformityIssue]:
        """
        Verificar conformidade legal.
        
        Args:
            analysis_result: Resultado da análise
            rules: Regras legais
            
        Returns:
            Lista de questões de conformidade legal
        """
        issues = []
        legal_data = analysis_result.get('categories', {}).get('legal', {})
        
        if not legal_data:
            return issues
        
        details = legal_data.get('details', {})
        
        # Verificar referências legais obrigatórias
        laws_required = details.get('laws_required', 0)
        laws_found = details.get('laws_found', 0)
        
        if laws_required > 0:
            missing_laws = laws_required - laws_found
            if missing_laws > 0:
                issues.append(ConformityIssue(
                    id="LEGAL_001",
                    category="legal",
                    severity=RiskLevel.CRITICAL,
                    description=f"Faltam {missing_laws} referências legais obrigatórias",
                    requirement="Documento deve referenciar toda legislação aplicável",
                    recommendation="Incluir todas as referências legais obrigatórias",
                    legal_reference="Lei 8.666/93, Lei 14.133/21",
                    impact="Pode invalidar o processo licitatório"
                ))
        
        # Verificar cláusulas obrigatórias
        clauses_required = details.get('clauses_required', 0)
        clauses_found = details.get('clauses_found', 0)
        
        if clauses_required > 0:
            missing_clauses = clauses_required - clauses_found
            if missing_clauses > 0:
                severity = RiskLevel.CRITICAL if missing_clauses > clauses_required * 0.3 else RiskLevel.HIGH
                issues.append(ConformityIssue(
                    id="LEGAL_002",
                    category="legal",
                    severity=severity,
                    description=f"Faltam {missing_clauses} cláusulas obrigatórias",
                    requirement="Documento deve conter todas as cláusulas obrigatórias",
                    recommendation="Incluir todas as cláusulas obrigatórias conforme legislação",
                    impact="Pode resultar em questionamentos jurídicos"
                ))
        
        # Verificar especificação de prazos
        deadline_score = details.get('deadline_score', 0)
        if deadline_score < 0.7:
            issues.append(ConformityIssue(
                id="LEGAL_003",
                category="legal",
                severity=RiskLevel.HIGH,
                description="Prazos não claramente especificados",
                requirement="Todos os prazos devem ser claramente definidos",
                recommendation="Especificar claramente todos os prazos e datas",
                impact="Pode gerar conflitos e questionamentos"
            ))
        
        return issues
    
    def _check_clarity_conformity(self, analysis_result: Dict[str, Any],
                                rules: Dict[str, Any]) -> List[ConformityIssue]:
        """
        Verificar conformidade de clareza.
        
        Args:
            analysis_result: Resultado da análise
            rules: Regras de clareza
            
        Returns:
            Lista de questões de conformidade de clareza
        """
        issues = []
        clarity_data = analysis_result.get('categories', {}).get('clarity', {})
        
        if not clarity_data:
            return issues
        
        details = clarity_data.get('details', {})
        
        # Verificar legibilidade
        readability_score = details.get('readability_score', 0)
        if readability_score < 0.5:
            issues.append(ConformityIssue(
                id="CLARITY_001",
                category="clarity",
                severity=RiskLevel.MEDIUM,
                description="Texto de difícil leitura",
                requirement="Documento deve ser claro e de fácil compreensão",
                recommendation="Simplificar linguagem e estrutura das frases",
                impact="Pode gerar interpretações incorretas"
            ))
        
        # Verificar jargão excessivo
        jargon_score = details.get('jargon_score', 0)
        if jargon_score < 0.6:
            issues.append(ConformityIssue(
                id="CLARITY_002",
                category="clarity",
                severity=RiskLevel.LOW,
                description="Uso excessivo de jargão técnico",
                requirement="Linguagem deve ser acessível",
                recommendation="Definir termos técnicos ou usar linguagem mais simples",
                impact="Pode excluir participantes menos especializados"
            ))
        
        # Verificar consistência terminológica
        consistency_score = details.get('consistency_score', 0)
        if consistency_score < 0.7:
            issues.append(ConformityIssue(
                id="CLARITY_003",
                category="clarity",
                severity=RiskLevel.MEDIUM,
                description="Terminologia inconsistente",
                requirement="Terminologia deve ser consistente",
                recommendation="Padronizar terminologia em todo o documento",
                impact="Pode gerar confusão e interpretações divergentes"
            ))
        
        # Verificar ambiguidades
        ambiguity_score = details.get('ambiguity_score', 0)
        if ambiguity_score < 0.6:
            issues.append(ConformityIssue(
                id="CLARITY_004",
                category="clarity",
                severity=RiskLevel.HIGH,
                description="Linguagem ambígua detectada",
                requirement="Linguagem deve ser precisa e inequívoca",
                recommendation="Eliminar ambiguidades e esclarecer passagens duvidosas",
                impact="Pode resultar em questionamentos e recursos"
            ))
        
        return issues
    
    def _check_abnt_conformity(self, analysis_result: Dict[str, Any],
                             rules: Dict[str, Any]) -> List[ConformityIssue]:
        """
        Verificar conformidade com normas ABNT.
        
        Args:
            analysis_result: Resultado da análise
            rules: Regras ABNT
            
        Returns:
            Lista de questões de conformidade ABNT
        """
        issues = []
        abnt_data = analysis_result.get('categories', {}).get('abnt', {})
        
        if not abnt_data:
            return issues
        
        details = abnt_data.get('details', {})
        
        # Verificar citações
        citation_score = details.get('citation_score', 0)
        if citation_score < 0.6:
            issues.append(ConformityIssue(
                id="ABNT_001",
                category="abnt",
                severity=RiskLevel.LOW,
                description="Citações não seguem padrão ABNT",
                requirement="Citações devem seguir NBR 6023",
                recommendation="Revisar formato das citações conforme ABNT",
                legal_reference="NBR 6023",
                impact="Prejudica credibilidade acadêmica"
            ))
        
        # Verificar numeração de páginas
        page_numbering_score = details.get('page_numbering_score', 0)
        if page_numbering_score < 0.7:
            issues.append(ConformityIssue(
                id="ABNT_002",
                category="abnt",
                severity=RiskLevel.LOW,
                description="Numeração de páginas inadequada",
                requirement="Páginas devem ser numeradas conforme ABNT",
                recommendation="Ajustar numeração de páginas",
                impact="Reduz organização do documento"
            ))
        
        # Verificar formatação ABNT
        formatting_abnt_score = details.get('formatting_abnt_score', 0)
        if formatting_abnt_score < 0.5:
            issues.append(ConformityIssue(
                id="ABNT_003",
                category="abnt",
                severity=RiskLevel.LOW,
                description="Formatação não segue padrões ABNT",
                requirement="Formatação deve seguir normas ABNT",
                recommendation="Ajustar margens, espaçamento e fontes",
                impact="Prejudica apresentação profissional"
            ))
        
        # Verificar estrutura ABNT
        structure_abnt_score = details.get('structure_abnt_score', 0)
        if structure_abnt_score < 0.6:
            issues.append(ConformityIssue(
                id="ABNT_004",
                category="abnt",
                severity=RiskLevel.MEDIUM,
                description="Estrutura não segue padrões ABNT",
                requirement="Estrutura deve seguir normas ABNT",
                recommendation="Reorganizar documento conforme estrutura ABNT",
                impact="Pode não atender requisitos formais"
            ))
        
        return issues
    
    def _calculate_compliance_score(self, analysis_result: Dict[str, Any],
                                  issues: List[ConformityIssue]) -> float:
        """
        Calcular score geral de conformidade.
        
        Args:
            analysis_result: Resultado da análise
            issues: Lista de questões identificadas
            
        Returns:
            Score de conformidade (0.0 a 1.0)
        """
        # Score base da análise
        base_score = analysis_result.get('weighted_score', 0.0)
        
        # Penalizar baseado na severidade das questões
        penalty = 0.0
        
        for issue in issues:
            if issue.severity == RiskLevel.CRITICAL:
                penalty += 0.15
            elif issue.severity == RiskLevel.HIGH:
                penalty += 0.10
            elif issue.severity == RiskLevel.MEDIUM:
                penalty += 0.05
            elif issue.severity == RiskLevel.LOW:
                penalty += 0.02
        
        # Aplicar penalidade
        compliance_score = max(0.0, base_score - penalty)
        
        return min(1.0, compliance_score)
    
    def _determine_conformity_level(self, compliance_score: float,
                                  issues: List[ConformityIssue]) -> ConformityLevel:
        """
        Determinar nível geral de conformidade.
        
        Args:
            compliance_score: Score de conformidade
            issues: Lista de questões
            
        Returns:
            Nível de conformidade
        """
        # Verificar questões críticas
        critical_issues = [i for i in issues if i.severity == RiskLevel.CRITICAL]
        high_issues = [i for i in issues if i.severity == RiskLevel.HIGH]
        
        if critical_issues:
            return ConformityLevel.NON_COMPLIANT
        elif len(high_issues) > 3 or compliance_score < 0.6:
            return ConformityLevel.NON_COMPLIANT
        elif len(high_issues) > 0 or compliance_score < 0.8:
            return ConformityLevel.PARTIALLY_COMPLIANT
        elif compliance_score >= 0.8:
            return ConformityLevel.COMPLIANT
        else:
            return ConformityLevel.UNKNOWN
    
    def _assess_risks(self, issues: List[ConformityIssue], 
                     document_type: str) -> Dict[str, Any]:
        """
        Avaliar riscos baseado nas questões identificadas.
        
        Args:
            issues: Lista de questões
            document_type: Tipo do documento
            
        Returns:
            Avaliação de riscos
        """
        risk_counts = {
            RiskLevel.CRITICAL: len([i for i in issues if i.severity == RiskLevel.CRITICAL]),
            RiskLevel.HIGH: len([i for i in issues if i.severity == RiskLevel.HIGH]),
            RiskLevel.MEDIUM: len([i for i in issues if i.severity == RiskLevel.MEDIUM]),
            RiskLevel.LOW: len([i for i in issues if i.severity == RiskLevel.LOW])
        }
        
        # Determinar risco geral
        if risk_counts[RiskLevel.CRITICAL] > 0:
            overall_risk = RiskLevel.CRITICAL
        elif risk_counts[RiskLevel.HIGH] > 2:
            overall_risk = RiskLevel.HIGH
        elif risk_counts[RiskLevel.HIGH] > 0 or risk_counts[RiskLevel.MEDIUM] > 3:
            overall_risk = RiskLevel.MEDIUM
        else:
            overall_risk = RiskLevel.LOW
        
        # Riscos específicos por categoria
        category_risks = {}
        for issue in issues:
            if issue.category not in category_risks:
                category_risks[issue.category] = []
            category_risks[issue.category].append(issue.severity.value)
        
        return {
            'overall_risk': overall_risk.value,
            'risk_counts': {k.value: v for k, v in risk_counts.items()},
            'category_risks': category_risks,
            'total_issues': len(issues),
            'risk_factors': self._identify_risk_factors(issues, document_type)
        }
    
    def _identify_risk_factors(self, issues: List[ConformityIssue],
                             document_type: str) -> List[str]:
        """
        Identificar fatores de risco específicos.
        
        Args:
            issues: Lista de questões
            document_type: Tipo do documento
            
        Returns:
            Lista de fatores de risco
        """
        risk_factors = []
        
        # Verificar padrões de risco
        legal_issues = [i for i in issues if i.category == 'legal']
        structural_issues = [i for i in issues if i.category == 'structural']
        
        if len(legal_issues) > 2:
            risk_factors.append("Múltiplas questões legais podem invalidar o processo")
        
        if len(structural_issues) > 3:
            risk_factors.append("Problemas estruturais podem prejudicar compreensão")
        
        critical_issues = [i for i in issues if i.severity == RiskLevel.CRITICAL]
        if critical_issues:
            risk_factors.append("Questões críticas requerem correção imediata")
        
        # Riscos específicos por tipo de documento
        if document_type == 'edital_licitacao':
            if any('seção' in i.description.lower() for i in issues):
                risk_factors.append("Seções faltantes podem desclassificar o edital")
        
        return risk_factors
    
    def _generate_recommendations(self, issues: List[ConformityIssue],
                                analysis_result: Dict[str, Any]) -> List[str]:
        """
        Gerar recomendações baseadas nas questões identificadas.
        
        Args:
            issues: Lista de questões
            analysis_result: Resultado da análise
            
        Returns:
            Lista de recomendações
        """
        recommendations = []
        
        # Priorizar recomendações por severidade
        critical_issues = [i for i in issues if i.severity == RiskLevel.CRITICAL]
        high_issues = [i for i in issues if i.severity == RiskLevel.HIGH]
        
        # Recomendações para questões críticas
        if critical_issues:
            recommendations.append("URGENTE: Corrigir questões críticas antes de publicar")
            for issue in critical_issues[:3]:  # Top 3 críticas
                recommendations.append(f"• {issue.recommendation}")
        
        # Recomendações para questões de alto risco
        if high_issues:
            recommendations.append("IMPORTANTE: Revisar questões de alto risco")
            for issue in high_issues[:2]:  # Top 2 de alto risco
                recommendations.append(f"• {issue.recommendation}")
        
        # Recomendações gerais baseadas no score
        overall_score = analysis_result.get('weighted_score', 0.0)
        if overall_score < 0.7:
            recommendations.append("Revisar documento completamente antes da publicação")
        elif overall_score < 0.8:
            recommendations.append("Fazer revisão focada nas áreas identificadas")
        
        # Recomendações por categoria
        categories = analysis_result.get('categories', {})
        for category, data in categories.items():
            score = data.get('score', 0)
            if score < 0.6:
                recommendations.append(f"Priorizar melhorias na categoria: {category}")
        
        return recommendations[:10]  # Limitar a 10 recomendações
    
    def _analyze_requirements(self, analysis_result: Dict[str, Any],
                            rules: Dict[str, Any]) -> Tuple[List[str], List[str]]:
        """
        Analisar requisitos atendidos e faltantes.
        
        Args:
            analysis_result: Resultado da análise
            rules: Regras de conformidade
            
        Returns:
            Tupla com (requisitos_atendidos, requisitos_faltantes)
        """
        requirements_met = []
        requirements_missing = []
        
        # Analisar cada categoria
        categories = analysis_result.get('categories', {})
        
        for category, data in categories.items():
            details = data.get('details', {})
            score = data.get('score', 0)
            
            if category == 'structural':
                sections_required = details.get('sections_required', 0)
                sections_found = details.get('sections_found', 0)
                
                if sections_found > 0:
                    requirements_met.append(f"Seções estruturais: {sections_found}/{sections_required}")
                
                if sections_found < sections_required:
                    missing = sections_required - sections_found
                    requirements_missing.append(f"Faltam {missing} seções obrigatórias")
                
                if details.get('has_index'):
                    requirements_met.append("Índice/sumário presente")
                elif sections_required > 5:
                    requirements_missing.append("Índice/sumário ausente")
            
            elif category == 'legal':
                laws_required = details.get('laws_required', 0)
                laws_found = details.get('laws_found', 0)
                
                if laws_found > 0:
                    requirements_met.append(f"Referências legais: {laws_found}/{laws_required}")
                
                if laws_found < laws_required:
                    missing = laws_required - laws_found
                    requirements_missing.append(f"Faltam {missing} referências legais")
                
                clauses_required = details.get('clauses_required', 0)
                clauses_found = details.get('clauses_found', 0)
                
                if clauses_found > 0:
                    requirements_met.append(f"Cláusulas: {clauses_found}/{clauses_required}")
                
                if clauses_found < clauses_required:
                    missing = clauses_required - clauses_found
                    requirements_missing.append(f"Faltam {missing} cláusulas obrigatórias")
        
        return requirements_met, requirements_missing
    
    def _load_conformity_rules(self):
        """
        Carregar regras de conformidade.
        """
        # Por enquanto, usar regras hardcoded
        # Em produção, carregar de arquivos de configuração
        self.conformity_rules = {
            'edital_licitacao': {
                'structural': {
                    'required_sections': ['objeto', 'condições', 'documentação', 'julgamento'],
                    'min_score': 0.7
                },
                'legal': {
                    'required_laws': ['Lei 8.666/93', 'Lei 14.133/21'],
                    'required_clauses': ['habilitação', 'julgamento', 'recursos'],
                    'min_score': 0.8
                },
                'clarity': {
                    'min_readability': 0.6,
                    'max_jargon': 0.3
                },
                'abnt': {
                    'required_elements': ['numeração', 'formatação'],
                    'min_score': 0.5
                }
            }
        }
    
    def _get_conformity_rules(self, document_type: str) -> Dict[str, Any]:
        """
        Obter regras de conformidade para um tipo de documento.
        
        Args:
            document_type: Tipo do documento
            
        Returns:
            Regras de conformidade
        """
        return self.conformity_rules.get(document_type, {})
    
    def add_custom_rule(self, document_type: str, category: str, 
                       rule_name: str, rule_config: Dict[str, Any]):
        """
        Adicionar regra customizada de conformidade.
        
        Args:
            document_type: Tipo do documento
            category: Categoria da regra
            rule_name: Nome da regra
            rule_config: Configuração da regra
        """
        if document_type not in self.conformity_rules:
            self.conformity_rules[document_type] = {}
        
        if category not in self.conformity_rules[document_type]:
            self.conformity_rules[document_type][category] = {}
        
        self.conformity_rules[document_type][category][rule_name] = rule_config
        
        logger.info(f"Regra customizada adicionada: {document_type}.{category}.{rule_name}")
    
    def get_conformity_summary(self, conformity_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Obter resumo executivo da conformidade.
        
        Args:
            conformity_result: Resultado da verificação de conformidade
            
        Returns:
            Resumo executivo
        """
        return {
            'status': conformity_result['overall_level'],
            'score': conformity_result['compliance_score'],
            'total_issues': len(conformity_result['issues']),
            'critical_issues': conformity_result['metadata']['critical_issues'],
            'high_risk_issues': conformity_result['metadata']['high_risk_issues'],
            'top_recommendations': conformity_result['recommendations'][:3],
            'risk_level': conformity_result['risk_assessment']['overall_risk']
        }