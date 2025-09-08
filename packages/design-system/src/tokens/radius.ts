/**
 * Tokens de border radius baseados no Design System do Governo (DSGov)
 * Sistema consistente de arredondamento para componentes
 */

export const radius = {
  // Valores básicos de border radius
  none: '0px',
  xs: '0.125rem',   // 2px
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Totalmente arredondado

  // Valores semânticos por componente
  component: {
    // Botões
    button: {
      sm: '0.25rem',    // 4px - botões pequenos
      md: '0.375rem',   // 6px - botões médios
      lg: '0.5rem',     // 8px - botões grandes
      pill: '9999px'    // botões em formato de pílula
    },

    // Inputs e campos de formulário
    input: {
      sm: '0.25rem',    // 4px - inputs pequenos
      md: '0.375rem',   // 6px - inputs médios
      lg: '0.5rem'      // 8px - inputs grandes
    },

    // Cards e containers
    card: {
      sm: '0.375rem',   // 6px - cards pequenos
      md: '0.5rem',     // 8px - cards médios
      lg: '0.75rem',    // 12px - cards grandes
      xl: '1rem'        // 16px - cards extra grandes
    },

    // Badges e tags
    badge: {
      sm: '0.25rem',    // 4px - badges pequenos
      md: '0.375rem',   // 6px - badges médios
      lg: '0.5rem',     // 8px - badges grandes
      pill: '9999px'    // badges em formato de pílula
    },

    // Modais e overlays
    modal: {
      sm: '0.5rem',     // 8px - modais pequenos
      md: '0.75rem',    // 12px - modais médios
      lg: '1rem'        // 16px - modais grandes
    },

    // Dropdowns e popovers
    dropdown: {
      sm: '0.375rem',   // 6px - dropdowns pequenos
      md: '0.5rem',     // 8px - dropdowns médios
      lg: '0.75rem'     // 12px - dropdowns grandes
    },

    // Tooltips
    tooltip: {
      sm: '0.25rem',    // 4px - tooltips pequenos
      md: '0.375rem'    // 6px - tooltips médios
    },

    // Navegação
    navigation: {
      item: '0.375rem', // 6px - itens de navegação
      tab: '0.5rem',    // 8px - abas
      pill: '9999px'    // navegação em formato de pílula
    },

    // Avatars e imagens
    avatar: {
      sm: '0.25rem',    // 4px - avatars pequenos
      md: '0.375rem',   // 6px - avatars médios
      lg: '0.5rem',     // 8px - avatares grandes
      full: '9999px'    // avatars circulares
    },

    // Tabelas
    table: {
      cell: '0.25rem',  // 4px - células da tabela
      header: '0.375rem' // 6px - cabeçalho da tabela
    },

    // Alertas e notificações
    alert: {
      sm: '0.375rem',   // 6px - alertas pequenos
      md: '0.5rem',     // 8px - alertas médios
      lg: '0.75rem'     // 12px - alertas grandes
    },

    // Progress bars
    progress: {
      track: '9999px',  // trilha do progress (totalmente arredondada)
      bar: '9999px'     // barra do progress (totalmente arredondada)
    },

    // Switches e toggles
    switch: {
      track: '9999px',  // trilha do switch (totalmente arredondada)
      thumb: '9999px'   // botão do switch (totalmente arredondado)
    }
  },

  // Valores específicos para layout
  layout: {
    // Containers principais
    container: {
      sm: '0.5rem',     // 8px - containers pequenos
      md: '0.75rem',    // 12px - containers médios
      lg: '1rem',       // 16px - containers grandes
      xl: '1.5rem'      // 24px - containers extra grandes
    },

    // Seções e painéis
    section: {
      sm: '0.75rem',    // 12px - seções pequenas
      md: '1rem',       // 16px - seções médias
      lg: '1.5rem'      // 24px - seções grandes
    }
  }
} as const

// Tipos para TypeScript
export type RadiusToken = keyof typeof radius
export type ComponentRadius = keyof typeof radius.component
export type LayoutRadius = keyof typeof radius.layout