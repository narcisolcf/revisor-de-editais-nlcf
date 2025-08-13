/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Download, 
  X, 
  Zap,
  FileText,
  Target,
  Shield,
  MapPin,
  FileCode,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings
} from 'lucide-react';
import { TemplateStructure } from '../../types/template';
import { Label } from '../ui/label';

interface TemplatePreviewProps {
  template: TemplateStructure;
  onClose: () => void;
  onApply: () => void;
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  onClose,
  onApply
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'edital':
        return FileText;
      case 'tr':
        return Target;
      case 'etp':
        return Shield;
      case 'mapa_risco':
        return MapPin;
      case 'minuta':
        return FileCode;
      default:
        return FileText;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      edital: 'Editais',
      tr: 'Termos de Referência',
      etp: 'ETPs',
      mapa_risco: 'Mapas de Risco',
      minuta: 'Minutas'
    };
    return labels[category] || category;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'Erro';
      case 'warning':
        return 'Aviso';
      case 'info':
        return 'Informação';
      default:
        return 'Info';
    }
  };

  const handleDownload = () => {
    // Em produção, geraria um arquivo de template
    const templateData = JSON.stringify(template, null, 2);
    const blob = new Blob([templateData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.metadata.name.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: template.metadata.name,
        text: template.metadata.description,
        url: window.location.href
      });
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
      alert('URL copiada para a área de transferência!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              {React.createElement(getCategoryIcon(template.metadata.category), { 
                className: "w-5 h-5 text-blue-600" 
              })}
            </div>
            <div>
              <h2 className="text-xl font-bold">Preview do Template</h2>
              <p className="text-gray-600">{template.metadata.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
            <Button onClick={onApply}>
              <Zap className="w-4 h-4 mr-2" />
              Aplicar Template
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="sections">Seções</TabsTrigger>
              <TabsTrigger value="validation">Validação</TabsTrigger>
              <TabsTrigger value="scoring">Pontuação</TabsTrigger>
            </TabsList>

            {/* Tab: Visão Geral */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Básicas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Nome</Label>
                      <p className="font-medium">{template.metadata.name}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Descrição</Label>
                      <p className="text-gray-700">{template.metadata.description}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Categoria</Label>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{getCategoryLabel(template.metadata.category)}</Badge>
                        {template.metadata.subcategory && (
                          <Badge variant="secondary">{template.metadata.subcategory}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Versão</Label>
                        <p className="font-medium">{template.metadata.version}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Autor</Label>
                        <p className="font-medium">{template.metadata.author}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.metadata.isPublic}
                          disabled
                          className="rounded"
                        />
                        <Label className="text-sm">Template Público</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={template.metadata.isActive}
                          disabled
                          className="rounded"
                        />
                        <Label className="text-sm">Ativo</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{template.sections.length}</div>
                        <div className="text-sm text-blue-600">Seções</div>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{template.validationRules.length}</div>
                        <div className="text-sm text-green-600">Regras</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total de Usos:</span>
                        <span className="font-medium">{template.metadata.usageCount}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Avaliação:</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{template.metadata.rating}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Criado em:</span>
                        <span className="font-medium">
                          {template.metadata.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Atualizado em:</span>
                        <span className="font-medium">
                          {template.metadata.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Campos Obrigatórios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {template.requiredFields.map((field, index) => (
                      <Badge key={index} variant="default">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Seções */}
            <TabsContent value="sections" className="space-y-4">
              <div className="space-y-4">
                {template.sections.map((section, index) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{section.name}</CardTitle>
                            <p className="text-sm text-gray-600">{section.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {section.required && (
                            <Badge variant="default">Obrigatória</Badge>
                          )}
                          <Badge variant="outline">Peso: {section.scoringWeight}%</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Keywords */}
                      {section.keywords.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Palavras-chave</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {section.keywords.map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Patterns */}
                      {section.patterns.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Padrões Regex</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {section.patterns.map((pattern, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs font-mono">
                                {pattern}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Examples */}
                      {section.examples.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Exemplos</Label>
                          <div className="space-y-2 mt-2">
                            {section.examples.map((example, idx) => (
                              <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                                {example}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Validação */}
            <TabsContent value="validation" className="space-y-4">
              <div className="space-y-4">
                {template.validationRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(rule.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">Regra de Validação</h3>
                            <Badge variant={getSeverityBadgeVariant(rule.severity)}>
                              {getSeverityLabel(rule.severity)}
                            </Badge>
                            <Badge variant="outline">{rule.type}</Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Condição:</span> {rule.condition}
                            </div>
                            <div>
                              <span className="font-medium">Mensagem:</span> {rule.message}
                            </div>
                            <div>
                              <span className="font-medium">Status:</span>
                              <Badge variant={rule.enabled ? 'default' : 'secondary'} className="ml-2">
                                {rule.enabled ? 'Ativa' : 'Inativa'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {template.validationRules.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 text-gray-400 mx-auto mb-4">
                        <Settings className="w-12 h-12" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma regra de validação</h3>
                      <p className="text-gray-600">
                        Este template não possui regras de validação configuradas.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Tab: Pontuação */}
            <TabsContent value="scoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração de Pontuação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-4">Pesos por Categoria de Análise</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Estrutural</span>
                        <Badge variant="outline">{template.scoringWeights.structural}%</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Legal</span>
                        <Badge variant="outline">{template.scoringWeights.legal}%</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">Clareza</span>
                        <Badge variant="outline">{template.scoringWeights.clarity}%</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">ABNT</span>
                        <Badge variant="outline">{template.scoringWeights.abnt}%</Badge>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total:</strong> {Object.values(template.scoringWeights).reduce((sum, weight) => sum + weight, 0)}%
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Pesos por Seção</h3>
                    <div className="space-y-3">
                      {template.sections.map((section, index) => (
                        <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                              {index + 1}
                            </div>
                            <span className="font-medium">{section.name}</span>
                            {section.required && (
                              <Badge variant="default" className="text-xs">Obrigatória</Badge>
                            )}
                          </div>
                          <Badge variant="outline">{section.scoringWeight}%</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
