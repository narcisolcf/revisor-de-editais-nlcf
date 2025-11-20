/**
 * Analytics Service - Serviço para métricas e analytics do dashboard
 *
 * Conecta com Firestore para obter dados reais de:
 * - Análises realizadas
 * - Documentos processados
 * - Métricas de performance
 * - Tendências e estatísticas
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface DashboardMetrics {
  totalDocuments: number;
  averageScore: number;
  averageProcessingTime: number;
  successRate: number;
  trends: {
    documents: number;
    score: number;
    processingTime: number;
    successRate: number;
  };
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  name: string;
  type: string;
  status: 'completed' | 'processing' | 'failed';
  score: number;
  createdAt: Date;
  processingTime: number;
  organizationId?: string;
}

export interface TrendData {
  name: string;
  value: number;
  processed?: number;
  failed?: number;
  avgTime?: number;
  maxTime?: number;
  minTime?: number;
  avgScore?: number;
  maxScore?: number;
  minScore?: number;
}

export interface IssueData {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: string;
  title: string;
  description: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface PerformanceMetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  target?: number;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  description: string;
}

export class AnalyticsService {
  /**
   * Obter métricas principais do dashboard
   */
  static async getDashboardMetrics(organizationId?: string): Promise<DashboardMetrics> {
    try {
      const analysisRef = collection(db, 'analysis_results');
      let q = query(analysisRef, orderBy('persisted_at', 'desc'), limit(1000));

      if (organizationId) {
        q = query(q, where('organization_id', '==', organizationId));
      }

      const snapshot = await getDocs(q);
      const analyses = snapshot.docs.map(doc => doc.data());

      // Calcular métricas
      const total = analyses.length;
      const completed = analyses.filter(a => a.status === 'completed').length;
      const failed = analyses.filter(a => a.status === 'failed').length;

      const scores = analyses
        .filter(a => a.results?.conformity_score)
        .map(a => a.results.conformity_score);

      const processingTimes = analyses
        .filter(a => a.processing_time)
        .map(a => a.processing_time);

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
        : 0;

      const successRate = total > 0 ? (completed / total) * 100 : 0;

      // Calcular tendências (comparar últimos 30 dias com 30 dias anteriores)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentAnalyses = analyses.filter(a => {
        const date = a.persisted_at?.toDate?.() || new Date(a.persisted_at);
        return date >= thirtyDaysAgo;
      });

      const previousAnalyses = analyses.filter(a => {
        const date = a.persisted_at?.toDate?.() || new Date(a.persisted_at);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      });

      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        totalDocuments: total,
        averageScore: avgScore * 100, // Converter para percentual
        averageProcessingTime: avgProcessingTime,
        successRate: successRate,
        trends: {
          documents: calculateTrend(recentAnalyses.length, previousAnalyses.length),
          score: calculateTrend(
            recentAnalyses.reduce((sum, a) => sum + (a.results?.conformity_score || 0), 0) / (recentAnalyses.length || 1),
            previousAnalyses.reduce((sum, a) => sum + (a.results?.conformity_score || 0), 0) / (previousAnalyses.length || 1)
          ),
          processingTime: calculateTrend(
            recentAnalyses.reduce((sum, a) => sum + (a.processing_time || 0), 0) / (recentAnalyses.length || 1),
            previousAnalyses.reduce((sum, a) => sum + (a.processing_time || 0), 0) / (previousAnalyses.length || 1)
          ),
          successRate: calculateTrend(
            (recentAnalyses.filter(a => a.status === 'completed').length / (recentAnalyses.length || 1)) * 100,
            (previousAnalyses.filter(a => a.status === 'completed').length / (previousAnalyses.length || 1)) * 100
          )
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Obter análises recentes
   */
  static async getRecentAnalyses(limitCount: number = 10): Promise<DocumentAnalysis[]> {
    try {
      const analysisRef = collection(db, 'analysis_results');
      const q = query(
        analysisRef,
        orderBy('persisted_at', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          documentId: data.document_id || doc.id,
          name: data.document_id || 'Documento sem nome',
          type: data.document_type || 'unknown',
          status: data.status || 'completed',
          score: (data.results?.conformity_score || 0) * 100,
          createdAt: data.persisted_at?.toDate?.() || new Date(),
          processingTime: data.processing_time || 0,
          organizationId: data.organization_id
        };
      });
    } catch (error) {
      console.error('Error fetching recent analyses:', error);
      throw error;
    }
  }

  /**
   * Obter dados de tendências para gráficos
   */
  static async getTrendData(months: number = 6): Promise<{
    documents: TrendData[];
    processing: TrendData[];
    scores: TrendData[];
  }> {
    try {
      const analysisRef = collection(db, 'analysis_results');
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const q = query(
        analysisRef,
        where('persisted_at', '>=', Timestamp.fromDate(startDate)),
        orderBy('persisted_at', 'asc')
      );

      const snapshot = await getDocs(q);
      const analyses = snapshot.docs.map(doc => doc.data());

      // Agrupar por mês
      const monthlyData: Record<string, any[]> = {};
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      analyses.forEach(analysis => {
        const date = analysis.persisted_at?.toDate?.() || new Date(analysis.persisted_at);
        const monthKey = `${monthNames[date.getMonth()]}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = [];
        }
        monthlyData[monthKey].push(analysis);
      });

      // Preparar dados de documentos
      const documents: TrendData[] = Object.entries(monthlyData).map(([month, data]) => ({
        name: month,
        value: data.length,
        processed: data.filter(a => a.status === 'completed').length,
        failed: data.filter(a => a.status === 'failed').length
      }));

      // Preparar dados de processamento
      const processing: TrendData[] = Object.entries(monthlyData).map(([month, data]) => {
        const times = data.map(a => a.processing_time || 0);
        return {
          name: month,
          avgTime: times.reduce((a, b) => a + b, 0) / (times.length || 1),
          maxTime: Math.max(...times, 0),
          minTime: Math.min(...times.filter(t => t > 0), 0) || 0
        };
      });

      // Preparar dados de scores
      const scores: TrendData[] = Object.entries(monthlyData).map(([month, data]) => {
        const scoreValues = data
          .map(a => (a.results?.conformity_score || 0) * 100)
          .filter(s => s > 0);

        return {
          name: month,
          avgScore: scoreValues.reduce((a, b) => a + b, 0) / (scoreValues.length || 1),
          maxScore: Math.max(...scoreValues, 0),
          minScore: Math.min(...scoreValues, 0)
        };
      });

      return { documents, processing, scores };
    } catch (error) {
      console.error('Error fetching trend data:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de problemas/issues
   */
  static async getIssuesBreakdown(): Promise<IssueData[]> {
    try {
      const analysisRef = collection(db, 'analysis_results');
      const q = query(analysisRef, orderBy('persisted_at', 'desc'), limit(500));

      const snapshot = await getDocs(q);
      const analyses = snapshot.docs.map(doc => doc.data());

      // Agregar problemas
      const issuesMap: Record<string, { count: number; type: string; category: string }> = {};

      analyses.forEach(analysis => {
        const problems = analysis.results?.problems || [];
        problems.forEach((problem: any) => {
          const key = problem.title || problem.type || 'Unknown';
          if (!issuesMap[key]) {
            issuesMap[key] = {
              count: 0,
              type: problem.severity || 'warning',
              category: problem.category || 'Geral'
            };
          }
          issuesMap[key].count++;
        });
      });

      const totalDocuments = analyses.length;

      return Object.entries(issuesMap).map(([title, data], index) => ({
        id: `issue-${index}`,
        type: data.type as 'critical' | 'warning' | 'info',
        category: data.category,
        title: title,
        description: `Encontrado em ${data.count} documentos`,
        count: data.count,
        percentage: (data.count / totalDocuments) * 100,
        trend: 'stable' as const,
        trendValue: 0
      }));
    } catch (error) {
      console.error('Error fetching issues breakdown:', error);
      throw error;
    }
  }

  /**
   * Obter métricas de performance do sistema
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetricData[]> {
    try {
      const metrics = await this.getDashboardMetrics();

      return [
        {
          id: '1',
          name: 'Tempo de Processamento',
          value: metrics.averageProcessingTime,
          unit: 's',
          target: 3.0,
          status: metrics.averageProcessingTime < 3.0 ? 'good' : 'warning',
          trend: metrics.trends.processingTime < 0 ? 'down' : 'up',
          trendValue: Math.abs(metrics.trends.processingTime),
          description: 'Tempo médio para processar um documento'
        },
        {
          id: '2',
          name: 'Taxa de Sucesso',
          value: metrics.successRate,
          unit: '%',
          target: 95.0,
          status: metrics.successRate >= 95 ? 'good' : 'warning',
          trend: metrics.trends.successRate > 0 ? 'up' : 'down',
          trendValue: Math.abs(metrics.trends.successRate),
          description: 'Percentual de documentos processados com sucesso'
        },
        {
          id: '3',
          name: 'Score Médio',
          value: metrics.averageScore,
          unit: '%',
          target: 85.0,
          status: metrics.averageScore >= 85 ? 'good' : 'warning',
          trend: metrics.trends.score > 0 ? 'up' : 'down',
          trendValue: Math.abs(metrics.trends.score),
          description: 'Pontuação média de conformidade'
        },
        {
          id: '4',
          name: 'Documentos Processados',
          value: metrics.totalDocuments,
          unit: 'docs',
          status: 'good',
          trend: metrics.trends.documents > 0 ? 'up' : 'down',
          trendValue: Math.abs(metrics.trends.documents),
          description: 'Total de documentos analisados'
        }
      ];
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  static subscribeToMetrics(
    callback: (metrics: DashboardMetrics) => void,
    organizationId?: string
  ): () => void {
    const analysisRef = collection(db, 'analysis_results');
    let q = query(analysisRef, orderBy('persisted_at', 'desc'), limit(1000));

    if (organizationId) {
      q = query(q, where('organization_id', '==', organizationId));
    }

    const unsubscribe = onSnapshot(q, async () => {
      try {
        const metrics = await this.getDashboardMetrics(organizationId);
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics subscription:', error);
      }
    });

    return unsubscribe;
  }

  /**
   * Subscribe to recent analyses updates
   */
  static subscribeToRecentAnalyses(
    callback: (analyses: DocumentAnalysis[]) => void,
    limitCount: number = 10
  ): () => void {
    const analysisRef = collection(db, 'analysis_results');
    const q = query(
      analysisRef,
      orderBy('persisted_at', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const analyses = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          documentId: data.document_id || doc.id,
          name: data.document_id || 'Documento sem nome',
          type: data.document_type || 'unknown',
          status: data.status || 'completed',
          score: (data.results?.conformity_score || 0) * 100,
          createdAt: data.persisted_at?.toDate?.() || new Date(),
          processingTime: data.processing_time || 0,
          organizationId: data.organization_id
        } as DocumentAnalysis;
      });

      callback(analyses);
    });

    return unsubscribe;
  }
}
