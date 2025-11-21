/**
 * FormInputField - Componente Reutilizável de Input para Formulários
 *
 * Wrapper ao redor de FormField do shadcn/ui que fornece:
 * - Props tipadas e consistentes
 * - Integração automática com React Hook Form
 * - Ícones opcionais
 * - Suporte a máscaras (CNPJ, CPF, telefone, etc)
 */

import * as React from 'react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormInputFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  mask?: 'cnpj' | 'cpf' | 'phone' | 'cep';
  maxLength?: number;
}

// Máscaras de formatação
const masks = {
  cnpj: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  },
  cpf: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  },
  phone: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  },
  cep: (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  }
};

export function FormInputField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  type = 'text',
  icon: Icon,
  disabled,
  required,
  className,
  inputClassName,
  mask,
  maxLength
}: FormInputFieldProps<TFieldValues>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Aplica máscara se especificada
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          let value = e.target.value;

          if (mask && masks[mask]) {
            value = masks[mask](value);
          }

          field.onChange(value);
        };

        return (
          <FormItem className={className}>
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                {Icon && (
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                )}
                <Input
                  type={type}
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  className={cn(Icon && 'pl-10', inputClassName)}
                  {...field}
                  onChange={mask ? handleChange : field.onChange}
                  value={field.value || ''}
                />
              </div>
            </FormControl>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default FormInputField;
