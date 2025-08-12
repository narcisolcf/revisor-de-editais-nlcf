/**
 * Parameter Weights Component
 * 
 * Interactive sliders for configuring analysis parameter weights
 * following GOV.BR design patterns
 */

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Scale, 
  Info, 
  RotateCcw, 
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Download,
  Upload,
  Save,
  History
} from 'lucide-react';

import { Slider } from '@/src/components/ui/slider';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/src/components/ui/tooltip';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { Progress } from '@/src/components/ui/progress';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import { PieChart as RechartsChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

export interface WeightParameter {
  id: keyof WeightValues;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  examples: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  recommendedRange: [number, number];
}

export interface WeightValues {
  structural: number;
  legal: number;
  clarity: number;
  abnt: number;
}

const WEIGHT_PARAMETERS: WeightParameter[] = [
  {
    id: 'structural',
    name: 'Análise Estrutural',
    description: 'Verifica a organização, completude e estrutura lógica do documento',
    icon: BarChart3,
    color: 'text-blue-600',
    examples: [
      'Presença de seções obrigatórias',
      'Sequência lógica de informações',
      'Integridade do documento',
      'Anexos e referências'
    ],
    importance: 'high',
    recommendedRange: [20, 40]
  },
  {
    id: 'legal',
    name: 'Conformidade Legal',
    description: 'Avalia o cumprimento de normas jurídicas e regulamentações aplicáveis',
    icon: Scale,
    color: 'text-red-600',
    examples: [
      'Conformidade com Lei 8.666/93',
      'Adequação à Lei 14.133/21',
      'Normas do TCU e órgãos de controle',
      'Regulamentações específicas'
    ],
    importance: 'critical',
    recommendedRange: [30, 50]
  },
  {
    id: 'clarity',
    name: 'Clareza e Objetividade',
    description: 'Analisa a clareza da redação e objetividade das informações',
    icon: Lightbulb,
    color: 'text-green-600',
    examples: [
      'Linguagem clara e objetiva',
      'Definições precisas',
      'Ausência de ambiguidades',
      'Compreensibilidade geral'
    ],
    importance: 'medium',
    recommendedRange: [15, 35]
  },
  {
    id: 'abnt',
    name: 'Normas ABNT',
    description: 'Verifica a conformidade com normas técnicas e padrões de formatação',
    icon: TrendingUp,
    color: 'text-purple-600',
    examples: [
      'Formatação de documentos',
      'Estrutura de numeração',
      'Referências bibliográficas',
      'Padrões técnicos específicos'
    ],
    importance: 'low',
    recommendedRange: [10, 25]
  }
];

const PRESET_CONFIGURATIONS = [
  {
    name: 'Rigoroso',
    description: 'Legal 50%, Estrutural 30%, Clareza 15%, ABNT 5%',
    weights: { structural: 30, legal: 50, clarity: 15, abnt: 5 },
    icon: '⚖️',
    suitableFor: ['Contratos de alto valor', 'Obras públicas', 'Serviços críticos']
  },
  {
    name: 'Padrão',
    description: 'Equilibrado 25% cada categoria',
    weights: { structural: 25, legal: 25, clarity: 25, abnt: 25 },
    icon: '⚖️',
    suitableFor: ['Pregões eletrônicos', 'Fornecimento de materiais', 'Uso geral']
  },
  {
    name: 'Técnico',
    description: 'Estrutural 40%, ABNT 30%, Legal 20%, Clareza 10%',
    weights: { structural: 40, legal: 20, clarity: 10, abnt: 30 },
    icon: '🔧',
    suitableFor: ['Termos de referência', 'Editais técnicos', 'Projetos de engenharia']
  },
  {
    name: 'Personalizado',
    description: 'Configuração definida pelo usuário',
    weights: { structural: 25, legal: 35, clarity: 25, abnt: 15 },
    icon: '✨',
    suitableFor: ['Configuração específica', 'Necessidades customizadas']
  }
];

