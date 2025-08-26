/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { FileText, Shield, Target, MapPin, FileCode } from 'lucide-react';
import { TemplateStructure } from '../../types/template';

interface CategoryOverviewProps {
  templates: TemplateStructure[];
  onCategorySelect: (_category: string) => void;
}

const CATEGORIES = [
  { key: 'edital', label: 'Editais', description: 'Templates para editais de licitação', icon: FileText },
  { key: 'tr', label: 'Termos de Referência', description: 'Templates para TRs de projetos', icon: Target },
  { key: 'etp', label: 'ETPs', description: 'Templates para estudos técnicos', icon: Shield },
  { key: 'mapa_risco', label: 'Mapas de Risco', description: 'Templates para análise de riscos', icon: MapPin },
  { key: 'minuta', label: 'Minutas', description: 'Templates para contratos e minutas', icon: FileCode }
];

export const CategoryOverview: React.FC<CategoryOverviewProps> = ({
  templates,
  onCategorySelect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {CATEGORIES.map((category) => {
        const Icon = category.icon;
        const categoryTemplates = templates.filter(t => t.metadata.category === category.key);
        const activeTemplates = categoryTemplates.filter(t => t.metadata.isActive);
        
        return (
          <Card key={category.key} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{category.label}</CardTitle>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{categoryTemplates.length}</div>
                  <div className="text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeTemplates.length}</div>
                  <div className="text-gray-600">Ativos</div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onCategorySelect(category.key)}
              >
                Ver Templates
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
