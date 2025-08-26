/**
 * Componente ParameterPresets
 * 
 * Gerenciador de presets de parâmetros para o sistema LicitaReview.
 * Permite criar, aplicar e gerenciar configurações predefinidas
 * para diferentes tipos de análise e cenários.
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus,
  Settings,
  Play,
  Copy,
  Edit,
  Trash2,
  Star,
  StarOff,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Target,
  FileText,
  Users,
  Building,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';
import { cn } from '@/lib/utils';

interface ParameterPresetsProps {
  organizationId: string;
  onPresetApplied?: (presetId: string) => void;
  className?: string;
}

interface ParameterPreset {
  id: string;
  name: string;
  description: string;
  category: 'edital' | 'tr' | 'contrato' | 'projeto' | 'geral';
  parameters: Record<string, any>;
  weights: Record<string, number>;
  isDefault: boolean;
  isFavorite: boolean;
  isPublic: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PresetFilters {
  category?: string;
  search?: string;
  favorites?: boolean;
  public?: boolean;
}

export const ParameterPresets: React.FC<ParameterPresetsProps> = ({
  organizationId,
  onPresetApplied,
  className
}) => {
  const { activeConfig } = useAnalysisConfig(organizationId);
  
  // Estados locais
  const [filters, setFilters] = useState<PresetFilters>({});
  const [selectedPreset, setSelectedPreset] = useState<ParameterPreset | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<Partial<ParameterPreset>>({});
  
  // Presets predefinidos (mock data)
  const defaultPresets: ParameterPreset[] = [
    {
      id: 'edital-basico',
      name: 'Edital Básico',
      description: 'Configuração padrão para análise de editais simples',
      category: 'edital',
      parameters: {
        'check_legal_requirements': true,
        'verify_deadlines': true,
        'analyze_criteria': true,
        'check_documentation': true
      },
      weights: {
        'structural': 25,
        'legal': 35,
        'clarity': 20,
        'abnt': 10,
        'general': 10
      },
      isDefault: true,
      isFavorite: false,
      isPublic: true,
      usageCount: 156,
      rating: 4.5,
      tags: ['básico', 'edital', 'padrão'],
      createdBy: 'Sistema',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'edital-complexo',
      name: 'Edital Complexo',
      description: 'Configuração avançada para editais com múltiplos lotes e critérios específicos',
      category: 'edital',
      parameters: {
        'check_legal_requirements': true,
        'verify_deadlines': true,
        'analyze_criteria': true,
        'check_documentation': true,
        'validate_lots': true,
        'check_technical_specs': true,
        'verify_qualifications': true
      },
      weights: {
        'structural': 20,
        'legal': 40,
        'clarity': 25,
        'abnt': 10,
        'general': 5
      },
      isDefault: false,
      isFavorite: true,
      isPublic: true,
      usageCount: 89,
      rating: 4.8,
      tags: ['avançado', 'edital', 'complexo', 'lotes'],
      createdBy: 'Admin',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-02-01')
    },
    {
      id: 'tr-tecnico',
      name: 'Termo de Referência Técnico',
      description: 'Foco em especificações técnicas e requisitos funcionais',
      category: 'tr',
      parameters: {
        'check_technical_specs': true,
        'verify_requirements': true,
        'analyze_deliverables': true,
        'check_sla': true,
        'validate_metrics': true
      },
      weights: {
        'structural': 15,
        'legal': 20,
        'clarity': 35,
        'abnt': 20,
        'general': 10
      },
      isDefault: false,
      isFavorite: false,
      isPublic: true,
      usageCount: 67,
      rating: 4.3,
      tags: ['tr', 'técnico', 'especificações'],
      createdBy: 'Especialista',
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-25')
    },
    {
      id: 'contrato-servicos',
      name: 'Contrato de Serviços',
      description: 'Análise focada em cláusulas contratuais e obrigações',
      category: 'contrato',
      parameters: {
        'check_legal_clauses': true,
        'verify_obligations': true,
        'analyze_penalties': true,
        'check_payment_terms': true,
        'validate_guarantees': true
      },
      weights: {
        'structural': 20,
        'legal': 45,
        'clarity': 20,
        'abnt': 5,
        'general': 10
      },
      isDefault: false,
      isFavorite: true,
      isPublic: false,
      usageCount: 34,
      rating: 4.6,
      tags: ['contrato', 'serviços', 'cláusulas'],
      createdBy: 'Jurídico',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10')
    },
    {
      id: 'projeto-basico',
      name: 'Projeto Básico',
      description: 'Validação de projetos básicos e executivos',
      category: 'projeto',
      parameters: {
        'check_technical_drawings': true,
        'verify_specifications': true,
        'analyze_quantities': true,
        'check_standards': true
      },
      weights: {
        'structural': 30,
        'legal': 15,
        'clarity': 25,
        'abnt': 25,
        'general': 5
      },
      isDefault: false,
      isFavorite: false,
      isPublic: true,
      usageCount: 45,
      rating: 4.2,
      tags: ['projeto', 'desenhos', 'especificações'],
      createdBy: 'Engenharia',
      createdAt: new Date('2024-02-05'),
      updatedAt: new Date('2024-02-15')
    }
  ];
  
  // Filtra presets baseado nos filtros aplicados
  const filteredPresets = useMemo(() => {
    return defaultPresets.filter(preset => {
      if (filters.category && preset.category !== filters.category) return false;
      if (filters.favorites && !preset.isFavorite) return false;
      if (filters.public !== undefined && preset.isPublic !== filters.public) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          preset.name.toLowerCase().includes(searchLower) ||
          preset.description.toLowerCase().includes(searchLower) ||
          preset.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [filters]);
  
  // Categorias disponíveis
  const categories = [
    { value: 'edital', label: 'Editais', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { value: 'tr', label: 'Termos de Referência', icon: Target, color: 'bg-green-100 text-green-800' },
    { value: 'contrato', label: 'Contratos', icon: Briefcase, color: 'bg-purple-100 text-purple-800' },
    { value: 'projeto', label: 'Projetos', icon: Building, color: 'bg-orange-100 text-orange-800' },
    { value: 'geral', label: 'Geral', icon: Settings, color: 'bg-gray-100 text-gray-800' }
  ];
  
  // Aplica preset
  const handleApplyPreset = async (preset: ParameterPreset) => {
    try {
      // Implementar aplicação de preset
      console.log('Aplicando preset:', preset.id, preset.parameters, preset.weights);
      onPresetApplied?.(preset.id);
      
      // Atualiza contador de uso (mock)
      preset.usageCount += 1;
    } catch (error) {
      console.error('Erro ao aplicar preset:', error);
    }
  };
  
  // Cria novo preset
  const handleCreatePreset = async () => {
    try {
      // Implementar criação de preset
      console.log('Criando preset:', newPreset);
      setIsCreateDialogOpen(false);
      setNewPreset({});
    } catch (error) {
      console.error('Erro ao criar preset:', error);
    }
  };
  
  // Edita preset
  const handleEditPreset = async () => {
    try {
      // Implementar edição de preset
      console.log('Editando preset:', selectedPreset);
      setIsEditDialogOpen(false);
      setSelectedPreset(null);
    } catch (error) {
      console.error('Erro ao editar preset:', error);
    }
  };
  
  // Deleta preset
  const handleDeletePreset = async (presetId: string) => {
    try {
      // Implementar exclusão de preset
      console.log('Deletando preset:', presetId);
    } catch (error) {
      console.error('Erro ao deletar preset:', error);
    }
  };
  
  // Favorita/desfavorita preset
  const handleToggleFavorite = (presetId: string) => {
    const preset = defaultPresets.find(p => p.id === presetId);
    if (preset) {
      preset.isFavorite = !preset.isFavorite;
    }
  };
  
  // Renderiza card de preset
  const renderPresetCard = (preset: ParameterPreset) => {
    const category = categories.find(c => c.value === preset.category);
    const CategoryIcon = category?.icon || Settings;
    
    return (
      <Card key={preset.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn('p-2 rounded-lg', category?.color)}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center space-x-2">
                  <span>{preset.name}</span>
                  {preset.isDefault && (
                    <Badge variant="secondary" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {preset.isFavorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {preset.description}
                </CardDescription>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleApplyPreset(preset)}>
                  <Play className="mr-2 h-3 w-3" />
                  Aplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedPreset(preset);
                  setIsEditDialogOpen(true);
                }}>
                  <Edit className="mr-2 h-3 w-3" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  // Implementar duplicação
                  console.log('Duplicar preset:', preset.id);
                }}>
                  <Copy className="mr-2 h-3 w-3" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleToggleFavorite(preset.id)}>
                  {preset.isFavorite ? (
                    <StarOff className="mr-2 h-3 w-3" />
                  ) : (
                    <Star className="mr-2 h-3 w-3" />
                  )}
                  {preset.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="mr-2 h-3 w-3" />
                    Excluir
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {preset.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          {/* Estatísticas */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{preset.usageCount} usos</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{preset.rating.toFixed(1)}</span>
              </span>
            </div>
            <span>{preset.isPublic ? 'Público' : 'Privado'}</span>
          </div>
          
          {/* Pesos principais */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Distribuição de Pesos:</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(preset.weights).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}:</span>
                  <span className="font-medium">{value}%</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              onClick={() => handleApplyPreset(preset)}
              className="flex-1"
            >
              <Play className="mr-2 h-3 w-3" />
              Aplicar
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleFavorite(preset.id)}
                  >
                    {preset.isFavorite ? (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {preset.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Presets de Parâmetros</h2>
          <p className="text-gray-600">
            Configurações predefinidas para diferentes tipos de análise
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Novo Preset</DialogTitle>
                <DialogDescription>
                  Configure um novo preset de parâmetros baseado na configuração atual
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Nome</Label>
                    <Input
                      id="preset-name"
                      placeholder="Nome do preset"
                      value={newPreset.name || ''}
                      onChange={(e) => setNewPreset(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-category">Categoria</Label>
                    <Select
                      value={newPreset.category}
                      onValueChange={(value) => setNewPreset(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="preset-description">Descrição</Label>
                  <Textarea
                    id="preset-description"
                    placeholder="Descreva o propósito e uso deste preset"
                    value={newPreset.description || ''}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Configuração Base</Label>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p>Este preset será criado baseado na configuração ativa atual:</p>
                    <ul className="mt-2 space-y-1 text-gray-600">
                      <li>• Parâmetros habilitados e seus valores</li>
                      <li>• Pesos de categorias configurados</li>
                      <li>• Regras personalizadas ativas</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePreset}>
                  Criar Preset
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar presets..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex space-x-2">
              <Button
                variant={filters.favorites ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, favorites: !prev.favorites }))}
              >
                <Star className="mr-2 h-3 w-3" />
                Favoritos
              </Button>
              
              <Button
                variant={filters.public !== undefined ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  public: prev.public === undefined ? true : prev.public ? false : undefined 
                }))}
              >
                <Users className="mr-2 h-3 w-3" />
                {filters.public === undefined ? 'Todos' : filters.public ? 'Públicos' : 'Privados'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPresets.map(preset => (
          <AlertDialog key={preset.id}>
            {renderPresetCard(preset)}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o preset "{preset.name}"? 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeletePreset(preset.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}
      </div>
      
      {filteredPresets.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum preset encontrado
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Não há presets que correspondam aos filtros aplicados.
            </p>
            <Button onClick={() => setFilters({})}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Preset</DialogTitle>
            <DialogDescription>
              Modifique as configurações do preset selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedPreset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-preset-name">Nome</Label>
                  <Input
                    id="edit-preset-name"
                    value={selectedPreset.name}
                    onChange={(e) => setSelectedPreset(prev => 
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-preset-category">Categoria</Label>
                  <Select
                    value={selectedPreset.category}
                    onValueChange={(value) => setSelectedPreset(prev => 
                      prev ? { ...prev, category: value as any } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-preset-description">Descrição</Label>
                <Textarea
                  id="edit-preset-description"
                  value={selectedPreset.description}
                  onChange={(e) => setSelectedPreset(prev => 
                    prev ? { ...prev, description: e.target.value } : null
                  )}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditPreset}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParameterPresets;