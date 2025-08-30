import { useState, useMemo, useCallback, useEffect } from 'react';
import { FilterOptions } from '@/components/dashboard/DashboardFilters';

export interface Document {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  score: number;
  type: string;
  processingTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SortConfig {
  key: keyof Document | null;
  direction: 'asc' | 'desc';
}

const defaultFilters: FilterOptions = {
  dateRange: { from: null, to: null },
  status: [],
  scoreRange: [0, 100],
  documentTypes: [],
  processingTime: [0, 60],
  searchQuery: '',
};

export function useDashboardFilters(documents: Document[]) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filters.searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters.searchQuery]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.id.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter((doc) => {
        const docDate = new Date(doc.createdAt);
        const fromDate = filters.dateRange.from;
        const toDate = filters.dateRange.to;

        if (fromDate && docDate < fromDate) return false;
        if (toDate && docDate > toDate) return false;
        return true;
      });
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter((doc) => filters.status.includes(doc.status));
    }

    // Document types filter
    if (filters.documentTypes.length > 0) {
      filtered = filtered.filter((doc) =>
        filters.documentTypes.includes(doc.type)
      );
    }

    // Score range filter
    filtered = filtered.filter(
      (doc) =>
        doc.score >= filters.scoreRange[0] && doc.score <= filters.scoreRange[1]
    );

    // Processing time filter
    filtered = filtered.filter(
      (doc) =>
        doc.processingTime >= filters.processingTime[0] &&
        doc.processingTime <= filters.processingTime[1]
    );

    return filtered;
  }, [documents, debouncedSearchQuery, filters]);

  const sortedDocuments = useMemo(() => {
    if (!sortConfig.key) return filteredDocuments;

    return [...filteredDocuments].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;

      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredDocuments, sortConfig]);

  const handleSort = useCallback((key: keyof Document) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleFiltersChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  }, []);

  const getFilterStats = useCallback(() => {
    const total = documents.length;
    const filtered = filteredDocuments.length;
    const percentage = total > 0 ? Math.round((filtered / total) * 100) : 0;

    return {
      total,
      filtered,
      percentage,
      hidden: total - filtered,
    };
  }, [documents.length, filteredDocuments.length]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery !== '' ||
      filters.status.length > 0 ||
      filters.documentTypes.length > 0 ||
      filters.scoreRange[0] > 0 ||
      filters.scoreRange[1] < 100 ||
      filters.processingTime[0] > 0 ||
      filters.processingTime[1] < 60 ||
      filters.dateRange.from !== null ||
      filters.dateRange.to !== null
    );
  }, [filters]);

  return {
    filters,
    sortConfig,
    filteredDocuments: sortedDocuments,
    handleSort,
    handleFiltersChange,
    resetFilters,
    getFilterStats,
    hasActiveFilters,
    isSearching: filters.searchQuery !== debouncedSearchQuery,
  };
}

export default useDashboardFilters;