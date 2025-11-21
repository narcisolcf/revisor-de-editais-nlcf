import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { DocumentService } from '@/services/documentService';
import { DocumentUpload, DocumentAnalysis } from '@/types/document';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeOpen, safeDocument } from '@/lib/browser-utils';

interface DocumentDashboardProps {
  prefeituraId: string;
  onUploadClick?: () => void;
  onDocumentSelect?: (document: DocumentUpload) => void;
}

interface DocumentStats {
  total: number;
  pendentes: number;
  processando: number;
  concluidos: number;
  erros: number;
}

export const DocumentDashboard: React.FC<DocumentDashboardProps> = ({
  prefeituraId,
  onUploadClick,
  onDocumentSelect
}) => {
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    pendentes: 0,
    processando: 0,
    concluidos: 0,
    erros: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  // Carregar documentos e estatísticas
  const loadData = async () => {
    try {
      setLoading(true);
      const [documentsData, statsData] = await Promise.all([
        DocumentService.getDocumentosByPrefeitura(prefeituraId),
        DocumentService.getDocumentStats(prefeituraId)
      ]);
      
      setDocuments(documentsData);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar documentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [prefeituraId]);

  // Filtrar documentos
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = typeFilter === 'all' || doc.tipo === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Obter cor do status
  const getStatusColor = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'processando':
        return 'bg-blue-100 text-blue-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'pendente':
        return Clock;
      case 'processando':
        return RefreshCw;
      case 'concluido':
        return CheckCircle;
      case 'erro':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  // Calcular porcentagem de conclusão
  const completionRate = stats.total > 0 ? (stats.concluidos / stats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Documentos</h1>
          <p className="text-gray-600">Gerencie e monitore seus documentos</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {onUploadClick && (
            <Button onClick={onUploadClick}>
              <Upload className="w-4 h-4 mr-2" />
              Novo Upload
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{stats.concluidos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">{completionRate.toFixed(1)}% concluído</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processando</p>
                <p className="text-2xl font-bold text-blue-600">{stats.processando}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <p className="text-2xl font-bold text-red-600">{stats.erros}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="DOCX">DOCX</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documentos ({filteredDocuments.length})</span>
            <Badge variant="outline">
              {filteredDocuments.length} de {documents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {documents.length === 0 ? 'Nenhum documento encontrado' : 'Nenhum documento corresponde aos filtros'}
              </h3>
              <p className="text-gray-600 mb-4">
                {documents.length === 0 
                  ? 'Faça o upload do primeiro documento para começar'
                  : 'Tente ajustar os filtros de busca'
                }
              </p>
              {documents.length === 0 && onUploadClick && (
                <Button onClick={onUploadClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDocuments.map((document) => {
                const StatusIcon = getStatusIcon(document.status);
                
                return (
                  <div
                    key={document.id}
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onDocumentSelect?.(document)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium truncate">{document.nome}</h3>
                        <Badge variant="outline">{document.tipo}</Badge>
                        <Badge className={getStatusColor(document.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {document.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{(document.tamanho / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{format(document.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        {document.descricao && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-xs">{document.descricao}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          safeOpen(document.urlStorage, '_blank');
                        }}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const doc = safeDocument();
                          if (doc) {
                            const link = doc.createElement('a');
                            link.href = document.urlStorage;
                            link.download = document.nome;
                            link.click();
                          }
                        }}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentDashboard;