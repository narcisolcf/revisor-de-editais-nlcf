/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  Zap,
  Star
} from 'lucide-react';
import { TemplateStructure } from '../../types/template';
import { 
  getCategoryIcon, 
  getStatusBadgeVariant, 
  getStatusBadgeText 
} from '../../utils/templateUtils';

interface TemplateCardProps {
  template: TemplateStructure;
  viewMode: 'grid' | 'list';
  onPreview: (_template: TemplateStructure) => void;
  onApply: (_templateId: string) => void;
  onEdit: (_template: TemplateStructure) => void;
  onDuplicate: (_template: TemplateStructure) => void;
  onDelete: (_templateId: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  onPreview,
  onApply,
  onEdit,
  onDuplicate,
  onDelete
}) => {
  const CategoryIcon = getCategoryIcon(template.metadata.category);
  const statusBadgeVariant = getStatusBadgeVariant(template);
  const statusBadgeText = getStatusBadgeText(template);

  if (viewMode === 'grid') {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="w-4 h-4" />
              <div>
                <CardTitle className="text-lg">{template.metadata.name}</CardTitle>
                <p className="text-sm text-gray-600">{template.metadata.description}</p>
              </div>
            </div>
            <Badge variant={statusBadgeVariant}>{statusBadgeText}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Versão</span>
            <Badge variant="outline">{template.metadata.version}</Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uso</span>
            <span className="font-medium">{template.metadata.usageCount}x</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Avaliação</span>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="font-medium">{template.metadata.rating}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Seções</span>
            <span className="font-medium">{template.sections.length}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Atualizado</span>
            <span className="text-xs text-gray-500">
              {template.metadata.updatedAt.toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(template)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => onApply(template.metadata.id)}
              className="flex-1"
            >
              <Zap className="w-4 h-4 mr-1" />
              Aplicar
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(template)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate(template)}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(template.metadata.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List view
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CategoryIcon className="w-4 h-4" />
            <div>
              <h3 className="font-semibold">{template.metadata.name}</h3>
              <p className="text-sm text-gray-600">{template.metadata.description}</p>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span>v{template.metadata.version}</span>
                <span>•</span>
                <span>{template.metadata.usageCount} usos</span>
                <span>•</span>
                <span>⭐ {template.metadata.rating}</span>
                <span>•</span>
                <span>{template.sections.length} seções</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={statusBadgeVariant}>{statusBadgeText}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(template)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              onClick={() => onApply(template.metadata.id)}
            >
              <Zap className="w-4 h-4 mr-1" />
              Aplicar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
