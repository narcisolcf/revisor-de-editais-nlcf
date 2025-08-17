/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import { TemplateStructure } from '../../types/template';

interface TemplateAnalyticsProps {
  organizationId: string;
}

interface CategoryAnalytics {
  category: string;
  totalTemplates: number;
  activeTemplates: number;
  averageRating: number;
  totalUsage: number;
  growthRate: number;
}

interface TopTemplate {
  id: string;
  name: string;
  category: string;
  usageCount: number;
  rating: number;
  growth: number;
}

interface Insight {
  id: string;
  type: 'improvement' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  priority: number;
}

export const TemplateAnalytics: React.FC<TemplateAnalyticsProps> = ({
  organizationId
}) => {
  // Mock data - em produção viria de API
  const categoryAnalytics: CategoryAnalytics[] = [
    {
      category: 'edital',
      totalTemplates: 15,
      activeTemplates: 12,
      averageRating: 4.6,
      totalUsage: 234,
      growthRate: 12.5
    },
    {
      category: 'tr',
      totalTemplates: 8,
      activeTemplates: 7,
      averageRating: 4.8,
      totalUsage: 156,
      growthRate: 8.2
    },
    {
      category: 'etp',
      totalTemplates: 6,
      activeTemplates: 5,
      averageRating: 4.4,
      totalUsage: 89,
      growthRate: 15.7
    },
    {
      category: 'mapa_risco',
      totalTemplates: 4,
      activeTemplates: 3,
      averageRating: 4.2,
      totalUsage: 45,
      growthRate: 5.1
    },
    {
      category: 'minuta',
      totalTemplates: 10,
      activeTemplates: 8,
      averageRating: 4.7,
      totalUsage: 178,
      growthRate: 9.8
    }
  ];

  const topTemplates: TopTemplate[] = [
    {
      id: '1',
      name: 'Edital Obra Pública',
      category: 'edital',
      usageCount: 45,
      rating: 4.8,
      growth: 15.2
    },
    {
      id: '2',
      name: 'TR Desenvolvimento Web',
      category: 'tr',
      usageCount: 32,
      rating: 4.9,
      growth: 12.8
    },
    {
      id: '3',
      name: 'ETP Infraestrutura',
      category: 'etp',
      usageCount: 28,
      rating: 4.6,
      growth: 18.5
    }
  ];

  const insights: Insight[] = [
    {
      id: '1',
      type: 'improvement',
      title: 'Otimizar Templates de ETP',
      description: 'Templates de ETP têm menor rating. Considere revisar validações.',
      impact: 'medium',
      priority: 2
    },
    {
      id: '2',
      type: 'opportunity',
      title: 'Expandir Categoria Mapas de Risco',
      description: 'Baixa utilização mas alto crescimento. Oportunidade de expansão.',
      impact: 'high',
      priority: 1
    },
    {
      id: '3',
      type: 'warning',
      title: 'Templates Inativos',
      description: '5 templates inativos podem ser removidos ou atualizados.',
      impact: 'low',
      priority: 3
    }
  ];

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      edital: 'Editais',
      tr: 'Termos de Referência',
      etp: 'ETPs',
      mapa_risco: 'Mapas de Risco',
      minuta: 'Minutas'
    };
    return labels[category] || category;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'improvement':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      case 'opportunity':
        return <Activity className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Templates</span>
            </div>
            <div className="text-2xl font-bold">43</div>
            <p className="text-xs text-gray-500">+8% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Templates Ativos</span>
            </div>
            <div className="text-2xl font-bold">35</div>
            <p className="text-xs text-gray-500">81% ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Usos</span>
            </div>
            <div className="text-2xl font-bold">702</div>
            <p className="text-xs text-gray-500">+12% este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Rating Médio</span>
            </div>
            <div className="text-2xl font-bold">4.6</div>
            <p className="text-xs text-gray-500">+0.2 este mês</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="templates">Top Templates</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Tab: Análise por Categoria */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoryAnalytics.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {getCategoryLabel(category.category)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total:</span>
                      <div className="font-semibold">{category.totalTemplates}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Ativos:</span>
                      <div className="font-semibold">{category.activeTemplates}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Rating Médio</span>
                      <span className="font-medium">{category.averageRating}</span>
                    </div>
                    <Progress value={category.averageRating * 20} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total de Usos</span>
                      <span className="font-medium">{category.totalUsage}</span>
                    </div>
                    <Progress value={(category.totalUsage / 300) * 100} className="h-2" />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Crescimento:</span>
                    <div className={`flex items-center space-x-1 ${
                      category.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {category.growthRate > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{Math.abs(category.growthRate)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Top Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div className="space-y-4">
            {topTemplates.map((template, index) => (
              <Card key={template.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">
                          {getCategoryLabel(template.category)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">{template.usageCount} usos</div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span>⭐ {template.rating}</span>
                        <div className={`flex items-center space-x-1 ${
                          template.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {template.growth > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>{template.growth}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant={getInsightBadgeVariant(insight.impact)}>
                          {insight.impact === 'high' ? 'Alto' : 
                           insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                        </Badge>
                        <Badge variant="outline">P{insight.priority}</Badge>
                      </div>
                      <p className="text-gray-600">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
