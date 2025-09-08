import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../errors/domain.error';

/**
 * Value Object para identificador único de Organization
 * Garante que o ID seja válido e imutável
 */
export class OrganizationId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Criar OrganizationId a partir de string existente
   */
  public static create(value: string): OrganizationId {
    const schema = z.string().uuid('ID da organização deve ser um UUID válido');
    
    try {
      const validatedValue = schema.parse(value);
      return new OrganizationId(validatedValue);
    } catch (error) {
      throw new DomainError(`ID da organização inválido: ${value}`);
    }
  }

  /**
   * Gerar novo OrganizationId
   */
  public static generate(): OrganizationId {
    return new OrganizationId(uuidv4());
  }

  /**
   * Verificar igualdade entre OrganizationIds
   */
  public equals(other: OrganizationId): boolean {
    return this._value === other._value;
  }

  /**
   * Obter valor do ID
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