export const ParameterWeights: React.FC = () => {
  const { control, watch, setValue } = useFormContext();
  const weights = watch('weights') || { structural: 25, legal: 35, clarity: 25, abnt: 15 };
  
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [lastAdjustedParam, setLastAdjustedParam] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Personalizado');
  const [showVisualization, setShowVisualization] = useState(true);
  const [configHistory, setConfigHistory] = useState<WeightValues[]>([]);
  const [exampleScore, setExampleScore] = useState({ structural: 85, legal: 78, clarity: 92, abnt: 88 });

  // Calculate total weight
  const totalWeight = Object.values(weights).reduce((sum: number, weight: number) => sum + weight, 0);
  const isValid = totalWeight === 100;

  // Auto-adjust weights to maintain 100% total
  const handleWeightChange = (paramId: keyof WeightValues, newValue: number) => {
    setIsAdjusting(true);
    setLastAdjustedParam(paramId);

    const currentValue = weights[paramId];
    const difference = newValue - currentValue;
    
    // Calculate adjustment needed for other parameters
    const otherParams = Object.keys(weights).filter(key => key !== paramId) as (keyof WeightValues)[];
    const otherTotal = otherParams.reduce((sum, key) => sum + weights[key], 0);
    
    if (otherTotal === 0) {
      // If other parameters are 0, set them equally
      const equalWeight = (100 - newValue) / otherParams.length;
      const newWeights = {
        ...weights,
        [paramId]: newValue
      };
      
      otherParams.forEach(param => {
        newWeights[param] = Math.round(equalWeight);
      });
      
      setValue('weights', newWeights, { shouldDirty: true });
    } else {
      // Proportionally adjust other parameters
      const newWeights = { ...weights, [paramId]: newValue };
      const adjustmentNeeded = 100 - newValue;
      
      otherParams.forEach(param => {
        const proportion = weights[param] / otherTotal;
        newWeights[param] = Math.round(adjustmentNeeded * proportion);
      });
      
      // Handle rounding errors
      const finalTotal = Object.values(newWeights).reduce((sum: number, w: number) => sum + w, 0);
      if (finalTotal !== 100) {
        const adjustment = 100 - finalTotal;
        const firstOtherParam = otherParams[0];
        newWeights[firstOtherParam] += adjustment;
      }
      
      setValue('weights', newWeights, { shouldDirty: true });
    }
    
    setTimeout(() => setIsAdjusting(false), 500);
  };

  // Apply preset configuration
  const applyPreset = (preset: typeof PRESET_CONFIGURATIONS[0]) => {
    setConfigHistory(prev => [weights, ...prev.slice(0, 9)]); // Keep last 10 configs
    setValue('weights', preset.weights, { shouldDirty: true });
    setSelectedPreset(preset.name);
    setLastAdjustedParam(null);
    autoSave(preset.weights);
  };

  // Reset to recommended defaults
  const resetToDefaults = () => {
    const defaultWeights = { structural: 25, legal: 35, clarity: 25, abnt: 15 };
    setConfigHistory(prev => [weights, ...prev.slice(0, 9)]);
    setValue('weights', defaultWeights, { shouldDirty: true });
    setSelectedPreset('Personalizado');
    setLastAdjustedParam(null);
    autoSave(defaultWeights);
  };

  // Auto-save configuration
  const autoSave = (weightsToSave: WeightValues) => {
    try {
      localStorage.setItem('parameter_weights', JSON.stringify(weightsToSave));
      localStorage.setItem('parameter_weights_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to auto-save configuration:', error);
    }
  };

  // Export configuration
  const exportConfig = () => {
    const config = {
      weights,
      preset: selectedPreset,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parameter-weights-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import configuration
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (config.weights && typeof config.weights === 'object') {
          setConfigHistory(prev => [weights, ...prev.slice(0, 9)]);
          setValue('weights', config.weights, { shouldDirty: true });
          setSelectedPreset(config.preset || 'Personalizado');
          autoSave(config.weights);
        }
      } catch (error) {
        alert('Erro ao importar configuração. Verifique se o arquivo é válido.');
      }
    };
    reader.readAsText(file);
  };

  // Calculate simulated impact on example scores
  const calculateSimulatedScore = () => {
    const weightedScore = (
      (exampleScore.structural * weights.structural / 100) +
      (exampleScore.legal * weights.legal / 100) +
      (exampleScore.clarity * weights.clarity / 100) +
      (exampleScore.abnt * weights.abnt / 100)
    );
    return Math.round(weightedScore * 100) / 100;
  };

  // Prepare data for pie chart
  const pieChartData = WEIGHT_PARAMETERS.map(param => ({
    name: param.name,
    value: weights[param.id],
    color: param.color.replace('text-', '#').replace('-600', ''),
    fill: param.color.includes('blue') ? '#2563eb' :
          param.color.includes('red') ? '#dc2626' :
          param.color.includes('green') ? '#16a34a' :
          param.color.includes('purple') ? '#9333ea' : '#6b7280'
  }));

  // Load saved configuration on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('parameter_weights');
      if (saved) {
        const savedWeights = JSON.parse(saved);
        setValue('weights', savedWeights, { shouldDirty: false });
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    }
  }, [setValue]);

  // Auto-save on weight changes
  useEffect(() => {
    if (Object.values(weights).some(w => w > 0)) {
      autoSave(weights);
    }
  }, [weights]);

  // Get parameter info
  const getParameterInfo = (paramId: keyof WeightValues) => {
    return WEIGHT_PARAMETERS.find(p => p.id === paramId)!;
  };

  // Get weight status
  const getWeightStatus = (paramId: keyof WeightValues, weight: number) => {
    const param = getParameterInfo(paramId);
    const [min, max] = param.recommendedRange;
    
    if (weight < min) return { status: 'low', message: 'Abaixo do recomendado' };
    if (weight > max) return { status: 'high', message: 'Acima do recomendado' };
    return { status: 'good', message: 'Dentro da faixa recomendada' };
  };

  return (
    <TooltipProvider>
      <FormField
        control={control}
        name="weights"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Configuração de Pesos dos Parâmetros
            </FormLabel>
            <FormDescription>
              Defina a importância relativa de cada categoria de análise. 
              Os pesos devem somar exatamente 100%.
            </FormDescription>

            <div className="space-y-6">
              {/* Total Weight Indicator */}
              <Card className={cn(
                "border-2",
                isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              )}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total dos Pesos</span>
                    <span className={cn(
                      "text-2xl font-bold",
                      isValid ? "text-green-700" : "text-red-700"
                    )}>
                      {totalWeight}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(totalWeight, 100)} 
                    className={cn(
                      "h-2",
                      totalWeight > 100 ? "bg-red-100" : "bg-gray-100"
                    )}
                  />
                  <div className="flex items-center mt-2">
                    {isValid ? (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Configuração válida</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {totalWeight > 100 
                            ? `Excede em ${totalWeight - 100}%` 
                            : `Faltam ${100 - totalWeight}%`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weight Sliders */}
              <div className="space-y-6">
                {WEIGHT_PARAMETERS.map((param) => {
                  const weight = weights[param.id];
                  const status = getWeightStatus(param.id, weight);
                  const IconComponent = param.icon;
                  const isRecent = lastAdjustedParam === param.id;

                  return (
                    <Card key={param.id} className={cn(
                      "transition-all duration-300",
                      isRecent && isAdjusting ? "ring-2 ring-blue-500 shadow-md" : ""
                    )}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-lg",
                              param.importance === 'critical' ? "bg-red-100" :
                              param.importance === 'high' ? "bg-orange-100" :
                              param.importance === 'medium' ? "bg-yellow-100" : "bg-gray-100"
                            )}>
                              <IconComponent className={cn("h-5 w-5", param.color)} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{param.name}</CardTitle>
                              <CardDescription className="text-sm">
                                {param.description}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              param.importance === 'critical' ? 'destructive' :
                              param.importance === 'high' ? 'default' :
                              param.importance === 'medium' ? 'secondary' : 'outline'
                            }>
                              {param.importance === 'critical' ? 'Crítico' :
                               param.importance === 'high' ? 'Alto' :
                               param.importance === 'medium' ? 'Médio' : 'Baixo'}
                            </Badge>
                            
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-medium">Exemplos de verificação:</p>
                                  <ul className="text-xs space-y-1">
                                    {param.examples.map((example, index) => (
                                      <li key={index}>• {example}</li>
                                    ))}
                                  </ul>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Faixa recomendada: {param.recommendedRange[0]}% - {param.recommendedRange[1]}%
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-3xl font-bold text-gray-900">
                              {weight}%
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge variant={
                                status.status === 'good' ? 'default' :
                                status.status === 'low' ? 'secondary' : 'outline'
                              } className="text-xs">
                                {status.message}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Slider
                              value={[weight]}
                              onValueChange={([value]) => handleWeightChange(param.id, value)}
                              max={100}
                              min={0}
                              step={1}
                              className="w-full"
                            />
                            
                            {/* Range indicators */}
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>0%</span>
                              <span className="text-gray-400">
                                Recomendado: {param.recommendedRange[0]}%-{param.recommendedRange[1]}%
                              </span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Visualization Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2 text-blue-500" />
                      Visualização dos Pesos
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowVisualization(!showVisualization)}
                    >
                      {showVisualization ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  <CardDescription>
                    Representação visual da distribuição dos pesos e simulação de impacto
                  </CardDescription>
                </CardHeader>
                {showVisualization && (
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Pie Chart */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-gray-700">Distribuição Atual</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value) => [`${value}%`, 'Peso']}
                              />
                              <Legend />
                            </RechartsChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Impact Simulation */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm text-gray-700">Simulação de Impacto</h4>
                        <Card className="border-dashed border-2">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">
                                  {calculateSimulatedScore()}
                                </div>
                                <div className="text-sm text-gray-500">Score Final Simulado</div>
                              </div>
                              
                              <div className="space-y-2">
                                {WEIGHT_PARAMETERS.map(param => {
                                  const score = exampleScore[param.id];
                                  const contribution = (score * weights[param.id] / 100);
                                  return (
                                    <div key={param.id} className="flex justify-between items-center text-sm">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pieChartData.find(p => p.name === param.name)?.fill }} />
                                        <span>{param.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500">{score} × {weights[param.id]}%</span>
                                        <span className="font-medium">{contribution.toFixed(1)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Comparison with Presets */}
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 mb-2">Comparação com Presets</h5>
                          <div className="space-y-2">
                            {PRESET_CONFIGURATIONS.slice(0, 3).map(preset => {
                              const presetScore = (
                                (exampleScore.structural * preset.weights.structural / 100) +
                                (exampleScore.legal * preset.weights.legal / 100) +
                                (exampleScore.clarity * preset.weights.clarity / 100) +
                                (exampleScore.abnt * preset.weights.abnt / 100)
                              );
                              const difference = calculateSimulatedScore() - presetScore;
                              
                              return (
                                <div key={preset.name} className="flex justify-between items-center text-sm">
                                  <span>{preset.name}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500">{presetScore.toFixed(1)}</span>
                                    <span className={cn(
                                      "font-medium",
                                      difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : "text-gray-600"
                                    )}>
                                      {difference > 0 ? '+' : ''}{difference.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Preset Configurations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    Configurações Predefinidas
                  </CardTitle>
                  <CardDescription>
                    Use configurações otimizadas para diferentes tipos de organização e documentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRESET_CONFIGURATIONS.map((preset, index) => (
                      <Card key={index} className="border-dashed border-2 hover:border-solid hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{preset.icon}</span>
                              <div>
                                <h4 className="font-medium">{preset.name}</h4>
                                <p className="text-xs text-gray-600">{preset.description}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => applyPreset(preset)}
                            >
                              Aplicar
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {Object.entries(preset.weights).map(([key, value]) => {
                              const param = getParameterInfo(key as keyof WeightValues);
                              return (
                                <div key={key} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{param.name}</span>
                                  <span className="font-medium">{value}%</span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">Adequado para:</p>
                            <div className="flex flex-wrap gap-1">
                              {preset.suitableFor.map((use, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {use}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetToDefaults}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar Padrão
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={exportConfig}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                      
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".json"
                          onChange={importConfig}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Button
                          type="button"
                          variant="outline"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importar
                        </Button>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => autoSave(weights)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Configuration History */}
              {configHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2 text-gray-500" />
                      Histórico de Mudanças
                    </CardTitle>
                    <CardDescription>
                      Últimas configurações utilizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {configHistory.slice(0, 5).map((config: WeightValues, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500">#{index + 1}</span>
                            <div className="text-sm space-x-2">
                              <span>Est: {config.structural}%</span>
                              <span>Leg: {config.legal}%</span>
                              <span>Clar: {config.clarity}%</span>
                              <span>ABNT: {config.abnt}%</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setValue('weights', config, { shouldDirty: true });
                              setSelectedPreset('Personalizado');
                            }}
                          >
                            Restaurar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Validation Alert */}
              {!isValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A soma dos pesos deve ser exatamente 100%. Ajuste os valores acima para continuar.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
};