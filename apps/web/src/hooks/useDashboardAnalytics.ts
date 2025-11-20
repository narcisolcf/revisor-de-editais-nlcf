/**
 * useDashboardAnalytics Hook - Hook customizado para Dashboard Analytics
 *
 * Integra com Firestore para obter dados em tempo real de:
 * - Métricas do dashboard
 * - Análises recentes
 * - Tendências e estatísticas
 * - Performance do sistema
 *
 * Usa o AnalyticsService para gerenciar subscrições Firestore
 */

import { useState, useEffect, useCallback } from 'react';
import {
  AnalyticsService,
  DashboardMetrics,
  DocumentAnalysis,
  TrendData,
  IssueData,
  PerformanceMetricData,
} from '@/services/AnalyticsService';

export interface DashboardAnalyticsState {
  // Dados
  metrics: DashboardMetrics | null;
  recentAnalyses: DocumentAnalysis[];
  trendData: {
    documents: TrendData[];
    processing: TrendData[];
    scores: TrendData[];
  } | null;
  issues: IssueData[];
  performanceMetrics: PerformanceMetricData[];

  // Estados
  loading: boolean;
  error: string | null;

  // Métodos
  refresh: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf') => Promise<void>;
}

export interface UseDashboardAnalyticsOptions {
  organizationId?: string;
  recentAnalysesLimit?: number;
  trendMonths?: number;
  enableRealtime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // em ms
}

const DEFAULT_OPTIONS: UseDashboardAnalyticsOptions = {
  recentAnalysesLimit: 10,
  trendMonths: 6,
  enableRealtime: true,
  autoRefresh: false,
  refreshInterval: 60000, // 1 minuto
};

/**
 * Hook para gerenciar dados de analytics do dashboard
 */
