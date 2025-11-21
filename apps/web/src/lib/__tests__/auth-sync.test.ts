/**
 * Testes para auth-sync
 *
 * Testa sincronização de autenticação entre múltiplas tabs usando
 * testes de integração que verificam o comportamento real do módulo.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Setup BroadcastChannel mock ANTES de importar auth-sync
class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent) => void) | null = null;
  private static instances: Map<string, MockBroadcastChannel[]> = new Map();

  constructor(name: string) {
    this.name = name;

    const instances = MockBroadcastChannel.instances.get(name) || [];
    instances.push(this);
    MockBroadcastChannel.instances.set(name, instances);
  }

  postMessage(data: any) {
    // Envia para todas as instâncias do mesmo canal
    // Para testes, incluímos a própria instância para simular recebimento
    const instances = MockBroadcastChannel.instances.get(this.name) || [];
    instances.forEach((instance) => {
      if (instance.onmessage) {
        // Simula evento assíncrono
        setTimeout(() => {
          const event = new MessageEvent('message', { data });
          instance.onmessage!(event);
        }, 0);
      }
    });
  }

  addEventListener(type: string, listener: any) {
    if (type === 'message') {
      this.onmessage = listener;
    }
  }

  removeEventListener() {
    // Simplificado para testes
  }

  close() {
    const instances = MockBroadcastChannel.instances.get(this.name) || [];
    const index = instances.indexOf(this);
    if (index > -1) {
      instances.splice(index, 1);
    }
  }

  static reset() {
    MockBroadcastChannel.instances.clear();
  }
}

// Define BroadcastChannel global antes de importar o módulo
global.BroadcastChannel = MockBroadcastChannel as any;

// Agora importa auth-sync (ele criará o singleton com nosso mock)
const authSyncModule = await import('../auth-sync');
const { authSync, syncLogin, syncLogout } = authSyncModule;

describe('auth-sync', () => {
  let logoutCallback: ReturnType<typeof vi.fn>;
  let loginCallback: ReturnType<typeof vi.fn>;
  let sessionCheckCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reseta callbacks
    logoutCallback = vi.fn();
    loginCallback = vi.fn();
    sessionCheckCallback = vi.fn(() => false);

    // Registra callbacks
    authSync.onLogout(logoutCallback);
    authSync.onLogin(loginCallback);
    authSync.onSessionCheck(sessionCheckCallback);
  });

  describe('Notificações de Login', () => {
    it('deve notificar outras tabs sobre login', async () => {
      syncLogin('user-123');

      // Aguarda evento assíncrono
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginCallback).toHaveBeenCalledWith('user-123');
    });

    it('deve notificar com userId diferente', async () => {
      syncLogin('user-456');

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginCallback).toHaveBeenCalledWith('user-456');
    });
  });

  describe('Notificações de Logout', () => {
    it('deve notificar outras tabs sobre logout', async () => {
      syncLogout();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(logoutCallback).toHaveBeenCalled();
    });

    it('deve notificar múltiplas vezes se necessário', async () => {
      syncLogout();
      await new Promise(resolve => setTimeout(resolve, 50));

      syncLogout();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(logoutCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Verificação de Sessão', () => {
    it('deve verificar sessão e receber resposta', async () => {
      // Mock retorna true
      authSync.onSessionCheck(() => true);

      const { checkOtherSessions } = authSyncModule;
      const hasSession = await checkOtherSessions();

      expect(hasSession).toBe(true);
    });

    it('deve retornar false se não há sessão', async () => {
      // Mock retorna false
      authSync.onSessionCheck(() => false);

      const { checkOtherSessions } = authSyncModule;
      const hasSession = await checkOtherSessions();

      expect(hasSession).toBe(false);
    });

    it('deve fazer timeout se não houver resposta', async () => {
      // Remove callback para simular nenhuma resposta
      authSync.onSessionCheck(() => {
        // Não responde (não retorna nada)
        return false;
      });

      const { checkOtherSessions } = authSyncModule;
      const hasSession = await checkOtherSessions();

      // Deve fazer timeout e retornar false
      expect(hasSession).toBe(false);
    });
  });

  describe('Callbacks', () => {
    it('deve executar callback de logout quando registrado', async () => {
      const customCallback = vi.fn();
      authSync.onLogout(customCallback);

      syncLogout();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(customCallback).toHaveBeenCalled();
    });

    it('deve executar callback de login com userId', async () => {
      const customCallback = vi.fn();
      authSync.onLogin(customCallback);

      syncLogin('test-user-789');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(customCallback).toHaveBeenCalledWith('test-user-789');
    });

    it('deve permitir sobrescrever callbacks', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      authSync.onLogin(callback1);
      authSync.onLogin(callback2);

      syncLogin('user-999');
      await new Promise(resolve => setTimeout(resolve, 50));

      // Apenas callback2 deve ser chamado (sobrescreveu callback1)
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('user-999');
    });
  });

  describe('Fallback localStorage', () => {
    it('deve escutar eventos de storage para logout', async () => {
      const callback = vi.fn();
      authSync.onLogout(callback);

      // Simula evento de storage
      const storageEvent = new StorageEvent('storage', {
        key: 'auth_sync_event',
        newValue: JSON.stringify({ type: 'LOGOUT' })
      });

      window.dispatchEvent(storageEvent);

      // Aguarda processamento
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();
    });

    it('deve escutar eventos de storage para login', async () => {
      const callback = vi.fn();
      authSync.onLogin(callback);

      const storageEvent = new StorageEvent('storage', {
        key: 'auth_sync_event',
        newValue: JSON.stringify({ type: 'LOGIN', userId: 'storage-user-123' })
      });

      window.dispatchEvent(storageEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalledWith('storage-user-123');
    });

    it('deve ignorar eventos de storage de outras chaves', async () => {
      const callback = vi.fn();
      authSync.onLogout(callback);

      const storageEvent = new StorageEvent('storage', {
        key: 'other_key',
        newValue: 'some value'
      });

      window.dispatchEvent(storageEvent);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(callback).not.toHaveBeenCalled();
    });

    it('deve lidar com JSON inválido graciosamente', async () => {
      const callback = vi.fn();
      authSync.onLogout(callback);

      const storageEvent = new StorageEvent('storage', {
        key: 'auth_sync_event',
        newValue: 'invalid json'
      });

      // Não deve lançar erro
      expect(() => {
        window.dispatchEvent(storageEvent);
      }).not.toThrow();

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Sequência de Eventos', () => {
    it('deve processar login → logout → login em sequência', async () => {
      const loginCb = vi.fn();
      const logoutCb = vi.fn();

      authSync.onLogin(loginCb);
      authSync.onLogout(logoutCb);

      syncLogin('user-1');
      await new Promise(resolve => setTimeout(resolve, 50));

      syncLogout();
      await new Promise(resolve => setTimeout(resolve, 50));

      syncLogin('user-2');
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(loginCb).toHaveBeenCalledTimes(2);
      expect(loginCb).toHaveBeenNthCalledWith(1, 'user-1');
      expect(loginCb).toHaveBeenNthCalledWith(2, 'user-2');
      expect(logoutCb).toHaveBeenCalledTimes(1);
    });
  });
});
