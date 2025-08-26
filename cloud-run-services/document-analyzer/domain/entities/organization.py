"""
Organization Entity - Refatorada

Entidade representando organizações e suas configurações
de análise personalizadas.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
import hashlib
import json


class OrganizationType(str, Enum):
    """Tipos de organização."""
    FEDERAL = "federal"
    ESTADUAL = "estadual"
    MUNICIPAL = "municipal"
    TRIBUNAL_CONTAS = "tribunal_contas"
    MINISTERIO_PUBLICO = "ministerio_publico"
    PODER_JUDICIARIO = "poder_judiciario"
    EMPRESA_PUBLICA = "empresa_publica"
    FUNDACAO = "fundacao"
    AUTARQUIA = "autarquia"
    OUTRO = "outro"


class AnalysisPreset(str, Enum):
    """Presets de configuração de análise."""
    RIGOROUS = "rigorous"
    STANDARD = "standard"
    FLEXIBLE = "flexible"
    TECHNICAL = "technical"
    CUSTOM = "custom"


@dataclass(frozen=True)
class OrganizationId:
    """Value Object para ID de organização."""
    value: str

    def __post_init__(self):
        if not self.value or len(self.value) < 3:
            raise ValueError("Organization ID deve ter pelo menos 3 caracteres")
        
        # Valida formato (letras, números, hífen, underscore)
        import re
        if not re.match(r'^[a-zA-Z0-9_-]+$', self.value):
            raise ValueError("Organization ID deve conter apenas letras, números, hífen e underscore")

    def __str__(self) -> str:
        return self.value


@dataclass(frozen=True)
class AnalysisWeights:
    """Value Object para pesos de análise."""
    structural: float
    legal: float
    clarity: float
    abnt: float

    def __post_init__(self):
        # Validações
        weights = [self.structural, self.legal, self.clarity, self.abnt]
        
        if any(w < 0 or w > 100 for w in weights):
            raise ValueError("Todos os pesos devem estar entre 0 e 100")
        
        total = sum(weights)
        if abs(total - 100.0) > 0.01:
            raise ValueError(f"Soma dos pesos deve ser 100%, atual: {total:.2f}%")

    def get_dominant_category(self) -> str:
        """Identifica categoria com maior peso."""
        weights_dict = {
            'structural': self.structural,
            'legal': self.legal,
            'clarity': self.clarity,
            'abnt': self.abnt
        }
        return max(weights_dict.items(), key=lambda x: x[1])[0]

    def get_distribution_type(self) -> str:
        """Classifica tipo de distribuição dos pesos."""
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

    def to_dict(self) -> Dict[str, float]:
        """Converte para dicionário."""
        return {
            'structural': self.structural,
            'legal': self.legal,
            'clarity': self.clarity,
            'abnt': self.abnt
        }

    @classmethod
    def create_balanced(cls) -> 'AnalysisWeights':
        """Cria pesos equilibrados."""
        return cls(structural=25.0, legal=25.0, clarity=25.0, abnt=25.0)

    @classmethod
    def create_rigorous(cls) -> 'AnalysisWeights':
        """Cria pesos rigorosos (foco jurídico)."""
        return cls(structural=30.0, legal=50.0, clarity=15.0, abnt=5.0)

    @classmethod
    def create_technical(cls) -> 'AnalysisWeights':
        """Cria pesos técnicos (foco estrutural e ABNT)."""
        return cls(structural=40.0, legal=20.0, clarity=10.0, abnt=30.0)

    @classmethod
    def create_flexible(cls) -> 'AnalysisWeights':
        """Cria pesos flexíveis."""
        return cls(structural=30.0, legal=30.0, clarity=30.0, abnt=10.0)


@dataclass
class CustomRule:
    """Regra personalizada de análise."""
    id: str
    name: str
    description: str
    pattern: str
    pattern_type: str
    severity: str
    category: str
    message: str
    suggestion: str
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    usage_count: int = 0
    effectiveness_score: Optional[float] = None

    def __post_init__(self):
        """Validações pós-inicialização."""
        self._validate()

    def _validate(self) -> None:
        """Valida invariantes da regra."""
        if not self.name.strip():
            raise ValueError("Nome da regra não pode estar vazio")
        
        if not self.pattern.strip():
            raise ValueError("Padrão da regra não pode estar vazio")
        
        valid_severities = ["baixa", "media", "alta", "critica"]
        if self.severity not in valid_severities:
            raise ValueError(f"Severidade deve ser uma de: {valid_severities}")
        
        valid_categories = ["estrutural", "juridico", "clareza", "abnt"]
        if self.category not in valid_categories:
            raise ValueError(f"Categoria deve ser uma de: {valid_categories}")
        
        valid_pattern_types = ["regex", "keyword", "phrase", "template"]
        if self.pattern_type not in valid_pattern_types:
            raise ValueError(f"Tipo de padrão deve ser um de: {valid_pattern_types}")

    def test_pattern(self, text: str) -> bool:
        """
        Testa se o padrão encontra correspondência no texto.
        
        Args:
            text: Texto para testar
            
        Returns:
            True se encontrou correspondência
        """
        import re
        
        if self.pattern_type == "regex":
            try:
                return bool(re.search(self.pattern, text, re.IGNORECASE | re.MULTILINE))
            except re.error:
                return False
        elif self.pattern_type in ["keyword", "phrase"]:
            return self.pattern.lower() in text.lower()
        else:
            return False

    def increment_usage(self) -> None:
        """Incrementa contador de uso."""
        self.usage_count += 1

    def update_effectiveness(self, score: float) -> None:
        """
        Atualiza score de efetividade.
        
        Args:
            score: Score de 0.0 a 1.0
        """
        if not 0.0 <= score <= 1.0:
            raise ValueError("Score deve estar entre 0.0 e 1.0")
        
        if self.effectiveness_score is None:
            self.effectiveness_score = score
        else:
            # Média ponderada
            self.effectiveness_score = (self.effectiveness_score * 0.7 + score * 0.3)


@dataclass
class Organization:
    """
    Entidade Organization refatorada.
    
    Representa uma organização com suas configurações
    de análise personalizadas.
    """
    id: OrganizationId
    name: str
    organization_type: OrganizationType
    weights: AnalysisWeights
    preset_type: AnalysisPreset = AnalysisPreset.STANDARD
    custom_rules: List[CustomRule] = field(default_factory=list)
    settings: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    version: int = 1
    is_active: bool = True

    def __post_init__(self):
        """Validações pós-inicialização."""
        self._validate()

    def _validate(self) -> None:
        """Valida invariantes da organização."""
        if not self.name.strip():
            raise ValueError("Nome da organização não pode estar vazio")
        
        if len(self.name) > 200:
            raise ValueError("Nome da organização não pode exceder 200 caracteres")

    def update_weights(self, new_weights: AnalysisWeights) -> None:
        """
        Atualiza pesos de análise.
        
        Args:
            new_weights: Novos pesos a serem aplicados
        """
        self.weights = new_weights
        self.preset_type = AnalysisPreset.CUSTOM
        self.updated_at = datetime.utcnow()
        self.version += 1

    def add_custom_rule(self, rule: CustomRule) -> None:
        """
        Adiciona regra personalizada.
        
        Args:
            rule: Nova regra a ser adicionada
        """
        # Verifica se já existe regra com mesmo nome
        if any(r.name == rule.name for r in self.custom_rules):
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
        """
        Retorna regras de uma categoria específica.
        
        Args:
            category: Categoria das regras
            
        Returns:
            Lista de regras da categoria
        """
        return [
            rule for rule in self.custom_rules
            if rule.category == category and rule.is_active
        ]

    def apply_preset(self, preset: AnalysisPreset) -> None:
        """
        Aplica preset de configuração.
        
        Args:
            preset: Preset a ser aplicado
        """
        preset_weights = {
            AnalysisPreset.RIGOROUS: AnalysisWeights.create_rigorous(),
            AnalysisPreset.STANDARD: AnalysisWeights.create_balanced(),
            AnalysisPreset.FLEXIBLE: AnalysisWeights.create_flexible(),
            AnalysisPreset.TECHNICAL: AnalysisWeights.create_technical(),
        }
        
        if preset != AnalysisPreset.CUSTOM:
            self.weights = preset_weights[preset]
        
        self.preset_type = preset
        self.updated_at = datetime.utcnow()
        self.version += 1

    def deactivate(self) -> None:
        """Desativa organização."""
        self.is_active = False
        self.updated_at = datetime.utcnow()

    def activate(self) -> None:
        """Ativa organização."""
        self.is_active = True
        self.updated_at = datetime.utcnow()

    def get_config_hash(self) -> str:
        """
        Gera hash da configuração para cache.
        
        Returns:
            Hash SHA-256 da configuração
        """
        config_data = {
            'weights': self.weights.to_dict(),
            'active_rules': [
                {
                    'id': rule.id,
                    'pattern': rule.pattern,
                    'severity': rule.severity,
                    'category': rule.category
                }
                for rule in self.get_active_rules()
            ],
            'version': self.version
        }
        
        config_string = json.dumps(config_data, sort_keys=True)
        return hashlib.sha256(config_string.encode()).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        """Converte entidade para dicionário."""
        return {
            'id': str(self.id),
            'name': self.name,
            'organization_type': self.organization_type.value,
            'weights': self.weights.to_dict(),
            'preset_type': self.preset_type.value,
            'custom_rules': [
                {
                    'id': rule.id,
                    'name': rule.name,
                    'description': rule.description,
                    'pattern': rule.pattern,
                    'pattern_type': rule.pattern_type,
                    'severity': rule.severity,
                    'category': rule.category,
                    'message': rule.message,
                    'suggestion': rule.suggestion,
                    'is_active': rule.is_active,
                    'usage_count': rule.usage_count,
                    'effectiveness_score': rule.effectiveness_score
                }
                for rule in self.custom_rules
            ],
            'settings': self.settings,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'version': self.version,
            'is_active': self.is_active,
            'config_hash': self.get_config_hash(),
            'dominant_category': self.weights.get_dominant_category(),
            'weight_distribution': self.weights.get_distribution_type()
        }

    @classmethod
    def create(
        cls,
        organization_id: str,
        name: str,
        organization_type: OrganizationType,
        preset: AnalysisPreset = AnalysisPreset.STANDARD
    ) -> 'Organization':
        """
        Factory method para criar organização.
        
        Args:
            organization_id: ID único da organização
            name: Nome da organização
            organization_type: Tipo da organização
            preset: Preset inicial
            
        Returns:
            Nova instância de Organization
        """
        preset_weights = {
            AnalysisPreset.RIGOROUS: AnalysisWeights.create_rigorous(),
            AnalysisPreset.STANDARD: AnalysisWeights.create_balanced(),
            AnalysisPreset.FLEXIBLE: AnalysisWeights.create_flexible(),
            AnalysisPreset.TECHNICAL: AnalysisWeights.create_technical(),
            AnalysisPreset.CUSTOM: AnalysisWeights.create_balanced()
        }
        
        return cls(
            id=OrganizationId(organization_id),
            name=name.strip(),
            organization_type=organization_type,
            weights=preset_weights[preset],
            preset_type=preset
        )

    def __eq__(self, other) -> bool:
        """Igualdade baseada no ID."""
        if not isinstance(other, Organization):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash baseado no ID."""
        return hash(self.id)

    def __str__(self) -> str:
        """Representação string."""
        return f"Organization(id={self.id}, name='{self.name}', type={self.organization_type.value})"