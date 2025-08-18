import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Download,
  Share,
  ChevronDown,
  ChevronUp,
  Clock,
  Target
} from 'lucide-react';
import { DocumentAnalysis, Problem } from '@/types/document';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalysisResultsProps {
  analysis: DocumentAnalysis;
  onExportReport?: () => void;
  onShareResults?: () => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number;
  total?: number;
  icon: React.ElementType;
  color: 'green' | 'yellow' | 'red' | 'blue';
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  total, 
  icon: Icon, 
  color, 
  description 
}) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
    blue: 'text-blue-600 bg-blue-100'
  };

  const percentage = total ? (value / total) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {value}{total && `/${total}`}
            </p>
            {total && (
              <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
            )}
          </div>
        </div>
        <h3 className="font-medium text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
        {total && (
          <Progress value={percentage} className="mt-2 h-2" />
        )}
      </CardContent>
    </Card>
  );
};

interface ProblemItemProps {
  problem: Problem;
  index: number;
}

const ProblemItem: React.FC<ProblemItemProps> = ({ problem, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: Problem['gravidade']) => {
    switch (severity) {
      case 'critica':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: Problem['gravidade']) => {
    switch (severity) {
      case 'critica':
        return XCircle;
      case 'alta':
        return AlertTriangle;
      case 'media':
        return Info;
      case 'baixa':
        return Info;
      default:
        return Info;
    }
  };

  const SeverityIcon = getSeverityIcon(problem.gravidade);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-1 rounded ${getSeverityColor(problem.gravidade)}`}>
            <SeverityIcon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900">Problema #{index + 1}</h4>
              <Badge className={getSeverityColor(problem.gravidade)}>
                {problem.gravidade}
              </Badge>
              {problem.categoria && (
                <Badge variant="outline">{problem.categoria}</Badge>
              )}
            </div>
            <p className="text-gray-700">{problem.descricao}</p>
            {problem.localizacao && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Local:</strong> {problem.localizacao}
              </p>
            )}
          </div>
        </div>
        
        {problem.sugestaoCorrecao && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        )}
      </div>
      
      {isExpanded && problem.sugestaoCorrecao && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h5 className="font-medium text-blue-900 mb-1">Sugestão de Correção:</h5>
          <p className="text-blue-800">{problem.sugestaoCorrecao}</p>
        </div>
      )}
    </div>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  analysis,
  onExportReport,
  onShareResults,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Calcular métricas derivadas
  const conformityPercentage = analysis.scoreConformidade;
  const totalProblems = analysis.problemasEncontrados.length;
  const criticalProblems = analysis.problemasEncontrados.filter(p => p.gravidade === 'critica').length;
  const highProblems = analysis.problemasEncontrados.filter(p => p.gravidade === 'alta').length;
  const mediumProblems = analysis.problemasEncontrados.filter(p => p.gravidade === 'media').length;
  const lowProblems = analysis.problemasEncontrados.filter(p => p.gravidade === 'baixa').length;

  // Determinar status geral
  const getOverallStatus = () => {
    if (conformityPercentage >= 90) return { status: 'Excelente', color: 'green', icon: CheckCircle };
    if (conformityPercentage >= 70) return { status: 'Bom', color: 'blue', icon: TrendingUp };
    if (conformityPercentage >= 50) return { status: 'Regular', color: 'yellow', icon: AlertTriangle };
    return { status: 'Crítico', color: 'red', icon: XCircle };
  };

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resultados da Análise</h1>
          <p className="text-gray-600">
            Análise realizada em {format(analysis.createdAt, 'dd/MM/yyyy \\à\\s HH:mm', { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {onShareResults && (
            <Button variant="outline" onClick={onShareResults}>
              <Share className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          )}
          {onExportReport && (
            <Button onClick={onExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </Button>
          )}
        </div>
      </div>

      {/* Status Geral */}
      <Alert className={`border-${overallStatus.color}-200 bg-${overallStatus.color}-50`}>
        <StatusIcon className={`h-4 w-4 text-${overallStatus.color}-600`} />
        <AlertDescription className={`text-${overallStatus.color}-800`}>
          <strong>Status: {overallStatus.status}</strong> - 
          Score de conformidade: {conformityPercentage.toFixed(1)}%
          {totalProblems > 0 && ` • ${totalProblems} problema${totalProblems !== 1 ? 's' : ''} encontrado${totalProblems !== 1 ? 's' : ''}`}
        </AlertDescription>
      </Alert>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Score de Conformidade"
          value={conformityPercentage}
          icon={Target}
          color={conformityPercentage >= 70 ? 'green' : conformityPercentage >= 50 ? 'yellow' : 'red'}
          description={`${conformityPercentage.toFixed(1)}% de conformidade`}
        />
        
        <MetricCard
          title="Cláusulas Válidas"
          value={analysis.metricas.validClauses}
          total={analysis.metricas.totalClauses}
          icon={CheckCircle}
          color="green"
        />
        
        <MetricCard
          title="Problemas Encontrados"
          value={totalProblems}
          icon={AlertTriangle}
          color={totalProblems === 0 ? 'green' : totalProblems <= 3 ? 'yellow' : 'red'}
          description={`${criticalProblems} críticos, ${highProblems} altos`}
        />
        
        <MetricCard
          title="Tempo de Processamento"
          value={analysis.metricas.processingTime}
          icon={Clock}
          color="blue"
          description={`${analysis.metricas.processingTime}s para análise`}
        />
      </div>

      {/* Tabs de Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="problems">Problemas ({totalProblems})</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="details">Detalhes Técnicos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição de Problemas */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Problemas por Gravidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>Críticos</span>
                    </div>
                    <span className="font-medium">{criticalProblems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Altos</span>
                    </div>
                    <span className="font-medium">{highProblems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Médios</span>
                    </div>
                    <span className="font-medium">{mediumProblems}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Baixos</span>
                    </div>
                    <span className="font-medium">{lowProblems}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métricas Detalhadas */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Análise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total de Cláusulas:</span>
                    <span className="font-medium">{analysis.metricas.totalClauses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cláusulas Válidas:</span>
                    <span className="font-medium text-green-600">{analysis.metricas.validClauses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cláusulas Faltantes:</span>
                    <span className="font-medium text-red-600">{analysis.metricas.missingClauses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inconsistências:</span>
                    <span className="font-medium text-yellow-600">{analysis.metricas.inconsistencies}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="problems" className="space-y-4">
          {totalProblems === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum problema encontrado!
                </h3>
                <p className="text-gray-600">
                  O documento está em conformidade com todos os critérios analisados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {analysis.problemasEncontrados.map((problem, index) => (
                <ProblemItem key={index} problem={problem} index={index} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {analysis.recomendacoes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Info className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma recomendação específica
                </h3>
                <p className="text-gray-600">
                  O documento não possui recomendações adicionais no momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recomendações de Melhoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recomendacoes.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-blue-800">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">ID da Análise:</span>
                    <p className="font-mono text-sm">{analysis.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Classificação:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline">{analysis.classification.tipoObjeto}</Badge>
                      <Badge variant="outline">{analysis.classification.modalidadePrincipal}</Badge>
                      <Badge variant="outline">{analysis.classification.subtipo}</Badge>
                      <Badge variant="outline">{analysis.classification.tipoDocumento}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Data da Análise:</span>
                    <p>{format(analysis.createdAt, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análise Específica</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.specificAnalysis).map(([key, value]) => {
                    if (typeof value === 'boolean') {
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {value ? 'Sim' : 'Não'}
                          </Badge>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisResults;