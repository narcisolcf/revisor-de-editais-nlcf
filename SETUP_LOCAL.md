# 🛠️ Setup Local - LicitaReview

Guia completo para configuração do ambiente de desenvolvimento local.

---

## 📋 Pré-requisitos

### Software Necessário

- **Node.js**: v20.x ou superior
- **Python**: v3.11 ou superior
- **Git**: v2.x ou superior
- **npm**: v10.x ou superior

### Contas e Credenciais

- Conta Google Cloud Platform (para serviços GCP)
- Credenciais Firebase Admin SDK
- Chave de API OpenAI (opcional, para testes locais)

---

## 🚀 Instalação Rápida

### 1. Clone o Repositório

```bash
git clone https://github.com/narcisolcf/revisor-de-editais-nlcf.git
cd revisor-de-editais-nlcf
```

### 2. Configure o Frontend e Serviços Node.js

```bash
# Instalar dependências
npm install

# Verificar instalação
npm run type-check
```

### 3. Configure o Serviço Python (Analyzer)

```bash
cd services/analyzer

# Criar ambiente virtual
python3 -m venv venv

# Ativar ambiente virtual
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Voltar para raiz do projeto
cd ../..
```

---

## 🧪 Executando Testes

### Testes Python (Analyzer Service)

```bash
cd services/analyzer

# Ativar venv (se não estiver ativo)
source venv/bin/activate

# Executar todos os testes
export PYTHONPATH="${PWD}"
pytest tests/ -v

# Executar com cobertura
pytest tests/ -v --cov=src --cov-report=html

# Ver relatório de cobertura
open htmlcov/index.html  # Mac
xdg-open htmlcov/index.html  # Linux
```

### Testes E2E (Playwright)

```bash
# Na raiz do projeto

# Instalar Playwright browsers (primeira vez)
npx playwright install

# Executar todos os testes E2E
npm run e2e

# Executar com UI mode (modo interativo)
npm run e2e:ui

# Executar em modo debug
npm run e2e:debug

# Ver relatório HTML
npx playwright show-report
```

### Testes Frontend (Vitest)

```bash
# Na raiz do projeto

# Executar testes unitários
npm test

# Executar em modo watch
npm test -- --watch

# Executar com cobertura
npm test -- --coverage
```

---

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente

Crie os arquivos `.env` necessários:

**`services/analyzer/.env`**
```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=seu-projeto-gcp
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Vertex AI
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-2.0-flash-001

# Firestore
FIRESTORE_COLLECTION_DOCUMENTS=documents
FIRESTORE_COLLECTION_ANALYSIS=analysis

# Storage
GCS_BUCKET=seu-bucket-name

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=INFO
```

**`apps/web/.env.local`**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_FIREBASE_CONFIG='{...}'
```

---

## 🐛 Troubleshooting

### Problema: VEnv Python não funciona

**Sintoma**: Erro ao ativar venv ou executar pytest

**Solução**:
```bash
cd services/analyzer
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Problema: Testes E2E falham com erro de módulo

**Sintoma**: `ReferenceError: require is not defined`

**Solução**: Verifique que o `playwright.config.ts` usa apenas ES6 imports:
```typescript
// ❌ Errado
globalSetup: require.resolve('./tests/e2e/global-setup.ts')

// ✅ Correto
globalSetup: './tests/e2e/global-setup.ts'
```

### Problema: Erro de PYTHONPATH

**Sintoma**: `ModuleNotFoundError: No module named 'src'`

**Solução**:
```bash
export PYTHONPATH="${PWD}/services/analyzer"
pytest services/analyzer/tests/ -v
```

### Problema: Tiktoken 403 Error

**Sintoma**: `HTTPError: 403 Forbidden for url: https://openaipublic.blob.core.windows.net/encodings/cl100k_base.tiktoken`

**Solução**: Este é um problema de rede/proxy. Os testes com mocks ainda funcionam. Para resolver:
1. Verifique sua conexão de internet
2. Desative proxy/VPN temporariamente
3. Ou use mocks para TokenCounter nos testes

---

## 📦 Estrutura do Projeto

```
revisor-de-editais-nlcf/
├── apps/
│   └── web/                 # Aplicação Next.js
├── packages/
│   ├── domain/              # Lógica de domínio
│   ├── shared/              # Código compartilhado
│   └── types/               # Tipos TypeScript
├── services/
│   ├── analyzer/            # Serviço Python de análise
│   │   ├── src/            # Código fonte
│   │   ├── tests/          # Testes Python
│   │   ├── venv/           # Ambiente virtual (criar local)
│   │   └── requirements.txt
│   └── api/                # Cloud Functions
├── tests/
│   └── e2e/                # Testes E2E Playwright
├── .github/
│   └── workflows/          # CI/CD GitHub Actions
└── package.json
```

---

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build de produção
npm run lint             # Linter
npm run type-check       # Verificação de tipos

# Testes
npm test                 # Testes unitários
npm run e2e              # Testes E2E
npm run e2e:ui           # Testes E2E modo UI

# Python (na pasta services/analyzer)
pytest tests/ -v         # Testes Python
pytest tests/ -k "test_name"  # Teste específico
pytest tests/ --lf       # Apenas últimos falhos

# Limpeza
npm run clean            # Limpa build artifacts
rm -rf node_modules      # Remove node_modules
rm -rf services/analyzer/venv  # Remove venv Python
```

---

## 🔍 Verificação de Setup

Execute este checklist para verificar que tudo está configurado corretamente:

```bash
# ✅ Node.js e npm
node --version           # Deve ser v20.x+
npm --version            # Deve ser v10.x+

# ✅ Python
python3 --version        # Deve ser v3.11+

# ✅ Dependências Node.js
npm list turbo           # Turbo deve estar instalado

# ✅ Dependências Python
cd services/analyzer
source venv/bin/activate
python -c "import pytest; import fastapi; import pydantic; print('✅ OK')"

# ✅ Playwright
npx playwright --version

# ✅ Testes
npm test -- --run        # Deve passar
cd services/analyzer && export PYTHONPATH=$PWD && pytest tests/ -v
```

---

## 🚦 Próximos Passos

Após o setup:

1. **Explore a documentação**:
   - `README.md` - Visão geral do projeto
   - `ROADMAP_STATUS_REPORT.md` - Status das fases
   - `RELATORIO_FASE4_TESTES.md` - Relatório de testes

2. **Configure IDE**:
   - VS Code: Instale extensões Python, ESLint, Playwright
   - Configure formatação automática (Prettier)
   - Configure linter automático

3. **Rode o projeto**:
   ```bash
   npm run dev
   ```

4. **Execute os testes**:
   ```bash
   npm test
   npm run e2e
   ```

---

## 📞 Ajuda

Se encontrar problemas:

1. Verifique o [Troubleshooting](#-troubleshooting) acima
2. Consulte `RELATORIO_FASE4_TESTES.md` para problemas conhecidos
3. Abra uma issue no GitHub

---

**Última atualização**: 2025-11-21
**Versão**: 1.1.0
