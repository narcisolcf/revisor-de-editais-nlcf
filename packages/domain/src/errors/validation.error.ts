import { DomainError } from './domain.error';

/**
 * Erro de validação de dados
 */
export class ValidationError extends DomainError {
  public readonly field?: string | undefined;
  public readonly value?: any;

  constructor(
    message: string,
    field?: string,
    value?: any,
    context?: Record<string, any>
  ) {
    super(message, 'VALIDATION_ERROR', { ...context, field, value });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  /**
   * Criar erro de campo obrigatório
   */
  public static required(field: string): ValidationError {
    return new ValidationError(`Campo '${field}' é obrigatório`, field);
  }

  /**
   * Criar erro de formato inválido
   */
  public static invalidFormat(field: string, value: any, expectedFormat: string): ValidationError {
    return new ValidationError(
      `Campo '${field}' tem formato inválido. Esperado: ${expectedFormat}`,
      field,
      value
    );
  }

  /**
   * Criar erro de valor fora do intervalo
   */
  public static outOfRange(field: string, value: any, min?: number, max?: number): ValidationError {
    let message = `Campo '${field}' está fora do intervalo permitido`;
    if (min !== undefined && max !== undefined) {
      message += ` (${min} - ${max})`;
    } else if (min !== undefined) {
      message += ` (mínimo: ${min})`;
    } else if (max !== undefined) {
      message += ` (máximo: ${max})`;
    }
    
    return new ValidationError(message, field, value, { min, max });
  }
}