/**
 * Tokens de Design DSGov
 * Exportação centralizada de todos os tokens do Design System Governamental
 */

// Exportar tokens de cores
export {
  colors,
  semanticColors,
  stateColors,
  backgroundColors,
  textColors,
  borderColors,
} from './colors';

// Exportar tokens de tipografia
export {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textStyles,
  fontImports,
} from './typography';

// Exportar tokens de espaçamento
export {
  spacing,
  componentSpacing,
  gap,
  inset,
  a11ySpacing,
  responsiveSpacing,
} from './spacing';

// Exportar tokens de sombras
export {
  shadows,
  stateShadows,
  componentShadows,
  themeShadows,
  shadowTransitions,
} from './shadows';

// Exportar tokens de border radius
export {
  radius,
  componentRadius,
  stateRadius,
  responsiveRadius,
  specialRadius,
  radiusTransitions,
} from './radius';

// Objeto consolidado com todos os tokens
export const dsgovTokens = {
  colors: {
    colors: require('./colors').colors,
    semantic: require('./colors').semanticColors,
    state: require('./colors').stateColors,
    background: require('./colors').backgroundColors,
    text: require('./colors').textColors,
    border: require('./colors').borderColors,
  },
  typography: {
    fontFamily: require('./typography').fontFamily,
    fontSize: require('./typography').fontSize,
    fontWeight: require('./typography').fontWeight,
    lineHeight: require('./typography').lineHeight,
    letterSpacing: require('./typography').letterSpacing,
    textStyles: require('./typography').textStyles,
    fontImports: require('./typography').fontImports,
  },
  spacing: {
    spacing: require('./spacing').spacing,
    component: require('./spacing').componentSpacing,
    gap: require('./spacing').gap,
    inset: require('./spacing').inset,
    a11y: require('./spacing').a11ySpacing,
    responsive: require('./spacing').responsiveSpacing,
  },
  shadows: {
    shadows: require('./shadows').shadows,
    state: require('./shadows').stateShadows,
    component: require('./shadows').componentShadows,
    theme: require('./shadows').themeShadows,
    transitions: require('./shadows').shadowTransitions,
  },
  radius: {
    radius: require('./radius').radius,
    component: require('./radius').componentRadius,
    state: require('./radius').stateRadius,
    responsive: require('./radius').responsiveRadius,
    special: require('./radius').specialRadius,
    transitions: require('./radius').radiusTransitions,
  },
} as const;

// Tipos TypeScript para os tokens
import { colors, semanticColors } from './colors';
import { fontSize } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { radius } from './radius';

export type DSGovColors = typeof colors;
export type DSGovSemanticColors = typeof semanticColors;
export type DSGovFontSize = typeof fontSize;
export type DSGovSpacing = typeof spacing;
export type DSGovShadows = typeof shadows;
export type DSGovRadius = typeof radius;
export type DSGovTokens = typeof dsgovTokens;