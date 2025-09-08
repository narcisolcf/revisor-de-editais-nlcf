/**
 * Validadores comuns usando Zod
 */

import { z } from 'zod';
import { 
  REGEX, 
  VALIDATION_MESSAGES, 
  VALIDATION_LIMITS,
  BRAZILIAN_STATES,
  BRAZILIAN_AREA_CODES,
  ALLOWED_FILE_TYPES
} from '../constants/validation';

// Validadores básicos
export const idSchema = z.string().uuid(VALIDATION_MESSAGES.INVALID_UUID);

export const emailSchema = z
  .string()
  .min(VALIDATION_LIMITS.EMAIL.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.EMAIL.MIN))
  .max(VALIDATION_LIMITS.EMAIL.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.EMAIL.MAX))
  .regex(REGEX.EMAIL, VALIDATION_MESSAGES.INVALID_EMAIL);

export const passwordSchema = z
  .string()
  .min(VALIDATION_LIMITS.PASSWORD.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.PASSWORD.MIN))
  .max(VALIDATION_LIMITS.PASSWORD.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.PASSWORD.MAX))
  .regex(REGEX.PASSWORD_STRONG, VALIDATION_MESSAGES.WEAK_PASSWORD);

export const nameSchema = z
  .string()
  .min(VALIDATION_LIMITS.NAME.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.NAME.MIN))
  .max(VALIDATION_LIMITS.NAME.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.NAME.MAX))
  .regex(REGEX.LETTERS_ONLY, VALIDATION_MESSAGES.INVALID_FORMAT);

export const titleSchema = z
  .string()
  .min(VALIDATION_LIMITS.TITLE.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.TITLE.MIN))
  .max(VALIDATION_LIMITS.TITLE.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.TITLE.MAX));

export const descriptionSchema = z
  .string()
  .min(VALIDATION_LIMITS.DESCRIPTION.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.DESCRIPTION.MIN))
  .max(VALIDATION_LIMITS.DESCRIPTION.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.DESCRIPTION.MAX));

export const urlSchema = z
  .string()
  .regex(REGEX.URL, VALIDATION_MESSAGES.INVALID_URL);

// Validadores de documentos brasileiros
export const cpfSchema = z
  .string()
  .refine((value) => {
    // Remove formatação
    const cleanCpf = value.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;
    
    // Verifica se não são todos iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;
    
    return true;
  }, VALIDATION_MESSAGES.INVALID_CPF);

export const cnpjSchema = z
  .string()
  .refine((value) => {
    // Remove formatação
    const cleanCnpj = value.replace(/\D/g, '');
    
    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;
    
    // Verifica se não são todos iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;
    
    // Validação dos dígitos verificadores
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * (weights1[i] || 0);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCnpj.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCnpj.charAt(i)) * (weights2[i] || 0);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCnpj.charAt(13))) return false;
    
    return true;
  }, VALIDATION_MESSAGES.INVALID_CNPJ);

export const cepSchema = z
  .string()
  .refine((value) => {
    const cleanCep = value.replace(/\D/g, '');
    return cleanCep.length === 8;
  }, VALIDATION_MESSAGES.INVALID_CEP);

// Validadores de telefone
export const phoneSchema = z
  .string()
  .refine((value) => {
    const cleanPhone = value.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos (com DDD)
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return false;
    
    // Verifica se o DDD é válido
    const areaCode = cleanPhone.substring(0, 2);
    if (!BRAZILIAN_AREA_CODES.includes(areaCode as typeof BRAZILIAN_AREA_CODES[number])) return false;
    
    // Para celular (11 dígitos), o terceiro dígito deve ser 9
    if (cleanPhone.length === 11 && cleanPhone.charAt(2) !== '9') return false;
    
    // Para fixo (10 dígitos), o terceiro dígito deve ser 2, 3, 4 ou 5
    if (cleanPhone.length === 10 && !['2', '3', '4', '5'].includes(cleanPhone.charAt(2))) return false;
    
    return true;
  }, VALIDATION_MESSAGES.INVALID_PHONE);

// Validadores de endereço
export const addressSchema = z.object({
  street: z
    .string()
    .min(VALIDATION_LIMITS.ADDRESS_LINE.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.ADDRESS_LINE.MIN))
    .max(VALIDATION_LIMITS.ADDRESS_LINE.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.ADDRESS_LINE.MAX)),
  number: z.string().min(1, VALIDATION_MESSAGES.REQUIRED),
  complement: z.string().optional(),
  neighborhood: z
    .string()
    .min(2, VALIDATION_MESSAGES.MIN_LENGTH(2))
    .max(100, VALIDATION_MESSAGES.MAX_LENGTH(100)),
  city: z
    .string()
    .min(VALIDATION_LIMITS.CITY.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.CITY.MIN))
    .max(VALIDATION_LIMITS.CITY.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.CITY.MAX)),
  state: z.enum(BRAZILIAN_STATES, {
    errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_FORMAT })
  }),
  zipCode: cepSchema,
  country: z
    .string()
    .min(VALIDATION_LIMITS.COUNTRY.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.COUNTRY.MIN))
    .max(VALIDATION_LIMITS.COUNTRY.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.COUNTRY.MAX))
    .default('Brasil')
});

// Validadores de paginação
export const paginationSchema = z.object({
  page: z
    .number()
    .int(VALIDATION_MESSAGES.INTEGER)
    .min(1, VALIDATION_MESSAGES.MIN_VALUE(1))
    .default(1),
  limit: z
    .number()
    .int(VALIDATION_MESSAGES.INTEGER)
    .min(VALIDATION_LIMITS.PAGE_SIZE.MIN, VALIDATION_MESSAGES.MIN_VALUE(VALIDATION_LIMITS.PAGE_SIZE.MIN))
    .max(VALIDATION_LIMITS.PAGE_SIZE.MAX, VALIDATION_MESSAGES.MAX_VALUE(VALIDATION_LIMITS.PAGE_SIZE.MAX))
    .default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// Validadores de arquivo
export const fileSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_LIMITS.FILE_NAME.MIN, VALIDATION_MESSAGES.MIN_LENGTH(VALIDATION_LIMITS.FILE_NAME.MIN))
    .max(VALIDATION_LIMITS.FILE_NAME.MAX, VALIDATION_MESSAGES.MAX_LENGTH(VALIDATION_LIMITS.FILE_NAME.MAX)),
  size: z
    .number()
    .int(VALIDATION_MESSAGES.INTEGER)
    .min(1, VALIDATION_MESSAGES.MIN_VALUE(1))
    .max(50 * 1024 * 1024, VALIDATION_MESSAGES.FILE_TOO_LARGE('50MB')),
  type: z
    .string()
    .refine(
      (type) => [
        ...ALLOWED_FILE_TYPES.DOCUMENTS,
        ...ALLOWED_FILE_TYPES.IMAGES,
        ...ALLOWED_FILE_TYPES.SPREADSHEETS
      ].includes(type as any),
      VALIDATION_MESSAGES.INVALID_FILE_TYPE
    )
});

// Validadores de data
export const dateSchema = z.date({
  errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_DATE })
});

export const futureDateSchema = z
  .date()
  .refine(
    (date) => date > new Date(),
    VALIDATION_MESSAGES.FUTURE_DATE
  );

export const pastDateSchema = z
  .date()
  .refine(
    (date) => date < new Date(),
    VALIDATION_MESSAGES.PAST_DATE
  );

// Validadores de filtro
export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
}).catchall(z.union([z.string(), z.number(), z.boolean()]).optional());

// Validador de resultado
export const resultSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional()
  }).optional()
});

// Validador de resposta paginada
export const paginatedResponseSchema = <T>(dataSchema: z.ZodSchema<T>) => z.object({
  data: z.array(dataSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
});