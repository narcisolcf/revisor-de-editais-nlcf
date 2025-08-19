#!/usr/bin/env python3
"""
LicitaReview Document Analyzer - Cloud Run Service

Serviço principal de análise de documentos licitatórios com IA.
Implementa endpoints para análise e classificação de documentos.
"""

import os
import logging
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, InternalServerError

# Configurar logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Importar serviços
from services.ocr_service import OCRService
from services.classification_service import ClassificationService
from services.analysis_engine import AnalysisEngine
from services.conformity_checker import ConformityChecker
from services.parameter_engine import ParameterEngine, DocumentProfile, AnalysisParameters
from utils.validators import validate_request_data
from config.analysis_rules import get_default_rules

# Inicializar Flask app
app = Flask(__name__)
CORS(app)  # Habilitar CORS para frontend

# Inicializar serviços
ocr_service = OCRService()
classification_service = ClassificationService()
analysis_engine = AnalysisEngine()
conformity_checker = ConformityChecker()
parameter_engine = ParameterEngine()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint para monitoramento."""
    return jsonify({
        'status': 'healthy',
        'service': 'document-analyzer',
        'version': '1.0.0'
    }), 200

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """
    Endpoint principal para análise completa de documentos.
    
    Recebe:
    - document_content: bytes do documento
    - document_type: tipo do documento
    - org_config: configurações da organização
    - custom_params: parâmetros personalizados
    
    Retorna:
    - analysis_result: resultado completo da análise
    """
    try:
        # Validar dados da requisição
        data = validate_request_data(request)
        
        logger.info(f"Iniciando análise de documento tipo: {data.get('document_type')}")
        
        # Extrair texto com OCR se necessário
        if data.get('needs_ocr', False):
            text_content = ocr_service.extract_text_with_structure(
                data['document_content']
            )
        else:
            text_content = data['document_content']
        
        # Executar análise com parâmetros personalizados
        analysis_result = analysis_engine.analyze_with_custom_params(
            content=text_content,
            document_type=data['document_type'],
            org_config=data.get('org_config', {}),
            custom_params=data.get('custom_params', {})
        )
        
        # Verificar conformidade
        conformity_result = conformity_checker.check_conformity(
            analysis_result,
            data['document_type']
        )
        
        # Combinar resultados
        final_result = {
            'analysis': analysis_result,
            'conformity': conformity_result,
            'timestamp': analysis_result.get('timestamp'),
            'document_type': data['document_type']
        }
        
        logger.info(f"Análise concluída com score: {analysis_result.get('overall_score')}")
        
        return jsonify(final_result), 200
        
    except BadRequest as e:
        logger.error(f"Erro de validação: {str(e)}")
        return jsonify({'error': 'Dados inválidos', 'details': str(e)}), 400
        
    except Exception as e:
        logger.error(f"Erro interno na análise: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/ocr/advanced', methods=['POST'])
def advanced_ocr():
    """
    Endpoint para OCR avançado com Google Vision API.
    
    Recebe:
    - file: arquivo de documento (PDF, imagem)
    - preserve_layout: preservar layout original (default: True)
    - extract_tables: extrair tabelas (default: True)
    - detect_forms: detectar formulários (default: True)
    
    Retorna:
    - text: texto extraído
    - confidence: confiança média
    - layout_blocks: blocos de layout
    - tables: tabelas detectadas
    - forms: formulários detectados
    - metadata: metadados do documento
    """
    try:
        if 'file' not in request.files:
            raise BadRequest('Nenhum arquivo fornecido')
        
        file = request.files['file']
        if file.filename == '':
            raise BadRequest('Nome de arquivo vazio')
        
        # Parâmetros opcionais
        preserve_layout = request.form.get('preserve_layout', 'true').lower() == 'true'
        extract_tables = request.form.get('extract_tables', 'true').lower() == 'true'
        detect_forms = request.form.get('detect_forms', 'true').lower() == 'true'
        
        logger.info(f"Processando OCR avançado para: {file.filename}")
        
        # Ler conteúdo do arquivo
        file_content = file.read()
        
        # Executar OCR avançado
        ocr_result = ocr_service.extract_text_with_structure(
            document_content=file_content,
            preserve_layout=preserve_layout
        )
        
        # Detectar formulários se solicitado
        forms = []
        if detect_forms:
            forms = ocr_service.detect_forms(file_content)
        
        # Preparar resposta
        response = {
            'text': ocr_result.text,
            'confidence': ocr_result.confidence,
            'layout_blocks': ocr_result.layout_blocks,
            'tables': ocr_result.tables if extract_tables else [],
            'forms': forms,
            'metadata': {
                **ocr_result.metadata,
                'filename': file.filename,
                'file_size': len(file_content),
                'processing_time': ocr_result.processing_time
            }
        }
        
        logger.info(f"OCR concluído: {len(ocr_result.text)} chars, confiança: {ocr_result.confidence:.2f}")
        
        return jsonify(response), 200
        
    except BadRequest as e:
        logger.error(f"Erro de requisição OCR: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
         logger.error(f"Erro interno OCR: {str(e)}")
         return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/ocr/pdf-pages', methods=['POST'])
def ocr_pdf_pages():
    """
    Endpoint para OCR de PDF multipáginas.
    
    Recebe:
    - file: arquivo PDF
    
    Retorna:
    - pages: lista de resultados OCR por página
    - total_pages: número total de páginas
    - combined_text: texto combinado de todas as páginas
    """
    try:
        if 'file' not in request.files:
            raise BadRequest('Nenhum arquivo fornecido')
        
        file = request.files['file']
        if file.filename == '':
            raise BadRequest('Nome de arquivo vazio')
        
        if not file.filename.lower().endswith('.pdf'):
            raise BadRequest('Apenas arquivos PDF são suportados neste endpoint')
        
        logger.info(f"Processando PDF multipáginas: {file.filename}")
        
        # Ler conteúdo do arquivo
        pdf_content = file.read()
        
        # Executar OCR por páginas
        page_results = ocr_service.extract_text_from_pdf_pages(pdf_content)
        
        # Combinar texto de todas as páginas
        combined_text = "\n\n--- PÁGINA {} ---\n\n".join(
            [f"{i+1}\n\n{result.text}" for i, result in enumerate(page_results)]
        )
        
        # Preparar resposta
        response = {
            'pages': [
                {
                    'page_number': result.metadata['page_number'],
                    'text': result.text,
                    'confidence': result.confidence,
                    'layout_blocks': result.layout_blocks,
                    'tables': result.tables,
                    'metadata': result.metadata,
                    'processing_time': result.processing_time
                }
                for result in page_results
            ],
            'total_pages': len(page_results),
            'combined_text': combined_text,
            'filename': file.filename,
            'total_processing_time': sum(r.processing_time for r in page_results)
        }
        
        logger.info(f"PDF processado: {len(page_results)} páginas")
        
        return jsonify(response), 200
        
    except BadRequest as e:
        logger.error(f"Erro de requisição PDF: {str(e)}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Erro interno PDF: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
 
@app.route('/classify', methods=['POST'])
def classify_document():
    """
    Endpoint para classificação automática de documentos.
    
    Recebe:
    - document_content: conteúdo do documento
    - confidence_threshold: limite de confiança (opcional)
    
    Retorna:
    - classification: tipo detectado
    - confidence: nível de confiança
    - suggestions: sugestões alternativas
    """
    try:
        data = validate_request_data(request)
        
        logger.info("Iniciando classificação automática")
        
        # Classificar documento
        classification_result = classification_service.classify_document(
            content=data['document_content'],
            confidence_threshold=data.get('confidence_threshold', 0.8)
        )
        
        logger.info(f"Classificação: {classification_result.get('type')} (confiança: {classification_result.get('confidence')})")
        
        return jsonify(classification_result), 200
        
    except BadRequest as e:
        logger.error(f"Erro de validação na classificação: {str(e)}")
        return jsonify({'error': 'Dados inválidos', 'details': str(e)}), 400
        
    except Exception as e:
        logger.error(f"Erro interno na classificação: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/rules', methods=['GET'])
def get_analysis_rules():
    """
    Endpoint para obter regras de análise padrão.
    
    Retorna:
    - rules: regras de análise por tipo de documento
    """
    try:
        rules = get_default_rules()
        return jsonify({'rules': rules}), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter regras: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/parameters/adaptive', methods=['POST'])
def get_adaptive_parameters():
    """Gera parâmetros adaptativos baseados no perfil do documento."""
    try:
        data = request.get_json()
        
        # Validar dados de entrada
        if not data:
            raise BadRequest("Dados JSON são obrigatórios")
        
        # Criar perfil do documento
        document_profile = DocumentProfile(
            document_type=data.get('document_type', 'default'),
            complexity_score=data.get('complexity_score', 0.5),
            page_count=data.get('page_count', 1),
            word_count=data.get('word_count', 0),
            has_tables=data.get('has_tables', False),
            has_images=data.get('has_images', False),
            language=data.get('language', 'pt-br')
        )
        
        # Obter configurações organizacionais se fornecidas
        organization_config = data.get('organization_config')
        
        # Gerar parâmetros adaptativos
        adaptive_params = parameter_engine.get_adaptive_parameters(
            document_profile, 
            organization_config
        )
        
        return jsonify({
            'success': True,
            'parameters': adaptive_params.to_dict(),
            'document_profile': {
                'type': document_profile.document_type,
                'complexity': document_profile.complexity_score,
                'pages': document_profile.page_count
            }
        }), 200
        
    except BadRequest as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Erro ao gerar parâmetros adaptativos: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/parameters/feedback', methods=['POST'])
def record_feedback():
    """Registra feedback do usuário para melhorar adaptações futuras."""
    try:
        data = request.get_json()
        
        if not data:
            raise BadRequest("Dados JSON são obrigatórios")
        
        document_id = data.get('document_id')
        feedback_type = data.get('feedback_type')
        feedback_data = data.get('feedback_data', {})
        
        if not document_id or not feedback_type:
            raise BadRequest("document_id e feedback_type são obrigatórios")
        
        # Registrar feedback
        parameter_engine.record_user_feedback(
            document_id, 
            feedback_type, 
            feedback_data
        )
        
        return jsonify({
            'success': True,
            'message': 'Feedback registrado com sucesso'
        }), 200
        
    except BadRequest as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Erro ao registrar feedback: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/parameters/metrics', methods=['GET'])
def get_performance_metrics():
    """Retorna métricas de performance do sistema adaptativo."""
    try:
        metrics = parameter_engine.get_performance_metrics()
        
        return jsonify({
            'success': True,
            'metrics': metrics
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter métricas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/parameters/result', methods=['POST'])
def record_analysis_result():
    """Registra resultado de análise para aprendizado do sistema."""
    try:
        data = request.get_json()
        
        if not data:
            raise BadRequest("Dados JSON são obrigatórios")
        
        # Extrair dados do perfil do documento
        profile_data = data.get('document_profile', {})
        document_profile = DocumentProfile(
            document_type=profile_data.get('document_type', 'default'),
            complexity_score=profile_data.get('complexity_score', 0.5),
            page_count=profile_data.get('page_count', 1),
            word_count=profile_data.get('word_count', 0),
            has_tables=profile_data.get('has_tables', False),
            has_images=profile_data.get('has_images', False),
            language=profile_data.get('language', 'pt-br')
        )
        
        # Extrair parâmetros utilizados
        params_data = data.get('parameters_used', {})
        parameters_used = AnalysisParameters(
            structural_weight=params_data.get('structural_weight', 25.0),
            legal_weight=params_data.get('legal_weight', 25.0),
            clarity_weight=params_data.get('clarity_weight', 25.0),
            abnt_weight=params_data.get('abnt_weight', 25.0),
            confidence_threshold=params_data.get('confidence_threshold', 0.7),
            max_retries=params_data.get('max_retries', 3),
            timeout=params_data.get('timeout', 300),
            custom_rules=params_data.get('custom_rules', [])
        )
        
        # Extrair resultado da análise
        result = data.get('result', {})
        
        # Registrar resultado
        parameter_engine.record_analysis_result(
            document_profile,
            parameters_used,
            result
        )
        
        return jsonify({
            'success': True,
            'message': 'Resultado registrado com sucesso'
        }), 200
        
    except BadRequest as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Erro ao registrar resultado: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handler para rotas não encontradas."""
    return jsonify({'error': 'Endpoint não encontrado'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handler para erros internos."""
    logger.error(f"Erro interno: {str(error)}")
    return jsonify({'error': 'Erro interno do servidor'}), 500

if __name__ == '__main__':
    # Configurações para desenvolvimento
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Iniciando Document Analyzer na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)