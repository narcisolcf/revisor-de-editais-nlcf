/**
 * Testes para useDashboardAnalytics Hook
 *
 * Testa:
 * - Carregamento de dados
 * - Subscrições em tempo real
 * - Auto-refresh
 * - Exportação de dados
 * - Estados de loading e erro
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDashboardAnalytics, useDashboardMetrics, useRecentAnalyses } from '../useDashboardAnalytics';
import * as AnalyticsService from '@/services/AnalyticsService';

// Mock do AnalyticsService
vi.mock('@/services/AnalyticsService');

describe('useDashboardAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de dados padrão
    (AnalyticsService.AnalyticsService.getDashboardMetrics as any) = vi.fn().mockResolvedValue({
      totalDocuments: 100,
      averageScore: 85.5,
      averageProcessingTime: 2.3,
      successRate: 95.0,
      trends: {
        documents: 10.0,
        score: 2.5,
        processingTime: -5.0,
        successRate: 1.5,
      },
    });

    (AnalyticsService.AnalyticsService.getRecentAnalyses as any) = vi.fn().mockResolvedValue([
      {
        id: 'doc1',
        documentId: 'edital_001',
        name: 'Edital 001',
        type: 'edital_licitacao',
        status: 'completed',
        score: 92.0,
        createdAt: new Date(),
        processingTime: 2.1,
      },
    ]);

    (AnalyticsService.AnalyticsService.getTrendData as any) = vi.fn().mockResolvedValue({
      documents: [{ name: 'Jan', value: 50 }],
      processing: [{ name: 'Jan', avgTime: 2.0 }],
      scores: [{ name: 'Jan', avgScore: 85.0 }],
    });

    (AnalyticsService.AnalyticsService.getIssuesBreakdown as any) = vi.fn().mockResolvedValue([
      {
        id: 'issue1',
        type: 'warning',
        category: 'Conformidade',
        title: 'Problema 1',
        description: 'Descrição',
        count: 10,
        percentage: 10.0,
        trend: 'stable',
        trendValue: 0,
      },
    ]);

    (AnalyticsService.AnalyticsService.getPerformanceMetrics as any) = vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Tempo de Processamento',
        value: 2.3,
        unit: 's',
        target: 3.0,
        status: 'good',
        trend: 'down',
        trendValue: 5.0,
        description: 'Tempo médio',
      },
    ]);

    (AnalyticsService.AnalyticsService.subscribeToMetrics as any) = vi.fn().mockReturnValue(vi.fn());
    (AnalyticsService.AnalyticsService.subscribeToRecentAnalyses as any) = vi.fn().mockReturnValue(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Carregamento de Dados', () => {
    it('deve carregar todos os dados ao montar', async () => {
      const { result } = renderHook(() => useDashboardAnalytics());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.metrics).toBeDefined();
      expect(result.current.recentAnalyses).toHaveLength(1);
      expect(result.current.trendData).toBeDefined();
      expect(result.current.issues).toHaveLength(1);
      expect(result.current.performanceMetrics).toHaveLength(1);
    });

    it('deve carregar dados em paralelo', async () => {
      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Verificar que todos os métodos foram chamados
      expect(AnalyticsService.AnalyticsService.getDashboardMetrics).toHaveBeenCalled();
      expect(AnalyticsService.AnalyticsService.getRecentAnalyses).toHaveBeenCalled();
      expect(AnalyticsService.AnalyticsService.getTrendData).toHaveBeenCalled();
      expect(AnalyticsService.AnalyticsService.getIssuesBreakdown).toHaveBeenCalled();
      expect(AnalyticsService.AnalyticsService.getPerformanceMetrics).toHaveBeenCalled();
    });

    it('deve respeitar opções fornecidas', async () => {
      const options = {
        organizationId: 'org123',
        recentAnalysesLimit: 20,
        trendMonths: 12,
        enableRealtime: true,
      };

      renderHook(() => useDashboardAnalytics(options));

      await waitFor(() => {
        expect(AnalyticsService.AnalyticsService.getDashboardMetrics).toHaveBeenCalledWith(
          options.organizationId
        );
        expect(AnalyticsService.AnalyticsService.getRecentAnalyses).toHaveBeenCalledWith(
          options.recentAnalysesLimit
        );
        expect(AnalyticsService.AnalyticsService.getTrendData).toHaveBeenCalledWith(
          options.trendMonths
        );
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve capturar erro ao carregar dados', async () => {
      const errorMessage = 'Erro ao carregar métricas';
      (AnalyticsService.AnalyticsService.getDashboardMetrics as any) = vi
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('deve continuar carregando outros dados se um falhar', async () => {
      (AnalyticsService.AnalyticsService.getTrendData as any) = vi
        .fn()
        .mockRejectedValue(new Error('Erro'));

      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Outros dados devem ser carregados
      expect(result.current.metrics).toBeDefined();
      expect(result.current.recentAnalyses).toBeDefined();
    });
  });

  describe('Subscrições em Tempo Real', () => {
    it('deve configurar subscrições quando enableRealtime = true', async () => {
      renderHook(() =>
        useDashboardAnalytics({
          enableRealtime: true,
        })
      );

      await waitFor(() => {
        expect(AnalyticsService.AnalyticsService.subscribeToMetrics).toHaveBeenCalled();
        expect(AnalyticsService.AnalyticsService.subscribeToRecentAnalyses).toHaveBeenCalled();
      });
    });

    it('não deve configurar subscrições quando enableRealtime = false', async () => {
      renderHook(() =>
        useDashboardAnalytics({
          enableRealtime: false,
        })
      );

      await waitFor(() => {
        expect(AnalyticsService.AnalyticsService.subscribeToMetrics).not.toHaveBeenCalled();
        expect(AnalyticsService.AnalyticsService.subscribeToRecentAnalyses).not.toHaveBeenCalled();
      });
    });

    it('deve limpar subscrições ao desmontar', async () => {
      const mockUnsubscribe = vi.fn();
      (AnalyticsService.AnalyticsService.subscribeToMetrics as any) = vi
        .fn()
        .mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() =>
        useDashboardAnalytics({
          enableRealtime: true,
        })
      );

      await waitFor(() => {
        expect(AnalyticsService.AnalyticsService.subscribeToMetrics).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Método refresh', () => {
    it('deve recarregar todos os dados', async () => {
      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.clearAllMocks();

      await act(async () => {
        await result.current.refresh();
      });

      expect(AnalyticsService.AnalyticsService.getDashboardMetrics).toHaveBeenCalled();
      expect(AnalyticsService.AnalyticsService.getRecentAnalyses).toHaveBeenCalled();
    });
  });

  describe('Exportação de Dados', () => {
    it('deve exportar para CSV', async () => {
      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock do DOM para download
      const mockLink = {
        click: vi.fn(),
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      global.URL.revokeObjectURL = vi.fn();

      await act(async () => {
        await result.current.exportData('csv');
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('deve exportar para PDF', async () => {
      const { result } = renderHook(() => useDashboardAnalytics());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock window.open
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        print: vi.fn(),
        onload: null as any,
      };
      global.open = vi.fn().mockReturnValue(mockPrintWindow);

      await act(async () => {
        await result.current.exportData('pdf');
      });

      expect(global.open).toHaveBeenCalled();
      expect(mockPrintWindow.document.write).toHaveBeenCalled();
    });
  });
});

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (AnalyticsService.AnalyticsService.getDashboardMetrics as any) = vi.fn().mockResolvedValue({
      totalDocuments: 100,
      averageScore: 85.5,
      averageProcessingTime: 2.3,
      successRate: 95.0,
      trends: {
        documents: 10.0,
        score: 2.5,
        processingTime: -5.0,
        successRate: 1.5,
      },
    });

    (AnalyticsService.AnalyticsService.subscribeToMetrics as any) = vi.fn().mockReturnValue(vi.fn());
  });

  it('deve carregar apenas métricas', async () => {
    const { result } = renderHook(() => useDashboardMetrics());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toBeDefined();
    expect(result.current.metrics?.totalDocuments).toBe(100);
  });

  it('deve configurar subscrição', async () => {
    renderHook(() => useDashboardMetrics('org123'));

    await waitFor(() => {
      expect(AnalyticsService.AnalyticsService.subscribeToMetrics).toHaveBeenCalledWith(
        expect.any(Function),
        'org123'
      );
    });
  });
});

describe('useRecentAnalyses', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (AnalyticsService.AnalyticsService.getRecentAnalyses as any) = vi.fn().mockResolvedValue([
      {
        id: 'doc1',
        documentId: 'edital_001',
        name: 'Edital 001',
        type: 'edital_licitacao',
        status: 'completed',
        score: 92.0,
        createdAt: new Date(),
        processingTime: 2.1,
      },
    ]);

    (AnalyticsService.AnalyticsService.subscribeToRecentAnalyses as any) = vi.fn().mockReturnValue(vi.fn());
  });

  it('deve carregar análises recentes', async () => {
    const { result } = renderHook(() => useRecentAnalyses(15));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.analyses).toHaveLength(1);
    expect(result.current.analyses[0].id).toBe('doc1');
  });

  it('deve respeitar limite fornecido', async () => {
    renderHook(() => useRecentAnalyses(20));

    await waitFor(() => {
      expect(AnalyticsService.AnalyticsService.getRecentAnalyses).toHaveBeenCalledWith(20);
    });
  });

  it('deve configurar subscrição', async () => {
    renderHook(() => useRecentAnalyses(10));

    await waitFor(() => {
      expect(AnalyticsService.AnalyticsService.subscribeToRecentAnalyses).toHaveBeenCalledWith(
        expect.any(Function),
        10
      );
    });
  });
});
