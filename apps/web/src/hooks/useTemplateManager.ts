import { useState, useMemo, useCallback } from 'react';
import { TemplateStructure } from '../types/template';

export const useTemplateManager = (organizationId: string) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'rating' | 'updated'>('updated');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStructure | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Mock data - em produção viria de API
  const templates: TemplateStructure[] = useMemo(() => [
    {
      sections: [
        {
          id: '1',
          name: 'Objeto da Contratação',
          description: 'Descrição clara do objeto a ser contratado',
          required: true,
          order: 1,
          validationRules: [
            {
              id: '1',
              type: 'presence',
              condition: 'required',
              message: 'Seção obrigatória',
              severity: 'error',
              enabled: true
            }
          ],
          scoringWeight: 25,
          keywords: ['OBJETO', 'CONTRATAÇÃO', 'SERVIÇO'],
          patterns: ['objeto.*contratação', 'serviço.*prestação'],
          examples: ['Objeto da Contratação: Prestação de serviços de...']
        }
      ],
      requiredFields: ['objeto', 'justificativa', 'critérios'],
      scoringWeights: { structural: 30, legal: 25, clarity: 25, abnt: 20 },
      validationRules: [],
      metadata: {
        id: '1',
        name: 'Template Edital Obra Pública',
        description: 'Template padrão para editais de obra pública',
        category: 'edital',
        subcategory: 'obra_publica',
        version: '1.0.0',
        author: 'Equipe Jurídica',
        organizationId,
        tags: ['obra', 'pública', 'edital'],
        isPublic: true,
        isActive: true,
        usageCount: 45,
        rating: 4.8,
        lastUsed: new Date(),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      }
    }
  ], [organizationId]);

  // Computed values
  const filteredTemplates = useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || template.metadata.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && template.metadata.isActive) ||
                           (statusFilter === 'inactive' && !template.metadata.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case 'name':
          aValue = a.metadata.name;
          bValue = b.metadata.name;
          break;
        case 'usage':
          aValue = a.metadata.usageCount;
          bValue = b.metadata.usageCount;
          break;
        case 'rating':
          aValue = a.metadata.rating;
          bValue = b.metadata.rating;
          break;
        case 'updated':
        default:
          aValue = a.metadata.updatedAt;
          bValue = b.metadata.updatedAt;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [templates, searchQuery, categoryFilter, statusFilter, sortBy, sortOrder]);

  // Handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryFilterChange = useCallback((category: string) => {
    setCategoryFilter(category);
  }, []);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(status);
  }, []);

  const handleSortChange = useCallback((field: 'name' | 'usage' | 'rating' | 'updated') => {
    setSortBy(field);
  }, []);

  const handleViewModeChange = useCallback(() => {
    // Implementar mudança de view mode se necessário
  }, []);

  const handleTemplateSelect = useCallback((template: TemplateStructure) => {
    setSelectedTemplate(template);
  }, []);

  const handleTemplateApply = useCallback((templateId: string) => {
    console.log('Template aplicado:', templateId);
  }, []);

  const handleTemplateEdit = useCallback((template: TemplateStructure) => {
    setSelectedTemplate(template);
    setIsEditing(true);
  }, []);

  const handleTemplatePreview = useCallback((template: TemplateStructure) => {
    setSelectedTemplate(template);
    setIsPreviewing(true);
  }, []);

  const handleTemplateDuplicate = useCallback((template: TemplateStructure) => {
    const duplicated = {
      ...template,
      metadata: {
        ...template.metadata,
        id: `dup_${Date.now()}`,
        name: `${template.metadata.name} (Cópia)`,
        version: '1.0.0',
        usageCount: 0,
        rating: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    // Em produção, salvaria no backend
    console.log('Template duplicado:', duplicated);
  }, []);

  const handleTemplateDelete = useCallback((templateId: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      // Em produção, deletaria do backend
      console.log('Template deletado:', templateId);
    }
  }, []);

  const handleUploadClose = useCallback(() => {
    setIsUploading(false);
  }, []);

  const handleEditClose = useCallback(() => {
    setIsEditing(false);
    setSelectedTemplate(null);
  }, []);

  const handlePreviewClose = useCallback(() => {
    setIsPreviewing(false);
    setSelectedTemplate(null);
  }, []);

  const handleUploadSuccess = useCallback((template: TemplateStructure) => {
    setIsUploading(false);
    console.log('Template criado:', template);
    // Em produção, atualizaria a lista de templates
  }, []);

  const handleEditSuccess = useCallback((template: TemplateStructure) => {
    setIsEditing(false);
    setSelectedTemplate(null);
    console.log('Template salvo:', template);
    // Em produção, atualizaria a lista de templates
  }, []);

  return {
    // Data
    templates,
    filteredTemplates,
    
    // Filters
    searchQuery,
    categoryFilter,
    statusFilter,
    sortBy,
    sortOrder,
    
    // UI State
    selectedTemplate,
    isUploading,
    isEditing,
    isPreviewing,
    
    // Handlers
    handleSearchChange,
    handleCategoryFilterChange,
    handleStatusFilterChange,
    handleSortChange,
    handleViewModeChange,
    handleTemplateSelect,
    handleTemplateApply,
    handleTemplateEdit,
    handleTemplatePreview,
    handleTemplateDuplicate,
    handleTemplateDelete,
    handleUploadClose,
    handleEditClose,
    handlePreviewClose,
    handleUploadSuccess,
    handleEditSuccess
  };
};
