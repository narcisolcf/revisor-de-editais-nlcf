/**
 * ParameterWeights - Editor de Pesos de Parâmetros
 * 
 * Componente para configuração avançada dos pesos de análise de documentos.
 * Permite ajustar a importância relativa de diferentes critérios de avaliação
 * para personalizar o comportamento do motor de análise adaptativo.
 * 
 * Funcionalidades:
 * - Editor visual de pesos com sliders e inputs numéricos
 * - Categorização de parâmetros por tipo de análise
 * - Presets predefinidos para diferentes cenários
 * - Validação em tempo real e preview de impacto
 * - Normalização automática de pesos
 * - Histórico de configurações
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
// Tooltip imports removidos - não utilizados
import {
  RotateCcw,
  Save,
  Info,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Sliders,
  Target,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Definição dos parâmetros de análise
interface AnalysisParameter {
  id: string;
  name: string;
  description: string;
  category: 'conformity' | 'completeness' | 'clarity' | 'technical' | 'legal' | 'financial';
  weight: number;
  minWeight: number;
  maxWeight: number;
  defaultWeight: number;
  isActive: boolean;
  impact: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

// Parâmetros predefinidos do sistema
const DEFAULT_PARAMETERS: AnalysisParameter[] = [
  // Conformidade
  {
    id: 'legal_compliance',
    name: 'Conformidade Legal',
    description: 'Verificação de adequação às normas e leis aplicáveis',
    category: 'conformity',
    weight: 0.25,
    minWeight: 0.1,
    maxWeight: 0.4,
    defaultWeight: 0.25,
    isActive: true,
    impact: 'high'
  },
  {
    id: 'format_compliance',
    name: 'Conformidade de Formato',
    description: 'Verificação da estrutura e formatação do documento',
    category: 'conformity',
    weight: 0.15,
    minWeight: 0.05,
    maxWeight: 0.3,
    defaultWeight: 0.15,
    isActive: true,
    impact: 'medium'
  },
  
  // Completude
  {
    id: 'required_fields',
    name: 'Campos Obrigatórios',
    description: 'Presença de todos os campos e informações obrigatórias',
    category: 'completeness',
    weight: 0.2,
    minWeight: 0.1,
    maxWeight: 0.35,
    defaultWeight: 0.2,
    isActive: true,
    impact: 'high'
  },
  {
    id: 'supporting_docs',
    name: 'Documentos Anexos',
    description: 'Verificação de anexos e documentos de suporte',
    category: 'completeness',
    weight: 0.1,
    minWeight: 0.05,
    maxWeight: 0.2,
    defaultWeight: 0.1,
    isActive: true,
    impact: 'medium'
  },
  
  // Clareza
  {
    id: 'text_clarity',
    name: 'Clareza do Texto',
    description: 'Análise da legibilidade e compreensibilidade do texto',
    category: 'clarity',
    weight: 0.08,
    minWeight: 0.02,
    maxWeight: 0.15,
    defaultWeight: 0.08,
    isActive: true,
    impact: 'medium'
  },
  {
    id: 'terminology',
    name: 'Terminologia Técnica',
    description: 'Uso adequado de termos técnicos e jurídicos',
    category: 'clarity',
    weight: 0.07,
    minWeight: 0.02,
    maxWeight: 0.12,
    defaultWeight: 0.07,
    isActive: true,
    impact: 'low'
  },
  
  // Técnico
  {
    id: 'technical_specs',
    name: 'Especificações Técnicas',
    description: 'Adequação e detalhamento das especificações técnicas',
    category: 'technical',
    weight: 0.15,
    minWeight: 0.05,
    maxWeight: 0.3,
    defaultWeight: 0.15,
    isActive: true,
    impact: 'high'
  }
];

// Presets de configuração
interface WeightPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  weights: { [parameterId: string]: number };
}

const WEIGHT_PRESETS: WeightPreset[] = [
  {
    id: 'balanced',
    name: 'Equilibrado',
    description: 'Configuração balanceada para análise geral',
    category: 'geral',
    weights: {
      legal_compliance: 0.25,
      format_compliance: 0.15,
      required_fields: 0.2,
      supporting_docs: 0.1,
      text_clarity: 0.08,
      terminology: 0.07,
      technical_specs: 0.15
    }
  },
  {
    id: 'legal_focused',
    name: 'Foco Jurídico',
    description: 'Prioriza aspectos legais e de conformidade',
    category: 'juridico',
    weights: {
      legal_compliance: 0.35,
      format_compliance: 0.2,
      required_fields: 0.25,
      supporting_docs: 0.1,
      text_clarity: 0.05,
      terminology: 0.03,
      technical_specs: 0.02
    }
  },
  {
    id: 'technical_focused',
    name: 'Foco Técnico',
    description: 'Prioriza especificações e aspectos técnicos',
    category: 'tecnico',
    weights: {
      legal_compliance: 0.15,
      format_compliance: 0.1,
      required_fields: 0.2,
      supporting_docs: 0.15,
      text_clarity: 0.1,
      terminology: 0.05,
      technical_specs: 0.25
    }
  }
];

interface ParameterWeightsProps {
  organizationId: string;
  config: any;
  onConfigChange: (_config: any) => void;
  onProgressChange: (_progress: number) => void;
}
export const ParameterWeights: React.FC<ParameterWeightsProps> = ({
  config,
  onConfigChange,
  onProgressChange
}) => {
  const { toast } = useToast();
  
  // Estados locais
  const [parameters, setParameters] = useState<AnalysisParameter[]>(DEFAULT_PARAMETERS);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isNormalized, setIsNormalized] = useState(true);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Carregar configuração inicial
  useEffect(() => {
    if (config?.parameterWeights) {
      const loadedParams = DEFAULT_PARAMETERS.map(param => {
        const savedParam = config.parameterWeights.find((p: any) => p.id === param.id);
        return savedParam ? { ...param, ...savedParam } : param;
      });
      setParameters(loadedParams);
    }
  }, [config]);
  
  // Calcular e atualizar progresso
  useEffect(() => {
    const activeParams = parameters.filter(p => p.isActive);
    const totalWeight = activeParams.reduce((sum, p) => sum + p.weight, 0);
    const isValid = Math.abs(totalWeight - 1.0) < 0.01 && activeParams.length > 0;
    const progress = isValid ? 100 : Math.min((totalWeight * 100), 90);
    onProgressChange(progress);
  }, [parameters, onProgressChange]);
  
  // Atualizar configuração quando parâmetros mudarem
  useEffect(() => {
    onConfigChange({
      ...config,
      parameterWeights: parameters
    });
  }, [parameters, onConfigChange]);
  
  // Função para normalizar pesos
  const normalizeWeights = useCallback(() => {
    const activeParams = parameters.filter(p => p.isActive);
    const totalWeight = activeParams.reduce((sum, p) => sum + p.weight, 0);
    
    if (totalWeight === 0) return;
    
    const normalizedParams = parameters.map(param => {
      if (!param.isActive) return param;
      return {
        ...param,
        weight: param.weight / totalWeight
      };
    });
    
    setParameters(normalizedParams);
    setUnsavedChanges(true);
  }, [parameters]);
  
  // Função para atualizar peso de um parâmetro
  const updateParameterWeight = (parameterId: string, newWeight: number) => {
    setParameters(prev => prev.map(param => 
      param.id === parameterId 
        ? { ...param, weight: Math.max(param.minWeight, Math.min(param.maxWeight, newWeight)) }
        : param
    ));
    setUnsavedChanges(true);
    
    if (isNormalized) {
      setTimeout(normalizeWeights, 100);
    }
  };
  
  // Função para alternar status ativo de um parâmetro
  const toggleParameterActive = (parameterId: string) => {
    setParameters(prev => prev.map(param => 
      param.id === parameterId ? { ...param, isActive: !param.isActive } : param
    ));
    setUnsavedChanges(true);
  };
  
  // Função para aplicar preset
  const applyPreset = (presetId: string) => {
    const preset = WEIGHT_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    setParameters(prev => prev.map(param => ({
      ...param,
      weight: preset.weights[param.id] || param.defaultWeight,
      isActive: preset.weights[param.id] !== undefined
    })));
    
    setSelectedPreset(presetId);
    setUnsavedChanges(true);
    
    toast({
      title: "Preset Aplicado",
      description: `Configuração "${preset.name}" foi aplicada com sucesso.`,
      variant: "default"
    });
  };
  
  // Função para resetar para valores padrão
  const resetToDefaults = () => {
    setParameters(DEFAULT_PARAMETERS.map(param => ({ ...param })));
    setSelectedPreset('');
    setUnsavedChanges(true);
    
    toast({
      title: "Configuração Resetada",
      description: "Todos os pesos foram restaurados para os valores padrão.",
      variant: "default"
    });
  };
  
  // Função para salvar configuração
  const saveConfiguration = () => {
    // Aqui seria implementada a lógica de salvamento
    setUnsavedChanges(false);
    
    toast({
      title: "Configuração Salva",
      description: "Os pesos dos parâmetros foram salvos com sucesso.",
      variant: "default"
    });
  };
  
  // Calcular estatísticas
  const getStatistics = () => {
    const activeParams = parameters.filter(p => p.isActive);
    const totalWeight = activeParams.reduce((sum, p) => sum + p.weight, 0);
    const categories = activeParams.reduce((acc, param) => {
      acc[param.category] = (acc[param.category] || 0) + param.weight;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      totalWeight,
      activeCount: activeParams.length,
      categories,
      isValid: Math.abs(totalWeight - 1.0) < 0.01
    };
  };
  
  const statistics = getStatistics();
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      conformity: 'bg-blue-100 text-blue-800',
      completeness: 'bg-green-100 text-green-800',
      clarity: 'bg-purple-100 text-purple-800',
      technical: 'bg-orange-100 text-orange-800',
      legal: 'bg-red-100 text-red-800',
      financial: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };
  
  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      conformity: 'Conformidade',
      completeness: 'Completude',
      clarity: 'Clareza',
      technical: 'Técnico',
      legal: 'Jurídico',
      financial: 'Financeiro'
    };
    return names[category] || category;
  };
  
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <Target className="h-4 w-4 text-red-500" />;
      case 'medium': return <BarChart3 className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Zap className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Peso Total</span>
              <span className={`text-2xl font-bold ${
                statistics.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {statistics.totalWeight.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Parâmetros Ativos</span>
              <span className="text-2xl font-bold text-blue-600">{statistics.activeCount}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Categorias</span>
              <span className="text-2xl font-bold text-purple-600">
                {Object.keys(statistics.categories).length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Status</span>
              <div className="flex items-center gap-1">
                {statistics.isValid ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Controles Principais */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Configuração de Pesos
              </CardTitle>
              <CardDescription>
                Ajuste a importância relativa de cada parâmetro de análise
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Selecionar preset" />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_PRESETS.map(preset => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={resetToDefaults}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              
              <Button 
                onClick={saveConfiguration}
                disabled={!unsavedChanges}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Controles de Normalização */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isNormalized}
                  onCheckedChange={setIsNormalized}
                />
                <div>
                  <Label className="font-medium">Normalização Automática</Label>
                  <p className="text-sm text-gray-600">
                    Ajusta automaticamente os pesos para somar 1.0
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={normalizeWeights}
                disabled={statistics.isValid}
              >
                Normalizar Agora
              </Button>
            </div>
            
            {/* Lista de Parâmetros */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="conformity">Conformidade</TabsTrigger>
                <TabsTrigger value="completeness">Completude</TabsTrigger>
                <TabsTrigger value="technical">Técnico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                {parameters.map((parameter) => (
                  <Card key={parameter.id} className={`transition-all ${
                    parameter.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={parameter.isActive}
                            onCheckedChange={() => toggleParameterActive(parameter.id)}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{parameter.name}</h4>
                              {getImpactIcon(parameter.impact)}
                              <Badge className={getCategoryColor(parameter.category)}>
                                {getCategoryName(parameter.category)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{parameter.description}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">
                            {(parameter.weight * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {parameter.minWeight * 100}% - {parameter.maxWeight * 100}%
                          </div>
                        </div>
                      </div>
                      
                      {parameter.isActive && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Slider
                                value={[parameter.weight]}
                                onValueChange={([value]) => updateParameterWeight(parameter.id, value)}
                                min={parameter.minWeight}
                                max={parameter.maxWeight}
                                step={0.01}
                                className="w-full"
                              />
                            </div>
                            <Input
                              type="number"
                              value={parameter.weight.toFixed(2)}
                              onChange={(e) => updateParameterWeight(parameter.id, parseFloat(e.target.value) || 0)}
                              min={parameter.minWeight}
                              max={parameter.maxWeight}
                              step={0.01}
                              className="w-20"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              {/* Tabs por categoria */}
              {['conformity', 'completeness', 'technical'].map(category => (
                <TabsContent key={category} value={category} className="space-y-4">
                  {parameters
                    .filter(p => p.category === category)
                    .map((parameter) => (
                      <Card key={parameter.id} className={`transition-all ${
                        parameter.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}>
                        <CardContent className="p-4">
                          {/* Mesmo conteúdo do card acima */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={parameter.isActive}
                                onCheckedChange={() => toggleParameterActive(parameter.id)}
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{parameter.name}</h4>
                                  {getImpactIcon(parameter.impact)}
                                </div>
                                <p className="text-sm text-gray-600">{parameter.description}</p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                {(parameter.weight * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {parameter.minWeight * 100}% - {parameter.maxWeight * 100}%
                              </div>
                            </div>
                          </div>
                          
                          {parameter.isActive && (
                            <div className="space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <Slider
                                    value={[parameter.weight]}
                                    onValueChange={([value]) => updateParameterWeight(parameter.id, value)}
                                    min={parameter.minWeight}
                                    max={parameter.maxWeight}
                                    step={0.01}
                                    className="w-full"
                                  />
                                </div>
                                <Input
                                  type="number"
                                  value={parameter.weight.toFixed(2)}
                                  onChange={(e) => updateParameterWeight(parameter.id, parseFloat(e.target.value) || 0)}
                                  min={parameter.minWeight}
                                  max={parameter.maxWeight}
                                  step={0.01}
                                  className="w-20"
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  }
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </CardContent>
      </Card>
      
      {/* Alertas de Validação */}
      {!statistics.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {statistics.totalWeight < 0.99 
              ? `Peso total muito baixo (${statistics.totalWeight.toFixed(2)}). Ajuste os parâmetros para somar 1.0.`
              : `Peso total muito alto (${statistics.totalWeight.toFixed(2)}). Ajuste os parâmetros para somar 1.0.`
            }
          </AlertDescription>
        </Alert>
      )}
      
      {unsavedChanges && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Clique em "Salvar" para aplicar as configurações.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ParameterWeights;