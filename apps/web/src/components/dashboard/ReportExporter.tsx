/**
 * ReportExporter Component - Componente para exportação de relatórios
 *
 * Permite exportar dados do dashboard em diferentes formatos:
 * - CSV: Para análise em planilhas
 * - PDF: Para compartilhamento e impressão
 * - JSON: Para integração com outros sistemas
 */

import React, { useState } from 'react';
import {
  DashboardMetrics,
  DocumentAnalysis,
  TrendData,
  IssueData,
  PerformanceMetricData,
} from '@/services/AnalyticsService';
import { safeOpen } from '@/lib/browser-utils';

export interface ReportExporterProps {
  metrics: DashboardMetrics | null;
  recentAnalyses: DocumentAnalysis[];
  trendData?: {
    documents: TrendData[];
    processing: TrendData[];
    scores: TrendData[];
  } | null;
  issues?: IssueData[];
  performanceMetrics?: PerformanceMetricData[];
  organizationName?: string;
  className?: string;
}

export type ExportFormat = 'csv' | 'pdf' | 'json';

export const ReportExporter: React.FC<ReportExporterProps> = ({
  metrics,
  recentAnalyses,
  trendData,
  issues = [],
  performanceMetrics = [],
  organizationName = 'LicitaReview',
  className = '',
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  /**
   * Exportar relatório no formato selecionado
   */
  const handleExport = async () => {
    if (!metrics) {
      alert('Dados não disponíveis para exportação');
      return;
    }

    setExporting(true);

    try {
      switch (exportFormat) {
        case 'csv':
          await exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        case 'json':
          await exportToJSON();
          break;
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Exportar para CSV
   */
  const exportToCSV = async () => {
    if (!metrics) return;

    const csvRows: string[] = [];
    const timestamp = new Date().toLocaleString('pt-BR');
    const filename = `relatorio-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`;

    // Cabeçalho
    csvRows.push(`# Relatório Dashboard Analytics - ${organizationName}`);
    csvRows.push(`# Exportado em: ${timestamp}`);
    csvRows.push('');

    // Métricas principais
    csvRows.push('## MÉTRICAS PRINCIPAIS');
    csvRows.push('Métrica,Valor,Tendência (%)');
    csvRows.push(`Total de Documentos,${metrics.totalDocuments},${metrics.trends.documents.toFixed(2)}`);
    csvRows.push(`Score Médio,${metrics.averageScore.toFixed(2)}%,${metrics.trends.score.toFixed(2)}`);
    csvRows.push(
      `Tempo Médio de Processamento,${metrics.averageProcessingTime.toFixed(2)}s,${metrics.trends.processingTime.toFixed(2)}`
    );
    csvRows.push(`Taxa de Sucesso,${metrics.successRate.toFixed(2)}%,${metrics.trends.successRate.toFixed(2)}`);
    csvRows.push('');

    // Análises recentes
    if (recentAnalyses.length > 0) {
      csvRows.push('## ANÁLISES RECENTES');
      csvRows.push('ID,Nome,Tipo,Status,Score (%),Data,Tempo (s)');
      recentAnalyses.forEach((analysis) => {
        csvRows.push(
          `${analysis.id},${analysis.name},${analysis.type},${analysis.status},${analysis.score.toFixed(2)},${analysis.createdAt.toLocaleString('pt-BR')},${analysis.processingTime.toFixed(2)}`
        );
      });
      csvRows.push('');
    }

    // Performance metrics
    if (performanceMetrics.length > 0) {
      csvRows.push('## MÉTRICAS DE PERFORMANCE');
      csvRows.push('Métrica,Valor,Unidade,Target,Status,Tendência,Variação (%)');
      performanceMetrics.forEach((metric) => {
        csvRows.push(
          `${metric.name},${metric.value.toFixed(2)},${metric.unit},${metric.target || 'N/A'},${metric.status},${metric.trend},${metric.trendValue.toFixed(2)}`
        );
      });
      csvRows.push('');
    }

    // Tendências de documentos
    if (trendData?.documents && trendData.documents.length > 0) {
      csvRows.push('## TENDÊNCIAS - DOCUMENTOS');
      csvRows.push('Mês,Total,Processados,Falhados');
      trendData.documents.forEach((trend) => {
        csvRows.push(
          `${trend.name},${trend.value || 0},${trend.processed || 0},${trend.failed || 0}`
        );
      });
      csvRows.push('');
    }

    // Tendências de processamento
    if (trendData?.processing && trendData.processing.length > 0) {
      csvRows.push('## TENDÊNCIAS - PROCESSAMENTO');
      csvRows.push('Mês,Tempo Médio (s),Tempo Máximo (s),Tempo Mínimo (s)');
      trendData.processing.forEach((trend) => {
        csvRows.push(
          `${trend.name},${(trend.avgTime || 0).toFixed(2)},${(trend.maxTime || 0).toFixed(2)},${(trend.minTime || 0).toFixed(2)}`
        );
      });
      csvRows.push('');
    }

    // Issues breakdown
    if (issues.length > 0) {
      csvRows.push('## PROBLEMAS IDENTIFICADOS');
      csvRows.push('Tipo,Categoria,Título,Contagem,Percentual (%),Tendência,Variação (%)');
      issues.forEach((issue) => {
        csvRows.push(
          `${issue.type},${issue.category},${issue.title},${issue.count},${issue.percentage.toFixed(2)},${issue.trend},${issue.trendValue.toFixed(2)}`
        );
      });
    }

    // Criar blob e download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, filename);
  };

  /**
   * Exportar para PDF (via impressão HTML)
   */
  const exportToPDF = async () => {
    if (!metrics) return;

    const timestamp = new Date().toLocaleString('pt-BR');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Dashboard Analytics - ${organizationName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 40px;
            color: #1f2937;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #2563eb;
          }
          .header h1 {
            color: #2563eb;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header .subtitle {
            color: #6b7280;
            font-size: 14px;
          }
          .section {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .section h2 {
            color: #1e40af;
            font-size: 20px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }
          .metric-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          .metric-card .label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .metric-card .value {
            font-size: 32px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 8px;
          }
          .metric-card .trend {
            font-size: 12px;
            color: #059669;
          }
          .metric-card .trend.negative {
            color: #dc2626;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 13px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .status {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            display: inline-block;
          }
          .status.completed { background: #d1fae5; color: #065f46; }
          .status.processing { background: #dbeafe; color: #1e40af; }
          .status.failed { background: #fee2e2; color: #991b1b; }
          .status.good { background: #d1fae5; color: #065f46; }
          .status.warning { background: #fef3c7; color: #92400e; }
          .status.critical { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { padding: 20px; }
            .metric-card { page-break-inside: avoid; }
            table { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório Dashboard Analytics</h1>
          <div class="subtitle">${organizationName}</div>
          <div class="subtitle">Exportado em: ${timestamp}</div>
        </div>

        <div class="section">
          <h2>📊 Métricas Principais</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="label">Total de Documentos</div>
              <div class="value">${metrics.totalDocuments}</div>
              <div class="trend ${metrics.trends.documents >= 0 ? '' : 'negative'}">
                ${metrics.trends.documents >= 0 ? '↑' : '↓'} ${Math.abs(metrics.trends.documents).toFixed(1)}%
              </div>
            </div>
            <div class="metric-card">
              <div class="label">Score Médio de Conformidade</div>
              <div class="value">${metrics.averageScore.toFixed(1)}%</div>
              <div class="trend ${metrics.trends.score >= 0 ? '' : 'negative'}">
                ${metrics.trends.score >= 0 ? '↑' : '↓'} ${Math.abs(metrics.trends.score).toFixed(1)}%
              </div>
            </div>
            <div class="metric-card">
              <div class="label">Tempo Médio de Processamento</div>
              <div class="value">${metrics.averageProcessingTime.toFixed(2)}s</div>
              <div class="trend ${metrics.trends.processingTime <= 0 ? '' : 'negative'}">
                ${metrics.trends.processingTime <= 0 ? '↓' : '↑'} ${Math.abs(metrics.trends.processingTime).toFixed(1)}%
              </div>
            </div>
            <div class="metric-card">
              <div class="label">Taxa de Sucesso</div>
              <div class="value">${metrics.successRate.toFixed(1)}%</div>
              <div class="trend ${metrics.trends.successRate >= 0 ? '' : 'negative'}">
                ${metrics.trends.successRate >= 0 ? '↑' : '↓'} ${Math.abs(metrics.trends.successRate).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        ${recentAnalyses.length > 0 ? `
          <div class="section">
            <h2>📄 Análises Recentes</h2>
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
                ${recentAnalyses.slice(0, 15).map((analysis) => `
                  <tr>
                    <td>${analysis.name}</td>
                    <td>${analysis.type}</td>
                    <td><span class="status ${analysis.status}">${analysis.status}</span></td>
                    <td>${analysis.score.toFixed(1)}%</td>
                    <td>${analysis.createdAt.toLocaleDateString('pt-BR')}</td>
                    <td>${analysis.processingTime.toFixed(2)}s</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${performanceMetrics.length > 0 ? `
          <div class="section">
            <h2>⚡ Métricas de Performance</h2>
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
                    <td><strong>${metric.value.toFixed(2)} ${metric.unit}</strong></td>
                    <td>${metric.target ? metric.target.toFixed(2) + ' ' + metric.unit : 'N/A'}</td>
                    <td><span class="status ${metric.status}">${metric.status}</span></td>
                    <td>${metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'} ${metric.trendValue.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${issues.length > 0 ? `
          <div class="section">
            <h2>⚠️ Problemas Identificados (Top 10)</h2>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Título</th>
                  <th>Ocorrências</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                ${issues.slice(0, 10).map((issue) => `
                  <tr>
                    <td><span class="status ${issue.type}">${issue.type}</span></td>
                    <td>${issue.category}</td>
                    <td>${issue.title}</td>
                    <td>${issue.count}</td>
                    <td>${issue.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Gerado por LicitaReview Dashboard Analytics | ${timestamp}</p>
          <p>Este relatório contém informações confidenciais - Uso restrito</p>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova janela para impressão
    const printWindow = safeOpen('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Aguardar carregar e imprimir
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  /**
   * Exportar para JSON
   */
  const exportToJSON = async () => {
    if (!metrics) return;

    const filename = `relatorio-${organizationName}-${new Date().toISOString().split('T')[0]}.json`;

    const jsonData = {
      exportedAt: new Date().toISOString(),
      organization: organizationName,
      metrics: {
        totalDocuments: metrics.totalDocuments,
        averageScore: metrics.averageScore,
        averageProcessingTime: metrics.averageProcessingTime,
        successRate: metrics.successRate,
        trends: metrics.trends,
      },
      recentAnalyses: recentAnalyses.map((analysis) => ({
        id: analysis.id,
        documentId: analysis.documentId,
        name: analysis.name,
        type: analysis.type,
        status: analysis.status,
        score: analysis.score,
        createdAt: analysis.createdAt.toISOString(),
        processingTime: analysis.processingTime,
      })),
      trendData,
      issues,
      performanceMetrics,
    };

    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, filename);
  };

  /**
   * Função auxiliar para download de arquivo
   */
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`report-exporter ${className}`}>
      <div className="flex items-center gap-3">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={exporting}
        >
          <option value="csv">CSV (Planilha)</option>
          <option value="pdf">PDF (Documento)</option>
          <option value="json">JSON (Dados)</option>
        </select>

        <button
          onClick={handleExport}
          disabled={exporting || !metrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Exportando...
            </>
          ) : (
            <>
              <span className="mr-2">📥</span>
              Exportar Relatório
            </>
          )}
        </button>
      </div>

      {!metrics && (
        <p className="text-sm text-gray-500 mt-2">
          Aguardando dados do dashboard...
        </p>
      )}
    </div>
  );
};

export default ReportExporter;
