import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../errors/domain.error';

/**
 * Value Object para identificador único de User
 * Garante que o ID seja válido e imutável
 */
export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Criar UserId a partir de string existente
   */
  public static create(value: string): UserId {
    const schema = z.string().uuid('ID do usuário deve ser um UUID válido');
    
    try {
      const validatedValue = schema.parse(value);
      return new UserId(validatedValue);
    } catch (error) {
      throw new DomainError(`ID do usuário inválido: ${value}`);
    }
  }

  /**
   * Gerar novo UserId
   */
  public static generate(): UserId {
    return new UserId(uuidv4());
  }

  /**
   * Verificar igualdade entre UserIds
   */
  public equals(other: UserId): boolean {
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