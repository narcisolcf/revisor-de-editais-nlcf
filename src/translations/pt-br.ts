export const ptBR = {
  auth: {
    welcome: "Bem-vindo de Volta",
    welcomeDescription: "Digite suas credenciais para acessar o sistema",
    createAccount: "Cadastrar Prefeitura",
    createAccountDescription: "Digite os dados da prefeitura para começar",
    email: "E-mail",
    password: "Senha",
    confirmPassword: "Confirmar Senha",
    prefectureName: "Nome da Prefeitura",
    cnpj: "CNPJ",
    login: "Entrar",
    signUp: "Criar Conta",
    alreadyHaveAccount: "Já tem conta? Faça login",
    noAccount: "Não tem conta? Cadastre-se",
    loginSuccess: "Login realizado com sucesso",
    accountCreated: "Conta criada com sucesso",
    accountCreatedDesc: "Faça login com sua nova conta",
    fillAllFields: "Preencha todos os campos",
    passwordsDontMatch: "As senhas não coincidem",
    invalidCnpj: "CNPJ inválido"
  },
  
  features: {
    title: "Sistema de Licitações Inteligente",
    subtitle: "Plataforma completa para análise e gestão de documentos licitatórios",
    automaticAnalysis: "Análise Automática",
    automaticAnalysisDesc: "IA avançada analisa editais e contratos identificando não conformidades automaticamente",
    advancedSecurity: "Segurança Avançada",
    advancedSecurityDesc: "Proteção de dados sensíveis com criptografia e controle de acesso rigoroso",
    completeHistory: "Histórico Completo",
    completeHistoryDesc: "Registro detalhado de todas as análises e modificações para auditoria"
  },

  documents: {
    title: "Análise de Documentos Licitatórios",
    subtitle: "Faça upload dos seus documentos para análise automatizada de conformidade",
    uploadArea: "Arraste e solte seus arquivos aqui ou clique para selecionar",
    supportedFormats: "Formatos suportados: PDF, DOCX (máx. 10MB)",
    or: "ou",
    selectFiles: "Selecionar Arquivos",
    analyzing: "Analisando documento...",
    analyze: "Analisar Documento",
    analysisResults: "Resultados da Análise",
    conformityScore: "Índice de Conformidade",
    problemsFound: "Problemas Encontrados",
    recommendations: "Recomendações",
    documentHistory: "Histórico de Documentos",
    historyDesc: "Visualize e gerencie todos os documentos analisados anteriormente",
    
    // Análise específica
    conformityChart: "Distribuição de Conformidade",
    conforming: "Conforme",
    nonConforming: "Não Conforme",
    needsReview: "Precisa Revisão",
    
    problemCategories: "Categorias de Problemas",
    legal: "Legal",
    technical: "Técnico",
    administrative: "Administrativo",
    financial: "Financeiro",
    
    findings: "Achados Detalhados",
    severity: "Gravidade",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
    suggestion: "Sugestão",
    
    // Mensagens de upload
    uploadSuccess: "Arquivo carregado com sucesso",
    uploadError: "Erro ao carregar arquivo",
    fileTooBig: "Arquivo muito grande. Máximo 10MB.",
    invalidFileType: "Tipo de arquivo inválido. Use PDF ou DOCX.",
    analysisComplete: "Análise concluída com sucesso",
    analysisError: "Erro durante a análise"
  },

  common: {
    loading: "Carregando...",
    error: "Erro",
    success: "Sucesso",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    edit: "Editar",
    view: "Visualizar",
    download: "Baixar",
    upload: "Carregar",
    close: "Fechar",
    back: "Voltar",
    next: "Próximo",
    previous: "Anterior",
    search: "Pesquisar",
    filter: "Filtrar",
    date: "Data",
    size: "Tamanho",
    status: "Status",
    actions: "Ações"
  },

  navigation: {
    home: "Início",
    documents: "Documentos", 
    analysis: "Análises",
    reports: "Relatórios",
    settings: "Configurações",
    logout: "Sair"
  }
};

export type TranslationKey = typeof ptBR;