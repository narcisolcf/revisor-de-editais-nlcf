import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../errors/domain.error';

/**
 * Value Object para identificador único de Document
 * Garante que o ID seja válido e imutável
 */
export class DocumentId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Criar DocumentId a partir de string existente
   */
  public static create(value: string): DocumentId {
    const schema = z.string().uuid('ID do documento deve ser um UUID válido');
    
    try {
      const validatedValue = schema.parse(value);
      return new DocumentId(validatedValue);
    } catch (error) {
      throw new DomainError(`ID do documento inválido: ${value}`);
    }
  }

  /**
   * Gerar novo DocumentId
   */
  public static generate(): DocumentId {
    return new DocumentId(uuidv4());
  }

  /**
   * Verificar igualdade entre DocumentIds
   */
  public equals(other: DocumentId): boolean {
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