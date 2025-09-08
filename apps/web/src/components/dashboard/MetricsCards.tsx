import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  Target,
  Activity,
  Info
} from 'lucide-react';

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

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  progress?: {
    value: number;
    max: number;
    color?: string;
  };
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  color
}) => {
  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      bg: 'bg-blue-100',
      text: 'text-blue-600',
      progress: 'bg-blue-500'
    },
    green: {
      icon: 'text-green-600',
      bg: 'bg-green-100',
      text: 'text-green-600',
      progress: 'bg-green-500'
    },
    purple: {
      icon: 'text-purple-600',
      bg: 'bg-purple-100',
      text: 'text-purple-600',
      progress: 'bg-purple-500'
    },
    orange: {
      icon: 'text-orange-600',
      bg: 'bg-orange-100',
      text: 'text-orange-600',
      progress: 'bg-orange-500'
    },
    red: {
      icon: 'text-red-600',
      bg: 'bg-red-100',
      text: 'text-red-600',
      progress: 'bg-red-500'
    },
    indigo: {
      icon: 'text-indigo-600',
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      progress: 'bg-indigo-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <Icon className={`w-5 h-5 ${colors.icon}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-medium">
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${colors.text}`}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </div>
          
          {progress && (
            <div className="space-y-1">
              <Progress 
                value={(progress.value / progress.max) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">
                {progress.value} de {progress.max} ({((progress.value / progress.max) * 100).toFixed(1)}%)
              </p>
            </div>
          )}
          
          {trend && (
            <p className="text-xs text-gray-500">
              {trend.period}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  metrics, 
  isLoading = false, 
  isRefreshing = false 
}) => {
  const formatTrend = (value: number) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity;
    const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600';
    
    return (
      <div className={`flex items-center space-x-1 ${colorClass} transition-colors duration-200`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{value.toFixed(1)}%
        </span>
      </div>
    );
  };

  const MetricCardSkeleton = () => (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );

  const metricsData = [
    {
      title: 'Total de Documentos',
      value: metrics.totalDocuments.toLocaleString('pt-BR'),
      trend: metrics.trends.documents,
      icon: FileText,
      description: 'Documentos processados este mês',
      tooltip: 'Inclui todos os documentos enviados para análise, independente do status final.'
    },
    {
      title: 'Score Médio',
      value: `${metrics.averageScore.toFixed(1)}%`,
      trend: metrics.trends.score,
      icon: Target,
      description: 'Qualidade média dos documentos analisados',
      tooltip: 'Score baseado em critérios de conformidade, completude e qualidade técnica.'
    },
    {
      title: 'Tempo de Processamento',
      value: `${metrics.averageProcessingTime.toFixed(1)}s`,
      trend: metrics.trends.processingTime,
      icon: Clock,
      description: 'Tempo médio para processar um documento',
      tooltip: 'Tempo desde o upload até a conclusão da análise, incluindo OCR e validações.'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${metrics.successRate.toFixed(1)}%`,
      trend: metrics.trends.successRate,
      icon: Activity,
      description: 'Percentual de documentos processados com sucesso',
      tooltip: 'Documentos que foram processados sem erros críticos ou falhas técnicas.'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <Card 
              key={index} 
              className={`transition-all duration-300 hover:shadow-lg hover:scale-105 ${
                isRefreshing ? 'opacity-75 animate-pulse' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {metric.title}
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{metric.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Icon className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-2 transition-all duration-200">
                  {metric.value}
                </div>
                <div className="flex items-center justify-between">
                  {formatTrend(metric.trend)}
                  <p className="text-xs text-gray-500 ml-2 truncate">
                    {metric.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default MetricsCards;