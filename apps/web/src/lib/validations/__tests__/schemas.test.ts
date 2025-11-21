/**
 * Testes para Schemas de Validação Zod
 *
 * Testa:
 * - Validações de CNPJ e CPF
 * - Schemas de formulários
 * - Mensagens de erro customizadas
 * - Transformações de dados
 * - Validações compostas (refine)
 */

import { describe, it, expect } from 'vitest';
import {
  validateCNPJ,
  validateCPF,
  signUpSchema,
  loginSchema,
  documentSchema,
  comissaoSchema,
  profileSchema,
  changePasswordSchema,
  emailSchema,
  passwordSchema,
  cnpjSchema,
  cpfSchema
} from '../schemas';

describe('Validation Helpers', () => {
  describe('validateCNPJ', () => {
    it('deve validar CNPJ válido', () => {
      expect(validateCNPJ('11.222.333/0001-81')).toBe(true);
      expect(validateCNPJ('11222333000181')).toBe(true);
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(validateCNPJ('11.222.333/0001-80')).toBe(false); // Dígito errado
      expect(validateCNPJ('00.000.000/0000-00')).toBe(false); // Zeros
      expect(validateCNPJ('11.111.111/1111-11')).toBe(false); // Repetidos
    });

    it('deve rejeitar CNPJ com tamanho incorreto', () => {
      expect(validateCNPJ('11.222.333')).toBe(false);
      expect(validateCNPJ('123')).toBe(false);
    });
  });

  describe('validateCPF', () => {
    it('deve validar CPF válido', () => {
      expect(validateCPF('111.444.777-35')).toBe(true);
      expect(validateCPF('11144477735')).toBe(true);
    });

    it('deve rejeitar CPF inválido', () => {
      expect(validateCPF('111.444.777-36')).toBe(false); // Dígito errado
      expect(validateCPF('000.000.000-00')).toBe(false); // Zeros
      expect(validateCPF('111.111.111-11')).toBe(false); // Repetidos
    });

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(validateCPF('111.444')).toBe(false);
      expect(validateCPF('123')).toBe(false);
    });
  });
});

