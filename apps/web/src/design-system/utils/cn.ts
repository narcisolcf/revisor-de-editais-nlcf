import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilitário para combinar classes CSS de forma inteligente
 * 
 * Combina clsx para lógica condicional e tailwind-merge para
 * resolver conflitos entre classes do Tailwind CSS
 * 
 * @param inputs - Classes CSS para combinar
 * @returns String com classes CSS combinadas e otimizadas
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-2 é removido)
 * cn('text-red-500', condition && 'text-blue-500') // condicional
 * cn(['base-class', { 'conditional-class': condition }]) // array e objeto
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}