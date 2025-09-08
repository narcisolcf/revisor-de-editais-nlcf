import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../errors/domain.error';

/**
 * Value Object para identificador único de Analysis
 * Garante que o ID seja válido e imutável
 */
export class AnalysisId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  /**
   * Criar AnalysisId a partir de string existente
   */
  public static create(value: string): AnalysisId {
    const schema = z.string().uuid('ID da análise deve ser um UUID válido');
    
    try {
      const validatedValue = schema.parse(value);
      return new AnalysisId(validatedValue);
    } catch (error) {
      throw new DomainError(`ID da análise inválido: ${value}`);
    }
  }

  /**
   * Gerar novo AnalysisId
   */
  public static generate(): AnalysisId {
    return new AnalysisId(uuidv4());
  }

  /**
   * Verificar igualdade entre AnalysisIds
   */
  public equals(other: AnalysisId): boolean {
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