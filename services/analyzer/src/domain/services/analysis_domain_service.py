"""
Analysis Domain Service

Serviço de domínio para lógica de negócio relacionada a análises.
Coordena a execução de análises adaptativas.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import uuid

from ..entities.document import Document
from ..entities.organization import Organization
from ..entities.analysis import (
    Analysis, 
    AnalysisId, 
    ConformityScores, 
    Finding, 
    AnalysisStatus,
    AnalysisMetrics
)
from ..interfaces.services import IAnalysisEngine, IMetricsService, ILoggingService


class AnalysisDomainService:
    """
    Serviço de domínio para coordenação de análises adaptativas.
    
    Implementa a lógica de negócio central para execução de análises
    personalizadas baseadas nas configurações organizacionais.
    """
    
    def __init__(
        self,
        analysis_engine: IAnalysisEngine,
        metrics_service: IMetricsService,
        logging_service: ILoggingService
    ):
        self.analysis_engine = analysis_engine
        self.metrics_service = metrics_service
        self.logging_service = logging_service
    
    async def execute_adaptive_analysis(
        self,
        document: Document,
        organization: Organization
    ) -> Analysis:
        """
        Executa análise adaptativa completa.
        
        Args:
            document: Documento a ser analisado
            organization: Organização com configurações personalizadas
            
        Returns:
            Analysis completa com resultados personalizados
        """
        start_time = datetime.utcnow()
        analysis_id = AnalysisId(str(uuid.uuid4()))
        
        # Log início da análise
        await self.logging_service.log_analysis_started(
            str(document.id),
            str(organization.id),
            str(analysis_id)
        )
        
        try:
            # Cria análise inicial
            analysis = Analysis(
                id=analysis_id,
                document_id=document.id,
                organization_id=organization.id,
                status=AnalysisStatus.RUNNING,
                conformity_scores=ConformityScores(0, 0, 0, 0, 0),
                weighted_score=0.0
            )
            
            # Executa análises por categoria em paralelo
            analysis_tasks = [
                self.analysis_engine.analyze_structural(document, organization),
                self.analysis_engine.analyze_legal(document, organization),
                self.analysis_engine.analyze_clarity(document, organization),
                self.analysis_engine.analyze_abnt(document, organization)
            ]
            
            results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
            
            # Processa resultados
            structural_result = self._handle_result(results[0], "structural")
            legal_result = self._handle_result(results[1], "legal")
            clarity_result = self._handle_result(results[2], "clarity")
            abnt_result = self._handle_result(results[3], "abnt")
            
            # Consolida scores
            conformity_scores = ConformityScores(
                structural=structural_result.score,
                legal=legal_result.score,
                clarity=clarity_result.score,
                abnt=abnt_result.score,
                overall=(structural_result.score + legal_result.score + 
                        clarity_result.score + abnt_result.score) / 4
            )
            
            # Calcula score ponderado baseado nos pesos organizacionais
            weighted_score = conformity_scores.calculate_weighted_score(organization.weights)
            
            # Consolida findings
            all_findings = []
            all_findings.extend(structural_result.findings)
            all_findings.extend(legal_result.findings)
            all_findings.extend(clarity_result.findings)
            all_findings.extend(abnt_result.findings)
            
            # Gera recomendações personalizadas
            recommendations = await self._generate_recommendations(
                all_findings, 
                conformity_scores, 
                organization
            )
            
            # Calcula métricas
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            metrics = AnalysisMetrics(
                execution_time_seconds=execution_time,
                total_findings=len(all_findings),
                findings_by_severity=self._count_findings_by_severity(all_findings),
                findings_by_category=self._count_findings_by_category(all_findings),
                custom_rules_applied=len([f for f in all_findings if f.is_custom_rule])
            )
            
            # Atualiza análise com resultados
            analysis.conformity_scores = conformity_scores
            analysis.weighted_score = weighted_score
            analysis.findings = all_findings
            analysis.recommendations = recommendations
            analysis.metrics = metrics
            analysis.mark_as_completed()
            
            # Log conclusão
            await self.logging_service.log_analysis_completed(
                str(analysis_id),
                execution_time,
                len(all_findings)
            )
            
            # Registra métricas
            await self.metrics_service.record_analysis_metrics(analysis)
            
            return analysis
            
        except Exception as e:
            # Marca análise como falhada
            analysis.mark_as_failed(str(e))
            
            # Log erro
            await self.logging_service.log_error(
                str(e),
                type(e).__name__,
                {
                    'document_id': str(document.id),
                    'organization_id': str(organization.id),
                    'analysis_id': str(analysis_id)
                }
            )
            
            # Registra métrica de erro
            await self.metrics_service.record_error_metrics(
                type(e).__name__,
                str(e),
                {'operation': 'adaptive_analysis'}
            )
            
            raise
    
    async def calculate_comparative_analysis(
        self,
        document: Document,
        organizations: List[Organization]
    ) -> Dict[str, Analysis]:
        """
        Executa análise comparativa entre múltiplas organizações.
        
        Args:
            document: Documento a ser analisado
            organizations: Lista de organizações para comparar
            
        Returns:
            Dict com análises por organização
        """
        analysis_tasks = []
        for org in organizations:
            task = self.execute_adaptive_analysis(document, org)
            analysis_tasks.append(task)
        
        results = await asyncio.gather(*analysis_tasks, return_exceptions=True)
        
        comparative_results = {}
        for i, org in enumerate(organizations):
            result = results[i]
            if isinstance(result, Analysis):
                comparative_results[str(org.id)] = result
            else:
                # Em caso de erro, registra mas continua
                await self.logging_service.log_error(
                    f"Erro na análise comparativa: {str(result)}",
                    type(result).__name__,
                    {'organization_id': str(org.id)}
                )
        
        return comparative_results
    
    async def estimate_analysis_complexity(
        self,
        document: Document,
        organization: Organization
    ) -> Dict[str, Any]:
        """
        Estima complexidade e tempo de análise.
        
        Args:
            document: Documento a ser analisado
            organization: Organização solicitante
            
        Returns:
            Dict com estimativas de complexidade
        """
        content_length = len(document.content)
        custom_rules_count = len(organization.get_active_rules())
        
        # Fatores de complexidade
        content_complexity = min(5, content_length / 10000)  # Max 5
        rules_complexity = min(3, custom_rules_count / 5)    # Max 3
        
        total_complexity = content_complexity + rules_complexity
        
        # Estimativa de tempo (segundos)
        estimated_time = max(10, int(total_complexity * 30))
        
        return {
            'complexity_score': total_complexity,
            'content_complexity': content_complexity,
            'rules_complexity': rules_complexity,
            'estimated_time_seconds': estimated_time,
            'factors': {
                'content_length': content_length,
                'custom_rules_count': custom_rules_count,
                'organization_type': organization.organization_type.value
            }
        }
    
    def _handle_result(self, result: Any, category: str) -> Any:
        """Processa resultado de análise, tratando exceções."""
        if isinstance(result, Exception):
            # Retorna resultado padrão em caso de erro
            return type('Result', (), {
                'score': 50.0,
                'findings': [],
                'metadata': {'error': str(result), 'category': category}
            })()
        return result
    
    def _count_findings_by_severity(self, findings: List[Finding]) -> Dict[str, int]:
        """Conta findings por severidade."""
        counts = {}
        for finding in findings:
            severity = finding.severity.value
            counts[severity] = counts.get(severity, 0) + 1
        return counts
    
    def _count_findings_by_category(self, findings: List[Finding]) -> Dict[str, int]:
        """Conta findings por categoria."""
        counts = {}
        for finding in findings:
            category = finding.category.value
            counts[category] = counts.get(category, 0) + 1
        return counts
    
    async def _generate_recommendations(
        self,
        findings: List[Finding],
        scores: ConformityScores,
        organization: Organization
    ) -> List[str]:
        """
        Gera recomendações personalizadas baseadas nos resultados.
        
        Args:
            findings: Lista de findings encontrados
            scores: Scores de conformidade
            organization: Organização solicitante
            
        Returns:
            Lista de recomendações personalizadas
        """
        recommendations = []
        
        # Identifica categoria com pior desempenho considerando pesos
        weighted_scores = {
            'structural': scores.structural * (organization.weights.structural / 100),
            'legal': scores.legal * (organization.weights.legal / 100),
            'clarity': scores.clarity * (organization.weights.clarity / 100),
            'abnt': scores.abnt * (organization.weights.abnt / 100)
        }
        
        worst_category = min(weighted_scores.keys(), key=lambda k: weighted_scores[k])
        worst_score = getattr(scores, worst_category)
        
        category_names = {
            'structural': 'estrutural',
            'legal': 'jurídica',
            'clarity': 'clareza',
            'abnt': 'padrões ABNT'
        }
        
        if worst_score < 70:
            recommendations.append(
                f"Priorizar melhorias na análise {category_names[worst_category]} "
                f"(score: {worst_score:.1f}), que tem peso de {getattr(organization.weights, worst_category):.1f}% "
                f"na configuração da sua organização."
            )
        
        # Recomendações para findings críticos
        critical_findings = [f for f in findings if f.severity.value == "critica"]
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
        dominant_category = organization.weights.get_dominant_category()
        dominant_score = getattr(scores, dominant_category)
        
        if dominant_score < 80:
            recommendations.append(
                f"Foco especial na categoria {category_names[dominant_category]} "
                f"(peso: {getattr(organization.weights, dominant_category):.1f}%), que é prioritária "
                f"para sua organização mas está com score de {dominant_score:.1f}."
            )
        
        # Recomendações específicas por tipo de organização
        if organization.organization_type.value == "tribunal_contas":
            recommendations.append(
                "Como órgão de controle, recomenda-se foco adicional em "
                "conformidade jurídica e auditabilidade dos processos."
            )
        elif organization.organization_type.value == "municipal":
            recommendations.append(
                "Para processos municipais, assegurar compliance com "
                "legislação local e transparência dos procedimentos."
            )
        
        return recommendations[:5]  # Máximo 5 recomendações