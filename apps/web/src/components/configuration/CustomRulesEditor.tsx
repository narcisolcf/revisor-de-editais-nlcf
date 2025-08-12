/**
 * Custom Rules Editor Component
 * 
 * Advanced editor for creating and managing custom validation rules
 * with drag & drop reordering and regex pattern support
 */

import React, { useState, useCallback } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  GripVertical,
  Code,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Copy,
  Search,
  Filter,
  Eye,
  EyeOff,
  BookOpen,
  Lightbulb
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';
import { Switch } from '@/src/components/ui/switch';
import { Label } from '@/src/components/ui/label';
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
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/src/components/ui/collapsible';
import { cn } from '@/src/lib/utils';

export interface CustomRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  enabled: boolean;
  order: number;
  testCases?: Array<{
    input: string;
    shouldMatch: boolean;
    description: string;
  }>;
  createdAt?: Date;
  lastModified?: Date;
}

const RULE_CATEGORIES = [
  { value: 'structural', label: 'Estrutural', color: 'bg-blue-100 text-blue-800' },
  { value: 'legal', label: 'Legal', color: 'bg-red-100 text-red-800' },
  { value: 'clarity', label: 'Clareza', color: 'bg-green-100 text-green-800' },
  { value: 'formatting', label: 'Formatação', color: 'bg-purple-100 text-purple-800' },
  { value: 'content', label: 'Conteúdo', color: 'bg-orange-100 text-orange-800' },
  { value: 'custom', label: 'Personalizada', color: 'bg-gray-100 text-gray-800' }
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Baixa', color: 'bg-yellow-100 text-yellow-800', description: 'Sugestão de melhoria' },
  { value: 'medium', label: 'Média', color: 'bg-orange-100 text-orange-800', description: 'Requer atenção' },
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800', description: 'Deve ser corrigida' }
];

const RULE_TEMPLATES = [
  {
    name: 'Valor Monetário',
    description: 'Valida formato de valores monetários em reais',
    pattern: 'R\\$\\s?\\d{1,3}(?:\\.\\d{3})*(?:,\\d{2})?',
    category: 'formatting',
    severity: 'medium' as const,
    testCases: [
      { input: 'R$ 1.500,00', shouldMatch: true, description: 'Formato padrão' },
      { input: 'R$1500,00', shouldMatch: true, description: 'Sem espaço' },
      { input: '1500 reais', shouldMatch: false, description: 'Formato incorreto' }
    ]
  },
  {
    name: 'CNPJ',
    description: 'Valida formato de CNPJ',
    pattern: '\\d{2}\\.\\d{3}\\.\\d{3}\\/\\d{4}-\\d{2}',
    category: 'structural',
    severity: 'high' as const,
    testCases: [
      { input: '12.345.678/0001-90', shouldMatch: true, description: 'CNPJ válido' },
      { input: '12345678000190', shouldMatch: false, description: 'Sem formatação' }
    ]
  },
  {
    name: 'Prazo em Dias',
    description: 'Identifica menção a prazos em dias',
    pattern: '\\d+\\s*(?:dias?|dia)',
    category: 'content',
    severity: 'low' as const,
    testCases: [
      { input: '30 dias', shouldMatch: true, description: 'Prazo padrão' },
      { input: '1 dia', shouldMatch: true, description: 'Um dia' },
      { input: 'alguns dias', shouldMatch: false, description: 'Prazo indefinido' }
    ]
  },
  {
    name: 'Lei 8666/93',
    description: 'Referência à Lei de Licitações',
    pattern: 'Lei\\s*n?[°ºª]?\\s*8\\.?666\\/93',
    category: 'legal',
    severity: 'medium' as const,
    testCases: [
      { input: 'Lei nº 8.666/93', shouldMatch: true, description: 'Formato completo' },
      { input: 'Lei 8666/93', shouldMatch: true, description: 'Formato simples' }
    ]
  }
];

export const CustomRulesEditor: React.FC = () => {
  const { control } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'customRules'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showDisabled, setShowDisabled] = useState(false);
  const [testingRule, setTestingRule] = useState<CustomRule | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<{ matches: boolean; error?: string } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // New rule form state
  const [newRule, setNewRule] = useState<Partial<CustomRule>>({
    name: '',
    description: '',
    pattern: '',
    severity: 'medium',
    category: 'custom',
    enabled: true,
    testCases: []
  });

  // Filter rules
  const filteredRules = fields.filter((rule: any) => {
    const matchesSearch = rule.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || rule.category === filterCategory;
    const matchesSeverity = filterSeverity === 'all' || rule.severity === filterSeverity;
    const matchesEnabled = showDisabled || rule.enabled;
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesEnabled;
  });

  // Test regex pattern
  const testPattern = useCallback((pattern: string, input: string) => {
    try {
      const regex = new RegExp(pattern, 'gi');
      const matches = regex.test(input);
      return { matches, error: undefined };
    } catch (error) {
      return { matches: false, error: (error as Error).message };
    }
  }, []);

  // Handle pattern testing
  const handleTestPattern = () => {
    if (!testingRule || !testInput.trim()) return;
    
    const result = testPattern(testingRule.pattern, testInput);
    setTestResult(result);
  };

  // Add new rule
  const handleAddRule = () => {
    if (!newRule.name?.trim() || !newRule.pattern?.trim()) return;
    
    const rule: CustomRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name.trim(),
      description: newRule.description?.trim() || '',
      pattern: newRule.pattern.trim(),
      severity: newRule.severity as CustomRule['severity'],
      category: newRule.category as string,
      enabled: newRule.enabled || true,
      order: fields.length,
      testCases: newRule.testCases || [],
      createdAt: new Date(),
      lastModified: new Date()
    };
    
    append(rule);
    
    // Reset form
    setNewRule({
      name: '',
      description: '',
      pattern: '',
      severity: 'medium',
      category: 'custom',
      enabled: true,
      testCases: []
    });
    setIsAddDialogOpen(false);
  };

  // Apply template
  const applyTemplate = (template: typeof RULE_TEMPLATES[0]) => {
    setNewRule({
      name: template.name,
      description: template.description,
      pattern: template.pattern,
      severity: template.severity,
      category: template.category,
      enabled: true,
      testCases: template.testCases
    });
  };

  // Edit rule
  const handleEditRule = (index: number, rule: CustomRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setIsAddDialogOpen(true);
  };

  // Update rule
  const handleUpdateRule = () => {
    if (!editingRule || !newRule.name?.trim() || !newRule.pattern?.trim()) return;
    
    const ruleIndex = fields.findIndex((field: any) => field.id === editingRule.id);
    if (ruleIndex === -1) return;
    
    const updatedRule = {
      ...editingRule,
      ...newRule,
      name: newRule.name!.trim(),
      pattern: newRule.pattern!.trim(),
      lastModified: new Date()
    };
    
    // Update using setValue or similar React Hook Form method
    // This would need to be implemented based on your form structure
    
    setEditingRule(null);
    setNewRule({
      name: '',
      description: '',
      pattern: '',
      severity: 'medium',
      category: 'custom',
      enabled: true,
      testCases: []
    });
    setIsAddDialogOpen(false);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    move(draggedIndex, dropIndex);
    setDraggedIndex(null);
  };

  const getCategoryInfo = (category: string) => {
    return RULE_CATEGORIES.find(cat => cat.value === category) || RULE_CATEGORIES[5];
  };

  const getSeverityInfo = (severity: string) => {
    return SEVERITY_LEVELS.find(sev => sev.value === severity) || SEVERITY_LEVELS[1];
  };

  return (
    <TooltipProvider>
      <FormField
        control={control}
        name="customRules"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Regras de Validação Personalizadas
            </FormLabel>
            <FormDescription>
              Crie regras específicas para sua organização usando expressões regulares.
              As regras são aplicadas na ordem definida abaixo.
            </FormDescription>

            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar regras..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {RULE_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {SEVERITY_LEVELS.map(severity => (
                      <SelectItem key={severity.value} value={severity.value}>
                        {severity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showDisabled}
                    onCheckedChange={setShowDisabled}
                  />
                  <Label className="text-sm">Mostrar desabilitadas</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {filteredRules.length} de {fields.length} regra(s)
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      onClick={() => {
                        setEditingRule(null);
                        setNewRule({
                          name: '',
                          description: '',
                          pattern: '',
                          severity: 'medium',
                          category: 'custom',
                          enabled: true,
                          testCases: []
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Regra
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRule ? 'Editar Regra' : 'Adicionar Nova Regra'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingRule 
                          ? 'Modifique a regra de validação personalizada.'
                          : 'Crie uma nova regra de validação usando expressões regulares.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      {/* Rule Templates */}
                      {!editingRule && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <BookOpen className="h-5 w-5 mr-2" />
                              Templates de Regras
                            </CardTitle>
                            <CardDescription>
                              Use um template para começar rapidamente
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {RULE_TEMPLATES.map((template, index) => (
                                <Card key={index} className="border-dashed cursor-pointer hover:border-solid hover:shadow-sm">
                                  <CardContent className="pt-4">
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-medium text-sm">{template.name}</h4>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => applyTemplate(template)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {template.pattern.substring(0, 40)}...
                                    </code>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Rule Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="rule-name">Nome da Regra *</Label>
                          <Input
                            id="rule-name"
                            value={newRule.name || ''}
                            onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Validar Valor Monetário"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="rule-category">Categoria</Label>
                          <Select 
                            value={newRule.category} 
                            onValueChange={(value) => setNewRule(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RULE_CATEGORIES.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={newRule.description || ''}
                          onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o que esta regra valida"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rule-pattern">Padrão Regex *</Label>
                        <div className="space-y-2">
                          <Textarea
                            id="rule-pattern"
                            value={newRule.pattern || ''}
                            onChange={(e) => setNewRule(prev => ({ ...prev, pattern: e.target.value }))}
                            placeholder="^[A-Z]{2}\\d{2}\\s\\d{4}$"
                            rows={3}
                            className="font-mono text-sm"
                          />
                          <div className="flex justify-between items-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('https://regex101.com', '_blank')}
                            >
                              <TestTube className="h-4 w-4 mr-2" />
                              Testar no Regex101
                            </Button>
                            
                            <Select 
                              value={newRule.severity} 
                              onValueChange={(value) => setNewRule(prev => ({ ...prev, severity: value as CustomRule['severity'] }))}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SEVERITY_LEVELS.map(severity => (
                                  <SelectItem key={severity.value} value={severity.value}>
                                    {severity.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Pattern Testing */}
                      {newRule.pattern && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                              <TestTube className="h-5 w-5 mr-2" />
                              Testar Padrão
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <Input
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                placeholder="Digite um texto para testar..."
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  const result = testPattern(newRule.pattern!, testInput);
                                  setTestResult(result);
                                }}
                                disabled={!testInput.trim()}
                              >
                                Testar
                              </Button>
                              
                              {testResult && (
                                <Alert className={testResult.error ? "border-red-200" : testResult.matches ? "border-green-200" : "border-yellow-200"}>
                                  <div className="flex items-center">
                                    {testResult.error ? (
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                    ) : testResult.matches ? (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    )}
                                    <AlertDescription className="ml-2">
                                      {testResult.error 
                                        ? `Erro na regex: ${testResult.error}`
                                        : testResult.matches 
                                          ? 'Padrão encontrado no texto'
                                          : 'Padrão não encontrado no texto'
                                      }
                                    </AlertDescription>
                                  </div>
                                </Alert>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={editingRule ? handleUpdateRule : handleAddRule}
                        disabled={!newRule.name?.trim() || !newRule.pattern?.trim()}
                      >
                        {editingRule ? 'Atualizar' : 'Adicionar'} Regra
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {filteredRules.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="text-center py-8">
                      <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium text-gray-500 mb-2">
                        Nenhuma regra encontrada
                      </p>
                      <p className="text-sm text-gray-400 mb-4">
                        {fields.length === 0 
                          ? 'Adicione sua primeira regra personalizada'
                          : 'Tente ajustar os filtros ou adicionar uma nova regra'
                        }
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeira Regra
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRules.map((rule: any, index: number) => {
                    const categoryInfo = getCategoryInfo(rule.category);
                    const severityInfo = getSeverityInfo(rule.severity);
                    
                    return (
                      <Card
                        key={rule.id}
                        className={cn(
                          "transition-all duration-200",
                          !rule.enabled && "opacity-60",
                          draggedIndex === index && "rotate-2 shadow-lg"
                        )}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex flex-col items-center space-y-1 mt-1">
                                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                <span className="text-xs text-gray-500">#{index + 1}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {rule.name}
                                  </h4>
                                  <Badge className={cn("text-xs", categoryInfo.color)}>
                                    {categoryInfo.label}
                                  </Badge>
                                  <Badge className={cn("text-xs", severityInfo.color)}>
                                    {severityInfo.label}
                                  </Badge>
                                  {!rule.enabled && (
                                    <Badge variant="outline" className="text-xs">
                                      Desabilitada
                                    </Badge>
                                  )}
                                </div>
                                
                                {rule.description && (
                                  <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                                )}
                                
                                <Collapsible>
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto">
                                      <Code className="h-4 w-4 mr-2" />
                                      <span className="text-xs">Ver padrão regex</span>
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                      <code className="text-xs font-mono text-gray-800">
                                        {rule.pattern}
                                      </code>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setTestingRule(rule);
                                      setTestInput('');
                                      setTestResult(null);
                                    }}
                                  >
                                    <TestTube className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Testar regra</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditRule(index, rule)}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar regra</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      if (window.confirm('Tem certeza que deseja excluir esta regra?')) {
                                        remove(index);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir regra</TooltipContent>
                              </Tooltip>
                              
                              <Switch
                                checked={rule.enabled}
                                onCheckedChange={(checked) => {
                                  // Update rule enabled status
                                  // This would need proper implementation with React Hook Form
                                }}
                                size="sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Quick Test Dialog */}
              {testingRule && (
                <Dialog open={!!testingRule} onOpenChange={() => setTestingRule(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Testar Regra: {testingRule.name}</DialogTitle>
                      <DialogDescription>
                        Digite um texto para verificar se a regra funciona corretamente
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label>Padrão Regex</Label>
                        <code className="block p-2 bg-gray-100 rounded text-sm font-mono">
                          {testingRule.pattern}
                        </code>
                      </div>
                      
                      <div>
                        <Label htmlFor="test-input">Texto de Teste</Label>
                        <Textarea
                          id="test-input"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder="Digite o texto para testar..."
                          rows={3}
                        />
                      </div>
                      
                      <Button onClick={handleTestPattern} disabled={!testInput.trim()}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Testar
                      </Button>
                      
                      {testResult && (
                        <Alert className={testResult.error ? "border-red-200" : testResult.matches ? "border-green-200" : "border-yellow-200"}>
                          <div className="flex items-center">
                            {testResult.error ? (
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                            ) : testResult.matches ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            )}
                            <AlertDescription className="ml-2">
                              {testResult.error 
                                ? `Erro na regex: ${testResult.error}`
                                : testResult.matches 
                                  ? 'Padrão encontrado no texto'
                                  : 'Padrão não encontrado no texto'
                              }
                            </AlertDescription>
                          </div>
                        </Alert>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Dicas para Criar Regras</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use grupos de captura () para extrair partes específicas</li>
                        <li>• Teste sempre suas expressões regulares antes de salvar</li>
                        <li>• Mantenha padrões simples e específicos para melhor performance</li>
                        <li>• Use âncoras ^ e $ quando necessário para match completo</li>
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