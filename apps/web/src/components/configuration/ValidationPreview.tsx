/**
 * Validation Preview Component
 * 
 * Real-time preview of configuration validation and analysis results
 * following GOV.BR design patterns
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp,
  BarChart3,
  Scale,
  Lightbulb,
  FileText,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/src/components/ui/tooltip';
import { Separator } from '@/src/components/ui/separator';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';

export interface ConfigurationData {
  organizationName: string;
  documentTypes: string[];
  weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
  customRules: Array<{
    id: string;
    name: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high';
    category: string;
    enabled: boolean;
  }>;
  templates: Array<{
    id: string;
    name: string;
    documentType: string;
    isDefault: boolean;
    isActive: boolean;
  }>;
  isActive: boolean;
}

export interface ValidationPreviewProps {
  configuration: ConfigurationData;
  errors: Record<string, any>;
  className?: string;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field: string;
  suggestion?: string;
}

interface AnalysisSimulation {
  score: number;
  category: string;
  weight: number;
  issues: number;
  improvements: string[];
}

export const ValidationPreview: React.FC<ValidationPreviewProps> = ({
  configuration,
  errors,
  className
}) => {
  const [showDetails, setShowDetails] = useState(true);
  const [simulationEnabled, setSimulationEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update timestamp when configuration changes
  useEffect(() => {
    setLastUpdate(new Date());
  }, [configuration]);

  // Validate configuration and generate issues
  const validationIssues = useMemo((): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    // Check weights sum to 100%
    const totalWeight = Object.values(configuration.weights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight !== 100) {
      issues.push({
        type: 'error',
        category: 'Pesos',
        message: `Os pesos devem somar 100% (atual: ${totalWeight}%)`,
        field: 'weights',
        suggestion: 'Ajuste os valores dos pesos para que a soma seja exatamente 100%'
      });
    }

    // Check document types selection
    if (configuration.documentTypes.length === 0) {
      issues.push({
        type: 'error',
        category: 'Tipos de Documento',
        message: 'Pelo menos um tipo de documento deve ser selecionado',
        field: 'documentTypes',
        suggestion: 'Selecione os tipos de documentos que sua organização analisa'
      });
    }

    // Check organization name
    if (!configuration.organizationName || configuration.organizationName.trim().length < 3) {
      issues.push({
        type: 'error',
        category: 'Organização',
        message: 'Nome da organização deve ter pelo menos 3 caracteres',
        field: 'organizationName',
        suggestion: 'Digite o nome completo da sua organização'
      });
    }

    // Check custom rules
    const invalidRules = configuration.customRules.filter(rule => !rule.pattern.trim());
    if (invalidRules.length > 0) {
      issues.push({
        type: 'warning',
        category: 'Regras Personalizadas',
        message: `${invalidRules.length} regra(s) com padrão vazio`,
        field: 'customRules',
        suggestion: 'Remova ou complete as regras com padrões vazios'
      });
    }

    // Check legal weight (should be significant)
    if (configuration.weights.legal < 25) {
      issues.push({
        type: 'warning',
        category: 'Conformidade Legal',
        message: 'Peso da conformidade legal está baixo (< 25%)',
        field: 'weights.legal',
        suggestion: 'Considere aumentar o peso da conformidade legal para documentos públicos'
      });
    }

    // Check if there are enabled custom rules
    const enabledRules = configuration.customRules.filter(rule => rule.enabled);
    if (enabledRules.length === 0 && configuration.customRules.length > 0) {
      issues.push({
        type: 'info',
        category: 'Regras Personalizadas',
        message: 'Todas as regras personalizadas estão desabilitadas',
        field: 'customRules',
        suggestion: 'Habilite as regras relevantes para sua organização'
      });
    }

    // Check templates
    const activeTemplates = configuration.templates.filter(t => t.isActive);
    if (activeTemplates.length === 0) {
      issues.push({
        type: 'info',
        category: 'Templates',
        message: 'Nenhum template ativo configurado',
        field: 'templates',
        suggestion: 'Configure templates para padronizar a criação de documentos'
      });
    }

    return issues;
  }, [configuration]);

  // Simulate analysis results based on current configuration
  const analysisSimulation = useMemo((): AnalysisSimulation[] => {
    if (!simulationEnabled) return [];

    return [
      {
        score: Math.max(60, 95 - (validationIssues.filter(i => i.type === 'error').length * 15)),
        category: 'Estrutural',
        weight: configuration.weights.structural,
        issues: Math.floor(Math.random() * 3),
        improvements: [
          'Verificar seções obrigatórias',
          'Validar numeração sequencial',
          'Confirmar anexos referenciados'
        ]
      },
      {
        score: Math.max(70, 90 - (validationIssues.filter(i => i.category === 'Conformidade Legal').length * 10)),
        category: 'Legal',
        weight: configuration.weights.legal,
        issues: configuration.customRules.filter(r => r.category === 'legal' && r.enabled).length > 0 ? 1 : 2,
        improvements: [
          'Verificar conformidade com Lei 8.666/93',
          'Validar prazos legais',
          'Confirmar habilitação jurídica'
        ]
      },
      {
        score: Math.max(75, 88 - (validationIssues.length * 2)),
        category: 'Clareza',
        weight: configuration.weights.clarity,
        issues: Math.floor(Math.random() * 2),
        improvements: [
          'Simplificar linguagem técnica',
          'Evitar ambiguidades',
          'Melhorar estrutura textual'
        ]
      },
      {
        score: Math.max(80, 92 - (validationIssues.filter(i => i.category === 'Templates').length * 5)),
        category: 'ABNT',
        weight: configuration.weights.abnt,
        issues: configuration.templates.filter(t => t.isActive).length > 0 ? 0 : 1,
        improvements: [
          'Padronizar formatação',
          'Verificar referências',
          'Ajustar numeração'
        ]
      }
    ];
  }, [configuration, validationIssues, simulationEnabled]);

  // Calculate overall score
  const overallScore = analysisSimulation.length > 0 
    ? Math.round(analysisSimulation.reduce((sum, item) => sum + (item.score * item.weight / 100), 0))
    : 0;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get issue icon
  const getIssueIcon = (type: ValidationIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  // Export configuration summary
  const handleExportSummary = () => {
    const summary = {
      organization: configuration.organizationName,
      configuration: {
        documentTypes: configuration.documentTypes,
        weights: configuration.weights,
        customRules: configuration.customRules.length,
        templates: configuration.templates.length
      },
      validation: {
        issues: validationIssues.length,
        errors: validationIssues.filter(i => i.type === 'error').length,
        warnings: validationIssues.filter(i => i.type === 'warning').length
      },
      simulation: analysisSimulation,
      overallScore,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-summary-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-blue-600" />
                  Preview de Validação
                </CardTitle>
                <CardDescription>
                  Visualização em tempo real da configuração
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportSummary}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Última atualização: {lastUpdate.toLocaleTimeString()}</span>
              <Badge variant={validationIssues.length === 0 ? "default" : "destructive"}>
                {validationIssues.length === 0 ? 'Válida' : `${validationIssues.length} problema(s)`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Resumo da Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Organização:</span>
                <p className="font-medium truncate">{configuration.organizationName || 'Não definida'}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <Badge variant={configuration.isActive ? "default" : "secondary"} className="ml-1">
                  {configuration.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Tipos de documento:</span>
                <p className="font-medium">{configuration.documentTypes.length}</p>
              </div>
              <div>
                <span className="text-gray-600">Regras personalizadas:</span>
                <p className="font-medium">
                  {configuration.customRules.filter(r => r.enabled).length} / {configuration.customRules.length}
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Weights */}
            <div className="space-y-2">
              <span className="text-sm text-gray-600">Distribuição de Pesos:</span>
              {Object.entries(configuration.weights).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key}:</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={value} className="w-16 h-2" />
                    <span className="text-sm font-medium w-8">{value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Validation Issues */}
        {validationIssues.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Problemas de Validação
              </CardTitle>
              <CardDescription>
                {validationIssues.length} problema(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {validationIssues.map((issue, index) => (
                <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                  <div className="flex items-start space-x-2">
                    {getIssueIcon(issue.type)}
                    <div className="flex-1 min-w-0">
                      <AlertDescription>
                        <strong>{issue.category}:</strong> {issue.message}
                        {issue.suggestion && showDetails && (
                          <div className="mt-1 text-xs text-gray-600">
                            💡 {issue.suggestion}
                          </div>
                        )}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Analysis Simulation */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Simulação de Análise
                </CardTitle>
                <CardDescription>
                  Preview dos resultados de análise baseado na configuração atual
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={simulationEnabled}
                  onCheckedChange={setSimulationEnabled}
                  size="sm"
                />
                <Label className="text-sm">Habilitar</Label>
              </div>
            </div>
          </CardHeader>
          
          {simulationEnabled && (
            <CardContent className="space-y-4">
              {/* Overall Score */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
                  {overallScore}
                </div>
                <div className="text-sm text-gray-600">Score Geral Estimado</div>
                <Progress value={overallScore} className="w-full mt-2" />
              </div>

              {/* Category Scores */}
              <div className="space-y-3">
                {analysisSimulation.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                        {item.category === 'Estrutural' && <BarChart3 className="h-4 w-4" />}
                        {item.category === 'Legal' && <Scale className="h-4 w-4" />}
                        {item.category === 'Clareza' && <Lightbulb className="h-4 w-4" />}
                        {item.category === 'ABNT' && <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium">{item.category}</div>
                        <div className="text-xs text-gray-500">
                          Peso: {item.weight}% • {item.issues} problema(s)
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cn("text-lg font-bold", getScoreColor(item.score))}>
                        {item.score}
                      </div>
                      <Progress value={item.score} className="w-16 h-1" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Improvements */}
              {showDetails && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    💡 Sugestões de Melhoria
                  </h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {analysisSimulation
                      .filter(item => item.score < 85)
                      .flatMap(item => item.improvements.slice(0, 1))
                      .map((improvement, index) => (
                        <li key={index}>• {improvement}</li>
                      ))
                    }
                  </ul>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Configuration Status */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center space-x-2">
              {validationIssues.filter(i => i.type === 'error').length === 0 ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    Configuração pronta para uso
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-700 font-medium">
                    Corrija os erros antes de ativar a configuração
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};