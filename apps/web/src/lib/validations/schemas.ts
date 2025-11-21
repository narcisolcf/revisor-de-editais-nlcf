/**
 * Validation Schemas com Zod
 *
 * Schemas reutilizáveis para validação de formulários em toda a aplicação.
 * Integra com React Hook Form via @hookform/resolvers/zod.
 */

import { z } from 'zod';

// ========================================
// Helpers e Validações Customizadas
// ========================================

/**
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 */
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // Números repetidos

  // Validação do primeiro dígito verificador
  let sum = 0;
  let factor = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 2 ? 9 : factor - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj[12])) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  factor = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * factor;
    factor = factor === 2 ? 9 : factor - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj[13])) return false;

  return true;
}

/**
 * Valida CPF (Cadastro de Pessoas Físicas)
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Números repetidos

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[10])) return false;

  return true;
}

// ========================================
// Schemas de Campos Comuns
// ========================================

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail inválido')
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(6, 'A senha deve ter no mínimo 6 caracteres')
  .max(100, 'A senha deve ter no máximo 100 caracteres')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
  );

export const simplePasswordSchema = z
  .string()
  .min(6, 'A senha deve ter no mínimo 6 caracteres')
  .max(100, 'A senha deve ter no máximo 100 caracteres');

export const cnpjSchema = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .transform(val => val.replace(/[^\d]/g, ''))
  .refine(validateCNPJ, 'CNPJ inválido');

export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .transform(val => val.replace(/[^\d]/g, ''))
  .refine(validateCPF, 'CPF inválido');

export const phoneSchema = z
  .string()
  .min(1, 'Telefone é obrigatório')
  .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido. Use o formato (XX) XXXXX-XXXX');

export const cepSchema = z
  .string()
  .min(1, 'CEP é obrigatório')
  .regex(/^\d{5}-\d{3}$/, 'CEP inválido. Use o formato XXXXX-XXX');

// ========================================
// Schemas de Entidades
// ========================================

/**
 * Schema para Cadastro de Usuário
 */
export const signUpSchema = z
  .object({
    prefectureName: z
      .string()
      .min(3, 'Nome da prefeitura deve ter no mínimo 3 caracteres')
      .max(100, 'Nome da prefeitura deve ter no máximo 100 caracteres')
      .trim(),
    email: emailSchema,
    cnpj: cnpjSchema,
    password: simplePasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword']
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Schema para Login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória')
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema para Documento/Edital
 */
export const documentSchema = z.object({
  title: z
    .string()
    .min(5, 'Título deve ter no mínimo 5 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres')
    .trim(),
  number: z
    .string()
    .min(1, 'Número do edital é obrigatório')
    .max(50, 'Número do edital deve ter no máximo 50 caracteres')
    .trim(),
  type: z.enum(['licitacao', 'pregao', 'dispensa', 'inexigibilidade'], {
    errorMap: () => ({ message: 'Tipo de documento inválido' })
  }),
  description: z
    .string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .trim()
    .optional(),
  value: z
    .number({
      required_error: 'Valor é obrigatório',
      invalid_type_error: 'Valor deve ser um número'
    })
    .positive('Valor deve ser positivo')
    .optional(),
  deadline: z
    .date({
      required_error: 'Prazo é obrigatório',
      invalid_type_error: 'Data inválida'
    })
    .refine((date) => date > new Date(), 'A data deve ser futura')
    .optional()
});

export type DocumentFormData = z.infer<typeof documentSchema>;

/**
 * Schema para Comissão
 */
export const comissaoSchema = z.object({
  name: z
    .string()
    .min(5, 'Nome deve ter no mínimo 5 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  type: z.enum(['licitacao', 'pregao', 'credenciamento'], {
    errorMap: () => ({ message: 'Tipo de comissão inválido' })
  }),
  members: z
    .array(
      z.object({
        name: z.string().min(3, 'Nome do membro é obrigatório'),
        role: z.enum(['presidente', 'membro', 'secretario']),
        cpf: cpfSchema.optional()
      })
    )
    .min(3, 'A comissão deve ter no mínimo 3 membros')
    .max(10, 'A comissão deve ter no máximo 10 membros'),
  active: z.boolean().default(true)
});

export type ComissaoFormData = z.infer<typeof comissaoSchema>;

/**
 * Schema para Perfil de Usuário
 */
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: emailSchema,
  phone: phoneSchema.optional(),
  organizationName: z.string().max(100).trim().optional(),
  cnpj: cnpjSchema.optional()
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Schema para Alteração de Senha
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmNewPassword']
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da atual',
    path: ['newPassword']
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
