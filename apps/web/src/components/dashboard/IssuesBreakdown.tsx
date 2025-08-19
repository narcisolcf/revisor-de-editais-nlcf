import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

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

interface IssuesBreakdownProps {
  issues: Issue[];
  totalDocuments: number;
  className?: string;
}

const getIssueConfig = (type: Issue['type']) => {
  switch (type) {
    case 'critical':
      return {
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badgeColor: 'bg-red-100 text-red-800'
      };
    case 'warning':
      return {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800'
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800'
      };
    default:
      return {
        icon: Info,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        badgeColor: 'bg-gray-100 text-gray-800'
      };
  }
};

const getTrendConfig = (trend: Issue['trend'], value: number) => {
  switch (trend) {
    case 'up':
      return {
        icon: TrendingUp,
        color: 'text-red-600',
        text: `+${value}%`
      };
    case 'down':
      return {
        icon: TrendingDown,
        color: 'text-green-600',
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

const getCategoryColor = (category: string) => {
  const colors = {
    'Conformidade': 'bg-purple-100 text-purple-800',
    'Documentação': 'bg-blue-100 text-blue-800',
    'Prazos': 'bg-orange-100 text-orange-800',
    'Valores': 'bg-green-100 text-green-800',
    'Técnico': 'bg-indigo-100 text-indigo-800',
    'Legal': 'bg-red-100 text-red-800',
    'Qualidade': 'bg-yellow-100 text-yellow-800'
  };
  
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const IssuesBreakdown: React.FC<IssuesBreakdownProps> = ({
  issues,
  totalDocuments,
  className = ''
}) => {
  // Calcular estatísticas gerais
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
  const criticalIssues = issues.filter(issue => issue.type === 'critical');
  const warningIssues = issues.filter(issue => issue.type === 'warning');
  const infoIssues = issues.filter(issue => issue.type === 'info');
  
  const criticalCount = criticalIssues.reduce((sum, issue) => sum + issue.count, 0);
  const warningCount = warningIssues.reduce((sum, issue) => sum + issue.count, 0);
  const infoCount = infoIssues.reduce((sum, issue) => sum + issue.count, 0);
  
  // Agrupar por categoria
  const issuesByCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);
  
  // Ordenar issues por severidade e contagem
  const sortedIssues = [...issues].sort((a, b) => {
    const severityOrder = { critical: 3, warning: 2, info: 1 };
    const severityDiff = severityOrder[b.type] - severityOrder[a.type];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <span>Análise de Problemas</span>
          <Badge variant="outline">
            {totalIssues} problemas encontrados
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Distribuição e tendências dos problemas identificados
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Resumo por Severidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Críticos</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
            </div>
            <div className="mt-2">
              <Progress 
                value={(criticalCount / totalIssues) * 100} 
                className="h-2"
              />
              <p className="text-xs text-red-700 mt-1">
                {((criticalCount / totalIssues) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">Avisos</span>
              </div>
              <span className="text-2xl font-bold text-yellow-600">{warningCount}</span>
            </div>
            <div className="mt-2">
              <Progress 
                value={(warningCount / totalIssues) * 100} 
                className="h-2"
              />
              <p className="text-xs text-yellow-700 mt-1">
                {((warningCount / totalIssues) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Informativos</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{infoCount}</span>
            </div>
            <div className="mt-2">
              <Progress 
                value={(infoCount / totalIssues) * 100} 
                className="h-2"
              />
              <p className="text-xs text-blue-700 mt-1">
                {((infoCount / totalIssues) * 100).toFixed(1)}% do total
              </p>
            </div>
          </div>
        </div>
        
        {/* Lista Detalhada de Problemas */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Problemas Mais Frequentes</h4>
          
          {sortedIssues.slice(0, 8).map((issue) => {
            const config = getIssueConfig(issue.type);
            const trendConfig = getTrendConfig(issue.trend, issue.trendValue);
            const Icon = config.icon;
            const TrendIcon = trendConfig.icon;
            
            return (
              <div 
                key={issue.id}
                className={`border rounded-lg p-4 ${config.borderColor} ${config.bgColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="font-medium text-gray-900 truncate">
                          {issue.title}
                        </h5>
                        <Badge className={getCategoryColor(issue.category)}>
                          {issue.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {issue.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="font-medium text-gray-900">
                          {issue.count} ocorrências
                        </span>
                        <span className="text-gray-600">
                          {issue.percentage.toFixed(1)}% dos documentos
                        </span>
                        
                        <div className={`flex items-center space-x-1 ${trendConfig.color}`}>
                          <TrendIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {trendConfig.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${config.color}`}>
                      {issue.count}
                    </div>
                    <div className="text-xs text-gray-500">
                      de {totalDocuments}
                    </div>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mt-3">
                  <Progress 
                    value={issue.percentage} 
                    className="h-1.5"
                  />
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Resumo por Categoria */}
        {Object.keys(issuesByCategory).length > 1 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Problemas por Categoria</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(issuesByCategory).map(([category, categoryIssues]) => {
                const categoryCount = categoryIssues.reduce((sum, issue) => sum + issue.count, 0);
                const categoryPercentage = (categoryCount / totalIssues) * 100;
                
                return (
                  <div key={category} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                      <span className="font-medium text-gray-900">
                        {categoryCount}
                      </span>
                    </div>
                    
                    <Progress value={categoryPercentage} className="h-2" />
                    
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>{categoryPercentage.toFixed(1)}% do total</span>
                      <span>{categoryIssues.length} tipos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Estatísticas Gerais */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {((totalIssues / totalDocuments) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                Taxa de Problemas
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(totalIssues / totalDocuments).toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">
                Problemas por Doc
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {totalDocuments - issues.filter(i => i.type === 'critical').length}
              </div>
              <div className="text-xs text-gray-600">
                Docs sem Críticos
              </div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(issuesByCategory).length}
              </div>
              <div className="text-xs text-gray-600">
                Categorias
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssuesBreakdown;