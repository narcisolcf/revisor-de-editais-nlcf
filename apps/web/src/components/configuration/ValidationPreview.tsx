/**
 * Componente ValidationPreview
 * 
 * Preview de validação para o sistema LicitaReview.
 * Permite visualizar como as configurações atuais afetarão a análise
 * de documentos, mostrando simulações e exemplos de validação.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Play,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  FileText,
  BarChart3,
  Settings,
  Eye,
  Download,
  Upload,
  Zap,
  Target,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useAnalysisConfig, type AnalysisWeights, type AnalysisRule } from '@/hooks/useAnalysisConfig';
import { useAdaptiveAnalysis } from '@/hooks/useAdaptiveAnalysis';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ValidationPreviewProps {
  weights: AnalysisWeights;
  customRules: AnalysisRule[];
  documentType: string;
  className?: string;
}

interface ValidationResult {
  id: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  weight: number;
  finalScore: number;
  suggestions: string[];
  ruleId?: string;
}

interface SimulationResult {
  overallScore: number;
  categoryScores: Record<string, number>;
  validationResults: ValidationResult[];
  appliedRules: number;
  totalChecks: number;
  processingTime: number;
  recommendations: string[];
}

const sampleDocuments = [
  {
    id: 'edital_sample',
    name: 'Edital de Licitação - Exemplo',
    type: 'edital',
    description: 'Edital para contratação de serviços de TI',
    content: `EDITAL DE LICITAÇÃO Nº 001/2024
    
PROCESSO ADMINISTRATIVO: 2024.001.001
MODALIDADE: Pregão Eletrônico
TIPO: Menor Preço
OBJETO: Contratação de empresa especializada em desenvolvimento de software...
    
1. DO OBJETO
1.1. O presente edital tem por objeto a contratação de empresa especializada...
    
2. DAS CONDIÇÕES DE PARTICIPAÇÃO
2.1. Poderão participar desta licitação...
    
3. DO CREDENCIAMENTO
3.1. Para participar do pregão eletrônico...
    
4. DA PROPOSTA
4.1. A proposta deverá ser apresentada...`
  },
  {
    id: 'tr_sample',
    name: 'Termo de Referência - Exemplo',
    type: 'tr',
    description: 'TR para desenvolvimento de sistema web',
    content: `TERMO DE REFERÊNCIA
    
1. OBJETO
Contratação de empresa especializada no desenvolvimento de sistema web...
    
2. JUSTIFICATIVA
A necessidade de modernização dos processos...
    
3. ESPECIFICAÇÕES TÉCNICAS
3.1. O sistema deverá ser desenvolvido em tecnologia web...
3.2. Deverá possuir interface responsiva...
    
4. METODOLOGIA
4.1. A metodologia de desenvolvimento deverá ser ágil...
    
5. CRONOGRAMA
5.1. O prazo total para execução será de 12 meses...`
  },
  {
    id: 'contrato_sample',
    name: 'Contrato - Exemplo',
    type: 'contrato',
    description: 'Contrato de prestação de serviços',
    content: `CONTRATO Nº 001/2024
    
CONTRATANTE: Órgão Público
CONTRATADA: Empresa XYZ Ltda.
    
CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem por objeto...
    
CLÁUSULA SEGUNDA - DO VALOR
O valor total do contrato é de R$ 100.000,00...
    
CLÁUSULA TERCEIRA - DO PRAZO
O prazo de vigência será de 12 meses...
    
CLÁUSULA QUARTA - DAS OBRIGAÇÕES
4.1. São obrigações da CONTRATADA...
4.2. São obrigações da CONTRATANTE...`
  }
];

const severityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

const severityIcons = {
  low: CheckCircle,
  medium: Info,
  high: AlertTriangle,
  critical: XCircle
};

export const ValidationPreview: React.FC<ValidationPreviewProps> = ({
  weights,
  customRules,
  documentType,
  className
}) => {
  const { organization } = useAuth();
  const { runAnalysis } = useAdaptiveAnalysis();
  
  // Estados principais
  const [selectedDocument, setSelectedDocument] = useState(sampleDocuments[0]);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filtra documentos por tipo
  const availableDocuments = useMemo(() => {
    if (documentType === 'all') return sampleDocuments;
    return sampleDocuments.filter(doc => doc.type === documentType);
  }, [documentType]);
  
  // Executa simulação
  const runSimulation = async () => {
    setIsRunning(true);
    
    try {
      // Simula tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Gera resultados simulados baseados na configuração atual
      const results = generateSimulationResults();
      setSimulationResult(results);
      
      toast({
        title: 'Simulação concluída',
        description: 'Preview de validação gerado com sucesso'
      });
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        title: 'Erro na simulação',
        description: 'Não foi possível executar o preview de validação',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  // Gera resultados simulados
  const generateSimulationResults = (): SimulationResult => {
    const validationResults: ValidationResult[] = [];
    
    // Validações estruturais
    validationResults.push({
      id: 'struct_1',
      category: 'structural',
      description: 'Estrutura do documento está bem organizada',
      severity: 'low',
      score: 0.9,
      weight: weights.structural,
      finalScore: 0.9 * weights.structural,
      suggestions: ['Manter a organização atual']
    });
    
    validationResults.push({
      id: 'struct_2',
      category: 'structural',
      description: 'Falta numeração sequencial em algumas seções',
      severity: 'medium',
      score: 0.7,
      weight: weights.structural,
      finalScore: 0.7 * weights.structural,
      suggestions: ['Adicionar numeração sequencial', 'Revisar estrutura de seções']
    });
    
    // Validações jurídicas
    validationResults.push({
      id: 'legal_1',
      category: 'legal',
      description: 'Conformidade com Lei 8.666/93 verificada',
      severity: 'low',
      score: 0.95,
      weight: weights.legal,
      finalScore: 0.95 * weights.legal,
      suggestions: ['Documento em conformidade']
    });
    
    validationResults.push({
      id: 'legal_2',
      category: 'legal',
      description: 'Cláusula de penalidades pode ser mais específica',
      severity: 'medium',
      score: 0.75,
      weight: weights.legal,
      finalScore: 0.75 * weights.legal,
      suggestions: ['Detalhar tipos de penalidades', 'Especificar valores de multa']
    });
    
    // Validações de clareza
    validationResults.push({
      id: 'clarity_1',
      category: 'clarity',
      description: 'Linguagem clara e objetiva',
      severity: 'low',
      score: 0.85,
      weight: weights.clarity,
      finalScore: 0.85 * weights.clarity,
      suggestions: ['Manter clareza na redação']
    });
    
    validationResults.push({
      id: 'clarity_2',
      category: 'clarity',
      description: 'Alguns termos técnicos sem definição',
      severity: 'high',
      score: 0.6,
      weight: weights.clarity,
      finalScore: 0.6 * weights.clarity,
      suggestions: ['Adicionar glossário', 'Definir termos técnicos']
    });
    
    // Validações ABNT
    validationResults.push({
      id: 'abnt_1',
      category: 'abnt',
      description: 'Formatação conforme normas ABNT',
      severity: 'low',
      score: 0.8,
      weight: weights.abnt,
      finalScore: 0.8 * weights.abnt,
      suggestions: ['Verificar espaçamento entre parágrafos']
    });
    
    // Validações orçamentárias
    validationResults.push({
      id: 'budget_1',
      category: 'budgetary',
      description: 'Estimativa orçamentária presente',
      severity: 'low',
      score: 0.9,
      weight: weights.budgetary,
      finalScore: 0.9 * weights.budgetary,
      suggestions: ['Manter detalhamento atual']
    });
    
    // Validações formais
    validationResults.push({
      id: 'formal_1',
      category: 'formal',
      description: 'Assinaturas e carimbos presentes',
      severity: 'low',
      score: 0.95,
      weight: weights.formal,
      finalScore: 0.95 * weights.formal,
      suggestions: ['Documento formalmente correto']
    });
    
    // Aplica regras personalizadas
    customRules.forEach((rule, index) => {
      if (rule.isActive) {
        validationResults.push({
          id: `custom_${index}`,
          category: rule.category,
          description: `Regra personalizada: ${rule.name}`,
          severity: rule.severity,
          score: Math.random() * 0.4 + 0.6, // Score entre 0.6 e 1.0
          weight: 0.05, // Peso fixo para regras personalizadas
          finalScore: (Math.random() * 0.4 + 0.6) * 0.05,
          suggestions: [rule.suggestion || 'Verificar conformidade com a regra'],
          ruleId: rule.id
        });
      }
    });
    
    // Calcula scores por categoria
    const categoryScores: Record<string, number> = {};
    const categories = ['structural', 'legal', 'clarity', 'abnt', 'budgetary', 'formal'];
    
    categories.forEach(category => {
      const categoryResults = validationResults.filter(r => r.category === category);
      if (categoryResults.length > 0) {
        const totalScore = categoryResults.reduce((sum, r) => sum + r.finalScore, 0);
        const totalWeight = categoryResults.reduce((sum, r) => sum + r.weight, 0);
        categoryScores[category] = totalWeight > 0 ? totalScore / totalWeight : 0;
      } else {
        categoryScores[category] = 0;
      }
    });
    
    // Calcula score geral
    const overallScore = validationResults.reduce((sum, r) => sum + r.finalScore, 0);
    
    // Gera recomendações
    const recommendations = [
      'Revisar seções com score abaixo de 0.7',
      'Adicionar glossário para termos técnicos',
      'Verificar conformidade com normas ABNT',
      'Detalhar cláusulas de penalidades'
    ];
    
    return {
      overallScore: Math.min(overallScore, 1.0),
      categoryScores,
      validationResults,
      appliedRules: customRules.filter(r => r.isActive).length,
      totalChecks: validationResults.length,
      processingTime: Math.random() * 2000 + 1000, // Entre 1-3 segundos
      recommendations
    };
  };
  
  // Executa simulação automaticamente quando configuração muda
  useEffect(() => {
    if (selectedDocument) {
      runSimulation();
    }
  }, [weights, customRules, selectedDocument]);
  
  // Renderiza resultado de validação
  const renderValidationResult = (result: ValidationResult) => {
    const SeverityIcon = severityIcons[result.severity];
    
    return (
      <Card key={result.id} className="mb-4">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <SeverityIcon className={`h-5 w-5 mt-0.5 ${
                result.severity === 'low' ? 'text-green-600' :
                result.severity === 'medium' ? 'text-yellow-600' :
                result.severity === 'high' ? 'text-orange-600' :
                'text-red-600'
              }`} />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{result.description}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Categoria: {result.category} • Score: {(result.score * 100).toFixed(1)}%
                </p>
                {result.suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Sugestões:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {result.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={severityColors[result.severity]}>
                {result.severity === 'low' && 'Baixo'}
                {result.severity === 'medium' && 'Médio'}
                {result.severity === 'high' && 'Alto'}
                {result.severity === 'critical' && 'Crítico'}
              </Badge>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {(result.finalScore * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  Peso: {(result.weight * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderiza scores por categoria
  const renderCategoryScores = () => {
    if (!simulationResult) return null;
    
    const categories = [
      { key: 'structural', label: 'Estrutural', icon: Settings },
      { key: 'legal', label: 'Jurídico', icon: FileText },
      { key: 'clarity', label: 'Clareza', icon: Eye },
      { key: 'abnt', label: 'ABNT', icon: Target },
      { key: 'budgetary', label: 'Orçamentário', icon: BarChart3 },
      { key: 'formal', label: 'Formal', icon: CheckCircle }
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map(category => {
          const score = simulationResult.categoryScores[category.key] || 0;
          const Icon = category.icon;
          
          return (
            <Card key={category.key}>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">{category.label}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {(score * 100).toFixed(1)}%
                    </span>
                    <Badge variant={score >= 0.8 ? 'default' : score >= 0.6 ? 'secondary' : 'destructive'}>
                      {score >= 0.8 ? 'Bom' : score >= 0.6 ? 'Regular' : 'Ruim'}
                    </Badge>
                  </div>
                  <Progress value={score * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preview de Validação</h2>
          <p className="text-gray-600">
            Visualize como suas configurações afetarão a análise de documentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={runSimulation} disabled={isRunning}>
            {isRunning ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            {isRunning ? 'Executando...' : 'Executar Simulação'}
          </Button>
        </div>
      </div>
      
      {/* Seleção de documento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documento de Teste</span>
          </CardTitle>
          <CardDescription>
            Selecione um documento de exemplo para testar suas configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availableDocuments.map(doc => (
              <Card 
                key={doc.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedDocument.id === doc.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedDocument(doc)}
              >
                <CardContent className="pt-4">
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                  <Badge variant="outline" className="mt-2">
                    {doc.type.toUpperCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Resultados da simulação */}
      {simulationResult && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="categories">Por Categoria</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          </TabsList>
          
          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Score Geral</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {(simulationResult.overallScore * 100).toFixed(1)}%
                  </div>
                  <Progress value={simulationResult.overallScore * 100} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Regras Aplicadas</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {simulationResult.appliedRules}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">regras personalizadas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Total de Verificações</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {simulationResult.totalChecks}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">verificações realizadas</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Tempo de Processamento</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600">
                    {(simulationResult.processingTime / 1000).toFixed(1)}s
                  </div>
                  <p className="text-xs text-gray-500 mt-1">tempo estimado</p>
                </CardContent>
              </Card>
            </div>
            
            {renderCategoryScores()}
          </TabsContent>
          
          {/* Tab: Por Categoria */}
          <TabsContent value="categories" className="space-y-6">
            {renderCategoryScores()}
            
            <div className="space-y-4">
              {Object.entries(simulationResult.categoryScores).map(([category, score]) => {
                const categoryResults = simulationResult.validationResults.filter(
                  r => r.category === category
                );
                
                if (categoryResults.length === 0) return null;
                
                return (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">
                        {category === 'structural' && 'Estrutural'}
                        {category === 'legal' && 'Jurídico'}
                        {category === 'clarity' && 'Clareza'}
                        {category === 'abnt' && 'ABNT'}
                        {category === 'budgetary' && 'Orçamentário'}
                        {category === 'formal' && 'Formal'}
                      </CardTitle>
                      <CardDescription>
                        Score: {(score * 100).toFixed(1)}% • {categoryResults.length} verificações
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categoryResults.map(renderValidationResult)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          {/* Tab: Detalhes */}
          <TabsContent value="details" className="space-y-4">
            <ScrollArea className="h-96">
              {simulationResult.validationResults.map(renderValidationResult)}
            </ScrollArea>
          </TabsContent>
          
          {/* Tab: Recomendações */}
          <TabsContent value="recommendations" className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Recomendações de Melhoria</AlertTitle>
              <AlertDescription>
                Com base na análise atual, sugerimos as seguintes melhorias:
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {simulationResult.recommendations.map((recommendation, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    • Ajuste os pesos dos parâmetros conforme necessário
                  </p>
                  <p className="text-sm text-gray-600">
                    • Adicione regras personalizadas para casos específicos
                  </p>
                  <p className="text-sm text-gray-600">
                    • Teste com documentos reais da sua organização
                  </p>
                  <p className="text-sm text-gray-600">
                    • Monitore os resultados e ajuste conforme feedback
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {/* Loading state */}
      {isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <div>
                <h3 className="font-medium">Executando simulação...</h3>
                <p className="text-sm text-gray-600">
                  Analisando documento com as configurações atuais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ValidationPreview;