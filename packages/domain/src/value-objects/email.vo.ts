import { z } from 'zod';
import { DomainError } from '../errors/domain.error';

/**
 * Value Object para Email
 * Garante que o email seja válido e imutável
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Criar Email a partir de string
   */
  public static create(value: string): Email {
    const schema = z.string()
      .email('Email deve ter formato válido')
      .min(5, 'Email deve ter pelo menos 5 caracteres')
      .max(254, 'Email não pode ter mais de 254 caracteres')
      .toLowerCase();
    
    try {
      const validatedValue = schema.parse(value.trim());
      return new Email(validatedValue);
    } catch (error) {
      throw new DomainError(`Email inválido: ${value}`);
    }
  }

  /**
   * Verificar se email pertence a domínio específico
   */
  public belongsToDomain(domain: string): boolean {
    return this._value.endsWith(`@${domain.toLowerCase()}`);
  }

  /**
   * Obter domínio do email
   */
  public getDomain(): string {
    const parts = this._value.split('@');
    return parts[1] || '';
  }

  /**
   * Obter parte local do email (antes do @)
   */
  public getLocalPart(): string {
    const parts = this._value.split('@');
    return parts[0] || '';
  }

  /**
   * Verificar igualdade entre Emails
   */
  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * Obter valor do email
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Converter para string
   */
  public toString(): string {
    return this._value;
  }

  /**
   * Converter para JSON
   */
  public toJSON(): string {
    return this._value;
  }
}