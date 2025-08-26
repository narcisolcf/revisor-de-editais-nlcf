#!/usr/bin/env python3
"""
Classification Service - Classificação automática de documentos licitatórios

Implementa sistema de classificação automática usando ML:
- Detecção de tipo de documento
- Extração de features relevantes
- Modelo de machine learning para classificação
- Sistema de confiança e fallback
"""

import os
import logging
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from collections import Counter
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

logger = logging.getLogger(__name__)

@dataclass
class ClassificationResult:
    """Resultado da classificação de documento."""
    document_type: str
    confidence: float
    alternative_types: List[Tuple[str, float]]
    features_detected: Dict[str, Any]
    processing_time: float
    metadata: Dict[str, Any]

@dataclass
class DocumentFeatures:
    """Features extraídas do documento."""
    text_features: Dict[str, float]
    structural_features: Dict[str, Any]
    keyword_matches: Dict[str, int]
    format_indicators: Dict[str, bool]

class ClassificationService:
    """Serviço de classificação automática de documentos."""
    
    def __init__(self):
        """Inicializar serviço de classificação."""
        self.model = None
        self.vectorizer = None
        self.document_types = [
            'edital_licitacao',
            'termo_referencia',
            'projeto_basico',
            'ata_registro_precos',
            'contrato',
            'aditivo_contratual',
            'pregao_eletronico',
            'tomada_precos',
            'concorrencia',
            'convite',
            'dispensa_licitacao',
            'inexigibilidade'
        ]
        
        # Padrões de identificação por tipo
        self.type_patterns = {
            'edital_licitacao': [
                r'edital\s+de\s+licita[çc][ãa]o',
                r'processo\s+licitat[óo]rio',
                r'modalidade\s*:',
                r'objeto\s*:',
                r'valor\s+estimado'
            ],
            'termo_referencia': [
                r'termo\s+de\s+refer[êe]ncia',
                r'especifica[çc][õo]es\s+t[ée]cnicas',
                r'justificativa\s+da\s+necessidade',
                r'descri[çc][ãa]o\s+do\s+objeto'
            ],
            'projeto_basico': [
                r'projeto\s+b[áa]sico',
                r'memorial\s+descritivo',
                r'planilha\s+or[çc]ament[áa]ria',
                r'cronograma\s+f[íi]sico'
            ],
            'pregao_eletronico': [
                r'preg[ãa]o\s+eletr[ôo]nico',
                r'sistema\s+comprasnet',
                r'lance\s+inicial',
                r'fase\s+de\s+lances'
            ],
            'ata_registro_precos': [
                r'ata\s+de\s+registro\s+de\s+pre[çc]os',
                r'sistema\s+de\s+registro\s+de\s+pre[çc]os',
                r'validade\s+da\s+ata',
                r'fornecedor\s+registrado'
            ]
        }
        
        # Keywords importantes por categoria
        self.category_keywords = {
            'legal': [
                'lei', 'decreto', 'portaria', 'resolução', 'instrução normativa',
                'constituição', 'código civil', 'lrf', 'tcu', 'cgu'
            ],
            'financial': [
                'valor', 'preço', 'orçamento', 'custo', 'investimento',
                'dotação orçamentária', 'recurso financeiro', 'pagamento'
            ],
            'technical': [
                'especificação', 'requisito', 'norma técnica', 'abnt',
                'qualidade', 'performance', 'funcionalidade'
            ],
            'procedural': [
                'prazo', 'cronograma', 'etapa', 'fase', 'procedimento',
                'habilitação', 'proposta', 'julgamento'
            ]
        }
        
        self._load_or_train_model()
        
        logger.info("Classification Service inicializado")
    
    def classify_document(self, content: str, 
                         confidence_threshold: float = 0.8) -> ClassificationResult:
        """
        Classificar documento automaticamente.
        
        Args:
            content: Conteúdo textual do documento
            confidence_threshold: Limite mínimo de confiança
            
        Returns:
            ClassificationResult com tipo detectado e metadados
        """
        import time
        start_time = time.time()
        
        try:
            # Extrair features do documento
            features = self._extract_features(content)
            
            # Classificação baseada em padrões
            pattern_result = self._classify_by_patterns(content)
            
            # Classificação baseada em ML (se modelo disponível)
            ml_result = None
            if self.model and self.vectorizer:
                ml_result = self._classify_by_ml(content)
            
            # Combinar resultados
            final_result = self._combine_classification_results(
                pattern_result, ml_result, features, confidence_threshold
            )
            
            processing_time = time.time() - start_time
            
            result = ClassificationResult(
                document_type=final_result['type'],
                confidence=final_result['confidence'],
                alternative_types=final_result['alternatives'],
                features_detected=features.__dict__,
                processing_time=processing_time,
                metadata={
                    'method_used': final_result['method'],
                    'pattern_matches': pattern_result,
                    'ml_prediction': ml_result,
                    'content_length': len(content),
                    'word_count': len(content.split())
                }
            )
            
            logger.info(f"Documento classificado como: {result.document_type} (confiança: {result.confidence:.2f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Erro na classificação: {str(e)}")
            raise
    
    def _extract_features(self, content: str) -> DocumentFeatures:
        """
        Extrair features relevantes do documento.
        
        Args:
            content: Conteúdo do documento
            
        Returns:
            DocumentFeatures com features extraídas
        """
        content_lower = content.lower()
        
        # Features textuais básicas
        text_features = {
            'length': len(content),
            'word_count': len(content.split()),
            'sentence_count': len(re.findall(r'[.!?]+', content)),
            'paragraph_count': len(content.split('\n\n')),
            'avg_word_length': np.mean([len(word) for word in content.split()]) if content.split() else 0,
            'uppercase_ratio': sum(1 for c in content if c.isupper()) / len(content) if content else 0
        }
        
        # Features estruturais
        structural_features = {
            'has_numbered_sections': bool(re.search(r'\d+\.\d+', content)),
            'has_bullet_points': bool(re.search(r'[•\-\*]\s', content)),
            'has_tables': self._detect_table_structure(content),
            'has_signatures': bool(re.search(r'assinatura|assinado|responsável', content_lower)),
            'has_dates': bool(re.search(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}', content)),
            'has_values': bool(re.search(r'R\$\s*\d+[.,]\d+', content))
        }
        
        # Contagem de keywords por categoria
        keyword_matches = {}
        for category, keywords in self.category_keywords.items():
            matches = sum(1 for keyword in keywords if keyword in content_lower)
            keyword_matches[category] = matches
        
        # Indicadores de formato
        format_indicators = {
            'has_legal_references': bool(re.search(r'lei\s+n[°º]?\s*\d+', content_lower)),
            'has_article_references': bool(re.search(r'art\.?\s*\d+', content_lower)),
            'has_monetary_values': bool(re.search(r'R\$|real|reais', content_lower)),
            'has_technical_specs': bool(re.search(r'especifica[çc][ãa]o|requisito|norma', content_lower))
        }
        
        return DocumentFeatures(
            text_features=text_features,
            structural_features=structural_features,
            keyword_matches=keyword_matches,
            format_indicators=format_indicators
        )
    
    def _classify_by_patterns(self, content: str) -> Dict[str, Any]:
        """
        Classificar documento baseado em padrões regex.
        
        Args:
            content: Conteúdo do documento
            
        Returns:
            Resultado da classificação por padrões
        """
        content_lower = content.lower()
        scores = {}
        
        for doc_type, patterns in self.type_patterns.items():
            score = 0
            matches = []
            
            for pattern in patterns:
                if re.search(pattern, content_lower):
                    score += 1
                    matches.append(pattern)
            
            # Normalizar score pelo número de padrões
            normalized_score = score / len(patterns) if patterns else 0
            scores[doc_type] = {
                'score': normalized_score,
                'matches': matches,
                'raw_score': score
            }
        
        # Encontrar melhor match
        best_type = max(scores.keys(), key=lambda k: scores[k]['score']) if scores else 'unknown'
        best_score = scores[best_type]['score'] if best_type != 'unknown' else 0
        
        # Criar lista de alternativas
        alternatives = sorted(
            [(t, s['score']) for t, s in scores.items() if t != best_type and s['score'] > 0],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            'type': best_type,
            'confidence': best_score,
            'alternatives': alternatives,
            'all_scores': scores
        }
    
    def _classify_by_ml(self, content: str) -> Optional[Dict[str, Any]]:
        """
        Classificar documento usando modelo ML.
        
        Args:
            content: Conteúdo do documento
            
        Returns:
            Resultado da classificação ML ou None se modelo não disponível
        """
        if not self.model or not self.vectorizer:
            return None
        
        try:
            # Vetorizar conteúdo
            content_vector = self.vectorizer.transform([content])
            
            # Predição
            prediction = self.model.predict(content_vector)[0]
            probabilities = self.model.predict_proba(content_vector)[0]
            
            # Obter classes
            classes = self.model.classes_
            
            # Criar lista de alternativas
            class_probs = list(zip(classes, probabilities))
            class_probs.sort(key=lambda x: x[1], reverse=True)
            
            best_confidence = class_probs[0][1]
            alternatives = class_probs[1:4]  # Top 3 alternativas
            
            return {
                'type': prediction,
                'confidence': best_confidence,
                'alternatives': alternatives,
                'all_probabilities': dict(class_probs)
            }
            
        except Exception as e:
            logger.error(f"Erro na classificação ML: {str(e)}")
            return None
    
    def _combine_classification_results(self, pattern_result: Dict[str, Any],
                                      ml_result: Optional[Dict[str, Any]],
                                      features: DocumentFeatures,
                                      confidence_threshold: float) -> Dict[str, Any]:
        """
        Combinar resultados de diferentes métodos de classificação.
        
        Args:
            pattern_result: Resultado da classificação por padrões
            ml_result: Resultado da classificação ML
            features: Features extraídas
            confidence_threshold: Limite de confiança
            
        Returns:
            Resultado final combinado
        """
        # Se apenas padrões disponíveis
        if not ml_result:
            return {
                'type': pattern_result['type'],
                'confidence': pattern_result['confidence'],
                'alternatives': pattern_result['alternatives'],
                'method': 'patterns_only'
            }
        
        # Se ambos disponíveis, combinar com pesos
        pattern_weight = 0.4
        ml_weight = 0.6
        
        # Se padrões e ML concordam
        if pattern_result['type'] == ml_result['type']:
            combined_confidence = (
                pattern_result['confidence'] * pattern_weight +
                ml_result['confidence'] * ml_weight
            )
            
            return {
                'type': pattern_result['type'],
                'confidence': combined_confidence,
                'alternatives': self._merge_alternatives(
                    pattern_result['alternatives'],
                    ml_result['alternatives']
                ),
                'method': 'combined_agreement'
            }
        
        # Se discordam, usar o de maior confiança
        if ml_result['confidence'] > pattern_result['confidence']:
            return {
                'type': ml_result['type'],
                'confidence': ml_result['confidence'] * 0.9,  # Penalizar discordância
                'alternatives': ml_result['alternatives'],
                'method': 'ml_preferred'
            }
        else:
            return {
                'type': pattern_result['type'],
                'confidence': pattern_result['confidence'] * 0.9,
                'alternatives': pattern_result['alternatives'],
                'method': 'patterns_preferred'
            }
    
    def _merge_alternatives(self, alt1: List[Tuple[str, float]], 
                           alt2: List[Tuple[str, float]]) -> List[Tuple[str, float]]:
        """
        Mesclar listas de alternativas.
        
        Args:
            alt1: Primeira lista de alternativas
            alt2: Segunda lista de alternativas
            
        Returns:
            Lista mesclada e ordenada
        """
        combined = {}
        
        # Adicionar alternativas da primeira lista
        for doc_type, score in alt1:
            combined[doc_type] = score
        
        # Adicionar/combinar alternativas da segunda lista
        for doc_type, score in alt2:
            if doc_type in combined:
                combined[doc_type] = (combined[doc_type] + score) / 2
            else:
                combined[doc_type] = score
        
        # Ordenar e retornar top 3
        sorted_alternatives = sorted(combined.items(), key=lambda x: x[1], reverse=True)
        return sorted_alternatives[:3]
    
    def _detect_table_structure(self, content: str) -> bool:
        """
        Detectar se o documento contém estruturas tabulares.
        
        Args:
            content: Conteúdo do documento
            
        Returns:
            True se tabelas detectadas
        """
        # Procurar por padrões que indicam tabelas
        table_indicators = [
            r'\|.*\|.*\|',  # Pipes indicando colunas
            r'\t.*\t.*\t',  # Tabs múltiplos
            r'\d+\s+\w+\s+\d+',  # Padrão numérico-texto-numérico
        ]
        
        for pattern in table_indicators:
            if re.search(pattern, content):
                return True
        
        return False
    
    def _load_or_train_model(self):
        """
        Carregar modelo existente ou treinar novo modelo.
        """
        model_path = 'models/document_classifier.joblib'
        vectorizer_path = 'models/tfidf_vectorizer.joblib'
        
        try:
            # Tentar carregar modelo existente
            if os.path.exists(model_path) and os.path.exists(vectorizer_path):
                self.model = joblib.load(model_path)
                self.vectorizer = joblib.load(vectorizer_path)
                logger.info("Modelo de classificação carregado")
            else:
                logger.info("Modelo não encontrado, usando apenas classificação por padrões")
                
        except Exception as e:
            logger.error(f"Erro ao carregar modelo: {str(e)}")
            self.model = None
            self.vectorizer = None
    
    def train_model(self, training_data: List[Tuple[str, str]]):
        """
        Treinar modelo de classificação com dados fornecidos.
        
        Args:
            training_data: Lista de tuplas (conteúdo, tipo_documento)
        """
        if len(training_data) < 10:
            logger.warning("Dados insuficientes para treinamento (mínimo 10 exemplos)")
            return
        
        try:
            # Separar features e labels
            texts, labels = zip(*training_data)
            
            # Dividir dados
            # Se alguns tipos têm poucas amostras, não usar estratificação
            try:
                X_train, X_test, y_train, y_test = train_test_split(
                    texts, labels, test_size=0.2, random_state=42, stratify=labels
                )
            except ValueError:
                logger.warning("Usando divisão simples devido a classes com poucas amostras")
                X_train, X_test, y_train, y_test = train_test_split(
                    texts, labels, test_size=0.2, random_state=42
                )
            
            # Criar pipeline
            self.vectorizer = TfidfVectorizer(
                max_features=5000,
                stop_words=None,  # Manter palavras em português
                ngram_range=(1, 2),
                min_df=2
            )
            
            self.model = MultinomialNB(alpha=0.1)
            
            # Treinar
            X_train_vec = self.vectorizer.fit_transform(X_train)
            self.model.fit(X_train_vec, y_train)
            
            # Avaliar
            X_test_vec = self.vectorizer.transform(X_test)
            accuracy = self.model.score(X_test_vec, y_test)
            
            logger.info(f"Modelo treinado com acurácia: {accuracy:.2f}")
            
            # Salvar modelo
            os.makedirs('models', exist_ok=True)
            joblib.dump(self.model, 'models/document_classifier.joblib')
            joblib.dump(self.vectorizer, 'models/tfidf_vectorizer.joblib')
            
            return accuracy
            
        except Exception as e:
            logger.error(f"Erro no treinamento: {str(e)}")
            raise
    
    def get_supported_types(self) -> List[str]:
        """Obter lista de tipos de documento suportados."""
        return self.document_types.copy()
    
    def add_custom_patterns(self, doc_type: str, patterns: List[str]):
        """
        Adicionar padrões customizados para um tipo de documento.
        
        Args:
            doc_type: Tipo do documento
            patterns: Lista de padrões regex
        """
        if doc_type not in self.type_patterns:
            self.type_patterns[doc_type] = []
        
        self.type_patterns[doc_type].extend(patterns)
        logger.info(f"Adicionados {len(patterns)} padrões para {doc_type}")