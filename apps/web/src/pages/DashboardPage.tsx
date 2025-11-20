import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedContainer, StaggeredContainer, LoadingAnimation, PulseAnimation } from '@/components/ui/animated-container';
import DashboardErrorBoundary, { DashboardErrorFallback } from '@/components/ui/dashboard-error-boundary';
import {
  MetricCardSkeleton,
  ChartSkeleton,
  DocumentsTableSkeleton,
  IssuesBreakdownSkeleton,
  PerformanceMetricsSkeleton,
  QuickActionsSkeleton
} from '@/components/ui/dashboard-skeletons';
import {
  BarChart3,
  TrendingUp,
  FileText,
  AlertTriangle,
  Activity,
  RefreshCw,
  Clock,
  CheckCircle,
  Settings,
  Bell,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importar componentes do dashboard
import MetricsCards from '@/components/dashboard/MetricsCards';
import { TrendsChart } from '@/components/dashboard/TrendsChart';
import { DocumentsTable } from '@/components/dashboard/DocumentsTable';
import { IssuesBreakdown } from '@/components/dashboard/IssuesBreakdown';
import { PerformanceMetrics } from '@/components/dashboard/PerformanceMetrics';
import { QuickActions } from '@/components/dashboard/QuickActions';
import ReportExporter from '@/components/dashboard/ReportExporter';

// Importar hook customizado de Analytics
import { useDashboardAnalytics } from '@/hooks/useDashboardAnalytics';

// Tipos de dados (compatibilidade com componentes existentes)
interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  responseTime: number;
}

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // ✅ DADOS REAIS DO FIRESTORE via Hook Customizado
  const {
    metrics,
    recentAnalyses,
    trendData,
    issues,
    performanceMetrics,
    loading,
    error,
    refresh,
    exportData,
  } = useDashboardAnalytics({
    recentAnalysesLimit: 15,
    trendMonths: 6,
    enableRealtime: true,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minuto
  });

  // Estado de refresh manual
  const [isRefreshing, setIsRefreshing] = useState(false);

  // System health mock (pode ser substituído por dados reais futuramente)
  const [systemHealth] = useState<SystemHealth>({
    cpu: 45.2,
    memory: 67.8,
    disk: 23.4,
    network: 12.1,
    uptime: 168.5,
    responseTime: 89
  });

  // Atualizar timestamp ao carregar dados
  useEffect(() => {
    if (!loading) {
      setLastUpdate(new Date());
    }
  }, [loading]);

  // Handler para refresh manual
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleUploadDocument = () => {
    console.log('Upload documento');
    // Implementar navegação para upload
  };

  const handleViewReports = () => {
    console.log('Ver relatórios');
    // Implementar navegação para relatórios
  };

  const handleViewDocument = (document: any) => {
    console.log('Visualizar documento:', document.id);
    // Implementar visualização de documento
  };

  const handleDownloadDocument = (document: any) => {
    console.log('Download documento:', document.id);
    // Implementar download de documento
  };

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    try {
      await exportData(format);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert('Erro ao exportar relatório. Tente novamente.');
    }
  };

  // Exibir erro se houver
  if (error) {
    return (
      <DashboardErrorBoundary>
        <AnimatedContainer animation="fadeIn" className="min-h-screen bg-gray-50 flex items-center justify-center">
          <DashboardErrorFallback
            title="Erro ao Carregar Dashboard"
            description={error}
          />
        </AnimatedContainer>
      </DashboardErrorBoundary>
    );
  }

  // Loading state
  if (loading) {
    return (
      <DashboardErrorBoundary>
        <AnimatedContainer animation="fadeIn" className="min-h-screen bg-gray-50">
          {/* Header Skeleton */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-8 h-8" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              {/* Tabs Skeleton */}
              <div className="flex space-x-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-24" />
                ))}
              </div>

              {/* Metrics Cards Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <MetricCardSkeleton key={i} />
                  ))}
                </div>
                <div className="lg:col-span-1">
                  <QuickActionsSkeleton />
                </div>
              </div>

              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartSkeleton height={300} />
                <ChartSkeleton height={300} />
              </div>

              {/* Table Skeleton */}
              <DocumentsTableSkeleton rows={5} />
            </div>
          </div>
        </AnimatedContainer>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <AnimatedContainer animation="fadeIn" className="min-h-screen bg-gray-50">
      {/* Header */}
      <AnimatedContainer animation="slideDown" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <AnimatedContainer animation="slideRight" className="flex items-center space-x-4">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
                <p className="text-sm text-gray-600">
                  Última atualização: {lastUpdate.toLocaleString('pt-BR')}
                </p>
              </div>
            </AnimatedContainer>
            
            <AnimatedContainer animation="slideLeft" delay={0.2} className="flex items-center space-x-3">
              <PulseAnimation>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                  Sistema Online
                </Badge>
              </PulseAnimation>

              <ReportExporter
                metrics={metrics}
                recentAnalyses={recentAnalyses}
                trendData={trendData}
                issues={issues}
                performanceMetrics={performanceMetrics}
                organizationName="LicitaReview"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Atualizando...' : 'Atualizar'}
              </Button>
            </AnimatedContainer>
          </div>
        </div>
      </AnimatedContainer>

      {/* Main Content */}
      <AnimatedContainer animation="slideUp" delay={0.3} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <AnimatedContainer animation="scale" delay={0.4}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="issues">Problemas</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
          </AnimatedContainer>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <StaggeredContainer animation="slideUp" stagger={0.1} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Métricas Principais */}
              <div className="lg:col-span-3">
                <DashboardErrorBoundary 
                  fallback={
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <DashboardErrorFallback 
                          key={i}
                          title="Erro nas Métricas"
                          description="Não foi possível carregar as métricas."
                        />
                      ))}
                    </div>
                  }
                >
                  <MetricsCards
                    metrics={metrics || {
                      totalDocuments: 0,
                      averageScore: 0,
                      averageProcessingTime: 0,
                      successRate: 0,
                      trends: {
                        documents: 0,
                        score: 0,
                        processingTime: 0,
                        successRate: 0
                      }
                    }}
                    isLoading={loading}
                    isRefreshing={isRefreshing}
                  />
                </DashboardErrorBoundary>
              </div>
              
              {/* Ações Rápidas */}
              <div className="lg:col-span-1">
                <DashboardErrorBoundary 
                  fallback={
                    <DashboardErrorFallback 
                      title="Erro nas Ações"
                      description="Não foi possível carregar as ações rápidas."
                    />
                  }
                >
                  <QuickActions
                    onUploadDocument={handleUploadDocument}
                    onViewReports={handleViewReports}
                    onRefreshData={handleRefresh}
                    isRefreshing={isRefreshing}
                    pendingNotifications={3}
                  />
                </DashboardErrorBoundary>
              </div>
            </StaggeredContainer>
            
            {/* Gráficos de Tendência */}
            <StaggeredContainer animation="slideUp" stagger={0.2} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardErrorBoundary 
                fallback={
                  <DashboardErrorFallback 
                    title="Erro no Gráfico"
                    description="Não foi possível carregar o gráfico de documentos."
                  />
                }
              >
                <TrendsChart
                  data={trendData?.documents || []}
                  type="documents"
                  title="Documentos Processados"
                  description="Evolução mensal do processamento de documentos"
                  isLoading={loading}
                  height={300}
                />
              </DashboardErrorBoundary>

              <DashboardErrorBoundary
                fallback={
                  <DashboardErrorFallback
                    title="Erro no Gráfico"
                    description="Não foi possível carregar o gráfico de scores."
                  />
                }
              >
                <TrendsChart
                  data={trendData?.scores || []}
                  type="scores"
                  title="Scores de Qualidade"
                  description="Evolução da qualidade dos documentos analisados"
                  isLoading={loading}
                  height={300}
                />
              </DashboardErrorBoundary>
            </StaggeredContainer>
            
            {/* Documentos Recentes */}
            <AnimatedContainer animation="slideUp" delay={0.6}>
              <DashboardErrorBoundary 
                fallback={
                  <DashboardErrorFallback 
                    title="Erro na Tabela"
                    description="Não foi possível carregar a tabela de documentos."
                  />
                }
              >
                <DocumentsTable
                  documents={recentAnalyses}
                  onViewDocument={handleViewDocument}
                  onDownloadDocument={handleDownloadDocument}
                  isLoading={loading}
                  pageSize={15}
                />
              </DashboardErrorBoundary>
            </AnimatedContainer>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentsTable
              documents={recentAnalyses}
              showAll={true}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              isLoading={loading}
              pageSize={15}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendsChart
                data={trendData?.documents || []}
                type="documents"
                title="Histórico de Processamento"
                description="Documentos processados, bem-sucedidos e com falha"
              />

              <TrendsChart
                data={trendData?.processing || []}
                type="processing"
                title="Tempo de Processamento"
                description="Evolução dos tempos de processamento"
              />
            </div>
          </TabsContent>

          {/* Problemas */}
          <TabsContent value="issues" className="space-y-6">
            <IssuesBreakdown
              issues={issues}
              totalDocuments={metrics?.totalDocuments || 0}
            />
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics
              metrics={performanceMetrics}
              systemHealth={systemHealth}
            />

            <TrendsChart
              data={trendData?.processing || []}
              type="processing"
              title="Performance do Sistema"
              description="Métricas de performance ao longo do tempo"
            />
          </TabsContent>
        </Tabs>
      </AnimatedContainer>
      </AnimatedContainer>
      </DashboardErrorBoundary>
    );
  };

export default DashboardPage;