export function useDashboardAnalytics(
  options: UseDashboardAnalyticsOptions = {}
): DashboardAnalyticsState {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Estados
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<DocumentAnalysis[]>([]);
  const [trendData, setTrendData] = useState<{
    documents: TrendData[];
    processing: TrendData[];
    scores: TrendData[];
  } | null>(null);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetricData[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar todos os dados do dashboard
   */
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo para melhor performance
      const [
        metricsData,
        analysesData,
        trendsData,
        issuesData,
        performanceData,
      ] = await Promise.all([
        AnalyticsService.getDashboardMetrics(opts.organizationId),
        AnalyticsService.getRecentAnalyses(opts.recentAnalysesLimit),
        AnalyticsService.getTrendData(opts.trendMonths),
        AnalyticsService.getIssuesBreakdown(),
        AnalyticsService.getPerformanceMetrics(),
      ]);

      setMetrics(metricsData);
      setRecentAnalyses(analysesData);
      setTrendData(trendsData);
      setIssues(issuesData);
      setPerformanceMetrics(performanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(errorMessage);
      console.error('Erro ao carregar dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [opts.organizationId, opts.recentAnalysesLimit, opts.trendMonths]);

  /**
   * Configurar subscrições em tempo real
   */
  useEffect(() => {
    if (!opts.enableRealtime) {
      return;
    }

    let unsubscribeMetrics: (() => void) | undefined;
    let unsubscribeAnalyses: (() => void) | undefined;

    // Subscrição para métricas
    try {
      unsubscribeMetrics = AnalyticsService.subscribeToMetrics(
        (newMetrics) => {
          setMetrics(newMetrics);
        },
        opts.organizationId
      );
    } catch (err) {
      console.error('Erro ao configurar subscrição de métricas:', err);
    }

    // Subscrição para análises recentes
    try {
      unsubscribeAnalyses = AnalyticsService.subscribeToRecentAnalyses(
        (newAnalyses) => {
          setRecentAnalyses(newAnalyses);
        },
        opts.recentAnalysesLimit
      );
    } catch (err) {
      console.error('Erro ao configurar subscrição de análises:', err);
    }

    // Cleanup
    return () => {
      if (unsubscribeMetrics) unsubscribeMetrics();
      if (unsubscribeAnalyses) unsubscribeAnalyses();
    };
  }, [opts.enableRealtime, opts.organizationId, opts.recentAnalysesLimit]);

  /**
   * Configurar auto-refresh para dados que não têm subscrição real-time
   */
  useEffect(() => {
    if (!opts.autoRefresh || !opts.refreshInterval) {
      return;
    }

    const refreshTrendDataAndIssues = async () => {
      try {
        const [trendsData, issuesData, performanceData] = await Promise.all([
          AnalyticsService.getTrendData(opts.trendMonths),
          AnalyticsService.getIssuesBreakdown(),
          AnalyticsService.getPerformanceMetrics(),
        ]);

        setTrendData(trendsData);
        setIssues(issuesData);
        setPerformanceMetrics(performanceData);
      } catch (err) {
        console.error('Erro ao atualizar dados:', err);
      }
    };

    const intervalId = setInterval(refreshTrendDataAndIssues, opts.refreshInterval);

    return () => clearInterval(intervalId);
  }, [opts.autoRefresh, opts.refreshInterval, opts.trendMonths]);

  /**
   * Carregar dados inicialmente
   */
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Método para refresh manual
   */
  const refresh = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  /**
   * Exportar dados do dashboard
   */
  const exportData = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        await exportToCSV();
      } else if (format === 'pdf') {
        await exportToPDF();
      }
    } catch (err) {
      console.error('Erro ao exportar dados:', err);
      throw err;
    }
  }, [metrics, recentAnalyses, trendData, issues, performanceMetrics]);

  /**
   * Exportar para CSV
   */
  const exportToCSV = useCallback(async () => {
    if (!metrics || !recentAnalyses) {
      throw new Error('Dados não disponíveis para exportação');
    }

    // Preparar dados CSV
    const csvRows: string[] = [];

    // Cabeçalho
    csvRows.push('# Dashboard Analytics - LicitaReview');
    csvRows.push(`# Exportado em: ${new Date().toLocaleString('pt-BR')}`);
    csvRows.push('');

    // Métricas principais
    csvRows.push('## Métricas Principais');
    csvRows.push('Métrica,Valor');
    csvRows.push(`Total de Documentos,${metrics.totalDocuments}`);
    csvRows.push(`Score Médio,${metrics.averageScore.toFixed(2)}%`);
    csvRows.push(`Tempo Médio de Processamento,${metrics.averageProcessingTime.toFixed(2)}s`);
    csvRows.push(`Taxa de Sucesso,${metrics.successRate.toFixed(2)}%`);
    csvRows.push('');

    // Análises recentes
    csvRows.push('## Análises Recentes');
    csvRows.push('ID,Nome,Tipo,Status,Score,Data,Tempo de Processamento');
    recentAnalyses.forEach((analysis) => {
      csvRows.push(
        `${analysis.id},${analysis.name},${analysis.type},${analysis.status},${analysis.score.toFixed(2)},${analysis.createdAt.toLocaleString('pt-BR')},${analysis.processingTime.toFixed(2)}s`
      );
    });
    csvRows.push('');

    // Performance metrics
    if (performanceMetrics.length > 0) {
      csvRows.push('## Métricas de Performance');
      csvRows.push('Métrica,Valor,Unidade,Target,Status,Tendência');
      performanceMetrics.forEach((metric) => {
        csvRows.push(
          `${metric.name},${metric.value.toFixed(2)},${metric.unit},${metric.target || 'N/A'},${metric.status},${metric.trend}`
        );
      });
    }

    // Criar blob e download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [metrics, recentAnalyses, performanceMetrics]);

  /**
   * Exportar para PDF
   */
  const exportToPDF = useCallback(async () => {
    if (!metrics || !recentAnalyses) {
      throw new Error('Dados não disponíveis para exportação');
    }

    // Criar HTML para conversão em PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dashboard Analytics - LicitaReview</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #2563eb; color: white; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .metric-box { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .metric-label { font-size: 14px; color: #6b7280; }
        </style>
      </head>
      <body>
        <h1>Dashboard Analytics - LicitaReview</h1>
        <p><strong>Exportado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>

        <h2>Métricas Principais</h2>
        <div class="metric-box">
          <div class="metric-value">${metrics.totalDocuments}</div>
          <div class="metric-label">Total de Documentos</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${metrics.averageScore.toFixed(2)}%</div>
          <div class="metric-label">Score Médio</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${metrics.averageProcessingTime.toFixed(2)}s</div>
          <div class="metric-label">Tempo Médio de Processamento</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">${metrics.successRate.toFixed(2)}%</div>
          <div class="metric-label">Taxa de Sucesso</div>
        </div>

        <h2>Análises Recentes</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Score</th>
              <th>Data</th>
              <th>Tempo</th>
            </tr>
          </thead>
          <tbody>
            ${recentAnalyses.map((analysis) => `
              <tr>
                <td>${analysis.name}</td>
                <td>${analysis.type}</td>
                <td>${analysis.status}</td>
                <td>${analysis.score.toFixed(2)}%</td>
                <td>${analysis.createdAt.toLocaleString('pt-BR')}</td>
                <td>${analysis.processingTime.toFixed(2)}s</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${performanceMetrics.length > 0 ? `
          <h2>Métricas de Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
                <th>Target</th>
                <th>Status</th>
                <th>Tendência</th>
              </tr>
            </thead>
            <tbody>
              ${performanceMetrics.map((metric) => `
                <tr>
                  <td>${metric.name}</td>
                  <td>${metric.value.toFixed(2)} ${metric.unit}</td>
                  <td>${metric.target ? metric.target.toFixed(2) + ' ' + metric.unit : 'N/A'}</td>
                  <td>${metric.status}</td>
                  <td>${metric.trend} (${metric.trendValue.toFixed(2)}%)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
      </body>
      </html>
    `;

    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Aguardar carregar e imprimir
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }, [metrics, recentAnalyses, performanceMetrics]);

  return {
    // Dados
    metrics,
    recentAnalyses,
    trendData,
    issues,
    performanceMetrics,

    // Estados
    loading,
    error,

    // Métodos
    refresh,
    exportData,
  };
}

/**
 * Hook simplificado para obter apenas métricas principais
 */
export function useDashboardMetrics(organizationId?: string) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadMetrics = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getDashboardMetrics(organizationId);
        setMetrics(data);

        // Configurar real-time
        unsubscribe = AnalyticsService.subscribeToMetrics(
          (newMetrics) => setMetrics(newMetrics),
          organizationId
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar métricas');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [organizationId]);

  return { metrics, loading, error };
}

/**
 * Hook para obter análises recentes
 */
export function useRecentAnalyses(limit: number = 10) {
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadAnalyses = async () => {
      try {
        setLoading(true);
        const data = await AnalyticsService.getRecentAnalyses(limit);
        setAnalyses(data);

        // Configurar real-time
        unsubscribe = AnalyticsService.subscribeToRecentAnalyses(
          (newAnalyses) => setAnalyses(newAnalyses),
          limit
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar análises');
      } finally {
        setLoading(false);
      }
    };

    loadAnalyses();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [limit]);

  return { analyses, loading, error };
}
