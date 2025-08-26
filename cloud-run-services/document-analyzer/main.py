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

# Inicializar Flask app
app = Flask(__name__)
CORS(app)  # Habilitar CORS para frontend

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
    """Endpoint principal para análise de documentos."""
    try:
        data = request.get_json()
        if not data:
            raise BadRequest('JSON data required')
        
        # Simulação de análise básica
        result = {
            'document_id': data.get('document_id', 'unknown'),
            'analysis': {
                'status': 'completed',
                'confidence': 0.85,
                'classification': 'edital_licitacao',
                'key_points': [
                    'Processo licitatório identificado',
                    'Modalidade: Pregão Eletrônico',
                    'Objeto: Serviços de TI'
                ]
            },
            'timestamp': '2024-01-15T10:30:00Z'
        }
        
        return jsonify(result), 200
        
    except BadRequest as e:
        logger.error(f"Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/classify', methods=['POST'])
def classify_document():
    """Endpoint para classificação de documentos."""
    try:
        data = request.get_json()
        if not data:
            raise BadRequest('JSON data required')
        
        # Simulação de classificação
        result = {
            'document_id': data.get('document_id', 'unknown'),
            'classification': {
                'type': 'edital',
                'subtype': 'pregao_eletronico',
                'confidence': 0.92,
                'categories': ['licitacao', 'servicos', 'tecnologia']
            }
        }
        
        return jsonify(result), 200
        
    except BadRequest as e:
        logger.error(f"Bad request: {e}")
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Classification error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Configuração para Cloud Run
    port = int(os.environ.get('PORT', 8080))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Iniciando Document Analyzer na porta {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)