describe('Field Schemas', () => {
  describe('emailSchema', () => {
    it('deve validar email válido', () => {
      const result = emailSchema.safeParse('teste@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('teste@example.com');
      }
    });

    it('deve rejeitar email inválido', () => {
      expect(emailSchema.safeParse('').success).toBe(false);
      expect(emailSchema.safeParse('invalid').success).toBe(false);
      expect(emailSchema.safeParse('invalid@').success).toBe(false);
      expect(emailSchema.safeParse('@example.com').success).toBe(false);
    });

    it('deve normalizar email (lowercase e trim)', () => {
      const result = emailSchema.safeParse('  TEST@EXAMPLE.COM  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });
  });

  describe('passwordSchema', () => {
    it('deve validar senha forte', () => {
      expect(passwordSchema.safeParse('Senha123').success).toBe(true);
      expect(passwordSchema.safeParse('MyP@ssw0rd').success).toBe(true);
    });

    it('deve rejeitar senha fraca', () => {
      const weakPasswords = [
        'curta',        // Muito curta
        'semaiuscula123', // Sem maiúscula
        'SEMMINUSCULA123', // Sem minúscula
        'SemNumero',    // Sem número
      ];

      weakPasswords.forEach(password => {
        expect(passwordSchema.safeParse(password).success).toBe(false);
      });
    });

    it('deve validar tamanho da senha', () => {
      expect(passwordSchema.safeParse('Ab1').success).toBe(false); // Muito curta
      expect(passwordSchema.safeParse('A'.repeat(101) + '1a').success).toBe(false); // Muito longa
    });
  });

  describe('cnpjSchema', () => {
    it('deve validar e normalizar CNPJ', () => {
      const result = cnpjSchema.safeParse('11.222.333/0001-81');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('11222333000181'); // Remove formatação
      }
    });

    it('deve rejeitar CNPJ inválido', () => {
      expect(cnpjSchema.safeParse('').success).toBe(false);
      expect(cnpjSchema.safeParse('11.222.333/0001-80').success).toBe(false);
    });
  });

  describe('cpfSchema', () => {
    it('deve validar e normalizar CPF', () => {
      const result = cpfSchema.safeParse('111.444.777-35');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('11144477735'); // Remove formatação
      }
    });

    it('deve rejeitar CPF inválido', () => {
      expect(cpfSchema.safeParse('').success).toBe(false);
      expect(cpfSchema.safeParse('111.444.777-36').success).toBe(false);
    });
  });
});

describe('Entity Schemas', () => {
  describe('signUpSchema', () => {
    const validData = {
      prefectureName: 'Prefeitura Municipal de Teste',
      email: 'teste@prefeitura.gov.br',
      cnpj: '11.222.333/0001-81',
      password: 'Senha123',
      confirmPassword: 'Senha123'
    };

    it('deve validar dados válidos', () => {
      const result = signUpSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar nome de prefeitura muito curto', () => {
      const result = signUpSchema.safeParse({ ...validData, prefectureName: 'AB' });
      expect(result.success).toBe(false);
    });

    it('deve rejeitar email inválido', () => {
      const result = signUpSchema.safeParse({ ...validData, email: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('deve rejeitar CNPJ inválido', () => {
      const result = signUpSchema.safeParse({ ...validData, cnpj: '00.000.000/0000-00' });
      expect(result.success).toBe(false);
    });

    it('deve rejeitar senhas que não coincidem', () => {
      const result = signUpSchema.safeParse({
        ...validData,
        confirmPassword: 'SenhasDiferentes'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['confirmPassword']);
        expect(result.error.errors[0].message).toBe('As senhas não coincidem');
      }
    });
  });

  describe('loginSchema', () => {
    it('deve validar dados válidos', () => {
      const result = loginSchema.safeParse({
        email: 'teste@example.com',
        password: 'senha123'
      });
      expect(result.success).toBe(true);
    });

    it('deve rejeitar campos vazios', () => {
      expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'test@test.com', password: '' }).success).toBe(false);
    });
  });

  describe('documentSchema', () => {
    const validDoc = {
      title: 'Pregão Eletrônico nº 001/2025',
      number: '001/2025',
      type: 'pregao' as const,
      description: 'Contratação de serviços de limpeza'
    };

    it('deve validar documento válido', () => {
      const result = documentSchema.safeParse(validDoc);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar título muito curto', () => {
      const result = documentSchema.safeParse({ ...validDoc, title: 'Test' });
      expect(result.success).toBe(false);
    });

    it('deve rejeitar tipo inválido', () => {
      const result = documentSchema.safeParse({ ...validDoc, type: 'tipo_invalido' });
      expect(result.success).toBe(false);
    });

    it('deve aceitar campos opcionais vazios', () => {
      const result = documentSchema.safeParse({
        title: 'Pregão Eletrônico nº 001/2025',
        number: '001/2025',
        type: 'pregao' as const
      });
      expect(result.success).toBe(true);
    });
  });

  describe('comissaoSchema', () => {
    const validComissao = {
      name: 'Comissão Permanente de Licitação',
      type: 'licitacao' as const,
      members: [
        { name: 'João Silva', role: 'presidente' as const },
        { name: 'Maria Santos', role: 'membro' as const },
        { name: 'Pedro Oliveira', role: 'secretario' as const }
      ],
      active: true
    };

    it('deve validar comissão válida', () => {
      const result = comissaoSchema.safeParse(validComissao);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar comissão com menos de 3 membros', () => {
      const result = comissaoSchema.safeParse({
        ...validComissao,
        members: [
          { name: 'João Silva', role: 'presidente' as const },
          { name: 'Maria Santos', role: 'membro' as const }
        ]
      });
      expect(result.success).toBe(false);
    });

    it('deve rejeitar comissão com mais de 10 membros', () => {
      const members = Array.from({ length: 11 }, (_, i) => ({
        name: `Membro ${i + 1}`,
        role: 'membro' as const
      }));

      const result = comissaoSchema.safeParse({
        ...validComissao,
        members
      });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    const validData = {
      currentPassword: 'SenhaAtual123',
      newPassword: 'NovaSenha456',
      confirmNewPassword: 'NovaSenha456'
    };

    it('deve validar dados válidos', () => {
      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar se nova senha não coincide com confirmação', () => {
      const result = changePasswordSchema.safeParse({
        ...validData,
        confirmNewPassword: 'SenhaDiferente789'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['confirmNewPassword']);
      }
    });

    it('deve rejeitar se nova senha é igual à atual', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'MesmaSenha123',
        newPassword: 'MesmaSenha123',
        confirmNewPassword: 'MesmaSenha123'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('A nova senha deve ser diferente da atual');
      }
    });
  });
});
