/**
 * Testes para useAuthRedirect
 *
 * Testa redirecionamentos automáticos baseados em estado de autenticação:
 * - Redirect após login
 * - Redirect após logout
 * - Proteção de rotas
 * - Deep linking com query params
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthRedirect } from '../useAuthRedirect';
import * as React from 'react';
import type { User } from 'firebase/auth';

// Mock do useAuth
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock do react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/login',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation
}));

describe('useAuthRedirect', () => {
  const mockUser: Partial<User> = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/login';
    mockLocation.search = '';
  });

  describe('Redirect após Login', () => {
    it('deve redirecionar para dashboard após login', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('deve redirecionar para rota especificada via query param', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';
      mockLocation.search = '?redirect=%2Feditals%2F123';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith('/editals/123', { replace: true });
    });

    it('deve usar loginRedirect customizado', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';

      renderHook(() => useAuthRedirect({
        loginRedirect: '/custom-home'
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/custom-home', { replace: true });
    });

    it('deve ignorar redirect param se useRedirectParam=false', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';
      mockLocation.search = '?redirect=%2Feditals%2F123';

      renderHook(() => useAuthRedirect({
        useRedirectParam: false
      }));

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Redirect após Logout', () => {
    it('deve redirecionar para login se não autenticado', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/dashboard';
      mockLocation.search = '';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith(
        '/login?redirect=%2Fdashboard',
        { replace: true }
      );
    });

    it('deve usar logoutRedirect customizado', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/dashboard';

      renderHook(() => useAuthRedirect({
        logoutRedirect: '/custom-login'
      }));

      expect(mockNavigate).toHaveBeenCalledWith(
        '/custom-login?redirect=%2Fdashboard',
        { replace: true }
      );
    });

    it('deve preservar query params ao redirecionar', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/editals/123';
      mockLocation.search = '?tab=analysis&view=detailed';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('redirect=%2Feditals%2F123%3Ftab%3Danalysis%26view%3Ddetailed'),
        { replace: true }
      );
    });
  });

  describe('Rotas Públicas', () => {
    it('não deve redirecionar se estiver em rota pública', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      // Testa cada rota pública
      const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

      publicRoutes.forEach(route => {
        mockNavigate.mockClear();
        mockLocation.pathname = route;

        renderHook(() => useAuthRedirect());

        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it('deve permitir rotas públicas customizadas', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/public-page';

      renderHook(() => useAuthRedirect({
        publicRoutes: ['/public-page', '/about']
      }));

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Estado de Loading', () => {
    it('não deve redirecionar enquanto loading', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: true
      });

      mockLocation.pathname = '/dashboard';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('deve redirecionar após loading completar', () => {
      const { rerender } = renderHook(() => useAuthRedirect());

      // Inicialmente loading
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: true
      });

      mockLocation.pathname = '/dashboard';
      rerender();

      expect(mockNavigate).not.toHaveBeenCalled();

      // Loading completa
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      rerender();

      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('não deve redirecionar se já estiver na rota correta', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/dashboard';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('deve lidar com redirect param vazio', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';
      mockLocation.search = '?redirect=';

      renderHook(() => useAuthRedirect());

      // Deve usar loginRedirect padrão
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('deve decodificar redirect param corretamente', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';
      mockLocation.search = '?redirect=%2Feditals%2F123%2Fanalysis';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith('/editals/123/analysis', { replace: true });
    });

    it('deve lidar com múltiplos query params', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';
      mockLocation.search = '?foo=bar&redirect=%2Fdashboard&baz=qux';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  describe('Reatividade', () => {
    it('deve redirecionar quando currentUser mudar', () => {
      // Inicialmente não autenticado
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/login';

      const { rerender } = renderHook(() => useAuthRedirect());

      expect(mockNavigate).not.toHaveBeenCalled();

      // Usuário faz login
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      rerender();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });

    it('deve redirecionar quando pathname mudar', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      // Inicialmente em rota pública
      mockLocation.pathname = '/login';
      const { rerender } = renderHook(() => useAuthRedirect());

      expect(mockNavigate).not.toHaveBeenCalled();

      // Simula mudança para rota protegida
      mockLocation.pathname = '/dashboard';
      mockLocation.search = '';
      rerender();

      // Como o mock de useLocation retorna o mesmo objeto mockLocation,
      // a mudança deve ser detectada pelo useEffect dependency array
      // que inclui location.pathname
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/login?redirect='),
        { replace: true }
      );
    });
  });

  describe('Opções do Hook', () => {
    it('deve aceitar todas as opções customizadas', () => {
      mockUseAuth.mockReturnValue({
        currentUser: null,
        loading: false
      });

      mockLocation.pathname = '/admin';
      mockLocation.search = '';

      vi.clearAllMocks(); // Limpa chamadas anteriores

      renderHook(() => useAuthRedirect({
        loginRedirect: '/home',
        logoutRedirect: '/signin',
        useRedirectParam: false,
        publicRoutes: ['/signin', '/signup', '/admin']
      }));

      // /admin é rota pública customizada, não deve redirecionar
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('deve funcionar sem opções (usar padrões)', () => {
      mockUseAuth.mockReturnValue({
        currentUser: mockUser,
        loading: false
      });

      mockLocation.pathname = '/login';

      renderHook(() => useAuthRedirect());

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
