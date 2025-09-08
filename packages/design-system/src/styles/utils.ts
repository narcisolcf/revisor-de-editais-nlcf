/**
 * Utilitários para classes CSS e variantes de componentes
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS de forma inteligente, resolvendo conflitos do Tailwind
 * @param inputs - Classes CSS para combinar
 * @returns String com classes combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cria variantes de componentes usando class-variance-authority
 */
export { cva, type VariantProps } from 'class-variance-authority';

/**
 * Utilitário para criar classes de foco acessíveis
 */
export const focusRing = {
  default: 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  error: 'focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
  success: 'focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2',
  warning: 'focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2',
  none: 'focus:outline-none'
} as const;

/**
 * Utilitário para transições suaves
 */
export const transitions = {
  default: 'transition-colors duration-200 ease-in-out',
  fast: 'transition-all duration-150 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
  bounce: 'transition-all duration-200 ease-bounce'
} as const;

/**
 * Utilitário para estados de hover
 */
export const hover = {
  lift: 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
  glow: 'hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200',
  scale: 'hover:scale-105 transition-transform duration-200',
  opacity: 'hover:opacity-80 transition-opacity duration-200'
} as const;

/**
 * Utilitário para estados disabled
 */
export const disabled = {
  default: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  subtle: 'disabled:opacity-60 disabled:cursor-not-allowed',
  strong: 'disabled:opacity-30 disabled:cursor-not-allowed disabled:grayscale'
} as const;

/**
 * Utilitário para responsividade
 */
export const responsive = {
  container: 'container mx-auto px-4 sm:px-6 lg:px-8',
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 md:grid-cols-2',
    cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
  },
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    column: 'flex flex-col',
    wrap: 'flex flex-wrap'
  }
} as const;

export type FocusRing = keyof typeof focusRing;
export type Transition = keyof typeof transitions;
export type Hover = keyof typeof hover;
export type Disabled = keyof typeof disabled;