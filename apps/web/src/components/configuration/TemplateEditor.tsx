/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Save, 
  X, 
  Plus, 
  Trash2,
  GripVertical,
  Settings,
  FileText,
  Target,
  Shield,
  MapPin,
  FileCode
} from 'lucide-react';
import { TemplateStructure, TemplateSection, ValidationRule } from '../../types/template';

interface TemplateEditorProps {
  template: TemplateStructure;
  organizationId: string;
  onClose: () => void;
  onSave: (template: TemplateStructure) => void;
}

interface EditingSection {
  id: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  validationRules: ValidationRule[];
  scoringWeight: number;
  keywords: string[];
  patterns: string[];
  examples: string[];
}

interface EditingRule {
  id: string;
  type: 'presence' | 'format' | 'length' | 'regex' | 'custom';
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  _organizationId,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('metadata');
  const [editingTemplate, setEditingTemplate] = useState<TemplateStructure>(template);
  const [editingSections, setEditingSections] = useState<EditingSection[]>(
    template.sections.map(s => ({ ...s }))
  );
  const [editingRules, setEditingRules] = useState<ValidationRule[]>(
    template.validationRules.map(r => ({ ...r }))
  );
  const [newSection, setNewSection] = useState<Partial<EditingSection>>({
    name: '',
    description: '',
    required: false,
    order: template.sections.length + 1,
    validationRules: [],
    scoringWeight: 10,
    keywords: [],
    patterns: [],
    examples: []
  });
  const [newRule, setNewRule] = useState<Partial<EditingRule>>({
    type: 'presence' as const,
    condition: 'required',
    message: '',
    severity: 'error' as const,
    enabled: true
  });

  const getCategoryIcon = (category: 'edital' | 'tr' | 'etp' | 'mapa_risco' | 'minuta') => {
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleSave = () => {
    const updatedTemplate: TemplateStructure = {
      ...editingTemplate,
      sections: editingSections,
      validationRules: editingRules
    };
    onSave(updatedTemplate);
  };

  const addSection = () => {
    if (newSection.name && newSection.description) {
      const section: EditingSection = {
        id: `section_${Date.now()}`,
        name: newSection.name!,
        description: newSection.description!,
        required: newSection.required || false,
        order: newSection.order || editingSections.length + 1,
        validationRules: newSection.validationRules || [],
        scoringWeight: newSection.scoringWeight || 10,
        keywords: newSection.keywords || [],
        patterns: newSection.patterns || [],
        examples: newSection.examples || []
      };
      
      setEditingSections([...editingSections, section]);
      setNewSection({
        name: '',
        description: '',
        required: false,
        order: editingSections.length + 2,
        validationRules: [],
        scoringWeight: 10,
        keywords: [],
        patterns: [],
        examples: []
      });
    }
  };

  const removeSection = (sectionId: string) => {
    setEditingSections(editingSections.filter(s => s.id !== sectionId));
  };

  const updateSection = (sectionId: string, updates: Partial<EditingSection>) => {
    setEditingSections(editingSections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ));
  };

  const addRule = () => {
    if (newRule.type && newRule.message) {
      const rule: ValidationRule = {
        id: `rule_${Date.now()}`,
        type: newRule.type!,
        condition: newRule.condition!,
        message: newRule.message!,
        severity: newRule.severity!,
        enabled: newRule.enabled!
      };
      
      setEditingRules([...editingRules, rule]);
      setNewRule({
        type: 'presence',
        condition: 'required',
        message: '',
        severity: 'error',
        enabled: true
      });
    }
  };

  const removeRule = (ruleId: string) => {
    setEditingRules(editingRules.filter(r => r.id !== ruleId));
  };

  const updateRule = (ruleId: string, updates: Partial<ValidationRule>) => {
    setEditingRules(editingRules.map(r => 
      r.id === ruleId ? { ...r, ...updates } : r
    ));
  };

  const addKeyword = (sectionId: string, keyword: string) => {
    if (keyword.trim()) {
      updateSection(sectionId, {
        keywords: [...editingSections.find(s => s.id === sectionId)!.keywords, keyword.trim()]
      });
    }
  };

  const removeKeyword = (sectionId: string, keyword: string) => {
    const section = editingSections.find(s => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        keywords: section.keywords.filter(k => k !== keyword)
      });
    }
  };

  const addPattern = (sectionId: string, pattern: string) => {
    if (pattern.trim()) {
      updateSection(sectionId, {
        patterns: [...editingSections.find(s => s.id === sectionId)!.patterns, pattern.trim()]
      });
    }
  };

  const removePattern = (sectionId: string, pattern: string) => {
    const section = editingSections.find(s => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        patterns: section.patterns.filter(p => p !== pattern)
      });
    }
  };

  const addExample = (sectionId: string, example: string) => {
    if (example.trim()) {
      updateSection(sectionId, {
        examples: [...editingSections.find(s => s.id === sectionId)!.examples, example.trim()]
      });
    }
  };

  const removeExample = (sectionId: string, example: string) => {
    const section = editingSections.find(s => s.id === sectionId);
    if (section) {
      updateSection(sectionId, {
        examples: section.examples.filter(e => e !== example)
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              {React.createElement(getCategoryIcon(editingTemplate.metadata.category), { 
                className: "w-5 h-5 text-blue-600" 
              })}
            </div>
            <div>
              <h2 className="text-xl font-bold">Editar Template</h2>
              <p className="text-gray-600">{editingTemplate.metadata.name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="metadata">Metadados</TabsTrigger>
              <TabsTrigger value="sections">Seções</TabsTrigger>
              <TabsTrigger value="validation">Validação</TabsTrigger>
              <TabsTrigger value="scoring">Pontuação</TabsTrigger>
            </TabsList>

            {/* Tab: Metadados */}
            <TabsContent value="metadata" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={editingTemplate.metadata.name}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, name: e.target.value }
                      })}
                      placeholder="Nome do template"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={editingTemplate.metadata.description}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, description: e.target.value }
                      })}
                      placeholder="Descrição detalhada do template"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={editingTemplate.metadata.category}
                      onValueChange={(value) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, category: value }
                      })}
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
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subcategory">Subcategoria</Label>
                    <Input
                      id="subcategory"
                      value={editingTemplate.metadata.subcategory || ''}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, subcategory: e.target.value }
                      })}
                      placeholder="Subcategoria específica"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="version">Versão</Label>
                    <Input
                      id="version"
                      value={editingTemplate.metadata.version}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, version: e.target.value }
                      })}
                      placeholder="1.0.0"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="author">Autor</Label>
                    <Input
                      id="author"
                      value={editingTemplate.metadata.author}
                      onChange={(e) => setEditingTemplate({
                        ...editingTemplate,
                        metadata: { ...editingTemplate.metadata, author: e.target.value }
                      })}
                      placeholder="Nome do autor"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        checked={editingTemplate.metadata.isPublic}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          metadata: { ...editingTemplate.metadata, isPublic: e.target.checked }
                        })}
                      />
                      <Label htmlFor="isPublic">Template Público</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={editingTemplate.metadata.isActive}
                        onChange={(e) => setEditingTemplate({
                          ...editingTemplate,
                          metadata: { ...editingTemplate.metadata, isActive: e.target.checked }
                        })}
                      />
                      <Label htmlFor="isActive">Ativo</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Seções */}
            <TabsContent value="sections" className="space-y-6">
              <div className="space-y-4">
                {editingSections.map((section, index) => (
                  <Card key={section.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                          <CardTitle className="text-lg">Seção {index + 1}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(section.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`section-name-${section.id}`}>Nome da Seção</Label>
                          <Input
                            id={`section-name-${section.id}`}
                            value={section.name}
                            onChange={(e) => updateSection(section.id, { name: e.target.value })}
                            placeholder="Nome da seção"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`section-order-${section.id}`}>Ordem</Label>
                          <Input
                            id={`section-order-${section.id}`}
                            type="number"
                            value={section.order}
                            onChange={(e) => updateSection(section.id, { order: parseInt(e.target.value) })}
                            min={1}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`section-description-${section.id}`}>Descrição</Label>
                        <Textarea
                          id={`section-description-${section.id}`}
                          value={section.description}
                          onChange={(e) => updateSection(section.id, { description: e.target.value })}
                          placeholder="Descrição da seção"
                          rows={2}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`section-required-${section.id}`}
                            checked={section.required}
                            onChange={(e) => updateSection(section.id, { required: e.target.checked })}
                          />
                          <Label htmlFor={`section-required-${section.id}`}>Obrigatória</Label>
                        </div>
                        
                        <div>
                          <Label htmlFor={`section-weight-${section.id}`}>Peso da Pontuação</Label>
                          <Input
                            id={`section-weight-${section.id}`}
                            type="number"
                            value={section.scoringWeight}
                            onChange={(e) => updateSection(section.id, { scoringWeight: parseInt(e.target.value) })}
                            min={0}
                            max={100}
                          />
                        </div>
                      </div>
                      
                      {/* Keywords */}
                      <div>
                        <Label>Palavras-chave</Label>
                        <div className="flex items-center space-x-2 mb-2">
                          <Input
                            placeholder="Adicionar palavra-chave"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addKeyword(section.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder="Adicionar palavra-chave"]`) as HTMLInputElement;
                              if (input) {
                                addKeyword(section.id, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {section.keywords.map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="cursor-pointer hover:bg-red-100"
                                   onClick={() => removeKeyword(section.id, keyword)}>
                              {keyword} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Patterns */}
                      <div>
                        <Label>Padrões Regex</Label>
                        <div className="flex items-center space-x-2 mb-2">
                          <Input
                            placeholder="Adicionar padrão regex"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addPattern(section.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder="Adicionar padrão regex"]`) as HTMLInputElement;
                              if (input) {
                                addPattern(section.id, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {section.patterns.map((pattern, idx) => (
                            <Badge key={idx} variant="outline" className="cursor-pointer hover:bg-red-100 font-mono text-xs"
                                   onClick={() => removePattern(section.id, pattern)}>
                              {pattern} ×
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Examples */}
                      <div>
                        <Label>Exemplos</Label>
                        <div className="flex items-center space-x-2 mb-2">
                          <Input
                            placeholder="Adicionar exemplo"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addExample(section.id, (e.target as HTMLInputElement).value);
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const input = document.querySelector(`input[placeholder="Adicionar exemplo"]`) as HTMLInputElement;
                              if (input) {
                                addExample(section.id, input.value);
                                input.value = '';
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {section.examples.map((example, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{example}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeExample(section.id, example)}
                                className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Nova Seção */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nova Seção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-section-name">Nome</Label>
                        <Input
                          id="new-section-name"
                          value={newSection.name}
                          onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                          placeholder="Nome da nova seção"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="new-section-order">Ordem</Label>
                        <Input
                          id="new-section-order"
                          type="number"
                          value={newSection.order}
                          onChange={(e) => setNewSection({ ...newSection, order: parseInt(e.target.value) })}
                          min={1}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-section-description">Descrição</Label>
                      <Textarea
                        id="new-section-description"
                        value={newSection.description}
                        onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                        placeholder="Descrição da nova seção"
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="new-section-required"
                          checked={newSection.required}
                          onChange={(e) => setNewSection({ ...newSection, required: e.target.checked })}
                        />
                        <Label htmlFor="new-section-required">Obrigatória</Label>
                      </div>
                      
                      <div>
                        <Label htmlFor="new-section-weight">Peso</Label>
                        <Input
                          id="new-section-weight"
                          type="number"
                          value={newSection.scoringWeight}
                          onChange={(e) => setNewSection({ ...newSection, scoringWeight: parseInt(e.target.value) })}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    
                    <Button onClick={addSection} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Seção
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Validação */}
            <TabsContent value="validation" className="space-y-6">
              <div className="space-y-4">
                {editingRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <Settings className="w-4 h-4 text-blue-600" />
                          <h3 className="font-semibold">Regra de Validação</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`rule-type-${rule.id}`}>Tipo</Label>
                          <Select
                            value={rule.type}
                            onValueChange={(value) => updateRule(rule.id, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="presence">Presença</SelectItem>
                              <SelectItem value="format">Formato</SelectItem>
                              <SelectItem value="length">Comprimento</SelectItem>
                              <SelectItem value="range">Faixa</SelectItem>
                              <SelectItem value="custom">Customizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`rule-condition-${rule.id}`}>Condição</Label>
                          <Input
                            id={`rule-condition-${rule.id}`}
                            value={rule.condition}
                            onChange={(e) => updateRule(rule.id, { condition: e.target.value })}
                            placeholder="Condição da regra"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label htmlFor={`rule-message-${rule.id}`}>Mensagem de Erro</Label>
                        <Input
                          id={`rule-message-${rule.id}`}
                          value={rule.message}
                          onChange={(e) => updateRule(rule.id, { message: e.target.value })}
                          placeholder="Mensagem exibida quando a validação falha"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-4">
                        <div>
                          <Label htmlFor={`rule-severity-${rule.id}`}>Severidade</Label>
                          <Select
                            value={rule.severity}
                            onValueChange={(value) => updateRule(rule.id, { severity: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="error">Erro</SelectItem>
                              <SelectItem value="warning">Aviso</SelectItem>
                              <SelectItem value="info">Informação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`rule-enabled-${rule.id}`}
                            checked={rule.enabled}
                            onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                          />
                          <Label htmlFor={`rule-enabled-${rule.id}`}>Ativa</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Nova Regra */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Nova Regra de Validação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="new-rule-type">Tipo</Label>
                        <Select
                          value={newRule.type}
                          onValueChange={(value) => setNewRule({ ...newRule, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="presence">Presença</SelectItem>
                            <SelectItem value="format">Formato</SelectItem>
                            <SelectItem value="length">Comprimento</SelectItem>
                            <SelectItem value="range">Faixa</SelectItem>
                            <SelectItem value="custom">Customizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="new-rule-condition">Condição</Label>
                        <Input
                          id="new-rule-condition"
                          value={newRule.condition}
                          onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                          placeholder="Condição da regra"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-rule-message">Mensagem de Erro</Label>
                      <Input
                        id="new-rule-message"
                        value={newRule.message}
                        onChange={(e) => setNewRule({ ...newRule, message: e.target.value })}
                        placeholder="Mensagem exibida quando a validação falha"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div>
                        <Label htmlFor="new-rule-severity">Severidade</Label>
                        <Select
                          value={newRule.severity}
                          onValueChange={(value) => setNewRule({ ...newRule, severity: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="error">Erro</SelectItem>
                            <SelectItem value="warning">Aviso</SelectItem>
                            <SelectItem value="info">Informação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="new-rule-enabled"
                          checked={newRule.enabled}
                          onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                        />
                        <Label htmlFor="new-rule-enabled">Ativa</Label>
                      </div>
                    </div>
                    
                    <Button onClick={addRule} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Regra
                    </Button>
                  </CardContent>
                </Card>
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
                      <div>
                        <Label htmlFor="structural-weight">Estrutural</Label>
                        <Input
                          id="structural-weight"
                          type="number"
                          value={editingTemplate.scoringWeights.structural}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            scoringWeights: {
                              ...editingTemplate.scoringWeights,
                              structural: parseInt(e.target.value)
                            }
                          })}
                          min={0}
                          max={100}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="legal-weight">Legal</Label>
                        <Input
                          id="legal-weight"
                          type="number"
                          value={editingTemplate.scoringWeights.legal}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            scoringWeights: {
                              ...editingTemplate.scoringWeights,
                              legal: parseInt(e.target.value)
                            }
                          })}
                          min={0}
                          max={100}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="clarity-weight">Clareza</Label>
                        <Input
                          id="clarity-weight"
                          type="number"
                          value={editingTemplate.scoringWeights.clarity}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            scoringWeights: {
                              ...editingTemplate.scoringWeights,
                              clarity: parseInt(e.target.value)
                            }
                          })}
                          min={0}
                          max={100}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="abnt-weight">ABNT</Label>
                        <Input
                          id="abnt-weight"
                          type="number"
                          value={editingTemplate.scoringWeights.abnt}
                          onChange={(e) => setEditingTemplate({
                            ...editingTemplate,
                            scoringWeights: {
                              ...editingTemplate.scoringWeights,
                              abnt: parseInt(e.target.value)
                            }
                          })}
                          min={0}
                          max={100}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Total:</strong> {Object.values(editingTemplate.scoringWeights).reduce((sum, weight) => sum + weight, 0)}%
                        {Object.values(editingTemplate.scoringWeights).reduce((sum, weight) => sum + weight, 0) !== 100 && 
                          <span className="text-red-600 ml-2">(Recomendado: 100%)</span>
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Campos Obrigatórios</h3>
                    <div className="space-y-2">
                      {editingTemplate.requiredFields.map((field, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={field}
                            onChange={(e) => {
                              const newFields = [...editingTemplate.requiredFields];
                              newFields[index] = e.target.value;
                              setEditingTemplate({
                                ...editingTemplate,
                                requiredFields: newFields
                              });
                            }}
                            placeholder="Nome do campo obrigatório"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFields = editingTemplate.requiredFields.filter((_, i) => i !== index);
                              setEditingTemplate({
                                ...editingTemplate,
                                requiredFields: newFields
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => setEditingTemplate({
                          ...editingTemplate,
                          requiredFields: [...editingTemplate.requiredFields, '']
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Campo Obrigatório
                      </Button>
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
