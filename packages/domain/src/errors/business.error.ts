import { DomainError } from './domain.error';

/**
 * Erro de regra de negócio
 */
export class BusinessError extends DomainError {
  public readonly rule: string;

  constructor(
    message: string,
    rule: string,
    context?: Record<string, any>
  ) {
    super(message, 'BUSINESS_ERROR', { ...context, rule });
    this.name = 'BusinessError';
    this.rule = rule;
  }

  /**
   * Criar erro de estado inválido
   */
  public static invalidState(entity: string, currentState: string, expectedState: string): BusinessError {
    return new BusinessError(
      `${entity} está em estado inválido. Estado atual: ${currentState}, esperado: ${expectedState}`,
      'INVALID_STATE',
      { entity, currentState, expectedState }
    );
  }

  /**
   * Criar erro de operação não permitida
   */
  public static operationNotAllowed(operation: string, reason: string): BusinessError {
    return new BusinessError(
      `Operação '${operation}' não permitida: ${reason}`,
      'OPERATION_NOT_ALLOWED',
      { operation, reason }
    );
  }

  /**
   * Criar erro de recurso não encontrado
   */
  public static notFound(resource: string, identifier: string): BusinessError {
    return new BusinessError(
      `${resource} não encontrado: ${identifier}`,
      'NOT_FOUND',
      { resource, identifier }
    );
  }

  /**
   * Criar erro de recurso já existente
   */
  public static alreadyExists(resource: string, identifier: string): BusinessError {
    return new BusinessError(
      `${resource} já existe: ${identifier}`,
      'ALREADY_EXISTS',
      { resource, identifier }
    );
  }

  /**
   * Criar erro de permissão negada
   */
  public static accessDenied(resource: string, action: string): BusinessError {
    return new BusinessError(
      `Acesso negado para ${action} em ${resource}`,
      'ACCESS_DENIED',
      { resource, action }
    );
  }
}