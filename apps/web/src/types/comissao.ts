// Tipos para o módulo de Comissões

export type TipoComissao = 'Permanente' | 'Temporaria';
export type StatusComissao = 'Ativa' | 'Inativa' | 'Suspensa' | 'Encerrada';
export type PapelMembro = 'Presidente' | 'Vice-Presidente' | 'Secretario' | 'Membro' | 'Suplente';

export interface ConfiguracoesComissao {
  requererQuorum?: boolean;
  quorumMinimo?: number;
  permitirSubstituicoes?: boolean;
  notificarMembros?: boolean;
}

export interface MembroComissao {
  servidorId: string;
  papel: PapelMembro;
  dataDeIngresso: Date;
  dataDeSaida?: Date;
  ativo: boolean;
  observacoes?: string;
  // Dados do servidor (populados via join)
  servidor?: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    avatar?: string;
  };
}

export interface Comissao {
  id: string;
  organizationId: string;
  nomeDaComissao: string;
  tipo: TipoComissao;
  status: StatusComissao;
  dataDeCriacao: Date;
  dataDeEncerramento?: Date;
  descricao?: string;
  objetivo?: string;
  configuracoes?: ConfiguracoesComissao;
  membros: MembroComissao[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para requisições da API
export interface CreateComissaoRequest {
  nomeDaComissao: string;
  tipo: TipoComissao;
  dataDeCriacao: Date;
  dataDeEncerramento?: Date;
  descricao?: string;
  objetivo?: string;
  configuracoes?: ConfiguracoesComissao;
}

export interface UpdateComissaoRequest {
  nomeDaComissao?: string;
  tipo?: TipoComissao;
  status?: StatusComissao;
  dataDeCriacao?: Date;
  dataDeEncerramento?: Date;
  descricao?: string;
  objetivo?: string;
  configuracoes?: ConfiguracoesComissao;
}

export interface AddMembroRequest {
  servidorId: string;
  papel: PapelMembro;
  observacoes?: string;
}

export interface UpdateMembroRequest {
  papel?: PapelMembro;
  ativo?: boolean;
  observacoes?: string;
}

// Tipos para filtros e paginação
export interface ComissaoFilters {
  search?: string;
  tipo?: TipoComissao | 'all';
  status?: StatusComissao | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ComissaoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ComissoesResponse {
  data: Comissao[];
  pagination: ComissaoPagination;
}

// Tipos para estatísticas
export interface ComissaoStats {
  totalComissoes: number;
  comissoesAtivas: number;
  comissoesPermanentes: number;
  comissoesTemporarias: number;
  totalMembros: number;
  membrosAtivos: number;
}

// Tipos para histórico
export interface HistoricoComissao {
  id: string;
  comissaoId: string;
  acao: 'criacao' | 'edicao' | 'adicao_membro' | 'remocao_membro' | 'alteracao_status';
  descricao: string;
  dadosAnteriores?: Record<string, any>;
  dadosNovos?: Record<string, any>;
  realizadoPor: string;
  realizadoEm: Date;
}

// Tipos para servidores disponíveis
export interface ServidorDisponivel {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  avatar?: string;
  ativo: boolean;
}

// Props dos componentes
export interface ComissoesTableProps {
  organizationId: string;
  onEdit: (comissao: Comissao) => void;
  onDelete: (comissaoId: string) => void;
  onView: (comissao: Comissao) => void;
}

export interface ComissaoFormProps {
  comissao?: Comissao;
  organizationId: string;
  onSubmit: (data: CreateComissaoRequest | UpdateComissaoRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface MembrosManagerProps {
  comissaoId: string;
  organizationId: string;
  membros: MembroComissao[];
  onMembrosChange: (membros: MembroComissao[]) => void;
  readonly?: boolean;
}

export interface ComissaoDetailsProps {
  comissao: Comissao;
  onEdit: () => void;
  onClose: () => void;
}

// Tipos para hooks
export interface UseComissoesOptions {
  organizationId: string;
  filters?: ComissaoFilters;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface UseComissoesReturn {
  comissoes: Comissao[];
  loading: boolean;
  error: string | null;
  pagination: ComissaoPagination;
  createComissao: (data: CreateComissaoRequest) => Promise<Comissao>;
  updateComissao: (id: string, data: UpdateComissaoRequest) => Promise<Comissao>;
  deleteComissao: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}