/**
 * Componente TemplateManager
 * 
 * Gerenciador de templates de configuração para o sistema LicitaReview.
 * Permite criar, editar, duplicar, importar e exportar templates de análise
 * com diferentes configurações de parâmetros e regras personalizadas.
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Download,
  Upload,
  Trash2,
  Star,
  StarOff,
  Settings,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useAnalysisConfig, type AnalysisTemplate, type AnalysisWeights } from '@/hooks/useAnalysisConfig';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TemplateManagerProps {
  onTemplateSelect?: (template: AnalysisTemplate) => void;
  selectedTemplateId?: string;
  className?: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  documentType: string;
  category: 'edital' | 'tr' | 'contrato' | 'projeto' | 'geral';
  weights: AnalysisWeights;
  customRules: string[];
  parameters: Record<string, any>;
  isPublic: boolean;
}

const documentTypes = [
  { value: 'edital', label: 'Edital de Licitação' },
  { value: 'tr', label: 'Termo de Referência' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'projeto', label: 'Projeto Básico/Executivo' },
  { value: 'ata', label: 'Ata de Registro de Preços' },
  { value: 'outros', label: 'Outros Documentos' }
];

const templateCategories = [
  { value: 'edital', label: 'Editais', icon: FileText },
  { value: 'tr', label: 'Termos de Referência', icon: Settings },
  { value: 'contrato', label: 'Contratos', icon: Users },
  { value: 'projeto', label: 'Projetos', icon: Calendar },
  { value: 'geral', label: 'Geral', icon: Star }
];

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  selectedTemplateId,
  className
}) => {
  const { user, organization } = useAuth();
  const { configuration, saveConfiguration } = useAnalysisConfig(organization?.id || '');
  
  // Estados principais
  const [templates, setTemplates] = useState<AnalysisTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'usage'>('name');
  
  // Estados do formulário
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AnalysisTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    documentType: 'edital',
    category: 'edital',
    weights: {
      structural: 0.20,
      legal: 0.25,
      clarity: 0.20,
      abnt: 0.15,
      budgetary: 0.10,
      formal: 0.10
    },
    customRules: [],
    parameters: {},
    isPublic: false
  });
  
  // Estados de ações
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Carrega templates
  useEffect(() => {
    loadTemplates();
  }, [organization?.id]);
  
  const loadTemplates = async () => {
    if (!organization?.id) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/templates/${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast({
        title: 'Erro ao carregar templates',
        description: 'Não foi possível carregar os templates disponíveis',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Templates filtrados e ordenados
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'usage':
          return (b.usageCount || 0) - (a.usageCount || 0);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [templates, searchTerm, selectedCategory, sortBy]);
  
  // Cria novo template
  const handleCreateTemplate = async () => {
    if (!organization?.id || !user?.id) return;
    
    setIsSaving(true);
    try {
      const newTemplate: Omit<AnalysisTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating'> = {
        ...formData,
        organizationId: organization.id,
        createdBy: user.id,
        isDefault: false
      };
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });
      
      if (response.ok) {
        const createdTemplate = await response.json();
        setTemplates(prev => [...prev, createdTemplate]);
        setIsCreateDialogOpen(false);
        resetForm();
        
        toast({
          title: 'Template criado',
          description: 'O template foi criado com sucesso'
        });
      } else {
        throw new Error('Falha ao criar template');
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
      toast({
        title: 'Erro ao criar template',
        description: 'Não foi possível criar o template',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Edita template existente
  const handleEditTemplate = async () => {
    if (!editingTemplate) return;
    
    setIsSaving(true);
    try {
      const updatedTemplate = {
        ...editingTemplate,
        ...formData,
        updatedAt: new Date()
      };
      
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedTemplate)
      });
      
      if (response.ok) {
        const updated = await response.json();
        setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
        setIsEditDialogOpen(false);
        setEditingTemplate(null);
        resetForm();
        
        toast({
          title: 'Template atualizado',
          description: 'O template foi atualizado com sucesso'
        });
      } else {
        throw new Error('Falha ao atualizar template');
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      toast({
        title: 'Erro ao atualizar template',
        description: 'Não foi possível atualizar o template',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Duplica template
  const handleDuplicateTemplate = async (template: AnalysisTemplate) => {
    if (!user?.id) return;
    
    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Cópia)`,
      createdBy: user.id,
      isDefault: false,
      isPublic: false
    };
    
    delete (duplicatedTemplate as any).id;
    delete (duplicatedTemplate as any).createdAt;
    delete (duplicatedTemplate as any).updatedAt;
    delete (duplicatedTemplate as any).usageCount;
    delete (duplicatedTemplate as any).rating;
    
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(duplicatedTemplate)
      });
      
      if (response.ok) {
        const created = await response.json();
        setTemplates(prev => [...prev, created]);
        
        toast({
          title: 'Template duplicado',
          description: 'O template foi duplicado com sucesso'
        });
      }
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast({
        title: 'Erro ao duplicar template',
        description: 'Não foi possível duplicar o template',
        variant: 'destructive'
      });
    }
  };
  
  // Remove template
  const handleDeleteTemplate = async (templateId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        
        toast({
          title: 'Template removido',
          description: 'O template foi removido com sucesso'
        });
      } else {
        throw new Error('Falha ao remover template');
      }
    } catch (error) {
      console.error('Erro ao remover template:', error);
      toast({
        title: 'Erro ao remover template',
        description: 'Não foi possível remover o template',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Exporta template
  const handleExportTemplate = async (template: AnalysisTemplate) => {
    try {
      const exportData = {
        ...template,
        exportedAt: new Date().toISOString(),
        exportedBy: user?.name || 'Usuário',
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template_${template.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Template exportado',
        description: 'O template foi exportado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao exportar template:', error);
      toast({
        title: 'Erro ao exportar template',
        description: 'Não foi possível exportar o template',
        variant: 'destructive'
      });
    }
  };
  
  // Importa template
  const handleImportTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization?.id || !user?.id) return;
    
    setIsImporting(true);
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);
      
      // Valida estrutura básica
      if (!importedData.name || !importedData.weights) {
        throw new Error('Arquivo de template inválido');
      }
      
      const newTemplate = {
        ...importedData,
        organizationId: organization.id,
        createdBy: user.id,
        isDefault: false,
        name: `${importedData.name} (Importado)`
      };
      
      // Remove campos que não devem ser importados
      delete newTemplate.id;
      delete newTemplate.createdAt;
      delete newTemplate.updatedAt;
      delete newTemplate.usageCount;
      delete newTemplate.rating;
      delete newTemplate.exportedAt;
      delete newTemplate.exportedBy;
      delete newTemplate.version;
      
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTemplate)
      });
      
      if (response.ok) {
        const created = await response.json();
        setTemplates(prev => [...prev, created]);
        
        toast({
          title: 'Template importado',
          description: 'O template foi importado com sucesso'
        });
      } else {
        throw new Error('Falha ao importar template');
      }
    } catch (error) {
      console.error('Erro ao importar template:', error);
      toast({
        title: 'Erro ao importar template',
        description: 'Não foi possível importar o template. Verifique se o arquivo é válido.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      // Reset input
      event.target.value = '';
    }
  };
  
  // Aplica template
  const handleApplyTemplate = (template: AnalysisTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
    
    toast({
      title: 'Template aplicado',
      description: `Template "${template.name}" foi aplicado à configuração atual`
    });
  };
  
  // Inicia edição
  const startEdit = (template: AnalysisTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      documentType: template.documentType,
      category: template.category,
      weights: template.weights,
      customRules: template.customRules,
      parameters: template.parameters,
      isPublic: template.isPublic
    });
    setIsEditDialogOpen(true);
  };
  
  // Reset formulário
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      documentType: 'edital',
      category: 'edital',
      weights: {
        structural: 0.20,
        legal: 0.25,
        clarity: 0.20,
        abnt: 0.15,
        budgetary: 0.10,
        formal: 0.10
      },
      customRules: [],
      parameters: {},
      isPublic: false
    });
  };
  
  // Renderiza card do template
  const renderTemplateCard = (template: AnalysisTemplate) => {
    const categoryInfo = templateCategories.find(c => c.value === template.category);
    const Icon = categoryInfo?.icon || FileText;
    const isSelected = selectedTemplateId === template.id;
    
    return (
      <Card 
        key={template.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => handleApplyTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-gray-600" />
              <div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  startEdit(template);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicateTemplate(template);
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleExportTemplate(template);
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza que deseja remover este template?')) {
                      handleDeleteTemplate(template.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tipo de Documento:</span>
              <Badge variant="outline">
                {documentTypes.find(dt => dt.value === template.documentType)?.label || template.documentType}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Categoria:</span>
              <Badge variant="secondary">
                {categoryInfo?.label || template.category}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Regras Personalizadas:</span>
              <span className="font-medium">{template.customRules.length}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uso:</span>
              <span className="font-medium">{template.usageCount || 0}x</span>
            </div>
            
            {template.isDefault && (
              <Badge className="w-full justify-center" variant="default">
                <Star className="mr-1 h-3 w-3" />
                Template Padrão
              </Badge>
            )}
            
            {template.isPublic && (
              <Badge className="w-full justify-center" variant="outline">
                <Users className="mr-1 h-3 w-3" />
                Público
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Renderiza formulário de template
  const renderTemplateForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Template</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Análise Rigorosa de Editais"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="documentType">Tipo de Documento</Label>
          <Select
            value={formData.documentType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o propósito e características deste template..."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {templateCategories.map(category => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
            className="rounded"
          />
          <Label htmlFor="isPublic">Template público (visível para toda organização)</Label>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <h4 className="font-medium">Pesos dos Parâmetros</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(formData.weights).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {key === 'structural' && 'Estrutural'}
                {key === 'legal' && 'Jurídico'}
                {key === 'clarity' && 'Clareza'}
                {key === 'abnt' && 'ABNT'}
                {key === 'budgetary' && 'Orçamentário'}
                {key === 'formal' && 'Formal'}
              </Label>
              <Input
                id={key}
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  weights: {
                    ...prev.weights,
                    [key]: parseFloat(e.target.value) || 0
                  }
                }))}
              />
            </div>
          ))}
        </div>
        
        <div className="text-sm text-gray-600">
          <Info className="inline h-4 w-4 mr-1" />
          A soma dos pesos deve ser igual a 1.0. Atual: {Object.values(formData.weights).reduce((sum, w) => sum + w, 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Templates</h2>
          <p className="text-gray-600">Gerencie templates de configuração para análises</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="file"
            accept=".json"
            onChange={handleImportTemplate}
            className="hidden"
            id="import-template"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-template')?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Template</DialogTitle>
                <DialogDescription>
                  Configure um novo template de análise com parâmetros e regras personalizadas
                </DialogDescription>
              </DialogHeader>
              
              {renderTemplateForm()}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTemplate} disabled={isSaving}>
                  {isSaving ? 'Criando...' : 'Criar Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filtros e busca */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {templateCategories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="created">Data de Criação</SelectItem>
            <SelectItem value="usage">Mais Usados</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredTemplates.length > 0 ? (
          filteredTemplates.map(renderTemplateCard)
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum template encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro template para começar'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Modifique as configurações do template selecionado
            </DialogDescription>
          </DialogHeader>
          
          {renderTemplateForm()}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setEditingTemplate(null);
              resetForm();
            }}>
              Cancelar
            </Button>
            <Button onClick={handleEditTemplate} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManager;
