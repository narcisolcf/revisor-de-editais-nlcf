#!/bin/bash
# Script para executar todos os testes

set -e

cd /home/user/revisor-de-editais-nlcf/services/analyzer

echo "🧪 Executando testes do Vertex AI RAG..."

# Ativar virtualenv se existir
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Executar testes com coverage
echo ""
echo "📊 Executando testes com coverage..."
pytest tests/ \
    --cov=src \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=xml \
    -v \
    --tb=short

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "📈 Relatório de coverage HTML gerado em: htmlcov/index.html"
