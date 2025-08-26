import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  CheckCircle,
  Activity
} from 'lucide-react';

interface OverviewData {
  totalDocuments: number;
  documentsThisMonth: number;
  averageScore: number;
  averageProcessingTime: number;
  totalAnalyses: number;
  successRate: number;
}

interface MetricsCardsProps {
  data: OverviewData;
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

export const MetricsCards: React.FC<MetricsCardsProps> = ({ data }) => {
  // Calcular tendências (simuladas para demonstração)
  const documentsTrend = {
    value: 12.5,
    isPositive: true,
    period: 'vs. mês anterior'
  };
  
  const scoreTrend = {
    value: 3.2,
    isPositive: true,
    period: 'vs. mês anterior'
  };
  
  const timeTrend = {
    value: -8.1,
    isPositive: true, // Redução no tempo é positiva
    period: 'vs. mês anterior'
  };
  
  const successTrend = {
    value: 1.8,
    isPositive: true,
    period: 'vs. mês anterior'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total de Documentos"
        subtitle="Processados"
        value={data.totalDocuments}
        icon={FileText}
        trend={documentsTrend}
        progress={{
          value: data.documentsThisMonth,
          max: 100
        }}
        color="blue"
      />
      
      <MetricCard
        title="Score Médio"
        subtitle="Conformidade"
        value={`${data.averageScore.toFixed(1)}%`}
        icon={Target}
        trend={scoreTrend}
        progress={{
          value: data.averageScore,
          max: 100
        }}
        color="green"
      />
      
      <MetricCard
        title="Tempo Médio"
        subtitle="Processamento"
        value={`${data.averageProcessingTime.toFixed(1)}s`}
        icon={Clock}
        trend={timeTrend}
        color="orange"
      />
      
      <MetricCard
        title="Taxa de Sucesso"
        subtitle="Análises"
        value={`${data.successRate.toFixed(1)}%`}
        icon={CheckCircle}
        trend={successTrend}
        progress={{
          value: data.successRate,
          max: 100
        }}
        color="purple"
      />
    </div>
  );
};

export default MetricsCards;