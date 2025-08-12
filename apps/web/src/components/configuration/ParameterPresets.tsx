/**
 * Parameter Presets Component
 * 
 * Predefined configuration presets for different organization types
 * following GOV.BR design patterns
 */

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  Zap, 
  Shield, 
  Balance, 
  Lightbulb,
  Building,
  School,
  Hospital,
  Landmark,
  Factory,
  Users,
  CheckCircle,
  Star,
  Info,
  ArrowRight,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/src/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Progress } from '@/src/components/ui/progress';
import { cn } from '@/src/lib/utils';

export interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  category: 'organizational' | 'document' | 'compliance';
  organizationType: string[];
  weights: {
    structural: number;
    legal: number;
    clarity: number;
    abnt: number;
  };
  documentTypes: string[];
  customRules: Array<{
    name: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high';
    category: string;
    enabled: boolean;
  }>;
  characteristics: string[];
  benefits: string[];
  suitableFor: string[];
  estimatedScore: number;
  popularity: number;
  isRecommended?: boolean;
}

const CONFIGURATION_PRESETS: ConfigurationPreset[] = [
  {
    id: 'rigorous-compliance',
    name: 'Conformidade Rigorosa',
    description: 'Máxima conformidade legal e estrutural para documentos críticos',
    icon: Shield,
    iconColor: 'text-red-600',
    category: 'compliance',
    organizationType: ['municipal', 'estadual', 'federal', 'autarquia'],
    weights: {
      structural: 25,
      legal: 45,
      clarity: 20,
      abnt: 10
    },
    documentTypes: ['edital-concorrencia', 'contrato-fornecimento', 'ata-registro-precos'],
    customRules: [
      {
        name: 'Validação CNPJ',
        pattern: '\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}',
        severity: 'high',
        category: 'legal',
        enabled: true
      },
      {
        name: 'Referência Lei 8666',
        pattern: 'Lei\\s*n?[°ºª]?\\s*8\\.?666\\/93',
        severity: 'medium',
        category: 'legal',
        enabled: true
      }
    ],
    characteristics: [
      'Alta prioridade na conformidade legal',
      'Validação rigorosa de documentos',
      'Foco em obras e contratos de alto valor',
      'Verificação detalhada de requisitos'
    ],
    benefits: [
      'Reduz riscos jurídicos',
      'Aumenta segurança dos processos',
      'Melhora conformidade com TCU',
      'Facilita auditorias'
    ],
    suitableFor: [
      'Contratos de obras públicas',
      'Licitações de alto valor',
      'Processos com alta visibilidade',
      'Órgãos com histórico de auditoria'
    ],
    estimatedScore: 92,
    popularity: 85,
    isRecommended: true
  },
  {
    id: 'balanced-standard',
    name: 'Padrão Equilibrado',
    description: 'Configuração balanceada para uso geral em diferentes tipos de documento',
    icon: Balance,
    iconColor: 'text-blue-600',
    category: 'organizational',
    organizationType: ['municipal', 'estadual', 'fundacao', 'empresa_publica'],
    weights: {
      structural: 30,
      legal: 35,
      clarity: 25,
      abnt: 10
    },
    documentTypes: ['edital-pregao', 'contrato-fornecimento', 'termo-referencia'],
    customRules: [
      {
        name: 'Valores Monetários',
        pattern: 'R\\$\\s?\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?',
        severity: 'medium',
        category: 'formatting',
        enabled: true
      },
      {
        name: 'Prazos em Dias',
        pattern: '\\d+\\s*(?:dias?|dia)',
        severity: 'low',
        category: 'content',
        enabled: true
      }
    ],
    characteristics: [
      'Equilíbrio entre todos os aspectos',
      'Flexibilidade para diferentes documentos',
      'Configuração versátil',
      'Facilidade de manutenção'
    ],
    benefits: [
      'Adequado para múltiplos cenários',
      'Fácil de implementar',
      'Manutenção simplificada',
      'Boa performance geral'
    ],
    suitableFor: [
      'Pregões eletrônicos',
      'Fornecimento de materiais',
      'Serviços gerais',
      'Uso cotidiano'
    ],
    estimatedScore: 88,
    popularity: 95,
    isRecommended: true
  },
  {
    id: 'clarity-focused',
    name: 'Foco em Clareza',
    description: 'Prioriza compreensibilidade e comunicação clara para o público',
    icon: Lightbulb,
    iconColor: 'text-yellow-600',
    category: 'document',
    organizationType: ['municipal', 'autarquia', 'fundacao'],
    weights: {
      structural: 25,
      legal: 30,
      clarity: 35,
      abnt: 10
    },
    documentTypes: ['edital-pregao', 'termo-referencia'],
    customRules: [
      {
        name: 'Termos Técnicos',
        pattern: '\\b[A-Z]{2,}\\b',
        severity: 'low',
        category: 'clarity',
        enabled: true
      }
    ],
    characteristics: [
      'Linguagem clara e acessível',
      'Redução de jargões técnicos',
      'Comunicação eficiente',
      'Transparência aumentada'
    ],
    benefits: [
      'Maior participação de fornecedores',
      'Reduz questionamentos',
      'Melhora transparência',
      'Facilita compreensão'
    ],
    suitableFor: [
      'Editais simples',
      'Comunicações públicas',
      'Documentos educativos',
      'Processos participativos'
    ],
    estimatedScore: 85,
    popularity: 72
  },
  {
    id: 'structural-priority',
    name: 'Prioridade Estrutural',
    description: 'Enfatiza organização e completude documental',
    icon: Building,
    iconColor: 'text-green-600',
    category: 'document',
    organizationType: ['federal', 'estadual', 'autarquia'],
    weights: {
      structural: 40,
      legal: 30,
      clarity: 20,
      abnt: 10
    },
    documentTypes: ['edital-concorrencia', 'termo-referencia'],
    customRules: [
      {
        name: 'Numeração Sequencial',
        pattern: '\\d+\\.\\d+',
        severity: 'medium',
        category: 'structural',
        enabled: true
      }
    ],
    characteristics: [
      'Documentos bem estruturados',
      'Organização lógica',
      'Completude informacional',
      'Padronização rigorosa'
    ],
    benefits: [
      'Facilita navegação',
      'Reduz omissões',
      'Melhora qualidade',
      'Padroniza processos'
    ],
    suitableFor: [
      'Documentos complexos',
      'Projetos de engenharia',
      'Especificações técnicas',
      'Termos de referência'
    ],
    estimatedScore: 87,
    popularity: 68
  },
  {
    id: 'educational-institution',
    name: 'Instituições de Ensino',
    description: 'Configuração específica para universidades e escolas',
    icon: School,
    iconColor: 'text-purple-600',
    category: 'organizational',
    organizationType: ['universidade', 'escola', 'instituto'],
    weights: {
      structural: 28,
      legal: 32,
      clarity: 30,
      abnt: 10
    },
    documentTypes: ['edital-pregao', 'contrato-fornecimento'],
    customRules: [
      {
        name: 'Área Acadêmica',
        pattern: '(?:ensino|pesquisa|extensão)',
        severity: 'low',
        category: 'content',
        enabled: true
      }
    ],
    characteristics: [
      'Adaptado para ambiente acadêmico',
      'Considera especificidades educacionais',
      'Transparência acadêmica',
      'Processos democráticos'
    ],
    benefits: [
      'Alinhado com missão educacional',
      'Facilita participação acadêmica',
      'Transparência institucional',
      'Conformidade educacional'
    ],
    suitableFor: [
      'Universidades públicas',
      'Institutos federais',
      'Escolas técnicas',
      'Fundações de apoio'
    ],
    estimatedScore: 86,
    popularity: 45
  },
  {
    id: 'healthcare-focused',
    name: 'Área da Saúde',
    description: 'Otimizado para hospitais e unidades de saúde',
    icon: Hospital,
    iconColor: 'text-pink-600',
    category: 'organizational',
    organizationType: ['hospital', 'upa', 'secretaria_saude'],
    weights: {
      structural: 25,
      legal: 40,
      clarity: 25,
      abnt: 10
    },
    documentTypes: ['edital-pregao', 'contrato-fornecimento'],
    customRules: [
      {
        name: 'Registro ANVISA',
        pattern: 'ANVISA|MS\\s*\\d+',
        severity: 'high',
        category: 'legal',
        enabled: true
      }
    ],
    characteristics: [
      'Conformidade sanitária',
      'Requisitos ANVISA',
      'Urgência em saúde',
      'Qualidade assegurada'
    ],
    benefits: [
      'Garante qualidade em saúde',
      'Conformidade sanitária',
      'Reduz riscos à população',
      'Agiliza emergências'
    ],
    suitableFor: [
      'Hospitais públicos',
      'UPAs e UBSs',
      'Secretarias de saúde',
      'Equipamentos médicos'
    ],
    estimatedScore: 89,
    popularity: 38
  }
];

