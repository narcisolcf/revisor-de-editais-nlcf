/**
 * DocumentTypeSelector - Seletor de Tipos de Documento
 * 
 * Componente para configuração e gerenciamento de tipos de documentos
 * suportados pelo sistema de análise. Permite definir características
 * específicas de cada tipo de documento e seus parâmetros de análise.
 * 
 * Funcionalidades:
 * - Seleção de tipos de documento predefinidos
 * - Criação de tipos personalizados
 * - Configuração de parâmetros específicos por tipo
 * - Validação de configurações
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  FileText,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
  Info,
  Settings,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Tipos de documento predefinidos
const PREDEFINED_DOCUMENT_TYPES = [
  {
    id: 'edital-licitacao',
    name: 'Edital de Licitação',
    description: 'Documento principal que define os termos da licitação',
    category: 'principal',
    requiredFields: ['objeto', 'prazo', 'valor', 'modalidade'],
    analysisWeight: 1.0,
    complexityLevel: 'high' as const
  },
  {
    id: 'termo-referencia',
    name: 'Termo de Referência',
    description: 'Especificações técnicas detalhadas do objeto',
    category: 'tecnico',
    requiredFields: ['especificacoes', 'quantidades', 'criterios'],
    analysisWeight: 0.9,
    complexityLevel: 'high' as const
  },
  {
    id: 'minuta-contrato',
    name: 'Minuta de Contrato',
    description: 'Modelo do contrato a ser firmado',
    category: 'juridico',
    requiredFields: ['clausulas', 'obrigacoes', 'penalidades'],
    analysisWeight: 0.8,
    complexityLevel: 'medium' as const
  },
  {
    id: 'planilha-orcamentaria',
    name: 'Planilha Orçamentária',
    description: 'Estimativa de custos e valores',
    category: 'financeiro',
    requiredFields: ['itens', 'quantidades', 'valores'],
    analysisWeight: 0.7,
    complexityLevel: 'medium' as const
  },
  {
    id: 'cronograma',
    name: 'Cronograma de Execução',
    description: 'Planejamento temporal das atividades',
    category: 'planejamento',
    requiredFields: ['etapas', 'prazos', 'marcos'],
    analysisWeight: 0.6,
    complexityLevel: 'low' as const
  }
];

interface DocumentType {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredFields: string[];
  analysisWeight: number;
  complexityLevel: 'low' | 'medium' | 'high';
  isCustom?: boolean;
  isActive?: boolean;
}

interface DocumentTypeSelectorProps {
  config: any;
  onConfigChange: (config: any) => void;
  onProgressChange: (progress: number) => void;
  isLoading?: boolean;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  config,
  onConfigChange,
  onProgressChange,
  isLoading = false
}) => {
  const { toast } = useToast();
  
  // Estados locais
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [customTypes, setCustomTypes] = useState<DocumentType[]>([]);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  
  // Estado para criação de tipo personalizado
  const [newType, setNewType] = useState<Partial<DocumentType>>({
    name: '',
    description: '',
    category: '',
    requiredFields: [],
    analysisWeight: 1.0,
    complexityLevel: 'medium',
    isCustom: true,
    isActive: true
  });
  
  // Carregar configuração inicial
  useEffect(() => {
    if (config?.documentTypes) {
      const predefined = config.documentTypes.filter((type: DocumentType) => !type.isCustom);
      const custom = config.documentTypes.filter((type: DocumentType) => type.isCustom);
      setSelectedTypes(predefined);
      setCustomTypes(custom);
    } else {
      // Configuração padrão
      const defaultTypes: DocumentType[] = PREDEFINED_DOCUMENT_TYPES.slice(0, 3).map(type => ({
        ...type,
        isActive: true
      }));
      setSelectedTypes(defaultTypes);
    }
  }, [config]);
  
  // Calcular e atualizar progresso
  useEffect(() => {
    const totalTypes = selectedTypes.length + customTypes.length;
    const activeTypes = [...selectedTypes, ...customTypes].filter(type => type.isActive).length;
    const progress = totalTypes > 0 ? (activeTypes / Math.max(totalTypes, 3)) * 100 : 0;
    onProgressChange(Math.min(progress, 100));
  }, [selectedTypes, customTypes, onProgressChange]);
  
  // Atualizar configuração quando tipos mudarem
  useEffect(() => {
    const allTypes = [...selectedTypes, ...customTypes];
    onConfigChange({
      ...config,
      documentTypes: allTypes
    });
  }, [selectedTypes, customTypes, onConfigChange]);
  
  // Função para alternar tipo predefinido
  const togglePredefinedType = (typeId: string) => {
    const type = PREDEFINED_DOCUMENT_TYPES.find(t => t.id === typeId);
    if (!type) return;
    
    const isSelected = selectedTypes.some(t => t.id === typeId);
    
    if (isSelected) {
      setSelectedTypes(prev => prev.filter(t => t.id !== typeId));
    } else {
      const newType: DocumentType = { ...type, isActive: true };
      setSelectedTypes(prev => [...prev, newType]);
    }
  };
  
  // Função para alternar status ativo de um tipo
  const toggleTypeActive = (typeId: string, isCustom: boolean = false) => {
    if (isCustom) {
      setCustomTypes(prev => prev.map(type => 
        type.id === typeId ? { ...type, isActive: !type.isActive } : type
      ));
    } else {
      setSelectedTypes(prev => prev.map(type => 
        type.id === typeId ? { ...type, isActive: !type.isActive } : type
      ));
    }
  };
  
  // Função para criar tipo personalizado
  const createCustomType = () => {
    if (!newType.name || !newType.description || !newType.category) {
      toast({
        title: "Campos Obrigatórios",
        description: "Preencha nome, descrição e categoria do tipo de documento.",
        variant: "destructive"
      });
      return;
    }
    
    const customType: DocumentType = {
      id: `custom-${Date.now()}`,
      name: newType.name!,
      description: newType.description!,
      category: newType.category!,
      requiredFields: newType.requiredFields || [],
      analysisWeight: newType.analysisWeight || 1.0,
      complexityLevel: newType.complexityLevel || 'medium',
      isCustom: true,
      isActive: true
    };
    
    setCustomTypes(prev => [...prev, customType]);
    setNewType({
      name: '',
      description: '',
      category: '',
      requiredFields: [],
      analysisWeight: 1.0,
      complexityLevel: 'medium',
      isCustom: true,
      isActive: true
    });
    setIsCreatingCustom(false);
    
    toast({
      title: "Tipo Criado",
      description: `Tipo de documento "${customType.name}" criado com sucesso.`,
      variant: "default"
    });
  };
  
  // Função para excluir tipo personalizado
  const deleteCustomType = (typeId: string) => {
    setCustomTypes(prev => prev.filter(type => type.id !== typeId));
    toast({
      title: "Tipo Excluído",
      description: "Tipo de documento personalizado foi excluído.",
      variant: "default"
    });
  };
  
  // Função para adicionar campo obrigatório
  const addRequiredField = (field: string) => {
    if (field && !newType.requiredFields?.includes(field)) {
      setNewType(prev => ({
        ...prev,
        requiredFields: [...(prev.requiredFields || []), field]
      }));
    }
  };
  
  // Função para remover campo obrigatório
  const removeRequiredField = (field: string) => {
    setNewType(prev => ({
      ...prev,
      requiredFields: prev.requiredFields?.filter(f => f !== field) || []
    }));
  };
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      principal: 'bg-blue-100 text-blue-800',
      tecnico: 'bg-green-100 text-green-800',
      juridico: 'bg-purple-100 text-purple-800',
      financeiro: 'bg-yellow-100 text-yellow-800',
      planejamento: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };
  
  const getComplexityColor = (level: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };
  
  // Calcular peso médio dos tipos ativos
  const calculateAverageWeight = () => {
    const activeTypes = [...selectedTypes, ...customTypes].filter(type => type.isActive);
    if (activeTypes.length === 0) return 0;
    const totalWeight = activeTypes.reduce((sum, type) => sum + type.analysisWeight, 0);
    return totalWeight / activeTypes.length;
  };
  
  return (
    <div className="space-y-6">
      {/* Informações e Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Tipos Ativos</span>
              <span className="text-2xl font-bold text-blue-600">
                {[...selectedTypes, ...customTypes].filter(type => type.isActive).length}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Tipos Personalizados</span>
              <span className="text-2xl font-bold text-green-600">{customTypes.length}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Peso Médio</span>
              <span className="text-2xl font-bold text-purple-600">
                {calculateAverageWeight().toFixed(1)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tipos Predefinidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tipos de Documento Predefinidos
          </CardTitle>
          <CardDescription>
            Selecione os tipos de documento que sua organização utiliza frequentemente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PREDEFINED_DOCUMENT_TYPES.map((type) => {
              const isSelected = selectedTypes.some(t => t.id === type.id);
              const selectedType = selectedTypes.find(t => t.id === type.id);
              
              return (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => togglePredefinedType(type.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <Switch
                            checked={selectedType?.isActive || false}
                            onCheckedChange={() => toggleTypeActive(type.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(type.category)}>
                        {type.category}
                      </Badge>
                      <Badge className={getComplexityColor(type.complexityLevel)}>
                        {type.complexityLevel}
                      </Badge>
                      <Badge variant="outline">
                        Peso: {type.analysisWeight}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Campos: {type.requiredFields.join(', ')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Tipos Personalizados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Tipos Personalizados
              </CardTitle>
              <CardDescription>
                Crie tipos de documento específicos para sua organização
              </CardDescription>
            </div>
            
            <Dialog open={isCreatingCustom} onOpenChange={setIsCreatingCustom}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Tipo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Tipo de Documento Personalizado</DialogTitle>
                  <DialogDescription>
                    Configure um novo tipo de documento com características específicas
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Tipo</Label>
                      <Input
                        id="name"
                        value={newType.name || ''}
                        onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Relatório Técnico"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={newType.category || ''}
                        onValueChange={(value) => setNewType(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="principal">Principal</SelectItem>
                          <SelectItem value="tecnico">Técnico</SelectItem>
                          <SelectItem value="juridico">Jurídico</SelectItem>
                          <SelectItem value="financeiro">Financeiro</SelectItem>
                          <SelectItem value="planejamento">Planejamento</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newType.description || ''}
                      onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o propósito e características deste tipo de documento"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso de Análise</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={newType.analysisWeight || 1.0}
                        onChange={(e) => setNewType(prev => ({ ...prev, analysisWeight: parseFloat(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="complexity">Nível de Complexidade</Label>
                      <Select
                        value={newType.complexityLevel || 'medium'}
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setNewType(prev => ({ ...prev, complexityLevel: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Campos Obrigatórios</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newType.requiredFields?.map((field) => (
                        <Badge key={field} variant="secondary" className="flex items-center gap-1">
                          {field}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeRequiredField(field)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nome do campo"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addRequiredField(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addRequiredField(input.value);
                          input.value = '';
                        }}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreatingCustom(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createCustomType}>
                    Criar Tipo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {customTypes.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Nenhum tipo personalizado criado ainda. Clique em "Criar Tipo" para adicionar tipos específicos da sua organização.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customTypes.map((type) => (
                <Card key={type.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{type.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.isActive || false}
                          onCheckedChange={() => toggleTypeActive(type.id, true)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCustomType(type.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(type.category)}>
                        {type.category}
                      </Badge>
                      <Badge className={getComplexityColor(type.complexityLevel)}>
                        {type.complexityLevel}
                      </Badge>
                      <Badge variant="outline">
                        Peso: {type.analysisWeight}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Campos: {type.requiredFields.join(', ') || 'Nenhum'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Resumo da Configuração */}
      {([...selectedTypes, ...customTypes].filter(type => type.isActive).length > 0) && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configuração válida: {[...selectedTypes, ...customTypes].filter(type => type.isActive).length} tipos de documento ativos.
            O sistema está pronto para analisar estes tipos de documento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DocumentTypeSelector;