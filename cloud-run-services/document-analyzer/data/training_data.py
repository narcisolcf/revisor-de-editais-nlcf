#!/usr/bin/env python3
"""
Dados de treinamento para classificação automática de documentos licitatórios.

Contém exemplos de texto de diferentes tipos de documentos para treinar
o modelo de machine learning.
"""

from typing import List, Tuple

# Dados de treinamento: (conteúdo_do_documento, tipo_documento)
TRAINING_DATA: List[Tuple[str, str]] = [
    # Editais de Licitação
    (
        """EDITAL DE LICITAÇÃO Nº 001/2024
        PREGÃO ELETRÔNICO
        PROCESSO LICITATÓRIO Nº 2024.001
        
        OBJETO: Aquisição de equipamentos de informática para modernização do parque tecnológico.
        MODALIDADE: Pregão Eletrônico
        VALOR ESTIMADO: R$ 150.000,00
        
        1. DO OBJETO
        1.1. A presente licitação tem por objeto a aquisição de equipamentos de informática conforme especificações técnicas constantes no Termo de Referência.
        
        2. DA MODALIDADE
        2.1. A licitação será realizada na modalidade PREGÃO ELETRÔNICO, do tipo MENOR PREÇO.
        
        3. DOS RECURSOS ORÇAMENTÁRIOS
        3.1. As despesas decorrentes da contratação correrão por conta dos recursos consignados no orçamento.""",
        "edital_licitacao"
    ),
    (
        """EDITAL DE CONCORRÊNCIA PÚBLICA Nº 005/2024
        
        OBJETO: Contratação de empresa especializada para execução de obras de pavimentação asfáltica.
        MODALIDADE: Concorrência Pública
        VALOR ESTIMADO: R$ 2.500.000,00
        
        A Prefeitura Municipal torna público que realizará licitação na modalidade CONCORRÊNCIA PÚBLICA, do tipo TÉCNICA E PREÇO, para contratação de empresa especializada em obras de pavimentação.
        
        1. DO OBJETO E REGIME DE EXECUÇÃO
        1.1. Constitui objeto da presente licitação a contratação de empresa para execução de obras de pavimentação asfáltica.
        1.2. O regime de execução será por EMPREITADA POR PREÇO GLOBAL.
        
        2. DA QUALIFICAÇÃO TÉCNICA
        2.1. Comprovação de aptidão para desempenho de atividade pertinente e compatível em características.""",
        "edital_licitacao"
    ),
    
    # Termos de Referência
    (
        """TERMO DE REFERÊNCIA
        
        1. OBJETO
        Este Termo de Referência tem por finalidade estabelecer as diretrizes para a contratação de serviços de consultoria em tecnologia da informação.
        
        2. JUSTIFICATIVA DA NECESSIDADE
        A contratação se justifica pela necessidade de modernização dos sistemas de gestão municipal, visando maior eficiência e transparência nos processos administrativos.
        
        3. DESCRIÇÃO DO OBJETO
        3.1. Consultoria especializada em análise de sistemas
        3.2. Desenvolvimento de soluções tecnológicas customizadas
        3.3. Treinamento de equipes técnicas
        
        4. ESPECIFICAÇÕES TÉCNICAS
        4.1. Os serviços deverão ser executados por profissionais com certificação em tecnologias Microsoft e Oracle.
        4.2. Experiência mínima de 5 anos em projetos similares.
        
        5. METODOLOGIA DE EXECUÇÃO
        Os trabalhos serão desenvolvidos seguindo metodologia ágil, com entregas incrementais.""",
        "termo_referencia"
    ),
    (
        """TERMO DE REFERÊNCIA - AQUISIÇÃO DE VEÍCULOS
        
        1. DO OBJETO
        Aquisição de veículos automotores para renovação da frota municipal.
        
        2. JUSTIFICATIVA DA NECESSIDADE
        A renovação da frota se faz necessária devido ao desgaste natural dos veículos em uso, que apresentam alto custo de manutenção e baixa eficiência operacional.
        
        3. ESPECIFICAÇÕES TÉCNICAS DOS VEÍCULOS
        3.1. Veículos de passeio: Motor 1.0 ou 1.4, flex, 4 portas
        3.2. Veículos utilitários: Capacidade mínima de 1000kg
        3.3. Garantia mínima de 3 anos
        
        4. CRITÉRIOS DE SUSTENTABILIDADE
        4.1. Preferência por veículos com menor emissão de poluentes
        4.2. Eficiência energética comprovada
        
        5. FORMA DE FORNECIMENTO
        Os veículos deverão ser entregues em até 90 dias após a assinatura do contrato.""",
        "termo_referencia"
    ),
    
    # Projetos Básicos
    (
        """PROJETO BÁSICO
        CONSTRUÇÃO DE UNIDADE BÁSICA DE SAÚDE
        
        1. MEMORIAL DESCRITIVO
        O presente projeto básico refere-se à construção de uma Unidade Básica de Saúde com área total de 300m².
        
        2. ESPECIFICAÇÕES TÉCNICAS
        2.1. Fundação: Sapata corrida em concreto armado
        2.2. Estrutura: Alvenaria estrutural em blocos cerâmicos
        2.3. Cobertura: Telhas cerâmicas sobre estrutura de madeira
        2.4. Instalações elétricas: Conforme NBR 5410
        2.5. Instalações hidrossanitárias: Conforme NBR 5626
        
        3. PLANILHA ORÇAMENTÁRIA
        3.1. Serviços preliminares: R$ 15.000,00
        3.2. Fundações: R$ 45.000,00
        3.3. Estrutura: R$ 120.000,00
        3.4. Cobertura: R$ 35.000,00
        3.5. Instalações: R$ 55.000,00
        TOTAL: R$ 270.000,00
        
        4. CRONOGRAMA FÍSICO
        Prazo total de execução: 8 meses""",
        "projeto_basico"
    ),
    (
        """PROJETO BÁSICO - REFORMA DE ESCOLA
        
        MEMORIAL DESCRITIVO E ESPECIFICAÇÕES TÉCNICAS
        
        1. OBJETO
        Reforma e ampliação da Escola Municipal, incluindo adequações de acessibilidade.
        
        2. DESCRIÇÃO DOS SERVIÇOS
        2.1. Demolições e remoções necessárias
        2.2. Adequação de instalações elétricas
        2.3. Pintura geral do prédio
        2.4. Instalação de rampas de acessibilidade
        2.5. Reforma dos banheiros
        
        3. MATERIAIS E ESPECIFICAÇÕES
        3.1. Tinta: Acrílica de primeira qualidade
        3.2. Pisos: Cerâmico antiderrapante
        3.3. Portas: Madeira maciça com ferragens
        
        4. PLANILHA ORÇAMENTÁRIA RESUMIDA
        Valor total estimado: R$ 180.000,00
        
        5. CRONOGRAMA FÍSICO-FINANCEIRO
        Prazo de execução: 4 meses""",
        "projeto_basico"
    ),
    
    # Pregões Eletrônicos
    (
        """PREGÃO ELETRÔNICO Nº 010/2024
        
        OBJETO: Registro de preços para aquisição de material de limpeza e higiene.
        SISTEMA: ComprasNet
        LANCE INICIAL: Conforme valores de referência
        
        1. DA SESSÃO PÚBLICA
        1.1. A sessão pública do pregão eletrônico será realizada no sistema ComprasNet.
        1.2. Data de abertura: 15/03/2024 às 14:00h
        
        2. DA FASE DE LANCES
        2.1. Iniciada a fase de lances, os licitantes poderão encaminhar lances exclusivamente por meio do sistema eletrônico.
        2.2. O sistema ordenará automaticamente os lances em ordem crescente de valores.
        
        3. DO SISTEMA DE REGISTRO DE PREÇOS
        3.1. Será adotado o Sistema de Registro de Preços para as aquisições.
        3.2. A ata de registro de preços terá validade de 12 meses.
        
        4. DOS ITENS
        Item 1: Papel higiênico - 1000 unidades
        Item 2: Detergente neutro - 500 litros
        Item 3: Álcool em gel - 200 litros""",
        "pregao_eletronico"
    ),
    
    # Atas de Registro de Preços
    (
        """ATA DE REGISTRO DE PREÇOS Nº 015/2024
        
        VALIDADE DA ATA: 12 meses
        FORNECEDOR REGISTRADO: Empresa XYZ Ltda
        OBJETO: Fornecimento de combustíveis
        
        O MUNICÍPIO, por intermédio da Secretaria de Administração, nos termos da Lei nº 8.666/93, Lei nº 10.520/02 e demais normas legais aplicáveis, em face da classificação das propostas apresentadas no Pregão Eletrônico nº 008/2024, RESOLVE registrar os preços da empresa classificada em primeiro lugar.
        
        CLÁUSULA PRIMEIRA - DO OBJETO
        1.1. A presente Ata tem por objeto o registro de preços para eventual fornecimento de combustíveis.
        
        CLÁUSULA SEGUNDA - DA VALIDADE DOS PREÇOS
        2.1. A presente Ata de Registro de Preços terá validade de 12 meses.
        
        CLÁUSULA TERCEIRA - DOS PREÇOS REGISTRADOS
        Item 1: Gasolina comum - R$ 5,45 por litro
        Item 2: Etanol - R$ 3,89 por litro
        Item 3: Óleo diesel - R$ 4,12 por litro
        
        CLÁUSULA QUARTA - DAS CONDIÇÕES DE FORNECIMENTO
        4.1. O fornecimento será conforme demanda e mediante emissão de ordem de fornecimento.""",
        "ata_registro_precos"
    ),
    
    # Contratos
    (
        """CONTRATO Nº 025/2024
        
        CONTRATANTE: Município de São Paulo
        CONTRATADA: Construtora ABC Ltda
        OBJETO: Execução de obras de pavimentação
        VALOR: R$ 850.000,00
        
        O MUNICÍPIO DE SÃO PAULO, pessoa jurídica de direito público interno, inscrito no CNPJ sob nº 46.395.000/0001-39, neste ato representado pelo Prefeito, e a empresa CONSTRUTORA ABC LTDA, inscrita no CNPJ sob nº 12.345.678/0001-90, celebram o presente CONTRATO.
        
        CLÁUSULA PRIMEIRA - DO OBJETO
        1.1. O objeto do presente contrato é a execução de obras de pavimentação asfáltica conforme projeto básico.
        
        CLÁUSULA SEGUNDA - DO VALOR E FORMA DE PAGAMENTO
        2.1. O valor total do contrato é de R$ 850.000,00 (oitocentos e cinquenta mil reais).
        2.2. O pagamento será efetuado em parcelas mensais mediante apresentação de nota fiscal.
        
        CLÁUSULA TERCEIRA - DO PRAZO
        3.1. O prazo de execução é de 6 meses, contados da data de assinatura.
        
        CLÁUSULA QUARTA - DAS OBRIGAÇÕES
        4.1. A CONTRATADA obriga-se a executar os serviços conforme especificações técnicas.""",
        "contrato"
    ),
    
    # Aditivos Contratuais
    (
        """PRIMEIRO TERMO ADITIVO AO CONTRATO Nº 025/2024
        
        ADITIVO CONTRATUAL
        OBJETO: Prorrogação de prazo e acréscimo de valor
        
        O MUNICÍPIO e a CONTRATADA, qualificados no contrato original, celebram o presente TERMO ADITIVO.
        
        CLÁUSULA PRIMEIRA - DA PRORROGAÇÃO DE PRAZO
        1.1. Fica prorrogado o prazo de execução do contrato por mais 60 dias.
        1.2. O novo prazo de conclusão será 30/12/2024.
        
        CLÁUSULA SEGUNDA - DO ACRÉSCIMO DE VALOR
        2.1. Fica acrescido ao valor original o montante de R$ 85.000,00.
        2.2. O novo valor total do contrato passa a ser R$ 935.000,00.
        
        CLÁUSULA TERCEIRA - DA JUSTIFICATIVA
        3.1. A prorrogação se justifica devido às condições climáticas adversas.
        3.2. O acréscimo decorre de serviços extras necessários.
        
        CLÁUSULA QUARTA - DAS DEMAIS CLÁUSULAS
        4.1. Permanecem inalteradas as demais cláusulas do contrato original.""",
        "aditivo_contratual"
    ),
    
    # Tomada de Preços
    (
        """TOMADA DE PREÇOS Nº 003/2024
        
        OBJETO: Contratação de empresa para fornecimento e instalação de equipamentos de segurança.
        MODALIDADE: Tomada de Preços
        VALOR ESTIMADO: R$ 75.000,00
        
        A Administração Pública torna público que realizará licitação na modalidade TOMADA DE PREÇOS, do tipo MENOR PREÇO.
        
        1. DO OBJETO
        1.1. Constitui objeto da presente licitação a contratação de empresa para fornecimento e instalação de sistema de segurança eletrônica.
        
        2. DA HABILITAÇÃO
        2.1. Para participar desta licitação, o interessado deverá estar previamente cadastrado no sistema de cadastramento de fornecedores.
        2.2. Comprovação de regularidade fiscal e trabalhista.
        
        3. DOS DOCUMENTOS DE HABILITAÇÃO
        3.1. Habilitação jurídica
        3.2. Qualificação técnica
        3.3. Qualificação econômico-financeira
        3.4. Regularidade fiscal
        
        4. DO JULGAMENTO
        4.1. O julgamento será pelo critério de MENOR PREÇO GLOBAL.""",
        "tomada_precos"
    ),
    
    # Concorrência
    (
        """CONCORRÊNCIA PÚBLICA Nº 002/2024
        
        OBJETO: Concessão de uso de bem público para exploração de estacionamento.
        MODALIDADE: Concorrência
        TIPO: Maior lance ou oferta
        
        O MUNICÍPIO torna público que realizará licitação na modalidade CONCORRÊNCIA, do tipo MAIOR LANCE OU OFERTA.
        
        1. DO OBJETO
        1.1. Concessão de uso de área pública para exploração de serviços de estacionamento rotativo.
        1.2. Área total: 2.000 m²
        1.3. Prazo da concessão: 10 anos
        
        2. DAS CONDIÇÕES DE PARTICIPAÇÃO
        2.1. Poderão participar empresas do ramo de atividade pertinente ao objeto.
        2.2. Comprovação de capacidade técnica e econômica.
        
        3. DO JULGAMENTO
        3.1. Será vencedora a proposta que oferecer o maior valor mensal de outorga.
        3.2. Valor mínimo de lance: R$ 5.000,00 mensais.
        
        4. DA PROPOSTA
        4.1. A proposta deverá conter o valor mensal da outorga e plano de exploração.""",
        "concorrencia"
    ),
    
    # Convite
    (
        """CONVITE Nº 008/2024
        
        OBJETO: Aquisição de materiais de construção para pequenos reparos.
        MODALIDADE: Convite
        VALOR ESTIMADO: R$ 12.000,00
        
        A Secretaria de Obras convida as empresas abaixo relacionadas para participarem da licitação na modalidade CONVITE.
        
        EMPRESAS CONVIDADAS:
        - Materiais de Construção Silva Ltda
        - Depósito de Materiais Santos
        - Casa de Materiais Oliveira
        
        1. DO OBJETO
        1.1. Aquisição de materiais de construção diversos para manutenção predial.
        
        2. DA ENTREGA DAS PROPOSTAS
        2.1. As propostas deverão ser entregues até o dia 20/03/2024 às 14:00h.
        2.2. Local: Protocolo da Secretaria de Obras
        
        3. DO JULGAMENTO
        3.1. Será vencedora a proposta de menor preço global.
        
        4. DOS ITENS
        Item 1: Cimento CP-II 50kg - 100 sacos
        Item 2: Areia média - 10 m³
        Item 3: Brita nº 1 - 5 m³""",
        "convite"
    ),
    
    # Dispensa de Licitação
    (
        """PROCESSO DE DISPENSA DE LICITAÇÃO Nº 045/2024
        
        OBJETO: Contratação emergencial de serviços de dedetização.
        FUNDAMENTO LEGAL: Art. 24, IV da Lei 8.666/93
        VALOR: R$ 8.500,00
        
        JUSTIFICATIVA DA DISPENSA:
        A presente contratação se enquadra na hipótese de dispensa de licitação prevista no art. 24, inciso IV, da Lei nº 8.666/93, tendo em vista a situação de emergência caracterizada pela infestação de pragas urbanas no prédio da Secretaria de Saúde.
        
        1. DA SITUAÇÃO EMERGENCIAL
        1.1. Foi constatada grave infestação de roedores e insetos no prédio.
        1.2. A situação compromete a salubridade do ambiente de trabalho.
        1.3. Há risco iminente à saúde dos servidores e usuários.
        
        2. DA URGÊNCIA
        2.1. A demora na contratação pode agravar o problema.
        2.2. Não há tempo hábil para realização de procedimento licitatório.
        
        3. DA CONTRATAÇÃO
        3.1. Será contratada empresa especializada em controle de pragas.
        3.2. Os serviços deverão ser iniciados imediatamente.
        
        4. DA RATIFICAÇÃO
        4.1. A presente dispensa deverá ser ratificada pela autoridade competente.""",
        "dispensa_licitacao"
    ),
    
    # Inexigibilidade
    (
        """PROCESSO DE INEXIGIBILIDADE DE LICITAÇÃO Nº 012/2024
        
        OBJETO: Contratação de artista para apresentação cultural.
        FUNDAMENTO LEGAL: Art. 25, III da Lei 8.666/93
        VALOR: R$ 15.000,00
        
        JUSTIFICATIVA DA INEXIGIBILIDADE:
        A presente contratação enquadra-se na hipótese de inexigibilidade de licitação prevista no art. 25, inciso III, da Lei nº 8.666/93, por tratar-se de serviços de natureza singular com profissionais de notória especialização.
        
        1. DA NATUREZA SINGULAR
        1.1. Contratação do cantor João Silva para apresentação no festival de inverno.
        1.2. Trata-se de serviço de natureza artística e singular.
        1.3. Não há possibilidade de competição.
        
        2. DA NOTÓRIA ESPECIALIZAÇÃO
        2.1. O artista possui reconhecimento nacional em sua área.
        2.2. Curriculum vitae comprova a especialização.
        2.3. Premiações e reconhecimentos obtidos.
        
        3. DA JUSTIFICATIVA DE PREÇO
        3.1. O valor está compatível com o praticado no mercado.
        3.2. Foram obtidas informações de cachês similares.
        
        4. DA RATIFICAÇÃO
        4.1. A presente inexigibilidade deverá ser ratificada pela autoridade superior.""",
        "inexigibilidade"
    )
]

def get_training_data() -> List[Tuple[str, str]]:
    """Retorna os dados de treinamento."""
    return TRAINING_DATA

def get_document_types() -> List[str]:
    """Retorna lista de tipos de documento disponíveis."""
    return list(set(label for _, label in TRAINING_DATA))

def get_samples_by_type(doc_type: str) -> List[str]:
    """Retorna amostras de um tipo específico de documento."""
    return [content for content, label in TRAINING_DATA if label == doc_type]

def get_training_stats() -> dict:
    """Retorna estatísticas dos dados de treinamento."""
    from collections import Counter
    
    type_counts = Counter(label for _, label in TRAINING_DATA)
    
    return {
        'total_samples': len(TRAINING_DATA),
        'document_types': len(type_counts),
        'samples_per_type': dict(type_counts),
        'min_samples': min(type_counts.values()),
        'max_samples': max(type_counts.values()),
        'avg_samples': sum(type_counts.values()) / len(type_counts)
    }

if __name__ == '__main__':
    # Exibir estatísticas dos dados
    stats = get_training_stats()
    print("=== Estatísticas dos Dados de Treinamento ===")
    print(f"Total de amostras: {stats['total_samples']}")
    print(f"Tipos de documento: {stats['document_types']}")
    print(f"Amostras por tipo:")
    for doc_type, count in stats['samples_per_type'].items():
        print(f"  {doc_type}: {count}")
    print(f"Mínimo de amostras: {stats['min_samples']}")
    print(f"Máximo de amostras: {stats['max_samples']}")
    print(f"Média de amostras: {stats['avg_samples']:.1f}")