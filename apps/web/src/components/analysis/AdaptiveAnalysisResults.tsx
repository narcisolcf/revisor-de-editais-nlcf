import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Zap,
  Target,
  BarChart3,
  FileText,
  Shield,
  Eye,
  Settings
} from 'lucide-react';
import { AdaptiveAnalysisResult } from '@/hooks/useAdaptiveAnalysis';
import { OrganizationConfig } from '@/hooks/useAnalysisConfig';

interface AdaptiveAnalysisResultsProps {
  result: AdaptiveAnalysisResult;
  baselineResult?: AdaptiveAnalysisResult;
  config?: OrganizationConfig;
  onExport?: () => void;
}

export const AdaptiveAnalysisResults: React.FC<AdaptiveAnalysisResultsProps> = ({
  result,
  baselineResult,
  config,
  onExport
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Calcular comparação com baseline
  const comparison = useMemo(() => {
    if (!baselineResult) return null;
    
    return {
      overallScore: result.overallScore - baselineResult.overallScore,
      categoryScores: {
        structural: result.categoryResults.structural.score - baselineResult.categoryResults.structural.score,
        legal: result.categoryResults.legal.score - baselineResult.categoryResults.legal.score,
        clarity: result.categoryResults.clarity.score - baselineResult.categoryResults.clarity.score,
        abnt: result.categoryResults.abnt.score - baselineResult.categoryResults.abnt.score
      },
      improvements: {
        structural: result.categoryResults.structural.score > baselineResult.categoryResults.structural.score,
        legal: result.categoryResults.legal.score > baselineResult.categoryResults.legal.score,
        clarity: result.categoryResults.clarity.score > baselineResult.categoryResults.clarity.score,
        abnt: result.categoryResults.abnt.score > baselineResult.categoryResults.abnt.score
      }
    };
  }, [result, baselineResult]);

  // Agrupar problemas por categoria
  const problemsByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ categoria?: string; gravidade?: string; [key: string]: unknown }>> = {
      structural: [],
      legal: [],
      clarity: [],
      abnt: [],
      general: []
    };

    result.problems.forEach(problem => {
      const category = problem.categoria || 'general';
      if (grouped[category]) {
        grouped[category].push(problem);
      }
    });

    return grouped;
  }, [result.problems]);

  // Calcular estatísticas por categoria
  const categoryStats = useMemo(() => {
    const stats: Record<string, { score: number; problems: number; critical: number; high: number; medium: number; low: number }> = {};

    Object.entries(result.categoryResults).forEach(([category, categoryResult]) => {
      const categoryProblems = problemsByCategory[category] || [];
      
      stats[category] = {
        score: categoryResult.score,
        problems: categoryProblems.length,
        critical: categoryProblems.filter(p => p.gravidade === 'critica').length,
        high: categoryProblems.filter(p => p.gravidade === 'alta').length,
        medium: categoryProblems.filter(p => p.gravidade === 'media').length,
        low: categoryProblems.filter(p => p.gravidade === 'baixa').length
      };
    });

    return stats;
  }, [result.categoryResults, problemsByCategory]);

  // Toggle categoria expandida
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Renderizar ícone de gravidade
  const renderSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critica':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'alta':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'media':
        return <Info className="w-4 h-4 text-yellow-500" />;
      case 'baixa':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  // Renderizar badge de gravidade
  const renderSeverityBadge = (severity: string) => {
    const severityMap = {
      critica: { color: 'destructive', label: 'Crítica' },
      alta: { color: 'default', label: 'Alta' },
      media: { color: 'secondary', label: 'Média' },
      baixa: { color: 'outline', label: 'Baixa' }
    };

    const config = severityMap[severity as keyof typeof severityMap] || severityMap.baixa;
    
    return (
      <Badge variant={config.color as 'destructive' | 'default' | 'secondary' | 'outline'} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  // Renderizar indicador de melhoria
  const renderImprovementIndicator = (improvement: number) => {
    if (improvement > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">+{improvement.toFixed(1)}</span>
        </div>
      );
    } else if (improvement < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">{improvement.toFixed(1)}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header com Score Geral */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl font-bold">
                  Score Geral: {result.overallScore.toFixed(1)}/100
                </CardTitle>
                <p className="text-gray-600">
                  Análise personalizada concluída em {result.totalProcessingTime}ms
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {config && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Settings className="w-3 h-3" />
                  <span>{config.name}</span>
                </Badge>
              )}
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => onExport?.()}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport?.()}>
                  <FileText className="w-4 h-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {result.overallConfidence}%
              </div>
              <div className="text-sm text-gray-600">Confiança</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {result.problems.length}
              </div>
              <div className="text-sm text-gray-600">Problemas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {result.cacheStats.hitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Cache Hit</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {result.fallbackStats.totalFallbacks}
              </div>
              <div className="text-sm text-gray-600">Fallbacks</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="problems">Problemas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scores por Categoria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Scores por Categoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(categoryStats).map(([category, stats]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">{stats.score.toFixed(1)}</span>
                        {comparison && renderImprovementIndicator(comparison.categoryScores[category as keyof typeof comparison.categoryScores])}
                      </div>
                    </div>
                    <Progress value={stats.score} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{stats.problems} problemas</span>
                      <span>{stats.critical + stats.high} críticos/altos</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comparação com Baseline */}
            {comparison && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Comparação com Baseline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {comparison.overallScore > 0 ? '+' : ''}{comparison.overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Mudança no Score Geral</div>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.entries(comparison.categoryScores).map(([category, change]) => (
                      <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                        <span className="font-medium capitalize">{category}</span>
                        <div className="flex items-center space-x-2">
                          {renderImprovementIndicator(change)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="space-y-4">
          {Object.entries(result.categoryResults).map(([category, categoryResult]) => {
            const stats = categoryStats[category];
            const isExpanded = expandedCategories.has(category);
            
            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {category === 'structural' && <FileText className="w-5 h-5 text-blue-600" />}
                        {category === 'legal' && <Shield className="w-5 h-5 text-blue-600" />}
                        {category === 'clarity' && <Eye className="w-5 h-5 text-blue-600" />}
                        {category === 'abnt' && <Target className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div>
                        <CardTitle className="capitalize">{category}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Score: {categoryResult.score.toFixed(1)} | Confiança: {categoryResult.confidence}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats.score.toFixed(1)}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="border-t bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">{stats.critical}</div>
                        <div className="text-xs text-gray-600">Críticos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">{stats.high}</div>
                        <div className="text-xs text-gray-600">Altos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{stats.medium}</div>
                        <div className="text-xs text-gray-600">Médios</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{stats.low}</div>
                        <div className="text-xs text-gray-600">Baixos</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Métricas Detalhadas:</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Tempo de Processamento:</span>
                          <span className="ml-2 font-medium">{categoryResult.processingTime}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cache Key:</span>
                          <span className="ml-2 font-medium text-xs font-mono">
                            {categoryResult.cacheKey?.substring(0, 20)}...
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Problemas */}
        <TabsContent value="problems" className="space-y-4">
          {Object.entries(problemsByCategory).map(([category, problems]) => {
            if (problems.length === 0) return null;
            
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize flex items-center space-x-2">
                    <span>{category}</span>
                    <Badge variant="secondary">{problems.length} problemas</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {problems.map((problem, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {renderSeverityIcon(problem.gravidade)}
                              {renderSeverityBadge(problem.gravidade)}
                              <span className="text-sm text-gray-600">
                                {problem.localizacao || 'Documento geral'}
                              </span>
                            </div>
                            
                            <h4 className="font-medium text-gray-900 mb-2">
                              {problem.descricao}
                            </h4>
                            
                            {problem.sugestaoCorrecao && (
                              <div className="bg-blue-50 p-3 rounded-md">
                                <div className="flex items-center space-x-2 mb-1">
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800">Sugestão de Correção:</span>
                                </div>
                                <p className="text-sm text-blue-700">{problem.sugestaoCorrecao}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Tab: Métricas */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Métricas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Métricas de Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.performanceMetrics && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>Tempo de Processamento</span>
                      <span className="font-medium">{result.performanceMetrics.processingTime}ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cache Hits</span>
                      <span className="font-medium">{result.performanceMetrics.cacheHits}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Uso de Fallback</span>
                      <span className="font-medium">{result.performanceMetrics.fallbackUsage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Uso de Memória</span>
                      <span className="font-medium">{result.performanceMetrics.memoryUsage.toFixed(1)}MB</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas de Cache */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Estatísticas de Cache</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Hit Rate</span>
                  <span className="font-medium">{result.cacheStats.hitRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total de Hits</span>
                  <span className="font-medium">{result.cacheStats.hits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total de Misses</span>
                  <span className="font-medium">{result.cacheStats.misses}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parâmetros Customizados */}
          {result.customParameters && Object.keys(result.customParameters).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros Customizados Aplicados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(result.customParameters).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-md">
                      <div className="text-sm font-medium text-gray-700">{key}</div>
                      <div className="text-sm text-gray-600">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
