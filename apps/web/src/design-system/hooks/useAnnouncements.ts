import { useCallback, useEffect, useRef } from 'react';

export type AnnouncementPriority = 'polite' | 'assertive';

export interface AnnouncementOptions {
  /** Prioridade do anúncio */
  priority?: AnnouncementPriority;
  /** Delay antes do anúncio (em ms) */
  delay?: number;
  /** Se deve limpar anúncios anteriores */
  clearPrevious?: boolean;
}

export interface UseAnnouncementsReturn {
  /** Função para anunciar uma mensagem */
  announce: (message: string, options?: AnnouncementOptions) => void;
  /** Função para anunciar com prioridade polite */
  announcePolite: (message: string, delay?: number) => void;
  /** Função para anunciar com prioridade assertive */
  announceAssertive: (message: string, delay?: number) => void;
  /** Função para limpar todos os anúncios */
  clearAnnouncements: () => void;
  /** Função para anunciar status de carregamento */
  announceLoading: (message?: string) => void;
  /** Função para anunciar sucesso */
  announceSuccess: (message: string) => void;
  /** Função para anunciar erro */
  announceError: (message: string) => void;
  /** Função para anunciar mudança de página/rota */
  announcePageChange: (pageName: string) => void;
}

/**
 * Hook para anúncios de acessibilidade via screen readers
 * 
 * Implementa as diretrizes WCAG 2.1 AA para comunicação com tecnologias assistivas:
 * - Regiões live (aria-live) para anúncios dinâmicos
 * - Diferentes prioridades (polite vs assertive)
 * - Gerenciamento de timing para evitar spam
 * - Funções de conveniência para casos comuns
 * - Limpeza automática de anúncios
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     announce,
 *     announceSuccess,
 *     announceError,
 *     announceLoading
 *   } = useAnnouncements();
 * 
 *   const handleSave = async () => {
 *     announceLoading('Salvando dados...');
 *     try {
 *       await saveData();
 *       announceSuccess('Dados salvos com sucesso!');
 *     } catch (error) {
 *       announceError('Erro ao salvar dados. Tente novamente.');
 *     }
 *   };
 * 
 *   return (
 *     <button onClick={handleSave}>
 *       Salvar
 *     </button>
 *   );
 * }
 * ```
 */
