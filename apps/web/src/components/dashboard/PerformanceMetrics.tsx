import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertTriangle,
  Minus
} from 'lucide-react';

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

interface PerformanceMetricsProps {
  metrics: PerformanceMetric[];
  systemHealth: SystemHealth;
  className?: string;
}

type StatusType = 'good' | 'warning' | 'critical';

const getStatusConfig = (status: StatusType) => {
  switch (status) {
    case 'good':
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        badgeColor: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    case 'warning':
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: AlertTriangle
      };
    case 'critical':
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badgeColor: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    default:
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeColor: 'bg-gray-100 text-gray-800',
        icon: Minus
      };
  }
};

const getTrendConfig = (trend: PerformanceMetric['trend'], value: number) => {
  switch (trend) {
    case 'up':
      return {
        icon: TrendingUp,
        color: 'text-green-600',
        text: `+${value}%`
      };
    case 'down':
      return {
        icon: TrendingDown,
        color: 'text-red-600',
        text: `-${Math.abs(value)}%`
      };
    case 'stable':
      return {
        icon: Minus,
        color: 'text-gray-600',
        text: '0%'
      };
    default:
      return {
        icon: Minus,
        color: 'text-gray-600',
        text: '0%'
      };
  }
};

const getHealthStatus = (value: number, thresholds: { warning: number; critical: number }): StatusType => {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.warning) return 'warning';
  return 'good';
};

const formatUptime = (hours: number) => {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0) {
    return `${days}d ${remainingHours.toFixed(0)}h`;
  }
  return `${remainingHours.toFixed(1)}h`;
};

const formatValue = (value: number, unit: string) => {
  switch (unit) {
    case 'ms':
      return value < 1000 ? `${value.toFixed(0)}ms` : `${(value / 1000).toFixed(1)}s`;
    case 's':
      return `${value.toFixed(1)}s`;
    case '%':
      return `${value.toFixed(1)}%`;
    case 'MB':
      return value > 1024 ? `${(value / 1024).toFixed(1)}GB` : `${value.toFixed(0)}MB`;
    case 'req/min':
      return `${value.toFixed(0)} req/min`;
    default:
      return `${value.toFixed(1)} ${unit}`;
  }
};

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
  systemHealth,
  className = ''
}) => {
  // Calcular status geral do sistema
  const systemMetrics = [
    {
      name: 'CPU',
      value: systemHealth.cpu,
      icon: Cpu,
      status: getHealthStatus(systemHealth.cpu, { warning: 70, critical: 90 })
    },
    {
      name: 'Memória',
      value: systemHealth.memory,
      icon: HardDrive,
      status: getHealthStatus(systemHealth.memory, { warning: 80, critical: 95 })
    },
    {
      name: 'Disco',
      value: systemHealth.disk,
      icon: Database,
      status: getHealthStatus(systemHealth.disk, { warning: 85, critical: 95 })
    },
    {
      name: 'Rede',
      value: systemHealth.network,
      icon: Wifi,
      status: getHealthStatus(systemHealth.network, { warning: 80, critical: 95 })
    }
  ];
  
  const overallSystemStatus: StatusType = systemMetrics.some(m => m.status === 'critical') 
    ? 'critical' 
    : systemMetrics.some(m => m.status === 'warning') 
    ? 'warning' 
    : 'good';
  
  const overallStatusConfig = getStatusConfig(overallSystemStatus);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span>Métricas de Performance</span>
          <Badge className={overallStatusConfig.badgeColor}>
            Sistema {overallSystemStatus === 'good' ? 'Saudável' : 
                    overallSystemStatus === 'warning' ? 'Atenção' : 'Crítico'}
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Monitoramento em tempo real do desempenho do sistema
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status do Sistema */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {systemMetrics.map((metric) => {
            const config = getStatusConfig(metric.status);
            const Icon = metric.icon;
            
            return (
              <div 
                key={metric.name}
                className={`border rounded-lg p-3 ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {metric.name}
                    </span>
                  </div>
                  <span className={`text-lg font-bold ${config.color}`}>
                    {metric.value.toFixed(0)}%
                  </span>
                </div>
                
                <Progress 
                  value={metric.value} 
                  className="h-2"
                />
              </div>
            );
          })}
        </div>
        
        {/* Informações do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Server className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Uptime</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatUptime(systemHealth.uptime)}
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Sistema operacional
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Resposta</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {systemHealth.responseTime.toFixed(0)}ms
            </div>
            <p className="text-xs text-green-700 mt-1">
              Tempo médio de resposta
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Status</span>
            </div>
            <div className={`text-2xl font-bold ${overallStatusConfig.color}`}>
              {overallSystemStatus === 'good' ? '✓' : 
               overallSystemStatus === 'warning' ? '⚠' : '✗'}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              {overallSystemStatus === 'good' ? 'Todos os sistemas OK' :
               overallSystemStatus === 'warning' ? 'Requer atenção' : 'Problemas críticos'}
            </p>
          </div>
        </div>
        
        {/* Métricas de Performance */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Métricas de Aplicação</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric) => {
              const config = getStatusConfig(metric.status);
              const trendConfig = getTrendConfig(metric.trend, metric.trendValue);
              const StatusIcon = config.icon;
              const TrendIcon = trendConfig.icon;
              
              return (
                <div 
                  key={metric.id}
                  className={`border rounded-lg p-4 ${config.borderColor} ${config.bgColor}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`w-5 h-5 ${config.color}`} />
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {metric.name}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-xl font-bold ${config.color}`}>
                        {formatValue(metric.value, metric.unit)}
                      </div>
                      {metric.target && (
                        <div className="text-xs text-gray-500">
                          Meta: {formatValue(metric.target, metric.unit)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progresso em relação à meta */}
                  {metric.target && (
                    <div className="mb-3">
                      <Progress 
                        value={Math.min((metric.value / metric.target) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>0</span>
                        <span>{formatValue(metric.target, metric.unit)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Tendência */}
                  <div className="flex items-center justify-between">
                    <Badge className={config.badgeColor}>
                      {metric.status === 'good' ? 'Bom' :
                       metric.status === 'warning' ? 'Atenção' : 'Crítico'}
                    </Badge>
                    
                    <div className={`flex items-center space-x-1 ${trendConfig.color}`}>
                      <TrendIcon className="w-3 h-3" />
                      <span className="text-xs font-medium">
                        {trendConfig.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Resumo de Performance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Resumo de Performance</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.filter(m => m.status === 'good').length}
              </div>
              <div className="text-xs text-gray-600">
                Métricas Saudáveis
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {metrics.filter(m => m.status === 'warning').length}
              </div>
              <div className="text-xs text-gray-600">
                Requerem Atenção
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-red-600">
                {metrics.filter(m => m.status === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">
                Críticas
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {((metrics.filter(m => m.status === 'good').length / metrics.length) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">
                Taxa de Saúde
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;