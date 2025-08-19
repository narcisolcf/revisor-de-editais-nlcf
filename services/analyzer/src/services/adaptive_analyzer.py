"""Motor de Análise Adaptativo - Adaptive Analyzer

Este módulo implementa o motor de análise adaptativo para o sistema LicitaReview.
O motor é capaz de ajustar dinamicamente os parâmetros de análise baseado em:
- Configurações personalizadas do usuário
- Regras customizadas definidas
- Histórico de análises anteriores
- Feedback do usuário
- Padrões identificados nos documentos

Funcionalidades principais:
- Análise adaptativa baseada em configuração
- Aplicação de regras personalizadas
- Pontuação dinâmica e ponderada
- Classificação automática de documentos
- Detecção de anomalias e inconsistências
- Geração de relatórios detalhados
- Aprendizado contínuo baseado em feedback
"""

from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from sklearn.feature_extraction.text import TfidfVectorizer
import re

# Imports locais
from ..models.analysis_models import DocumentAnalysis, ScoreBreakdown
from ..models.config_models import AnalysisConfig, CustomRule, ParameterWeights
from ..models.document_models import Document
from ..utils.logger import get_logger

logger = get_logger(__name__)

class AnalysisStatus(Enum):
    """Status possíveis para uma análise"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class RuleSeverity(Enum):
    """Níveis de severidade para regras"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class AdaptiveContext:
    """Contexto adaptativo para análise"""
    document_type: str
    organization_id: str
    user_id: str
    historical_data: Dict[str, Any]
    configuration: AnalysisConfig
    custom_rules: List[CustomRule]
    parameter_weights: ParameterWeights
    learning_data: Dict[str, Any]

@dataclass
class RuleExecution:
    """Resultado da execução de uma regra"""
    rule_id: str
    rule_name: str
    executed: bool
    conditions_met: bool
    actions_performed: List[str]
    score_impact: float
    flags_added: List[str]
    execution_time: float
    error_message: Optional[str] = None

@dataclass
class AdaptiveAnalysisResult:
    """Resultado completo da análise adaptativa"""
    document_id: str
    analysis_id: str
    status: AnalysisStatus
    overall_score: float
    confidence_level: float
    score_breakdown: ScoreBreakdown
    flags: List[str]
    recommendations: List[str]
    rule_executions: List[RuleExecution]
    processing_time: float
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

class AdaptiveAnalyzer:
    """Motor de Análise Adaptativo Principal"""
    
    def __init__(self):
        self.logger = logger
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.analysis_cache = {}
        self.rule_performance_cache = {}
        self.learning_weights = {
            'user_feedback': 0.3,
            'historical_accuracy': 0.4,
            'rule_effectiveness': 0.2,
            'document_similarity': 0.1
        }
    
    async def analyze_document(self, 
                             document: Document, 
                             context: AdaptiveContext) -> AdaptiveAnalysisResult:
        """Executa análise adaptativa completa de um documento"""
        start_time = datetime.now()
        analysis_id = f"analysis_{document.id}_{int(start_time.timestamp())}"
        
        try:
            self.logger.info(f"Iniciando análise adaptativa para documento {document.id}")
            
            # 1. Preparação e validação inicial
            await self._validate_inputs(document, context)
            
            # 2. Análise de contexto e adaptação de parâmetros
            adapted_weights = await self._adapt_parameters(document, context)
            
            # 3. Análise base do documento
            base_analysis = await self._perform_base_analysis(document, context)
            
            # 4. Aplicação de regras personalizadas
            rule_results = await self._apply_custom_rules(document, context, base_analysis)
            
            # 5. Cálculo de pontuação adaptativa
            adaptive_score = await self._calculate_adaptive_score(
                base_analysis, rule_results, adapted_weights
            )
            
            # 6. Geração de flags e recomendações
            flags, recommendations = await self._generate_insights(
                document, base_analysis, rule_results, adaptive_score
            )
            
            # 7. Cálculo de confiança
            confidence = await self._calculate_confidence(
                document, context, base_analysis, rule_results
            )
            
            # 8. Compilação do resultado final
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = AdaptiveAnalysisResult(
                document_id=document.id,
                analysis_id=analysis_id,
                status=AnalysisStatus.COMPLETED,
                overall_score=adaptive_score.overall_score,
                confidence_level=confidence,
                score_breakdown=adaptive_score,
                flags=flags,
                recommendations=recommendations,
                rule_executions=rule_results,
                processing_time=processing_time,
                metadata={
                    'document_type': document.document_type,
                    'organization_id': context.organization_id,
                    'user_id': context.user_id,
                    'adapted_weights': asdict(adapted_weights),
                    'base_analysis_summary': self._summarize_base_analysis(base_analysis)
                },
                created_at=start_time,
                updated_at=datetime.now()
            )
            
            # 9. Atualização do cache e aprendizado
            await self._update_learning_data(document, context, result)
            
            self.logger.info(f"Análise adaptativa concluída para documento {document.id} em {processing_time:.2f}s")
            return result
            
        except Exception as e:
            self.logger.error(f"Erro na análise adaptativa do documento {document.id}: {str(e)}")
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return AdaptiveAnalysisResult(
                document_id=document.id,
                analysis_id=analysis_id,
                status=AnalysisStatus.FAILED,
                overall_score=0.0,
                confidence_level=0.0,
                score_breakdown=ScoreBreakdown(),
                flags=["ANALYSIS_ERROR"],
                recommendations=["Erro na análise. Verifique o documento e tente novamente."],
                rule_executions=[],
                processing_time=processing_time,
                metadata={'error': str(e)},
                created_at=start_time,
                updated_at=datetime.now()
            )
    
    async def _validate_inputs(self, document: Document, context: AdaptiveContext) -> None:
        """Valida os inputs da análise"""
        if not document or not document.content:
            raise ValueError("Documento inválido ou sem conteúdo")
        
        if not context.configuration:
            raise ValueError("Configuração de análise não fornecida")
        
        if not context.parameter_weights:
            raise ValueError("Pesos de parâmetros não fornecidos")
    
    async def _adapt_parameters(self, document: Document, context: AdaptiveContext) -> ParameterWeights:
        """Adapta os parâmetros baseado no contexto e histórico"""
        base_weights = context.parameter_weights
        
        # Adaptação baseada no tipo de documento
        type_adaptations = await self._get_document_type_adaptations(document.document_type)
        
        # Adaptação baseada no histórico do usuário
        user_adaptations = await self._get_user_historical_adaptations(context.user_id)
        
        # Adaptação baseada na organização
        org_adaptations = await self._get_organization_adaptations(context.organization_id)
        
        # Combinar adaptações
        adapted_weights = self._combine_weight_adaptations(
            base_weights, type_adaptations, user_adaptations, org_adaptations
        )
        
        self.logger.debug(f"Parâmetros adaptados para documento {document.id}")
        return adapted_weights
    
    async def _perform_base_analysis(self, document: Document, context: AdaptiveContext) -> DocumentAnalysis:
        """Executa análise base do documento"""
        # Análise de conteúdo textual
        text_analysis = await self._analyze_text_content(document.content)
        
        # Análise de estrutura
        structure_analysis = await self._analyze_document_structure(document)
        
        # Análise de metadados
        metadata_analysis = await self._analyze_metadata(document)
        
        # Análise de conformidade básica
        compliance_analysis = await self._analyze_basic_compliance(document, context)
        
        # Compilar análise base
        base_analysis = DocumentAnalysis(
            document_id=document.id,
            text_analysis=text_analysis,
            structure_analysis=structure_analysis,
            metadata_analysis=metadata_analysis,
            compliance_analysis=compliance_analysis,
            created_at=datetime.now()
        )
        
        return base_analysis
    
    async def _apply_custom_rules(self, 
                                document: Document, 
                                context: AdaptiveContext, 
                                base_analysis: DocumentAnalysis) -> List[RuleExecution]:
        """Aplica regras personalizadas ao documento"""
        rule_executions = []
        
        for rule in context.custom_rules:
            if not rule.is_active:
                continue
            
            start_time = datetime.now()
            
            try:
                # Verificar condições da regra
                conditions_met = await self._evaluate_rule_conditions(
                    rule, document, base_analysis, context
                )
                
                actions_performed = []
                score_impact = 0.0
                flags_added = []
                
                if conditions_met:
                    # Executar ações da regra
                    actions_performed, score_impact, flags_added = await self._execute_rule_actions(
                        rule, document, base_analysis, context
                    )
                
                execution_time = (datetime.now() - start_time).total_seconds()
                
                rule_execution = RuleExecution(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    executed=True,
                    conditions_met=conditions_met,
                    actions_performed=actions_performed,
                    score_impact=score_impact,
                    flags_added=flags_added,
                    execution_time=execution_time
                )
                
                rule_executions.append(rule_execution)
                
            except Exception as e:
                self.logger.error(f"Erro ao executar regra {rule.id}: {str(e)}")
                
                rule_execution = RuleExecution(
                    rule_id=rule.id,
                    rule_name=rule.name,
                    executed=False,
                    conditions_met=False,
                    actions_performed=[],
                    score_impact=0.0,
                    flags_added=[],
                    execution_time=0.0,
                    error_message=str(e)
                )
                
                rule_executions.append(rule_execution)
        
        return rule_executions
    
    async def _evaluate_rule_conditions(self, 
                                       rule: CustomRule, 
                                       document: Document, 
                                       base_analysis: DocumentAnalysis, 
                                       context: AdaptiveContext) -> bool:
        """Avalia as condições de uma regra"""
        if not rule.conditions:
            return True
        
        # Criar contexto de dados para avaliação
        evaluation_context = {
            'document': document,
            'analysis': base_analysis,
            'config': context.configuration,
            'metadata': document.metadata or {}
        }
        
        # Avaliar cada condição
        condition_results = []
        
        for condition in rule.conditions:
            result = await self._evaluate_single_condition(condition, evaluation_context)
            condition_results.append(result)
        
        # Aplicar lógica booleana entre condições
        return self._apply_boolean_logic(rule.conditions, condition_results)
    
    async def _evaluate_single_condition(self, condition: Any, context: Dict[str, Any]) -> bool:
        """Avalia uma única condição"""
        try:
            field_value = self._extract_field_value(condition.field, context)
            
            if condition.operator == 'equals':
                return field_value == condition.value
            elif condition.operator == 'contains':
                return str(condition.value).lower() in str(field_value).lower()
            elif condition.operator == 'greater_than':
                return float(field_value) > float(condition.value)
            elif condition.operator == 'less_than':
                return float(field_value) < float(condition.value)
            elif condition.operator == 'regex':
                return bool(re.search(str(condition.value), str(field_value)))
            elif condition.operator == 'exists':
                return field_value is not None
            elif condition.operator == 'not_exists':
                return field_value is None
            else:
                self.logger.warning(f"Operador desconhecido: {condition.operator}")
                return False
                
        except Exception as e:
            self.logger.error(f"Erro ao avaliar condição: {str(e)}")
            return False
    
    def _extract_field_value(self, field_path: str, context: Dict[str, Any]) -> Any:
        """Extrai valor de um campo usando notação de ponto"""
        try:
            keys = field_path.split('.')
            value = context
            
            for key in keys:
                if hasattr(value, key):
                    value = getattr(value, key)
                elif isinstance(value, dict) and key in value:
                    value = value[key]
                else:
                    return None
            
            return value
            
        except Exception:
            return None
    
    def _apply_boolean_logic(self, conditions: List[Any], results: List[bool]) -> bool:
        """Aplica lógica booleana entre condições"""
        if not conditions or not results:
            return True
        
        if len(results) == 1:
            return results[0]
        
        # Primeira condição sempre é verdadeira se passou
        final_result = results[0]
        
        for i in range(1, len(results)):
            condition = conditions[i]
            logical_op = getattr(condition, 'logical_operator', 'AND')
            
            if logical_op == 'AND':
                final_result = final_result and results[i]
            elif logical_op == 'OR':
                final_result = final_result or results[i]
        
        return final_result
    
    async def _execute_rule_actions(self, 
                                  rule: CustomRule, 
                                  document: Document, 
                                  base_analysis: DocumentAnalysis, 
                                  context: AdaptiveContext) -> Tuple[List[str], float, List[str]]:
        """Executa as ações de uma regra"""
        actions_performed = []
        total_score_impact = 0.0
        flags_added = []
        
        for action in rule.actions:
            try:
                if action.type == 'set_score':
                    score_adjustment = action.parameters.get('score_adjustment', 0.0)
                    total_score_impact += score_adjustment
                    actions_performed.append(f"Ajuste de pontuação: {score_adjustment}")
                
                elif action.type == 'add_flag':
                    flag = action.parameters.get('flag', 'CUSTOM_FLAG')
                    flags_added.append(flag)
                    actions_performed.append(f"Flag adicionada: {flag}")
                
                elif action.type == 'send_notification':
                    # Implementar envio de notificação
                    actions_performed.append("Notificação enviada")
                
                elif action.type == 'block_approval':
                    flags_added.append('BLOCKED_APPROVAL')
                    actions_performed.append("Aprovação bloqueada")
                
                elif action.type == 'require_review':
                    flags_added.append('REQUIRES_REVIEW')
                    actions_performed.append("Revisão obrigatória")
                
            except Exception as e:
                self.logger.error(f"Erro ao executar ação {action.type}: {str(e)}")
        
        return actions_performed, total_score_impact, flags_added
    
    async def _calculate_adaptive_score(self, 
                                      base_analysis: DocumentAnalysis, 
                                      rule_results: List[RuleExecution], 
                                      weights: ParameterWeights) -> ScoreBreakdown:
        """Calcula pontuação adaptativa final"""
        # Pontuações base
        compliance_score = self._calculate_compliance_score(base_analysis, weights)
        quality_score = self._calculate_quality_score(base_analysis, weights)
        completeness_score = self._calculate_completeness_score(base_analysis, weights)
        consistency_score = self._calculate_consistency_score(base_analysis, weights)
        
        # Aplicar impactos das regras
        rule_impact = sum(rule.score_impact for rule in rule_results if rule.executed)
        
        # Calcular pontuação final ponderada
        base_score = (
            compliance_score * weights.compliance +
            quality_score * weights.quality +
            completeness_score * weights.completeness +
            consistency_score * weights.consistency
        ) / (weights.compliance + weights.quality + weights.completeness + weights.consistency)
        
        # Aplicar impacto das regras
        final_score = max(0.0, min(1.0, base_score + rule_impact))
        
        return ScoreBreakdown(
            overall_score=final_score,
            compliance_score=compliance_score,
            quality_score=quality_score,
            completeness_score=completeness_score,
            consistency_score=consistency_score,
            rule_impact=rule_impact,
            weights_used=asdict(weights)
        )
    
    async def _generate_insights(self, 
                               document: Document, 
                               base_analysis: DocumentAnalysis, 
                               rule_results: List[RuleExecution], 
                               score: ScoreBreakdown) -> Tuple[List[str], List[str]]:
        """Gera flags e recomendações baseadas na análise"""
        flags = []
        recommendations = []
        
        # Flags das regras
        for rule_result in rule_results:
            flags.extend(rule_result.flags_added)
        
        # Flags baseadas na pontuação
        if score.overall_score < 0.3:
            flags.append('LOW_SCORE')
            recommendations.append('Documento requer revisão significativa')
        elif score.overall_score < 0.6:
            flags.append('MEDIUM_SCORE')
            recommendations.append('Documento requer algumas melhorias')
        
        # Flags específicas por categoria
        if score.compliance_score < 0.5:
            flags.append('COMPLIANCE_ISSUES')
            recommendations.append('Verificar conformidade com regulamentações')
        
        if score.quality_score < 0.5:
            flags.append('QUALITY_ISSUES')
            recommendations.append('Melhorar qualidade do conteúdo')
        
        if score.completeness_score < 0.5:
            flags.append('INCOMPLETE_DOCUMENT')
            recommendations.append('Documento parece incompleto')
        
        if score.consistency_score < 0.5:
            flags.append('CONSISTENCY_ISSUES')
            recommendations.append('Verificar consistência interna do documento')
        
        return list(set(flags)), recommendations
    
    async def _calculate_confidence(self, 
                                  document: Document, 
                                  context: AdaptiveContext, 
                                  base_analysis: DocumentAnalysis, 
                                  rule_results: List[RuleExecution]) -> float:
        """Calcula nível de confiança da análise"""
        confidence_factors = []
        
        # Confiança baseada na qualidade do documento
        doc_quality = len(document.content) / 1000  # Normalizar por tamanho
        confidence_factors.append(min(1.0, doc_quality))
        
        # Confiança baseada no número de regras executadas com sucesso
        successful_rules = sum(1 for rule in rule_results if rule.executed and not rule.error_message)
        total_rules = len(rule_results)
        rule_confidence = successful_rules / total_rules if total_rules > 0 else 1.0
        confidence_factors.append(rule_confidence)
        
        # Confiança baseada no histórico
        historical_confidence = await self._get_historical_confidence(context)
        confidence_factors.append(historical_confidence)
        
        # Média ponderada
        weights = [0.3, 0.4, 0.3]
        confidence = sum(f * w for f, w in zip(confidence_factors, weights))
        
        return max(0.1, min(1.0, confidence))
    
    async def _update_learning_data(self, 
                                  document: Document, 
                                  context: AdaptiveContext, 
                                  result: AdaptiveAnalysisResult) -> None:
        """Atualiza dados de aprendizado para futuras análises"""
        try:
            # Atualizar cache de performance de regras
            for rule_execution in result.rule_executions:
                rule_id = rule_execution.rule_id
                if rule_id not in self.rule_performance_cache:
                    self.rule_performance_cache[rule_id] = {
                        'executions': 0,
                        'successes': 0,
                        'avg_execution_time': 0.0,
                        'total_score_impact': 0.0
                    }
                
                cache_entry = self.rule_performance_cache[rule_id]
                cache_entry['executions'] += 1
                
                if rule_execution.executed and not rule_execution.error_message:
                    cache_entry['successes'] += 1
                
                # Atualizar tempo médio de execução
                cache_entry['avg_execution_time'] = (
                    (cache_entry['avg_execution_time'] * (cache_entry['executions'] - 1) + 
                     rule_execution.execution_time) / cache_entry['executions']
                )
                
                cache_entry['total_score_impact'] += rule_execution.score_impact
            
            # Atualizar cache de análise
            self.analysis_cache[document.id] = {
                'result': result,
                'timestamp': datetime.now(),
                'context_hash': hash(str(asdict(context)))
            }
            
            self.logger.debug(f"Dados de aprendizado atualizados para documento {document.id}")
            
        except Exception as e:
            self.logger.error(f"Erro ao atualizar dados de aprendizado: {str(e)}")
    
    # Métodos auxiliares para análises específicas
    
    async def _analyze_text_content(self, content: str) -> Dict[str, Any]:
        """Analisa conteúdo textual do documento"""
        return {
            'word_count': len(content.split()),
            'char_count': len(content),
            'readability_score': self._calculate_readability(content),
            'language_detected': 'pt-br',  # Simplificado
            'key_terms': self._extract_key_terms(content)
        }
    
    async def _analyze_document_structure(self, document: Document) -> Dict[str, Any]:
        """Analisa estrutura do documento"""
        return {
            'has_title': bool(re.search(r'^.{1,100}$', document.content.split('\n')[0])),
            'paragraph_count': len(document.content.split('\n\n')),
            'section_count': len(re.findall(r'^\d+\.', document.content, re.MULTILINE)),
            'has_tables': 'tabela' in document.content.lower() or '|' in document.content,
            'has_lists': bool(re.search(r'^\s*[-*•]', document.content, re.MULTILINE))
        }
    
    async def _analyze_metadata(self, document: Document) -> Dict[str, Any]:
        """Analisa metadados do documento"""
        metadata = document.metadata or {}
        return {
            'has_creation_date': 'creation_date' in metadata,
            'has_author': 'author' in metadata,
            'file_size': metadata.get('file_size', 0),
            'file_type': metadata.get('file_type', 'unknown'),
            'metadata_completeness': len(metadata) / 10  # Normalizado
        }
    
    async def _analyze_basic_compliance(self, document: Document, context: AdaptiveContext) -> Dict[str, Any]:
        """Analisa conformidade básica"""
        return {
            'has_required_sections': self._check_required_sections(document, context),
            'meets_length_requirements': self._check_length_requirements(document, context),
            'has_proper_formatting': self._check_formatting(document),
            'compliance_score': 0.8  # Placeholder
        }
    
    def _calculate_readability(self, text: str) -> float:
        """Calcula índice de legibilidade simplificado"""
        sentences = len(re.split(r'[.!?]+', text))
        words = len(text.split())
        
        if sentences == 0:
            return 0.0
        
        avg_sentence_length = words / sentences
        # Fórmula simplificada baseada no tamanho médio das sentenças
        readability = max(0.0, min(1.0, 1.0 - (avg_sentence_length - 15) / 50))
        return readability
    
    def _extract_key_terms(self, text: str) -> List[str]:
        """Extrai termos-chave do texto"""
        # Implementação simplificada
        words = re.findall(r'\b\w{4,}\b', text.lower())
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Retorna as 10 palavras mais frequentes
        return sorted(word_freq.keys(), key=lambda x: word_freq[x], reverse=True)[:10]
    
    def _check_required_sections(self, document: Document, context: AdaptiveContext) -> bool:
        """Verifica se o documento possui seções obrigatórias"""
        # Implementação simplificada
        required_terms = ['objetivo', 'escopo', 'prazo', 'valor']
        content_lower = document.content.lower()
        return sum(1 for term in required_terms if term in content_lower) >= 2
    
    def _check_length_requirements(self, document: Document, context: AdaptiveContext) -> bool:
        """Verifica se o documento atende aos requisitos de tamanho"""
        min_words = context.configuration.min_document_length if hasattr(context.configuration, 'min_document_length') else 100
        return len(document.content.split()) >= min_words
    
    def _check_formatting(self, document: Document) -> bool:
        """Verifica formatação básica do documento"""
        # Verifica se há estrutura mínima
        has_paragraphs = '\n\n' in document.content
        has_proper_spacing = not re.search(r'\w{50,}', document.content)  # Evita palavras muito longas
        return has_paragraphs and has_proper_spacing
    
    def _calculate_compliance_score(self, analysis: DocumentAnalysis, weights: ParameterWeights) -> float:
        """Calcula pontuação de conformidade"""
        compliance_data = analysis.compliance_analysis
        score = 0.0
        
        if compliance_data.get('has_required_sections'):
            score += 0.3
        if compliance_data.get('meets_length_requirements'):
            score += 0.3
        if compliance_data.get('has_proper_formatting'):
            score += 0.2
        
        score += compliance_data.get('compliance_score', 0.0) * 0.2
        
        return min(1.0, score)
    
    def _calculate_quality_score(self, analysis: DocumentAnalysis, weights: ParameterWeights) -> float:
        """Calcula pontuação de qualidade"""
        text_data = analysis.text_analysis
        structure_data = analysis.structure_analysis
        
        readability = text_data.get('readability_score', 0.0)
        structure_score = (
            (0.2 if structure_data.get('has_title') else 0.0) +
            (0.2 if structure_data.get('has_tables') else 0.0) +
            (0.2 if structure_data.get('has_lists') else 0.0) +
            min(0.4, structure_data.get('section_count', 0) * 0.1)
        )
        
        return (readability * 0.6 + structure_score * 0.4)
    
    def _calculate_completeness_score(self, analysis: DocumentAnalysis, weights: ParameterWeights) -> float:
        """Calcula pontuação de completude"""
        text_data = analysis.text_analysis
        metadata_data = analysis.metadata_analysis
        
        content_completeness = min(1.0, text_data.get('word_count', 0) / 500)
        metadata_completeness = metadata_data.get('metadata_completeness', 0.0)
        
        return (content_completeness * 0.7 + metadata_completeness * 0.3)
    
    def _calculate_consistency_score(self, analysis: DocumentAnalysis, weights: ParameterWeights) -> float:
        """Calcula pontuação de consistência"""
        # Implementação simplificada
        structure_data = analysis.structure_analysis
        
        # Verifica consistência estrutural
        has_consistent_structure = (
            structure_data.get('section_count', 0) > 0 and
            structure_data.get('paragraph_count', 0) > 0
        )
        
        return 0.8 if has_consistent_structure else 0.4
    
    def _summarize_base_analysis(self, analysis: DocumentAnalysis) -> Dict[str, Any]:
        """Cria resumo da análise base"""
        return {
            'word_count': analysis.text_analysis.get('word_count', 0),
            'readability': analysis.text_analysis.get('readability_score', 0.0),
            'structure_score': len([k for k, v in analysis.structure_analysis.items() if v]),
            'metadata_completeness': analysis.metadata_analysis.get('metadata_completeness', 0.0),
            'compliance_basic': analysis.compliance_analysis.get('compliance_score', 0.0)
        }
    
    # Métodos para adaptação de parâmetros
    
    async def _get_document_type_adaptations(self, doc_type: str) -> Dict[str, float]:
        """Obtém adaptações específicas para tipo de documento"""
        adaptations = {
            'edital': {'compliance': 1.2, 'quality': 1.0, 'completeness': 1.1, 'consistency': 1.0},
            'contrato': {'compliance': 1.1, 'quality': 1.1, 'completeness': 1.0, 'consistency': 1.2},
            'termo_referencia': {'compliance': 1.0, 'quality': 1.2, 'completeness': 1.2, 'consistency': 1.0}
        }
        return adaptations.get(doc_type, {'compliance': 1.0, 'quality': 1.0, 'completeness': 1.0, 'consistency': 1.0})
    
    async def _get_user_historical_adaptations(self, user_id: str) -> Dict[str, float]:
        """Obtém adaptações baseadas no histórico do usuário"""
        # Implementação simplificada - em produção, consultaria banco de dados
        return {'compliance': 1.0, 'quality': 1.0, 'completeness': 1.0, 'consistency': 1.0}
    
    async def _get_organization_adaptations(self, org_id: str) -> Dict[str, float]:
        """Obtém adaptações específicas da organização"""
        # Implementação simplificada - em produção, consultaria configurações da organização
        return {'compliance': 1.0, 'quality': 1.0, 'completeness': 1.0, 'consistency': 1.0}
    
    def _combine_weight_adaptations(self, 
                                  base_weights: ParameterWeights, 
                                  *adaptations: Dict[str, float]) -> ParameterWeights:
        """Combina múltiplas adaptações de peso"""
        combined = {
            'compliance': base_weights.compliance,
            'quality': base_weights.quality,
            'completeness': base_weights.completeness,
            'consistency': base_weights.consistency
        }
        
        for adaptation in adaptations:
            for key, multiplier in adaptation.items():
                if key in combined:
                    combined[key] *= multiplier
        
        return ParameterWeights(
            compliance=combined['compliance'],
            quality=combined['quality'],
            completeness=combined['completeness'],
            consistency=combined['consistency']
        )
    
    async def _get_historical_confidence(self, context: AdaptiveContext) -> float:
        """Calcula confiança baseada no histórico"""
        # Implementação simplificada
        return 0.8
    
    # Métodos utilitários
    
    def get_analysis_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas do analisador"""
        return {
            'total_analyses': len(self.analysis_cache),
            'rule_performance': self.rule_performance_cache,
            'cache_size': len(self.analysis_cache),
            'learning_weights': self.learning_weights
        }
    
    def clear_cache(self) -> None:
        """Limpa cache de análises"""
        self.analysis_cache.clear()
        self.rule_performance_cache.clear()
        self.logger.info("Cache do analisador limpo")
    
    async def batch_analyze(self, 
                          documents: List[Document], 
                          context: AdaptiveContext) -> List[AdaptiveAnalysisResult]:
        """Executa análise em lote de múltiplos documentos"""
        results = []
        
        for document in documents:
            try:
                result = await self.analyze_document(document, context)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Erro na análise em lote do documento {document.id}: {str(e)}")
                # Adicionar resultado de erro
                error_result = AdaptiveAnalysisResult(
                    document_id=document.id,
                    analysis_id=f"batch_error_{document.id}",
                    status=AnalysisStatus.FAILED,
                    overall_score=0.0,
                    confidence_level=0.0,
                    score_breakdown=ScoreBreakdown(),
                    flags=["BATCH_ANALYSIS_ERROR"],
                    recommendations=["Erro na análise em lote"],
                    rule_executions=[],
                    processing_time=0.0,
                    metadata={'batch_error': str(e)},
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                results.append(error_result)
        
        return results

# Instância global do analisador
adaptive_analyzer = AdaptiveAnalyzer()

# Função de conveniência para análise
async def analyze_document_adaptive(document: Document, context: AdaptiveContext) -> AdaptiveAnalysisResult:
    """Função de conveniência para análise adaptativa"""
    return await adaptive_analyzer.analyze_document(document, context)

# Função para análise em lote
async def batch_analyze_documents(documents: List[Document], context: AdaptiveContext) -> List[AdaptiveAnalysisResult]:
    """Função de conveniência para análise em lote"""
    return await adaptive_analyzer.batch_analyze(documents, context)