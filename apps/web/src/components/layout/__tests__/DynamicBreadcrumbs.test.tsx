/**
 * Testes para DynamicBreadcrumbs
 *
 * Testa:
 * - Geração automática de breadcrumbs baseado na rota
 * - Tradução de nomes de rotas
 * - Links de navegação corretos
 * - Comportamento em diferentes níveis de profundidade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DynamicBreadcrumbs } from '../DynamicBreadcrumbs';
import { BrowserRouter } from 'react-router-dom';
import * as React from 'react';

// Mock do useLocation
const mockLocation = { pathname: '/', search: '', hash: '', state: null, key: 'default' };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation
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

describe('DynamicBreadcrumbs', () => {
  beforeEach(() => {
    mockLocation.pathname = '/';
  });

  describe('Renderização Base', () => {
    it('não deve renderizar nada na rota raiz', () => {
      mockLocation.pathname = '/';

      const { container } = renderWithRouter(<DynamicBreadcrumbs />);

      expect(container.firstChild).toBeNull();
    });

    it('deve renderizar breadcrumbs em rota de primeiro nível', () => {
      mockLocation.pathname = '/documentos';

      renderWithRouter(<DynamicBreadcrumbs />);

      // Deve ter home icon e nome da página
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });

    it('deve renderizar breadcrumbs em rota aninhada', () => {
      mockLocation.pathname = '/qa/classification';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('QA')).toBeInTheDocument();
      expect(screen.getByText('Classificação')).toBeInTheDocument();
    });

    it('deve renderizar breadcrumbs em rota profunda', () => {
      mockLocation.pathname = '/configuracoes/perfil/edicao';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Configurações')).toBeInTheDocument();
      expect(screen.getByText('Perfil')).toBeInTheDocument();
      expect(screen.getByText('Edicao')).toBeInTheDocument();
    });
  });

  describe('Tradução de Nomes', () => {
    it('deve traduzir nomes mapeados corretamente', () => {
      mockLocation.pathname = '/analise';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Análise')).toBeInTheDocument();
    });

    it('deve traduzir rotas aninhadas', () => {
      mockLocation.pathname = '/analise';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Análise')).toBeInTheDocument();
    });

    it('deve formatar nomes não mapeados corretamente', () => {
      mockLocation.pathname = '/minha-pagina';

      renderWithRouter(<DynamicBreadcrumbs />);

      // Deve capitalizar e remover hífens
      expect(screen.getByText('Minha Pagina')).toBeInTheDocument();
    });

    it('deve formatar múltiplas palavras com hífens', () => {
      mockLocation.pathname = '/nova-analise-documento';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Nova Analise Documento')).toBeInTheDocument();
    });
  });

  describe('Links de Navegação', () => {
    it('home link deve apontar para /dashboard', () => {
      mockLocation.pathname = '/documentos';

      renderWithRouter(<DynamicBreadcrumbs />);

      const homeLink = screen.getByRole('link', { name: /dashboard/i });
      expect(homeLink).toHaveAttribute('href', '/dashboard');
    });

    it('breadcrumb intermediário deve ser clicável', () => {
      mockLocation.pathname = '/qa/classification';

      renderWithRouter(<DynamicBreadcrumbs />);

      const qaLink = screen.getByRole('link', { name: 'QA' });
      expect(qaLink).toHaveAttribute('href', '/qa');
    });

    it('último breadcrumb não deve ser link', () => {
      mockLocation.pathname = '/documentos';

      renderWithRouter(<DynamicBreadcrumbs />);

      // O último item não deve ser um link
      const documentosText = screen.getByText('Documentos');
      expect(documentosText.tagName).toBe('SPAN');
    });

    it('deve gerar links corretos para rotas profundas', () => {
      mockLocation.pathname = '/config/template/editor';

      renderWithRouter(<DynamicBreadcrumbs />);

      const configLink = screen.getByRole('link', { name: 'Config' });
      expect(configLink).toHaveAttribute('href', '/config');

      const templateLink = screen.getByRole('link', { name: 'Template' });
      expect(templateLink).toHaveAttribute('href', '/config/template');
    });
  });

  describe('Separadores', () => {
    it('deve incluir separadores entre items', () => {
      mockLocation.pathname = '/documentos';

      const { container } = renderWithRouter(<DynamicBreadcrumbs />);

      // Deve ter pelo menos um separador (entre home e documentos)
      const separators = container.querySelectorAll('[role="presentation"]');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('deve ter separadores corretos em rota aninhada', () => {
      mockLocation.pathname = '/qa/classification';

      const { container } = renderWithRouter(<DynamicBreadcrumbs />);

      // Deve ter 2 separadores: home → qa → classification
      const separators = container.querySelectorAll('[role="presentation"]');
      expect(separators.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('deve tratar rota com trailing slash', () => {
      mockLocation.pathname = '/documentos/';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Documentos')).toBeInTheDocument();
    });

    it('deve tratar múltiplas slashes consecutivas', () => {
      mockLocation.pathname = '//documentos//qa//';

      renderWithRouter(<DynamicBreadcrumbs />);

      // Deve remover slashes vazias
      expect(screen.getByText('Documentos')).toBeInTheDocument();
      expect(screen.getByText('QA')).toBeInTheDocument();
    });

    it('deve tratar segmentos com números', () => {
      mockLocation.pathname = '/documento/123/edicao';

      renderWithRouter(<DynamicBreadcrumbs />);

      expect(screen.getByText('Documento')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('Edicao')).toBeInTheDocument();
    });
  });
});
