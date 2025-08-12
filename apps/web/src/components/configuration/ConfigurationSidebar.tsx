/**
 * Configuration Sidebar Component
 * 
 * Navigation sidebar for configuration sections following GOV.BR design patterns
 */

import React from 'react';
import { 
  FileText, 
  Sliders, 
  Code, 
  FolderOpen, 
  Settings,
  CheckCircle,
  AlertCircle,
  Circle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

export interface ConfigurationSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
  status: 'completed' | 'error' | 'pending';
}

export interface ConfigurationSidebarProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
  progress: number;
  errors: Record<string, any>;
}

const sections: ConfigurationSection[] = [
  {
    id: 'document-types',
    title: 'Tipos de Documento',
    description: 'Selecione os tipos de documentos a serem analisados',
    icon: FileText,
    required: true,
    status: 'pending'
  },
  {
    id: 'weights',
    title: 'Pesos dos Parâmetros',
    description: 'Configure a importância de cada categoria',
    icon: Sliders,
    required: true,
    status: 'pending'
  },
  {
    id: 'rules',
    title: 'Regras Personalizadas',
    description: 'Defina regras específicas da organização',
    icon: Code,
    required: false,
    status: 'pending'
  },
  {
    id: 'templates',
    title: 'Templates',
    description: 'Gerencie templates de documentos',
    icon: FolderOpen,
    required: false,
    status: 'pending'
  },
  {
    id: 'presets',
    title: 'Configurações Predefinidas',
    description: 'Use configurações otimizadas',
    icon: Settings,
    required: false,
    status: 'pending'
  }
];

export const ConfigurationSidebar: React.FC<ConfigurationSidebarProps> = ({
  currentSection,
  onSectionChange,
  progress,
  errors
}) => {
  // Determine section status based on progress and errors
  const getSectionStatus = (section: ConfigurationSection): 'completed' | 'error' | 'pending' => {
    const hasError = errors[section.id];
    if (hasError) return 'error';
    
    // This would be determined by actual form validation in a real implementation
    switch (section.id) {
      case 'document-types':
        return progress > 20 ? 'completed' : 'pending';
      case 'weights':
        return progress > 40 ? 'completed' : 'pending';
      case 'rules':
        return progress > 60 ? 'completed' : 'pending';
      case 'templates':
        return progress > 80 ? 'completed' : 'pending';
      case 'presets':
        return progress === 100 ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const getStatusIcon = (status: 'completed' | 'error' | 'pending') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'text-red-600';
    if (progress < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Progresso da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completado</span>
              <span className={cn("text-sm font-medium", getProgressColor(progress))}>
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-gray-500">
              {progress < 100 
                ? 'Complete todas as seções obrigatórias para ativar a configuração'
                : 'Configuração pronta para uso!'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Sections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Seções de Configuração</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <nav className="space-y-1">
            {sections.map((section) => {
              const status = getSectionStatus(section);
              const IconComponent = section.icon;
              const isActive = currentSection === section.id;
              
              return (
                <Button
                  key={section.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-auto p-4 text-left",
                    isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className="flex items-center space-x-2 mt-0.5">
                      <IconComponent className={cn(
                        "h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-500"
                      )} />
                      {getStatusIcon(status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-blue-700" : "text-gray-900"
                        )}>
                          {section.title}
                        </p>
                        {section.required && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1.5 py-0.5"
                          >
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs mt-1",
                        isActive ? "text-blue-600" : "text-gray-500"
                      )}>
                        {section.description}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-900">Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-3">
            Configure os parâmetros de análise de acordo com as necessidades 
            específicas da sua organização.
          </p>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => window.open('/docs/configuration', '_blank')}
            >
              📖 Ver Documentação
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-blue-700 border-blue-300 hover:bg-blue-100"
              onClick={() => window.open('/support', '_blank')}
            >
              💬 Suporte Técnico
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Quick setup with recommended defaults
                console.log('Quick setup triggered');
              }}
            >
              ⚡ Configuração Rápida
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Import from another organization
                console.log('Import from organization triggered');
              }}
            >
              📥 Importar de Outra Organização
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Reset to system defaults
                if (window.confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
                  console.log('Reset to defaults triggered');
                }
              }}
            >
              🔄 Restaurar Padrões
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};