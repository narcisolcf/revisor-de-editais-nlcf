/**
 * LicitaReview - Configuration Page
 * 
 * 🚀 CORE DIFFERENTIATOR: Complete interface for managing organizational
 * analysis parameters, custom rules, and templates following GOV.BR standards.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Home,
  ChevronRight,
  Undo,
  Redo,
  Upload,
  Download
} from 'lucide-react';

import { Button } from '@/src/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Badge } from '@/src/components/ui/badge';
import { Progress } from '@/src/components/ui/progress';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbSeparator 
} from '@/src/components/ui/breadcrumb';
import { Form } from '@/src/components/ui/form';
import { useToast } from '@/src/components/ui/use-toast';

import { ConfigurationSidebar } from '@/src/components/configuration/ConfigurationSidebar';
import { DocumentTypeSelector } from '@/src/components/configuration/DocumentTypeSelector';
import { ParameterWeights } from '@/src/components/configuration/ParameterWeights';
import { CustomRulesEditor } from '@/src/components/configuration/CustomRulesEditor';
import { TemplateManager } from '@/src/components/configuration/TemplateManager';
import { ValidationPreview } from '@/src/components/configuration/ValidationPreview';
import { ParameterPresets } from '@/src/components/configuration/ParameterPresets';

// Configuration schema for validation
const configurationSchema = z.object({
  organizationName: z.string().min(1, 'Nome da organização é obrigatório'),
  documentTypes: z.array(z.string()).min(1, 'Pelo menos um tipo de documento deve ser selecionado'),
  weights: z.object({
    structural: z.number().min(0).max(100),
    legal: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    abnt: z.number().min(0).max(100),
  }).refine(
    (weights) => Object.values(weights).reduce((sum, w) => sum + w, 0) === 100,
    { message: 'Os pesos devem somar 100%' }
  ),
  customRules: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    pattern: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high']),
    category: z.string(),
    enabled: z.boolean()
  })),
  templates: z.array(z.object({
    id: z.string(),
    name: z.string().min(1),
    documentType: z.string(),
    content: z.string(),
    isDefault: z.boolean()
  })),
  isActive: z.boolean(),
  lastModified: z.date().optional(),
  version: z.number().default(1)
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

export interface ConfigurationPageProps {
  className?: string;
}

/**
 * Configuration Page Component
 * 
 * 🚀 CORE FEATURE: Complete configuration interface following GOV.BR standards
 * with advanced features like auto-save, undo/redo, drag&drop, and real-time validation
 */
export const ConfigurationPage: React.FC<ConfigurationPageProps> = ({ className }) => {
  const { toast } = useToast();
  
  // Current section state
  const [currentSection, setCurrentSection] = useState<string>('document-types');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [configProgress, setConfigProgress] = useState(0);
  
  // History management for undo/redo
  const [history, setHistory] = useState<ConfigurationFormData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Form setup with React Hook Form + Zod
  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      organizationName: 'Prefeitura Municipal de Exemplo',
      documentTypes: [],
      weights: {
        structural: 25,
        legal: 35,
        clarity: 25,
        abnt: 15
      },
      customRules: [],
      templates: [],
      isActive: true,
      version: 1
    },
    mode: 'onChange'
  });

  const { watch, handleSubmit, reset, formState: { errors, isDirty, isValid } } = form;
  const watchedValues = watch();

  // Calculate configuration progress
  useEffect(() => {
    const calculateProgress = () => {
      let completed = 0;
      const total = 5; // Total configuration steps
      
      if (watchedValues.documentTypes?.length > 0) completed++;
      if (Object.values(watchedValues.weights).reduce((sum, w) => sum + w, 0) === 100) completed++;
      if (watchedValues.customRules?.length > 0) completed++;
      if (watchedValues.templates?.length > 0) completed++;
      if (watchedValues.organizationName?.length > 0) completed++;
      
      setConfigProgress((completed / total) * 100);
    };
    
    calculateProgress();
  }, [watchedValues]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (isDirty && isValid) {
      setUnsavedChanges(true);
      const timeoutId = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, isValid]);

  // Add to history for undo/redo
  const addToHistory = useCallback((data: ConfigurationFormData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(data);
      return newHistory.slice(-20); // Keep last 20 states
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [historyIndex]);

  // Auto-save function
  const handleAutoSave = async () => {
    if (!isValid) return;
    
    setIsAutoSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      addToHistory(watchedValues);
      setUnsavedChanges(false);
      
      toast({
        title: "Configuração salva automaticamente",
        description: "Suas alterações foram salvas com sucesso.",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Erro no salvamento automático",
        description: "Não foi possível salvar automaticamente. Tente salvar manualmente.",
        variant: "destructive",
      });
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Manual save
  const onSubmit = async (data: ConfigurationFormData) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addToHistory(data);
      setUnsavedChanges(false);
      
      toast({
        title: "Configuração salva com sucesso",
        description: "Todas as alterações foram aplicadas à sua organização.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar configuração",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      reset(previousState);
      setHistoryIndex(prev => prev - 1);
      
      toast({
        title: "Ação desfeita",
        description: "A última alteração foi desfeita.",
      });
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      reset(nextState);
      setHistoryIndex(prev => prev + 1);
      
      toast({
        title: "Ação refeita",
        description: "A alteração foi aplicada novamente.",
      });
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja desfazer todas as alterações?')) {
      reset();
      setUnsavedChanges(false);
      
      toast({
        title: "Configuração resetada",
        description: "Todas as alterações foram descartadas.",
      });
    }
  };

  // Export configuration
  const handleExport = () => {
    const configData = JSON.stringify(watchedValues, null, 2);
    const blob = new Blob([configData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licitareview-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Configuração exportada",
      description: "O arquivo de configuração foi baixado com sucesso.",
    });
  };

  // Import configuration
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        const validatedConfig = configurationSchema.parse(config);
        reset(validatedConfig);
        addToHistory(validatedConfig);
        
        toast({
          title: "Configuração importada",
          description: "A configuração foi carregada com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "O arquivo não possui um formato válido.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="flex items-center">
                  <Home className="h-4 w-4 mr-1" />
                  Início
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  Painel de Controle
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <span className="font-medium text-gray-900">Configurações</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configurações de Análise
                </h1>
                <p className="text-gray-600">
                  Personalize os parâmetros de análise para <strong>{watchedValues.organizationName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Progress Indicator */}
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">
                  Progresso da configuração
                </p>
                <div className="flex items-center space-x-2">
                  <Progress value={configProgress} className="w-32 h-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(configProgress)}%
                  </span>
                </div>
              </div>
              
              {/* Status Badges */}
              {unsavedChanges && (
                <Badge variant="secondary" className="px-3">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Alterações não salvas
                </Badge>
              )}
              
              {isAutoSaving && (
                <Badge variant="outline" className="px-3">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Salvando...
                </Badge>
              )}
              
              {/* Action Buttons */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                title="Desfazer (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Refazer (Ctrl+Y)"
              >
                <Redo className="h-4 w-4" />
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExport}
                title="Exportar configuração"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>

              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                  id="import-config"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.getElementById('import-config')?.click()}
                  title="Importar configuração"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={!isDirty}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={!isDirty || !isValid}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Configuração
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {watchedValues.isActive && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Esta configuração está <strong>ativa</strong> e sendo utilizada 
              para análise de documentos em sua organização.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Validation Errors */}
      {Object.keys(errors).length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Existem erros na configuração que precisam ser corrigidos antes de salvar.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ConfigurationSidebar
                currentSection={currentSection}
                onSectionChange={setCurrentSection}
                progress={configProgress}
                errors={errors}
              />
            </div>
          </div>

          {/* Configuration Content */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Document Types Section */}
                {currentSection === 'document-types' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tipos de Documento</CardTitle>
                      <CardDescription>
                        Selecione os tipos de documentos que sua organização analisa
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DocumentTypeSelector />
                    </CardContent>
                  </Card>
                )}

                {/* Parameter Weights Section */}
                {currentSection === 'weights' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pesos dos Parâmetros</CardTitle>
                      <CardDescription>
                        Configure a importância de cada categoria de análise (deve somar 100%)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ParameterWeights />
                    </CardContent>
                  </Card>
                )}

                {/* Custom Rules Section */}
                {currentSection === 'rules' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Regras Personalizadas</CardTitle>
                      <CardDescription>
                        Defina regras específicas da organização usando padrões regex
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CustomRulesEditor />
                    </CardContent>
                  </Card>
                )}

                {/* Templates Section */}
                {currentSection === 'templates' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Gerenciar Templates</CardTitle>
                      <CardDescription>
                        Gerencie templates para diferentes tipos de documentos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TemplateManager />
                    </CardContent>
                  </Card>
                )}

                {/* Presets Section */}
                {currentSection === 'presets' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Predefinidas</CardTitle>
                      <CardDescription>
                        Use configurações otimizadas para diferentes tipos de organização
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ParameterPresets />
                    </CardContent>
                  </Card>
                )}
              </form>
            </Form>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ValidationPreview 
                configuration={watchedValues}
                errors={errors}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;