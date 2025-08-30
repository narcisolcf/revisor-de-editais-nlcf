import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
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

type SortField = 'name' | 'createdAt' | 'score';
type SortDirection = 'asc' | 'desc';

interface DocumentsTableProps {
  documents: Document[];
  showAll?: boolean;
  onDocumentClick?: (document: Document) => void;
  onViewDocument?: (document: Document) => void;
  onDownloadDocument?: (document: Document) => void;
  isLoading?: boolean;
  pageSize?: number;
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

// Memoized row component for better performance
const DocumentRow = memo<{
  document: Document;
  onDocumentClick?: (document: Document) => void;
  onViewDocument?: (document: Document) => void;
  onDownloadDocument?: (document: Document) => void;
}>(({ document, onDocumentClick, onViewDocument, onDownloadDocument }) => {
  const handleViewDocument = useCallback(() => {
    if (onViewDocument) {
      onViewDocument(document);
    } else {
      console.log('Visualizar documento:', document.id);
    }
  }, [onViewDocument, document]);

  const handleDownloadDocument = useCallback(() => {
    if (onDownloadDocument) {
      onDownloadDocument(document);
    } else {
      console.log('Download documento:', document.id);
    }
  }, [onDownloadDocument, document]);

  const handleRowClick = useCallback(() => {
    onDocumentClick?.(document);
  }, [onDocumentClick, document]);

  const statusConfig = getStatusConfig(document.status);
  const StatusIcon = statusConfig.icon;

  return (
    <TableRow 
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      <TableCell>
        <div className="flex items-center space-x-3">
          <div className="text-2xl">
            {getTypeIcon(document.type)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-gray-900 truncate" title={document.name}>
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
              className="h-8 w-8 p-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleViewDocument();
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadDocument();
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
});

DocumentRow.displayName = 'DocumentRow';

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  showAll = false,
  onDocumentClick,
  onViewDocument,
  onDownloadDocument,
  isLoading = false,
  pageSize = 10
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar e ordenar documentos com memoização
  const filteredAndSortedDocuments = useMemo(() => {
    return documents
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
      });
  }, [documents, searchQuery, statusFilter, sortBy, sortOrder]);

  // Paginação inteligente
  const totalPages = showAll ? Math.ceil(filteredAndSortedDocuments.length / pageSize) : 1;
  const startIndex = showAll ? (currentPage - 1) * pageSize : 0;
  const endIndex = showAll ? startIndex + pageSize : (filteredAndSortedDocuments.length > 10 ? 10 : filteredAndSortedDocuments.length);
  const paginatedDocuments = filteredAndSortedDocuments.slice(startIndex, endIndex);

  // Reset página quando filtros mudam
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy, sortOrder]);

  const handleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className={`h-3 w-3 transition-colors ${
          sortBy === field ? 'text-blue-600' : 'text-gray-400'
        }`} />
        {sortBy === field && (
          <span className="text-xs text-blue-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: showAll ? pageSize : 5 }).map((_, index) => (
        <div key={index} className="flex space-x-4 items-center">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          {showAll && (
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          <TableSkeleton />
        </CardContent>
      </Card>
    );
  }

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
              {showAll && totalPages > 1 && (
                <Badge variant="secondary">
                  Página {currentPage} de {totalPages}
                </Badge>
              )}
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
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="name">Documento</SortableHeader>
                    <TableHead>Status</TableHead>
                    <SortableHeader field="score">Score</SortableHeader>
                    <TableHead>Tempo</TableHead>
                    <SortableHeader field="createdAt">Data</SortableHeader>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((document) => (
                    <DocumentRow
                      key={document.id}
                      document={document}
                      onDocumentClick={onDocumentClick}
                      onViewDocument={onViewDocument}
                      onDownloadDocument={onDownloadDocument}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Controls */}
            {showAll && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredAndSortedDocuments.length)} de {filteredAndSortedDocuments.length} documentos
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentsTable;