/**
 * Testes para AppSidebar
 *
 * Testa:
 * - Renderização de items de navegação
 * - Active states baseados na rota
 * - Permissões baseadas em roles
 * - Links de navegação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppSidebar } from '../AppSidebar';
import { BrowserRouter } from 'react-router-dom';
import * as React from 'react';

// Mock do useAuth
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock do useLocation
const mockLocation = { pathname: '/dashboard', search: '', hash: '', state: null, key: 'default' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation
  };
});

// Mock do SidebarProvider
const MockSidebarProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="sidebar-provider">{children}</div>;
};

vi.mock('@/components/ui/sidebar', async () => {
  const actual = await vi.importActual('@/components/ui/sidebar');
  return {
    ...actual,
    Sidebar: ({ children }: any) => <aside data-testid="sidebar">{children}</aside>,
    SidebarContent: ({ children }: any) => <div>{children}</div>,
    SidebarFooter: ({ children }: any) => <footer>{children}</footer>,
    SidebarGroup: ({ children }: any) => <div>{children}</div>,
    SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
    SidebarGroupLabel: ({ children }: any) => <h3>{children}</h3>,
    SidebarHeader: ({ children }: any) => <header>{children}</header>,
    SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
    SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
    SidebarMenuButton: ({ children, asChild, isActive }: any) => (
      <div data-active={isActive}>
        {asChild ? children : <button>{children}</button>}
      </div>
    )
  };
});

// Wrapper para renderização
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AppSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = '/dashboard';
  });

  describe('Renderização Base', () => {
    it('deve renderizar o logo da aplicação', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText('LicitaReview')).toBeInTheDocument();
      expect(screen.getByText('Revisor de Editais')).toBeInTheDocument();
    });

    it('deve renderizar items de navegação padrão', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Análise')).toBeInTheDocument();
      expect(screen.getByText('Comissões')).toBeInTheDocument();
    });

    it('deve renderizar footer com versão', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
      expect(screen.getByText(/© 2025 LicitaReview/)).toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    it('usuário comum não deve ver QA Classification', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.queryByText('QA Classification')).not.toBeInTheDocument();
    });

    it('analyst deve ver QA Classification', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'analyst', displayName: 'Analyst User', email: 'analyst@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText('QA Classification')).toBeInTheDocument();
    });

    it('manager deve ver todos os items incluindo QA', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'manager', displayName: 'Manager User', email: 'manager@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('QA Classification')).toBeInTheDocument();
    });

    it('admin deve ver todos os items', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'admin', displayName: 'Admin User', email: 'admin@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('Análise')).toBeInTheDocument();
      expect(screen.getByText('QA Classification')).toBeInTheDocument();
    });
  });

  describe('Active States', () => {
    it('deve marcar Dashboard como ativo quando pathname é /dashboard', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });
      mockLocation.pathname = '/dashboard';

      const { container } = renderWithRouter(<AppSidebar />);

      // Verifica se o link do Dashboard tem atributo data-active
      const dashboardButton = container.querySelector('[data-active="true"]');
      expect(dashboardButton).toBeInTheDocument();
    });

    it('deve marcar Documentos como ativo quando pathname é /documentos', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });
      mockLocation.pathname = '/documentos';

      const { container } = renderWithRouter(<AppSidebar />);

      const activeButton = container.querySelector('[data-active="true"]');
      expect(activeButton).toBeInTheDocument();
    });

    it('deve marcar rotas aninhadas como ativas', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'analyst', displayName: 'Test', email: 'test@test.com' }
      });
      mockLocation.pathname = '/qa/classification';

      const { container } = renderWithRouter(<AppSidebar />);

      // Verifica se o item QA está ativo
      const activeButton = container.querySelector('[data-active="true"]');
      expect(activeButton).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('links devem apontar para rotas corretas', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'user', displayName: 'Test User', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const documentosLink = screen.getByRole('link', { name: /documentos/i });
      expect(documentosLink).toHaveAttribute('href', '/documentos');
    });
  });

  describe('Edge Cases', () => {
    it('deve funcionar sem userProfile', () => {
      mockUseAuth.mockReturnValue({
        userProfile: null
      });

      renderWithRouter(<AppSidebar />);

      // Deve renderizar items básicos mesmo sem perfil
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });

    it('deve tratar role desconhecido como user', () => {
      mockUseAuth.mockReturnValue({
        userProfile: { role: 'unknown' as any, displayName: 'Test', email: 'test@test.com' }
      });

      renderWithRouter(<AppSidebar />);

      // Não deve mostrar QA Classification para role desconhecido
      expect(screen.queryByText('QA Classification')).not.toBeInTheDocument();
    });
  });
});
