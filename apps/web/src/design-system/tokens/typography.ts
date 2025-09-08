/**
 * Tokens de Tipografia DSGov
 * Baseado na fonte Rawline e escalas tipográficas governamentais
 */

// Família de fontes DSGov
export const fontFamily = {
  base: ['Rawline', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
} as const;

// Tamanhos de fonte governamentais (base 16px)
export const fontSize = {
  '01': ['0.75rem', { lineHeight: '1rem' }],     // 12px - Legendas
  '02': ['0.875rem', { lineHeight: '1.25rem' }], // 14px - Corpo pequeno
  '03': ['1rem', { lineHeight: '1.5rem' }],      // 16px - Corpo padrão
  '04': ['1.125rem', { lineHeight: '1.75rem' }], // 18px - Corpo grande
  '05': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px - Subtítulo
  '06': ['1.5rem', { lineHeight: '2rem' }],      // 24px - Título H3
  '07': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - Título H2
  '08': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px - Título H1
  '09': ['3rem', { lineHeight: '1' }],           // 48px - Display
  '10': ['4rem', { lineHeight: '1' }],           // 64px - Hero
} as const;

// Pesos de fonte
export const fontWeight = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// Altura de linha
export const lineHeight = {
  tight: 1.25,
  default: 1.5,
  loose: 1.75,
} as const;

// Espaçamento entre letras
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

// Escalas tipográficas semânticas
export const textStyles = {
  // Títulos
  h1: {
    fontSize: fontSize['08'][0],
    lineHeight: fontSize['08'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize['07'][0],
    lineHeight: fontSize['07'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize['06'][0],
    lineHeight: fontSize['06'][1].lineHeight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h4: {
    fontSize: fontSize['05'][0],
    lineHeight: fontSize['05'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  
  // Corpo de texto
  bodyLarge: {
    fontSize: fontSize['04'][0],
    lineHeight: fontSize['04'][1].lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize['03'][0],
    lineHeight: fontSize['03'][1].lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySmall: {
    fontSize: fontSize['02'][0],
    lineHeight: fontSize['02'][1].lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  
  // Elementos especiais
  caption: {
    fontSize: fontSize['01'][0],
    lineHeight: fontSize['01'][1].lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontSize: fontSize['01'][0],
    lineHeight: fontSize['01'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  
  // Botões e labels
  button: {
    fontSize: fontSize['02'][0],
    lineHeight: fontSize['02'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.wide,
  },
  label: {
    fontSize: fontSize['02'][0],
    lineHeight: fontSize['02'][1].lineHeight,
    fontWeight: fontWeight.medium,
    letterSpacing: letterSpacing.normal,
  },
  
  // Código
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize['02'][0],
    lineHeight: fontSize['02'][1].lineHeight,
    fontWeight: fontWeight.regular,
    letterSpacing: letterSpacing.normal,
  },
  
  // Display
  display: {
    fontSize: fontSize['09'][0],
    lineHeight: fontSize['09'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
  },
  hero: {
    fontSize: fontSize['10'][0],
    lineHeight: fontSize['10'][1].lineHeight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tighter,
  },
} as const;

// Classes CSS para importação da fonte Rawline
export const fontImports = {
  googleFonts: "@import url('https://fonts.googleapis.com/css2?family=Rawline:wght@100;200;300;400;500;600;700;800;900&display=swap');",
  jetBrainsMono: "@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap');",
} as const;