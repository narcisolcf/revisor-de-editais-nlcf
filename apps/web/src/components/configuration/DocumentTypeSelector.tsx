/**
 * Document Type Selector Component
 * 
 * Allows users to select and configure document types for analysis
 * following GOV.BR design patterns
 */

import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Search,
  Filter,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Checkbox } from '@/src/components/ui/checkbox';
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
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/src/components/ui/select';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/src/components/ui/form';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  category: 'licitacao' | 'contrato' | 'ata' | 'edital' | 'termo' | 'outros';
  isDefault: boolean;
  isActive: boolean;
  validationRules?: string[];
  requiredFields?: string[];
  template?: string;
}

const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'edital-pregao',
    name: 'Edital de Pregão Eletrônico',
    description: 'Documentos de pregão eletrônico para aquisição de bens e serviços',
    category: 'edital',
    isDefault: true,
    isActive: true,
    validationRules: ['objeto_claro', 'prazo_entrega', 'valor_referencia'],
    requiredFields: ['objeto', 'valor_estimado', 'prazo_entrega', 'critério_julgamento']
  },
  {
    id: 'edital-concorrencia',
    name: 'Edital de Concorrência',
    description: 'Documentos de concorrência pública para obras e serviços de engenharia',
    category: 'edital',
    isDefault: true,
    isActive: true,
    validationRules: ['projeto_basico', 'orcamento_detalhado', 'cronograma'],
    requiredFields: ['projeto_basico', 'orçamento', 'cronograma_execução']
  },
  {
    id: 'contrato-fornecimento',
    name: 'Contrato de Fornecimento',
    description: 'Contratos para fornecimento de bens e materiais',
    category: 'contrato',
    isDefault: true,
    isActive: true,
    validationRules: ['clausulas_contratuais', 'penalidades', 'garantias'],
    requiredFields: ['objeto', 'valor', 'prazo_vigencia', 'penalidades']
  },
  {
    id: 'ata-registro-precos',
    name: 'Ata de Registro de Preços',
    description: 'Documentos de registro de preços para contratações futuras',
    category: 'ata',
    isDefault: true,
    isActive: true,
    validationRules: ['validade_ata', 'precos_registrados', 'fornecedores'],
    requiredFields: ['validade', 'itens_registrados', 'fornecedores_habilitados']
  },
  {
    id: 'termo-referencia',
    name: 'Termo de Referência',
    description: 'Documentos técnicos que definem o objeto da contratação',
    category: 'termo',
    isDefault: true,
    isActive: false,
    validationRules: ['especificacoes_tecnicas', 'quantitativos', 'metodologia'],
    requiredFields: ['especificações', 'quantitativos', 'metodologia']
  }
];

const DOCUMENT_CATEGORIES = [
  { value: 'licitacao', label: 'Licitação', color: 'bg-blue-100 text-blue-800' },
  { value: 'contrato', label: 'Contratos', color: 'bg-green-100 text-green-800' },
  { value: 'ata', label: 'Atas', color: 'bg-purple-100 text-purple-800' },
  { value: 'edital', label: 'Editais', color: 'bg-orange-100 text-orange-800' },
  { value: 'termo', label: 'Termos', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'outros', label: 'Outros', color: 'bg-gray-100 text-gray-800' }
];

