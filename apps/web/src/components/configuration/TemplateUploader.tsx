/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Upload, 
  X, 
  Plus, 
  Trash2,
  FileText,
  Target,
  Shield,
  MapPin,
  FileCode,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { TemplateStructure, TemplateSection, TemplateMetadata } from '../../types/template';

interface TemplateUploaderProps {
  organizationId: string;
  onClose: () => void;
  onSuccess: (template: TemplateStructure) => void;
}

interface ExtractedSection {
  id: string;
  name: string;
  content: string;
  confidence: number;
  isSelected: boolean;
}

interface UploadProgress {
  stage: 'uploading' | 'extracting' | 'processing' | 'complete';
  percentage: number;
  message: string;
}

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  organizationId,
  onClose,
  onSuccess
}) => {
  const [activeStep, setActiveStep] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedSections, setExtractedSections] = useState<ExtractedSection[]>([]);
  const [templateMetadata, setTemplateMetadata] = useState<Partial<TemplateMetadata>>({
    name: '',
    description: '',
    category: 'edital',
    subcategory: '',
    version: '1.0.0',
    author: '',
    organizationId,
    tags: [],
    isPublic: false,
    isActive: true
  });
  const [scoringWeights, setScoringWeights] = useState({
    structural: 30,
    legal: 25,
    clarity: 25,
    abnt: 20
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'uploading',
    percentage: 0,
    message: 'Aguardando upload...'
  });

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

  const getSubcategoryOptions = (category: string) => {
    const options: Record<string, string[]> = {
      edital: ['obra_publica', 'servicos', 'compras', 'concessao'],
      tr: ['desenvolvimento', 'infraestrutura', 'consultoria', 'treinamento'],
      etp: ['projeto', 'estudo', 'analise', 'avaliacao'],
      mapa_risco: ['operacional', 'financeiro', 'compliance', 'tecnologico'],
      minuta: ['contrato', 'aditivo', 'termo', 'acordo']
    };
    return options[category] || [];
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      simulateFileProcessing();
    }
  };

  const simulateFileProcessing = () => {
    setUploadProgress({ stage: 'uploading', percentage: 0, message: 'Fazendo upload do arquivo...' });
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev.percentage >= 100) {
          clearInterval(interval);
          setUploadProgress({ stage: 'extracting', percentage: 0, message: 'Extraindo seções...' });
          setTimeout(() => simulateSectionExtraction(), 500);
          return prev;
        }
        return { ...prev, percentage: prev.percentage + 10 };
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress({ stage: 'extracting', percentage: 0, message: 'Extraindo seções...' });
      setTimeout(() => simulateSectionExtraction(), 500);
    }, 1000);
  };

  const simulateSectionExtraction = () => {
    setUploadProgress({ stage: 'extracting', percentage: 0, message: 'Analisando conteúdo...' });
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev.percentage >= 100) {
          clearInterval(interval);
          setUploadProgress({ stage: 'processing', percentage: 0, message: 'Processando template...' });
          setTimeout(() => simulateTemplateProcessing(), 500);
          return prev;
        }
        return { ...prev, percentage: prev.percentage + 15 };
      });
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress({ stage: 'processing', percentage: 0, message: 'Processando template...' });
      setTimeout(() => simulateTemplateProcessing(), 500);
    }, 1500);
  };

  const simulateTemplateProcessing = () => {
    setUploadProgress({ stage: 'processing', percentage: 0, message: 'Configurando template...' });
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev.percentage >= 100) {
          clearInterval(interval);
          setUploadProgress({ stage: 'complete', percentage: 100, message: 'Template criado com sucesso!' });
          setTimeout(() => {
            setActiveStep(2);
            generateMockSections();
          }, 500);
          return prev;
        }
        return { ...prev, percentage: prev.percentage + 20 };
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress({ stage: 'complete', percentage: 100, message: 'Template criado com sucesso!' });
      setTimeout(() => {
        setActiveStep(2);
        generateMockSections();
      }, 500);
    }, 1000);
  };

  const generateMockSections = () => {
    const mockSections: ExtractedSection[] = [
      {
        id: '1',
        name: 'Objeto da Contratação',
        content: 'Descrição clara do objeto a ser contratado, incluindo especificações técnicas...',
        confidence: 0.95,
        isSelected: true
      },
      {
        id: '2',
        name: 'Justificativa',
        content: 'Fundamentação legal e técnica para a contratação...',
        confidence: 0.88,
        isSelected: true
      },
      {
        id: '3',
        name: 'Critérios de Avaliação',
        content: 'Critérios objetivos para avaliação das propostas...',
        confidence: 0.92,
        isSelected: true
      },
      {
        id: '4',
        name: 'Condições de Pagamento',
        content: 'Forma e prazo para pagamento dos serviços...',
        confidence: 0.85,
        isSelected: false
      },
      {
        id: '5',
        name: 'Prazo de Execução',
        content: 'Cronograma e prazos para execução...',
        confidence: 0.78,
        isSelected: false
      }
    ];
    
    setExtractedSections(mockSections);
  };

  const toggleSectionSelection = (sectionId: string) => {
    setExtractedSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, isSelected: !section.isSelected }
          : section
      )
    );
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !templateMetadata.tags?.includes(tag.trim())) {
      setTemplateMetadata(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateMetadata(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleCreateTemplate = () => {
    const selectedSections = extractedSections.filter(section => section.isSelected);
    
    const template: TemplateStructure = {
      sections: selectedSections.map(section => ({
        id: section.id,
        name: section.name,
        description: section.content.substring(0, 100) + '...',
        required: true,
        order: parseInt(section.id),
        validationRules: [],
        scoringWeight: Math.floor(100 / selectedSections.length),
        keywords: [],
        patterns: [],
        examples: []
      })),
      requiredFields: selectedSections.map(section => section.name.toLowerCase().replace(/\s+/g, '_')),
      scoringWeights: scoringWeights,
      validationRules: [],
      metadata: {
        id: `template_${Date.now()}`,
        name: templateMetadata.name || 'Novo Template',
        description: templateMetadata.description || 'Template criado a partir de upload',
        category: templateMetadata.category || 'edital',
        subcategory: templateMetadata.subcategory || '',
        version: templateMetadata.version || '1.0.0',
        author: templateMetadata.author || '',
        organizationId,
        tags: templateMetadata.tags || [],
        isPublic: templateMetadata.isPublic || false,
        isActive: templateMetadata.isActive || true,
        usageCount: 0,
        rating: 0,
        lastUsed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    onSuccess(template);
  };

  const getProgressColor = (stage: string) => {
    switch (stage) {
      case 'uploading':
        return 'bg-blue-600';
      case 'extracting':
        return 'bg-yellow-600';
      case 'processing':
        return 'bg-purple-600';
      case 'complete':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upload de Template</h2>
              <p className="text-gray-600">Crie um template a partir de um documento</p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeStep === 1 ? (
            /* Step 1: Upload e Processamento */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload do Documento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Arraste e solte seu arquivo aqui
                    </p>
                    <p className="text-gray-600 mb-4">
                      Suporta arquivos PDF e DOCX até 10MB
                    </p>
                    <Input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <Button variant="outline">
                        Selecionar Arquivo
                      </Button>
                    </Label>
                  </div>
                  
                  {uploadedFile && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{uploadedFile.name}</span>
                      <Badge variant="outline">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{uploadProgress.message}</span>
                      <span>{uploadProgress.percentage}%</span>
                    </div>
                    <Progress value={uploadProgress.percentage} className="h-2" />
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className={`w-3 h-3 rounded-full ${getProgressColor(uploadProgress.stage)}`} />
                    <span className="capitalize">{uploadProgress.stage}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Step 2: Configuração do Template */
            <div className="space-y-6">
              {/* Metadados */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Nome do Template</Label>
                      <Input
                        id="template-name"
                        value={templateMetadata.name}
                        onChange={(e) => setTemplateMetadata(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome do template"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-category">Categoria</Label>
                      <Select
                        value={templateMetadata.category}
                        onValueChange={(value) => setTemplateMetadata(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="edital">Editais</SelectItem>
                          <SelectItem value="tr">Termos de Referência</SelectItem>
                          <SelectItem value="etp">ETPs</SelectItem>
                          <SelectItem value="mapa_risco">Mapas de Risco</SelectItem>
                          <SelectItem value="minuta">Minutas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="template-description">Descrição</Label>
                    <Textarea
                      id="template-description"
                      value={templateMetadata.description}
                      onChange={(e) => setTemplateMetadata(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição detalhada do template"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="template-subcategory">Subcategoria</Label>
                      <Select
                        value={templateMetadata.subcategory}
                        onValueChange={(value) => setTemplateMetadata(prev => ({ ...prev, subcategory: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar subcategoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {getSubcategoryOptions(templateMetadata.category || 'edital').map(option => (
                            <SelectItem key={option} value={option}>
                              {option.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="template-version">Versão</Label>
                      <Input
                        id="template-version"
                        value={templateMetadata.version}
                        onChange={(e) => setTemplateMetadata(prev => ({ ...prev, version: e.target.value }))}
                        placeholder="1.0.0"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-author">Autor</Label>
                      <Input
                        id="template-author"
                        value={templateMetadata.author}
                        onChange={(e) => setTemplateMetadata(prev => ({ ...prev, author: e.target.value }))}
                        placeholder="Nome do autor"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Tags</Label>
                    <div className="flex items-center space-x-2 mb-2">
                      <Input
                        placeholder="Adicionar tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Adicionar tag"]') as HTMLInputElement;
                          if (input) {
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {templateMetadata.tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer hover:bg-red-100"
                               onClick={() => removeTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="template-public"
                        checked={templateMetadata.isPublic}
                        onChange={(e) => setTemplateMetadata(prev => ({ ...prev, isPublic: e.target.checked }))}
                      />
                      <Label htmlFor="template-public">Template Público</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="template-active"
                        checked={templateMetadata.isActive}
                        onChange={(e) => setTemplateMetadata(prev => ({ ...prev, isActive: e.target.checked }))}
                      />
                      <Label htmlFor="template-active">Ativo</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seções Extraídas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seções Extraídas</CardTitle>
                  <p className="text-sm text-gray-600">
                    Selecione as seções que devem fazer parte do template
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedSections.map((section) => (
                    <div key={section.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <input
                              type="checkbox"
                              checked={section.isSelected}
                              onChange={() => toggleSectionSelection(section.id)}
                              className="rounded"
                            />
                            <h4 className="font-medium">{section.name}</h4>
                            <Badge variant={section.confidence > 0.9 ? 'default' : 'secondary'}>
                              {Math.round(section.confidence * 100)}% confiança
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{section.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Pesos de Pontuação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configuração de Pontuação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="structural-weight">Estrutural</Label>
                      <Input
                        id="structural-weight"
                        type="number"
                        value={scoringWeights.structural}
                        onChange={(e) => setScoringWeights(prev => ({ ...prev, structural: parseInt(e.target.value) }))}
                        min={0}
                        max={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="legal-weight">Legal</Label>
                      <Input
                        id="legal-weight"
                        type="number"
                        value={scoringWeights.legal}
                        onChange={(e) => setScoringWeights(prev => ({ ...prev, legal: parseInt(e.target.value) }))}
                        min={0}
                        max={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="clarity-weight">Clareza</Label>
                      <Input
                        id="clarity-weight"
                        type="number"
                        value={scoringWeights.clarity}
                        onChange={(e) => setScoringWeights(prev => ({ ...prev, clarity: parseInt(e.target.value) }))}
                        min={0}
                        max={100}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="abnt-weight">ABNT</Label>
                      <Input
                        id="abnt-weight"
                        type="number"
                        value={scoringWeights.abnt}
                        onChange={(e) => setScoringWeights(prev => ({ ...prev, abnt: parseInt(e.target.value) }))}
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Total:</strong> {Object.values(scoringWeights).reduce((sum, weight) => sum + weight, 0)}%
                      {Object.values(scoringWeights).reduce((sum, weight) => sum + weight, 0) !== 100 && 
                        <span className="text-red-600 ml-2">(Recomendado: 100%)</span>
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setActiveStep(1)}>
                  Voltar
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateTemplate}>
                    Criar Template
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
