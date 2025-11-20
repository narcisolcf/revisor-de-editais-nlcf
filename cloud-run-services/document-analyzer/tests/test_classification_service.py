#!/usr/bin/env python3
"""
Testes Unitários para Classification Service

Testa todas as funcionalidades do sistema de classificação automática:
- Extração de features
- Classificação por padrões
- Classificação por ML
- Combinação de resultados
- Treinamento de modelos
"""

import unittest
import sys
import os

# Adicionar diretório pai ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.classification_service import ClassificationService, ClassificationResult, DocumentFeatures


class TestFeatureExtraction(unittest.TestCase):
    """Testes para extração de features."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_extract_basic_text_features(self):
        """Testar extração de features textuais básicas."""
        content = "Este é um documento de teste. " * 50

        features = self.classifier._extract_features(content)

        self.assertIsInstance(features, DocumentFeatures)
        self.assertGreater(features.text_features['length'], 0)
        self.assertGreater(features.text_features['word_count'], 0)
        self.assertGreater(features.text_features['sentence_count'], 0)

    def test_detect_numbered_sections(self):
        """Testar detecção de seções numeradas."""
        content = """
        1.1 Introdução
        1.2 Objetivo
        2.1 Metodologia
        """

        features = self.classifier._extract_features(content)

        self.assertTrue(features.structural_features['has_numbered_sections'])

    def test_detect_dates(self):
        """Testar detecção de datas."""
        content = "Data: 20/01/2025"

        features = self.classifier._extract_features(content)

        self.assertTrue(features.structural_features['has_dates'])

    def test_detect_values(self):
        """Testar detecção de valores monetários."""
        content = "Valor total: R$ 150.000,00"

        features = self.classifier._extract_features(content)

        self.assertTrue(features.structural_features['has_values'])

    def test_keyword_matching(self):
        """Testar contagem de keywords por categoria."""
        content = """
        Lei nº 8.666/93, Decreto nº 10.024/2019.
        Valor estimado: R$ 100.000,00.
        Especificação técnica conforme ABNT.
        Prazo de execução: 180 dias.
        """

        features = self.classifier._extract_features(content)

        # Deve ter keywords legais
        self.assertGreater(features.keyword_matches.get('legal', 0), 0)
        # Deve ter keywords financeiras
        self.assertGreater(features.keyword_matches.get('financial', 0), 0)
        # Deve ter keywords técnicas
        self.assertGreater(features.keyword_matches.get('technical', 0), 0)
        # Deve ter keywords procedurais
        self.assertGreater(features.keyword_matches.get('procedural', 0), 0)


class TestPatternClassification(unittest.TestCase):
    """Testes para classificação por padrões."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_classify_edital_licitacao(self):
        """Testar classificação de edital de licitação."""
        content = """
        EDITAL DE LICITAÇÃO Nº 001/2025
        Processo Licitatório nº 123/2025
        Modalidade: Pregão Eletrônico
        Objeto: Contratação de serviços
        Valor estimado: R$ 500.000,00
        """

        result = self.classifier._classify_by_patterns(content)

        self.assertIn('edital', result['type'].lower())
        self.assertGreater(result['confidence'], 0.5)

    def test_classify_pregao_eletronico(self):
        """Testar classificação de pregão eletrônico."""
        content = """
        PREGÃO ELETRÔNICO Nº 050/2025
        Sistema ComprasNet
        Lance inicial: R$ 100.000,00
        Fase de lances: 14h00
        """

        result = self.classifier._classify_by_patterns(content)

        self.assertEqual(result['type'], 'pregao_eletronico')
        self.assertGreater(result['confidence'], 0.5)

    def test_classify_termo_referencia(self):
        """Testar classificação de termo de referência."""
        content = """
        TERMO DE REFERÊNCIA
        Especificações técnicas do objeto
        Justificativa da necessidade
        Descrição do objeto licitado
        """

        result = self.classifier._classify_by_patterns(content)

        self.assertEqual(result['type'], 'termo_referencia')

    def test_pattern_with_no_matches(self):
        """Testar classificação de documento sem padrões conhecidos."""
        content = "Documento genérico sem padrões específicos."

        result = self.classifier._classify_by_patterns(content)

        self.assertIn(result['type'], ['unknown'] + self.classifier.document_types)
        self.assertGreaterEqual(result['confidence'], 0)

    def test_alternatives_ranking(self):
        """Testar ranking de tipos alternativos."""
        content = """
        EDITAL DE PREGÃO ELETRÔNICO
        Sistema de licitação eletrônica
        """

        result = self.classifier._classify_by_patterns(content)

        # Deve ter alternativas
        self.assertIsInstance(result['alternatives'], list)
        # Alternativas devem estar ordenadas por score
        if len(result['alternatives']) > 1:
            scores = [score for _, score in result['alternatives']]
            self.assertEqual(scores, sorted(scores, reverse=True))


class TestMLClassification(unittest.TestCase):
    """Testes para classificação com ML."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_ml_without_model(self):
        """Testar classificação ML sem modelo treinado."""
        content = "Documento de teste"

        result = self.classifier._classify_by_ml(content)

        # Deve retornar None se modelo não disponível
        if not self.classifier.model:
            self.assertIsNone(result)

    def test_train_model_with_insufficient_data(self):
        """Testar treinamento com dados insuficientes."""
        # Menos que mínimo necessário (10 exemplos)
        training_data = [
            ("edital de licitação", "edital_licitacao"),
            ("termo de referência", "termo_referencia"),
        ]

        # Deve logar warning e não treinar
        result = self.classifier.train_model(training_data)
        self.assertIsNone(result)

    def test_train_model_with_sufficient_data(self):
        """Testar treinamento com dados suficientes."""
        # Criar dados de treinamento sintéticos
        training_data = []

        # Editais
        for i in range(5):
            training_data.append((
                f"EDITAL DE LICITAÇÃO {i} Processo Licitatório Modalidade Pregão",
                "edital_licitacao"
            ))

        # Termos de Referência
        for i in range(5):
            training_data.append((
                f"TERMO DE REFERÊNCIA {i} Especificações técnicas Justificativa",
                "termo_referencia"
            ))

        # Pregões
        for i in range(5):
            training_data.append((
                f"PREGÃO ELETRÔNICO {i} Sistema ComprasNet Lance inicial",
                "pregao_eletronico"
            ))

        # Treinar modelo
        accuracy = self.classifier.train_model(training_data)

        # Deve retornar acurácia
        if accuracy is not None:
            self.assertIsInstance(accuracy, float)
            self.assertGreater(accuracy, 0)
            self.assertLessEqual(accuracy, 1.0)

            # Modelo e vectorizer devem estar configurados
            self.assertIsNotNone(self.classifier.model)
            self.assertIsNotNone(self.classifier.vectorizer)


class TestFullClassification(unittest.TestCase):
    """Testes para classificação completa (end-to-end)."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_classify_complete_edital(self):
        """Testar classificação completa de um edital."""
        content = """
        EDITAL DE LICITAÇÃO Nº 001/2025
        PREGÃO ELETRÔNICO

        Processo Licitatório nº 2025/001
        Modalidade: Pregão Eletrônico
        Tipo: Menor Preço

        OBJETO: Contratação de empresa especializada para fornecimento
        de equipamentos de informática, conforme especificações do
        Termo de Referência (Anexo I).

        VALOR ESTIMADO: R$ 500.000,00 (quinhentos mil reais)

        PRAZO: 180 (cento e oitenta) dias

        Lei nº 8.666/93, Lei nº 10.520/02, Decreto nº 10.024/2019
        """

        result = self.classifier.classify_document(content)

        self.assertIsInstance(result, ClassificationResult)
        self.assertIsNotNone(result.document_type)
        self.assertGreater(result.confidence, 0)
        self.assertIsInstance(result.alternative_types, list)
        self.assertIsInstance(result.features_detected, dict)
        self.assertGreater(result.processing_time, 0)

    def test_classify_with_low_confidence_threshold(self):
        """Testar classificação com threshold de confiança baixo."""
        content = "Documento simples de teste"

        result = self.classifier.classify_document(
            content,
            confidence_threshold=0.3
        )

        self.assertIsNotNone(result.document_type)

    def test_classify_with_high_confidence_threshold(self):
        """Testar classificação com threshold de confiança alto."""
        content = """
        PREGÃO ELETRÔNICO Nº 100/2025
        Sistema ComprasNet
        Lance inicial
        Fase de lances
        Fornecedor registrado
        """

        result = self.classifier.classify_document(
            content,
            confidence_threshold=0.9
        )

        self.assertIsNotNone(result.document_type)

    def test_metadata_in_result(self):
        """Testar presença de metadados no resultado."""
        content = "EDITAL DE LICITAÇÃO teste"

        result = self.classifier.classify_document(content)

        # Verificar metadados
        self.assertIn('method_used', result.metadata)
        self.assertIn('content_length', result.metadata)
        self.assertIn('word_count', result.metadata)


