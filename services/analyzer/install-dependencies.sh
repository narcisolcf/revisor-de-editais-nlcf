#!/bin/bash
# Script de instalação de dependências para Vertex AI RAG

set -e

echo "📦 Instalando dependências do Analyzer Service..."

cd /home/user/revisor-de-editais-nlcf/services/analyzer

# Criar virtualenv se não existir
if [ ! -d "venv" ]; then
    echo "🔧 Criando virtualenv..."
    python3 -m venv venv
fi

# Ativar virtualenv
source venv/bin/activate

# Upgrade pip
echo "⬆️ Atualizando pip..."
pip install --upgrade pip setuptools wheel

# Instalar dependências em grupos
echo "📚 Instalando dependências core..."
pip install fastapi uvicorn pydantic pydantic-settings python-multipart

echo "📄 Instalando processamento de documentos..."
pip install PyPDF2 python-docx python-dateutil

echo "☁️ Instalando Google Cloud..."
pip install google-cloud-firestore google-cloud-storage google-cloud-vision

echo "🤖 Instalando AI/ML (pode levar alguns minutos)..."
pip install google-cloud-aiplatform google-generativeai

echo "🔧 Instalando utilidades..."
pip install structlog requests tenacity tiktoken redis

echo "🧪 Instalando ferramentas de teste..."
pip install pytest pytest-cov pytest-asyncio black ruff mypy

echo "✅ Todas as dependências instaladas com sucesso!"
echo ""
echo "Para ativar o ambiente virtual:"
echo "  source venv/bin/activate"
