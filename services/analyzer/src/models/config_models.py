"""
LicitaReview - Modelos de Configuração

Este módulo contém os modelos Pydantic para configurações organizacionais,
incluindo o sistema de parâmetros personalizados que é o CORE DIFERENCIAL
do LicitaReview.

🚀 CORE DIFERENCIAL: Sistema de Parâmetros Personalizados por Organização
Cada órgão pode configurar pesos e regras específicas para seus processos licitatórios.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from uuid import uuid4

from pydantic import field_validator, ConfigDict, BaseModel, Field, model_validator
from pydantic.types import StrictStr, PositiveInt, confloat

from .document_models import DocumentType


class AnalysisPreset(str, Enum):
    """
    Presets de configuração de análise para diferentes tipos de organização.
    
    Cada preset define pesos padrão otimizados para diferentes necessidades.
    """
    RIGOROUS = "rigorous"      # Foco em conformidade jurídica (órgãos de controle)
    STANDARD = "standard"      # Balanceado para uso geral
    FLEXIBLE = "flexible"      # Mais flexível para análises expeditas
    TECHNICAL = "technical"    # Foco em aspectos técnicos e ABNT
    CUSTOM = "custom"          # Configuração 100% personalizada


class AnalysisWeights(BaseModel):
    """
    🚀 CORE DIFERENCIAL - Pesos de Análise Personalizados por Organização
    
    Define os pesos (percentuais) para cada categoria de análise,
    permitindo que cada organização priorize diferentes aspectos
    conforme suas necessidades específicas.
    
    IMPORTANTE: A soma dos pesos deve sempre ser igual a 100%.
    """
    structural: confloat(ge=0.0, le=100.0) = Field(
        ...,
        description="Peso para análise estrutural - seções obrigatórias, formatação (0-100%)"
    )
    legal: confloat(ge=0.0, le=100.0) = Field(
        ...,
        description="Peso para conformidade jurídica - leis, decretos, normas (0-100%)"
    )
    clarity: confloat(ge=0.0, le=100.0) = Field(
        ...,
        description="Peso para clareza textual - ambiguidade, legibilidade (0-100%)"
    )
    abnt: confloat(ge=0.0, le=100.0) = Field(
        ...,
        description="Peso para normas ABNT - padrões técnicos (0-100%)"
    )
    
    model_config = ConfigDict(validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_weights_sum_to_100(self):
        """
        🚨 VALIDAÇÃO CRÍTICA: Garante que os pesos somem exatamente 100%.
        
        Esta é uma validação fundamental para o diferencial competitivo.
        """
        structural = values.get('structural', 0)
        legal = values.get('legal', 0)
        clarity = values.get('clarity', 0)
        abnt = values.get('abnt', 0)
        
        total = structural + legal + clarity + abnt
        
        # Permite uma tolerância mínima de 0.01 para arredondamentos
        if abs(total - 100.0) > 0.01:
            raise ValueError(
                f"A soma dos pesos deve ser exatamente 100%. "
                f"Atual: {total:.2f}% "
                f"(Estrutural: {structural}%, Jurídico: {legal}%, "
                f"Clareza: {clarity}%, ABNT: {abnt}%)"
            )
        
        return values
    
    @field_validator('structural', 'legal', 'clarity', 'abnt')
    @classmethod
    def validate_individual_weights(cls, v):
        """Valida que cada peso individual está em faixa aceitável."""
        if v < 0:
            raise ValueError(f"Peso não pode ser negativo")
        if v > 100:
            raise ValueError(f"Peso não pode exceder 100%")
        return round(v, 2)  # Limita a 2 casas decimais
    
    def get_dominant_category(self) -> str:
        """
        Identifica a categoria com maior peso.
        
        Returns:
            Nome da categoria dominante
        """
        weights_dict = {
            'structural': self.structural,
            'legal': self.legal,
            'clarity': self.clarity,
            'abnt': self.abnt
        }
        
        return max(weights_dict.items(), key=lambda x: x[1])[0]
    
    def get_weight_distribution_type(self) -> str:
        """
        Classifica o tipo de distribuição dos pesos.
        
        Returns:
            Tipo: balanced, legal_focused, technical_focused, etc.
        """
        max_weight = max(self.structural, self.legal, self.clarity, self.abnt)
        min_weight = min(self.structural, self.legal, self.clarity, self.abnt)
        
        if max_weight - min_weight <= 15:
            return "balanced"
        elif self.legal >= 40:
            return "legal_focused"
        elif self.structural >= 40:
            return "structure_focused"
        elif self.abnt >= 30:
            return "technical_focused"
        elif self.clarity >= 40:
            return "clarity_focused"
        else:
            return "custom_focused"
    
    def to_percentage_dict(self) -> Dict[str, str]:
        """Converte pesos para dicionário com formatação percentual."""
        return {
            'structural': f"{self.structural:.1f}%",
            'legal': f"{self.legal:.1f}%",
            'clarity': f"{self.clarity:.1f}%",
            'abnt': f"{self.abnt:.1f}%"
        }
    
    @classmethod
    def from_preset(cls, preset: AnalysisPreset) -> "AnalysisWeights":
        """
        Cria pesos a partir de um preset predefinido.
        
        Args:
            preset: Preset de análise escolhido
            
        Returns:
            Instância de AnalysisWeights com pesos do preset
        """
        preset_configs = {
            AnalysisPreset.RIGOROUS: cls(
                structural=20.0,
                legal=50.0,
                clarity=20.0,
                abnt=10.0
            ),
            AnalysisPreset.STANDARD: cls(
                structural=25.0,
                legal=25.0,
                clarity=25.0,
                abnt=25.0
            ),
            AnalysisPreset.FLEXIBLE: cls(
                structural=30.0,
                legal=30.0,
                clarity=30.0,
                abnt=10.0
            ),
            AnalysisPreset.TECHNICAL: cls(
                structural=35.0,
                legal=20.0,
                clarity=15.0,
                abnt=30.0
            )
        }
        
        if preset == AnalysisPreset.CUSTOM:
            # Para custom, retorna balanceado como base
            return preset_configs[AnalysisPreset.STANDARD]
            
        return preset_configs[preset]


class CustomRule(BaseModel):
    """
    Regra personalizada de análise definida pela organização.
    
    Permite que organizações definam regras específicas para seus
    tipos de documento e necessidades particulares.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único da regra"
    )
    name: StrictStr = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Nome descritivo da regra"
    )
    description: StrictStr = Field(
        ...,
        max_length=1000,
        description="Descrição detalhada do que a regra verifica"
    )
    pattern: StrictStr = Field(
        ...,
        min_length=1,
        description="Padrão regex ou texto para busca"
    )
    pattern_type: str = Field(
        default="regex",
        pattern=r"^(regex|keyword|phrase|template)$",
        description="Tipo de padrão: regex, keyword, phrase, template"
    )
    severity: str = Field(
        ...,
        pattern=r"^(baixa|media|alta|critica)$",
        description="Severidade do problema quando detectado"
    )
    category: str = Field(
        ...,
        pattern=r"^(estrutural|juridico|clareza|abnt|orcamentario|formal)$",
        description="Categoria de análise onde a regra se aplica"
    )
    message: StrictStr = Field(
        ...,
        max_length=500,
        description="Mensagem de erro quando regra é violada"
    )
    suggestion: StrictStr = Field(
        ...,
        max_length=500,
        description="Sugestão de correção para o problema"
    )
    applies_to_document_types: List[DocumentType] = Field(
        default_factory=list,
        description="Tipos de documento aos quais a regra se aplica"
    )
    is_active: bool = Field(
        default=True,
        description="Indica se a regra está ativa"
    )
    created_by: Optional[str] = Field(
        None,
        description="ID do usuário que criou a regra"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data de criação da regra"
    )
    last_modified: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data da última modificação"
    )
    usage_count: int = Field(
        default=0,
        ge=0,
        description="Número de vezes que a regra foi aplicada"
    )
    effectiveness_score: Optional[confloat(ge=0.0, le=1.0)] = Field(
        None,
        description="Score de efetividade da regra baseado em feedback"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_pattern(self):
        """Valida o padrão dependendo do tipo."""
        pattern_type = self.pattern_type if self.pattern_type else 'regex'

        if pattern_type == 'regex':
            import re
            try:
                re.compile(self.pattern)
            except re.error as e:
                raise ValueError(f"Padrão regex inválido: {e}")
        elif pattern_type == 'keyword':
            if not self.pattern.strip():
                raise ValueError("Keyword não pode estar vazia")

        return self
    
    def test_pattern_match(self, text: str) -> bool:
        """
        Testa se o padrão encontra correspondência no texto.
        
        Args:
            text: Texto para testar
            
        Returns:
            True se encontrou correspondência
        """
        import re
        
        if self.pattern_type == 'regex':
            return bool(re.search(self.pattern, text, re.IGNORECASE | re.MULTILINE))
        elif self.pattern_type == 'keyword':
            return self.pattern.lower() in text.lower()
        elif self.pattern_type == 'phrase':
            return self.pattern.lower() in text.lower()
        else:
            return False
    
    def increment_usage(self):
        """Incrementa contador de uso da regra."""
        self.usage_count += 1
        self.last_modified = datetime.utcnow()
    
    def update_effectiveness(self, feedback_score: float):
        """
        Atualiza score de efetividade baseado em feedback.
        
        Args:
            feedback_score: Score de 0.0 a 1.0
        """
        if self.effectiveness_score is None:
            self.effectiveness_score = feedback_score
        else:
            # Média ponderada: 70% score atual + 30% novo feedback
            self.effectiveness_score = (
                self.effectiveness_score * 0.7 + feedback_score * 0.3
            )
        self.last_modified = datetime.utcnow()


class TemplateSection(BaseModel):
    """
    Seção de um template organizacional.
    
    Define uma seção obrigatória ou opcional que deve aparecer
    em documentos de determinado tipo.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único da seção"
    )
    name: StrictStr = Field(
        ...,
        max_length=200,
        description="Nome da seção"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição da seção"
    )
    is_required: bool = Field(
        default=True,
        description="Indica se a seção é obrigatória"
    )
    expected_position: Optional[int] = Field(
        None,
        ge=1,
        description="Posição esperada da seção no documento"
    )
    minimum_word_count: Optional[PositiveInt] = Field(
        None,
        description="Contagem mínima de palavras esperada"
    )
    keywords: List[str] = Field(
        default_factory=list,
        description="Palavras-chave que devem aparecer na seção"
    )
    subsections: List[str] = Field(
        default_factory=list,
        description="Subseções que devem estar presentes"
    )
    validation_rules: List[str] = Field(
        default_factory=list,
        description="IDs de regras específicas para esta seção"
    )


class OrganizationTemplate(BaseModel):
    """
    Template organizacional para tipos específicos de documento.
    
    Define a estrutura esperada, seções obrigatórias e regras
    específicas para documentos de determinado tipo.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único do template"
    )
    name: StrictStr = Field(
        ...,
        max_length=200,
        description="Nome do template"
    )
    description: Optional[str] = Field(
        None,
        max_length=1000,
        description="Descrição do template"
    )
    document_type: DocumentType = Field(
        ...,
        description="Tipo de documento ao qual o template se aplica"
    )
    version: str = Field(
        default="1.0.0",
        description="Versão do template"
    )
    sections: List[TemplateSection] = Field(
        default_factory=list,
        description="Seções definidas no template"
    )
    required_fields: List[str] = Field(
        default_factory=list,
        description="Campos obrigatórios que devem estar presentes"
    )
    validation_rules: List[str] = Field(
        default_factory=list,
        description="IDs de regras de validação específicas do template"
    )
    is_active: bool = Field(
        default=True,
        description="Indica se o template está ativo"
    )
    created_by: Optional[str] = Field(
        None,
        description="ID do usuário que criou o template"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data de criação"
    )
    last_modified: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data da última modificação"
    )
    usage_count: int = Field(
        default=0,
        ge=0,
        description="Número de vezes que o template foi usado"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    def get_required_sections(self) -> List[TemplateSection]:
        """Retorna apenas seções obrigatórias."""
        return [section for section in self.sections if section.is_required]
    
    def get_optional_sections(self) -> List[TemplateSection]:
        """Retorna apenas seções opcionais."""
        return [section for section in self.sections if not section.is_required]
    
    def validate_document_structure(self, document_content: str) -> Dict[str, Any]:
        """
        Valida se um documento segue a estrutura do template.
        
        Args:
            document_content: Conteúdo do documento
            
        Returns:
            Dict com resultado da validação
        """
        validation_result = {
            'is_valid': True,
            'missing_required_sections': [],
            'missing_optional_sections': [],
            'section_analysis': {}
        }
        
        content_lower = document_content.lower()
        
        for section in self.sections:
            section_found = any(
                keyword.lower() in content_lower 
                for keyword in section.keywords
            )
            
            validation_result['section_analysis'][section.name] = {
                'found': section_found,
                'required': section.is_required,
                'keywords_matched': [
                    kw for kw in section.keywords 
                    if kw.lower() in content_lower
                ]
            }
            
            if not section_found:
                if section.is_required:
                    validation_result['missing_required_sections'].append(section.name)
                    validation_result['is_valid'] = False
                else:
                    validation_result['missing_optional_sections'].append(section.name)
        
        return validation_result


class OrganizationConfig(BaseModel):
    """
    🚀 CORE DIFERENCIAL - Configuração Organizacional Completa
    
    Este é o coração do sistema de parâmetros personalizados do LicitaReview.
    Cada organização possui uma configuração única que define como
    suas análises devem ser realizadas.
    
    DIFERENCIAL COMPETITIVO: Permite personalização total dos critérios
    de análise para cada tipo de organização.
    """
    id: str = Field(
        default_factory=lambda: str(uuid4()),
        description="Identificador único da configuração"
    )
    organization_id: StrictStr = Field(
        ...,
        description="Identificador da organização proprietária"
    )
    organization_name: Optional[str] = Field(
        None,
        max_length=200,
        description="Nome da organização"
    )
    weights: AnalysisWeights = Field(
        ...,
        description="🚨 CORE: Pesos personalizados para análise"
    )
    preset_type: AnalysisPreset = Field(
        default=AnalysisPreset.STANDARD,
        description="Tipo de preset aplicado"
    )
    custom_rules: List[CustomRule] = Field(
        default_factory=list,
        description="Regras personalizadas da organização"
    )
    templates: List[OrganizationTemplate] = Field(
        default_factory=list,
        description="Templates organizacionais"
    )
    analysis_preferences: Dict[str, Any] = Field(
        default_factory=dict,
        description="Preferências específicas de análise"
    )
    compliance_requirements: List[str] = Field(
        default_factory=list,
        description="Requisitos específicos de compliance"
    )
    excluded_categories: List[str] = Field(
        default_factory=list,
        description="Categorias de análise a serem ignoradas"
    )
    minimum_score_thresholds: Dict[str, float] = Field(
        default_factory=dict,
        description="Scores mínimos por categoria"
    )
    auto_approval_threshold: Optional[confloat(ge=0.0, le=100.0)] = Field(
        None,
        description="Score para aprovação automática"
    )
    notification_settings: Dict[str, Any] = Field(
        default_factory=dict,
        description="Configurações de notificação"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data de criação da configuração"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Data da última atualização"
    )
    created_by: Optional[str] = Field(
        None,
        description="ID do usuário que criou a configuração"
    )
    last_modified_by: Optional[str] = Field(
        None,
        description="ID do usuário que fez a última modificação"
    )
    version: int = Field(
        default=1,
        ge=1,
        description="Versão da configuração"
    )
    is_active: bool = Field(
        default=True,
        description="Indica se a configuração está ativa"
    )
    
    model_config = ConfigDict(use_enum_values=True, validate_assignment=True)
    
    @model_validator(mode='after')
    def validate_preset_consistency(self):
        """Valida consistência entre preset_type e weights."""
        preset_type = values.get('preset_type')
        weights = values.get('weights')
        
        if preset_type and weights and preset_type != AnalysisPreset.CUSTOM:
            # Verifica se os pesos correspondem ao preset
            expected_weights = AnalysisWeights.from_preset(preset_type)
            current_weights_dict = weights.dict()
            expected_weights_dict = expected_weights.dict()
            
            # Permite pequenas diferenças (±1%)
            for category in current_weights_dict:
                diff = abs(
                    current_weights_dict[category] - expected_weights_dict[category]
                )
                if diff > 1.0:
                    # Automaticamente marca como custom se há diferenças significativas
                    values['preset_type'] = AnalysisPreset.CUSTOM
                    break
        
        return values
    
    @model_validator(mode='after')
    def validate_updated_at(self):
        """Garante que updated_at seja posterior ou igual a created_at."""
        if self.updated_at and self.created_at and self.updated_at < self.created_at:
            raise ValueError('updated_at deve ser posterior ou igual a created_at')
        return self
    
    def get_config_hash(self) -> str:
        """
        Gera hash único da configuração para cache e versionamento.
        
        Returns:
            Hash SHA-256 da configuração relevante
        """
        import hashlib
        import json
        
        # Componentes relevantes para o hash
        config_data = {
            'weights': self.weights.dict(),
            'custom_rules': [
                {
                    'id': rule.id,
                    'pattern': rule.pattern,
                    'severity': rule.severity,
                    'category': rule.category,
                    'is_active': rule.is_active
                }
                for rule in self.custom_rules if rule.is_active
            ],
            'templates': [
                {
                    'id': template.id,
                    'document_type': template.document_type.value,
                    'version': template.version
                }
                for template in self.templates if template.is_active
            ],
            'excluded_categories': sorted(self.excluded_categories),
            'version': self.version
        }
        
        config_string = json.dumps(config_data, sort_keys=True)
        return hashlib.sha256(config_string.encode()).hexdigest()
    
    def apply_preset(self, preset: AnalysisPreset) -> None:
        """
        Aplica um preset de configuração.
        
        Args:
            preset: Preset a ser aplicado
        """
        if preset != AnalysisPreset.CUSTOM:
            self.weights = AnalysisWeights.from_preset(preset)
        
        self.preset_type = preset
        self.updated_at = datetime.utcnow()
        
        # Incrementa versão quando preset é alterado
        self.version += 1
    
    def update_weights(self, new_weights: AnalysisWeights, updated_by: Optional[str] = None) -> None:
        """
        🚨 MÉTODO CRÍTICO - Atualiza pesos de análise.
        
        Args:
            new_weights: Novos pesos a serem aplicados
            updated_by: ID do usuário que fez a atualização
        """
        self.weights = new_weights
        self.preset_type = AnalysisPreset.CUSTOM  # Marca como custom
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        if updated_by:
            self.last_modified_by = updated_by
    
    def add_custom_rule(self, rule: CustomRule) -> None:
        """Adiciona nova regra personalizada."""
        # Verifica se já existe regra com mesmo nome
        existing_names = [r.name for r in self.custom_rules]
        if rule.name in existing_names:
            raise ValueError(f"Já existe regra com o nome '{rule.name}'")
        
        self.custom_rules.append(rule)
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def remove_custom_rule(self, rule_id: str) -> bool:
        """
        Remove regra personalizada.
        
        Args:
            rule_id: ID da regra a ser removida
            
        Returns:
            True se removida com sucesso
        """
        initial_count = len(self.custom_rules)
        self.custom_rules = [r for r in self.custom_rules if r.id != rule_id]
        
        if len(self.custom_rules) < initial_count:
            self.updated_at = datetime.utcnow()
            self.version += 1
            return True
        
        return False
    
    def get_active_rules(self) -> List[CustomRule]:
        """Retorna apenas regras ativas."""
        return [rule for rule in self.custom_rules if rule.is_active]
    
    def get_rules_by_category(self, category: str) -> List[CustomRule]:
        """Retorna regras de uma categoria específica."""
        return [
            rule for rule in self.custom_rules 
            if rule.category == category and rule.is_active
        ]
    
    def get_analysis_summary(self) -> Dict[str, Any]:
        """
        Retorna sumário da configuração para análise.
        
        Returns:
            Dict com informações resumidas da configuração
        """
        return {
            'organization_id': self.organization_id,
            'organization_name': self.organization_name,
            'preset_type': self.preset_type.value,
            'weights': self.weights.to_percentage_dict(),
            'weight_distribution': self.weights.get_weight_distribution_type(),
            'dominant_category': self.weights.get_dominant_category(),
            'total_custom_rules': len(self.get_active_rules()),
            'rules_by_category': {
                category: len(self.get_rules_by_category(category))
                for category in ['estrutural', 'juridico', 'clareza', 'abnt']
            },
            'total_templates': len([t for t in self.templates if t.is_active]),
            'auto_approval_threshold': self.auto_approval_threshold,
            'version': self.version,
            'last_updated': self.updated_at.isoformat(),
            'config_hash': self.get_config_hash()[:8]  # Primeiros 8 chars
        }
    
    def to_processing_dict(self) -> Dict[str, Any]:
        """
        Converte configuração para dicionário otimizado para processamento.
        
        Returns:
            Dict com dados necessários para análise
        """
        return {
            'organization_id': self.organization_id,
            'weights': self.weights.dict(),
            'active_rules': [rule.dict() for rule in self.get_active_rules()],
            'active_templates': [
                template.dict() for template in self.templates 
                if template.is_active
            ],
            'excluded_categories': self.excluded_categories,
            'minimum_thresholds': self.minimum_score_thresholds,
            'analysis_preferences': self.analysis_preferences,
            'config_version': self.version,
            'config_hash': self.get_config_hash()
        }
    
    @classmethod
    def create_default_config(
        cls,
        organization_id: str,
        organization_name: str,
        preset: AnalysisPreset = AnalysisPreset.STANDARD,
        created_by: Optional[str] = None
    ) -> "OrganizationConfig":
        """
        Cria configuração padrão para nova organização.
        
        Args:
            organization_id: ID da organização
            organization_name: Nome da organização
            preset: Preset inicial a aplicar
            created_by: ID do usuário criador
            
        Returns:
            Nova configuração organizacional
        """
        weights = AnalysisWeights.from_preset(preset)
        
        return cls(
            organization_id=organization_id,
            organization_name=organization_name,
            weights=weights,
            preset_type=preset,
            created_by=created_by
        )