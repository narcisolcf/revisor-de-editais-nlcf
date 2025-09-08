/**
 * Tokens do Design System baseado no DSGov
 * Exporta todos os tokens de design para uso consistente
 */

export { colors } from './colors'
export { typography } from './typography'
export { spacing } from './spacing'
export { shadows } from './shadows'
export { radius } from './radius'
export { borders, elevation } from './borders'

// Importações para uso interno
import { colors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'
import { shadows } from './shadows'
import { radius } from './radius'
import { borders, elevation } from './borders'

// Re-exporta tipos para facilitar o uso
export type {
  ColorToken,
  ColorShade
} from './colors'

export type {
  FontFamily,
  FontSize,
  FontWeight,
  LineHeight,
  LetterSpacing,
  TextStyle
} from './typography'

export type {
  SpacingToken,
  ComponentSpacing,
  LayoutSpacing
} from './spacing'

export type {
  ShadowToken,
  ContextShadow,
  ColoredShadow
} from './shadows'

export type {
  RadiusToken,
  ComponentRadius,
  LayoutRadius
} from './radius'

// Objeto consolidado com todos os tokens
export const tokens = {
  colors,
  typography,
  spacing,
  shadows,
  radius,
  borders,
  elevation
} as const