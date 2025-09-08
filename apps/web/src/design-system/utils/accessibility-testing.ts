/**
 * Utilitários para testes de acessibilidade WCAG 2.1 AA
 * 
 * Este módulo fornece funções para validar conformidade com as diretrizes
 * de acessibilidade WCAG 2.1 nível AA, incluindo:
 * - Contraste de cores
 * - Navegação por teclado
 * - Atributos ARIA
 * - Estrutura semântica
 * - Foco visível
 */

export interface AccessibilityTestResult {
  passed: boolean;
  level: 'A' | 'AA' | 'AAA';
  criterion: string;
  message: string;
  element?: Element;
  severity: 'error' | 'warning' | 'info';
}

export interface ColorContrastResult {
  ratio: number;
  passed: boolean;
  level: 'A' | 'AA' | 'AAA' | 'fail';
  foreground: string;
  background: string;
}

export interface KeyboardTestResult {
  focusable: boolean;
  tabIndex: number;
  hasVisibleFocus: boolean;
  keyboardAccessible: boolean;
  ariaLabel?: string;
}

/**
 * Calcula o contraste entre duas cores
 * 
 * @param foreground Cor do texto (hex, rgb, rgba)
 * @param background Cor do fundo (hex, rgb, rgba)
 * @returns Resultado do teste de contraste
 */
export function calculateColorContrast(
  foreground: string,
  background: string
): ColorContrastResult {
  // Converter cores para RGB
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);
  
  if (!fgRgb || !bgRgb) {
    return {
      ratio: 0,
      passed: false,
      level: 'fail',
      foreground,
      background,
    };
  }
  
  // Calcular luminância relativa
  const fgLuminance = getRelativeLuminance(fgRgb);
  const bgLuminance = getRelativeLuminance(bgRgb);
  
  // Calcular razão de contraste
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  
  // Determinar nível de conformidade
  let level: 'A' | 'AA' | 'AAA' | 'fail';
  let passed: boolean;
  
  if (ratio >= 7) {
    level = 'AAA';
    passed = true;
  } else if (ratio >= 4.5) {
    level = 'AA';
    passed = true;
  } else if (ratio >= 3) {
    level = 'A';
    passed = true;
  } else {
    level = 'fail';
    passed = false;
  }
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    passed,
    level,
    foreground,
    background,
  };
}

/**
 * Converte string de cor para RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Remover espaços e converter para lowercase
  color = color.trim().toLowerCase();
  
  // Hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }
  
  // RGB/RGBA colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  
  return null;
}

/**
 * Calcula luminância relativa de uma cor RGB
 */
function getRelativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  // Normalizar valores RGB para 0-1
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // Calcular luminância usando coeficientes ITU-R BT.709
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Testa se um elemento é acessível por teclado
 */
export function testKeyboardAccessibility(element: Element): KeyboardTestResult {
  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  
  // Elementos naturalmente focáveis
  const naturallyFocusable = [
    'a', 'button', 'input', 'select', 'textarea', 'details', 'summary'
  ].includes(tagName);
  
  // Elementos com role interativo
  const interactiveRoles = [
    'button', 'link', 'menuitem', 'option', 'radio', 'checkbox', 'tab', 'switch'
  ];
  const hasInteractiveRole = role && interactiveRoles.includes(role);
  
  // Verificar se é focável
  const tabIndexValue = tabIndex ? parseInt(tabIndex, 10) : 0;
  const focusable = naturallyFocusable || hasInteractiveRole || tabIndexValue >= 0;
  
  // Verificar foco visível (simulado - em teste real seria verificado visualmente)
  const hasVisibleFocus = element.matches(':focus-visible') || 
                        getComputedStyle(element).outline !== 'none';
  
  return {
    focusable,
    tabIndex: tabIndexValue,
    hasVisibleFocus,
    keyboardAccessible: focusable && (naturallyFocusable || hasInteractiveRole),
    ariaLabel: ariaLabel || undefined,
  };
}

/**
 * Testa atributos ARIA de um elemento
 */
