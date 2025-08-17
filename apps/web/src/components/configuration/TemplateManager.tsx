import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Plus, 
  Upload
} from 'lucide-react';
import { useTemplateManager } from '../../hooks/useTemplateManager';
import { TemplateUploader } from './TemplateUploader';
import { TemplateEditor } from './TemplateEditor';
import { TemplatePreview } from './TemplatePreview';
import { TemplateAnalytics } from './TemplateAnalytics';
import { TemplateVersioning } from './TemplateVersioning';
import { TemplateCard } from './TemplateCard';
import { TemplateFilters } from './TemplateFilters';
import { CategoryOverview } from './CategoryOverview';

interface TemplateManagerProps {
  organizationId: string;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  organizationId
}) => {
  const [activeTab, setActiveTab] = useState('templates');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  
  const {
    templates,
    filteredTemplates,
    searchQuery,
    categoryFilter,
    statusFilter,
    sortBy,
    selectedTemplate,
    isUploading,
    isEditing,
    isPreviewing,
    handleSearchChange,
    handleCategoryFilterChange,
    handleStatusFilterChange,
    handleSortChange,
    handleViewModeChange,
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
  } = useTemplateManager(organizationId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de Templates</h1>
          <p className="text-gray-600">
            Gerencie templates de análise para diferentes tipos de documentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            // Abrir modal de upload
            console.log('Abrir modal de upload');
          }}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Template
          </Button>
          <Button onClick={() => {
            // Abrir modal de edição
            console.log('Abrir modal de edição');
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <TemplateFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        sortBy={sortBy}
        viewMode={viewMode}
        onSearchChange={handleSearchChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onSortChange={handleSortChange}
        onViewModeChange={handleViewModeChange}
      />

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="versioning">Versionamento</TabsTrigger>
        </TabsList>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.metadata.id}
                  template={template}
                  viewMode="grid"
                  onPreview={handleTemplatePreview}
                  onApply={handleTemplateApply}
                  onEdit={handleTemplateEdit}
                  onDuplicate={handleTemplateDuplicate}
                  onDelete={handleTemplateDelete}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.metadata.id}
                  template={template}
                  viewMode="list"
                  onPreview={handleTemplatePreview}
                  onApply={handleTemplateApply}
                  onEdit={handleTemplateEdit}
                  onDuplicate={handleTemplateDuplicate}
                  onDelete={handleTemplateDelete}
                />
              ))}
            </div>
          )}
          
          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
                  📄
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum template encontrado</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece criando seu primeiro template'
                  }
                </p>
                <Button onClick={() => handleEditClose()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="space-y-6">
          <CategoryOverview 
            templates={templates}
            onCategorySelect={(category) => {
              handleCategoryFilterChange(category);
              setActiveTab('templates');
            }}
          />
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics">
          <TemplateAnalytics organizationId={organizationId} />
        </TabsContent>

        {/* Tab: Versioning */}
        <TabsContent value="versioning">
          <TemplateVersioning organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Modais */}
      {isUploading && (
        <TemplateUploader
          organizationId={organizationId}
          onClose={handleUploadClose}
          onSuccess={handleUploadSuccess}
        />
      )}

      {isEditing && (
        <TemplateEditor
          template={selectedTemplate}
          organizationId={organizationId}
          onClose={handleEditClose}
          onSave={handleEditSuccess}
        />
      )}

      {isPreviewing && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onClose={handlePreviewClose}
          onApply={() => {
            handleTemplateApply(selectedTemplate.metadata.id);
            handlePreviewClose();
          }}
        />
      )}
    </div>
  );
};
