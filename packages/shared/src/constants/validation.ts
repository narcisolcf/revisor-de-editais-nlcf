/**
 * Constantes para validação
 */

// Expressões regulares
export const REGEX = {
  // Documentos brasileiros
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CPF_NUMBERS_ONLY: /^\d{11}$/,
  CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  CNPJ_NUMBERS_ONLY: /^\d{14}$/,
  
  // Endereço
  CEP: /^\d{5}-\d{3}$/,
  CEP_NUMBERS_ONLY: /^\d{8}$/,
  
  // Telefone
  PHONE_BR: /^\+55\s?\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/,
  PHONE_BR_SIMPLE: /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/,
  MOBILE_BR: /^\(?\d{2}\)?\s?9\d{4}-?\d{4}$/,
  LANDLINE_BR: /^\(?\d{2}\)?\s?[2-5]\d{3}-?\d{4}$/,
  
  // Email
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Senha
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  // Texto
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_SPACES: /^[a-zA-Z0-9\s]+$/,
  LETTERS_ONLY: /^[a-zA-ZÀ-ÿ\s]+$/,
  NUMBERS_ONLY: /^\d+$/,
  
  // URL
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Arquivo
  FILE_NAME: /^[a-zA-Z0-9._-]+$/,
  
  // UUID
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;

// Mensagens de validação
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_FORMAT: 'Formato inválido',
  INVALID_EMAIL: 'Email inválido',
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_CEP: 'CEP inválido',
  INVALID_PHONE: 'Telefone inválido',
  INVALID_URL: 'URL inválida',
  INVALID_UUID: 'UUID inválido',
  
  // Tamanho
  MIN_LENGTH: (min: number) => `Deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  EXACT_LENGTH: (length: number) => `Deve ter exatamente ${length} caracteres`,
  
  // Números
  MIN_VALUE: (min: number) => `Deve ser maior ou igual a ${min}`,
  MAX_VALUE: (max: number) => `Deve ser menor ou igual a ${max}`,
  POSITIVE_NUMBER: 'Deve ser um número positivo',
  INTEGER: 'Deve ser um número inteiro',
  
  // Data
  INVALID_DATE: 'Data inválida',
  FUTURE_DATE: 'Data deve ser no futuro',
  PAST_DATE: 'Data deve ser no passado',
  DATE_RANGE: 'Data fora do intervalo permitido',
  
  // Arquivo
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido',
  FILE_TOO_LARGE: (maxSize: string) => `Arquivo muito grande. Tamanho máximo: ${maxSize}`,
  TOO_MANY_FILES: (max: number) => `Muitos arquivos. Máximo permitido: ${max}`,
  
  // Senha
  WEAK_PASSWORD: 'Senha deve conter pelo menos: 8 caracteres, 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo',
  PASSWORD_MISMATCH: 'Senhas não coincidem',
  
  // Específicos do domínio
  ORGANIZATION_NAME_EXISTS: 'Nome da organização já existe',
  USER_EMAIL_EXISTS: 'Email já está em uso',
  DOCUMENT_TITLE_EXISTS: 'Título do documento já existe nesta organização',
  INVALID_ORGANIZATION_TYPE: 'Tipo de organização inválido',
  INVALID_USER_ROLE: 'Papel de usuário inválido',
  INVALID_ANALYSIS_TYPE: 'Tipo de análise inválido'
} as const;

// Limites de validação
export const VALIDATION_LIMITS = {
  // Texto
  NAME: { MIN: 2, MAX: 100 },
  TITLE: { MIN: 3, MAX: 200 },
  DESCRIPTION: { MIN: 10, MAX: 1000 },
  COMMENT: { MIN: 1, MAX: 500 },
  
  // Email
  EMAIL: { MIN: 5, MAX: 254 },
  
  // Senha
  PASSWORD: { MIN: 8, MAX: 128 },
  
  // Telefone
  PHONE: { MIN: 10, MAX: 15 },
  
  // Endereço
  ADDRESS_LINE: { MIN: 5, MAX: 200 },
  CITY: { MIN: 2, MAX: 100 },
  STATE: { MIN: 2, MAX: 50 },
  COUNTRY: { MIN: 2, MAX: 50 },
  
  // Organização
  ORGANIZATION_NAME: { MIN: 3, MAX: 100 },
  ORGANIZATION_DESCRIPTION: { MIN: 10, MAX: 500 },
  
  // Documento
  DOCUMENT_TITLE: { MIN: 5, MAX: 200 },
  DOCUMENT_DESCRIPTION: { MIN: 10, MAX: 1000 },
  
  // Arquivo
  FILE_NAME: { MIN: 1, MAX: 255 },
  
  // Números
  PAGE_SIZE: { MIN: 1, MAX: 100 },
  PRIORITY: { MIN: 1, MAX: 5 },
  PERCENTAGE: { MIN: 0, MAX: 100 }
} as const;

// Estados brasileiros
export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
] as const;

// DDDs brasileiros válidos
export const BRAZILIAN_AREA_CODES = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
  '21', '22', '24', // RJ
  '27', '28', // ES
  '31', '32', '33', '34', '35', '37', '38', // MG
  '41', '42', '43', '44', '45', '46', // PR
  '47', '48', '49', // SC
  '51', '53', '54', '55', // RS
  '61', // DF
  '62', '64', // GO
  '63', // TO
  '65', '66', // MT
  '67', // MS
  '68', // AC
  '69', // RO
  '71', '73', '74', '75', '77', // BA
  '79', // SE
  '81', '87', // PE
  '82', // AL
  '83', // PB
  '84', // RN
  '85', '88', // CE
  '86', '89', // PI
  '91', '93', '94', // PA
  '92', '97', // AM
  '95', // RR
  '96', // AP
  '98', '99' // MA
] as const;

// Tipos de arquivo permitidos
export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/rtf'
  ],
  IMAGES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ],
  SPREADSHEETS: [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ]
} as const;

// Extensões de arquivo
export const FILE_EXTENSIONS = {
  PDF: '.pdf',
  DOC: '.doc',
  DOCX: '.docx',
  TXT: '.txt',
  RTF: '.rtf',
  XLS: '.xls',
  XLSX: '.xlsx',
  CSV: '.csv',
  JPG: '.jpg',
  JPEG: '.jpeg',
  PNG: '.png',
  GIF: '.gif',
  WEBP: '.webp'
} as const;