# 🚀 LicitaReview - Motor de Análise Adaptativo

## Visão Geral

O **Motor de Análise Adaptativo** é o **diferencial competitivo principal** do LicitaReview. Ele permite que cada organização tenha seus próprios critérios de análise de documentos, resultando em análises personalizadas e mais precisas.

### 🎯 Diferencial Competitivo

**O MESMO DOCUMENTO pode ter SCORES DIFERENTES para organizações diferentes!**

- 🏛️ **TCU**: Foco em conformidade jurídica (Legal 50%, Estrutural 30%)
- 🏙️ **Prefeituras**: Análise equilibrada (25% cada categoria)  
- 🔧 **Engenharia**: Foco técnico (Estrutural 40%, ABNT 30%)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    ADAPTIVE ANALYZER                        │
├─────────────────────────────────────────────────────────────┤
│  🎛️ Parâmetros Personalizados por Organização              │
│  ├── Pesos adaptativos (structural, legal, clarity, abnt)  │
│  ├── Regras customizadas (regex, patterns)                 │
│  ├── Templates organizacionais                             │
│  └── Configurações específicas                             │
├─────────────────────────────────────────────────────────────┤
│  🔍 Base Analysis Engines                                   │
│  ├── Structural Analysis                                    │
│  ├── Legal Compliance                                       │
│  ├── Clarity Analysis                                       │
│  └── ABNT Standards                                         │
├─────────────────────────────────────────────────────────────┤
│  📊 Weighted Scoring System                                 │
│  └── Score = Σ(CategoryScore × OrganizationWeight)          │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Como Usar

### 1. Configuração Organizacional

```python
from src.models.config_models import OrganizationConfig, AnalysisWeights

# Criar configuração personalizada
weights = AnalysisWeights(
    structural=25.0,  # Análise estrutural: 25%
    legal=40.0,      # Conformidade jurídica: 40%
    clarity=25.0,    # Clareza textual: 25%
    abnt=10.0        # Normas ABNT: 10%
)

org_config = OrganizationConfig(
    organization_id="org_tcu_001",
    organization_name="Tribunal de Contas da União",
    weights=weights,
    preset_type="rigorous"
)
```

### 2. Regras Personalizadas

```python
from src.models.config_models import CustomRule

# Regra para detectar linguagem subjetiva
rule = CustomRule(
    name="Detectar Critérios Subjetivos",
    description="Identifica critério subjetivo sem parâmetros",
    pattern=r"critério\s+da\s+administração",
    severity="alta",
    category="juridico",
    message="Critério subjetivo identificado",
    suggestion="Definir parâmetros objetivos"
)

org_config.add_custom_rule(rule)
```

### 3. Análise Adaptativa

```python
from src.services.adaptive_analyzer import AdaptiveAnalyzer

# Criar analisador adaptativo
analyzer = AdaptiveAnalyzer(
    doc_type="pregao",
    org_config=org_config
)

# Executar análise
result = await analyzer.analyze_with_custom_params(document)

print(f"Score ponderado: {result.weighted_score}")
print(f"Findings personalizados: {len([f for f in result.findings if f.is_custom_rule])}")
```

## 📡 API Endpoints

### POST `/analyze/adaptive`

Endpoint principal para análise adaptativa:

```bash
curl -X POST "http://localhost:8080/analyze/adaptive" \
  -H "X-API-Key: licitareview_demo_key_2024" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "doc_123",
    "organization_config": {
      "organization_id": "org_tcu_001",
      "weights": {
        "structural": 30.0,
        "legal": 50.0,
        "clarity": 15.0,
        "abnt": 5.0
      },
      "custom_rules": [],
      "preset_type": "rigorous"
    },
    "analysis_type": "standard"
  }'
```

### Resposta

```json
{
  "analysis_result": {
    "weighted_score": 78.5,
    "conformity_scores": {
      "structural": 85.0,
      "legal": 75.0,
      "clarity": 80.0,
      "abnt": 70.0
    },
    "findings": [...],
    "recommendations": [...]
  },
  "processing_info": {
    "analysis_engine": "adaptive-v2.0.0",
    "custom_rules_applied": 3,
    "personalization_score": 25.5
  }
}
```

## 🧪 Demonstração

Execute a demonstração para ver o motor adaptativo em ação:

```bash
cd services/analyzer
python demo_adaptive_analysis.py
```

A demonstração mostra:
- ✅ 3 organizações diferentes analisando o mesmo documento
- 📊 Scores diferentes baseados nos pesos personalizados  
- 🎯 Aplicação de regras customizadas
- 📈 Comparação detalhada dos resultados

## 🔧 Componentes Principais

### AdaptiveAnalyzer
Motor principal que coordena análise personalizada:
- `analyze_with_custom_params()`: Análise completa adaptativa
- `calculate_weighted_score()`: Cálculo de score ponderado
- `apply_custom_validations()`: Aplicação de regras personalizadas

### BaseAnalysisEngine
Engines de análise por categoria:
- `analyze_structural()`: Análise estrutural do documento
- `analyze_legal()`: Conformidade jurídica
- `analyze_clarity()`: Clareza e objetividade
- `analyze_abnt()`: Conformidade com normas ABNT

### OrganizationConfig
Configuração organizacional completa:
- **Pesos personalizados** por categoria
- **Regras customizadas** específicas
- **Templates organizacionais**
- **Configurações avançadas**

## 📊 Presets Disponíveis

| Preset | Estrutural | Jurídico | Clareza | ABNT | Uso Recomendado |
|--------|------------|----------|---------|------|-----------------|
| **Rigoroso** | 30% | 50% | 15% | 5% | TCU, CGU, Controle |
| **Padrão** | 25% | 25% | 25% | 25% | Uso geral, Prefeituras |
| **Técnico** | 40% | 20% | 10% | 30% | Engenharia, Obras |
| **Flexível** | 30% | 30% | 30% | 10% | Processos expeditos |
| **Personalizado** | Definido pelo usuário | Configuração 100% customizada |

## 🎯 Casos de Uso

### 1. Tribunal de Contas (TCU)
```python
# Configuração rigorosa focada em conformidade
config = OrganizationConfig.create_default_config(
    organization_id="tcu_001",
    preset=AnalysisPreset.RIGOROUS  # Legal: 50%
)
```

### 2. Prefeitura Municipal
```python
# Configuração equilibrada
config = OrganizationConfig.create_default_config(
    organization_id="prefeitura_001", 
    preset=AnalysisPreset.STANDARD  # 25% cada categoria
)
```

### 3. Secretaria de Obras
```python
# Foco em aspectos técnicos
config = OrganizationConfig.create_default_config(
    organization_id="obras_001",
    preset=AnalysisPreset.TECHNICAL  # Estrutural: 40%, ABNT: 30%
)
```

## ⚡ Performance

- **Cache inteligente** de resultados
- **Análises paralelas** por categoria  
- **Rate limiting** configurável
- **Timeouts ajustáveis**

## 🔒 Segurança

- **API Keys** obrigatórias
- **Rate limiting** por IP e endpoint
- **Validação rigorosa** de inputs
- **Logs estruturados** para auditoria

## 🚀 Diferencial Competitivo

| Funcionalidade | LicitaReview | Concorrentes |
|----------------|--------------|--------------|
| **Pesos Personalizados** | ✅ 100% customizável | ❌ Fixos |
| **Regras Organizacionais** | ✅ Ilimitadas | ❌ Limitadas |
| **Templates Específicos** | ✅ Por organização | ❌ Genéricos |
| **Análise Adaptativa** | ✅ Score diferente por org | ❌ Score único |
| **API Moderna** | ✅ FastAPI async | ❌ APIs legadas |
| **Logs Estruturados** | ✅ Observabilidade completa | ❌ Logs simples |

---

**🚀 LicitaReview - Revolucionando a análise de documentos licitatórios com IA adaptativa!**