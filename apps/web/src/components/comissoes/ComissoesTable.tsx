import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Plus,
  Search
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';
import {
  Comissao,
  ComissaoFilters,
  ComissoesTableProps,
  TipoComissao,
  StatusComissao
} from '../../types/comissao';
import { useComissoes } from '../../hooks/useComissoes';

// Cores para status e tipos
const statusColors = {
  'Ativa': 'bg-green-100 text-green-800',
  'Inativa': 'bg-gray-100 text-gray-800',
  'Suspensa': 'bg-yellow-100 text-yellow-800',
  'Encerrada': 'bg-red-100 text-red-800'
};

const tipoColors = {
  'Permanente': 'bg-blue-100 text-blue-800',
  'Temporaria': 'bg-purple-100 text-purple-800'
};

// Componente de filtros
interface TableFiltersProps {
  filters: ComissaoFilters;
  onFiltersChange: (filters: ComissaoFilters) => void;
}

const TableFilters: React.FC<TableFiltersProps> = ({ filters, onFiltersChange }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="flex-1">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar comissões..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 max-w-sm"
        />
      </div>
    </div>
    <Select
      value={filters.tipo || 'all'}
      onValueChange={(value) => onFiltersChange({ ...filters, tipo: value as TipoComissao | 'all' })}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por tipo" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os tipos</SelectItem>
        <SelectItem value="Permanente">Permanente</SelectItem>
        <SelectItem value="Temporaria">Temporária</SelectItem>
      </SelectContent>
    </Select>
    <Select
      value={filters.status || 'all'}
      onValueChange={(value) => onFiltersChange({ ...filters, status: value as StatusComissao | 'all' })}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os status</SelectItem>
        <SelectItem value="Ativa">Ativa</SelectItem>
        <SelectItem value="Inativa">Inativa</SelectItem>
        <SelectItem value="Suspensa">Suspensa</SelectItem>
        <SelectItem value="Encerrada">Encerrada</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

// Componente de loading skeleton
const TableSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-12 w-full" />
      </div>
    ))}
  </div>
);

// Componente de estado vazio
interface EmptyStateProps {
  onCreateNew: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onCreateNew }) => (
  <Card>
    <CardContent className="text-center py-12">
      <Users className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        Nenhuma comissão encontrada
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Comece criando sua primeira comissão.
      </p>
      <div className="mt-6">
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>
    </CardContent>
  </Card>
);

// Componente principal da tabela
const ComissoesTable: React.FC<ComissoesTableProps> = ({
  organizationId,
  onEdit,
  onDelete,
  onView
}) => {
  const [filters, setFilters] = useState<ComissaoFilters>({
    search: '',
    tipo: 'all',
    status: 'all',
    sortBy: 'nomeDaComissao',
    sortOrder: 'asc'
  });

  const { comissoes, loading, error } = useComissoes({
    organizationId,
    filters
  });

  const handleCreateNew = () => {
    // Esta função será chamada pelo componente pai
    console.log('Criar nova comissão');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <TableFilters filters={filters} onFiltersChange={setFilters} />
        <TableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <TableFilters filters={filters} onFiltersChange={setFilters} />
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-red-500">
              <h3 className="text-sm font-medium">Erro ao carregar comissões</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (comissoes.length === 0) {
    return (
      <div className="space-y-6">
        <TableFilters filters={filters} onFiltersChange={setFilters} />
        <EmptyState onCreateNew={handleCreateNew} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TableFilters filters={filters} onFiltersChange={setFilters} />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome da Comissão</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Membros</TableHead>
              <TableHead>Data de Criação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comissoes.map((comissao) => (
              <TableRow key={comissao.id}>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">{comissao.nomeDaComissao}</div>
                    {comissao.descricao && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {comissao.descricao}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={tipoColors[comissao.tipo]}>
                    {comissao.tipo}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[comissao.status]}>
                    {comissao.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{comissao.membros.filter(m => m.ativo).length}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(comissao.dataDeCriacao), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(comissao)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(comissao)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(comissao.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ComissoesTable;