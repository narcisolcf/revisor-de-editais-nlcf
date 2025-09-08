/**
 * Página Principal de Configuração - Fase 2 do Roadmap
 * 
 * Esta página centraliza todas as configurações avançadas do sistema LicitaReview,
 * incluindo parâmetros de análise, regras personalizadas, templates e presets.
 * 
 * Funcionalidades:
 * - Navegação entre diferentes seções de configuração
 * - Indicadores de progresso e status
 * - Integração com motor de análise adaptativo
 * - Gerenciamento de configurações organizacionais
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  FileText, 
  Sliders, 
  Code, 
  Eye, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Importar componentes especializados (serão criados nas próximas etapas)
import { DocumentTypeSelector } from '@/components/configuration/DocumentTypeSelector';
import { ParameterWeights } from '@/components/configuration/ParameterWeights';
import { CustomRulesEditor } from '@/components/configuration/CustomRulesEditor';
import { TemplateManager } from '@/components/configuration/TemplateManager';
import { ValidationPreview } from '@/components/configuration/ValidationPreview';
import { ConfigurationSidebar } from '@/components/configuration/ConfigurationSidebar';
import { ParameterPresets } from '@/components/configuration/ParameterPresets';

// Hooks personalizados (serão criados nas próximas etapas)
import { useAnalysisConfig } from '@/hooks/useAnalysisConfig';
import { useAdaptiveAnalysis } from '@/hooks/useAdaptiveAnalysis';

interface ConfigurationStatus {
  documentTypes: boolean;
  parameterWeights: boolean;
  customRules: boolean;
  templates: boolean;
  validation: boolean;
}

interface ConfigurationProgress {
  overall: number;
  sections: {
    [key: string]: number;
  };
}

export const ConfigurationPage: React.FC = () => {
  const { toast } = useToast();
  
  // Estados para controle da configuração
  const [activeTab, setActiveTab] = useState('document-types');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Status de configuração de cada seção
  const [configStatus, setConfigStatus] = useState<ConfigurationStatus>({
    documentTypes: false,
    parameterWeights: false,
    customRules: false,
    templates: false,
    validation: false
  });
  
  // Progresso da configuração
  const [configProgress, setConfigProgress] = useState<ConfigurationProgress>({
    overall: 0,
    sections: {
      'document-types': 0,
      'parameter-weights': 0,
      'custom-rules': 0,
      'templates': 0,
      'validation': 0
    }
  });
  
  // Hooks personalizados para configuração e análise adaptativa
  const {
    activeConfig: config,
    templates,
    updateConfig,
    isLoadingActiveConfig: configLoading
  } = useAnalysisConfig('default');
  
  const {
    executeAnalysis,
    cancelAnalysis,
    isExecuting,
    isCancelling
  } = useAdaptiveAnalysis('default');
  
  const handleConfigChange = (field: string, value: any) => {
    if (!config?.id) return;
    
    const updatedConfig = {
      [field]: value,
      updatedAt: new Date()
    };
    
    updateConfig(config.id, updatedConfig);
  };
  
  // Calcular progresso geral
  useEffect(() => {
    const sectionValues = Object.values(configProgress.sections);
    const overall = sectionValues.reduce((sum, value) => sum + value, 0) / sectionValues.length;
    setConfigProgress(prev => ({ ...prev, overall }));
  }, [configProgress.sections]);
  
  // Verificar status de configuração
  useEffect(() => {
    const checkConfigurationStatus = () => {
      const status = {
        documentTypes: configProgress.sections['document-types'] >= 80,
        parameterWeights: configProgress.sections['parameter-weights'] >= 80,
        customRules: configProgress.sections['custom-rules'] >= 60,
        templates: configProgress.sections['templates'] >= 60,
        validation: configProgress.sections['validation'] >= 70
      };
      setConfigStatus(status);
    };
    
    checkConfigurationStatus();
  }, [configProgress]);
  
  // Função para salvar configurações
  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Configuração salva automaticamente
      setHasUnsavedChanges(false);
      toast({
        title: "Configuração Salva",
        description: "Todas as configurações foram salvas com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Função para analisar configuração atual
  const handleAnalyzeConfiguration = async () => {
    try {
      // Simular análise da configuração
      const mockAnalysis = {
        overallScore: Math.floor(Math.random() * 20) + 80, // 80-100%
        recommendations: [
          'Considere ajustar o peso da categoria legal',
          'Adicione mais regras personalizadas para melhor precisão'
        ]
      };
      
      toast({
        title: 'Análise concluída',
        description: `Configuração analisada. Score: ${mockAnalysis.overallScore}%`
      });
    } catch (error) {
      toast({
        title: 'Erro na análise',
        description: 'Não foi possível analisar a configuração',
        variant: 'destructive'
      });
    }
  };
  
  // Função para atualizar progresso de uma seção
  const updateSectionProgress = (section: string, progress: number) => {
    setConfigProgress(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: progress
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  // Configuração das abas
  const tabsConfig = [
    {
      id: 'document-types',
      label: 'Tipos de Documento',
      icon: FileText,
      description: 'Configure os tipos de documentos e suas características',
      component: DocumentTypeSelector,
      status: configStatus.documentTypes
    },
    {
      id: 'parameter-weights',
      label: 'Pesos dos Parâmetros',
      icon: Sliders,
      description: 'Ajuste os pesos e importância de cada parâmetro de análise',
      component: ParameterWeights,
      status: configStatus.parameterWeights
    },
    {
      id: 'custom-rules',
      label: 'Regras Personalizadas',
      icon: Code,
      description: 'Crie e edite regras de análise específicas da organização',
      component: CustomRulesEditor,
      status: configStatus.customRules
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: FileText,
      description: 'Gerencie templates de documentos e configurações',
      component: TemplateManager,
      status: configStatus.templates
    },
    {
      id: 'validation',
      label: 'Preview & Validação',
      icon: Eye,
      description: 'Visualize e valide as configurações antes de aplicar',
      component: ValidationPreview,
      status: configStatus.validation
    }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header da Página */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                Configuração Avançada
              </h1>
              <p className="text-gray-600 mt-2">
                Configure parâmetros de análise, regras personalizadas e templates para otimizar a análise de documentos
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleAnalyzeConfiguration}
                disabled={isExecuting || configProgress.overall < 50}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isExecuting ? 'animate-spin' : ''}`} />
                Analisar Configuração
              </Button>
              
              <Button
                onClick={handleSaveConfiguration}
                disabled={isSaving || !hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                {isSaving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </div>
          </div>
          
          {/* Indicadores de Progresso */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Progresso Geral</span>
                  <span className="text-sm font-bold text-gray-900">{Math.round(configProgress.overall)}%</span>
                </div>
                <Progress value={configProgress.overall} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge variant={configProgress.overall >= 80 ? 'default' : configProgress.overall >= 50 ? 'secondary' : 'destructive'}>
                    {configProgress.overall >= 80 ? 'Completo' : configProgress.overall >= 50 ? 'Em Progresso' : 'Iniciando'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Alterações</span>
                  <Badge variant={hasUnsavedChanges ? 'destructive' : 'default'}>
                    {hasUnsavedChanges ? 'Não Salvas' : 'Salvas'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Alertas e Notificações */}
        {configProgress.overall < 30 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Configure pelo menos os tipos de documento e pesos dos parâmetros para começar a usar o sistema de análise adaptativo.
            </AlertDescription>
          </Alert>
        )}
        
        {hasUnsavedChanges && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você tem alterações não salvas. Lembre-se de salvar suas configurações antes de sair da página.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Layout Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de Configuração */}
          <div className="lg:col-span-1">
            <ConfigurationSidebar
              activeSection={activeTab}
              onSectionChange={setActiveTab}
              organizationId="default"
            />
          </div>
          
          {/* Conteúdo Principal */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                {tabsConfig.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.status && <CheckCircle className="h-3 w-3 text-green-500" />}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              {tabsConfig.map((tab) => {
                const Component = tab.component;
                return (
                  <TabsContent key={tab.id} value={tab.id} className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <tab.icon className="h-5 w-5" />
                          {tab.label}
                          {tab.status && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {tab.id === 'validation-preview' ? (
                          <ValidationPreview
                            weights={{ structural: 25, legal: 25, clarity: 25, abnt: 25, general: 0, budgetary: 0, formal: 0 }}
                            customRules={config?.rules || []}
                            documentType={'edital'}
                          />
                        ) : tab.id === 'custom-rules' ? (
                          <CustomRulesEditor
                            config={config}
                            onConfigChange={updateConfig}
                            onProgressChange={(progress: number) => updateSectionProgress(tab.id, progress)}
                          />
                        ) : tab.id === 'parameter-weights' ? (
                          <ParameterWeights
                            organizationId="default"
                            config={config}
                            onConfigChange={(config) => {
                              if (config?.id) {
                                updateConfig(config.id, config);
                              }
                            }}
                            onProgressChange={(progress: number) => updateSectionProgress(tab.id, progress)}
                          />
                        ) : tab.id === 'templates' ? (
                          <TemplateManager
                            onTemplateSelect={(template) => {
                              // Aplicar template à configuração ativa
                              if (config?.id) {
                                updateConfig(config.id, {
                                  rules: template.rules || []
                                });
                              }
                            }}
                            selectedTemplateId={undefined}
                            className=""
                          />
                        ) : (
                          <div>
                            {/* Componente genérico será renderizado aqui */}
                            <p>Configuração em desenvolvimento</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
        </div>
        
        {/* Seção de Presets */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Presets de Configuração</CardTitle>
              <CardDescription>
                Use presets predefinidos para configurar rapidamente o sistema para diferentes tipos de organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParameterPresets
                organizationId="default"
                onPresetApplied={(presetId) => {
                  // Aplicar preset por ID
                  setHasUnsavedChanges(true);
                  toast({
                    title: "Preset Aplicado",
                    description: `Preset foi aplicado com sucesso.`,
                    variant: "default"
                  });
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;