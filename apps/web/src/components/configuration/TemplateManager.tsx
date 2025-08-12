/**
 * Template Manager Component
 * 
 * Advanced interface for managing document templates
 * following GOV.BR design patterns
 */

import React, { useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy,
  Download,
  Upload,
  FileText,
  Search,
  Filter,
  Star,
  StarOff,
  Eye,
  Code,
  Save,
  RotateCcw
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
import { cn } from '@/src/lib/utils';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  documentType: string;
  content: string;
  isDefault: boolean;
  isActive: boolean;
  variables?: Array<{
    name: string;
    type: 'text' | 'number' | 'date' | 'currency';
    description: string;
    required: boolean;
    defaultValue?: string;
  }>;
  sections?: Array<{
    id: string;
    name: string;
    content: string;
    required: boolean;
    order: number;
  }>;
  createdAt?: Date;
  lastModified?: Date;
  author?: string;
  version?: string;
}

const DOCUMENT_TYPES = [
  { value: 'edital-pregao', label: 'Edital de Pregão', icon: '📋' },
  { value: 'edital-concorrencia', label: 'Edital de Concorrência', icon: '🏗️' },
  { value: 'contrato-fornecimento', label: 'Contrato de Fornecimento', icon: '📄' },
  { value: 'ata-registro-precos', label: 'Ata de Registro de Preços', icon: '📝' },
  { value: 'termo-referencia', label: 'Termo de Referência', icon: '📖' },
  { value: 'outros', label: 'Outros', icon: '📁' }
];

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'template-pregao-default',
    name: 'Edital de Pregão Eletrônico - Padrão',
    description: 'Template padrão para editais de pregão eletrônico',
    documentType: 'edital-pregao',
    isDefault: true,
    isActive: true,
    content: `# EDITAL DE PREGÃO ELETRÔNICO Nº {{numero_pregao}}/{{ano}}

## 1. PREÂMBULO
A {{orgao_licitante}}, por meio de {{setor_responsavel}}, torna público para conhecimento dos interessados que realizará licitação na modalidade PREGÃO ELETRÔNICO, do tipo {{tipo_pregao}}, objetivando a {{objeto_licitacao}}.

## 2. DO OBJETO
{{objeto_detalhado}}

## 3. DAS CONDIÇÕES DE PARTICIPAÇÃO
{{condicoes_participacao}}

## 4. DO CREDENCIAMENTO
{{instrucoes_credenciamento}}

## 5. DA PROPOSTA
{{instrucoes_proposta}}

## 6. DO JULGAMENTO
{{criterios_julgamento}}

## 7. DOS RECURSOS
{{procedimentos_recursos}}

## 8. DA ADJUDICAÇÃO E HOMOLOGAÇÃO
{{procedimentos_adjudicacao}}

## 9. DO CONTRATO
{{clausulas_contratuais}}

## 10. DAS DISPOSIÇÕES FINAIS
{{disposicoes_finais}}

{{local_data}}
{{autoridade_competente}}`,
    variables: [
      { name: 'numero_pregao', type: 'text', description: 'Número do pregão', required: true },
      { name: 'ano', type: 'number', description: 'Ano do pregão', required: true },
      { name: 'orgao_licitante', type: 'text', description: 'Nome do órgão licitante', required: true },
      { name: 'objeto_licitacao', type: 'text', description: 'Objeto da licitação', required: true }
    ],
    sections: [
      { id: 'preambulo', name: 'Preâmbulo', content: '', required: true, order: 1 },
      { id: 'objeto', name: 'Do Objeto', content: '', required: true, order: 2 },
      { id: 'participacao', name: 'Das Condições de Participação', content: '', required: true, order: 3 }
    ],
    createdAt: new Date(),
    author: 'Sistema',
    version: '1.0'
  }
];

