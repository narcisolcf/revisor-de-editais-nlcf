/**
 * Auth Session Sync
 *
 * Sincroniza estado de autenticação entre múltiplas abas/janelas.
 * Usa BroadcastChannel API para comunicação entre tabs.
 */

type AuthSyncMessage =
  | { type: 'LOGOUT' }
  | { type: 'LOGIN'; userId: string }
  | { type: 'SESSION_CHECK' }
  | { type: 'SESSION_RESPONSE'; hasSession: boolean };

interface AuthSyncCallbacks {
  onLogout?: () => void;
  onLogin?: (userId: string) => void;
  onSessionCheck?: () => boolean;
}

class AuthSessionSync {
  private channel: BroadcastChannel | null = null;
  private callbacks: AuthSyncCallbacks = {};
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = typeof BroadcastChannel !== 'undefined';

    if (this.isSupported) {
      this.channel = new BroadcastChannel('auth_sync_channel');
      this.setupListeners();
    } else {
      console.warn('[AuthSync] BroadcastChannel não suportado, usando fallback localStorage');
      this.setupLocalStorageFallback();
    }
  }

  /**
   * Configura listeners para BroadcastChannel
   */
  private setupListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
      const message = event.data;

      switch (message.type) {
        case 'LOGOUT':
          console.log('[AuthSync] Recebeu evento de logout de outra tab');
          this.callbacks.onLogout?.();
          break;

        case 'LOGIN':
          console.log('[AuthSync] Recebeu evento de login de outra tab:', message.userId);
          this.callbacks.onLogin?.(message.userId);
          break;

        case 'SESSION_CHECK':
          console.log('[AuthSync] Recebeu verificação de sessão');
          const hasSession = this.callbacks.onSessionCheck?.() ?? false;
          this.sendMessage({ type: 'SESSION_RESPONSE', hasSession });
          break;

        case 'SESSION_RESPONSE':
          console.log('[AuthSync] Recebeu resposta de sessão:', message.hasSession);
          break;
      }
    };
  }

  /**
   * Fallback para browsers sem BroadcastChannel
   * Usa localStorage + storage event
   */
  private setupLocalStorageFallback() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'auth_sync_event' && event.newValue) {
        try {
          const message: AuthSyncMessage = JSON.parse(event.newValue);

          switch (message.type) {
            case 'LOGOUT':
              this.callbacks.onLogout?.();
              break;
            case 'LOGIN':
              this.callbacks.onLogin?.(message.userId);
              break;
          }
        } catch (error) {
          console.error('[AuthSync] Erro ao parsear mensagem do localStorage:', error);
        }
      }
    });
  }

  /**
   * Envia mensagem para outras tabs
   */
  private sendMessage(message: AuthSyncMessage) {
    if (this.isSupported && this.channel) {
      this.channel.postMessage(message);
    } else {
      // Fallback localStorage
      localStorage.setItem('auth_sync_event', JSON.stringify(message));
      // Remove imediatamente para permitir múltiplos eventos
      setTimeout(() => localStorage.removeItem('auth_sync_event'), 100);
    }
  }

  /**
   * Notifica outras tabs sobre logout
   */
  notifyLogout() {
    console.log('[AuthSync] Notificando logout para outras tabs');
    this.sendMessage({ type: 'LOGOUT' });
  }

  /**
   * Notifica outras tabs sobre login
   */
  notifyLogin(userId: string) {
    console.log('[AuthSync] Notificando login para outras tabs:', userId);
    this.sendMessage({ type: 'LOGIN', userId });
  }

  /**
   * Verifica se há sessão ativa em outras tabs
   */
  async checkSession(): Promise<boolean> {
    if (!this.isSupported) {
      // Fallback: verifica localStorage
      const hasLocalSession = !!localStorage.getItem('auth_token');
      return hasLocalSession;
    }

    return new Promise((resolve) => {
      let responded = false;

      const timeout = setTimeout(() => {
        if (!responded) {
          responded = true;
          resolve(false);
        }
      }, 500);

      const originalCallback = this.callbacks.onSessionCheck;

      // Temporariamente override callback
      const handler = (event: MessageEvent<AuthSyncMessage>) => {
        if (event.data.type === 'SESSION_RESPONSE' && !responded) {
          responded = true;
          clearTimeout(timeout);
          this.channel?.removeEventListener('message', handler as any);
          resolve(event.data.hasSession);
        }
      };

      this.channel?.addEventListener('message', handler as any);
      this.sendMessage({ type: 'SESSION_CHECK' });

      // Restaura callback original
      this.callbacks.onSessionCheck = originalCallback;
    });
  }

  /**
   * Registra callbacks
   */
  onLogout(callback: () => void) {
    this.callbacks.onLogout = callback;
  }

  onLogin(callback: (userId: string) => void) {
    this.callbacks.onLogin = callback;
  }

  onSessionCheck(callback: () => boolean) {
    this.callbacks.onSessionCheck = callback;
  }

  /**
   * Limpa recursos
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.callbacks = {};
  }
}

// Instância singleton
export const authSync = new AuthSessionSync();

// Helpers
export function syncLogout() {
  authSync.notifyLogout();
}

export function syncLogin(userId: string) {
  authSync.notifyLogin(userId);
}

export async function checkOtherSessions(): Promise<boolean> {
  return authSync.checkSession();
}

export default authSync;
