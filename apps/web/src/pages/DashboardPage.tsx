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

// Tipos de dados
interface DashboardMetrics {
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

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'completed' | 'processing' | 'failed';
  score: number;
  createdAt: Date;
  processingTime: number;
}

interface Issue {
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

interface PerformanceMetric {
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

interface SystemHealth {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  responseTime: number;
}

const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Dados mock - em produção, estes viriam de APIs
  const [metrics] = useState<DashboardMetrics>({
    totalDocuments: 1247,
    averageScore: 87.3,
    averageProcessingTime: 2.4,
    successRate: 94.2,
    trends: {
      documents: 12.5,
      score: 3.2,
      processingTime: -8.1,
      successRate: 1.8
    }
  });

  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'Edital_Licitacao_001_2024.pdf',
      type: 'pdf',
      status: 'completed',
      score: 92.5,
      createdAt: new Date('2024-01-15T10:30:00'),
      processingTime: 1.8
    },
    {
      id: '2',
      name: 'Contrato_Servicos_TI.docx',
      type: 'docx',
      status: 'completed',
      score: 88.7,
      createdAt: new Date('2024-01-15T09:15:00'),
      processingTime: 2.1
    },
    {
      id: '3',
      name: 'Planilha_Orcamento_2024.xlsx',
      type: 'xlsx',
      status: 'processing',
      score: 0,
      createdAt: new Date('2024-01-15T11:45:00'),
      processingTime: 0
    },
    {
      id: '4',
      name: 'Edital_Obras_Publicas.pdf',
      type: 'pdf',
      status: 'failed',
      score: 0,
      createdAt: new Date('2024-01-15T08:20:00'),
      processingTime: 0
    },
    {
      id: '5',
      name: 'Termo_Referencia_Consultoria.pdf',
      type: 'pdf',
      status: 'completed',
      score: 95.2,
      createdAt: new Date('2024-01-14T16:30:00'),
      processingTime: 1.5
    }
  ]);

  const [issues] = useState<Issue[]>([
    {
      id: '1',
      type: 'critical',
      category: 'Conformidade',
      title: 'Cláusulas Obrigatórias Ausentes',
      description: 'Documentos sem cláusulas obrigatórias de sustentabilidade',
      count: 23,
      percentage: 18.4,
      trend: 'down',
      trendValue: 5.2
    },
    {
      id: '2',
      type: 'warning',
      category: 'Prazos',
      title: 'Prazos Inadequados',
      description: 'Prazos de entrega muito curtos para o escopo',
      count: 45,
      percentage: 36.1,
      trend: 'up',
      trendValue: 2.8
    },
    {
      id: '3',
      type: 'warning',
      category: 'Documentação',
      title: 'Documentos Incompletos',
      description: 'Faltam anexos ou documentos complementares',
      count: 31,
      percentage: 24.9,
      trend: 'stable',
      trendValue: 0
    },
    {
      id: '4',
      type: 'info',
      category: 'Qualidade',
      title: 'Critérios de Avaliação Vagos',
      description: 'Critérios de avaliação pouco específicos',
      count: 67,
      percentage: 53.7,
      trend: 'down',
      trendValue: 8.3
    }
  ]);

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    {
      id: '1',
      name: 'Tempo de Processamento',
      value: 2.4,
      unit: 's',
      target: 3.0,
      status: 'good',
      trend: 'down',
      trendValue: 8.1,
      description: 'Tempo médio para processar um documento'
    },
    {
      id: '2',
      name: 'Taxa de Sucesso',
      value: 94.2,
      unit: '%',
      target: 95.0,
      status: 'warning',
      trend: 'up',
      trendValue: 1.8,
      description: 'Percentual de documentos processados com sucesso'
    },
    {
      id: '3',
      name: 'Throughput',
      value: 156,
      unit: 'req/min',
      target: 200,
      status: 'good',
      trend: 'up',
      trendValue: 12.5,
      description: 'Documentos processados por minuto'
    },
    {
      id: '4',
      name: 'Uso de Memória',
      value: 2.1,
      unit: 'GB',
      target: 4.0,
      status: 'good',
      trend: 'stable',
      trendValue: 0,
      description: 'Consumo médio de memória do sistema'
    }
  ]);

  const [systemHealth] = useState<SystemHealth>({
    cpu: 45.2,
    memory: 67.8,
    disk: 23.4,
    network: 12.1,
    uptime: 168.5,
    responseTime: 89
  });

  // Dados para gráficos de tendência
  const trendsData = {
    documents: [
      { name: 'Jan', value: 1120, processed: 1050, failed: 70 },
      { name: 'Fev', value: 1180, processed: 1125, failed: 55 },
      { name: 'Mar', value: 1247, processed: 1175, failed: 72 },
      { name: 'Abr', value: 1320, processed: 1248, failed: 72 },
      { name: 'Mai', value: 1285, processed: 1210, failed: 75 },
      { name: 'Jun', value: 1350, processed: 1275, failed: 75 }
    ],
    processing: [
      { name: 'Jan', avgTime: 2.8, maxTime: 5.2, minTime: 1.1 },
      { name: 'Fev', avgTime: 2.6, maxTime: 4.8, minTime: 1.0 },
      { name: 'Mar', avgTime: 2.4, maxTime: 4.5, minTime: 0.9 },
      { name: 'Abr', avgTime: 2.3, maxTime: 4.2, minTime: 0.8 },
      { name: 'Mai', avgTime: 2.2, maxTime: 4.0, minTime: 0.8 },
      { name: 'Jun', avgTime: 2.1, maxTime: 3.8, minTime: 0.7 }
    ],
    scores: [
      { name: 'Jan', avgScore: 84.2, maxScore: 98.5, minScore: 65.3 },
      { name: 'Fev', avgScore: 85.1, maxScore: 97.8, minScore: 68.2 },
      { name: 'Mar', avgScore: 86.5, maxScore: 98.2, minScore: 70.1 },
      { name: 'Abr', avgScore: 87.3, maxScore: 98.7, minScore: 72.4 },
      { name: 'Mai', avgScore: 88.1, maxScore: 99.1, minScore: 74.2 },
      { name: 'Jun', avgScore: 87.9, maxScore: 98.9, minScore: 73.8 }
    ]
  };

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  }, []);

  const handleUploadDocument = () => {
    console.log('Upload documento');
    // Implementar navegação para upload
  };

  const handleViewReports = () => {
    console.log('Ver relatórios');
    // Implementar navegação para relatórios
  };

  const handleViewDocument = (document: Document) => {
    console.log('Visualizar documento:', document.id);
    // Implementar visualização de documento
  };

  const handleDownloadDocument = (document: Document) => {
    console.log('Download documento:', document.id);
    // Implementar download de documento
  };

  if (isLoading) {
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
                    metrics={metrics} 
                    isLoading={isLoading}
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
                  data={trendsData.documents}
                  type="documents"
                  title="Documentos Processados"
                  description="Evolução mensal do processamento de documentos"
                  isLoading={isLoading}
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
                  data={trendsData.scores}
                  type="scores"
                  title="Scores de Qualidade"
                  description="Evolução da qualidade dos documentos analisados"
                  isLoading={isLoading}
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
                  documents={documents}
                  onViewDocument={handleViewDocument}
                  onDownloadDocument={handleDownloadDocument}
                  isLoading={isLoading}
                  pageSize={15}
                />
              </DashboardErrorBoundary>
            </AnimatedContainer>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentsTable
              documents={documents}
              showAll={true}
              onViewDocument={handleViewDocument}
              onDownloadDocument={handleDownloadDocument}
              isLoading={isLoading}
              pageSize={15}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendsChart
                data={trendsData.documents}
                type="documents"
                title="Histórico de Processamento"
                description="Documentos processados, bem-sucedidos e com falha"
              />
              
              <TrendsChart
                data={trendsData.processing}
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
              totalDocuments={metrics.totalDocuments}
            />
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceMetrics
              metrics={performanceMetrics}
              systemHealth={systemHealth}
            />
            
            <TrendsChart
              data={trendsData.processing}
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