export function useAnnouncements(): UseAnnouncementsReturn {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Criar elementos de anúncio se não existirem
  useEffect(() => {
    // Verificar se já existem elementos globais
    let politeElement = document.getElementById('dsgov-announcements-polite') as HTMLDivElement;
    let assertiveElement = document.getElementById('dsgov-announcements-assertive') as HTMLDivElement;

    // Criar elemento polite se não existir
    if (!politeElement) {
      politeElement = document.createElement('div');
      politeElement.id = 'dsgov-announcements-polite';
      politeElement.setAttribute('aria-live', 'polite');
      politeElement.setAttribute('aria-atomic', 'true');
      politeElement.setAttribute('aria-relevant', 'text');
      politeElement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
        margin: 0;
        padding: 0;
      `;
      document.body.appendChild(politeElement);
    }

    // Criar elemento assertive se não existir
    if (!assertiveElement) {
      assertiveElement = document.createElement('div');
      assertiveElement.id = 'dsgov-announcements-assertive';
      assertiveElement.setAttribute('aria-live', 'assertive');
      assertiveElement.setAttribute('aria-atomic', 'true');
      assertiveElement.setAttribute('aria-relevant', 'text');
      assertiveElement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
        margin: 0;
        padding: 0;
      `;
      document.body.appendChild(assertiveElement);
    }

    politeRef.current = politeElement;
    assertiveRef.current = assertiveElement;

    return () => {
      // Limpar timeout ao desmontar
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Função principal para anunciar
  const announce = useCallback(
    (message: string, options: AnnouncementOptions = {}) => {
      const {
        priority = 'polite',
        delay = 0,
        clearPrevious = false,
      } = options;

      if (!message.trim()) return;

      const targetElement = priority === 'assertive' ? assertiveRef.current : politeRef.current;
      if (!targetElement) return;

      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Limpar anúncios anteriores se solicitado
      if (clearPrevious) {
        if (politeRef.current) politeRef.current.textContent = '';
        if (assertiveRef.current) assertiveRef.current.textContent = '';
      }

      // Função para fazer o anúncio
      const makeAnnouncement = () => {
        if (targetElement) {
          // Limpar primeiro para garantir que o screen reader detecte a mudança
          targetElement.textContent = '';
          
          // Usar requestAnimationFrame para garantir que a limpeza seja processada
          requestAnimationFrame(() => {
            if (targetElement) {
              targetElement.textContent = message;
            }
          });
        }
      };

      // Aplicar delay se especificado
      if (delay > 0) {
        timeoutRef.current = setTimeout(makeAnnouncement, delay);
      } else {
        makeAnnouncement();
      }
    },
    []
  );

  // Função para anúncios polite
  const announcePolite = useCallback(
    (message: string, delay = 0) => {
      announce(message, { priority: 'polite', delay });
    },
    [announce]
  );

  // Função para anúncios assertive
  const announceAssertive = useCallback(
    (message: string, delay = 0) => {
      announce(message, { priority: 'assertive', delay });
    },
    [announce]
  );

  // Função para limpar todos os anúncios
  const clearAnnouncements = useCallback(() => {
    if (politeRef.current) politeRef.current.textContent = '';
    if (assertiveRef.current) assertiveRef.current.textContent = '';
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Função para anunciar carregamento
  const announceLoading = useCallback(
    (message = 'Carregando...') => {
      announcePolite(message);
    },
    [announcePolite]
  );

  // Função para anunciar sucesso
  const announceSuccess = useCallback(
    (message: string) => {
      announcePolite(`Sucesso: ${message}`);
    },
    [announcePolite]
  );

  // Função para anunciar erro
  const announceError = useCallback(
    (message: string) => {
      announceAssertive(`Erro: ${message}`);
    },
    [announceAssertive]
  );

  // Função para anunciar mudança de página
  const announcePageChange = useCallback(
    (pageName: string) => {
      announcePolite(`Navegou para ${pageName}`, 500);
    },
    [announcePolite]
  );

  return {
    announce,
    announcePolite,
    announceAssertive,
    clearAnnouncements,
    announceLoading,
    announceSuccess,
    announceError,
    announcePageChange,
  };
}

/**
 * Hook para anúncios de mudanças de rota
 * Útil para SPAs que precisam anunciar mudanças de página
 */
export function useRouteAnnouncements() {
  const { announcePageChange } = useAnnouncements();

  const announceRoute = useCallback(
    (routeName: string, routePath?: string) => {
      const message = routePath 
        ? `${routeName} - ${routePath}`
        : routeName;
      announcePageChange(message);
    },
    [announcePageChange]
  );

  return { announceRoute };
}

/**
 * Hook para anúncios de formulário
 * Útil para validação e feedback de formulários
 */
export function useFormAnnouncements() {
  const { announce, announceError, announceSuccess } = useAnnouncements();

  const announceValidationError = useCallback(
    (fieldName: string, errorMessage: string) => {
      announceError(`${fieldName}: ${errorMessage}`);
    },
    [announceError]
  );

  const announceFormSubmission = useCallback(
    (isSubmitting: boolean) => {
      if (isSubmitting) {
        announce('Enviando formulário...', { priority: 'polite' });
      }
    },
    [announce]
  );

  const announceFormSuccess = useCallback(
    (message = 'Formulário enviado com sucesso') => {
      announceSuccess(message);
    },
    [announceSuccess]
  );

  const announceFormError = useCallback(
    (message = 'Erro ao enviar formulário. Verifique os campos e tente novamente.') => {
      announceError(message);
    },
    [announceError]
  );

  return {
    announceValidationError,
    announceFormSubmission,
    announceFormSuccess,
    announceFormError,
  };
}