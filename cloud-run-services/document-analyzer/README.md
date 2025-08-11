# LicitaReview - Document Analyzer Service

## 🚀 CORE DIFERENCIAL: Sistema de Parâmetros Personalizados

Este serviço implementa o **diferencial competitivo principal** do LicitaReview: **parâmetros personaliz‡áveis por organização**. Cada órgão pode configurar pesos e regras específicas para seus processos licitatórios.

## 📁 Estrutura do Projeto

```
document-analyzer/
├── models/                     # 🚨 CORE - Modelos Pydantic
│   ├── __init__.py            # Exports principais
│   ├── document_models.py     # Modelos de documentos
│   ├── analysis_models.py     # Modelos de análise  
│   ├── config_models.py       # 🚀 CORE: Configurações organizacionais
│   └── utils.py              # Utilitários de conversão
├── requirements.txt           # Dependências Python
├── test_models.py            # Testes e demonstrações
└── README.md                 # Esta documentação
```

## 🎯 Modelos Implementados

### 1. DocumentModels
Modelos para representar documentos licitatórios e seus metadados.

```python
from models import Document, DocumentType, DocumentClassification

# Criar documento
document = Document(
    title="Edital de Pregão Eletrônico nº 123/2025",
    content="EDITAL DE PREGÃO...",
    classification=DocumentClassification(
        primary_category="licitacao",
        document_type=DocumentType.EDITAL,
        modality=LicitationModality.PREGAO_ELETRONICO
    ),
    organization_id="org_prefeitura_sp"
)
```

**Características:**
- ✅ Validação completa com Pydantic
- ✅ Suporte a versionamento de documentos
- ✅ Metadados ricos (OCR, tamanho, páginas)
- ✅ Tipos específicos para licitações

### 2. AnalysisModels
Modelos para resultados de análise e findings.

```python
from models import AnalysisResult, ConformityScore, AnalysisFinding

# Resultado de análise
result = AnalysisResult(
    document_id="doc_123",
    organization_id="org_prefeitura",
    conformity_scores=ConformityScore(
        structural=85.0,
        legal=92.0,
        clarity=78.0,
        abnt=88.0,
        overall=86.0
    ),
    weighted_score=89.2,  # Score calculado com pesos personalizados
    findings=[...],
    applied_config=org_config
)
```

**Características:**
- ✅ Scores por categoria de análise
- ✅ Findings detalhados com severidade
- ✅ Score ponderado baseado nos pesos organizacionais
- ✅ Metadados de execução

### 3. ConfigModels - 🚀 CORE DIFERENCIAL

Os modelos mais importantes do sistema, implementando a personalização por organização.

#### AnalysisWeights - Pesos Personalizados

```python
from models import AnalysisWeights, AnalysisPreset

# Pesos customizados para Tribunal de Contas (foco jurídico)
rigorous_weights = AnalysisWeights(
    structural=15.0,  # Menos foco em estrutura
    legal=60.0,       # FOCO PRINCIPAL em conformidade legal
    clarity=20.0,     # Clareza importante
    abnt=5.0          # ABNT menos relevante
)

# Pesos balanceados para uso geral
standard_weights = AnalysisWeights.from_preset(AnalysisPreset.STANDARD)
# structural=25%, legal=25%, clarity=25%, abnt=25%
```

**🚨 VALIDAÇÃO CRÍTICA:**
- A soma dos pesos deve ser **exatamente 100%**
- Cada peso individual entre 0% e 100%
- Validação automática com Pydantic

#### OrganizationConfig - Configuração Completa

```python
from models import OrganizationConfig, CustomRule

# Configuração organizacional completa
config = OrganizationConfig(
    organization_id="org_tribunal_contas",
    organization_name="Tribunal de Contas do Estado",
    weights=rigorous_weights,
    preset_type=AnalysisPreset.RIGOROUS,
    custom_rules=[
        CustomRule(
            name="Verificar Lei 14.133/2021",
            pattern=r"lei\s+14\.133",
            severity="critica",
            category="juridico",
            message="Referência à Lei 14.133/2021 não encontrada",
            suggestion="Incluir fundamentação na Lei 14.133/2021"
        )
    ]
)
```

**Funcionalidades:**
- ✅ Pesos personalizados por categoria
- ✅ Regras customizadas com regex
- ✅ Templates organizacionais
- ✅ Presets predefinidos
- ✅ Versionamento de configurações
- ✅ Hash para cache e comparação

## 🔧 Utilitários e Conversões

