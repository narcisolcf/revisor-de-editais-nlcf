#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste básico de exemplo para demonstrar a estrutura padrão de testes unitários.

Este módulo contém testes simples que servem como exemplo inicial
para a suíte de testes do projeto.
"""

import unittest


class TestSample(unittest.TestCase):
    """
    Classe de teste de exemplo que demonstra a estrutura básica
    de testes unitários em Python usando unittest.
    """

    def test_basic_assertion(self):
        """
        Teste básico que verifica se True é igual a True.
        
        Este é um teste fundamental que sempre deve passar,
        servindo como verificação de que o framework de testes
        está funcionando corretamente.
        """
        self.assertTrue(True)
        self.assertEqual(True, True)

    def test_basic_math(self):
        """
        Teste básico de operações matemáticas simples.
        
        Demonstra como testar operações básicas e
        verificar resultados esperados.
        """
        result = 2 + 2
        self.assertEqual(result, 4)
        
        result = 10 - 5
        self.assertEqual(result, 5)

    def test_string_operations(self):
        """
        Teste básico de operações com strings.
        
        Demonstra como testar manipulação de strings
        e verificar resultados esperados.
        """
        text = "Hello, World!"
        self.assertIsInstance(text, str)
        self.assertEqual(len(text), 13)
        self.assertTrue(text.startswith("Hello"))


if __name__ == '__main__':
    # Permite executar os testes diretamente com: python test_sample.py
    unittest.main()
