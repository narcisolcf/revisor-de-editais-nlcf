import React, { useState, useCallback } from 'react';
import { Calendar, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

export interface FilterOptions {
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  status: string[];
  scoreRange: [number, number];
  documentTypes: string[];
  processingTime: [number, number];
  searchQuery: string;
}

export interface DashboardFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const statusOptions = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processando', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'error', label: 'Erro', color: 'bg-red-100 text-red-800' },
];

const documentTypeOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word' },
  { value: 'txt', label: 'Texto' },
  { value: 'xlsx', label: 'Excel' },
];

export function DashboardFilters({
  filters,
  onFiltersChange,
  onReset,
  isLoading = false,
}: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = useCallback(
    (updates: Partial<FilterOptions>) => {
      onFiltersChange({ ...filters, ...updates });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (status: string, checked: boolean) => {
      const newStatus = checked
        ? [...filters.status, status]
        : filters.status.filter((s) => s !== status);
      updateFilters({ status: newStatus });
    },
    [filters.status, updateFilters]
  );

  const handleDocumentTypeChange = useCallback(
    (type: string, checked: boolean) => {
      const newTypes = checked
        ? [...filters.documentTypes, type]
        : filters.documentTypes.filter((t) => t !== type);
      updateFilters({ documentTypes: newTypes });
    },
    [filters.documentTypes, updateFilters]
  );

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status.length > 0) count++;
    if (filters.documentTypes.length > 0) count++;
    if (filters.scoreRange[0] > 0 || filters.scoreRange[1] < 100) count++;
    if (filters.processingTime[0] > 0 || filters.processingTime[1] < 60) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">Filtros</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">
              Buscar
            </Label>
            <Input
              id="search"
              placeholder="Buscar documentos..."
              value={filters.searchQuery}
              onChange={(e) => updateFilters({ searchQuery: e.target.value })}
              disabled={isLoading}
              className="h-9"
            />
          </div>

          {/* Período */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Período</Label>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateRange.from
                      ? formatDate(filters.dateRange.from)
                      : 'Data inicial'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <input
                    type="date"
                    className="p-2 border-0 outline-none"
                    onChange={(e) =>
                      updateFilters({
                        dateRange: {
                          ...filters.dateRange,
                          from: e.target.value ? new Date(e.target.value) : null,
                        },
                      })
                    }
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 justify-start text-left font-normal"
                    disabled={isLoading}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateRange.to
                      ? formatDate(filters.dateRange.to)
                      : 'Data final'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <input
                    type="date"
                    className="p-2 border-0 outline-none"
                    onChange={(e) =>
                      updateFilters({
                        dateRange: {
                          ...filters.dateRange,
                          to: e.target.value ? new Date(e.target.value) : null,
                        },
                      })
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={filters.status.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleStatusChange(option.value, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`status-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    <Badge className={`${option.color} text-xs`}>
                      {option.label}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Tipos de Documento */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tipos de Documento</Label>
            <div className="grid grid-cols-2 gap-2">
              {documentTypeOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${option.value}`}
                    checked={filters.documentTypes.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleDocumentTypeChange(option.value, checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`type-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Score Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Score ({filters.scoreRange[0]}% - {filters.scoreRange[1]}%)
            </Label>
            <Slider
              value={filters.scoreRange}
              onValueChange={(value) =>
                updateFilters({ scoreRange: value as [number, number] })
              }
              max={100}
              min={0}
              step={5}
              className="w-full"
              disabled={isLoading}
            />
          </div>

          {/* Processing Time Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tempo de Processamento ({filters.processingTime[0]}s -{' '}
              {filters.processingTime[1]}s)
            </Label>
            <Slider
              value={filters.processingTime}
              onValueChange={(value) =>
                updateFilters({ processingTime: value as [number, number] })
              }
              max={60}
              min={0}
              step={1}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default DashboardFilters;