export const ParameterPresets: React.FC = () => {
  const { setValue, watch } = useFormContext();
  const currentWeights = watch('weights');
  
  const [selectedPreset, setSelectedPreset] = useState<ConfigurationPreset | null>(null);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filter presets by category
  const filteredPresets = categoryFilter === 'all' 
    ? CONFIGURATION_PRESETS 
    : CONFIGURATION_PRESETS.filter(preset => preset.category === categoryFilter);

  // Apply preset configuration
  const applyPreset = (preset: ConfigurationPreset, includeRules: boolean = true, includeTypes: boolean = true) => {
    // Apply weights
    setValue('weights', preset.weights, { shouldDirty: true });
    
    // Apply document types if requested
    if (includeTypes) {
      setValue('documentTypes', preset.documentTypes, { shouldDirty: true });
    }
    
    // Apply custom rules if requested
    if (includeRules) {
      const currentRules = watch('customRules') || [];
      const newRules = [...currentRules];
      
      preset.customRules.forEach(presetRule => {
        const existingRuleIndex = newRules.findIndex(rule => rule.name === presetRule.name);
        if (existingRuleIndex === -1) {
          newRules.push({
            id: `rule-preset-${Date.now()}-${Math.random()}`,
            ...presetRule,
            order: newRules.length
          });
        } else {
          // Update existing rule
          newRules[existingRuleIndex] = {
            ...newRules[existingRuleIndex],
            ...presetRule
          };
        }
      });
      
      setValue('customRules', newRules, { shouldDirty: true });
    }
    
    setIsApplyDialogOpen(false);
    setSelectedPreset(null);
  };

  // Check if current configuration matches a preset
  const getCurrentPresetMatch = () => {
    return CONFIGURATION_PRESETS.find(preset => 
      preset.weights.structural === currentWeights?.structural &&
      preset.weights.legal === currentWeights?.legal &&
      preset.weights.clarity === currentWeights?.clarity &&
      preset.weights.abnt === currentWeights?.abnt
    );
  };

  const currentMatch = getCurrentPresetMatch();

  // Get category info
  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'organizational':
        return { label: 'Tipo de Organização', color: 'bg-blue-100 text-blue-800' };
      case 'document':
        return { label: 'Tipo de Documento', color: 'bg-green-100 text-green-800' };
      case 'compliance':
        return { label: 'Conformidade', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Geral', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Export preset as JSON
  const exportPreset = (preset: ConfigurationPreset) => {
    const exportData = {
      name: preset.name,
      description: preset.description,
      weights: preset.weights,
      documentTypes: preset.documentTypes,
      customRules: preset.customRules,
      exportedAt: new Date().toISOString(),
      source: 'LicitaReview Preset'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preset-${preset.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <FormField
        control={setValue}
        name="presets"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Configurações Predefinidas
            </FormLabel>
            <FormDescription>
              Use configurações otimizadas para diferentes tipos de organização e cenários de uso.
              Você pode aplicar um preset completo ou apenas os pesos dos parâmetros.
            </FormDescription>

            <div className="space-y-6">
              {/* Current Configuration Status */}
              {currentMatch && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sua configuração atual corresponde ao preset <strong>{currentMatch.name}</strong>.
                  </AlertDescription>
                </Alert>
              )}

              {/* Category Filter */}
              <div className="flex space-x-2">
                <Button
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={categoryFilter === 'organizational' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('organizational')}
                >
                  <Building className="h-4 w-4 mr-1" />
                  Organizacional
                </Button>
                <Button
                  variant={categoryFilter === 'document' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('document')}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Documento
                </Button>
                <Button
                  variant={categoryFilter === 'compliance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter('compliance')}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Conformidade
                </Button>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPresets.map((preset) => {
                  const IconComponent = preset.icon;
                  const categoryInfo = getCategoryInfo(preset.category);
                  const isCurrentMatch = currentMatch?.id === preset.id;
                  
                  return (
                    <Card
                      key={preset.id}
                      className={cn(
                        "transition-all duration-200 hover:shadow-md cursor-pointer",
                        isCurrentMatch && "ring-2 ring-blue-500 bg-blue-50",
                        preset.isRecommended && "border-green-500"
                      )}
                      onClick={() => {
                        setSelectedPreset(preset);
                        setIsApplyDialogOpen(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "flex items-center justify-center w-12 h-12 rounded-lg",
                              preset.isRecommended ? "bg-green-100" : "bg-gray-100"
                            )}>
                              <IconComponent className={cn("h-6 w-6", preset.iconColor)} />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center">
                                {preset.name}
                                {preset.isRecommended && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Star className="h-4 w-4 ml-2 text-green-600 fill-current" />
                                    </TooltipTrigger>
                                    <TooltipContent>Recomendado</TooltipContent>
                                  </Tooltip>
                                )}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {preset.description}
                              </CardDescription>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1">
                            <Badge className={cn("text-xs", categoryInfo.color)}>
                              {categoryInfo.label}
                            </Badge>
                            {isCurrentMatch && (
                              <Badge variant="default" className="text-xs">
                                Atual
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          {/* Score and Popularity */}
                          <div className="flex justify-between items-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {preset.estimatedScore}
                              </div>
                              <div className="text-xs text-gray-500">Score Estimado</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {preset.popularity}%
                              </div>
                              <div className="text-xs text-gray-500">Popularidade</div>
                            </div>
                          </div>

                          {/* Weights Preview */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">Distribuição de Pesos:</div>
                            {Object.entries(preset.weights).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-xs capitalize text-gray-600">{key}:</span>
                                <div className="flex items-center space-x-2">
                                  <Progress value={value} className="w-12 h-1" />
                                  <span className="text-xs font-medium w-6">{value}%</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Suitable For */}
                          <div className="pt-3 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-1">Adequado para:</div>
                            <div className="flex flex-wrap gap-1">
                              {preset.suitableFor.slice(0, 2).map((use, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {use}
                                </Badge>
                              ))}
                              {preset.suitableFor.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{preset.suitableFor.length - 2} mais
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportPreset(preset);
                              }}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Exportar
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyPreset(preset, false, false);
                              }}
                            >
                              Aplicar Pesos
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Apply Preset Dialog */}
              <Dialog open={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      {selectedPreset && (
                        <>
                          <selectedPreset.icon className={cn("h-6 w-6 mr-2", selectedPreset.iconColor)} />
                          Aplicar Preset: {selectedPreset.name}
                        </>
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      Escolha quais aspectos do preset você deseja aplicar à sua configuração.
                    </DialogDescription>
                  </DialogHeader>
                  
                  {selectedPreset && (
                    <div className="space-y-6">
                      {/* Preset Details */}
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">{selectedPreset.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Score Estimado:</span>
                                <span className="ml-2 text-green-600 font-bold">{selectedPreset.estimatedScore}</span>
                              </div>
                              <div>
                                <span className="font-medium">Popularidade:</span>
                                <span className="ml-2 text-blue-600 font-semibold">{selectedPreset.popularity}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Configuration Preview */}
                      <Tabs defaultValue="weights" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="weights">Pesos</TabsTrigger>
                          <TabsTrigger value="types">Tipos de Documento</TabsTrigger>
                          <TabsTrigger value="rules">Regras</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="weights" className="space-y-3">
                          {Object.entries(selectedPreset.weights).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{key}:</span>
                              <div className="flex items-center space-x-2">
                                <Progress value={value} className="w-20 h-2" />
                                <span className="text-sm font-medium w-8">{value}%</span>
                              </div>
                            </div>
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="types">
                          <div className="space-y-2">
                            {selectedPreset.documentTypes.map((type, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm">{type}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="rules">
                          <div className="space-y-2">
                            {selectedPreset.customRules.map((rule, index) => (
                              <div key={index} className="p-2 border rounded">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{rule.name}</span>
                                  <Badge 
                                    variant={rule.severity === 'high' ? 'destructive' : 'outline'}
                                    className="text-xs"
                                  >
                                    {rule.severity}
                                  </Badge>
                                </div>
                                <code className="text-xs text-gray-600">{rule.pattern}</code>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>

                      {/* Benefits */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-900 mb-2">
                          💡 Benefícios deste preset:
                        </h4>
                        <ul className="text-sm text-green-800 space-y-1">
                          {selectedPreset.benefits.map((benefit, index) => (
                            <li key={index}>• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsApplyDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => selectedPreset && applyPreset(selectedPreset, false, false)}
                    >
                      Aplicar Apenas Pesos
                    </Button>
                    <Button
                      onClick={() => selectedPreset && applyPreset(selectedPreset, true, true)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Aplicar Configuração Completa
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Sobre os Presets</h4>
                      <p className="text-sm text-blue-800 mb-2">
                        Os presets são configurações testadas e otimizadas para diferentes cenários de uso.
                        Você pode aplicar um preset completo ou apenas os pesos dos parâmetros.
                      </p>
                      <ul className="text-xs text-blue-700 space-y-0.5">
                        <li>• <strong>Conformidade Rigorosa:</strong> Para processos críticos e auditorias</li>
                        <li>• <strong>Padrão Equilibrado:</strong> Configuração versátil para uso geral</li>
                        <li>• <strong>Foco em Clareza:</strong> Prioriza comunicação clara com o público</li>
                        <li>• <strong>Presets Organizacionais:</strong> Específicos para tipos de instituição</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
};