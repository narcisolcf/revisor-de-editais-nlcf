/**
 * Componente ConfigurationSidebar
 * 
 * Sidebar de navegação para o sistema de configuração do LicitaReview.
 * Permite navegar entre diferentes seções de configuração e visualizar
 * o status atual das configurações.
 */

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Settings,
  FileText,
  Sliders,
  Code,
  Eye,
  Folder,
  Bookmark,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Save,
  Download,
  Upload,
  RefreshCw,
  Zap,
  BarChart3,
  Users,
  Shield
} from 'lucide-react';
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';
import { cn } from '@/lib/utils';

interface ConfigurationSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  organizationId: string;
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status?: 'completed' | 'pending' | 'warning' | 'error';
  badge?: string;
  children?: NavigationItem[];
}

interface ConfigurationStatus {
  section: string;
  status: 'completed' | 'pending' | 'warning' | 'error';
  progress: number;
  issues: number;
}

export const ConfigurationSidebar: React.FC<ConfigurationSidebarProps> = ({
  activeSection,
  onSectionChange,
  organizationId,
  className
}) => {
  const { 
    activeConfig, 
    isLoadingActiveConfig, 
    templates 
  } = useAnalysisConfig(organizationId);
  
  // Estados locais
  const [expandedSections, setExpandedSections] = useState<string[]>(['general', 'analysis']);
  
  // Estrutura de navegação
  const navigationItems: NavigationItem[] = [
    {
      id: 'general',
      label: 'Configurações Gerais',
      icon: Settings,
      description: 'Configurações básicas do sistema',
      children: [
        {
          id: 'document-types',
          label: 'Tipos de Documento',
          icon: FileText,
          description: 'Configurar tipos de documentos suportados',
          status: 'completed'
        },
        {
          id: 'organization',
          label: 'Organização',
          icon: Users,
          description: 'Configurações da organização',
          status: 'completed'
        },
        {
          id: 'security',
          label: 'Segurança',
          icon: Shield,
          description: 'Configurações de segurança e permissões',
          status: 'pending'
        }
      ]
    },
    {
      id: 'analysis',
      label: 'Configuração de Análise',
      icon: BarChart3,
      description: 'Configurações do motor de análise',
      children: [
        {
          id: 'parameter-weights',
          label: 'Pesos dos Parâmetros',
          icon: Sliders,
          description: 'Ajustar importância dos critérios de análise',
          status: 'completed',
          badge: '6 categorias'
        },
        {
          id: 'custom-rules',
          label: 'Regras Personalizadas',
          icon: Code,
          description: 'Criar e gerenciar regras específicas',
          status: 'completed',
          badge: activeConfig?.customRules?.length?.toString() || '0'
        },
        {
          id: 'validation-preview',
          label: 'Preview de Validação',
          icon: Eye,
          description: 'Testar configurações com documentos de exemplo',
          status: 'completed'
        }
      ]
    },
    {
      id: 'templates',
      label: 'Templates e Presets',
      icon: Folder,
      description: 'Gerenciar templates de configuração',
      children: [
        {
          id: 'template-manager',
          label: 'Gerenciador de Templates',
          icon: Folder,
          description: 'Criar, editar e organizar templates',
          status: 'completed'
        },
        {
          id: 'parameter-presets',
          label: 'Presets de Parâmetros',
          icon: Bookmark,
          description: 'Configurações predefinidas para diferentes cenários',
          status: 'pending'
        }
      ]
    },
    {
      id: 'advanced',
      label: 'Configurações Avançadas',
      icon: Zap,
      description: 'Configurações técnicas e experimentais',
      children: [
        {
          id: 'performance',
          label: 'Performance',
          icon: Target,
          description: 'Otimizações de performance e cache',
          status: 'pending'
        },
        {
          id: 'integrations',
          label: 'Integrações',
          icon: Database,
          description: 'APIs externas e webhooks',
          status: 'pending'
        },
        {
          id: 'experimental',
          label: 'Recursos Experimentais',
          icon: Zap,
          description: 'Funcionalidades em desenvolvimento',
          status: 'warning',
          badge: 'Beta'
        }
      ]
    }
  ];
  
  // Calcula status das configurações
  const configurationStatus = useMemo((): ConfigurationStatus[] => {
    const statuses: ConfigurationStatus[] = [];
    
    // Status geral
    statuses.push({
      section: 'general',
      status: 'completed',
      progress: 85,
      issues: 0
    });
    
    // Status de análise
    const analysisIssues = 0; // Placeholder for validation errors
    statuses.push({
      section: 'analysis',
      status: analysisIssues > 0 ? 'warning' : 'completed',
      progress: 95,
      issues: analysisIssues
    });
    
    // Status de templates
    statuses.push({
      section: 'templates',
      status: 'pending',
      progress: 60,
      issues: 0
    });
    
    // Status avançado
    statuses.push({
      section: 'advanced',
      status: 'pending',
      progress: 20,
      issues: 0
    });
    
    return statuses;
  }, []);
  
  // Alterna expansão de seção
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };
  
  // Renderiza item de navegação
  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = activeSection === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    
    const statusColors = {
      completed: 'text-green-600',
      pending: 'text-gray-400',
      warning: 'text-yellow-600',
      error: 'text-red-600'
    };
    
    const statusIcons = {
      completed: CheckCircle,
      pending: Clock,
      warning: AlertTriangle,
      error: AlertTriangle
    };
    
    const StatusIcon = item.status ? statusIcons[item.status] : null;
    const Icon = item.icon;
    
    return (
      <div key={item.id} className={cn('space-y-1', level > 0 && 'ml-4')}>
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={() => toggleSection(item.id)}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto p-3 text-left',
                  isActive && 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                )}
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-1">
              {item.children?.map(child => renderNavigationItem(child, level + 1))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start h-auto p-3 text-left',
              isActive && 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
            )}
            onClick={() => onSectionChange(item.id)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Icon className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{item.label}</span>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {StatusIcon && (
                      <StatusIcon className={cn('h-3 w-3', statusColors[item.status!])} />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {item.description}
                </p>
              </div>
            </div>
          </Button>
        )}
      </div>
    );
  };
  
  // Renderiza status geral
  const renderOverallStatus = () => {
    const totalProgress = configurationStatus.reduce((sum, status) => sum + status.progress, 0) / configurationStatus.length;
    const totalIssues = configurationStatus.reduce((sum, status) => sum + status.issues, 0);
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Status Geral</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span className="font-medium">{Math.round(totalProgress)}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
          </div>
          
          {totalIssues > 0 && (
            <div className="flex items-center space-x-2 text-sm text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{totalIssues} problema(s) encontrado(s)</span>
            </div>
          )}
          
          {isLoadingActiveConfig && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Info className="h-4 w-4" />
              <span>Carregando configurações</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Renderiza ações rápidas
  const renderQuickActions = () => {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Save className="mr-2 h-3 w-3" />
            Salvar Configurações
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Download className="mr-2 h-3 w-3" />
            Exportar Configuração
          </Button>
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Upload className="mr-2 h-3 w-3" />
            Importar Configuração
          </Button>
          
          <Separator className="my-2" />
          
          <Button variant="outline" size="sm" className="w-full justify-start">
            <RefreshCw className="mr-2 h-3 w-3" />
            Restaurar Padrões
          </Button>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className={cn('w-80 border-r bg-gray-50/50', className)}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold">Configurações</h2>
            <p className="text-sm text-gray-600">
              Personalize o sistema de análise
            </p>
          </div>
          
          <Separator />
          
          {/* Status Geral */}
          {renderOverallStatus()}
          
          {/* Navegação */}
          <div className="space-y-2">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>
          
          <Separator />
          
          {/* Ações Rápidas */}
          {renderQuickActions()}
          
          {/* Loading State */}
          {isLoadingActiveConfig && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Carregando...</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConfigurationSidebar;