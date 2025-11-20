#!/usr/bin/env python3
"""
Continuous Learning Service - Aprendizado Contínuo para Classificação de Documentos

Implementa sistema de aprendizado contínuo que:
- Coleta feedback de classificações
- Armazena dados de treinamento no Firestore
- Re-treina modelo periodicamente
- Melhora a precisão ao longo do tempo
"""

import os
import logging
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import Counter

from google.cloud import firestore
from google.cloud import storage
import numpy as np

from services.classification_service import ClassificationService

logger = logging.getLogger(__name__)

@dataclass
class TrainingExample:
    """Exemplo de treinamento coletado."""
    document_id: str
    content: str
    predicted_type: str
    confirmed_type: str
    confidence: float
    feedback_source: str  # 'user', 'auto', 'expert'
    created_at: datetime
    metadata: Dict[str, Any]

@dataclass
class ModelMetrics:
    """Métricas do modelo."""
    accuracy: float
    precision: Dict[str, float]
    recall: Dict[str, float]
    f1_score: Dict[str, float]
    confusion_matrix: Dict[str, Dict[str, int]]
    total_examples: int
    training_date: datetime
    version: str

class ContinuousLearningService:
    """Serviço de aprendizado contínuo."""

    def __init__(self, db: Optional[firestore.Client] = None):
        """
        Inicializar serviço de aprendizado contínuo.

        Args:
            db: Cliente Firestore (opcional)
        """
        self.db = db or firestore.Client()
        self.classifier = ClassificationService()

        # Configurações
        self.min_examples_for_retraining = 100
        self.retraining_interval_days = 7
        self.confidence_threshold_for_auto_feedback = 0.95

        # Collections do Firestore
        self.training_examples_collection = 'ml_training_examples'
        self.model_metrics_collection = 'ml_model_metrics'
        self.feedback_collection = 'ml_feedback'

        logger.info("Continuous Learning Service inicializado")

    def collect_feedback(self, document_id: str, content: str,
                        predicted_type: str, confirmed_type: str,
                        confidence: float, user_id: Optional[str] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Coletar feedback de classificação.

        Args:
            document_id: ID do documento
            content: Conteúdo do documento
            predicted_type: Tipo predito pelo modelo
            confirmed_type: Tipo confirmado (ground truth)
            confidence: Confiança da predição
            user_id: ID do usuário que forneceu feedback
            metadata: Metadados adicionais

        Returns:
            ID do exemplo de treinamento criado
        """
        try:
            # Determinar fonte do feedback
            if user_id:
                feedback_source = 'user'
            elif confidence >= self.confidence_threshold_for_auto_feedback:
                feedback_source = 'auto'
            else:
                feedback_source = 'system'

            # Criar exemplo de treinamento
            example = TrainingExample(
                document_id=document_id,
                content=content[:5000],  # Limitar tamanho
                predicted_type=predicted_type,
                confirmed_type=confirmed_type,
                confidence=confidence,
                feedback_source=feedback_source,
                created_at=datetime.now(),
                metadata=metadata or {}
            )

            # Adicionar informações extras
            example.metadata.update({
                'user_id': user_id,
                'correct_prediction': predicted_type == confirmed_type,
                'content_length': len(content),
                'confidence_bucket': self._get_confidence_bucket(confidence)
            })

            # Salvar no Firestore
            doc_ref = self.db.collection(self.training_examples_collection).document()
            doc_ref.set({
                **asdict(example),
                'created_at': firestore.SERVER_TIMESTAMP
            })

            example_id = doc_ref.id

            logger.info(
                f"Feedback coletado: {document_id} -> {confirmed_type} "
                f"(predito: {predicted_type}, correto: {predicted_type == confirmed_type})"
            )

            # Verificar se deve retreinar
            self._check_and_trigger_retraining()

            return example_id

        except Exception as e:
            logger.error(f"Erro ao coletar feedback: {str(e)}")
            raise

    def get_training_data(self, min_confidence: float = 0.0,
                         feedback_sources: Optional[List[str]] = None,
                         limit: Optional[int] = None) -> List[Tuple[str, str]]:
        """
        Obter dados de treinamento do Firestore.

        Args:
            min_confidence: Confiança mínima para incluir exemplo
            feedback_sources: Fontes de feedback a incluir
            limit: Número máximo de exemplos

        Returns:
            Lista de tuplas (conteúdo, tipo_confirmado)
        """
        try:
            query = self.db.collection(self.training_examples_collection)

            # Aplicar filtros
            if min_confidence > 0:
                query = query.where('confidence', '>=', min_confidence)

            if feedback_sources:
                query = query.where('feedback_source', 'in', feedback_sources)

            # Ordenar por data (mais recentes primeiro)
            query = query.order_by('created_at', direction=firestore.Query.DESCENDING)

            if limit:
                query = query.limit(limit)

            # Buscar dados
            docs = query.stream()

            training_data = []
            for doc in docs:
                data = doc.to_dict()
                if data.get('content') and data.get('confirmed_type'):
                    training_data.append((
                        data['content'],
                        data['confirmed_type']
                    ))

            logger.info(f"Obtidos {len(training_data)} exemplos de treinamento")

            return training_data

        except Exception as e:
            logger.error(f"Erro ao obter dados de treinamento: {str(e)}")
            return []

    def retrain_model(self, min_examples: Optional[int] = None,
                     save_to_cloud: bool = True) -> Optional[Dict[str, Any]]:
        """
        Re-treinar modelo com dados coletados.

        Args:
            min_examples: Número mínimo de exemplos necessários
            save_to_cloud: Se deve salvar modelo no Cloud Storage

        Returns:
            Métricas do novo modelo ou None se falhou
        """
        try:
            min_examples = min_examples or self.min_examples_for_retraining

            # Obter dados de treinamento
            training_data = self.get_training_data(
                min_confidence=0.7,
                feedback_sources=['user', 'expert', 'auto']
            )

            if len(training_data) < min_examples:
                logger.warning(
                    f"Dados insuficientes para re-treinamento: "
                    f"{len(training_data)} < {min_examples}"
                )
                return None

            logger.info(f"Iniciando re-treinamento com {len(training_data)} exemplos")

            # Treinar novo modelo
            start_time = time.time()
            accuracy = self.classifier.train_model(training_data)
            training_time = time.time() - start_time

            # Calcular métricas detalhadas
            metrics = self._calculate_model_metrics(training_data)

            # Salvar métricas no Firestore
            model_version = f"v_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            metrics_doc = {
                'version': model_version,
                'accuracy': accuracy,
                'total_examples': len(training_data),
                'training_time': training_time,
                'metrics': metrics,
                'trained_at': firestore.SERVER_TIMESTAMP,
                'metadata': {
                    'min_confidence': 0.7,
                    'feedback_sources': ['user', 'expert', 'auto'],
                    'classifier_type': 'MultinomialNB'
                }
            }

            self.db.collection(self.model_metrics_collection).add(metrics_doc)

            logger.info(
                f"Modelo re-treinado com sucesso: {model_version} "
                f"(acurácia: {accuracy:.2f}, tempo: {training_time:.1f}s)"
            )

            # Salvar modelo no Cloud Storage (opcional)
            if save_to_cloud:
                self._save_model_to_cloud(model_version)

            return metrics_doc

        except Exception as e:
            logger.error(f"Erro ao re-treinar modelo: {str(e)}")
            return None

    def get_model_performance(self, days: int = 30) -> Dict[str, Any]:
        """
        Obter performance do modelo nos últimos N dias.

        Args:
            days: Número de dias a analisar

        Returns:
            Estatísticas de performance
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days)

            # Buscar feedbacks recentes
            query = self.db.collection(self.training_examples_collection)\
                           .where('created_at', '>=', cutoff_date)\
                           .stream()

            correct = 0
            incorrect = 0
            total = 0
            confidence_sum = 0
            type_performance = {}

            for doc in query:
                data = doc.to_dict()
                total += 1

                is_correct = data.get('predicted_type') == data.get('confirmed_type')
                if is_correct:
                    correct += 1
                else:
                    incorrect += 1

                confidence_sum += data.get('confidence', 0)

                # Performance por tipo
                doc_type = data.get('confirmed_type', 'unknown')
                if doc_type not in type_performance:
                    type_performance[doc_type] = {'correct': 0, 'total': 0}

                type_performance[doc_type]['total'] += 1
                if is_correct:
                    type_performance[doc_type]['correct'] += 1

            # Calcular métricas
            accuracy = correct / total if total > 0 else 0
            avg_confidence = confidence_sum / total if total > 0 else 0

            # Performance por tipo
            type_accuracies = {}
            for doc_type, stats in type_performance.items():
                type_accuracies[doc_type] = stats['correct'] / stats['total'] \
                    if stats['total'] > 0 else 0

            return {
                'period_days': days,
                'total_predictions': total,
                'correct_predictions': correct,
                'incorrect_predictions': incorrect,
                'accuracy': accuracy,
                'average_confidence': avg_confidence,
                'type_performance': type_performance,
                'type_accuracies': type_accuracies,
                'last_updated': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao obter performance: {str(e)}")
            return {}

    def get_training_statistics(self) -> Dict[str, Any]:
        """
        Obter estatísticas sobre dados de treinamento.

        Returns:
            Estatísticas de treinamento
        """
        try:
            # Contar exemplos por tipo
            query = self.db.collection(self.training_examples_collection).stream()

            total_examples = 0
            types_count = Counter()
            sources_count = Counter()
            correct_count = 0
            confidence_buckets = Counter()

            for doc in query:
                data = doc.to_dict()
                total_examples += 1

                types_count[data.get('confirmed_type', 'unknown')] += 1
                sources_count[data.get('feedback_source', 'unknown')] += 1

                if data.get('metadata', {}).get('correct_prediction'):
                    correct_count += 1

                confidence_bucket = data.get('metadata', {}).get('confidence_bucket', 'unknown')
                confidence_buckets[confidence_bucket] += 1

            return {
                'total_examples': total_examples,
                'types_distribution': dict(types_count),
                'sources_distribution': dict(sources_count),
                'correct_predictions': correct_count,
                'accuracy_on_collected': correct_count / total_examples if total_examples > 0 else 0,
                'confidence_distribution': dict(confidence_buckets),
                'ready_for_retraining': total_examples >= self.min_examples_for_retraining,
                'last_updated': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {str(e)}")
            return {}

    def _get_confidence_bucket(self, confidence: float) -> str:
        """Classificar confiança em buckets."""
        if confidence >= 0.95:
            return 'very_high'
        elif confidence >= 0.85:
            return 'high'
        elif confidence >= 0.70:
            return 'medium'
        elif confidence >= 0.50:
            return 'low'
        else:
            return 'very_low'

    def _check_and_trigger_retraining(self):
        """
        Verificar se deve retreinar modelo e disparar se necessário.
        """
        try:
            # Obter último treinamento
            last_training = self.db.collection(self.model_metrics_collection)\
                                  .order_by('trained_at', direction=firestore.Query.DESCENDING)\
                                  .limit(1)\
                                  .stream()

            last_training_date = None
            for doc in last_training:
                data = doc.to_dict()
                last_training_date = data.get('trained_at')
                break

            # Verificar se deve retreinar
            should_retrain = False

            if not last_training_date:
                should_retrain = True
                reason = "Nenhum treinamento anterior"
            else:
                days_since_training = (datetime.now() - last_training_date).days
                if days_since_training >= self.retraining_interval_days:
                    should_retrain = True
                    reason = f"Passaram {days_since_training} dias desde último treinamento"

            # Verificar número de exemplos novos
            stats = self.get_training_statistics()
            if stats.get('ready_for_retraining') and should_retrain:
                logger.info(f"Disparando re-treinamento automático: {reason}")
                # Aqui poderia disparar um Cloud Task ou Cloud Function
                # Por ora, apenas log

        except Exception as e:
            logger.error(f"Erro ao verificar need for retraining: {str(e)}")

    def _calculate_model_metrics(self, training_data: List[Tuple[str, str]]) -> Dict[str, Any]:
        """
        Calcular métricas detalhadas do modelo.

        Args:
            training_data: Dados de treinamento

        Returns:
            Métricas calculadas
        """
        # Aqui implementaríamos cálculo de precision, recall, F1, etc.
        # Por simplicidade, retornando estrutura básica
        return {
            'note': 'Métricas detalhadas seriam calculadas com validação cruzada',
            'training_set_size': len(training_data),
            'types_in_training': len(set(label for _, label in training_data))
        }

    def _save_model_to_cloud(self, version: str):
        """
        Salvar modelo no Cloud Storage.

        Args:
            version: Versão do modelo
        """
        try:
            bucket_name = os.environ.get('ML_MODELS_BUCKET', 'licitareview-ml-models')
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)

            # Upload de arquivos do modelo
            model_files = [
                'models/document_classifier.joblib',
                'models/tfidf_vectorizer.joblib'
            ]

            for file_path in model_files:
                if os.path.exists(file_path):
                    blob_name = f"{version}/{os.path.basename(file_path)}"
                    blob = bucket.blob(blob_name)
                    blob.upload_from_filename(file_path)
                    logger.info(f"Modelo salvo no Cloud Storage: {blob_name}")

        except Exception as e:
            logger.error(f"Erro ao salvar modelo no Cloud Storage: {str(e)}")

# Funções auxiliares para uso nos endpoints

def collect_classification_feedback(db: firestore.Client, document_id: str,
                                   content: str, predicted_type: str,
                                   confirmed_type: str, confidence: float,
                                   user_id: Optional[str] = None) -> str:
    """
    Função auxiliar para coletar feedback de classificação.

    Args:
        db: Cliente Firestore
        document_id: ID do documento
        content: Conteúdo do documento
        predicted_type: Tipo predito
        confirmed_type: Tipo confirmado
        confidence: Confiança
        user_id: ID do usuário

    Returns:
        ID do exemplo criado
    """
    service = ContinuousLearningService(db)
    return service.collect_feedback(
        document_id=document_id,
        content=content,
        predicted_type=predicted_type,
        confirmed_type=confirmed_type,
        confidence=confidence,
        user_id=user_id
    )

def trigger_model_retraining(db: firestore.Client) -> Optional[Dict[str, Any]]:
    """
    Função auxiliar para disparar re-treinamento.

    Args:
        db: Cliente Firestore

    Returns:
        Métricas do novo modelo ou None
    """
    service = ContinuousLearningService(db)
    return service.retrain_model()

def get_ml_statistics(db: firestore.Client) -> Dict[str, Any]:
    """
    Função auxiliar para obter estatísticas de ML.

    Args:
        db: Cliente Firestore

    Returns:
        Estatísticas do sistema ML
    """
    service = ContinuousLearningService(db)

    training_stats = service.get_training_statistics()
    performance_stats = service.get_model_performance(days=30)

    return {
        'training_statistics': training_stats,
        'performance_statistics': performance_stats,
        'system_info': {
            'min_examples_for_retraining': service.min_examples_for_retraining,
            'retraining_interval_days': service.retraining_interval_days,
            'auto_feedback_threshold': service.confidence_threshold_for_auto_feedback
        }
    }
