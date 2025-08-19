# Document Analyzer Service

Serviço Cloud Run para análise inteligente de documentos licitatórios com IA.

## 🚀 Funcionalidades

### Core Features
- **Análise Completa**: Motor de análise adaptativo com 4 categorias (Estrutural, Legal, Clareza, ABNT)
- **OCR Avançado**: Extração de texto com Google Cloud Vision API e fallback Tesseract
- **Classificação Automática**: ML para detecção automática do tipo de documento
- **Verificação de Conformidade**: Sistema robusto de verificação de conformidade legal

### Análise por Categorias

#### 1. Análise Estrutural
- Verificação de seções obrigatórias
- Análise de numeração e hierarquia
- Verificação de índice/sumário
- Avaliação de formatação

#### 2. Análise Legal
- Verificação de referências legais obrigatórias
- Análise de cláusulas essenciais
- Verificação de prazos e datas
- Conformidade com legislação vigente

#### 3. Análise de Clareza
- Avaliação de legibilidade
- Detecção de jargão excessivo
- Verificação de consistência terminológica
- Identificação de ambiguidades

#### 4. Análise ABNT
- Verificação de citações (NBR 6023)
- Análise de formatação
- Verificação de numeração de páginas
- Conformidade com estrutura ABNT

## 📋 API Endpoints

### Health Check
```http
GET /health
```
Verifica o status do serviço.

### Análise Completa
```http
POST /analyze
Content-Type: multipart/form-data

file: [arquivo do documento]
document_type: [tipo do documento]
parameters: [parâmetros de análise em JSON]
```

**Exemplo de parâmetros:**
```json
{
  "weights": {
    "structural": 0.3,
    "legal": 0.4,
    "clarity": 0.2,
    "abnt": 0.1
  },
  "enable_ocr": true,
  "enable_conformity_check": true,
  "language": "pt"
}
```

### Classificação Automática
```http
POST /classify
Content-Type: multipart/form-data

file: [arquivo do documento]
```

### Regras de Análise
```http
GET /rules?document_type=edital_licitacao
```

## 🛠️ Tecnologias

- **Python 3.11**: Linguagem principal
- **Flask**: Framework web
- **Google Cloud Vision API**: OCR avançado
- **scikit-learn**: Machine Learning
- **spaCy**: Processamento de linguagem natural
- **NLTK**: Análise de texto
- **Docker**: Containerização
- **Cloud Run**: Deployment serverless

## 🚀 Deploy

### Pré-requisitos

1. **Google Cloud Project** configurado
2. **Service Account** com permissões:
   - Cloud Vision API
   - Cloud Storage
   - Cloud Run
   - Cloud Logging

3. **APIs habilitadas**:
   ```bash
   gcloud services enable vision.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

### Deploy Automático

1. **Configurar variáveis**:
   ```bash
   export PROJECT_ID=seu-projeto-id
   export REGION=us-central1
   ```

2. **Deploy via Cloud Build**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

### Deploy Manual

1. **Build da imagem**:
   ```bash
   docker build -t gcr.io/$PROJECT_ID/document-analyzer .
   ```

2. **Push para Container Registry**:
   ```bash
   docker push gcr.io/$PROJECT_ID/document-analyzer
   ```

3. **Deploy no Cloud Run**:
   ```bash
   gcloud run deploy document-analyzer \
     --image gcr.io/$PROJECT_ID/document-analyzer \
     --region $REGION \
     --platform managed \
     --memory 2Gi \
     --cpu 2 \
     --concurrency 100 \
     --max-instances 10 \
     --timeout 300 \
     --allow-unauthenticated
   ```

## ⚙️ Configuração

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

**Principais configurações:**

- `GOOGLE_CLOUD_PROJECT`: ID do projeto Google Cloud
- `GOOGLE_APPLICATION_CREDENTIALS`: Caminho para service account
- `GCS_BUCKET_NAME`: Bucket para armazenamento de documentos
- `REDIS_URL`: URL do Redis para cache (opcional)
- `LOG_LEVEL`: Nível de logging (DEBUG, INFO, WARNING, ERROR)

### Service Account

Crie um service account com as seguintes permissões:

```json
{
  "roles": [
    "roles/vision.admin",
    "roles/storage.admin",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter"
  ]
}
```

## 🧪 Desenvolvimento Local

### Instalação

1. **Clone o repositório**:
   ```bash
   git clone <repo-url>
   cd cloud-run-services/document-analyzer
   ```

2. **Instale dependências**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure modelos spaCy**:
   ```bash
   python -m spacy download pt_core_news_sm
   ```

4. **Configure NLTK**:
   ```python
   import nltk
   nltk.download('punkt')
   nltk.download('stopwords')
   nltk.download('vader_lexicon')
   ```

### Execução

```bash
python main.py
```

O serviço estará disponível em `http://localhost:8080`

