import {
  Comissao,
  ComissoesResponse,
  CreateComissaoRequest,
  UpdateComissaoRequest,
  AddMembroRequest,
  UpdateMembroRequest,
  ComissaoStats,
  HistoricoComissao,
  ServidorDisponivel,
  ComissaoFilters
} from '../types/comissao';

// URL base da API - ajustar conforme configuração do projeto
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://us-central1-revisor-editais.cloudfunctions.net';

class ComissoesService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/comissoesApi${endpoint}`;
    
    // Obter token de autenticação (ajustar conforme sistema de auth do projeto)
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  // Listar comissões
  async list(
    organizationId: string,
    filters?: ComissaoFilters,
    page = 1,
    limit = 20
  ): Promise<ComissoesResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.search && { search: filters.search }),
      ...(filters?.tipo && filters.tipo !== 'all' && { tipo: filters.tipo }),
      ...(filters?.status && filters.status !== 'all' && { status: filters.status }),
      ...(filters?.sortBy && { sortBy: filters.sortBy }),
      ...(filters?.sortOrder && { sortOrder: filters.sortOrder }),
    });

    return this.request<ComissoesResponse>(`/${organizationId}/comissoes?${params}`);
  }

  // Obter comissão por ID
  async getById(organizationId: string, comissaoId: string): Promise<Comissao> {
    return this.request<Comissao>(`/${organizationId}/comissoes/${comissaoId}`);
  }

  // Criar nova comissão
  async create(organizationId: string, data: CreateComissaoRequest): Promise<Comissao> {
    return this.request<Comissao>(`/${organizationId}/comissoes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Atualizar comissão
  async update(
    organizationId: string,
    comissaoId: string,
    data: UpdateComissaoRequest
  ): Promise<Comissao> {
    return this.request<Comissao>(`/${organizationId}/comissoes/${comissaoId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Deletar comissão
  async delete(organizationId: string, comissaoId: string): Promise<void> {
    return this.request<void>(`/${organizationId}/comissoes/${comissaoId}`, {
      method: 'DELETE',
    });
  }

  // Gerenciamento de membros
  async addMembro(
    organizationId: string,
    comissaoId: string,
    data: AddMembroRequest
  ): Promise<void> {
    return this.request<void>(`/${organizationId}/comissoes/${comissaoId}/membros`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMembro(
    organizationId: string,
    comissaoId: string,
    servidorId: string,
    data: UpdateMembroRequest
  ): Promise<void> {
    return this.request<void>(
      `/${organizationId}/comissoes/${comissaoId}/membros/${servidorId}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async removeMembro(
    organizationId: string,
    comissaoId: string,
    servidorId: string
  ): Promise<void> {
    return this.request<void>(
      `/${organizationId}/comissoes/${comissaoId}/membros/${servidorId}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Estatísticas
  async getStats(organizationId: string): Promise<ComissaoStats> {
    return this.request<ComissaoStats>(`/${organizationId}/comissoes/stats`);
  }

  // Histórico
  async getHistorico(
    organizationId: string,
    comissaoId: string,
    page = 1,
    limit = 20
  ): Promise<{ data: HistoricoComissao[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return this.request<{ data: HistoricoComissao[]; pagination: any }>(
      `/${organizationId}/comissoes/${comissaoId}/historico?${params}`
    );
  }

  // Servidores disponíveis
  async getServidoresDisponiveis(organizationId: string): Promise<ServidorDisponivel[]> {
    return this.request<ServidorDisponivel[]>(`/${organizationId}/servidores`);
  }
}

// Instância singleton do serviço
export const comissoesService = new ComissoesService();
export default comissoesService;