/**
 * Tipos para paginação e resultados paginados
 */

import { Sort, Filter } from './common';

/** Opções de paginação */
export interface PaginationOptions {
  /** Página atual (baseada em 1) */
  page: number;
  /** Número de itens por página */
  limit: number;
  /** Offset para paginação baseada em cursor */
  offset?: number;
}

/** Informações de paginação */
export interface PaginationInfo {
  /** Página atual */
  currentPage: number;
  /** Total de páginas */
  totalPages: number;
  /** Número de itens por página */
  itemsPerPage: number;
  /** Total de itens */
  totalItems: number;
  /** Se há página anterior */
  hasPrevious: boolean;
  /** Se há próxima página */
  hasNext: boolean;
  /** Número da primeira página */
  firstPage: number;
  /** Número da última página */
  lastPage: number;
}

/** Resultado paginado */
export interface PaginatedResult<T> {
  /** Dados da página atual */
  data: T[];
  /** Informações de paginação */
  pagination: PaginationInfo;
  /** Metadados adicionais */
  metadata?: Record<string, unknown>;
}

/** Opções de consulta com paginação */
export interface QueryOptions extends PaginationOptions {
  /** Filtros a serem aplicados */
  filters?: Filter[];
  /** Ordenação */
  sort?: Sort[];
  /** Campos a serem incluídos na resposta */
  select?: string[];
  /** Relacionamentos a serem incluídos */
  include?: string[];
  /** Busca textual */
  search?: SearchOptions;
}

/** Opções de busca */
export interface SearchOptions {
  /** Termo de busca */
  query: string;
  /** Campos onde buscar */
  fields?: string[];
  /** Se a busca é case sensitive */
  caseSensitive?: boolean;
  /** Se deve usar busca fuzzy */
  fuzzy?: boolean;
  /** Peso dos campos para relevância */
  fieldWeights?: Record<string, number>;
}

/** Cursor para paginação baseada em cursor */
export interface Cursor {
  /** Valor do cursor */
  value: string;
  /** Campo usado para o cursor */
  field: string;
  /** Direção da paginação */
  direction: 'forward' | 'backward';
}

/** Opções de paginação por cursor */
export interface CursorPaginationOptions {
  /** Cursor para início da página */
  after?: string;
  /** Cursor para fim da página */
  before?: string;
  /** Número de itens */
  first?: number;
  /** Número de itens (reverso) */
  last?: number;
}

/** Resultado de paginação por cursor */
export interface CursorPaginatedResult<T> {
  /** Dados da página */
  data: T[];
  /** Informações dos cursors */
  pageInfo: PageInfo;
  /** Total de itens (opcional) */
  totalCount?: number;
}

/** Informações da página para cursor */
export interface PageInfo {
  /** Cursor do primeiro item */
  startCursor?: string;
  /** Cursor do último item */
  endCursor?: string;
  /** Se há página anterior */
  hasPreviousPage: boolean;
  /** Se há próxima página */
  hasNextPage: boolean;
}

/** Configurações de paginação */
export interface PaginationConfig {
  /** Limite padrão de itens por página */
  defaultLimit: number;
  /** Limite máximo de itens por página */
  maxLimit: number;
  /** Limite mínimo de itens por página */
  minLimit: number;
  /** Se deve incluir contagem total */
  includeTotalCount: boolean;
  /** Tipo de paginação preferido */
  preferredType: 'offset' | 'cursor';
}

/** Parâmetros de URL para paginação */
export interface PaginationParams {
  /** Página */
  page?: string;
  /** Limite */
  limit?: string;
  /** Ordenação */
  sort?: string;
  /** Filtros */
  filter?: string;
  /** Busca */
  search?: string;
  /** Cursor */
  cursor?: string;
}

/** Estado de paginação para componentes */
export interface PaginationState {
  /** Opções atuais */
  options: QueryOptions;
  /** Resultado atual */
  result?: PaginatedResult<unknown>;
  /** Se está carregando */
  loading: boolean;
  /** Erro se houver */
  error?: Error;
  /** Cache de páginas visitadas */
  cache: Map<string, PaginatedResult<unknown>>;
}

/** Ações de paginação */
export interface PaginationActions {
  /** Ir para página específica */
  goToPage: (page: number) => void;
  /** Ir para próxima página */
  nextPage: () => void;
  /** Ir para página anterior */
  previousPage: () => void;
  /** Ir para primeira página */
  firstPage: () => void;
  /** Ir para última página */
  lastPage: () => void;
  /** Alterar limite de itens */
  changeLimit: (limit: number) => void;
  /** Aplicar filtros */
  applyFilters: (filters: Filter[]) => void;
  /** Aplicar ordenação */
  applySort: (sort: Sort[]) => void;
  /** Aplicar busca */
  applySearch: (search: SearchOptions) => void;
  /** Limpar filtros */
  clearFilters: () => void;
  /** Recarregar dados */
  refresh: () => void;
}