export const DocumentTypeSelector: React.FC = () => {
  const { control, watch, setValue } = useFormContext();
  const selectedTypes = watch('documentTypes') || [];
  
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(DEFAULT_DOCUMENT_TYPES);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<DocumentType | null>(null);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // New document form state
  const [newType, setNewType] = useState<Partial<DocumentType>>({
    name: '',
    description: '',
    category: 'outros',
    isDefault: false,
    isActive: true,
    validationRules: [],
    requiredFields: []
  });

  // Filter document types
  const filteredTypes = documentTypes.filter(type => {
    const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || type.category === filterCategory;
    const matchesSelection = !showOnlySelected || selectedTypes.includes(type.id);
    
    return matchesSearch && matchesCategory && matchesSelection;
  });

  // Handle type selection
  const handleTypeToggle = (typeId: string) => {
    const newSelection = selectedTypes.includes(typeId)
      ? selectedTypes.filter((id: string) => id !== typeId)
      : [...selectedTypes, typeId];
    
    setValue('documentTypes', newSelection, { shouldDirty: true });
  };

  // Select all visible types
  const handleSelectAll = () => {
    const visibleTypeIds = filteredTypes.map(type => type.id);
    const newSelection = [...new Set([...selectedTypes, ...visibleTypeIds])];
    setValue('documentTypes', newSelection, { shouldDirty: true });
  };

  // Deselect all visible types
  const handleDeselectAll = () => {
    const visibleTypeIds = new Set(filteredTypes.map(type => type.id));
    const newSelection = selectedTypes.filter((id: string) => !visibleTypeIds.has(id));
    setValue('documentTypes', newSelection, { shouldDirty: true });
  };

  // Add new document type
  const handleAddType = () => {
    if (!newType.name?.trim()) return;
    
    const id = `custom-${Date.now()}`;
    const customType: DocumentType = {
      id,
      name: newType.name.trim(),
      description: newType.description?.trim() || '',
      category: newType.category as DocumentType['category'],
      isDefault: false,
      isActive: true,
      validationRules: newType.validationRules || [],
      requiredFields: newType.requiredFields || []
    };
    
    setDocumentTypes(prev => [...prev, customType]);
    setValue('documentTypes', [...selectedTypes, id], { shouldDirty: true });
    
    // Reset form
    setNewType({
      name: '',
      description: '',
      category: 'outros',
      isDefault: false,
      isActive: true,
      validationRules: [],
      requiredFields: []
    });
    setIsAddDialogOpen(false);
  };

  // Edit document type
  const handleEditType = (type: DocumentType) => {
    setEditingType(type);
    setNewType(type);
    setIsAddDialogOpen(true);
  };

  // Update document type
  const handleUpdateType = () => {
    if (!editingType || !newType.name?.trim()) return;
    
    setDocumentTypes(prev => 
      prev.map(type => 
        type.id === editingType.id 
          ? { ...type, ...newType, name: newType.name!.trim() }
          : type
      )
    );
    
    setEditingType(null);
    setNewType({
      name: '',
      description: '',
      category: 'outros',
      isDefault: false,
      isActive: true,
      validationRules: [],
      requiredFields: []
    });
    setIsAddDialogOpen(false);
  };

  // Delete document type
  const handleDeleteType = (typeId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de documento?')) {
      setDocumentTypes(prev => prev.filter(type => type.id !== typeId));
      setValue('documentTypes', selectedTypes.filter((id: string) => id !== typeId), { shouldDirty: true });
    }
  };

  const getCategoryInfo = (category: string) => {
    return DOCUMENT_CATEGORIES.find(cat => cat.value === category) || DOCUMENT_CATEGORIES[5];
  };

  return (
    <TooltipProvider>
      <FormField
        control={control}
        name="documentTypes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold">
              Tipos de Documento para Análise
            </FormLabel>
            <FormDescription>
              Selecione os tipos de documentos que sua organização precisa analisar. 
              Você pode usar os tipos predefinidos ou criar tipos personalizados.
            </FormDescription>
            
            <div className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar tipos de documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {DOCUMENT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={filteredTypes.length === 0}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Selecionar Todos
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedTypes.length === 0}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Desmarcar Todos
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    className={showOnlySelected ? 'bg-blue-50 text-blue-700' : ''}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {showOnlySelected ? 'Mostrar Todos' : 'Apenas Selecionados'}
                  </Button>
                </div>

                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingType(null);
                        setNewType({
                          name: '',
                          description: '',
                          category: 'outros',
                          isDefault: false,
                          isActive: true,
                          validationRules: [],
                          requiredFields: []
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Tipo Personalizado
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingType ? 'Editar Tipo de Documento' : 'Adicionar Novo Tipo de Documento'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingType 
                          ? 'Modifique as informações do tipo de documento.'
                          : 'Crie um novo tipo de documento personalizado para sua organização.'
                        }
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="type-name">Nome do Tipo *</Label>
                        <Input
                          id="type-name"
                          value={newType.name || ''}
                          onChange={(e) => setNewType(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Edital de Pregão Presencial"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="type-description">Descrição</Label>
                        <Textarea
                          id="type-description"
                          value={newType.description || ''}
                          onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Descreva o propósito e características deste tipo de documento"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="type-category">Categoria</Label>
                        <Select 
                          value={newType.category} 
                          onValueChange={(value) => setNewType(prev => ({ ...prev, category: value as DocumentType['category'] }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
                        onClick={editingType ? handleUpdateType : handleAddType}
                        disabled={!newType.name?.trim()}
                      >
                        {editingType ? 'Atualizar' : 'Adicionar'} Tipo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Selection Summary */}
              {selectedTypes.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedTypes.length}</strong> tipo(s) de documento selecionado(s) para análise
                  </p>
                </div>
              )}

              {/* Document Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTypes.map((type) => {
                  const isSelected = selectedTypes.includes(type.id);
                  const categoryInfo = getCategoryInfo(type.category);
                  
                  return (
                    <div
                      key={type.id}
                      className={cn(
                        "border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:shadow-md",
                        isSelected 
                          ? "border-blue-500 bg-blue-50 shadow-sm" 
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => handleTypeToggle(type.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleTypeToggle(type.id)}
                            className="mt-0.5"
                          />
                          <FileText className={cn(
                            "h-5 w-5",
                            isSelected ? "text-blue-600" : "text-gray-500"
                          )} />
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Badge className={cn("text-xs", categoryInfo.color)}>
                            {categoryInfo.label}
                          </Badge>
                          
                          {type.isDefault && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  Padrão
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Tipo de documento padrão do sistema</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          
                          {!type.isDefault && (
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditType(type);
                                }}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteType(type.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className={cn(
                          "font-medium mb-1",
                          isSelected ? "text-blue-900" : "text-gray-900"
                        )}>
                          {type.name}
                        </h4>
                        <p className={cn(
                          "text-sm",
                          isSelected ? "text-blue-700" : "text-gray-600"
                        )}>
                          {type.description}
                        </p>
                        
                        {type.requiredFields && type.requiredFields.length > 0 && (
                          <div className="mt-2">
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Info className="h-3 w-3 mr-1" />
                                  {type.requiredFields.length} campo(s) obrigatório(s)
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  <p className="font-medium mb-1">Campos obrigatórios:</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {type.requiredFields.map((field, index) => (
                                      <li key={index}>{field}</li>
                                    ))}
                                  </ul>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTypes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Nenhum tipo de documento encontrado</p>
                  <p className="text-sm">
                    Tente ajustar os filtros ou adicionar um novo tipo personalizado.
                  </p>
                </div>
              )}
            </div>
            
            <FormMessage />
          </FormItem>
        )}
      />
    </TooltipProvider>
  );
};