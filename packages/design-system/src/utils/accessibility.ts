/**
 * Utilitários de acessibilidade para componentes
 * Seguindo diretrizes WCAG 2.1 AA
 */

/**
 * Gera um ID único para elementos que precisam de identificação
 * @param prefix - Prefixo para o ID
 * @returns ID único
 */
export function generateId(prefix: string = 'element'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Propriedades ARIA para elementos interativos
 */
export interface AriaProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-disabled'?: boolean
  'aria-hidden'?: boolean
  'aria-pressed'?: boolean
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  'aria-live'?: 'off' | 'polite' | 'assertive'
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-controls'?: string
  'aria-owns'?: string
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-invalid'?: boolean | 'grammar' | 'spelling'
  'aria-required'?: boolean
  'aria-readonly'?: boolean
  'aria-multiselectable'?: boolean
  'aria-orientation'?: 'horizontal' | 'vertical'
  'aria-valuemin'?: number
  'aria-valuemax'?: number
  'aria-valuenow'?: number
  'aria-valuetext'?: string
  'aria-setsize'?: number
  'aria-posinset'?: number
  'aria-level'?: number
  'aria-rowcount'?: number
  'aria-colcount'?: number
  'aria-rowindex'?: number
  'aria-colindex'?: number
  'aria-rowspan'?: number
  'aria-colspan'?: number
  role?: string
}

/**
 * Cria propriedades ARIA para botões
 * @param options - Opções do botão
 * @returns Propriedades ARIA
 */
export function createButtonAria(options: {
  label?: string
  pressed?: boolean
  expanded?: boolean
  disabled?: boolean
  controls?: string
  describedBy?: string
}): AriaProps {
  const aria: AriaProps = {}
  
  if (options.label) aria['aria-label'] = options.label
  if (options.pressed !== undefined) aria['aria-pressed'] = options.pressed
  if (options.expanded !== undefined) aria['aria-expanded'] = options.expanded
  if (options.disabled) aria['aria-disabled'] = true
  if (options.controls) aria['aria-controls'] = options.controls
  if (options.describedBy) aria['aria-describedby'] = options.describedBy
  
  return aria
}

/**
 * Cria propriedades ARIA para inputs
 * @param options - Opções do input
 * @returns Propriedades ARIA
 */
export function createInputAria(options: {
  label?: string
  labelledBy?: string
  describedBy?: string
  required?: boolean
  invalid?: boolean
  disabled?: boolean
  readonly?: boolean
}): AriaProps {
  const aria: AriaProps = {}
  
  if (options.label) aria['aria-label'] = options.label
  if (options.labelledBy) aria['aria-labelledby'] = options.labelledBy
  if (options.describedBy) aria['aria-describedby'] = options.describedBy
  if (options.required) aria['aria-required'] = true
  if (options.invalid) aria['aria-invalid'] = true
  if (options.disabled) aria['aria-disabled'] = true
  if (options.readonly) aria['aria-readonly'] = true
  
  return aria
}

/**
 * Cria propriedades ARIA para elementos de navegação
 * @param options - Opções de navegação
 * @returns Propriedades ARIA
 */
export function createNavigationAria(options: {
  label?: string
  current?: boolean | 'page' | 'step' | 'location'
  expanded?: boolean
  hasPopup?: boolean | 'menu' | 'listbox'
  controls?: string
  level?: number
}): AriaProps {
  const aria: AriaProps = {}
  
  if (options.label) aria['aria-label'] = options.label
  if (options.current !== undefined) aria['aria-current'] = options.current
  if (options.expanded !== undefined) aria['aria-expanded'] = options.expanded
  if (options.hasPopup !== undefined) aria['aria-haspopup'] = options.hasPopup
  if (options.controls) aria['aria-controls'] = options.controls
  if (options.level) aria['aria-level'] = options.level
  
  return aria
}

/**
 * Cria propriedades ARIA para listas
 * @param options - Opções da lista
 * @returns Propriedades ARIA
 */
export function createListAria(options: {
  label?: string
  multiselectable?: boolean
  orientation?: 'horizontal' | 'vertical'
  setSize?: number
  posInSet?: number
  selected?: boolean
  level?: number
}): AriaProps {
  const aria: AriaProps = {}
  
  if (options.label) aria['aria-label'] = options.label
  if (options.multiselectable) aria['aria-multiselectable'] = true
  if (options.orientation) aria['aria-orientation'] = options.orientation
  if (options.setSize) aria['aria-setsize'] = options.setSize
  if (options.posInSet) aria['aria-posinset'] = options.posInSet
  if (options.selected !== undefined) aria['aria-selected'] = options.selected
  if (options.level) aria['aria-level'] = options.level
  
  return aria
}

/**
 * Cria propriedades ARIA para elementos de status/live regions
 * @param options - Opções do live region
 * @returns Propriedades ARIA
 */
export function createLiveRegionAria(options: {
  live?: 'off' | 'polite' | 'assertive'
  atomic?: boolean
  busy?: boolean
  label?: string
}): AriaProps {
  const aria: AriaProps = {}
  
  if (options.live) aria['aria-live'] = options.live
  if (options.atomic !== undefined) aria['aria-atomic'] = options.atomic
  if (options.busy !== undefined) aria['aria-busy'] = options.busy
  if (options.label) aria['aria-label'] = options.label
  
  return aria
}

/**
 * Verifica se um elemento está visível para screen readers
 * @param element - Elemento DOM
 * @returns true se visível para screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  const ariaHidden = element.getAttribute('aria-hidden')
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    ariaHidden !== 'true'
  )
}

/**
 * Foca no primeiro elemento focável dentro de um container
 * @param container - Container para buscar elementos focáveis
 * @returns true se encontrou e focou um elemento
 */
export function focusFirstFocusable(container: HTMLElement): boolean {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0] as HTMLElement
  if (firstFocusable) {
    firstFocusable.focus()
    return true
  }
  
  return false
}

/**
 * Gerencia o foco dentro de um modal ou dialog
 * @param container - Container do modal
 * @returns Função para limpar os event listeners
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus()
        e.preventDefault()
      }
    }
  }
  
  container.addEventListener('keydown', handleTabKey)
  
  // Foca no primeiro elemento
  if (firstFocusable) {
    firstFocusable.focus()
  }
  
  // Retorna função para limpar
  return () => {
    container.removeEventListener('keydown', handleTabKey)
  }
}