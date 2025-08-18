/**
 * Comissão Service - Business logic for Comissões
 * LicitaReview Cloud Functions
 */

import { Firestore } from 'firebase-admin/firestore';
import { ComissaoRepository } from '../db/repositories/ComissaoRepository';
import { 
  Comissao, 
  CreateComissaoRequest, 
  UpdateComissaoRequest,
  ComissaoDetalhada,
  ComissoesQueryOptions,
  MembroComissao,
  AdicionarMembroRequest,
  AtualizarMembroRequest,
  TipoComissao,
  StatusComissao,
  PapelMembro,
  ComissaoStats,
  ComissaoHistoryEntry
} from '../types';

export class ComissaoService {
  private repository: ComissaoRepository;
  private db: Firestore;
  private organizationId: string;

  constructor(db: Firestore, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
    this.repository = new ComissaoRepository(db, organizationId);
  }

  /**
   * List comissões with filtering and pagination
   */
  async listComissoes(options: ComissoesQueryOptions): Promise<{
    data: Comissao[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const result = await this.repository.findWithFilters(options);
    
    const page = options.page || 1;
    const limit = options.limit || 20;
    const totalPages = Math.ceil(result.total / limit);
    
    return {
      data: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages,
        hasNext: result.hasMore,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get comissão by ID with detailed member information
   */
  async getComissaoById(id: string): Promise<ComissaoDetalhada | null> {
    return await this.repository.findByIdDetailed(id);
  }

  /**
   * Create new comissão
   */
  async createComissao(data: CreateComissaoRequest, createdBy: string): Promise<Comissao> {
    // Validate business rules
    await this.validateCreateRequest(data);

    // Prepare data for creation
    const now = new Date();
    const comissaoData = {
      nomeDaComissao: data.nomeDaComissao,
      tipo: data.tipo,
      dataDeCriacao: new Date(data.dataDeCriacao),
      dataDeEncerramento: data.dataDeEncerramento ? new Date(data.dataDeEncerramento) : undefined,
      descricao: data.descricao,
      objetivo: data.objetivo,
      membros: data.membros.map(membro => ({
        ...membro,
        dataDeIngresso: now,
        ativo: true
      })),
      status: StatusComissao.ATIVA,
      organizationId: this.organizationId,
      createdBy,
      createdAt: now,
      updatedAt: now,
      configuracoes: data.configuracoes
    };

    const comissao = await this.repository.create(comissaoData as any);
    
    // Log creation
    await this.logHistory((comissao as any).id, 'created', {}, createdBy, 'Comissão criada');
    
    return comissao;
  }

  /**
   * Update comissão
   */
  async updateComissao(id: string, data: UpdateComissaoRequest, updatedBy: string): Promise<Comissao | null> {
    const existingComissao = await this.repository.findById(id);
    if (!existingComissao) {
      throw new Error('Comissão não encontrada');
    }

    // Validate business rules
    await this.validateUpdateRequest(existingComissao, data as any);

    // Prepare update data
    const updateData = {
      ...data,
      dataDeEncerramento: data.dataDeEncerramento,
      lastModifiedBy: updatedBy,
      updatedAt: new Date()
    };

    const updatedComissao = await this.repository.update(id, updateData);
    
    // Log update
    await this.logHistory(id, 'updated', data, updatedBy, 'Comissão atualizada');
    
    return updatedComissao;
  }

  /**
   * Delete comissão
   */
  async deleteComissao(id: string, deletedBy: string): Promise<void> {
    const existingComissao = await this.repository.findById(id);
    if (!existingComissao) {
      throw new Error('Comissão não encontrada');
    }

    // Check if can be deleted
    if (existingComissao.status === StatusComissao.ATIVA) {
      throw new Error('Não é possível deletar uma comissão ativa. Altere o status primeiro.');
    }

    await this.repository.delete(id);
    
    // Log deletion
    await this.logHistory(id, 'updated', { status: 'deleted' }, deletedBy, 'Comissão deletada');
  }

  /**
   * Add member to comissão
   */
  async adicionarMembro(comissaoId: string, data: AdicionarMembroRequest, addedBy: string): Promise<void> {
    const comissao = await this.repository.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    // Validate business rules
    await this.validateAddMember(comissao, data);

    await this.repository.adicionarMembro(comissaoId, data);
    
    // Log member addition
    await this.logHistory(
      comissaoId, 
      'member_added', 
      { servidorId: data.servidorId, papel: data.papel }, 
      addedBy, 
      `Membro ${data.servidorId} adicionado como ${data.papel}`
    );
  }

  /**
   * Remove member from comissão
   */
  async removerMembro(comissaoId: string, servidorId: string, removedBy: string): Promise<void> {
    const comissao = await this.repository.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    const membro = comissao.membros.find(m => m.servidorId === servidorId);
    if (!membro) {
      throw new Error('Membro não encontrado na comissão');
    }

    // Check if can remove (e.g., must have at least one member)
    const membrosAtivos = comissao.membros.filter(m => m.ativo && m.servidorId !== servidorId);
    if (membrosAtivos.length === 0) {
      throw new Error('Não é possível remover o último membro ativo da comissão');
    }

    await this.repository.removerMembro(comissaoId, servidorId);
    
    // Log member removal
    await this.logHistory(
      comissaoId, 
      'member_removed', 
      { servidorId, papel: membro.papel }, 
      removedBy, 
      `Membro ${servidorId} removido`
    );
  }

  /**
   * Update member in comissão
   */
  async atualizarMembro(
    comissaoId: string, 
    servidorId: string, 
    data: AtualizarMembroRequest, 
    updatedBy: string
  ): Promise<void> {
    const comissao = await this.repository.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    const membro = comissao.membros.find(m => m.servidorId === servidorId);
    if (!membro) {
      throw new Error('Membro não encontrado na comissão');
    }

    // Validate business rules for member update
    if (data.papel) {
      await this.validateMemberRole(comissao, data.papel, servidorId);
    }

    // If deactivating member, set dataDeSaida
    const updateData: any = { ...data };
    if (data.ativo === false && !membro.dataDeSaida) {
      updateData.dataDeSaida = new Date();
    }

    await this.repository.atualizarMembro(comissaoId, servidorId, updateData);
    
    // Log member update
    await this.logHistory(
      comissaoId, 
      'member_updated', 
      { servidorId, changes: data }, 
      updatedBy, 
      `Membro ${servidorId} atualizado`
    );
  }

  /**
   * Get comissão statistics
   */
  async getComissaoStats(comissaoId: string): Promise<ComissaoStats> {
    const comissao = await this.repository.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    const membrosAtivos = comissao.membros.filter(m => m.ativo);
    const membrosInativos = comissao.membros.filter(m => !m.ativo);
    
    const distribuicaoPorPapel = comissao.membros.reduce((acc, membro) => {
      acc[membro.papel] = (acc[membro.papel] || 0) + 1;
      return acc;
    }, {} as Record<PapelMembro, number>);

    // Calculate average participation time
    const now = new Date();
    const temposParticipacao = comissao.membros.map(membro => {
      const fim = membro.dataDeSaida || now;
      return Math.floor((fim.getTime() - membro.dataDeIngresso.getTime()) / (1000 * 60 * 60 * 24));
    });
    const tempoMedioParticipacao = temposParticipacao.length > 0 
      ? temposParticipacao.reduce((a, b) => a + b, 0) / temposParticipacao.length 
      : 0;

    return {
      totalMembros: comissao.membros.length,
      membrosAtivos: membrosAtivos.length,
      membrosInativos: membrosInativos.length,
      distribuicaoPorPapel,
      tempoMedioParticipacao,
      ultimaAlteracao: (comissao as any).updatedAt || new Date()
    };
  }

  /**
   * Get comissão history
   */
  async getComissaoHistory(comissaoId: string, page: number = 1, limit: number = 20): Promise<{
    data: ComissaoHistoryEntry[];
    total: number;
    hasMore: boolean;
  }> {
    const historyCollection = this.db
      .collection(`organizations/${this.organizationId}/comissoes/${comissaoId}/history`)
      .orderBy('timestamp', 'desc')
      .limit(limit + 1)
      .offset((page - 1) * limit);

    const snapshot = await historyCollection.get();
    const docs = snapshot.docs.slice(0, limit);
    const hasMore = snapshot.docs.length > limit;

    const data = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ComissaoHistoryEntry[];

    // Get total count
    const totalSnapshot = await this.db
      .collection(`organizations/${this.organizationId}/comissoes/${comissaoId}/history`)
      .count()
      .get();
    const total = totalSnapshot.data().count;

    return { data, total, hasMore };
  }

  // Private validation methods
  private async validateCreateRequest(data: CreateComissaoRequest): Promise<void> {
    // Check name uniqueness
    const isUnique = await this.repository.isNameUnique(data.nomeDaComissao);
    if (!isUnique) {
      throw new Error('Já existe uma comissão com este nome na organização');
    }

    // Validate dates
    const dataCriacao = new Date(data.dataDeCriacao);
    if (dataCriacao > new Date()) {
      throw new Error('Data de criação não pode ser futura');
    }

    if (data.tipo === TipoComissao.TEMPORARIA) {
      if (!data.dataDeEncerramento) {
        throw new Error('Data de encerramento é obrigatória para comissões temporárias');
      }
      const dataEncerramento = new Date(data.dataDeEncerramento);
      if (dataEncerramento <= dataCriacao) {
        throw new Error('Data de encerramento deve ser posterior à data de criação');
      }
    }

    // Validate members
    await this.validateMembers(data.membros);
  }

  private async validateUpdateRequest(existingComissao: Comissao, data: UpdateComissaoRequest): Promise<void> {
    // Check if can be updated
    if (existingComissao.status === StatusComissao.ENCERRADA) {
      throw new Error('Não é possível atualizar uma comissão encerrada');
    }

    // Check name uniqueness if changing name
    if (data.nomeDaComissao && data.nomeDaComissao !== existingComissao.nomeDaComissao) {
      const isUnique = await this.repository.isNameUnique(data.nomeDaComissao, (existingComissao as any).id);
      if (!isUnique) {
        throw new Error('Já existe uma comissão com este nome na organização');
      }
    }

    // Validate dates if changing
    if (data.dataDeEncerramento) {
      const dataEncerramento = new Date(data.dataDeEncerramento);
      if (dataEncerramento <= existingComissao.dataDeCriacao) {
        throw new Error('Data de encerramento deve ser posterior à data de criação');
      }
    }
  }

  private async validateAddMember(comissao: Comissao, data: AdicionarMembroRequest): Promise<void> {
    // Check if comissão can have new members
    if (comissao.status !== StatusComissao.ATIVA) {
      throw new Error('Apenas comissões ativas podem receber novos membros');
    }

    // Check if servidor is already a member
    const existingMember = comissao.membros.find(m => m.servidorId === data.servidorId && m.ativo);
    if (existingMember) {
      throw new Error('Servidor já é membro ativo desta comissão');
    }

    // Validate role constraints
    await this.validateMemberRole(comissao, data.papel);

    // Check if servidor exists
    await this.validateServidorExists(data.servidorId);
  }

  private async validateMemberRole(comissao: Comissao, papel: PapelMembro, excludeServidorId?: string): Promise<void> {
    if (papel === PapelMembro.PRESIDENTE) {
      const existingPresidente = comissao.membros.find(m => 
        m.papel === PapelMembro.PRESIDENTE && 
        m.ativo && 
        m.servidorId !== excludeServidorId
      );
      if (existingPresidente) {
        throw new Error('Comissão já possui um presidente ativo');
      }
    }
  }

  private async validateMembers(membros: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>[]): Promise<void> {
    // Check for duplicate members
    const servidorIds = membros.map(m => m.servidorId);
    const uniqueIds = new Set(servidorIds);
    if (servidorIds.length !== uniqueIds.size) {
      throw new Error('Não é possível adicionar o mesmo servidor múltiplas vezes');
    }

    // Check for multiple presidents
    const presidentes = membros.filter(m => m.papel === PapelMembro.PRESIDENTE);
    if (presidentes.length > 1) {
      throw new Error('Comissão pode ter apenas um presidente');
    }

    // Validate all servidores exist
    for (const membro of membros) {
      await this.validateServidorExists(membro.servidorId);
    }
  }

  private async validateServidorExists(servidorId: string): Promise<void> {
    const servidorDoc = await this.db
      .collection(`organizations/${this.organizationId}/servidores`)
      .doc(servidorId)
      .get();
    
    if (!servidorDoc.exists) {
      throw new Error(`Servidor ${servidorId} não encontrado na organização`);
    }
  }

  private async logHistory(
    comissaoId: string, 
    action: ComissaoHistoryEntry['action'], 
    changes: Record<string, any>, 
    performedBy: string, 
    details?: string
  ): Promise<void> {
    const historyEntry: Omit<ComissaoHistoryEntry, 'id'> = {
      comissaoId,
      action,
      changes,
      performedBy,
      timestamp: new Date(),
      details
    };

    await this.db
      .collection(`organizations/${this.organizationId}/comissoes/${comissaoId}/history`)
      .add(historyEntry);
  }
}