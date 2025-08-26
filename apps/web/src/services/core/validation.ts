/**
 * Serviço de validação para dados e formulários
 */

import { ValidationError } from './error';
import { Severity } from '../../types/core/common';

/** Resultado de validação */
export interface ValidationResult {
  /** Se a validação passou */
  isValid: boolean;
  /** Erros encontrados */
  errors: ValidationError[];
  /** Avisos (não impedem a validação) */
  warnings: ValidationError[];
  /** Dados validados e transformados */
  data?: unknown;
}

/** Contexto de validação */
export interface ValidationContext {
  /** Campo sendo validado */
  field?: string;
  /** Valor sendo validado */
  value?: unknown;
  /** Dados completos do objeto */
  data?: Record<string, unknown>;
  /** Configurações adicionais */
  options?: Record<string, unknown>;
}

/** Função de validação */
export type ValidatorFunction<T = unknown> = (
  value: T,
  context?: ValidationContext
) => ValidationResult | Promise<ValidationResult>;

/** Regra de validação */
export interface ValidationRule {
  /** Nome da regra */
  name: string;
  /** Função de validação */
  validator: ValidatorFunction;
  /** Mensagem de erro personalizada */
  message?: string;
  /** Se é obrigatória (erro) ou opcional (aviso) */
  required?: boolean;
  /** Condição para aplicar a regra */
  condition?: (context: ValidationContext) => boolean;
}

/** Schema de validação */
export interface ValidationSchema {
  /** Regras por campo */
  fields: Record<string, ValidationRule[]>;
  /** Regras globais do objeto */
  global?: ValidationRule[];
  /** Configurações do schema */
  options?: {
    /** Se deve parar na primeira falha */
    stopOnFirstError?: boolean;
    /** Se deve incluir avisos */
    includeWarnings?: boolean;
    /** Transformações a aplicar */
    transforms?: Record<string, (value: unknown) => unknown>;
  };
}

/** Validadores básicos */
export class Validators {
  /** Valida se valor é obrigatório */
  static required(message = 'Campo obrigatório'): ValidationRule {
    return {
      name: 'required',
      message,
      required: true,
      validator: (value) => {
        const isEmpty = value === null || 
                       value === undefined || 
                       value === '' || 
                       (Array.isArray(value) && value.length === 0);
        
        return {
          isValid: !isEmpty,
          errors: isEmpty ? [new ValidationError(message, 'value', value, 'required')] : [],
          warnings: []
        };
      }
    };
  }

