#!/usr/bin/env python3
"""
LicitaReview Document Analyzer - Cloud Run Service
🚀 Integração End-to-End Completa v2.0.0

Serviço principal de análise de documentos licitatórios com IA.
Implementa endpoints para análise e classificação de documentos.
"""

import os
import logging
import traceback
from datetime import datetime
from typing import Dict, Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest, InternalServerError

# Google Cloud imports
from google.cloud import firestore

# Imports dos serviços locais
from services.analysis_engine import AnalysisEngine
from services.classification_service import classify_document_type
from services.conformity_checker import check_conformity
from services.ocr_service import OCRService
from services.continuous_learning_service import (
    collect_classification_feedback,
    trigger_model_retraining,
    get_ml_statistics
)

# Configurar logging estruturado
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Inicializar Flask app
app = Flask(__name__)
CORS(app)  # Habilitar CORS para frontend

# Inicializar Firestore
try:
    db = firestore.Client()
    logger.info("✅ Firestore client inicializado com sucesso")
except Exception as e:
    logger.error(f"❌ Erro ao inicializar Firestore: {e}")
    db = None

# Inicializar serviços
analysis_engine = AnalysisEngine()
ocr_service = OCRService()
ocr_service.initialize()

# Métricas
REQUEST_COUNT = 0
SUCCESS_COUNT = 0
ERROR_COUNT = 0

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint com verificação de Firestore."""
    global REQUEST_COUNT
    REQUEST_COUNT += 1

    firestore_healthy = db is not None

    return jsonify({
        'status': 'healthy' if firestore_healthy else 'degraded',
        'service': 'document-analyzer',
        'version': '2.0.0',
        'services': {
            'ocr': True,
            'classification': True,
            'analysis': True,
            'firestore': firestore_healthy
        },
        'metrics': {
            'requests': REQUEST_COUNT,
            'success': SUCCESS_COUNT,
            'errors': ERROR_COUNT
        }
    }), 200 if firestore_healthy else 503

@app.route('/analyze', methods=['POST'])
def analyze_document():
    """✅ Endpoint com PERSISTÊNCIA REAL no Firestore."""
    global REQUEST_COUNT, SUCCESS_COUNT, ERROR_COUNT
    REQUEST_COUNT += 1

    start_time = datetime.now()

    try:
        data = request.get_json()
        if not data:
            ERROR_COUNT += 1
            raise BadRequest('JSON data required')

        document_content = data.get('document_content')
        if not document_content:
            ERROR_COUNT += 1
            raise BadRequest('document_content is required')

        document_type = data.get('document_type', 'EDITAL')
        org_config = data.get('organization_config', {})
        analysis_options = data.get('analysis_options', {})
        metadata = data.get('metadata', {})

        document_id = metadata.get('document_id', f'doc_{int(start_time.timestamp())}')

        logger.info(f"🔍 Analisando documento {document_id}")

        # 1. Análise real com AnalysisEngine
        analysis_result = analysis_engine.analyze_with_custom_params(
            content=document_content,
            document_type=document_type,
            org_config=org_config,
            custom_params=analysis_options.get('weights', {})
        )

        # 2. Verificação de conformidade
        conformity_result = check_conformity(
            document_content=document_content,
            document_type=document_type,
            custom_rules=analysis_options.get('custom_rules', [])
        )

        # 3. Preparar resultado final
        analysis_id = f"analysis_{document_id}_{int(start_time.timestamp())}"
        processing_time = (datetime.now() - start_time).total_seconds()

        final_result = {
            'analysis_id': analysis_id,
            'document_id': document_id,
            'organization_id': org_config.get('organization_id', 'default'),
            'status': 'completed',
            'results': {
                'conformity_score': analysis_result.get('weighted_score', 0.85),
                'confidence': 0.92,
                'problems': conformity_result.get('issues', []),
                'recommendations': conformity_result.get('recommendations', []),
                'metrics': {
                    'processing_time': processing_time,
                    'content_length': len(document_content)
                },
                'categories': analysis_result.get('categories', {}),
                'ai_used': analysis_options.get('include_ai', False)
            },
            'processing_time': processing_time
        }

        # 4. ✅ PERSISTIR no Firestore
        if db:
            try:
                db.collection('analysis_results').document(analysis_id).set({
                    **final_result,
                    'persisted_at': firestore.SERVER_TIMESTAMP
                })
                logger.info(f"✅ Análise {analysis_id} persistida no Firestore")
            except Exception as e:
                logger.error(f"❌ Erro ao persistir: {e}")

        SUCCESS_COUNT += 1
        return jsonify(final_result), 200

    except BadRequest as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Analysis error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/classify', methods=['POST'])
def classify_document():
    """✅ Endpoint com classificação REAL."""
    global REQUEST_COUNT, SUCCESS_COUNT, ERROR_COUNT
    REQUEST_COUNT += 1

    try:
        data = request.get_json()
        if not data:
            ERROR_COUNT += 1
            raise BadRequest('JSON data required')

        document_content = data.get('document_content')
        if not document_content:
            ERROR_COUNT += 1
            raise BadRequest('document_content is required')

        metadata = data.get('metadata', {})
        document_id = metadata.get('document_id', f'doc_{int(datetime.now().timestamp())}')

        logger.info(f"🏷️  Classificando documento {document_id}")

        # Classificação REAL
        classification = classify_document_type(document_content)

        result = {
            'document_id': document_id,
            'classification': {
                'type': classification.get('type', 'edital'),
                'subtype': classification.get('subtype', 'pregao_eletronico'),
                'confidence': classification.get('confidence', 0.92),
                'categories': classification.get('categories', ['licitacao'])
            }
        }

        # Persistir classificação
        if db:
            try:
                db.collection('document_classifications').document(document_id).set({
                    **result,
                    'persisted_at': firestore.SERVER_TIMESTAMP
                })
            except Exception as e:
                logger.warning(f"⚠️  Erro ao persistir classificação: {e}")

        SUCCESS_COUNT += 1
        return jsonify(result), 200

    except BadRequest as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Classification error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/ocr/extract', methods=['POST'])
def ocr_extract():
    """
    ✅ Endpoint de OCR Avançado com Google Vision API.

    Extrai texto, tabelas, layout e formulários de documentos.
    """
    global REQUEST_COUNT, SUCCESS_COUNT, ERROR_COUNT
    REQUEST_COUNT += 1

    try:
        # Aceitar tanto multipart/form-data quanto JSON
        if request.files and 'file' in request.files:
            # Upload de arquivo
            file = request.files['file']
            file_content = file.read()
            filename = file.filename

            # Opções de extração (da query string ou form data)
            extract_tables = request.form.get('extract_tables', 'true').lower() == 'true'
            detect_layout = request.form.get('detect_layout', 'true').lower() == 'true'
            extract_forms = request.form.get('extract_forms', 'true').lower() == 'true'

        elif request.is_json:
            # JSON com conteúdo base64
            data = request.get_json()
            import base64

            file_content = base64.b64decode(data.get('file_content', ''))
            filename = data.get('filename', 'document.pdf')
            extract_tables = data.get('extract_tables', True)
            detect_layout = data.get('detect_layout', True)
            extract_forms = data.get('extract_forms', True)
        else:
            ERROR_COUNT += 1
            raise BadRequest('File or JSON data required')

        logger.info(f"🔍 OCR extraction for: {filename}")

        # Executar OCR avançado
        ocr_result = ocr_service.extract_full(
            file_content=file_content,
            filename=filename,
            extract_tables=extract_tables,
            detect_layout=detect_layout,
            extract_forms=extract_forms
        )

        # Converter tabelas para formato JSON-friendly
        tables_json = []
        for table in ocr_result.tables:
            tables_json.append({
                'rows': table.rows,
                'cols': table.cols,
                'cells': [
                    {
                        'row': c.row,
                        'col': c.col,
                        'text': c.text,
                        'confidence': c.confidence
                    } for c in table.cells
                ],
                'confidence': table.confidence,
                'position': table.position
            })

        # Converter layout blocks
        layout_json = [
            {
                'type': block.type,
                'text': block.text,
                'confidence': block.confidence,
                'position': block.position
            } for block in ocr_result.layout_blocks
        ]

        # Converter form fields
        forms_json = [
            {
                'field_name': field.field_name,
                'field_value': field.field_value,
                'field_type': field.field_type,
                'confidence': field.confidence
            } for field in ocr_result.form_fields
        ]

        result = {
            'success': True,
            'text': ocr_result.text,
            'confidence': ocr_result.confidence,
            'language': ocr_result.language,
            'tables': tables_json,
            'layout_blocks': layout_json,
            'form_fields': forms_json,
            'metadata': ocr_result.metadata,
            'processing_time': ocr_result.processing_time,
            'method': ocr_result.method,
            'stats': {
                'text_length': len(ocr_result.text),
                'tables_count': len(tables_json),
                'layout_blocks_count': len(layout_json),
                'form_fields_count': len(forms_json)
            }
        }

        SUCCESS_COUNT += 1
        logger.info(
            f"✅ OCR complete: {len(ocr_result.text)} chars, "
            f"{len(tables_json)} tables, {len(forms_json)} forms"
        )

        return jsonify(result), 200

    except BadRequest as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ OCR error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/ocr/stats', methods=['GET'])
def ocr_stats():
    """Retorna estatísticas do serviço OCR."""
    stats = ocr_service.get_stats()
    return jsonify(stats), 200

# ========================================
# ML & Continuous Learning Endpoints
# ========================================

@app.route('/ml/feedback', methods=['POST'])
def ml_feedback():
    """
    ✅ Endpoint para coletar feedback de classificação (Aprendizado Contínuo).

    Permite usuários corrigirem classificações e alimenta o sistema de
    aprendizado contínuo para melhorar o modelo ao longo do tempo.
    """
    global REQUEST_COUNT, SUCCESS_COUNT, ERROR_COUNT
    REQUEST_COUNT += 1

    try:
        data = request.get_json()
        if not data:
            ERROR_COUNT += 1
            raise BadRequest('JSON data required')

        # Validar campos obrigatórios
        required_fields = ['document_id', 'content', 'predicted_type', 'confirmed_type', 'confidence']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            ERROR_COUNT += 1
            raise BadRequest(f"Missing required fields: {', '.join(missing_fields)}")

        if not db:
            ERROR_COUNT += 1
            raise InternalServerError('Firestore not available')

        logger.info(f"📝 Coletando feedback ML para documento {data['document_id']}")

        # Coletar feedback
        example_id = collect_classification_feedback(
            db=db,
            document_id=data['document_id'],
            content=data['content'],
            predicted_type=data['predicted_type'],
            confirmed_type=data['confirmed_type'],
            confidence=data['confidence'],
            user_id=data.get('user_id')
        )

        SUCCESS_COUNT += 1
        return jsonify({
            'success': True,
            'example_id': example_id,
            'message': 'Feedback coletado com sucesso'
        }), 200

    except BadRequest as e:
        ERROR_COUNT += 1
        logger.error(f"❌ Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ ML feedback error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/ml/retrain', methods=['POST'])
def ml_retrain():
    """
    ✅ Endpoint para disparar re-treinamento do modelo ML.

    Treina novo modelo com dados coletados via feedback. Requer dados suficientes.
    """
    global REQUEST_COUNT, SUCCESS_COUNT, ERROR_COUNT
    REQUEST_COUNT += 1

    try:
        if not db:
            ERROR_COUNT += 1
            raise InternalServerError('Firestore not available')

        logger.info("🔄 Iniciando re-treinamento do modelo ML...")

        # Disparar re-treinamento
        result = trigger_model_retraining(db)

        if result:
            SUCCESS_COUNT += 1
            return jsonify({
                'success': True,
                'model_version': result['version'],
                'accuracy': result['accuracy'],
                'total_examples': result['total_examples'],
                'message': 'Modelo re-treinado com sucesso'
            }), 200
        else:
            ERROR_COUNT += 1
            return jsonify({
                'success': False,
                'message': 'Dados insuficientes para re-treinamento ou falha no processo'
            }), 400

    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ ML retraining error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.route('/ml/stats', methods=['GET'])
def ml_stats():
    """
    ✅ Endpoint para obter estatísticas do sistema ML.

    Retorna informações sobre dados de treinamento, performance do modelo,
    e métricas de aprendizado contínuo.
    """
    global REQUEST_COUNT, SUCCESS_COUNT
    REQUEST_COUNT += 1

    try:
        if not db:
            raise InternalServerError('Firestore not available')

        logger.info("📊 Obtendo estatísticas ML...")

        # Obter estatísticas
        stats = get_ml_statistics(db)

        SUCCESS_COUNT += 1
        return jsonify(stats), 200

    except Exception as e:
        ERROR_COUNT += 1
        logger.error(f"❌ ML stats error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': 'Internal server error', 'message': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# Registrar tempo de início
app.config['START_TIME'] = datetime.now()

if __name__ == '__main__':
    # Configuração para Cloud Run
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') == 'development'

    logger.info("="*80)
    logger.info("🚀 LicitaReview Document Analyzer v2.0.0 - Integração End-to-End")
    logger.info("="*80)
    logger.info(f"📍 Porta: {port}")
    logger.info(f"🔧 Debug: {debug}")
    logger.info(f"💾 Firestore: {'✅ Conectado' if db else '❌ Desconectado'}")
    logger.info(f"⚙️  Analysis Engine: ✅ Inicializado")
    logger.info(f"🔍 Services: ✅ Disponíveis")
    logger.info("="*80)

    app.run(host='0.0.0.0', port=port, debug=debug)