### Testes

```bash
# Executar todos os testes
pytest

# Testes com cobertura
pytest --cov=services

# Testes específicos
pytest tests/test_analysis_engine.py
```

## 📊 Monitoramento

### Health Checks

O serviço inclui health checks automáticos:

- **Liveness**: `/health`
- **Readiness**: `/health/ready`
- **Metrics**: `:9090/metrics` (Prometheus)

### Logging

Logs estruturados em JSON com níveis:

- `DEBUG`: Informações detalhadas de debug
- `INFO`: Operações normais
- `WARNING`: Situações que requerem atenção
- `ERROR`: Erros que não impedem o funcionamento
- `CRITICAL`: Erros críticos que podem parar o serviço

### Métricas

Métricas disponíveis via Prometheus:

- `document_analysis_duration_seconds`: Tempo de análise
- `document_analysis_total`: Total de análises
- `ocr_requests_total`: Total de requisições OCR
- `ml_classification_accuracy`: Precisão da classificação
- `conformity_check_issues_total`: Total de questões de conformidade

## 🔧 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação Google Cloud**:
   ```bash
   gcloud auth application-default login
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

2. **Erro de memória**:
   - Aumente a memória no Cloud Run: `--memory 4Gi`
   - Otimize processamento de documentos grandes

3. **Timeout em análises**:
   - Aumente timeout: `--timeout 600`
   - Implemente processamento assíncrono

4. **Erro de dependências**:
   ```bash
   pip install --upgrade -r requirements.txt
   ```

### Debug

Para debug detalhado:

```bash
export LOG_LEVEL=DEBUG
export DEBUG_ANALYSIS=true
python main.py
```

## 📈 Performance

### Otimizações Implementadas

- **Cache inteligente**: Redis para resultados de análise
- **Processamento paralelo**: Análise de múltiplas categorias
- **Lazy loading**: Carregamento sob demanda de modelos ML
- **Compressão**: Compressão de respostas HTTP
- **Connection pooling**: Pool de conexões para APIs externas

### Benchmarks

- **Documento pequeno** (< 10 páginas): ~5-10 segundos
- **Documento médio** (10-50 páginas): ~15-30 segundos
- **Documento grande** (50+ páginas): ~30-60 segundos

*Tempos podem variar baseado na complexidade e recursos disponíveis.*

## 🔒 Segurança

### Medidas Implementadas

- **Validação de entrada**: Sanitização de todos os inputs
- **Rate limiting**: Limite de requisições por IP
- **Autenticação**: Suporte a tokens de autenticação
- **Criptografia**: Dados sensíveis criptografados
- **Audit logging**: Log de todas as operações
- **Container security**: Execução como usuário não-root

### Configuração de Segurança

```bash
# Habilitar autenticação
export AUTH_ENABLED=true
export AUTH_TOKEN_HEADER=X-Auth-Token

# Configurar rate limiting
export RATE_LIMIT=100/hour

# Configurar CORS
export ALLOWED_ORIGINS=https://yourdomain.com
```

## 📚 Documentação Adicional

- [API Reference](./docs/api.md)
- [Architecture Guide](./docs/architecture.md)
- [Development Guide](./docs/development.md)
- [Deployment Guide](./docs/deployment.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte técnico:

- **Issues**: [GitHub Issues](https://github.com/seu-repo/issues)
- **Email**: suporte@seudominio.com
- **Documentação**: [Wiki do Projeto](https://github.com/seu-repo/wiki)

---

**Desenvolvido com ❤️ para modernizar a análise de documentos licitatórios**