export function testAriaAttributes(element: Element): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const role = element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');
  
  // Verificar se elementos interativos têm nome acessível
  const interactiveElements = ['button', 'a', 'input', 'select', 'textarea'];
  const interactiveRoles = ['button', 'link', 'menuitem', 'option', 'tab'];
  
  const isInteractive = interactiveElements.includes(element.tagName.toLowerCase()) ||
                      (role && interactiveRoles.includes(role));
  
  if (isInteractive) {
    const hasAccessibleName = ariaLabel || ariaLabelledBy || 
                             element.textContent?.trim() ||
                             (element as HTMLInputElement).value ||
                             element.getAttribute('title');
    
    results.push({
      passed: !!hasAccessibleName,
      level: 'A',
      criterion: '4.1.2 Name, Role, Value',
      message: hasAccessibleName 
        ? 'Elemento interativo tem nome acessível'
        : 'Elemento interativo não tem nome acessível',
      element,
      severity: hasAccessibleName ? 'info' : 'error',
    });
  }
  
  // Verificar aria-labelledby aponta para elementos existentes
  if (ariaLabelledBy) {
    const labelIds = ariaLabelledBy.split(' ');
    const allExist = labelIds.every(id => document.getElementById(id));
    
    results.push({
      passed: allExist,
      level: 'A',
      criterion: '4.1.2 Name, Role, Value',
      message: allExist
        ? 'aria-labelledby aponta para elementos existentes'
        : 'aria-labelledby aponta para elementos inexistentes',
      element,
      severity: allExist ? 'info' : 'error',
    });
  }
  
  // Verificar aria-describedby aponta para elementos existentes
  if (ariaDescribedBy) {
    const descIds = ariaDescribedBy.split(' ');
    const allExist = descIds.every(id => document.getElementById(id));
    
    results.push({
      passed: allExist,
      level: 'A',
      criterion: '4.1.2 Name, Role, Value',
      message: allExist
        ? 'aria-describedby aponta para elementos existentes'
        : 'aria-describedby aponta para elementos inexistentes',
      element,
      severity: allExist ? 'info' : 'error',
    });
  }
  
  return results;
}

/**
 * Testa estrutura de cabeçalhos
 */
export function testHeadingStructure(container: Element = document.body): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
  
  if (headings.length === 0) {
    results.push({
      passed: false,
      level: 'AA',
      criterion: '2.4.6 Headings and Labels',
      message: 'Nenhum cabeçalho encontrado na página',
      severity: 'warning',
    });
    return results;
  }
  
  let previousLevel = 0;
  let hasH1 = false;
  
  headings.forEach((heading, index) => {
    const tagName = heading.tagName.toLowerCase();
    let level: number;
    
    if (tagName.startsWith('h')) {
      level = parseInt(tagName.charAt(1), 10);
    } else {
      const ariaLevel = heading.getAttribute('aria-level');
      level = ariaLevel ? parseInt(ariaLevel, 10) : 1;
    }
    
    if (level === 1) {
      hasH1 = true;
    }
    
    // Verificar se não pula níveis
    if (index > 0 && level > previousLevel + 1) {
      results.push({
        passed: false,
        level: 'AA',
        criterion: '2.4.6 Headings and Labels',
        message: `Cabeçalho h${level} pula níveis (anterior era h${previousLevel})`,
        element: heading,
        severity: 'warning',
      });
    }
    
    // Verificar se tem conteúdo
    const hasContent = heading.textContent?.trim() || 
                      heading.getAttribute('aria-label') ||
                      heading.getAttribute('aria-labelledby');
    
    if (!hasContent) {
      results.push({
        passed: false,
        level: 'A',
        criterion: '2.4.6 Headings and Labels',
        message: 'Cabeçalho vazio encontrado',
        element: heading,
        severity: 'error',
      });
    }
    
    previousLevel = level;
  });
  
  // Verificar se tem pelo menos um H1
  if (!hasH1) {
    results.push({
      passed: false,
      level: 'AA',
      criterion: '2.4.6 Headings and Labels',
      message: 'Página não tem cabeçalho h1',
      severity: 'warning',
    });
  }
  
  return results;
}

/**
 * Testa se imagens têm texto alternativo apropriado
 */
export function testImageAltText(container: Element = document.body): AccessibilityTestResult[] {
  const results: AccessibilityTestResult[] = [];
  const images = container.querySelectorAll('img');
  
  images.forEach(img => {
    const alt = img.getAttribute('alt');
    const role = img.getAttribute('role');
    const ariaLabel = img.getAttribute('aria-label');
    const ariaLabelledBy = img.getAttribute('aria-labelledby');
    
    // Imagens decorativas devem ter alt="" ou role="presentation"
    const isDecorative = alt === '' || role === 'presentation' || role === 'none';
    
    if (isDecorative) {
      results.push({
        passed: true,
        level: 'A',
        criterion: '1.1.1 Non-text Content',
        message: 'Imagem decorativa marcada corretamente',
        element: img,
        severity: 'info',
      });
    } else {
      // Imagens informativas devem ter texto alternativo
      const hasAltText = alt || ariaLabel || ariaLabelledBy;
      
      results.push({
        passed: !!hasAltText,
        level: 'A',
        criterion: '1.1.1 Non-text Content',
        message: hasAltText
          ? 'Imagem tem texto alternativo'
          : 'Imagem não tem texto alternativo',
        element: img,
        severity: hasAltText ? 'info' : 'error',
      });
      
      // Verificar se alt text não é redundante
      if (alt && (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture'))) {
        results.push({
          passed: false,
          level: 'AA',
          criterion: '1.1.1 Non-text Content',
          message: 'Texto alternativo redundante (contém "image" ou "picture")',
          element: img,
          severity: 'warning',
        });
      }
    }
  });
  
  return results;
}

/**
 * Executa uma bateria completa de testes de acessibilidade
 */
export function runAccessibilityAudit(container: Element = document.body): {
  results: AccessibilityTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    errors: number;
  };
} {
  const results: AccessibilityTestResult[] = [];
  
  // Testar estrutura de cabeçalhos
  results.push(...testHeadingStructure(container));
  
  // Testar imagens
  results.push(...testImageAltText(container));
  
  // Testar elementos interativos
  const interactiveElements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [role="link"], [tabindex]'
  );
  
  interactiveElements.forEach(element => {
    results.push(...testAriaAttributes(element));
    
    const keyboardTest = testKeyboardAccessibility(element);
    results.push({
      passed: keyboardTest.keyboardAccessible,
      level: 'A',
      criterion: '2.1.1 Keyboard',
      message: keyboardTest.keyboardAccessible
        ? 'Elemento é acessível por teclado'
        : 'Elemento não é acessível por teclado',
      element,
      severity: keyboardTest.keyboardAccessible ? 'info' : 'error',
    });
  });
  
  // Calcular resumo
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    warnings: results.filter(r => r.severity === 'warning').length,
    errors: results.filter(r => r.severity === 'error').length,
  };
  
  return { results, summary };
}

/**
 * Gera relatório de acessibilidade em formato legível
 */
export function generateAccessibilityReport(auditResults: ReturnType<typeof runAccessibilityAudit>): string {
  const { results, summary } = auditResults;
  
  let report = '# Relatório de Acessibilidade WCAG 2.1 AA\n\n';
  
  report += `## Resumo\n`;
  report += `- Total de testes: ${summary.total}\n`;
  report += `- Aprovados: ${summary.passed}\n`;
  report += `- Reprovados: ${summary.failed}\n`;
  report += `- Erros: ${summary.errors}\n`;
  report += `- Avisos: ${summary.warnings}\n\n`;
  
  const errors = results.filter(r => r.severity === 'error');
  if (errors.length > 0) {
    report += `## Erros (${errors.length})\n\n`;
    errors.forEach((error, index) => {
      report += `${index + 1}. **${error.criterion}**\n`;
      report += `   ${error.message}\n`;
      if (error.element) {
        report += `   Elemento: ${error.element.tagName.toLowerCase()}\n`;
      }
      report += `\n`;
    });
  }
  
  const warnings = results.filter(r => r.severity === 'warning');
  if (warnings.length > 0) {
    report += `## Avisos (${warnings.length})\n\n`;
    warnings.forEach((warning, index) => {
      report += `${index + 1}. **${warning.criterion}**\n`;
      report += `   ${warning.message}\n`;
      if (warning.element) {
        report += `   Elemento: ${warning.element.tagName.toLowerCase()}\n`;
      }
      report += `\n`;
    });
  }
  
  return report;
}