class TestUtilityMethods(unittest.TestCase):
    """Testes para métodos utilitários."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_get_supported_types(self):
        """Testar obtenção de tipos suportados."""
        types = self.classifier.get_supported_types()

        self.assertIsInstance(types, list)
        self.assertGreater(len(types), 0)
        self.assertIn('edital_licitacao', types)
        self.assertIn('pregao_eletronico', types)

    def test_add_custom_patterns(self):
        """Testar adição de padrões customizados."""
        custom_patterns = [
            r'novo\s+padrão\s+1',
            r'novo\s+padrão\s+2'
        ]

        # Adicionar padrões para tipo existente
        self.classifier.add_custom_patterns('edital_licitacao', custom_patterns)

        # Verificar se foram adicionados
        self.assertIn(custom_patterns[0], self.classifier.type_patterns['edital_licitacao'])
        self.assertIn(custom_patterns[1], self.classifier.type_patterns['edital_licitacao'])

    def test_add_custom_patterns_new_type(self):
        """Testar adição de padrões para novo tipo."""
        new_type = 'tipo_customizado'
        custom_patterns = [r'padrão\s+especial']

        self.classifier.add_custom_patterns(new_type, custom_patterns)

        self.assertIn(new_type, self.classifier.type_patterns)
        self.assertEqual(self.classifier.type_patterns[new_type], custom_patterns)

    def test_detect_table_structure(self):
        """Testar detecção de estruturas tabulares."""
        # Tabela com pipes
        content_with_pipes = """
        | Item | Descrição | Valor |
        | 1    | Produto A | 100,00|
        | 2    | Produto B | 200,00|
        """

        self.assertTrue(self.classifier._detect_table_structure(content_with_pipes))

        # Conteúdo sem tabela
        content_without_table = "Texto simples sem tabelas"

        self.assertFalse(self.classifier._detect_table_structure(content_without_table))

    def test_merge_alternatives(self):
        """Testar mesclagem de listas de alternativas."""
        alt1 = [('type_a', 0.8), ('type_b', 0.6)]
        alt2 = [('type_b', 0.7), ('type_c', 0.5)]

        merged = self.classifier._merge_alternatives(alt1, alt2)

        self.assertIsInstance(merged, list)
        self.assertLessEqual(len(merged), 3)

        # Verificar ordenação por score
        if len(merged) > 1:
            scores = [score for _, score in merged]
            self.assertEqual(scores, sorted(scores, reverse=True))


class TestEdgeCases(unittest.TestCase):
    """Testes para casos extremos e edge cases."""

    def setUp(self):
        """Configurar ambiente de teste."""
        self.classifier = ClassificationService()

    def test_empty_content(self):
        """Testar classificação de conteúdo vazio."""
        content = ""

        result = self.classifier.classify_document(content)

        self.assertIsNotNone(result.document_type)
        # Confiança deve ser baixa
        self.assertLessEqual(result.confidence, 0.5)

    def test_very_long_content(self):
        """Testar classificação de conteúdo muito longo."""
        content = "EDITAL DE LICITAÇÃO " * 10000

        result = self.classifier.classify_document(content)

        self.assertIsNotNone(result.document_type)
        self.assertGreater(result.processing_time, 0)

    def test_special_characters(self):
        """Testar classificação com caracteres especiais."""
        content = """
        EDITAL DE LICITAÇÃO Nº 001/2025 ® © ™
        Valor: R$ 100.000,00 €£¥
        Prazo: 30 dias úteis
        """

        result = self.classifier.classify_document(content)

        self.assertIsNotNone(result.document_type)

    def test_mixed_case_content(self):
        """Testar classificação com mistura de maiúsculas e minúsculas."""
        content = "EdItAl De LiCiTaÇãO pReGãO eLeT rÔnIcO"

        result = self.classifier.classify_document(content)

        self.assertIsNotNone(result.document_type)

    def test_content_with_unicode(self):
        """Testar classificação com caracteres Unicode."""
        content = """
        EDITAL DE LICITAÇÃO
        Símbolos: § ¶ † ‡ • ◦ ▪ ▫
        Acentos: á é í ó ú ã õ ç
        """

        result = self.classifier.classify_document(content)

        self.assertIsNotNone(result.document_type)


if __name__ == '__main__':
    # Executar testes com verbosidade
    unittest.main(verbosity=2)
