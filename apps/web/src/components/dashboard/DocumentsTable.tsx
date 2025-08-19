import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Eye,
  Download,
  MoreHorizontal,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'completed' | 'processing' | 'failed';
  score: number;
  createdAt: Date;
  processingTime: number;
}

interface DocumentsTableProps {
  documents: Document[];
  showAll?: boolean;
  onDocumentClick?: (document: Document) => void;
  onViewDocument?: (document: Document) => void;
  onDownloadDocument?: (document: Document) => void;
}

const getStatusConfig = (status: Document['status']) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Concluído',
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle
      };
    case 'processing':
      return {
        label: 'Processando',
        color: 'bg-blue-100 text-blue-800',
        icon: RefreshCw
      };
    case 'failed':
      return {
        label: 'Falhou',
        color: 'bg-red-100 text-red-800',
        icon: AlertTriangle
      };
    default:
      return {
        label: 'Desconhecido',
        color: 'bg-gray-100 text-gray-800',
        icon: Clock
      };
  }
};

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-green-600 bg-green-50';
  if (score >= 80) return 'text-blue-600 bg-blue-50';
  if (score >= 70) return 'text-yellow-600 bg-yellow-50';
  if (score >= 60) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'pdf':
      return '📄';
    case 'docx':
    case 'doc':
      return '📝';
    case 'xlsx':
    case 'xls':
      return '📊';
    default:
      return '📄';
  }
};

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  showAll = false,
  onDocumentClick,
  onViewDocument,
  onDownloadDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'score'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtrar e ordenar documentos
  const filteredAndSortedDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    })
    .slice(0, showAll ? undefined : 10);

  const handleSort = (field: 'name' | 'createdAt' | 'score') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDocument = (document: Document) => {
    if (onViewDocument) {
      onViewDocument(document);
    } else {
      // Implementação padrão
      console.log('Visualizar documento:', document.id);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    if (onDownloadDocument) {
      onDownloadDocument(document);
    } else {
      // Implementação padrão
      console.log('Download documento:', document.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Documentos Recentes</span>
              <Badge variant="outline">
                {filteredAndSortedDocuments.length}
                {!showAll && documents.length > 10 && ` de ${documents.length}`}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {showAll ? 'Todos os documentos' : 'Últimos documentos processados'}
            </p>
          </div>
          
          {!showAll && documents.length > 10 && (
            <Button variant="outline" size="sm">
              Ver Todos ({documents.length})
            </Button>
          )}
        </div>
        
        {/* Filtros */}
        {showAll && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Status: {statusFilter === 'all' ? 'Todos' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  Todos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
                  Concluído
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                  Processando
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('failed')}>
                  Falhou
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredAndSortedDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? 'Nenhum documento encontrado' : 'Nenhum documento corresponde aos filtros'}
            </h3>
            <p className="text-gray-600">
              {documents.length === 0 
                ? 'Faça o upload do primeiro documento para começar'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Documento</span>
                      {sortBy === 'name' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('score')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Score</span>
                      {sortBy === 'score' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Tempo</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data</span>
                      {sortBy === 'createdAt' && (
                        <span className="text-xs">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDocuments.map((document) => {
                  const statusConfig = getStatusConfig(document.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <TableRow 
                      key={document.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onDocumentClick?.(document)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getTypeIcon(document.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">
                              {document.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {document.type.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        {document.status === 'completed' ? (
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(document.score)}`}>
                            {document.score.toFixed(1)}%
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {document.status === 'completed' ? (
                          <span className="text-sm text-gray-600">
                            {document.processingTime.toFixed(1)}s
                          </span>
                        ) : document.status === 'processing' ? (
                          <div className="flex items-center space-x-1 text-blue-600">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span className="text-sm">Processando...</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(document.createdAt, 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDocument(document);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadDocument(document);
                              }}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsTable;