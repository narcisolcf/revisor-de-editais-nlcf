"""
User Feedback Loop API

Sistema completo de coleta e análise de feedback do usuário
para melhoria contínua dos modelos AI/ML.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


# ============================================================================
# Enums
# ============================================================================

class FeedbackType(str, Enum):
    """Tipos de feedback."""
    THUMBS = "thumbs"              # 👍 👎
    RATING = "rating"              # ⭐ 1-5
    DETAILED = "detailed"          # Comentário detalhado
    CORRECTION = "correction"      # Correção de resultado
    FEATURE_REQUEST = "feature"    # Solicitação de feature


class FeedbackCategory(str, Enum):
    """Categorias de feedback."""
    ACCURACY = "accuracy"          # Precisão da análise
    COMPLETENESS = "completeness"  # Completude
    RELEVANCE = "relevance"        # Relevância
    CLARITY = "clarity"            # Clareza
    PERFORMANCE = "performance"    # Performance
    UX = "user_experience"         # Experiência do usuário
    OTHER = "other"                # Outro


class SentimentType(str, Enum):
    """Sentimento do feedback."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


# ============================================================================
# Pydantic Models
# ============================================================================

class FeedbackCreate(BaseModel):
    """Request para criar feedback."""
    # Context
    document_id: str = Field(..., description="ID do documento analisado")
    analysis_id: Optional[str] = Field(None, description="ID da análise específica")
    experiment_id: Optional[str] = Field(None, description="ID do experimento A/B")

    # Feedback type
    feedback_type: FeedbackType
    category: FeedbackCategory = FeedbackCategory.OTHER

    # Feedback data
    is_positive: Optional[bool] = Field(None, description="Thumbs up/down")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating 1-5 estrelas")
    comment: Optional[str] = Field(None, max_length=2000)
    correction: Optional[str] = Field(None, description="Correção sugerida")

    # Metadata
    user_id: Optional[str] = None
    session_id: Optional[str] = None


class FeedbackUpdate(BaseModel):
    """Request para atualizar feedback."""
    comment: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    category: Optional[FeedbackCategory] = None


class FeedbackResponse(BaseModel):
    """Response com feedback."""
    feedback_id: str
    document_id: str
    feedback_type: str
    category: str
    is_positive: Optional[bool]
    rating: Optional[int]
    comment: Optional[str]
    sentiment: str
    created_at: str
    experiment_id: Optional[str] = None


class FeedbackSummaryResponse(BaseModel):
    """Response com sumário de feedbacks."""
    total_feedbacks: int
    positive_count: int
    negative_count: int
    neutral_count: int
    avg_rating: float
    by_category: Dict[str, int]
    by_type: Dict[str, int]


class FeedbackInsightsResponse(BaseModel):
    """Response com insights de feedback."""
    top_issues: List[Dict[str, Any]]
    improvement_suggestions: List[str]
    sentiment_trend: str
    critical_feedback_count: int


# ============================================================================
# Storage
# ============================================================================

class FeedbackStore:
    """
    Armazenamento de feedbacks.

    Em produção, usar Firestore ou PostgreSQL.
    """

    def __init__(self):
        self.feedbacks: Dict[str, Dict[str, Any]] = {}
        self._id_counter = 0

    def create(self, feedback_data: Dict[str, Any]) -> str:
        """Cria novo feedback."""
        self._id_counter += 1
        feedback_id = f"feedback-{self._id_counter:06d}"

        feedback = {
            'feedback_id': feedback_id,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            **feedback_data
        }

        # Detectar sentimento
        feedback['sentiment'] = self._detect_sentiment(feedback)

        self.feedbacks[feedback_id] = feedback
        return feedback_id

    def get(self, feedback_id: str) -> Optional[Dict[str, Any]]:
        """Retorna feedback por ID."""
        return self.feedbacks.get(feedback_id)

    def update(self, feedback_id: str, updates: Dict[str, Any]) -> bool:
        """Atualiza feedback."""
        if feedback_id not in self.feedbacks:
            return False

        self.feedbacks[feedback_id].update(updates)
        self.feedbacks[feedback_id]['updated_at'] = datetime.utcnow().isoformat()
        return True

    def delete(self, feedback_id: str) -> bool:
        """Remove feedback."""
        if feedback_id not in self.feedbacks:
            return False

        del self.feedbacks[feedback_id]
        return True

    def list_by_document(self, document_id: str) -> List[Dict[str, Any]]:
        """Lista feedbacks de um documento."""
        return [
            fb for fb in self.feedbacks.values()
            if fb.get('document_id') == document_id
        ]

    def list_by_experiment(self, experiment_id: str) -> List[Dict[str, Any]]:
        """Lista feedbacks de um experimento."""
        return [
            fb for fb in self.feedbacks.values()
            if fb.get('experiment_id') == experiment_id
        ]

    def list_recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Lista feedbacks recentes."""
        sorted_feedbacks = sorted(
            self.feedbacks.values(),
            key=lambda x: x['created_at'],
            reverse=True
        )
        return sorted_feedbacks[:limit]

    def _detect_sentiment(self, feedback: Dict[str, Any]) -> str:
        """Detecta sentimento do feedback."""
        # Lógica simples baseada em is_positive e rating
        if feedback.get('is_positive') is not None:
            return SentimentType.POSITIVE if feedback['is_positive'] else SentimentType.NEGATIVE

        rating = feedback.get('rating')
        if rating is not None:
            if rating >= 4:
                return SentimentType.POSITIVE
            elif rating <= 2:
                return SentimentType.NEGATIVE
            else:
                return SentimentType.NEUTRAL

        # Análise de texto (simplificado)
        comment = feedback.get('comment', '').lower()
        if any(word in comment for word in ['ótimo', 'excelente', 'perfeito', 'bom']):
            return SentimentType.POSITIVE
        elif any(word in comment for word in ['ruim', 'erro', 'problema', 'incorreto']):
            return SentimentType.NEGATIVE
        else:
            return SentimentType.NEUTRAL


# Global feedback store
feedback_store = FeedbackStore()


# ============================================================================
# Endpoints
# ============================================================================

@router.post("/", response_model=FeedbackResponse, status_code=201)
async def create_feedback(feedback: FeedbackCreate):
    """
    Cria novo feedback.

    Args:
        feedback: Dados do feedback

    Returns:
        Feedback criado
    """
    try:
        feedback_data = feedback.dict(exclude_none=True)
        feedback_id = feedback_store.create(feedback_data)

        created_feedback = feedback_store.get(feedback_id)

        # Registrar no analytics
        from .analytics import metrics_store
        metrics_store.record_feedback(
            document_id=feedback.document_id,
            is_positive=feedback.is_positive or False,
            rating=float(feedback.rating) if feedback.rating else None,
            experiment_id=feedback.experiment_id,
        )

        # Registrar no A/B testing se aplicável
        if feedback.experiment_id:
            from .experiments import ab_test_manager
            ab_test_manager.record_feedback(
                experiment_id=feedback.experiment_id,
                is_positive=feedback.is_positive or False,
                rating=float(feedback.rating) if feedback.rating else None,
            )

        logger.info(f"Created feedback {feedback_id} for document {feedback.document_id}")

        return FeedbackResponse(
            feedback_id=created_feedback['feedback_id'],
            document_id=created_feedback['document_id'],
            feedback_type=created_feedback['feedback_type'],
            category=created_feedback['category'],
            is_positive=created_feedback.get('is_positive'),
            rating=created_feedback.get('rating'),
            comment=created_feedback.get('comment'),
            sentiment=created_feedback['sentiment'],
            created_at=created_feedback['created_at'],
            experiment_id=created_feedback.get('experiment_id'),
        )

    except Exception as e:
        logger.error(f"Failed to create feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback(feedback_id: str):
    """
    Obtém feedback por ID.

    Args:
        feedback_id: ID do feedback

    Returns:
        Dados do feedback

    Raises:
        404: Se feedback não existe
    """
    feedback = feedback_store.get(feedback_id)

    if not feedback:
        raise HTTPException(
            status_code=404,
            detail=f"Feedback {feedback_id} not found"
        )

    return FeedbackResponse(
        feedback_id=feedback['feedback_id'],
        document_id=feedback['document_id'],
        feedback_type=feedback['feedback_type'],
        category=feedback['category'],
        is_positive=feedback.get('is_positive'),
        rating=feedback.get('rating'),
        comment=feedback.get('comment'),
        sentiment=feedback['sentiment'],
        created_at=feedback['created_at'],
        experiment_id=feedback.get('experiment_id'),
    )


@router.get("/document/{document_id}", response_model=List[FeedbackResponse])
async def get_document_feedbacks(document_id: str):
    """
    Lista feedbacks de um documento.

    Args:
        document_id: ID do documento

    Returns:
        Lista de feedbacks
    """
    feedbacks = feedback_store.list_by_document(document_id)

    return [
        FeedbackResponse(
            feedback_id=fb['feedback_id'],
            document_id=fb['document_id'],
            feedback_type=fb['feedback_type'],
            category=fb['category'],
            is_positive=fb.get('is_positive'),
            rating=fb.get('rating'),
            comment=fb.get('comment'),
            sentiment=fb['sentiment'],
            created_at=fb['created_at'],
            experiment_id=fb.get('experiment_id'),
        )
        for fb in feedbacks
    ]


@router.patch("/{feedback_id}", response_model=FeedbackResponse)
async def update_feedback(feedback_id: str, update: FeedbackUpdate):
    """
    Atualiza feedback.

    Args:
        feedback_id: ID do feedback
        update: Campos a atualizar

    Returns:
        Feedback atualizado

    Raises:
        404: Se feedback não existe
    """
    updates = update.dict(exclude_none=True)

    if not feedback_store.update(feedback_id, updates):
        raise HTTPException(
            status_code=404,
            detail=f"Feedback {feedback_id} not found"
        )

    feedback = feedback_store.get(feedback_id)

    return FeedbackResponse(
        feedback_id=feedback['feedback_id'],
        document_id=feedback['document_id'],
        feedback_type=feedback['feedback_type'],
        category=feedback['category'],
        is_positive=feedback.get('is_positive'),
        rating=feedback.get('rating'),
        comment=feedback.get('comment'),
        sentiment=feedback['sentiment'],
        created_at=feedback['created_at'],
        experiment_id=feedback.get('experiment_id'),
    )


@router.delete("/{feedback_id}", status_code=204)
async def delete_feedback(feedback_id: str):
    """
    Remove feedback.

    Args:
        feedback_id: ID do feedback

    Raises:
        404: Se feedback não existe
    """
    if not feedback_store.delete(feedback_id):
        raise HTTPException(
            status_code=404,
            detail=f"Feedback {feedback_id} not found"
        )


@router.get("/summary/stats", response_model=FeedbackSummaryResponse)
async def get_feedback_summary(
    document_id: Optional[str] = Query(None),
    experiment_id: Optional[str] = Query(None),
    limit: int = Query(1000, le=10000)
):
    """
    Retorna sumário estatístico de feedbacks.

    Args:
        document_id: Filtrar por documento
        experiment_id: Filtrar por experimento
        limit: Limite de feedbacks a analisar

    Returns:
        Sumário com estatísticas
    """
    # Filtrar feedbacks
    if document_id:
        feedbacks = feedback_store.list_by_document(document_id)
    elif experiment_id:
        feedbacks = feedback_store.list_by_experiment(experiment_id)
    else:
        feedbacks = feedback_store.list_recent(limit=limit)

    if not feedbacks:
        return FeedbackSummaryResponse(
            total_feedbacks=0,
            positive_count=0,
            negative_count=0,
            neutral_count=0,
            avg_rating=0.0,
            by_category={},
            by_type={},
        )

    # Calcular estatísticas
    sentiments = [fb['sentiment'] for fb in feedbacks]
    positive_count = sentiments.count(SentimentType.POSITIVE)
    negative_count = sentiments.count(SentimentType.NEGATIVE)
    neutral_count = sentiments.count(SentimentType.NEUTRAL)

    ratings = [fb['rating'] for fb in feedbacks if fb.get('rating')]
    avg_rating = sum(ratings) / len(ratings) if ratings else 0.0

    # Por categoria
    by_category = {}
    for fb in feedbacks:
        category = fb.get('category', 'other')
        by_category[category] = by_category.get(category, 0) + 1

    # Por tipo
    by_type = {}
    for fb in feedbacks:
        fb_type = fb.get('feedback_type', 'other')
        by_type[fb_type] = by_type.get(fb_type, 0) + 1

    return FeedbackSummaryResponse(
        total_feedbacks=len(feedbacks),
        positive_count=positive_count,
        negative_count=negative_count,
        neutral_count=neutral_count,
        avg_rating=avg_rating,
        by_category=by_category,
        by_type=by_type,
    )


@router.get("/insights/analyze", response_model=FeedbackInsightsResponse)
async def get_feedback_insights(
    limit: int = Query(500, le=5000)
):
    """
    Analisa feedbacks e extrai insights.

    Args:
        limit: Limite de feedbacks a analisar

    Returns:
        Insights e recomendações
    """
    feedbacks = feedback_store.list_recent(limit=limit)

    if not feedbacks:
        return FeedbackInsightsResponse(
            top_issues=[],
            improvement_suggestions=[],
            sentiment_trend="neutral",
            critical_feedback_count=0,
        )

    # Identificar principais problemas
    top_issues = []
    category_negatives = {}

    for fb in feedbacks:
        if fb['sentiment'] == SentimentType.NEGATIVE:
            category = fb.get('category', 'other')
            if category not in category_negatives:
                category_negatives[category] = []
            category_negatives[category].append(fb.get('comment', ''))

    for category, comments in category_negatives.items():
        top_issues.append({
            'category': category,
            'count': len(comments),
            'examples': comments[:2],
        })

    top_issues.sort(key=lambda x: x['count'], reverse=True)

    # Sugestões de melhoria (baseado em feedback positivo)
    improvement_suggestions = []
    for fb in feedbacks:
        if fb['sentiment'] == SentimentType.POSITIVE and fb.get('comment'):
            comment = fb['comment']
            # Extrair sugestões (simplificado)
            if 'sugestão' in comment.lower() or 'poderia' in comment.lower():
                improvement_suggestions.append(comment)

    # Tendência de sentimento (últimos 100 vs 100 anteriores)
    recent = feedbacks[:100]
    previous = feedbacks[100:200] if len(feedbacks) > 100 else []

    recent_positive_rate = sum(1 for fb in recent if fb['sentiment'] == SentimentType.POSITIVE) / len(recent) if recent else 0
    previous_positive_rate = sum(1 for fb in previous if fb['sentiment'] == SentimentType.POSITIVE) / len(previous) if previous else 0

    if recent_positive_rate > previous_positive_rate + 0.1:
        sentiment_trend = "improving"
    elif recent_positive_rate < previous_positive_rate - 0.1:
        sentiment_trend = "declining"
    else:
        sentiment_trend = "stable"

    # Feedback crítico (rating 1 ou muito negativo)
    critical_feedback_count = sum(
        1 for fb in feedbacks
        if fb.get('rating') == 1 or (
            fb['sentiment'] == SentimentType.NEGATIVE and
            fb.get('comment') and
            len(fb['comment']) > 50
        )
    )

    return FeedbackInsightsResponse(
        top_issues=top_issues[:5],
        improvement_suggestions=improvement_suggestions[:5],
        sentiment_trend=sentiment_trend,
        critical_feedback_count=critical_feedback_count,
    )
