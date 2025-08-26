import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Download,
  Settings,
  RefreshCw,
  BarChart3,
  Users,
  Bell,
  Search,
  Filter,
  Calendar,
  Archive,
  Trash2,
  ExternalLink,
  Plus,
  Eye
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  color: string;
  badge?: {
    text: string;
    variant: 'default' | 'destructive' | 'outline' | 'secondary';
  };
  onClick: () => void;
  disabled?: boolean;
  external?: boolean;
}

interface QuickActionsProps {
  onUploadDocument?: () => void;
  onViewReports?: () => void;
  onManageUsers?: () => void;
  onSystemSettings?: () => void;
  onRefreshData?: () => void;
  onExportData?: () => void;
  onViewNotifications?: () => void;
  onSearchDocuments?: () => void;
  onScheduleAnalysis?: () => void;
  onArchiveDocuments?: () => void;
  onDeleteOldData?: () => void;
  pendingNotifications?: number;
  isRefreshing?: boolean;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onUploadDocument,
  onViewReports,
  onManageUsers,
  onSystemSettings,
  onRefreshData,
  onExportData,
  onViewNotifications,
  onSearchDocuments,
  onScheduleAnalysis,
  onArchiveDocuments,
  onDeleteOldData,
  pendingNotifications = 0,
  isRefreshing = false,
  className = ''
}) => {
  const primaryActions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Novo Documento',
      description: 'Fazer upload de um novo documento para análise',
      icon: Upload,
      variant: 'default',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => onUploadDocument?.()
    },
    {
      id: 'reports',
      title: 'Relatórios',
      description: 'Visualizar relatórios e análises detalhadas',
      icon: BarChart3,
      variant: 'outline',
      color: 'border-green-500 text-green-600 hover:bg-green-50',
      onClick: () => onViewReports?.()
    },
    {
      id: 'search',
      title: 'Buscar Documentos',
      description: 'Pesquisar e filtrar documentos existentes',
      icon: Search,
      variant: 'outline',
      color: 'border-purple-500 text-purple-600 hover:bg-purple-50',
      onClick: () => onSearchDocuments?.()
    },
    {
      id: 'notifications',
      title: 'Notificações',
      description: 'Ver alertas e notificações do sistema',
      icon: Bell,
      variant: 'outline',
      color: 'border-orange-500 text-orange-600 hover:bg-orange-50',
      badge: pendingNotifications > 0 ? {
        text: pendingNotifications.toString(),
        variant: 'destructive'
      } : undefined,
      onClick: () => onViewNotifications?.()
    }
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'refresh',
      title: 'Atualizar Dados',
      description: 'Sincronizar dados mais recentes',
      icon: RefreshCw,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      disabled: isRefreshing,
      onClick: () => onRefreshData?.()
    },
    {
      id: 'export',
      title: 'Exportar',
      description: 'Baixar dados em formato Excel/PDF',
      icon: Download,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      onClick: () => onExportData?.()
    },
    {
      id: 'schedule',
      title: 'Agendar Análise',
      description: 'Programar análises automáticas',
      icon: Calendar,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      onClick: () => onScheduleAnalysis?.()
    },
    {
      id: 'users',
      title: 'Gerenciar Usuários',
      description: 'Administrar permissões e acessos',
      icon: Users,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      onClick: () => onManageUsers?.()
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Ajustar configurações do sistema',
      icon: Settings,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      onClick: () => onSystemSettings?.()
    },
    {
      id: 'archive',
      title: 'Arquivar',
      description: 'Mover documentos antigos para arquivo',
      icon: Archive,
      variant: 'ghost',
      color: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
      onClick: () => onArchiveDocuments?.()
    }
  ];

  const dangerActions: QuickAction[] = [
    {
      id: 'cleanup',
      title: 'Limpeza de Dados',
      description: 'Remover dados antigos e desnecessários',
      icon: Trash2,
      variant: 'ghost',
      color: 'text-red-600 hover:text-red-700 hover:bg-red-50',
      onClick: () => onDeleteOldData?.()
    }
  ];

  const renderActionButton = (action: QuickAction, size: 'sm' | 'default' = 'default') => {
    const Icon = action.icon;
    
    return (
      <Button
        key={action.id}
        variant={action.variant}
        size={size}
        disabled={action.disabled}
        onClick={action.onClick}
        className={`relative ${action.color} ${size === 'sm' ? 'h-8' : 'h-auto'}`}
      >
        <div className="flex items-center space-x-2">
          <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} ${action.disabled && isRefreshing ? 'animate-spin' : ''}`} />
          <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>
            {action.title}
          </span>
          {action.external && (
            <ExternalLink className="w-3 h-3" />
          )}
        </div>
        
        {action.badge && (
          <Badge 
            variant={action.badge.variant}
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {action.badge.text}
          </Badge>
        )}
      </Button>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5 text-blue-600" />
          <span>Ações Rápidas</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Acesso rápido às funcionalidades principais
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Ações Principais */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Principais</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {primaryActions.map((action) => (
              <div key={action.id} className="space-y-1">
                {renderActionButton(action)}
                <p className="text-xs text-gray-500 px-1">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Ações Secundárias */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Ferramentas</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {secondaryActions.map((action) => renderActionButton(action, 'sm'))}
          </div>
        </div>
        
        {/* Ações de Manutenção */}
        {dangerActions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Manutenção</h4>
            <div className="grid grid-cols-1 gap-2">
              {dangerActions.map((action) => (
                <div key={action.id} className="space-y-1">
                  {renderActionButton(action, 'sm')}
                  <p className="text-xs text-gray-500 px-1">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Status de Sistema */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900">Status do Sistema</h4>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">99.9%</div>
              <div className="text-xs text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">&lt; 100ms</div>
              <div className="text-xs text-gray-600">Resposta</div>
            </div>
          </div>
        </div>
        
        {/* Links Úteis */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Links Úteis</h4>
          <div className="space-y-1">
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-blue-600 hover:text-blue-700"
              onClick={() => window.open('/docs', '_blank')}
            >
              <FileText className="w-3 h-3 mr-1" />
              Documentação
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
            
            <Button 
              variant="link" 
              size="sm" 
              className="h-auto p-0 text-blue-600 hover:text-blue-700"
              onClick={() => window.open('/support', '_blank')}
            >
              <Eye className="w-3 h-3 mr-1" />
              Suporte Técnico
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;