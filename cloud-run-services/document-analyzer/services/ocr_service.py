#!/usr/bin/env python3
"""
OCR Service - Extração de texto estruturado com Google Cloud Vision API

Implementa funcionalidades avançadas de OCR para documentos licitatórios:
- Extração de texto com preservação de layout
- Detecção de tabelas e estruturas
- Tratamento de diferentes formatos de documento
- Cache inteligente para otimização
"""

import os
import logging
import hashlib
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from google.cloud import vision
from google.cloud.vision_v1 import types
import cv2
import numpy as np
from PIL import Image
import io
import base64

logger = logging.getLogger(__name__)

@dataclass
class OCRResult:
    """Resultado estruturado da extração OCR."""
    text: str
    confidence: float
    layout_blocks: List[Dict[str, Any]]
    tables: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    processing_time: float

@dataclass
class TableCell:
    """Célula de tabela detectada."""
    text: str
    row: int
    column: int
    confidence: float
    bbox: Tuple[int, int, int, int]

class OCRService:
    """Serviço de OCR com funcionalidades avançadas."""
    
    def __init__(self):
        """Inicializar serviço OCR."""
        self.client = vision.ImageAnnotatorClient()
        self.cache = {}  # Cache simples em memória
        self.supported_formats = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp']
        
        logger.info("OCR Service inicializado com Google Cloud Vision API")
    
    def extract_text_with_structure(self, document_content: bytes, 
                                  preserve_layout: bool = True) -> OCRResult:
        """
        Extrair texto preservando estrutura do documento.
        
        Args:
            document_content: Bytes do documento
            preserve_layout: Se deve preservar layout original
            
        Returns:
            OCRResult com texto e estrutura extraídos
        """
        import time
        start_time = time.time()
        
        try:
            # Verificar cache
            content_hash = self._generate_content_hash(document_content)
            if content_hash in self.cache:
                logger.info("Resultado OCR obtido do cache")
                return self.cache[content_hash]
            
            # Preparar imagem para Vision API
            image = vision.Image(content=document_content)
            
            # Executar OCR com detecção de texto completa
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                raise Exception(f"Erro na Vision API: {response.error.message}")
            
            # Processar resultado
            full_text = response.full_text_annotation
            
            if not full_text:
                logger.warning("Nenhum texto detectado no documento")
                return OCRResult(
                    text="",
                    confidence=0.0,
                    layout_blocks=[],
                    tables=[],
                    metadata={'pages': 0},
                    processing_time=time.time() - start_time
                )
            
            # Extrair texto estruturado
            extracted_text = self._extract_structured_text(full_text, preserve_layout)
            
            # Detectar tabelas
            tables = self._detect_tables(full_text)
            
            # Extrair blocos de layout
            layout_blocks = self._extract_layout_blocks(full_text)
            
            # Calcular confiança média
            confidence = self._calculate_average_confidence(full_text)
            
            # Criar resultado
            result = OCRResult(
                text=extracted_text,
                confidence=confidence,
                layout_blocks=layout_blocks,
                tables=tables,
                metadata={
                    'pages': len(full_text.pages),
                    'total_words': len(full_text.text.split()),
                    'language': self._detect_language(full_text)
                },
                processing_time=time.time() - start_time
            )
            
            # Armazenar no cache
            self.cache[content_hash] = result
            
            logger.info(f"OCR concluído: {len(extracted_text)} chars, confiança: {confidence:.2f}")
            
            return result
            
        except Exception as e:
            logger.error(f"Erro na extração OCR: {str(e)}")
            raise
    
    def _extract_structured_text(self, full_text: Any, preserve_layout: bool) -> str:
        """
        Extrair texto preservando estrutura quando solicitado.
        
        Args:
            full_text: Resultado da Vision API
            preserve_layout: Se deve preservar layout
            
        Returns:
            Texto estruturado
        """
        if not preserve_layout:
            return full_text.text
        
        # Organizar texto por blocos e parágrafos
        structured_text = []
        
        for page in full_text.pages:
            page_text = []
            
            for block in page.blocks:
                block_text = []
                
                for paragraph in block.paragraphs:
                    paragraph_text = ""
                    
                    for word in paragraph.words:
                        word_text = "".join([symbol.text for symbol in word.symbols])
                        paragraph_text += word_text + " "
                    
                    if paragraph_text.strip():
                        block_text.append(paragraph_text.strip())
                
                if block_text:
                    page_text.append("\n".join(block_text))
            
            if page_text:
                structured_text.append("\n\n".join(page_text))
        
        return "\n\n---\n\n".join(structured_text)
    
    def _detect_tables(self, full_text: Any) -> List[Dict[str, Any]]:
        """
        Detectar e extrair tabelas do documento.
        
        Args:
            full_text: Resultado da Vision API
            
        Returns:
            Lista de tabelas detectadas
        """
        tables = []
        
        for page in full_text.pages:
            # Algoritmo simples de detecção de tabelas baseado em alinhamento
            # Em produção, usar modelos mais sofisticados
            
            # Agrupar palavras por linha (Y similar)
            words_by_line = self._group_words_by_line(page)
            
            # Detectar padrões tabulares
            table_candidates = self._find_table_patterns(words_by_line)
            
            for candidate in table_candidates:
                table_data = self._extract_table_data(candidate)
                if table_data:
                    tables.append({
                        'rows': len(table_data),
                        'columns': len(table_data[0]) if table_data else 0,
                        'data': table_data,
                        'confidence': self._calculate_table_confidence(candidate)
                    })
        
        return tables
    
    def _extract_layout_blocks(self, full_text: Any) -> List[Dict[str, Any]]:
        """
        Extrair blocos de layout do documento.
        
        Args:
            full_text: Resultado da Vision API
            
        Returns:
            Lista de blocos de layout
        """
        layout_blocks = []
        
        for page_idx, page in enumerate(full_text.pages):
            for block_idx, block in enumerate(page.blocks):
                # Extrair bounding box
                vertices = block.bounding_box.vertices
                bbox = {
                    'x1': min(v.x for v in vertices),
                    'y1': min(v.y for v in vertices),
                    'x2': max(v.x for v in vertices),
                    'y2': max(v.y for v in vertices)
                }
                
                # Extrair texto do bloco
                block_text = ""
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        word_text = "".join([symbol.text for symbol in word.symbols])
                        block_text += word_text + " "
                
                layout_blocks.append({
                    'id': f"page_{page_idx}_block_{block_idx}",
                    'text': block_text.strip(),
                    'bbox': bbox,
                    'type': self._classify_block_type(block_text.strip()),
                    'confidence': self._calculate_block_confidence(block)
                })
        
        return layout_blocks
    
    def _group_words_by_line(self, page: Any) -> List[List[Any]]:
        """
        Agrupar palavras por linha baseado na coordenada Y.
        
        Args:
            page: Página da Vision API
            
        Returns:
            Lista de linhas, cada uma contendo lista de palavras
        """
        all_words = []
        
        for block in page.blocks:
            for paragraph in block.paragraphs:
                for word in paragraph.words:
                    # Calcular posição Y média
                    vertices = word.bounding_box.vertices
                    avg_y = sum(v.y for v in vertices) / len(vertices)
                    
                    word_text = "".join([symbol.text for symbol in word.symbols])
                    all_words.append({
                        'text': word_text,
                        'y': avg_y,
                        'x': min(v.x for v in vertices),
                        'word_obj': word
                    })
        
        # Ordenar por Y e agrupar por linhas
        all_words.sort(key=lambda w: w['y'])
        
        lines = []
        current_line = []
        current_y = None
        y_threshold = 10  # Tolerância para considerar mesma linha
        
        for word in all_words:
            if current_y is None or abs(word['y'] - current_y) <= y_threshold:
                current_line.append(word)
                current_y = word['y'] if current_y is None else current_y
            else:
                if current_line:
                    # Ordenar linha por X
                    current_line.sort(key=lambda w: w['x'])
                    lines.append(current_line)
                current_line = [word]
                current_y = word['y']
        
        if current_line:
            current_line.sort(key=lambda w: w['x'])
            lines.append(current_line)
        
        return lines
    
    def _find_table_patterns(self, lines: List[List[Any]]) -> List[List[List[Any]]]:
        """
        Encontrar padrões que indicam tabelas.
        
        Args:
            lines: Linhas de palavras
            
        Returns:
            Lista de candidatos a tabela
        """
        table_candidates = []
        
        # Algoritmo simples: procurar sequências de linhas com número similar de "colunas"
        i = 0
        while i < len(lines):
            if len(lines[i]) >= 2:  # Linha com pelo menos 2 "colunas"
                table_lines = [lines[i]]
                j = i + 1
                
                # Procurar linhas consecutivas com padrão similar
                while j < len(lines) and len(lines[j]) >= 2:
                    # Verificar se o número de colunas é similar
                    if abs(len(lines[j]) - len(lines[i])) <= 1:
                        table_lines.append(lines[j])
                        j += 1
                    else:
                        break
                
                # Se encontrou pelo menos 3 linhas, considerar como tabela
                if len(table_lines) >= 3:
                    table_candidates.append(table_lines)
                    i = j
                else:
                    i += 1
            else:
                i += 1
        
        return table_candidates
    
    def _extract_table_data(self, table_lines: List[List[Any]]) -> List[List[str]]:
        """
        Extrair dados estruturados da tabela.
        
        Args:
            table_lines: Linhas da tabela candidata
            
        Returns:
            Dados da tabela como matriz
        """
        table_data = []
        
        for line in table_lines:
            row_data = [word['text'] for word in line]
            table_data.append(row_data)
        
        return table_data
    
    def _calculate_average_confidence(self, full_text: Any) -> float:
        """
        Calcular confiança média do OCR.
        
        Args:
            full_text: Resultado da Vision API
            
        Returns:
            Confiança média (0.0 a 1.0)
        """
        total_confidence = 0.0
        total_words = 0
        
        for page in full_text.pages:
            for block in page.blocks:
                for paragraph in block.paragraphs:
                    for word in paragraph.words:
                        total_confidence += word.confidence
                        total_words += 1
        
        return total_confidence / total_words if total_words > 0 else 0.0
    
    def _calculate_table_confidence(self, table_lines: List[List[Any]]) -> float:
        """
        Calcular confiança da detecção de tabela.
        
        Args:
            table_lines: Linhas da tabela
            
        Returns:
            Confiança da tabela
        """
        # Implementação simples baseada na consistência do número de colunas
        if not table_lines:
            return 0.0
        
        column_counts = [len(line) for line in table_lines]
        avg_columns = sum(column_counts) / len(column_counts)
        variance = sum((count - avg_columns) ** 2 for count in column_counts) / len(column_counts)
        
        # Menor variância = maior confiança
        confidence = max(0.0, 1.0 - (variance / avg_columns) if avg_columns > 0 else 0.0)
        
        return min(1.0, confidence)
    
    def _calculate_block_confidence(self, block: Any) -> float:
        """
        Calcular confiança de um bloco.
        
        Args:
            block: Bloco da Vision API
            
        Returns:
            Confiança do bloco
        """
        total_confidence = 0.0
        total_words = 0
        
        for paragraph in block.paragraphs:
            for word in paragraph.words:
                total_confidence += word.confidence
                total_words += 1
        
        return total_confidence / total_words if total_words > 0 else 0.0
    
    def _classify_block_type(self, text: str) -> str:
        """
        Classificar tipo do bloco baseado no conteúdo.
        
        Args:
            text: Texto do bloco
            
        Returns:
            Tipo do bloco (header, paragraph, list, etc.)
        """
        text = text.strip().lower()
        
        if not text:
            return 'empty'
        
        # Regras simples de classificação
        if len(text) < 50 and ('\n' not in text):
            return 'header'
        elif text.startswith(('•', '-', '*', '1.', '2.', '3.')):
            return 'list'
        elif len(text.split()) > 20:
            return 'paragraph'
        else:
            return 'text'
    
    def _detect_language(self, full_text: Any) -> str:
        """
        Detectar idioma principal do documento.
        
        Args:
            full_text: Resultado da Vision API
            
        Returns:
            Código do idioma detectado
        """
        # Implementação simples - em produção usar bibliotecas especializadas
        text_sample = full_text.text[:1000].lower()
        
        # Palavras comuns em português
        pt_words = ['de', 'da', 'do', 'para', 'com', 'por', 'em', 'na', 'no', 'que', 'se', 'o', 'a']
        pt_count = sum(1 for word in pt_words if word in text_sample)
        
        return 'pt' if pt_count >= 3 else 'unknown'
    
    def _generate_content_hash(self, content: bytes) -> str:
        """
        Gerar hash do conteúdo para cache.
        
        Args:
            content: Bytes do documento
            
        Returns:
            Hash MD5 do conteúdo
        """
        return hashlib.md5(content).hexdigest()
    
    def clear_cache(self):
        """Limpar cache do OCR."""
        self.cache.clear()
        logger.info("Cache OCR limpo")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obter estatísticas do cache."""
        return {
            'cache_size': len(self.cache),
            'supported_formats': self.supported_formats
        }
    
    def detect_forms(self, document_content: bytes) -> List[Dict[str, Any]]:
        """
        Detectar formulários e campos de entrada no documento.
        
        Args:
            document_content: Bytes do documento
            
        Returns:
            Lista de formulários detectados
        """
        try:
            # Preparar imagem para Vision API
            image = vision.Image(content=document_content)
            
            # Executar detecção de texto completa
            response = self.client.document_text_detection(image=image)
            
            if response.error.message:
                logger.error(f"Erro na Vision API: {response.error.message}")
                return []
            
            full_text = response.full_text_annotation
            if not full_text:
                return []
            
            forms = []
            
            for page_idx, page in enumerate(full_text.pages):
                # Detectar campos de formulário baseado em padrões
                form_fields = self._detect_form_fields(page)
                
                if form_fields:
                    forms.append({
                        'page': page_idx + 1,
                        'fields': form_fields,
                        'field_count': len(form_fields),
                        'confidence': self._calculate_form_confidence(form_fields)
                    })
            
            logger.info(f"Detectados {len(forms)} formulários")
            return forms
            
        except Exception as e:
            logger.error(f"Erro na detecção de formulários: {str(e)}")
            return []
    
    def _detect_form_fields(self, page: Any) -> List[Dict[str, Any]]:
        """
        Detectar campos de formulário em uma página.
        
        Args:
            page: Página da Vision API
            
        Returns:
            Lista de campos detectados
        """
        form_fields = []
        
        # Padrões que indicam campos de formulário
        field_patterns = [
            r'.*:.*_+',  # Campo: ________
            r'\[\s*\]',   # [ ] checkbox
            r'\(\s*\)',   # ( ) radio button
            r'.*:\s*$',   # Campo:
            r'__{3,}',    # _______ linha para preenchimento
        ]
        
        import re
        
        for block in page.blocks:
            for paragraph in block.paragraphs:
                paragraph_text = ""
                for word in paragraph.words:
                    word_text = "".join([symbol.text for symbol in word.symbols])
                    paragraph_text += word_text + " "
                
                paragraph_text = paragraph_text.strip()
                
                # Verificar se corresponde a padrões de formulário
                for pattern in field_patterns:
                    if re.search(pattern, paragraph_text):
                        # Extrair bounding box
                        vertices = paragraph.bounding_box.vertices
                        bbox = {
                            'x1': min(v.x for v in vertices),
                            'y1': min(v.y for v in vertices),
                            'x2': max(v.x for v in vertices),
                            'y2': max(v.y for v in vertices)
                        }
                        
                        form_fields.append({
                            'text': paragraph_text,
                            'type': self._classify_field_type(paragraph_text),
                            'bbox': bbox,
                            'confidence': self._calculate_block_confidence(block)
                        })
                        break
        
        return form_fields
    
    def _classify_field_type(self, text: str) -> str:
        """
        Classificar tipo de campo de formulário.
        
        Args:
            text: Texto do campo
            
        Returns:
            Tipo do campo
        """
        text_lower = text.lower()
        
        if '[' in text and ']' in text:
            return 'checkbox'
        elif '(' in text and ')' in text:
            return 'radio'
        elif '_' in text:
            return 'text_field'
        elif ':' in text:
            return 'label'
        else:
            return 'unknown'
    
    def _calculate_form_confidence(self, form_fields: List[Dict[str, Any]]) -> float:
        """
        Calcular confiança da detecção de formulário.
        
        Args:
            form_fields: Lista de campos detectados
            
        Returns:
            Confiança do formulário
        """
        if not form_fields:
            return 0.0
        
        total_confidence = sum(field['confidence'] for field in form_fields)
        avg_confidence = total_confidence / len(form_fields)
        
        # Bonus por número de campos (mais campos = mais provável ser formulário)
        field_bonus = min(0.2, len(form_fields) * 0.05)
        
        return min(1.0, avg_confidence + field_bonus)
    
    def extract_text_from_pdf_pages(self, pdf_content: bytes) -> List[OCRResult]:
        """
        Extrair texto de PDF multipáginas.
        
        Args:
            pdf_content: Bytes do PDF
            
        Returns:
            Lista de resultados OCR por página
        """
        try:
            # Converter PDF para imagens usando pdf2image
            from pdf2image import convert_from_bytes
            import io
            
            # Converter PDF para imagens
            images = convert_from_bytes(pdf_content)
            
            results = []
            
            for page_num, image in enumerate(images):
                logger.info(f"Processando página {page_num + 1}/{len(images)}")
                
                # Converter PIL Image para bytes
                img_byte_arr = io.BytesIO()
                image.save(img_byte_arr, format='PNG')
                img_bytes = img_byte_arr.getvalue()
                
                # Executar OCR na página
                page_result = self.extract_text_with_structure(
                    document_content=img_bytes,
                    preserve_layout=True
                )
                
                # Adicionar número da página aos metadados
                page_result.metadata['page_number'] = page_num + 1
                page_result.metadata['total_pages'] = len(images)
                
                results.append(page_result)
            
            logger.info(f"PDF processado: {len(images)} páginas")
            return results
            
        except ImportError:
            logger.error("pdf2image não instalado. Instale com: pip install pdf2image")
            raise Exception("Dependência pdf2image não encontrada")
        except Exception as e:
            logger.error(f"Erro no processamento de PDF: {str(e)}")
            raise