  /** Valida comprimento mínimo */
  static minLength(min: number, message?: string): ValidationRule {
    const defaultMessage = `Deve ter pelo menos ${min} caracteres`;
    
    return {
      name: 'minLength',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined) {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const length = String(value).length;
        const isValid = length >= min;
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'minLength'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida comprimento máximo */
  static maxLength(max: number, message?: string): ValidationRule {
    const defaultMessage = `Deve ter no máximo ${max} caracteres`;
    
    return {
      name: 'maxLength',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined) {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const length = String(value).length;
        const isValid = length <= max;
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'maxLength'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida padrão regex */
  static pattern(regex: RegExp, message?: string): ValidationRule {
    const defaultMessage = 'Formato inválido';
    
    return {
      name: 'pattern',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const isValid = regex.test(String(value));
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'pattern'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida email */
  static email(message = 'Email inválido'): ValidationRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.pattern(emailRegex, message);
  }

  /** Valida número */
  static number(message = 'Deve ser um número'): ValidationRule {
    return {
      name: 'number',
      message,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const isValid = !isNaN(Number(value));
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message, 
            'value', 
            value, 
            'number'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida valor mínimo */
  static min(minValue: number, message?: string): ValidationRule {
    const defaultMessage = `Deve ser maior ou igual a ${minValue}`;
    
    return {
      name: 'min',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const numValue = Number(value);
        const isValid = !isNaN(numValue) && numValue >= minValue;
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'min'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida valor máximo */
  static max(maxValue: number, message?: string): ValidationRule {
    const defaultMessage = `Deve ser menor ou igual a ${maxValue}`;
    
    return {
      name: 'max',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const numValue = Number(value);
        const isValid = !isNaN(numValue) && numValue <= maxValue;
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'max'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida se valor está em lista */
  static oneOf(values: unknown[], message?: string): ValidationRule {
    const defaultMessage = `Deve ser um dos valores: ${values.join(', ')}`;
    
    return {
      name: 'oneOf',
      message: message || defaultMessage,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined) {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const isValid = values.includes(value);
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message || defaultMessage, 
            'value', 
            value, 
            'oneOf'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida data */
  static date(message = 'Data inválida'): ValidationRule {
    return {
      name: 'date',
      message,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        const date = new Date(value as string);
        const isValid = !isNaN(date.getTime());
        
        return {
          isValid,
          errors: isValid ? [] : [new ValidationError(
            message, 
            'value', 
            value, 
            'date'
          )],
          warnings: []
        };
      }
    };
  }

  /** Valida URL */
  static url(message = 'URL inválida'): ValidationRule {
    return {
      name: 'url',
      message,
      required: true,
      validator: (value) => {
        if (value === null || value === undefined || value === '') {
          return { isValid: true, errors: [], warnings: [] };
        }
        
        try {
          new URL(String(value));
          return { isValid: true, errors: [], warnings: [] };
        } catch {
          return {
            isValid: false,
            errors: [new ValidationError(
              message, 
              'value', 
              value, 
              'url'
            )],
            warnings: []
          };
        }
      }
    };
  }

  /** Validação customizada */
  static custom(
    validator: ValidatorFunction,
    name = 'custom',
    message = 'Valor inválido'
  ): ValidationRule {
    return {
      name,
      message,
      required: true,
      validator
    };
  }
}

/** Serviço de validação */
export class ValidationService {
  private schemas = new Map<string, ValidationSchema>();

  /** Registra um schema de validação */
  registerSchema(name: string, schema: ValidationSchema): void {
    this.schemas.set(name, schema);
  }

  /** Obtém um schema registrado */
  getSchema(name: string): ValidationSchema | undefined {
    return this.schemas.get(name);
  }

  /** Valida um valor usando regras */
  async validateValue(
    value: unknown,
    rules: ValidationRule[],
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let transformedValue = value;

    for (const rule of rules) {
      // Verifica condição se existir
      if (rule.condition && !rule.condition(context || {})) {
        continue;
      }

      try {
        const result = await rule.validator(transformedValue, context);
        
        if (!result.isValid) {
          if (rule.required) {
            errors.push(...result.errors);
          } else {
            warnings.push(...result.errors);
          }
        }
        
        warnings.push(...result.warnings);
        
        // Aplica transformação se houver
        if (result.data !== undefined) {
          transformedValue = result.data;
        }
      } catch (error) {
        const validationError = new ValidationError(
          `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          context?.field || 'unknown',
          value,
          rule.name
        );
        
        if (rule.required) {
          errors.push(validationError);
        } else {
          warnings.push(validationError);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: transformedValue
    };
  }

  /** Valida um objeto usando schema */
  async validateObject(
    data: Record<string, unknown>,
    schema: ValidationSchema
  ): Promise<ValidationResult> {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];
    const transformedData: Record<string, unknown> = { ...data };
    const options = schema.options || {};

    // Valida campos individuais
    for (const [fieldName, rules] of Object.entries(schema.fields)) {
      const fieldValue = data[fieldName];
      const context: ValidationContext = {
        field: fieldName,
        value: fieldValue,
        data,
        options: options
      };

      const result = await this.validateValue(fieldValue, rules, context);
      
      allErrors.push(...result.errors);
      if (options.includeWarnings) {
        allWarnings.push(...result.warnings);
      }
      
      // Aplica transformação
      if (result.data !== undefined) {
        transformedData[fieldName] = result.data;
      }
      
      // Para na primeira falha se configurado
      if (options.stopOnFirstError && result.errors.length > 0) {
        break;
      }
    }

    // Aplica transformações globais
    if (options.transforms) {
      for (const [fieldName, transform] of Object.entries(options.transforms)) {
        if (transformedData[fieldName] !== undefined) {
          try {
            transformedData[fieldName] = transform(transformedData[fieldName]);
          } catch (error) {
            allErrors.push(new ValidationError(
              `Erro na transformação do campo ${fieldName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              fieldName,
              transformedData[fieldName],
              'transform'
            ));
          }
        }
      }
    }

    // Valida regras globais
    if (schema.global) {
      const globalContext: ValidationContext = {
        data: transformedData,
        options: options
      };
      
      const globalResult = await this.validateValue(
        transformedData, 
        schema.global, 
        globalContext
      );
      
      allErrors.push(...globalResult.errors);
      if (options.includeWarnings) {
        allWarnings.push(...globalResult.warnings);
      }
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      data: transformedData
    };
  }

  /** Valida usando schema registrado */
  async validateWithSchema(
    data: Record<string, unknown>,
    schemaName: string
  ): Promise<ValidationResult> {
    const schema = this.getSchema(schemaName);
    if (!schema) {
      throw new ValidationError(
        `Schema '${schemaName}' não encontrado`,
        'schema',
        schemaName,
        'notFound'
      );
    }
    
    return this.validateObject(data, schema);
  }

  /** Cria um validador para um campo específico */
  createFieldValidator(
    rules: ValidationRule[]
  ): (value: unknown, context?: ValidationContext) => Promise<ValidationResult> {
    return (value, context) => this.validateValue(value, rules, context);
  }

  /** Lista schemas registrados */
  listSchemas(): string[] {
    return Array.from(this.schemas.keys());
  }

  /** Remove um schema */
  removeSchema(name: string): boolean {
    return this.schemas.delete(name);
  }

  /** Limpa todos os schemas */
  clearSchemas(): void {
    this.schemas.clear();
  }
}

/** Instância global do serviço de validação */
export const validationService = new ValidationService();

/** Schemas comuns */
export const commonSchemas = {
  /** Schema para email */
  email: {
    fields: {
      email: [Validators.required(), Validators.email()]
    }
  } as ValidationSchema,

  /** Schema para senha */
  password: {
    fields: {
      password: [
        Validators.required(),
        Validators.minLength(8, 'Senha deve ter pelo menos 8 caracteres'),
        Validators.pattern(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
        )
      ]
    }
  } as ValidationSchema,

  /** Schema para usuário */
  user: {
    fields: {
      name: [Validators.required(), Validators.minLength(2)],
      email: [Validators.required(), Validators.email()],
      age: [Validators.number(), Validators.min(0), Validators.max(120)]
    },
    options: {
      includeWarnings: true
    }
  } as ValidationSchema
};

// Registra schemas comuns
Object.entries(commonSchemas).forEach(([name, schema]) => {
  validationService.registerSchema(name, schema);
});

/** Função utilitária para validação rápida */
export async function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema | string
): Promise<ValidationResult> {
  if (typeof schema === 'string') {
    return validationService.validateWithSchema(data, schema);
  }
  return validationService.validateObject(data, schema);
}

/** Função utilitária para validação de campo */
export async function validateField(
  value: unknown,
  rules: ValidationRule[],
  context?: ValidationContext
): Promise<ValidationResult> {
  return validationService.validateValue(value, rules, context);
}