export const TemplateManager: React.FC = () => {
  const { control } = useFormContext();
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'templates'
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);

  // New template form state
  const [newTemplate, setNewTemplate] = useState<Partial<DocumentTemplate>>({
    name: '',
    description: '',
    documentType: 'outros',
    content: '',
    isDefault: false,
    isActive: true,
    variables: [],
    sections: []
  });

  // Combine default templates with user templates
  const allTemplates = [...DEFAULT_TEMPLATES, ...fields] as DocumentTemplate[];

  // Filter templates
  const filteredTemplates = allTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || template.documentType === filterType;
    const matchesActive = showInactive || template.isActive;
    
    return matchesSearch && matchesType && matchesActive;
  });

  // Add new template
  const handleAddTemplate = () => {
    if (!newTemplate.name?.trim() || !newTemplate.content?.trim()) return;
    
    const template: DocumentTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name.trim(),
      description: newTemplate.description?.trim() || '',
      documentType: newTemplate.documentType!,
      content: newTemplate.content.trim(),
      isDefault: false,
      isActive: newTemplate.isActive || true,
      variables: newTemplate.variables || [],
      sections: newTemplate.sections || [],
      createdAt: new Date(),
      lastModified: new Date(),
      author: 'Usuário',
      version: '1.0'
    };
    
    append(template);
    
    // Reset form
    setNewTemplate({
      name: '',
      description: '',
      documentType: 'outros',
      content: '',
      isDefault: false,
      isActive: true,
      variables: [],
      sections: []
    });
    setIsAddDialogOpen(false);
  };

  // Edit template
  const handleEditTemplate = (template: DocumentTemplate) => {
    setEditingTemplate(template);
    setNewTemplate(template);
    setIsAddDialogOpen(true);
  };

  // Update template
  const handleUpdateTemplate = () => {
    if (!editingTemplate || !newTemplate.name?.trim() || !newTemplate.content?.trim()) return;
    
    const templateIndex = fields.findIndex((field: any) => field.id === editingTemplate.id);
    if (templateIndex === -1) return;
    
    const updatedTemplate = {
      ...editingTemplate,
      ...newTemplate,
      name: newTemplate.name!.trim(),
      content: newTemplate.content!.trim(),
      lastModified: new Date()
    };
    
    update(templateIndex, updatedTemplate);
    
    setEditingTemplate(null);
    setNewTemplate({
      name: '',
      description: '',
      documentType: 'outros',
      content: '',
      isDefault: false,
      isActive: true,
      variables: [],
      sections: []
    });
    setIsAddDialogOpen(false);
  };

  // Clone template
  const handleCloneTemplate = (template: DocumentTemplate) => {
    const clonedTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Cópia)`,
      isDefault: false,
      createdAt: new Date(),
      lastModified: new Date(),
      version: '1.0'
    };
    
    append(clonedTemplate);
  };

  // Export template
  const handleExportTemplate = (template: DocumentTemplate) => {
    const templateData = JSON.stringify(template, null, 2);
    const blob = new Blob([templateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import template
  const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target?.result as string);
        const importedTemplate: DocumentTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          isDefault: false,
          createdAt: new Date(),
          lastModified: new Date()
        };
        
        append(importedTemplate);
      } catch (error) {
        alert('Erro ao importar template. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
  };

  // Set as default template
  const handleSetDefault = (templateId: string, documentType: string) => {
    // Remove default flag from other templates of the same type
    const updatedFields = fields.map((field: any) => {
      if (field.documentType === documentType && field.id !== templateId) {
        return { ...field, isDefault: false };
      } else if (field.id === templateId) {
        return { ...field, isDefault: true };
      }
      return field;
    });
    
    // Update all fields
    updatedFields.forEach((field, index) => {
      update(index, field);
    });
  };

  const getDocumentTypeInfo = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type) || DOCUMENT_TYPES[5];
  };

  // Preview template with variable substitution
  const renderTemplatePreview = (template: DocumentTemplate) => {
    let content = template.content;
    
    // Replace variables with placeholder values
    template.variables?.forEach(variable => {
      const placeholder = `{{${variable.name}}}`;
      const replacement = variable.defaultValue || `[${variable.description}]`;
      content = content.replace(new RegExp(placeholder, 'g'), replacement);
    });
    
    return content;
  };

  return (
    <TooltipProvider>
      <FormField
        control={control}
        name="templates"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Gerenciamento de Templates
            </FormLabel>
            <FormDescription>
              Gerencie templates de documentos para facilitar a criação de editais e contratos
              padronizados para sua organização.
            </FormDescription>

            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {DOCUMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                  <Label className="text-sm">Mostrar inativos</Label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {filteredTemplates.length} template(s) encontrado(s)
                </div>

                <div className="flex space-x-2">
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportTemplate}
                      className="hidden"
                      id="import-template"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('import-template')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Importar
                    </Button>
                  </div>

                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingTemplate(null);
                          setNewTemplate({
                            name: '',
                            description: '',
                            documentType: 'outros',
                            content: '',
                            isDefault: false,
                            isActive: true,
                            variables: [],
                            sections: []
                          });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Template
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingTemplate 
                            ? 'Modifique o template de documento.'
                            : 'Crie um novo template para padronizar documentos da sua organização.'
                          }
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                          <TabsTrigger value="content">Conteúdo</TabsTrigger>
                          <TabsTrigger value="variables">Variáveis</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="basic" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="template-name">Nome do Template *</Label>
                              <Input
                                id="template-name"
                                value={newTemplate.name || ''}
                                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Edital de Pregão Padrão"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="template-type">Tipo de Documento</Label>
                              <Select 
                                value={newTemplate.documentType} 
                                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, documentType: value }))}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOCUMENT_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.icon} {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="template-description">Descrição</Label>
                            <Textarea
                              id="template-description"
                              value={newTemplate.description || ''}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Descreva o propósito e uso deste template"
                              rows={3}
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="content" className="space-y-4">
                          <div>
                            <Label htmlFor="template-content">Conteúdo do Template *</Label>
                            <Textarea
                              id="template-content"
                              value={newTemplate.content || ''}
                              onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                              placeholder="Digite o conteúdo do template usando {{variavel}} para campos dinâmicos"
                              rows={20}
                              className="font-mono text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use {{nome_variavel}} para campos que serão substituídos dinamicamente
                            </p>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="variables" className="space-y-4">
                          <div className="text-sm text-gray-600">
                            Configure as variáveis que podem ser substituídas no template
                          </div>
                          
                          <Card className="border-dashed border-2">
                            <CardContent className="text-center py-8">
                              <Code className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm text-gray-500">
                                Funcionalidade de variáveis será implementada em versões futuras
                              </p>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                      
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
                          onClick={editingTemplate ? handleUpdateTemplate : handleAddTemplate}
                          disabled={!newTemplate.name?.trim() || !newTemplate.content?.trim()}
                        >
                          {editingTemplate ? 'Atualizar' : 'Criar'} Template
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTemplates.length === 0 ? (
                  <div className="lg:col-span-2">
                    <Card className="border-dashed border-2">
                      <CardContent className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500 mb-2">
                          Nenhum template encontrado
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          {allTemplates.length === 0 
                            ? 'Crie seu primeiro template para padronizar documentos'
                            : 'Tente ajustar os filtros ou criar um novo template'
                          }
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddDialogOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Template
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  filteredTemplates.map((template) => {
                    const typeInfo = getDocumentTypeInfo(template.documentType);
                    const isUserTemplate = !template.isDefault;
                    
                    return (
                      <Card
                        key={template.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md",
                          !template.isActive && "opacity-60",
                          template.isDefault && "ring-2 ring-blue-200 bg-blue-50"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100">
                                <span className="text-xl">{typeInfo.icon}</span>
                              </div>
                              <div>
                                <CardTitle className="text-lg flex items-center">
                                  {template.name}
                                  {template.isDefault && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Star className="h-4 w-4 ml-2 text-yellow-500 fill-current" />
                                      </TooltipTrigger>
                                      <TooltipContent>Template padrão</TooltipContent>
                                    </Tooltip>
                                  )}
                                </CardTitle>
                                <CardDescription>{template.description}</CardDescription>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Badge className="text-xs">
                                {typeInfo.label}
                              </Badge>
                              {!template.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            {/* Template Stats */}
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Versão: {template.version || '1.0'}</span>
                              <span>Por: {template.author || 'Sistema'}</span>
                            </div>
                            
                            {/* Content Preview */}
                            <div className="bg-gray-50 rounded-md p-3">
                              <p className="text-xs text-gray-600 font-mono line-clamp-3">
                                {template.content.substring(0, 150)}...
                              </p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <div className="flex space-x-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setPreviewTemplate(template);
                                        setIsPreviewOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Visualizar</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCloneTemplate(template)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Duplicar</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleExportTemplate(template)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Exportar</TooltipContent>
                                </Tooltip>
                                
                                {isUserTemplate && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleEditTemplate(template)}
                                        >
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Editar</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                          onClick={() => {
                                            if (window.confirm('Tem certeza que deseja excluir este template?')) {
                                              const index = fields.findIndex((field: any) => field.id === template.id);
                                              if (index !== -1) remove(index);
                                            }
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Excluir</TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </div>
                              
                              {isUserTemplate && !template.isDefault && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSetDefault(template.id, template.documentType)}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Definir como Padrão
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Template Preview Dialog */}
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Visualizar Template: {previewTemplate?.name}
                    </DialogTitle>
                    <DialogDescription>
                      Preview do conteúdo do template com substituição de variáveis
                    </DialogDescription>
                  </DialogHeader>
                  
                  {previewTemplate && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm font-mono">
                          {renderTemplatePreview(previewTemplate)}
                        </pre>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
};