"""
LicitaReview - Serviço Principal de Análise

Este módulo integra o motor de análise adaptativo com o sistema de análise
padrão, coordenando análises personalizadas e gerenciando cache de resultados.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
import hashlib
import re
from dataclasses import dataclass

import structlog
from fastapi import UploadFile

from .adaptive_analyzer import AdaptiveAnalyzer
from ..models.document_models import Document
from ..models.config_models import OrganizationConfig, AnalysisWeights, AnalysisPreset
from ..models.analysis_models import (
    AnalysisRequest, 
    AnalysisResult, 
    DocumentUploadResponse
)

logger = structlog.get_logger(__name__)


@dataclass
class CachedResult:
    """Resultado em cache com metadados."""
    result: AnalysisResult
    cached_at: datetime
    cache_key: str
    ttl_minutes: int = 60


class AnalyzerService:
    """
    Serviço principal de análise que coordena o motor adaptativo.
    
    Responsabilidades:
    - Gerenciar análises com parâmetros personalizados
    - Cache inteligente de resultados
    - Processamento de uploads de documentos  
    - Coordenação entre análises padrão e adaptativas
    - Validação de configurações organizacionais
    """
    
    def __init__(self):
        self.logger = structlog.get_logger(self.__class__.__name__)
        self.cache: Dict[str, CachedResult] = {}
        self.is_initialized = False
    
    async def initialize(self):
        """Inicializa o serviço de análise."""
        if self.is_initialized:
            return
        
        self.logger.info("🚀 Initializing AnalyzerService")
        
        # Aqui você pode adicionar inicializações de recursos
        # como conexões de banco de dados, carregamento de modelos, etc.
        
        self.is_initialized = True
        self.logger.info("✅ AnalyzerService initialized successfully")
    
    async def cleanup(self):
        """Limpa recursos do serviço."""
        self.logger.info("🧹 Cleaning up AnalyzerService")
        self.cache.clear()
        self.is_initialized = False
    
    async def analyze_document(self, request: AnalysisRequest) -> AnalysisResult:
        """
        🚨 MÉTODO PRINCIPAL - Executa análise de documento com parâmetros personalizados.
        
        Args:
            request: Request de análise com configuração organizacional
            
        Returns:
            AnalysisResult com análise personalizada
        """
        start_time = datetime.utcnow()
        
        self.logger.info(
            "📋 Starting document analysis",
            document_id=request.document_id,
            organization_id=request.organization_config.organization_id,
            analysis_type=request.analysis_type
        )
        
        try:
            # 1. Verifica cache se não for reanalise forçada
            if not request.force_reanalysis:
                cached_result = await self._get_cached_result(request)
                if cached_result:
                    self.logger.info(
                        "✅ Returning cached result",
                        document_id=request.document_id,
                        cache_age_minutes=(datetime.utcnow() - cached_result.cached_at).seconds // 60
                    )
                    return cached_result.result
            
            # 2. Carrega documento (simulado - em produção viria do banco de dados)
            document = await self._load_document(request.document_id)
            if not document:
                raise ValueError(f"Document {request.document_id} not found")
            
            # 3. Determina tipo de documento
            doc_type = await self._determine_document_type(document)
            
            # 4. Cria analisador adaptativo
            adaptive_analyzer = AdaptiveAnalyzer(
                doc_type=doc_type,
                org_config=request.organization_config
            )
            
            # 5. Executa análise adaptativa
            result = await adaptive_analyzer.analyze_with_custom_params(document)
            
            # 6. Adiciona metadados do request
            result.request_id = id(request)  # Simulado
            result.analysis_metadata.update({
                'request_analysis_type': request.analysis_type,
                'custom_parameters': request.custom_parameters,
                'minimum_confidence': request.minimum_confidence,
                'include_suggestions': request.include_suggestions,
                'requested_by': request.requested_by,
                'priority': request.priority
            })
            
            # 7. Filtra findings por confiança mínima
            if request.minimum_confidence > 0:
                result.findings = [
                    f for f in result.findings 
                    if f.confidence >= request.minimum_confidence
                ]
            
            # 8. Limita número de findings se especificado
            if request.max_findings and len(result.findings) > request.max_findings:
                # Mantém findings mais críticos
                result.findings = sorted(
                    result.findings,
                    key=lambda f: (f.get_severity_weight(), f.confidence),
                    reverse=True
                )[:request.max_findings]
            
            # 9. Cache do resultado
            await self._cache_result(request, result)
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            self.logger.info(
                "✅ Document analysis completed",
                document_id=request.document_id,
                organization_id=request.organization_config.organization_id,
                weighted_score=result.weighted_score,
                findings_count=len(result.findings),
                execution_time=execution_time
            )
            
            return result
            
        except Exception as e:
            self.logger.error(
                "❌ Document analysis failed",
                document_id=request.document_id,
                organization_id=request.organization_config.organization_id,
                error=str(e),
                error_type=type(e).__name__
            )
            raise
    
    async def process_upload(self, file: UploadFile) -> DocumentUploadResponse:
        """
        Processa upload de documento e prepara para análise.
        
        Args:
            file: Arquivo enviado
            
        Returns:
            DocumentUploadResponse com informações do documento processado
        """
        self.logger.info("📤 Processing document upload", filename=file.filename)
        
        try:
            # 1. Lê conteúdo do arquivo
            content = await file.read()
            
            # 2. Extrai texto baseado no tipo de arquivo
            if file.content_type == "application/pdf":
                extracted_text = await self._extract_text_from_pdf(content)
            elif file.content_type in [
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ]:
                extracted_text = await self._extract_text_from_word(content)
            else:
                extracted_text = content.decode('utf-8', errors='ignore')
            
            # 3. Cria documento
            document_id = hashlib.md5(content).hexdigest()
            
            document = Document(
                id=document_id,
                title=file.filename or "Documento Sem Título",
                content=extracted_text,
                file_type=file.content_type,
                file_size=len(content),
                uploaded_at=datetime.utcnow()
            )
            
            # 4. Salva documento (simulado - em produção salvaria no banco)
            await self._save_document(document)
            
            # 5. Determina tipo do documento
            doc_type = await self._determine_document_type(document)
            
            response = DocumentUploadResponse(
                document_id=document_id,
                filename=file.filename,
                file_type=file.content_type,
                file_size=len(content),
                extracted_text_length=len(extracted_text),
                document_type=doc_type,
                processing_status="completed",
                upload_timestamp=datetime.utcnow()
            )
            
            self.logger.info(
                "✅ Document upload processed",
                document_id=document_id,
                filename=file.filename,
                text_length=len(extracted_text)
            )
            
            return response
            
        except Exception as e:
            self.logger.error(
                "❌ Document upload processing failed",
                filename=file.filename,
                error=str(e)
            )
            raise
    
    async def get_analysis_presets(self) -> Dict[str, Any]:
        """
        Retorna presets de análise disponíveis.
        
        Returns:
            Dict com presets e suas configurações
        """
        presets = {}
        
        for preset in AnalysisPreset:
            if preset == AnalysisPreset.CUSTOM:
                continue
            
            weights = AnalysisWeights.from_preset(preset)
            presets[preset.value] = {
                'name': preset.value.title(),
                'description': self._get_preset_description(preset),
                'weights': weights.dict(),
                'weight_distribution': weights.get_weight_distribution_type(),
                'dominant_category': weights.get_dominant_category(),
                'suitable_for': self._get_preset_suitable_for(preset)
            }
        
        return {
            'available_presets': presets,
            'custom_preset_info': {
                'name': 'Custom',
                'description': 'Configuração totalmente personalizada pela organização',
                'allows_custom_weights': True,
                'allows_custom_rules': True,
                'allows_templates': True
            }
        }
    
    async def validate_config(self, config: OrganizationConfig) -> Dict[str, Any]:
        """
        Valida configuração organizacional.
        
        Args:
            config: Configuração a ser validada
            
        Returns:
            Resultado da validação
        """
        self.logger.info(
            "🔍 Validating organization config",
            organization_id=config.organization_id
        )
        
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'suggestions': [],
            'config_summary': config.get_analysis_summary()
        }
        
        try:
            # Validação de pesos
            weights_sum = (
                config.weights.structural + 
                config.weights.legal + 
                config.weights.clarity + 
                config.weights.abnt
            )
            
            if abs(weights_sum - 100.0) > 0.01:
                validation_result['errors'].append(
                    f"Soma dos pesos deve ser 100%, atual: {weights_sum:.2f}%"
                )
                validation_result['is_valid'] = False
            
            # Validação de regras personalizadas
            for rule in config.custom_rules:
                try:
                    # Testa padrão regex
                    rule.test_pattern_match("teste")
                except Exception as e:
                    validation_result['errors'].append(
                        f"Regra '{rule.name}' tem padrão inválido: {str(e)}"
                    )
                    validation_result['is_valid'] = False
            
            # Sugestões baseadas na configuração
            if config.weights.get_weight_distribution_type() == "legal_focused":
                validation_result['suggestions'].append(
                    "Configuração focada em aspectos jurídicos. "
                    "Considere balancear com aspectos estruturais para análise mais completa."
                )
            
            if len(config.get_active_rules()) == 0:
                validation_result['warnings'].append(
                    "Nenhuma regra personalizada ativa. "
                    "Considere adicionar regras específicas para sua organização."
                )
            
            if len(config.templates) == 0:
                validation_result['warnings'].append(
                    "Nenhum template organizacional definido. "
                    "Templates ajudam a garantir estrutura padronizada dos documentos."
                )
            
        except Exception as e:
            validation_result['errors'].append(f"Erro na validação: {str(e)}")
            validation_result['is_valid'] = False
        
        self.logger.info(
            "✅ Config validation completed",
            organization_id=config.organization_id,
            is_valid=validation_result['is_valid'],
            errors_count=len(validation_result['errors']),
            warnings_count=len(validation_result['warnings'])
        )
        
        return validation_result
    
    async def _get_cached_result(self, request: AnalysisRequest) -> Optional[CachedResult]:
        """Busca resultado em cache."""
        cache_key = request.get_cache_key()
        
        if cache_key not in self.cache:
            return None
        
        cached = self.cache[cache_key]
        
        # Verifica TTL
        age_minutes = (datetime.utcnow() - cached.cached_at).seconds // 60
        if age_minutes > cached.ttl_minutes:
            del self.cache[cache_key]
            return None
        
        return cached
    
    async def _cache_result(self, request: AnalysisRequest, result: AnalysisResult):
        """Armazena resultado em cache."""
        cache_key = request.get_cache_key()
        
        cached = CachedResult(
            result=result,
            cached_at=datetime.utcnow(),
            cache_key=cache_key,
            ttl_minutes=60  # Cache por 1 hora
        )
        
        self.cache[cache_key] = cached
        
        # Limita tamanho do cache
        if len(self.cache) > 1000:
            # Remove entradas mais antigas
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k].cached_at)
            del self.cache[oldest_key]
    
    async def _load_document(self, document_id: str) -> Optional[Document]:
        """
        Carrega documento pelo ID.
        
        Em produção, este método faria consulta ao banco de dados.
        """
        # Simulação - em produção viria do banco de dados
        return Document(
            id=document_id,
            title="Documento de Teste",
            content="""
            EDITAL DE PREGÃO ELETRÔNICO Nº 001/2024
            
            OBJETO: Aquisição de equipamentos de informática para modernização
            do parque tecnológico da administração municipal.
            
            PRAZO: 30 (trinta) dias corridos para entrega.
            
            VALOR ESTIMADO: R$ 150.000,00 (cento e cinquenta mil reais).
            
            DA HABILITAÇÃO:
            Para participar do certame, os licitantes deverão apresentar:
            a) Certidão de regularidade fiscal;
            b) Comprovação de aptidão técnica;
            c) Qualificação econômico-financeira.
            
            Este edital segue as disposições da Lei 8.666/93 e Lei 14.133/21.
            """,
            file_type="text/plain",
            uploaded_at=datetime.utcnow()
        )
    
    async def _save_document(self, document: Document):
        """Salva documento (simulado)."""
        # Em produção, salvaria no banco de dados
        pass
    
    async def _determine_document_type(self, document: Document) -> str:
        """
        Determina tipo do documento baseado no conteúdo.
        
        Args:
            document: Documento a ser analisado
            
        Returns:
            Tipo do documento identificado
        """
        content = (document.content or "").lower()
        
        # Padrões para identificação de tipos
        patterns = {
            'pregao': [r'pregão', r'pregao'],
            'edital': [r'edital'],
            'contrato': [r'contrato', r'instrumento'],
            'termo_referencia': [r'termo\s+de\s+referência', r'termo\s+referencia'],
            'ata': [r'ata\s+de\s+registro'],
        }
        
        for doc_type, type_patterns in patterns.items():
            if any(re.search(pattern, content) for pattern in type_patterns):
                return doc_type
        
        return 'documento'  # Tipo genérico
    
    async def _extract_text_from_pdf(self, content: bytes) -> str:
        """Extrai texto de PDF (simulado)."""
        # Em produção, usaria bibliotecas como PyPDF2, pdfplumber, etc.
        return "Texto extraído de PDF (simulado)"
    
    async def _extract_text_from_word(self, content: bytes) -> str:
        """Extrai texto de Word (simulado)."""
        # Em produção, usaria bibliotecas como python-docx, etc.
        return "Texto extraído de Word (simulado)"
    
    def _get_preset_description(self, preset: AnalysisPreset) -> str:
        """Retorna descrição do preset."""
        descriptions = {
            AnalysisPreset.RIGOROUS: "Máxima conformidade jurídica e controle rigoroso",
            AnalysisPreset.STANDARD: "Configuração equilibrada para uso geral",
            AnalysisPreset.FLEXIBLE: "Análise mais flexível para processos expeditos",
            AnalysisPreset.TECHNICAL: "Foco em aspectos técnicos e normas ABNT"
        }
        return descriptions.get(preset, "Configuração personalizada")
    
    def _get_preset_suitable_for(self, preset: AnalysisPreset) -> List[str]:
        """Retorna lista de casos adequados para o preset."""
        suitable_for = {
            AnalysisPreset.RIGOROUS: [
                "Órgãos de controle (TCU, CGU)",
                "Contratos de alto valor",
                "Obras públicas complexas"
            ],
            AnalysisPreset.STANDARD: [
                "Prefeituras municipais",
                "Órgãos estaduais",
                "Pregões eletrônicos gerais"
            ],
            AnalysisPreset.FLEXIBLE: [
                "Compras de baixo valor",
                "Processos urgentes",
                "Análises preliminares"
            ],
            AnalysisPreset.TECHNICAL: [
                "Projetos de engenharia",
                "Especificações técnicas",
                "Documentos com normas ABNT"
            ]
        }
        return suitable_for.get(preset, [])