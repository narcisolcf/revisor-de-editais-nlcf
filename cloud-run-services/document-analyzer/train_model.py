#!/usr/bin/env python3
"""
Script para treinar o modelo de classificação de documentos licitatórios.

Este script carrega os dados de treinamento e treina o modelo ML
para classificação automática de documentos.
"""

import os
import sys
from pathlib import Path
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

# Adicionar o diretório atual ao path para importar módulos locais
sys.path.append(str(Path(__file__).parent))

from data.training_data import get_training_data, get_training_stats
from services.classification_service import ClassificationService

def train_and_evaluate_model():
    """
    Treina e avalia o modelo de classificação.
    """
    print("=== Treinamento do Modelo de Classificação ===")
    
    # Carregar dados de treinamento
    print("\n1. Carregando dados de treinamento...")
    training_data = get_training_data()
    stats = get_training_stats()
    
    print(f"   Total de amostras: {stats['total_samples']}")
    print(f"   Tipos de documento: {stats['document_types']}")
    print("   Distribuição por tipo:")
    for doc_type, count in stats['samples_per_type'].items():
        print(f"     {doc_type}: {count} amostras")
    
    # Verificar se há dados suficientes
    if stats['total_samples'] < 10:
        print("\n❌ ERRO: Dados insuficientes para treinamento (mínimo 10 amostras)")
        return False
    
    if stats['min_samples'] < 2:
        print("\n⚠️  AVISO: Alguns tipos têm poucas amostras (mínimo recomendado: 3 por tipo)")
    
    # Separar features e labels
    print("\n2. Preparando dados...")
    texts = [text for text, _ in training_data]
    labels = [label for _, label in training_data]
    
    # Dividir em treino e teste
    # Se alguns tipos têm poucas amostras, não usar estratificação
    try:
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42, stratify=labels
        )
    except ValueError:
        print("   ⚠️  Usando divisão simples devido a classes com poucas amostras")
        X_train, X_test, y_train, y_test = train_test_split(
            texts, labels, test_size=0.2, random_state=42
        )
    
    print(f"   Dados de treino: {len(X_train)} amostras")
    print(f"   Dados de teste: {len(X_test)} amostras")
    
    # Inicializar serviço de classificação
    print("\n3. Inicializando serviço de classificação...")
    classification_service = ClassificationService()
    
    # Treinar modelo
    print("\n4. Treinando modelo...")
    try:
        accuracy = classification_service.train_model(training_data)
        print(f"   ✅ Modelo treinado com sucesso!")
        print(f"   Acurácia no conjunto de treinamento: {accuracy:.3f}")
    except Exception as e:
        print(f"   ❌ Erro no treinamento: {e}")
        return False
    
    # Avaliar modelo no conjunto de teste
    print("\n5. Avaliando modelo no conjunto de teste...")
    try:
        predictions = []
        confidences = []
        
        for text in X_test:
            result = classification_service.classify_document(text)
            predictions.append(result.document_type)
            confidences.append(result.confidence)
        
        # Calcular métricas
        test_accuracy = sum(1 for pred, true in zip(predictions, y_test) if pred == true) / len(y_test)
        avg_confidence = np.mean(confidences)
        
        print(f"   Acurácia no teste: {test_accuracy:.3f}")
        print(f"   Confiança média: {avg_confidence:.3f}")
        
        # Relatório de classificação
        print("\n6. Relatório detalhado:")
        print(classification_report(y_test, predictions, zero_division=0))
        
        # Matriz de confusão
        print("\n7. Matriz de confusão:")
        cm = confusion_matrix(y_test, predictions)
        unique_labels = sorted(set(y_test + predictions))
        
        print("\n   Verdadeiro \\ Predito:", end="")
        for label in unique_labels:
            print(f"{label[:12]:>12}", end="")
        print()
        
        for i, true_label in enumerate(unique_labels):
            print(f"{true_label[:15]:>15}", end="")
            for j, pred_label in enumerate(unique_labels):
                if i < len(cm) and j < len(cm[i]):
                    print(f"{cm[i][j]:>12}", end="")
                else:
                    print(f"{'0':>12}", end="")
            print()
        
        # Validação cruzada
        print("\n8. Validação cruzada (5-fold):")
        try:
            # Para validação cruzada, precisamos recriar o pipeline
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.naive_bayes import MultinomialNB
            from sklearn.pipeline import Pipeline
            
            pipeline = Pipeline([
                ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
                ('classifier', MultinomialNB())
            ])
            
            cv_scores = cross_val_score(pipeline, texts, labels, cv=5, scoring='accuracy')
            print(f"   Scores CV: {cv_scores}")
            print(f"   Média CV: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
            
        except Exception as e:
            print(f"   ⚠️  Erro na validação cruzada: {e}")
        
        # Testar alguns exemplos
        print("\n9. Testando classificação em exemplos:")
        test_examples = [
            "EDITAL DE PREGÃO ELETRÔNICO para aquisição de materiais de escritório",
            "TERMO DE REFERÊNCIA para contratação de serviços de limpeza",
            "PROJETO BÁSICO para construção de ponte",
            "CONTRATO de prestação de serviços de consultoria"
        ]
        
        for example in test_examples:
            result = classification_service.classify_document(example)
            print(f"   Texto: '{example[:50]}...'")
            print(f"   Classificação: {result.document_type} (confiança: {result.confidence:.3f})")
            print()
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erro na avaliação: {e}")
        return False

def main():
    """
    Função principal do script.
    """
    try:
        success = train_and_evaluate_model()
        
        if success:
            print("\n🎉 Treinamento concluído com sucesso!")
            print("\n📁 Arquivos gerados:")
            print("   - document_classifier.joblib (modelo treinado)")
            print("   - tfidf_vectorizer.joblib (vetorizador)")
            print("\n💡 O modelo está pronto para uso no sistema de classificação.")
        else:
            print("\n❌ Falha no treinamento do modelo.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Treinamento interrompido pelo usuário.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro inesperado: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()