/**
 * Classe base para erros de domínio
 * Representa violações de regras de negócio
 */
export class DomainError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any> | undefined;

  constructor(
    message: string,
    code: string = 'DOMAIN_ERROR',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.timestamp = new Date();
    this.context = context;

    // Manter stack trace correto
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DomainError);
    }
  }

  /**
   * Converter erro para objeto serializable
   */
  public toObject(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * Converter para JSON
   */
  public toJSON(): Record<string, any> {
    return this.toObject();
  }
}