/* eslint-disable no-unused-vars */
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Search, Grid, List } from 'lucide-react';

interface TemplateFiltersProps {
  searchQuery: string;
  categoryFilter: string;
  statusFilter: string;
  sortBy: 'name' | 'usage' | 'rating' | 'updated';
  viewMode: 'grid' | 'list';
  onSearchChange: (query: string) => void;
  onCategoryFilterChange: (category: string) => void;
  onStatusFilterChange: (status: string) => void;
  onSortChange: (field: 'name' | 'usage' | 'rating' | 'updated') => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  searchQuery,
  categoryFilter,
  statusFilter,
  sortBy,
  viewMode,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onSortChange,
  onViewModeChange
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Categorias</SelectItem>
              <SelectItem value="edital">Editais</SelectItem>
              <SelectItem value="tr">Termos de Referência</SelectItem>
              <SelectItem value="etp">ETPs</SelectItem>
              <SelectItem value="mapa_risco">Mapas de Risco</SelectItem>
              <SelectItem value="minuta">Minutas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="usage">Uso</SelectItem>
              <SelectItem value="rating">Avaliação</SelectItem>
              <SelectItem value="updated">Atualizado</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
