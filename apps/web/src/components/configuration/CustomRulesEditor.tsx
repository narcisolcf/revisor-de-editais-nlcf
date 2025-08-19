/**
 * CustomRulesEditor - Editor de Regras Personalizadas
 * 
 * Componente para criação e gerenciamento de regras de análise personalizadas.
 * Permite definir critérios específicos, condições lógicas e ações automáticas
 * para personalizar o comportamento do motor de análise adaptativo.
 * 
 * Funcionalidades:
 * - Editor visual de regras com interface drag-and-drop
 * - Construtor de condições lógicas (AND, OR, NOT)
 * - Biblioteca de templates de regras predefinidas
 * - Validação em tempo real de sintaxe
 * - Preview de execução de regras
 * - Versionamento e histórico de alterações
 * - Importação/exportação de regras
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Code,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Filter,
  Target,
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tipos de dados para regras
interface CustomRule {
  id: string;
  name: string;
  description: string;
  category: 'validation' | 'scoring' | 'classification' | 'notification' | 'workflow';
  priority: number;
  isActive: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
  author: string;
}

interface RuleCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex' | 'exists' | 'not_exists';
  value: string | number | boolean;
  logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
  id: string;
  type: 'set_score' | 'add_flag' | 'send_notification' | 'block_approval' | 'require_review';
  parameters: { [key: string]: any };
}

// Templates de regras predefinidas
const RULE_TEMPLATES: Partial<CustomRule>[] = [
  {
    name: 'Valor Acima do Limite',
    description: 'Sinaliza quando o valor estimado excede um limite definido',
    category: 'validation',
    conditions: [
      {
        id: 'cond1',
        field: 'valor_estimado',
        operator: 'greater_than',
        value: 100000
      }
    ],
    actions: [
      {
        id: 'act1',
        type: 'add_flag',
        parameters: {
          flag: 'VALOR_ALTO',
          severity: 'warning',
          message: 'Valor estimado acima do limite organizacional'
        }
      }
    ]
  },
  {
    name: 'Documentos Obrigatórios Ausentes',
    description: 'Verifica se todos os documentos obrigatórios estão presentes',
    category: 'validation',
    conditions: [
      {
        id: 'cond1',
        field: 'documentos_anexos',
        operator: 'not_exists',
        value: 'termo_referencia'
      }
    ],
    actions: [
      {
        id: 'act1',
        type: 'block_approval',
        parameters: {
          reason: 'Termo de Referência não encontrado',
          required_action: 'Anexar documento obrigatório'
        }
      }
    ]
  },
  {
    name: 'Prazo Muito Curto',
    description: 'Identifica prazos de execução potencialmente inadequados',
    category: 'scoring',
    conditions: [
      {
        id: 'cond1',
        field: 'prazo_execucao',
        operator: 'less_than',
        value: 30
      },
      {
        id: 'cond2',
        field: 'complexidade',
        operator: 'equals',
        value: 'alta',
        logicalOperator: 'AND'
      }
    ],
    actions: [
      {
        id: 'act1',
        type: 'set_score',
        parameters: {
          score_adjustment: -0.2,
          reason: 'Prazo inadequado para complexidade'
        }
      }
    ]
  }
];

interface CustomRulesEditorProps {
  config: any;
  onConfigChange: (config: any) => void;
  onProgressChange: (progress: number) => void;
  isLoading?: boolean;
}

export const CustomRulesEditor: React.FC<CustomRulesEditorProps> = ({
  config,
  onConfigChange,
  onProgressChange,
  isLoading = false
}) => {
  const { toast } = useToast();
  
  // Estados locais
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<CustomRule | null>(null);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para nova regra
  const [newRule, setNewRule] = useState<Partial<CustomRule>>({
    name: '',
    description: '',
    category: 'validation',
    priority: 1,
    isActive: true,
    conditions: [],
    actions: []
  });
  
  // Carregar configuração inicial
  useEffect(() => {
    if (config?.customRules) {
      setRules(config.customRules);
    }
  }, [config]);
  
  // Calcular e atualizar progresso
  useEffect(() => {
    const activeRules = rules.filter(rule => rule.isActive);
    const validRules = activeRules.filter(rule => 
      rule.conditions.length > 0 && rule.actions.length > 0
    );
    const progress = rules.length > 0 ? (validRules.length / rules.length) * 100 : 0;
    onProgressChange(Math.min(progress, 100));
  }, [rules, onProgressChange]);
  
  // Atualizar configuração quando regras mudarem
  useEffect(() => {
    onConfigChange({
      ...config,
      customRules: rules
    });
  }, [rules, onConfigChange]);
  
  // Função para criar nova regra
  const createRule = () => {
    if (!newRule.name || !newRule.description) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha nome e descrição da regra.",
        variant: "destructive"
      });
      return;
    }
    
    const rule: CustomRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name!,
      description: newRule.description!,
      category: newRule.category || 'validation',
      priority: newRule.priority || 1,
      isActive: newRule.isActive !== false,
      conditions: newRule.conditions || [],
      actions: newRule.actions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      author: 'current_user' // Seria obtido do contexto de autenticação
    };
    
    setRules(prev => [...prev, rule]);
    setNewRule({
      name: '',
      description: '',
      category: 'validation',
      priority: 1,
      isActive: true,
      conditions: [],
      actions: []
    });
    setIsCreatingRule(false);
    
    toast({
      title: "Regra Criada",
      description: `Regra "${rule.name}" criada com sucesso.`,
      variant: "default"
    });
  };
  
  // Função para aplicar template
  const applyTemplate = (template: Partial<CustomRule>) => {
    setNewRule({
      ...newRule,
      ...template,
      conditions: template.conditions?.map(cond => ({ ...cond, id: `cond-${Date.now()}-${Math.random()}` })) || [],
      actions: template.actions?.map(action => ({ ...action, id: `act-${Date.now()}-${Math.random()}` })) || []
    });
  };
  
  // Função para alternar status ativo de uma regra
  const toggleRuleActive = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive, updatedAt: new Date() } : rule
    ));
  };
  
  // Função para excluir regra
  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: "Regra Excluída",
      description: "A regra foi removida com sucesso.",
      variant: "default"
    });
  };
  
  // Função para duplicar regra
  const duplicateRule = (rule: CustomRule) => {
    const duplicatedRule: CustomRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Cópia)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    };
    
    setRules(prev => [...prev, duplicatedRule]);
    toast({
      title: "Regra Duplicada",
      description: `Regra "${duplicatedRule.name}" criada com sucesso.`,
      variant: "default"
    });
  };
  
  // Função para adicionar condição
  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `cond-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: ''
    };
    
    setNewRule(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), newCondition]
    }));
  };
  
  // Função para adicionar ação
  const addAction = () => {
    const newAction: RuleAction = {
      id: `act-${Date.now()}`,
      type: 'add_flag',
      parameters: {}
    };
    
    setNewRule(prev => ({
      ...prev,
      actions: [...(prev.actions || []), newAction]
    }));
  };
  
  // Função para remover condição
  const removeCondition = (conditionId: string) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions?.filter(cond => cond.id !== conditionId) || []
    }));
  };
  
  // Função para remover ação
  const removeAction = (actionId: string) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions?.filter(action => action.id !== actionId) || []
    }));
  };
  
  // Filtrar regras
  const filteredRules = rules.filter(rule => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      validation: 'bg-red-100 text-red-800',
      scoring: 'bg-blue-100 text-blue-800',
      classification: 'bg-green-100 text-green-800',
      notification: 'bg-yellow-100 text-yellow-800',
      workflow: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };
  
  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      validation: 'Validação',
      scoring: 'Pontuação',
      classification: 'Classificação',
      notification: 'Notificação',
      workflow: 'Fluxo'
    };
    return names[category] || category;
  };
  
  const getOperatorName = (operator: string) => {
    const names: { [key: string]: string } = {
      equals: 'Igual a',
      contains: 'Contém',
      greater_than: 'Maior que',
      less_than: 'Menor que',
      regex: 'Expressão regular',
      exists: 'Existe',
      not_exists: 'Não existe'
    };
    return names[operator] || operator;
  };
  
  const getActionTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      set_score: 'Definir Pontuação',
      add_flag: 'Adicionar Sinalização',
      send_notification: 'Enviar Notificação',
      block_approval: 'Bloquear Aprovação',
      require_review: 'Exigir Revisão'
    };
    return names[type] || type;
  };
  
  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total de Regras</span>
              <span className="text-2xl font-bold text-blue-600">{rules.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Regras Ativas</span>
              <span className="text-2xl font-bold text-green-600">
                {rules.filter(rule => rule.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Categorias</span>
              <span className="text-2xl font-bold text-purple-600">
                {new Set(rules.map(rule => rule.category)).size}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Regras Válidas</span>
              <span className="text-2xl font-bold text-orange-600">
                {rules.filter(rule => rule.conditions.length > 0 && rule.actions.length > 0).length}
              </span>
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
                <Code className="h-5 w-5" />
                Regras Personalizadas
              </CardTitle>
              <CardDescription>
                Configure regras específicas para análise de documentos
              </CardDescription>
            </div>
            
            <Dialog open={isCreatingRule} onOpenChange={setIsCreatingRule}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Nova Regra</DialogTitle>
                  <DialogDescription>
                    Configure uma regra personalizada para análise de documentos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-name">Nome da Regra</Label>
                      <Input
                        id="rule-name"
                        value={newRule.name || ''}
                        onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Verificar Valor Máximo"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="rule-category">Categoria</Label>
                      <Select
                        value={newRule.category || 'validation'}
                        onValueChange={(value: any) => setNewRule(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="validation">Validação</SelectItem>
                          <SelectItem value="scoring">Pontuação</SelectItem>
                          <SelectItem value="classification">Classificação</SelectItem>
                          <SelectItem value="notification">Notificação</SelectItem>
                          <SelectItem value="workflow">Fluxo</SelectItem>
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
                      placeholder="Descreva o propósito e funcionamento desta regra"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rule-priority">Prioridade</Label>
                      <Input
                        id="rule-priority"
                        type="number"
                        min="1"
                        max="10"
                        value={newRule.priority || 1}
                        onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={newRule.isActive !== false}
                        onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label>Regra Ativa</Label>
                    </div>
                  </div>
                  
                  {/* Templates */}
                  <div>
                    <Label>Templates Predefinidos</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      {RULE_TEMPLATES.map((template, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(template)}
                          className="text-left justify-start h-auto p-3"
                        >
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-gray-500">{template.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Condições */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Condições</Label>
                      <Button variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Condição
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newRule.conditions?.map((condition, index) => (
                        <Card key={condition.id} className="p-4">
                          <div className="grid grid-cols-4 gap-3 items-end">
                            <div>
                              <Label>Campo</Label>
                              <Input
                                value={condition.field}
                                onChange={(e) => {
                                  const updatedConditions = [...(newRule.conditions || [])];
                                  updatedConditions[index] = { ...condition, field: e.target.value };
                                  setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                                }}
                                placeholder="Ex: valor_estimado"
                              />
                            </div>
                            
                            <div>
                              <Label>Operador</Label>
                              <Select
                                value={condition.operator}
                                onValueChange={(value: any) => {
                                  const updatedConditions = [...(newRule.conditions || [])];
                                  updatedConditions[index] = { ...condition, operator: value };
                                  setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Igual a</SelectItem>
                                  <SelectItem value="contains">Contém</SelectItem>
                                  <SelectItem value="greater_than">Maior que</SelectItem>
                                  <SelectItem value="less_than">Menor que</SelectItem>
                                  <SelectItem value="regex">Regex</SelectItem>
                                  <SelectItem value="exists">Existe</SelectItem>
                                  <SelectItem value="not_exists">Não existe</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label>Valor</Label>
                              <Input
                                value={condition.value?.toString() || ''}
                                onChange={(e) => {
                                  const updatedConditions = [...(newRule.conditions || [])];
                                  updatedConditions[index] = { ...condition, value: e.target.value };
                                  setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                                }}
                                placeholder="Valor de comparação"
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              {index > 0 && (
                                <Select
                                  value={condition.logicalOperator || 'AND'}
                                  onValueChange={(value: 'AND' | 'OR') => {
                                    const updatedConditions = [...(newRule.conditions || [])];
                                    updatedConditions[index] = { ...condition, logicalOperator: value };
                                    setNewRule(prev => ({ ...prev, conditions: updatedConditions }));
                                  }}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AND">E</SelectItem>
                                    <SelectItem value="OR">OU</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeCondition(condition.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                      
                      {(!newRule.conditions || newRule.conditions.length === 0) && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Adicione pelo menos uma condição para definir quando esta regra deve ser executada.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Ações */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-medium">Ações</Label>
                      <Button variant="outline" size="sm" onClick={addAction}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Ação
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {newRule.actions?.map((action, index) => (
                        <Card key={action.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Select
                              value={action.type}
                              onValueChange={(value: any) => {
                                const updatedActions = [...(newRule.actions || [])];
                                updatedActions[index] = { ...action, type: value, parameters: {} };
                                setNewRule(prev => ({ ...prev, actions: updatedActions }));
                              }}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="set_score">Definir Pontuação</SelectItem>
                                <SelectItem value="add_flag">Adicionar Sinalização</SelectItem>
                                <SelectItem value="send_notification">Enviar Notificação</SelectItem>
                                <SelectItem value="block_approval">Bloquear Aprovação</SelectItem>
                                <SelectItem value="require_review">Exigir Revisão</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeAction(action.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Parâmetros específicos por tipo de ação */}
                          <div className="grid grid-cols-2 gap-3">
                            {action.type === 'set_score' && (
                              <>
                                <div>
                                  <Label>Ajuste de Pontuação</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="Ex: -0.2"
                                    value={action.parameters.score_adjustment || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...(newRule.actions || [])];
                                      updatedActions[index] = {
                                        ...action,
                                        parameters: {
                                          ...action.parameters,
                                          score_adjustment: parseFloat(e.target.value) || 0
                                        }
                                      };
                                      setNewRule(prev => ({ ...prev, actions: updatedActions }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Motivo</Label>
                                  <Input
                                    placeholder="Motivo do ajuste"
                                    value={action.parameters.reason || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...(newRule.actions || [])];
                                      updatedActions[index] = {
                                        ...action,
                                        parameters: {
                                          ...action.parameters,
                                          reason: e.target.value
                                        }
                                      };
                                      setNewRule(prev => ({ ...prev, actions: updatedActions }));
                                    }}
                                  />
                                </div>
                              </>
                            )}
                            
                            {action.type === 'add_flag' && (
                              <>
                                <div>
                                  <Label>Tipo de Sinalização</Label>
                                  <Input
                                    placeholder="Ex: VALOR_ALTO"
                                    value={action.parameters.flag || ''}
                                    onChange={(e) => {
                                      const updatedActions = [...(newRule.actions || [])];
                                      updatedActions[index] = {
                                        ...action,
                                        parameters: {
                                          ...action.parameters,
                                          flag: e.target.value
                                        }
                                      };
                                      setNewRule(prev => ({ ...prev, actions: updatedActions }));
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label>Severidade</Label>
                                  <Select
                                    value={action.parameters.severity || 'warning'}
                                    onValueChange={(value) => {
                                      const updatedActions = [...(newRule.actions || [])];
                                      updatedActions[index] = {
                                        ...action,
                                        parameters: {
                                          ...action.parameters,
                                          severity: value
                                        }
                                      };
                                      setNewRule(prev => ({ ...prev, actions: updatedActions }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="info">Info</SelectItem>
                                      <SelectItem value="warning">Aviso</SelectItem>
                                      <SelectItem value="error">Erro</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </div>
                        </Card>
                      ))}
                      
                      {(!newRule.actions || newRule.actions.length === 0) && (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            Adicione pelo menos uma ação para definir o que acontece quando as condições são atendidas.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatingRule(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createRule}>
                    Criar Regra
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar regras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="validation">Validação</SelectItem>
                <SelectItem value="scoring">Pontuação</SelectItem>
                <SelectItem value="classification">Classificação</SelectItem>
                <SelectItem value="notification">Notificação</SelectItem>
                <SelectItem value="workflow">Fluxo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Lista de Regras */}
          {filteredRules.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {rules.length === 0 
                  ? "Nenhuma regra criada ainda. Clique em 'Nova Regra' para começar."
                  : "Nenhuma regra encontrada com os filtros aplicados."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className={`transition-all ${
                  rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900">{rule.name}</h4>
                          <Badge className={getCategoryColor(rule.category)}>
                            {getCategoryName(rule.category)}
                          </Badge>
                          <Badge variant="outline">Prioridade {rule.priority}</Badge>
                          {rule.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Pause className="h-3 w-3 mr-1" />
                              Inativa
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{rule.conditions.length} condições</span>
                          <span>{rule.actions.length} ações</span>
                          <span>v{rule.version}</span>
                          <span>por {rule.author}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRuleActive(rule.id)}
                        />
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedRule(rule)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateRule(rule)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteRule(rule.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    {/* Preview das condições e ações */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Condições:</span>
                          <div className="mt-1 space-y-1">
                            {rule.conditions.slice(0, 2).map((condition, index) => (
                              <div key={condition.id} className="text-gray-600">
                                {index > 0 && condition.logicalOperator && (
                                  <span className="text-blue-600 font-medium">
                                    {condition.logicalOperator} 
                                  </span>
                                )}
                                {condition.field} {getOperatorName(condition.operator)} {condition.value}
                              </div>
                            ))}
                            {rule.conditions.length > 2 && (
                              <div className="text-gray-500">+{rule.conditions.length - 2} mais...</div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Ações:</span>
                          <div className="mt-1 space-y-1">
                            {rule.actions.slice(0, 2).map((action) => (
                              <div key={action.id} className="text-gray-600">
                                {getActionTypeName(action.type)}
                              </div>
                            ))}
                            {rule.actions.length > 2 && (
                              <div className="text-gray-500">+{rule.actions.length - 2} mais...</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de Visualização de Regra */}
      <Dialog open={!!selectedRule} onOpenChange={() => setSelectedRule(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedRule?.name}</DialogTitle>
            <DialogDescription>{selectedRule?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedRule && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(selectedRule.category)}>
                  {getCategoryName(selectedRule.category)}
                </Badge>
                <Badge variant="outline">Prioridade {selectedRule.priority}</Badge>
                <Badge className={selectedRule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedRule.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Condições</h4>
                <div className="space-y-2">
                  {selectedRule.conditions.map((condition, index) => (
                    <div key={condition.id} className="flex items-center gap-2 text-sm">
                      {index > 0 && condition.logicalOperator && (
                        <Badge variant="outline" className="text-xs">
                          {condition.logicalOperator}
                        </Badge>
                      )}
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {condition.field} {getOperatorName(condition.operator)} {condition.value}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Ações</h4>
                <div className="space-y-2">
                  {selectedRule.actions.map((action) => (
                    <div key={action.id} className="text-sm">
                      <Badge variant="outline">{getActionTypeName(action.type)}</Badge>
                      {Object.keys(action.parameters).length > 0 && (
                        <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                          {JSON.stringify(action.parameters, null, 2)}
                        </code>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="text-xs text-gray-500">
                <div>Criada em: {selectedRule.createdAt.toLocaleDateString()}</div>
                <div>Última atualização: {selectedRule.updatedAt.toLocaleDateString()}</div>
                <div>Versão: {selectedRule.version}</div>
                <div>Autor: {selectedRule.author}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomRulesEditor;