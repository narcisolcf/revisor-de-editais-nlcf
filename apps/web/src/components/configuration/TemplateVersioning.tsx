/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  GitBranch, 
  GitCommit, 
  GitMerge, 
  GitPullRequest,
  History,
  Calendar,
  User,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Copy,
  Share2,
  X
} from 'lucide-react';
import { TemplateStructure } from '../../types/template';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface TemplateVersioningProps {
  organizationId: string;
}

interface TemplateVersion {
  id: string;
  version: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  author: string;
  createdAt: Date;
  status: 'draft' | 'review' | 'approved' | 'merged' | 'archived';
  changes: VersionChange[];
  parentVersion?: string;
  mergeBase?: string;
}

interface VersionChange {
  id: string;
  type: 'added' | 'modified' | 'removed';
  section: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

interface ApprovalStatus {
  id: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  date: Date;
}

interface VersionComparison {
  fromVersion: string;
  toVersion: string;
  changes: VersionChange[];
  summary: {
    added: number;
    modified: number;
    removed: number;
    totalImpact: string;
  };
}

export const TemplateVersioning: React.FC<TemplateVersioningProps> = ({
  organizationId
}) => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [comparisonFrom, setComparisonFrom] = useState<string>('');
  const [comparisonTo, setComparisonTo] = useState<string>('');

  // Mock data - em produção viria de API
  const versions: TemplateVersion[] = [
    {
      id: 'v1',
      version: '1.0.0',
      branch: 'main',
      commitHash: 'a1b2c3d4',
      commitMessage: 'Versão inicial do template',
      author: 'João Silva',
      createdAt: new Date('2024-01-01'),
      status: 'merged',
      changes: [
        {
          id: 'c1',
          type: 'added',
          section: 'Objeto da Contratação',
          description: 'Nova seção obrigatória',
          impact: 'high',
          details: 'Seção criada com validações e regras de pontuação'
        }
      ]
    },
    {
      id: 'v2',
      version: '1.1.0',
      branch: 'feature/validation-rules',
      commitHash: 'e5f6g7h8',
      commitMessage: 'Adiciona regras de validação avançadas',
      author: 'Maria Santos',
      createdAt: new Date('2024-01-15'),
      status: 'review',
      parentVersion: 'v1',
      changes: [
        {
          id: 'c2',
          type: 'modified',
          section: 'Validações',
          description: 'Regras de validação expandidas',
          impact: 'medium',
          details: 'Adicionadas 5 novas regras de validação com diferentes severidades'
        }
      ]
    },
    {
      id: 'v3',
      version: '1.2.0',
      branch: 'feature/scoring-weights',
      commitHash: 'i9j0k1l2',
      commitMessage: 'Implementa sistema de pesos configuráveis',
      author: 'Pedro Costa',
      createdAt: new Date('2024-02-01'),
      status: 'draft',
      parentVersion: 'v2',
      changes: [
        {
          id: 'c3',
          type: 'added',
          section: 'Configuração de Pontuação',
          description: 'Sistema de pesos flexível',
          impact: 'high',
          details: 'Permite configurar pesos por categoria e seção'
        }
      ]
    }
  ];

  const approvalStatuses: ApprovalStatus[] = [
    {
      id: 'a1',
      approver: 'Ana Oliveira',
      status: 'approved',
      comment: 'Template aprovado para produção',
      date: new Date('2024-01-20')
    },
    {
      id: 'a2',
      approver: 'Carlos Lima',
      status: 'pending',
      comment: 'Aguardando revisão técnica',
      date: new Date('2024-01-25')
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary';
      case 'review':
        return 'default';
      case 'approved':
        return 'default';
      case 'merged':
        return 'default';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Rascunho';
      case 'review':
        return 'Em Revisão';
      case 'approved':
        return 'Aprovado';
      case 'merged':
        return 'Mesclado';
      case 'archived':
        return 'Arquivado';
      default:
        return status;
    }
  };

  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'default';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'low':
        return 'Baixo';
      case 'medium':
        return 'Médio';
      case 'high':
        return 'Alto';
      case 'critical':
        return 'Crítico';
      default:
        return impact;
    }
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'added':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'modified':
        return <ArrowDown className="w-4 h-4 text-yellow-600" />;
      case 'removed':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowDown className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleVersionSelect = (version: TemplateVersion) => {
    setSelectedVersion(version);
  };

  const handleCreateBranch = () => {
    console.log('Criar nova branch');
  };

  const handleCreateVersion = () => {
    console.log('Criar nova versão');
  };

  const handleMergeRequest = () => {
    console.log('Criar merge request');
  };

  const handleRollback = () => {
    console.log('Fazer rollback');
  };

  const handleCompareVersions = () => {
    if (comparisonFrom && comparisonTo) {
      console.log('Comparar versões:', comparisonFrom, comparisonTo);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Versionamento de Templates</h2>
          <p className="text-gray-600">
            Gerencie versões, branches e histórico de mudanças dos templates
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCreateBranch}>
            <GitBranch className="w-4 h-4 mr-2" />
            Nova Branch
          </Button>
          <Button variant="outline" onClick={handleCreateVersion}>
            <GitCommit className="w-4 h-4 mr-2" />
            Nova Versão
          </Button>
          <Button onClick={handleMergeRequest}>
            <GitPullRequest className="w-4 h-4 mr-2" />
            Merge Request
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
        </TabsList>

        {/* Tab: Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="space-y-4">
            {versions.map((version) => (
              <Card key={version.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <GitCommit className="w-5 h-5 text-blue-600" />
                          <span className="font-mono text-sm text-gray-600">{version.commitHash}</span>
                        </div>
                        
                        <Badge variant={getStatusBadgeVariant(version.status)}>
                          {getStatusLabel(version.status)}
                        </Badge>
                        
                        <Badge variant="outline">v{version.version}</Badge>
                        
                        <Badge variant="secondary">{version.branch}</Badge>
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{version.commitMessage}</h3>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{version.author}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{version.createdAt.toLocaleDateString()}</span>
                        </div>
                        
                        {version.parentVersion && (
                          <div className="flex items-center space-x-1">
                            <GitBranch className="w-4 h-4" />
                            <span>Base: v{version.parentVersion}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        {version.changes.map((change) => (
                          <div key={change.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
                            {getChangeTypeIcon(change.type)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium">{change.section}</span>
                                <Badge variant={getImpactBadgeVariant(change.impact)}>
                                  {getImpactLabel(change.impact)}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700">{change.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{change.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVersionSelect(version)}
                      >
                        <History className="w-4 h-4 mr-1" />
                        Detalhes
                      </Button>
                      
                      {version.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRollback}
                        >
                          <GitBranch className="w-4 h-4 mr-1" />
                          Rollback
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Branches */}
        <TabsContent value="branches" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {versions.map((version) => (
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-blue-600" />
                      <CardTitle className="text-lg">{version.branch}</CardTitle>
                    </div>
                    <Badge variant={getStatusBadgeVariant(version.status)}>
                      {getStatusLabel(version.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <p><strong>Último commit:</strong> {version.commitMessage}</p>
                    <p><strong>Autor:</strong> {version.author}</p>
                    <p><strong>Data:</strong> {version.createdAt.toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Copy className="w-4 h-4 mr-1" />
                      Checkout
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Share2 className="w-4 h-4 mr-1" />
                      Push
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Comparação */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comparar Versões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Versão Base</Label>
                  <Select value={comparisonFrom} onValueChange={setComparisonFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar versão base" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} - {version.branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Versão de Comparação</Label>
                  <Select value={comparisonTo} onValueChange={setComparisonTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar versão para comparar" />
                    </SelectTrigger>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          v{version.version} - {version.branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={handleCompareVersions}
                disabled={!comparisonFrom || !comparisonTo}
                className="w-full"
              >
                <GitBranch className="w-4 h-4 mr-2" />
                Comparar Versões
              </Button>
              
              {comparisonFrom && comparisonTo && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Comparando <strong>v{versions.find(v => v.id === comparisonFrom)?.version}</strong> 
                    com <strong>v{versions.find(v => v.id === comparisonTo)?.version}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Aprovações */}
        <TabsContent value="approvals" className="space-y-4">
          <div className="space-y-4">
            {approvalStatuses.map((approval) => (
              <Card key={approval.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{approval.approver}</h3>
                          <p className="text-sm text-gray-600">
                            {approval.date.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={approval.status === 'approved' ? 'default' : 'secondary'}>
                          {approval.status === 'approved' ? 'Aprovado' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      {approval.comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                            <p className="text-sm text-gray-700">{approval.comment}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {approval.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">
                            <ArrowUp className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowDown className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes da Versão */}
      {selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Detalhes da Versão</h2>
                <p className="text-gray-600">v{selectedVersion.version} - {selectedVersion.branch}</p>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Informações do Commit</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Hash:</span>
                      <p className="font-mono bg-gray-100 p-2 rounded mt-1">{selectedVersion.commitHash}</p>
                    </div>
                    <div>
                      <span className="font-medium">Mensagem:</span>
                      <p className="mt-1">{selectedVersion.commitMessage}</p>
                    </div>
                    <div>
                      <span className="font-medium">Autor:</span>
                      <p className="mt-1">{selectedVersion.author}</p>
                    </div>
                    <div>
                      <span className="font-medium">Data:</span>
                      <p className="mt-1">{selectedVersion.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Mudanças</h3>
                  <div className="space-y-3">
                    {selectedVersion.changes.map((change) => (
                      <div key={change.id} className="border rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          {getChangeTypeIcon(change.type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium">{change.section}</h4>
                              <Badge variant={getImpactBadgeVariant(change.impact)}>
                                {getImpactLabel(change.impact)}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-2">{change.description}</p>
                            <p className="text-sm text-gray-500">{change.details}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
