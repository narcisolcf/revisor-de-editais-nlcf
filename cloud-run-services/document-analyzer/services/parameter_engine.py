#!/usr/bin/env python3
"""
Parameter Engine - Sistema Adaptativo de Parâmetros

Este módulo implementa um sistema inteligente que adapta os parâmetros de análise
baseado no histórico de análises, feedback dos usuários e características dos documentos.
"""

import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

@dataclass
class AnalysisParameters:
    """Parâmetros de análise adaptáveis."""
    structural_weight: float = 25.0
    legal_weight: float = 25.0
    clarity_weight: float = 25.0
    abnt_weight: float = 25.0
    confidence_threshold: float = 0.7
    max_retries: int = 3
    timeout: int = 300
    custom_rules: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.custom_rules is None:
            self.custom_rules = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return asdict(self)
    
    def normalize_weights(self):
        """Normaliza os pesos para somar 100."""
        total = self.structural_weight + self.legal_weight + self.clarity_weight + self.abnt_weight
        if total > 0:
            factor = 100.0 / total
            self.structural_weight *= factor
            self.legal_weight *= factor
            self.clarity_weight *= factor
            self.abnt_weight *= factor

@dataclass
class DocumentProfile:
    """Perfil de um documento para análise adaptativa."""
    document_type: str
    complexity_score: float
    page_count: int
    word_count: int
    has_tables: bool
    has_images: bool
    language: str = 'pt-br'
    
class ParameterEngine:
    """Engine principal para adaptação de parâmetros."""
    
    def __init__(self):
        self.analysis_history: List[Dict[str, Any]] = []
        self.feedback_history: List[Dict[str, Any]] = []
        self.document_profiles: Dict[str, DocumentProfile] = {}
        self.performance_metrics: Dict[str, List[float]] = defaultdict(list)
        
        # Parâmetros base por tipo de documento
        self.base_parameters = {
            'edital': AnalysisParameters(
                structural_weight=30.0,
                legal_weight=35.0,
                clarity_weight=20.0,
                abnt_weight=15.0,
                confidence_threshold=0.75
            ),
            'contrato': AnalysisParameters(
                structural_weight=25.0,
                legal_weight=40.0,
                clarity_weight=25.0,
                abnt_weight=10.0,
                confidence_threshold=0.8
            ),
            'ata': AnalysisParameters(
                structural_weight=35.0,
                legal_weight=25.0,
                clarity_weight=30.0,
                abnt_weight=10.0,
                confidence_threshold=0.7
            ),
            'default': AnalysisParameters()
        }
        
        logger.info("Parameter Engine inicializado")
    
    def get_adaptive_parameters(
        self, 
        document_profile: DocumentProfile,
        organization_config: Optional[Dict[str, Any]] = None
    ) -> AnalysisParameters:
        """
        Gera parâmetros adaptativos baseados no perfil do documento e histórico.
        
        Args:
            document_profile: Perfil do documento a ser analisado
            organization_config: Configurações específicas da organização
            
        Returns:
            Parâmetros otimizados para o documento
        """
        try:
            # Começar com parâmetros base para o tipo de documento
            base_params = self.base_parameters.get(
                document_profile.document_type, 
                self.base_parameters['default']
            )
            
            # Criar cópia dos parâmetros base
            adaptive_params = AnalysisParameters(
                structural_weight=base_params.structural_weight,
                legal_weight=base_params.legal_weight,
                clarity_weight=base_params.clarity_weight,
                abnt_weight=base_params.abnt_weight,
                confidence_threshold=base_params.confidence_threshold,
                max_retries=base_params.max_retries,
                timeout=base_params.timeout,
                custom_rules=base_params.custom_rules.copy()
            )
            
            # Aplicar adaptações baseadas no perfil do documento
            adaptive_params = self._adapt_for_document_profile(adaptive_params, document_profile)
            
            # Aplicar adaptações baseadas no histórico
            adaptive_params = self._adapt_for_history(adaptive_params, document_profile)
            
            # Aplicar configurações organizacionais se fornecidas
            if organization_config:
                adaptive_params = self._apply_organization_config(adaptive_params, organization_config)
            
            # Normalizar pesos
            adaptive_params.normalize_weights()
            
            logger.info(f"Parâmetros adaptativos gerados para {document_profile.document_type}")
            return adaptive_params
            
        except Exception as e:
            logger.error(f"Erro ao gerar parâmetros adaptativos: {e}")
            return self.base_parameters['default']
    
    def _adapt_for_document_profile(
        self, 
        params: AnalysisParameters, 
        profile: DocumentProfile
    ) -> AnalysisParameters:
        """
        Adapta parâmetros baseado no perfil do documento.
        """
        # Ajustar timeout baseado no tamanho do documento
        if profile.page_count > 50:
            params.timeout = min(600, params.timeout * 1.5)
        elif profile.page_count > 20:
            params.timeout = min(450, params.timeout * 1.2)
        
        # Ajustar threshold baseado na complexidade
        if profile.complexity_score > 0.8:
            params.confidence_threshold = max(0.6, params.confidence_threshold - 0.1)
        elif profile.complexity_score < 0.3:
            params.confidence_threshold = min(0.9, params.confidence_threshold + 0.1)
        
        # Ajustar pesos baseado nas características do documento
        if profile.has_tables:
            params.structural_weight += 5.0
            params.clarity_weight -= 2.5
            params.abnt_weight -= 2.5
        
        if profile.has_images:
            params.structural_weight += 3.0
            params.legal_weight -= 1.5
            params.clarity_weight -= 1.5
        
        return params
    
    def _adapt_for_history(
        self, 
        params: AnalysisParameters, 
        profile: DocumentProfile
    ) -> AnalysisParameters:
        """
        Adapta parâmetros baseado no histórico de análises.
        """
        # Buscar análises similares no histórico
        similar_analyses = self._find_similar_analyses(profile)
        
        if not similar_analyses:
            return params
        
        # Calcular métricas de performance para análises similares
        success_rates = []
        avg_scores = []
        
        for analysis in similar_analyses:
            if 'success' in analysis and 'avg_score' in analysis:
                success_rates.append(analysis['success'])
                avg_scores.append(analysis['avg_score'])
        
        if success_rates and avg_scores:
            avg_success_rate = np.mean(success_rates)
            avg_score = np.mean(avg_scores)
            
            # Ajustar parâmetros baseado na performance histórica
            if avg_success_rate < 0.7:  # Performance baixa
                params.confidence_threshold = max(0.5, params.confidence_threshold - 0.1)
                params.max_retries = min(5, params.max_retries + 1)
            elif avg_success_rate > 0.9:  # Performance alta
                params.confidence_threshold = min(0.9, params.confidence_threshold + 0.05)
        
        return params
    
    def _apply_organization_config(
        self, 
        params: AnalysisParameters, 
        org_config: Dict[str, Any]
    ) -> AnalysisParameters:
        """
        Aplica configurações específicas da organização.
        """
        # Aplicar pesos customizados se fornecidos
        weights = org_config.get('weights', {})
        if weights:
            params.structural_weight = weights.get('structural', params.structural_weight)
            params.legal_weight = weights.get('legal', params.legal_weight)
            params.clarity_weight = weights.get('clarity', params.clarity_weight)
            params.abnt_weight = weights.get('abnt', params.abnt_weight)
        
        # Aplicar outras configurações
        params.max_retries = org_config.get('maxRetries', params.max_retries)
        params.timeout = org_config.get('timeout', params.timeout)
        
        # Aplicar regras customizadas
        custom_rules = org_config.get('customRules', [])
        if custom_rules:
            params.custom_rules.extend(custom_rules)
        
        return params
    
    def _find_similar_analyses(self, profile: DocumentProfile) -> List[Dict[str, Any]]:
        """
        Encontra análises similares no histórico.
        """
        similar = []
        
        for analysis in self.analysis_history:
            if analysis.get('document_type') == profile.document_type:
                # Calcular similaridade baseada em características
                similarity_score = self._calculate_similarity(analysis, profile)
                if similarity_score > 0.7:  # Threshold de similaridade
                    similar.append(analysis)
        
        return similar[-10:]  # Retornar as 10 mais recentes
    
    def _calculate_similarity(
        self, 
        analysis: Dict[str, Any], 
        profile: DocumentProfile
    ) -> float:
        """
        Calcula score de similaridade entre análise histórica e perfil atual.
        """
        score = 0.0
        factors = 0
        
        # Comparar tipo de documento (peso alto)
        if analysis.get('document_type') == profile.document_type:
            score += 0.4
        factors += 1
        
        # Comparar número de páginas
        if 'page_count' in analysis:
            page_diff = abs(analysis['page_count'] - profile.page_count)
            page_similarity = max(0, 1 - (page_diff / max(analysis['page_count'], profile.page_count)))
            score += page_similarity * 0.2
        factors += 1
        
        # Comparar complexidade
        if 'complexity_score' in analysis:
            complexity_diff = abs(analysis['complexity_score'] - profile.complexity_score)
            complexity_similarity = max(0, 1 - complexity_diff)
            score += complexity_similarity * 0.2
        factors += 1
        
        # Comparar características booleanas
        if 'has_tables' in analysis:
            if analysis['has_tables'] == profile.has_tables:
                score += 0.1
        factors += 1
        
        if 'has_images' in analysis:
            if analysis['has_images'] == profile.has_images:
                score += 0.1
        factors += 1
        
        return score / factors if factors > 0 else 0.0
    
    def record_analysis_result(
        self, 
        document_profile: DocumentProfile,
        parameters_used: AnalysisParameters,
        result: Dict[str, Any]
    ):
        """
        Registra resultado de análise para aprendizado futuro.
        """
        try:
            analysis_record = {
                'timestamp': datetime.now().isoformat(),
                'document_type': document_profile.document_type,
                'page_count': document_profile.page_count,
                'complexity_score': document_profile.complexity_score,
                'has_tables': document_profile.has_tables,
                'has_images': document_profile.has_images,
                'parameters': parameters_used.to_dict(),
                'success': result.get('success', False),
                'avg_score': result.get('average_score', 0.0),
                'processing_time': result.get('processing_time', 0),
                'error_count': result.get('error_count', 0)
            }
            
            self.analysis_history.append(analysis_record)
            
            # Manter apenas os últimos 1000 registros
            if len(self.analysis_history) > 1000:
                self.analysis_history = self.analysis_history[-1000:]
            
            logger.info(f"Resultado de análise registrado para {document_profile.document_type}")
            
        except Exception as e:
            logger.error(f"Erro ao registrar resultado de análise: {e}")
    
    def record_user_feedback(
        self, 
        document_id: str,
        feedback_type: str,
        feedback_data: Dict[str, Any]
    ):
        """
        Registra feedback do usuário para melhorar adaptações futuras.
        """
        try:
            feedback_record = {
                'timestamp': datetime.now().isoformat(),
                'document_id': document_id,
                'feedback_type': feedback_type,  # 'rating', 'correction', 'suggestion'
                'data': feedback_data
            }
            
            self.feedback_history.append(feedback_record)
            
            # Manter apenas os últimos 500 feedbacks
            if len(self.feedback_history) > 500:
                self.feedback_history = self.feedback_history[-500:]
            
            logger.info(f"Feedback registrado para documento {document_id}")
            
        except Exception as e:
            logger.error(f"Erro ao registrar feedback: {e}")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Retorna métricas de performance do sistema adaptativo.
        """
        try:
            if not self.analysis_history:
                return {'message': 'Nenhum histórico disponível'}
            
            # Calcular métricas gerais
            total_analyses = len(self.analysis_history)
            successful_analyses = sum(1 for a in self.analysis_history if a.get('success', False))
            success_rate = successful_analyses / total_analyses if total_analyses > 0 else 0
            
            # Métricas por tipo de documento
            by_type = defaultdict(list)
            for analysis in self.analysis_history:
                doc_type = analysis.get('document_type', 'unknown')
                by_type[doc_type].append(analysis)
            
            type_metrics = {}
            for doc_type, analyses in by_type.items():
                type_success_rate = sum(1 for a in analyses if a.get('success', False)) / len(analyses)
                avg_score = np.mean([a.get('avg_score', 0) for a in analyses])
                avg_time = np.mean([a.get('processing_time', 0) for a in analyses])
                
                type_metrics[doc_type] = {
                    'count': len(analyses),
                    'success_rate': type_success_rate,
                    'avg_score': avg_score,
                    'avg_processing_time': avg_time
                }
            
            return {
                'total_analyses': total_analyses,
                'overall_success_rate': success_rate,
                'total_feedbacks': len(self.feedback_history),
                'by_document_type': type_metrics,
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro ao calcular métricas: {e}")
            return {'error': str(e)}
    
    def export_learning_data(self) -> Dict[str, Any]:
        """
        Exporta dados de aprendizado para backup ou análise externa.
        """
        return {
            'analysis_history': self.analysis_history,
            'feedback_history': self.feedback_history,
            'performance_metrics': dict(self.performance_metrics),
            'export_timestamp': datetime.now().isoformat()
        }
    
    def import_learning_data(self, data: Dict[str, Any]):
        """
        Importa dados de aprendizado de backup ou sistema externo.
        """
        try:
            if 'analysis_history' in data:
                self.analysis_history = data['analysis_history']
            
            if 'feedback_history' in data:
                self.feedback_history = data['feedback_history']
            
            if 'performance_metrics' in data:
                self.performance_metrics = defaultdict(list, data['performance_metrics'])
            
            logger.info("Dados de aprendizado importados com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao importar dados de aprendizado: {e}")
            raise

# Instância global do Parameter Engine
parameter_engine = ParameterEngine()