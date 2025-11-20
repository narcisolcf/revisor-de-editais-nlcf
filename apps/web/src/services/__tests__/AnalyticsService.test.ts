/**
 * Testes para AnalyticsService
 *
 * Testa todas as funcionalidades do serviço de analytics:
 * - Busca de métricas do dashboard
 * - Análises recentes
 * - Dados de tendências
 * - Breakdown de issues
 * - Métricas de performance
 * - Subscriptions em tempo real
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { AnalyticsService } from '../AnalyticsService';

// Mock do Firebase
vi.mock('firebase/firestore');
vi.mock('@/config/firebase', () => ({
  db: {},
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('deve retornar métricas do dashboard', async () => {
      // Mock de dados
      const mockDocs = [
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.85 },
            processing_time: 2.5,
            persisted_at: Timestamp.now(),
          }),
        },
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.90 },
            processing_time: 3.0,
            persisted_at: Timestamp.now(),
          }),
        },
        {
          data: () => ({
            status: 'failed',
            results: null,
            processing_time: 0,
            persisted_at: Timestamp.now(),
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const metrics = await AnalyticsService.getDashboardMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalDocuments).toBe(3);
      expect(metrics.averageScore).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    it('deve calcular tendências corretamente', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 15);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 45);

      const mockDocs = [
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.85 },
            processing_time: 2.5,
            persisted_at: Timestamp.fromDate(thirtyDaysAgo),
          }),
        },
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.80 },
            processing_time: 3.0,
            persisted_at: Timestamp.fromDate(sixtyDaysAgo),
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const metrics = await AnalyticsService.getDashboardMetrics();

      expect(metrics.trends).toBeDefined();
      expect(metrics.trends.documents).toBeDefined();
      expect(metrics.trends.score).toBeDefined();
    });

    it('deve filtrar por organizationId quando fornecido', async () => {
      const mockQuery = vi.fn();
      (query as any).mockReturnValue(mockQuery);
      (getDocs as any).mockResolvedValue({ docs: [] });

      await AnalyticsService.getDashboardMetrics('org123');

      expect(query).toHaveBeenCalled();
      expect(where).toHaveBeenCalledWith('organization_id', '==', 'org123');
    });

    it('deve tratar erro ao buscar métricas', async () => {
      (getDocs as any).mockRejectedValue(new Error('Firestore error'));

      await expect(
        AnalyticsService.getDashboardMetrics()
      ).rejects.toThrow('Firestore error');
    });
  });

  describe('getRecentAnalyses', () => {
    it('deve retornar análises recentes', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            document_id: 'edital_001',
            document_type: 'edital_licitacao',
            status: 'completed',
            results: { conformity_score: 0.92 },
            persisted_at: Timestamp.now(),
            processing_time: 2.1,
          }),
        },
        {
          id: 'doc2',
          data: () => ({
            document_id: 'termo_ref_002',
            document_type: 'termo_referencia',
            status: 'completed',
            results: { conformity_score: 0.88 },
            persisted_at: Timestamp.now(),
            processing_time: 1.5,
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const analyses = await AnalyticsService.getRecentAnalyses(10);

      expect(analyses).toHaveLength(2);
      expect(analyses[0].id).toBe('doc1');
      expect(analyses[0].name).toBe('edital_001');
      expect(analyses[0].score).toBeCloseTo(92, 0);
    });

    it('deve respeitar o limite de resultados', async () => {
      (getDocs as any).mockResolvedValue({ docs: [] });

      await AnalyticsService.getRecentAnalyses(5);

      expect(limit).toHaveBeenCalledWith(5);
    });

    it('deve converter scores para percentual', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            document_id: 'test',
            results: { conformity_score: 0.75 },
            persisted_at: Timestamp.now(),
            status: 'completed',
            processing_time: 1.0,
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const analyses = await AnalyticsService.getRecentAnalyses();

      expect(analyses[0].score).toBe(75);
    });
  });

  describe('getTrendData', () => {
    it('deve retornar dados de tendências agrupados por mês', async () => {
      const mockDocs = [
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.85 },
            processing_time: 2.0,
            persisted_at: Timestamp.fromDate(new Date('2025-01-15')),
          }),
        },
        {
          data: () => ({
            status: 'completed',
            results: { conformity_score: 0.90 },
            processing_time: 1.8,
            persisted_at: Timestamp.fromDate(new Date('2025-01-20')),
          }),
        },
        {
          data: () => ({
            status: 'failed',
            results: null,
            processing_time: 0,
            persisted_at: Timestamp.fromDate(new Date('2025-02-10')),
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const trends = await AnalyticsService.getTrendData(6);

      expect(trends).toHaveProperty('documents');
      expect(trends).toHaveProperty('processing');
      expect(trends).toHaveProperty('scores');
      expect(Array.isArray(trends.documents)).toBe(true);
    });

    it('deve calcular estatísticas de processamento', async () => {
      const mockDocs = [
        {
          data: () => ({
            processing_time: 2.0,
            persisted_at: Timestamp.fromDate(new Date('2025-01-15')),
            status: 'completed',
          }),
        },
        {
          data: () => ({
            processing_time: 3.0,
            persisted_at: Timestamp.fromDate(new Date('2025-01-20')),
            status: 'completed',
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const trends = await AnalyticsService.getTrendData();

      expect(trends.processing.length).toBeGreaterThan(0);
      if (trends.processing.length > 0) {
        expect(trends.processing[0]).toHaveProperty('avgTime');
        expect(trends.processing[0]).toHaveProperty('maxTime');
        expect(trends.processing[0]).toHaveProperty('minTime');
      }
    });
  });

  describe('getIssuesBreakdown', () => {
    it('deve retornar breakdown de problemas', async () => {
      const mockDocs = [
        {
          id: 'doc1',
          data: () => ({
            results: {
              problems: [
                {
                  title: 'Problema 1',
                  severity: 'critical',
                  category: 'Conformidade',
                },
                {
                  title: 'Problema 2',
                  severity: 'warning',
                  category: 'Prazos',
                },
              ],
            },
          }),
        },
        {
          id: 'doc2',
          data: () => ({
            results: {
              problems: [
                {
                  title: 'Problema 1',
                  severity: 'critical',
                  category: 'Conformidade',
                },
              ],
            },
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const issues = await AnalyticsService.getIssuesBreakdown();

      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toHaveProperty('title');
      expect(issues[0]).toHaveProperty('count');
      expect(issues[0]).toHaveProperty('percentage');
    });

    it('deve agregar problemas corretamente', async () => {
      const mockDocs = [
        {
          data: () => ({
            results: {
              problems: [
                { title: 'Problema A', severity: 'critical', category: 'Test' },
                { title: 'Problema A', severity: 'critical', category: 'Test' },
              ],
            },
          }),
        },
      ];

      (getDocs as any).mockResolvedValue({
        docs: mockDocs,
      });

      const issues = await AnalyticsService.getIssuesBreakdown();

      const problemA = issues.find((i) => i.title === 'Problema A');
      expect(problemA?.count).toBe(2);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('deve retornar métricas de performance', async () => {
      (getDocs as any).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'completed',
              results: { conformity_score: 0.85 },
              processing_time: 2.0,
              persisted_at: Timestamp.now(),
            }),
          },
        ],
      });

      const performanceMetrics = await AnalyticsService.getPerformanceMetrics();

      expect(Array.isArray(performanceMetrics)).toBe(true);
      expect(performanceMetrics.length).toBeGreaterThan(0);

      const processingTimeMetric = performanceMetrics.find(
        (m) => m.name === 'Tempo de Processamento'
      );
      expect(processingTimeMetric).toBeDefined();
      expect(processingTimeMetric?.unit).toBe('s');
    });

    it('deve incluir métricas de score médio', async () => {
      (getDocs as any).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'completed',
              results: { conformity_score: 0.90 },
              processing_time: 1.5,
              persisted_at: Timestamp.now(),
            }),
          },
        ],
      });

      const metrics = await AnalyticsService.getPerformanceMetrics();

      const scoreMetric = metrics.find((m) => m.name === 'Score Médio');
      expect(scoreMetric).toBeDefined();
      expect(scoreMetric?.unit).toBe('%');
    });

    it('deve incluir status baseado em targets', async () => {
      (getDocs as any).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'completed',
              results: { conformity_score: 0.95 },
              processing_time: 2.5,
              persisted_at: Timestamp.now(),
            }),
          },
        ],
      });

      const metrics = await AnalyticsService.getPerformanceMetrics();

      const successRateMetric = metrics.find((m) => m.name === 'Taxa de Sucesso');
      expect(successRateMetric?.status).toMatch(/good|warning|critical/);
    });
  });

  describe('subscribeToMetrics', () => {
    it('deve configurar subscrição em tempo real', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      (onSnapshot as any).mockReturnValue(mockUnsubscribe);

      const unsubscribe = AnalyticsService.subscribeToMetrics(mockCallback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('deve chamar callback quando dados mudarem', async () => {
      const mockCallback = vi.fn();
      let snapshotCallback: any;

      (onSnapshot as any).mockImplementation((q: any, callback: any) => {
        snapshotCallback = callback;
        return vi.fn();
      });

      (getDocs as any).mockResolvedValue({
        docs: [
          {
            data: () => ({
              status: 'completed',
              results: { conformity_score: 0.85 },
              processing_time: 2.0,
              persisted_at: Timestamp.now(),
            }),
          },
        ],
      });

      AnalyticsService.subscribeToMetrics(mockCallback);

      // Simular mudança nos dados
      if (snapshotCallback) {
        await snapshotCallback();
      }

      // Aguardar callback assíncrono
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('subscribeToRecentAnalyses', () => {
    it('deve configurar subscrição para análises recentes', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      (onSnapshot as any).mockReturnValue(mockUnsubscribe);

      const unsubscribe = AnalyticsService.subscribeToRecentAnalyses(mockCallback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });

    it('deve processar dados do snapshot', () => {
      const mockCallback = vi.fn();
      let snapshotCallback: any;

      (onSnapshot as any).mockImplementation((q: any, callback: any) => {
        snapshotCallback = callback;
        return vi.fn();
      });

      AnalyticsService.subscribeToRecentAnalyses(mockCallback, 10);

      const mockSnapshot = {
        docs: [
          {
            id: 'doc1',
            data: () => ({
              document_id: 'test',
              results: { conformity_score: 0.85 },
              persisted_at: Timestamp.now(),
              status: 'completed',
              processing_time: 2.0,
            }),
          },
        ],
      };

      // Simular snapshot
      if (snapshotCallback) {
        snapshotCallback(mockSnapshot);
      }

      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'doc1',
            score: expect.any(Number),
          }),
        ])
      );
    });
  });
});
