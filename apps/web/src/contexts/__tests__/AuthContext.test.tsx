/**
 * Testes para AuthContext
 *
 * Testa fluxos completos de autenticação:
 * - Login/Logout com email/senha
 * - Login com Google
 * - Registro de novos usuários
 * - Persistência de sessão
 * - Sincronização entre tabs
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import type { User } from 'firebase/auth';
import * as React from 'react';

// Mock do Firebase Auth
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockUpdateProfile = vi.fn();

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: any[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  signInWithPopup: (...args: any[]) => mockSignInWithPopup(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (...args: any[]) => mockOnAuthStateChanged(...args),
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  GoogleAuthProvider: vi.fn().mockImplementation(() => ({
    setCustomParameters: vi.fn()
  }))
}));

// Mock do Firestore
const mockSetDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockDoc = vi.fn();
const mockServerTimestamp = vi.fn(() => new Date());

vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  serverTimestamp: () => mockServerTimestamp()
}));

// Mock do Firebase config
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
  db: {}
}));

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock do auth-sync
const mockSyncLogin = vi.fn();
const mockSyncLogout = vi.fn();
const mockAuthSyncOnLogout = vi.fn();
const mockAuthSyncOnLogin = vi.fn();
const mockAuthSyncOnSessionCheck = vi.fn();

vi.mock('@/lib/auth-sync', () => ({
  authSync: {
    onLogout: (callback: () => void) => mockAuthSyncOnLogout(callback),
    onLogin: (callback: (userId: string) => void) => mockAuthSyncOnLogin(callback),
    onSessionCheck: (callback: () => boolean) => mockAuthSyncOnSessionCheck(callback)
  },
  syncLogin: (...args: any[]) => mockSyncLogin(...args),
  syncLogout: () => mockSyncLogout()
}));

describe('AuthContext', () => {
  const mockUser: Partial<User> = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockUserProfile = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'user' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Wrapper para renderizar hooks com Provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(AuthProvider, {}, children)
  );

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup padrão do onAuthStateChanged
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Simula que não há usuário logado inicialmente
      setTimeout(() => callback(null), 0);
      return vi.fn(); // unsubscribe
    });

    // Setup padrão do Firestore
    mockDoc.mockReturnValue({ id: 'test-doc' });
    mockGetDoc.mockResolvedValue({
      exists: () => false,
      data: () => null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve inicializar com estado padrão', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });

    it('deve carregar usuário existente na inicialização', async () => {
      // Mock de usuário já logado
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      // Mock do perfil existente no Firestore
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.currentUser).toEqual(mockUser);
        expect(result.current.userProfile).toEqual(mockUserProfile);
      });
    });
  });

  describe('Login com Email/Senha', () => {
    it('deve fazer login com sucesso', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          expect.anything(),
          'test@example.com',
          'password123'
        );
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Sucesso',
            description: 'Login realizado com sucesso!'
          })
        );
      });
    });

    it('deve tratar erro de usuário não encontrado', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'User not found'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.login('wrong@example.com', 'password123')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: 'Usuário não encontrado',
            variant: 'destructive'
          })
        );
      });
    });

    it('deve tratar erro de senha incorreta', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Wrong password'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Senha incorreta'
          })
        );
      });
    });

    it('deve tratar erro de muitas tentativas', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/too-many-requests',
        message: 'Too many requests'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.login('test@example.com', 'password123')
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Muitas tentativas. Tente novamente mais tarde'
          })
        );
      });
    });
  });

  describe('Login com Google', () => {
    it('deve fazer login com Google com sucesso', async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: mockUser
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.loginWithGoogle();
      });

      await waitFor(() => {
        expect(mockSignInWithPopup).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Login com Google realizado com sucesso!'
          })
        );
      });
    });

    it('deve tratar cancelamento do popup', async () => {
      mockSignInWithPopup.mockRejectedValue({
        code: 'auth/popup-closed-by-user',
        message: 'Popup closed'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.loginWithGoogle()).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Login cancelado pelo usuário'
          })
        );
      });
    });
  });

  describe('Registro de Usuário', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const newUser = { ...mockUser, uid: 'new-user-456' };
      mockCreateUserWithEmailAndPassword.mockResolvedValue({
        user: newUser
      });
      mockUpdateProfile.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.register('new@example.com', 'password123', {
          displayName: 'New User',
          organizationName: 'Test Org',
          cnpj: '12345678000190'
        });
      });

      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalled();
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          newUser,
          { displayName: 'New User' }
        );
        expect(mockSetDoc).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Conta criada com sucesso!'
          })
        );
      });
    });

    it('deve tratar erro de email já em uso', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/email-already-in-use',
        message: 'Email already in use'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.register('existing@example.com', 'password123', {
          displayName: 'Test User'
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Este email já está em uso'
          })
        );
      });
    });

    it('deve tratar erro de senha fraca', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValue({
        code: 'auth/weak-password',
        message: 'Weak password'
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        result.current.register('test@example.com', '123', {
          displayName: 'Test User'
        })
      ).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Senha muito fraca. Use pelo menos 6 caracteres'
          })
        );
      });
    });
  });

  describe('Logout', () => {
    it('deve fazer logout com sucesso', async () => {
      // Setup: usuário logado
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      mockSignOut.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(mockUser);
      });

      await act(async () => {
        await result.current.logout();
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
        expect(mockSyncLogout).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Logout realizado com sucesso!'
          })
        );
      });
    });

    it('deve tratar erro ao fazer logout', async () => {
      mockSignOut.mockRejectedValue(new Error('Logout error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(result.current.logout()).rejects.toThrow();

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Erro',
            description: 'Erro ao fazer logout'
          })
        );
      });
    });
  });

  describe('Sincronização entre Tabs', () => {
    it('deve notificar outras tabs quando fazer login', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => callback(mockUser), 0);
        return vi.fn();
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockSyncLogin).toHaveBeenCalledWith('test-user-123');
      });
    });

    it('deve registrar callbacks de sincronização', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(mockAuthSyncOnLogout).toHaveBeenCalled();
        expect(mockAuthSyncOnLogin).toHaveBeenCalled();
        expect(mockAuthSyncOnSessionCheck).toHaveBeenCalled();
      });
    });
  });

  describe('Criação de Perfil de Usuário', () => {
    it('deve criar perfil se não existir', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      // Perfil não existe
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        data: () => null
      });

      mockSetDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalled();
        const setDocCall = mockSetDoc.mock.calls[0];
        const userData = setDocCall[1];
        expect(userData.uid).toBe('test-user-123');
        expect(userData.email).toBe('test@example.com');
        expect(userData.role).toBe('user');
      });
    });

    it('deve carregar perfil existente', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue({
        user: mockUser
      });

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserProfile
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockSetDoc).not.toHaveBeenCalled();
      });
    });
  });
});
