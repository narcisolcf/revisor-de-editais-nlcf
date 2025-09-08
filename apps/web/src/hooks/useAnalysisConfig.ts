import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnalysisConfigService } from '@/services/AnalysisConfigService';

// Instância do serviço
const analysisConfigService = new AnalysisConfigService();
import { toast } from '@/hooks/use-toast';

export interface AnalysisParameter {
  id: string;
  name: string;
  description: string;
  category: 'structural' | 'legal' | 'clarity' | 'abnt' | 'general';
  type: 'boolean' | 'number' | 'string' | 'select' | 'range';
  value: any;
  defaultValue: any;
  options?: string[]; // Para tipo 'select'
  min?: number; // Para tipo 'range'
  max?: number; // Para tipo 'range'
  step?: number; // Para tipo 'range'
  required: boolean;
  weight: number; // Peso na análise (0-100)
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisRule {
  id: string;
  name: string;
  description: string;
  category: 'structural' | 'legal' | 'clarity' | 'abnt' | 'general';
  type: 'keyword_presence' | 'keyword_any' | 'pattern' | 'custom';
  keywordsAll?: string[];
  keywordsAny?: string[];
  pattern?: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  suggestion: string;
  enabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationConfig {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  parameters: AnalysisParameter[];
  rules: AnalysisRule[];
  isDefault: boolean;
  isActive: boolean;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  category: 'edital' | 'tr' | 'contrato' | 'projeto' | 'geral';
  parameters: Partial<AnalysisParameter>[];
  rules: Partial<AnalysisRule>[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisConfigFilters {
  category?: string;
  enabled?: boolean;
  search?: string;
  organizationId?: string;
}

export const useAnalysisConfig = (organizationId: string) => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AnalysisConfigFilters>({
    organizationId,
    enabled: true
  });

  // Query para buscar configurações da organização
  const {
    data: configs,
    isLoading: isLoadingConfigs,
    error: configsError,
    refetch: refetchConfigs
  } = useQuery<OrganizationConfig[]>({
    queryKey: ['analysis-configs', organizationId, filters],
    queryFn: () => analysisConfigService.getOrganizationConfigs(organizationId, filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!organizationId
  });

  // Query para buscar configuração ativa
  const {
    data: activeConfig,
    isLoading: isLoadingActiveConfig,
    error: activeConfigError
  } = useQuery<OrganizationConfig | null>({
    queryKey: ['active-analysis-config', organizationId],
    queryFn: () => analysisConfigService.getActiveConfig(organizationId),
    staleTime: 2 * 60 * 1000, // 2 minutos
    enabled: !!organizationId
  });

  // Query para buscar templates disponíveis
  const {
    data: templates,
    isLoading: isLoadingTemplates,
    error: templatesError
  } = useQuery<ConfigTemplate[]>({
    queryKey: ['analysis-templates', filters.category],
    queryFn: () => analysisConfigService.getTemplates(filters.category),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar nova configuração
  const createConfigMutation = useMutation({
    mutationFn: (config: Omit<OrganizationConfig, 'id' | 'createdAt' | 'updatedAt'>) =>
      analysisConfigService.createConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      toast({
        title: 'Configuração criada',
        description: 'Nova configuração de análise foi criada com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar configuração',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para atualizar configuração
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: Partial<OrganizationConfig> }) =>
      analysisConfigService.updateConfig(id, config),
    onSuccess: (updatedConfig) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['active-analysis-config', organizationId] });
      
      // Atualizar cache local
      queryClient.setQueryData(['analysis-configs', organizationId, filters], (old: any) => {
        if (!old) return old;
        return old.map((c: OrganizationConfig) => 
          c.id === updatedConfig.id ? updatedConfig : c
        );
      });
      
      toast({
        title: 'Configuração atualizada',
        description: 'Configuração foi atualizada com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar configuração',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para deletar configuração
  const deleteConfigMutation = useMutation({
    mutationFn: (id: string) => analysisConfigService.deleteConfig(id),
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      
      // Remover do cache local
      queryClient.setQueryData(['analysis-configs', organizationId, filters], (old: any) => {
        if (!old) return old;
        return old.filter((c: OrganizationConfig) => c.id !== deletedId);
      });
      
      toast({
        title: 'Configuração removida',
        description: 'Configuração foi removida com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover configuração',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para ativar/desativar configuração
  const toggleConfigStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      analysisConfigService.updateConfig(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['active-analysis-config', organizationId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para aplicar template
  const applyTemplateMutation = useMutation({
    mutationFn: ({ templateId, organizationId }: { templateId: string; organizationId: string }) =>
      analysisConfigService.applyTemplate(templateId, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['active-analysis-config', organizationId] });
      
      toast({
        title: 'Template aplicado',
        description: 'Template foi aplicado com sucesso à organização.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao aplicar template',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para duplicar configuração
  const duplicateConfigMutation = useMutation({
    mutationFn: (id: string) => analysisConfigService.duplicateConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-configs', organizationId] });
      
      toast({
        title: 'Configuração duplicada',
        description: 'Configuração foi duplicada com sucesso.',
        variant: 'default'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao duplicar configuração',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Funções auxiliares
  const createConfig = useCallback((config: Omit<OrganizationConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createConfigMutation.mutateAsync(config);
  }, [createConfigMutation]);

  const updateConfig = useCallback((id: string, config: Partial<OrganizationConfig>) => {
    return updateConfigMutation.mutateAsync({ id, config });
  }, [updateConfigMutation]);

  const deleteConfig = useCallback((id: string) => {
    return deleteConfigMutation.mutateAsync(id);
  }, [deleteConfigMutation]);

  const toggleConfigStatus = useCallback((id: string, isActive: boolean) => {
    return toggleConfigStatusMutation.mutateAsync({ id, isActive });
  }, [toggleConfigStatusMutation]);

  const applyTemplate = useCallback((templateId: string) => {
    return applyTemplateMutation.mutateAsync({ templateId, organizationId });
  }, [applyTemplateMutation, organizationId]);

  const duplicateConfig = useCallback((id: string) => {
    return duplicateConfigMutation.mutateAsync(id);
  }, [duplicateConfigMutation]);

  const updateFilters = useCallback((newFilters: Partial<AnalysisConfigFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ organizationId, enabled: true });
  }, [organizationId]);

  // Computed values
  const enabledConfigs = (configs && Array.isArray(configs)) ? configs.filter(c => c.isActive) : [];
  const disabledConfigs = (configs && Array.isArray(configs)) ? configs.filter(c => !c.isActive) : [];
  const configsByCategory = (configs && Array.isArray(configs)) ? configs.reduce((acc, config) => {
    config.parameters.forEach(param => {
      if (!acc[param.category]) acc[param.category] = [];
      acc[param.category].push(param);
    });
    return acc;
  }, {} as Record<string, AnalysisParameter[]>) : {};

  // Auto-sync com backend
  useEffect(() => {
    if (organizationId) {
      const interval = setInterval(() => {
        refetchConfigs();
      }, 5 * 60 * 1000); // Sync a cada 5 minutos

      return () => clearInterval(interval);
    }
  }, [organizationId, refetchConfigs]);

  return {
    // Data
    configs,
    activeConfig,
    templates,
    enabledConfigs,
    disabledConfigs,
    configsByCategory,
    
    // Loading states
    isLoadingConfigs,
    isLoadingActiveConfig,
    isLoadingTemplates,
    
    // Errors
    configsError,
    activeConfigError,
    templatesError,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Mutations
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfigStatus,
    applyTemplate,
    duplicateConfig,
    
    // Mutation states
    isCreating: createConfigMutation.isPending,
    isUpdating: updateConfigMutation.isPending,
    isDeleting: deleteConfigMutation.isPending,
    isToggling: toggleConfigStatusMutation.isPending,
    isApplyingTemplate: applyTemplateMutation.isPending,
    isDuplicating: duplicateConfigMutation.isPending,
    
    // Utilities
    refetchConfigs,
    hasActiveConfig: !!activeConfig,
    totalConfigs: (configs && Array.isArray(configs)) ? configs.length : 0,
    totalTemplates: templates?.length || 0
  };
};