### ModelConverter
```python
from models.utils import ModelConverter

# Serialização para API
api_data = ModelConverter.serialize_model(document)

# Conversão para frontend
frontend_config = ModelConverter.convert_config_to_frontend(org_config)

# Dados para dashboard
dashboard_data = ModelConverter.convert_analysis_to_dashboard(analysis)
```

### ValidationUtils
```python
from models.utils import ValidationUtils

# Validação de consistência entre modelos
validation = ValidationUtils.validate_analysis_consistency(
    document, analysis, config
)
```

## 📊 Demonstração do Diferencial

Execute o arquivo de testes para ver o sistema funcionando:

```bash
cd cloud-run-services/document-analyzer
python test_models.py
```

**O que a demonstração mostra:**

1. **Mesmo documento, scores diferentes** por organização
2. **Tribunal de Contas**: Foco em conformidade legal (60% peso)
3. **Prefeitura Técnica**: Foco em especificações ABNT (25% peso)
4. **Órgão Padrão**: Análise balanceada (25% cada categoria)

### Exemplo de Resultados:

```
📊 IMPACTO DOS PESOS PERSONALIZADOS:
Score base: Estrutural=80%, Jurídico=70%, Clareza=85%, ABNT=90%

🎯 SCORES PERSONALIZADOS POR ORGANIZAÇÃO:
1. Tribunal de Contas - Conformidade Legal Rigorosa
   Score Personalizado: 73.0% (foco em jurídico com score baixo)
   
2. Prefeitura Técnica - Especificações Técnicas
   Score Personalizado: 83.8% (beneficia de ABNT alto)
   
3. Órgão Padrão - Análise Balanceada  
   Score Personalizado: 81.3% (média equilibrada)
```

## 🚨 Validações Críticas

### 1. Pesos devem somar 100%
```python
# ✅ Válido
weights = AnalysisWeights(structural=25.0, legal=25.0, clarity=25.0, abnt=25.0)

# ❌ Inválido - ValidationError
weights = AnalysisWeights(structural=30.0, legal=30.0, clarity=30.0, abnt=20.0)
# Erro: "A soma dos pesos deve ser exatamente 100%. Atual: 110.0%"
```

### 2. Consistência entre modelos
```python
# Validação automática de IDs consistentes
# Validação de scores ponderados corretos
# Verificação de hashes de configuração
```

## 🔄 Serialização e APIs

### Exportar/Importar Configurações
```python
from models.utils import SerializationUtils

# Exportar para JSON
config_json = SerializationUtils.export_config_to_json(org_config)

# Importar de JSON
imported_config = SerializationUtils.import_config_from_json(config_json)

# Exportar análises para CSV
csv_data = SerializationUtils.export_analysis_summary_csv(analyses_list)
```

### APIs Ready
```python
from models.utils import serialize_for_api

# Dados prontos para resposta de API
api_response = {
    "success": True,
    "data": serialize_for_api(analysis_result),
    "config": serialize_for_api(org_config)
}
```

## 📋 Requirements

Instalar dependências:
```bash
pip install -r requirements.txt
```

**Dependências principais:**
- `pydantic>=2.4.2` - Validação e serialização
- `flask>=2.3.3` - Web framework 
- `python-dateutil>=2.8.2` - Manipulação de datas
- `orjson>=3.9.7` - JSON rápido

## 🧪 Testes

```bash
# Executar testes básicos
python test_models.py

# Com pytest (opcional)
pip install pytest
pytest test_models.py -v
```

## 🚀 Próximos Passos (Fase 1 - Backend)

1. **Integração Flask** - Criar endpoints usando estes modelos
2. **Cloud Functions** - APIs para CRUD das configurações
3. **Firestore** - Persistência dos modelos
4. **Cloud Run** - Serviço principal de análise

## 💡 Diferencial Competitivo Implementado

✅ **Sistema de parâmetros personalizados por organização**
✅ **Pesos adaptativos para diferentes tipos de análise**
✅ **Regras customizadas com padrões regex**
✅ **Templates organizacionais específicos**
✅ **Presets otimizados por tipo de órgão**
✅ **Validação rigorosa e consistência de dados**
✅ **Serialização completa para APIs**
✅ **Utilitários de conversão para frontend/dashboard**

---

**🎯 CORE DIFERENCIAL IMPLEMENTADO COM SUCESSO!**

Este sistema permite que cada organização tenha sua própria "receita" de análise, adaptada às suas necessidades específicas, tornando o LicitaReview único no mercado.