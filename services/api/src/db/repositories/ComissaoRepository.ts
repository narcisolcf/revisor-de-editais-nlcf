/**
 * Comissão Repository - Data access layer for Comissões
 * LicitaReview Cloud Functions
 */

import { Firestore, Query, FieldValue } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository';
import { 
  Comissao, 
  ComissaoSchema, 
  CreateComissaoRequest, 
  UpdateComissaoRequest,
  MembroComissao,
  TipoComissao,
  StatusComissao,
  ComissoesQueryOptions,
  ComissaoDetalhada
} from '../../types';

export class ComissaoRepository extends BaseRepository<Comissao, CreateComissaoRequest, UpdateComissaoRequest> {
  constructor(db: Firestore, organizationId: string) {
    super(
      db,
      `organizations/${organizationId}/comissoes`,
      ComissaoSchema
    );
  }

  /**
   * Find comissões with advanced filtering
   */
  async findWithFilters(options: ComissoesQueryOptions): Promise<{
    data: Comissao[];
    total: number;
    hasMore: boolean;
  }> {
    let query: Query = this.getCollection();

    // Apply filters
    if (options.tipo) {
      query = query.where('tipo', '==', options.tipo);
    }

    if (options.status) {
      query = query.where('status', '==', options.status);
    }

    // Search by name (case-insensitive)
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      query = query.where('nomeDaComissao', '>=', searchLower)
                   .where('nomeDaComissao', '<=', searchLower + '\uf8ff');
    }

    // Apply sorting
    const sortField = options.sortBy || 'dataDeCriacao';
    const sortDirection = options.sortOrder || 'desc';
    query = query.orderBy(sortField, sortDirection);

    // Apply pagination
    const limit = options.limit || 20;
    const offset = ((options.page || 1) - 1) * limit;
    
    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(limit + 1); // +1 to check if there are more results

    const snapshot = await query.get();
    const docs = snapshot.docs.slice(0, limit); // Remove the extra doc
    const hasMore = snapshot.docs.length > limit;

    const data = docs.map(doc => {
      const docData = this.convertTimestamps(doc.data());
      return this.validate({ id: doc.id, ...docData });
    });

    // Get total count for pagination
    let countQuery: Query = this.getCollection();
    // Apply same filters for count
    if (options.tipo) {
      countQuery = countQuery.where('tipo', '==', options.tipo);
    }
    if (options.status) {
      countQuery = countQuery.where('status', '==', options.status);
    }
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      countQuery = countQuery.where('nomeDaComissao', '>=', searchLower)
                            .where('nomeDaComissao', '<=', searchLower + '\uf8ff');
    }
    
    const countSnapshot = await countQuery.count().get();
    const total = countSnapshot.data().count;

    return { data, total, hasMore };
  }

  /**
   * Get comissão with detailed member information
   */
  async findByIdDetailed(id: string): Promise<ComissaoDetalhada | null> {
    const comissao = await this.findById(id);
    if (!comissao) {
      return null;
    }

    // Get detailed member information
    const membrosDetalhados = await Promise.all(
      comissao.membros.map(async (membro) => {
        try {
          // Get servidor details from servidores collection
          const servidorDoc = await this.db
            .collection(`organizations/${comissao.organizationId}/servidores`)
            .doc(membro.servidorId)
            .get();

          if (servidorDoc.exists) {
            const servidorData = servidorDoc.data()!;
            return {
              ...membro,
              servidor: {
                id: servidorDoc.id,
                nome: servidorData.nome || 'Nome não disponível',
                email: servidorData.email || 'Email não disponível',
                cargo: servidorData.cargo || 'Cargo não disponível'
              }
            };
          } else {
            // Servidor not found, return with placeholder data
            return {
              ...membro,
              servidor: {
                id: membro.servidorId,
                nome: 'Servidor não encontrado',
                email: 'N/A',
                cargo: 'N/A'
              }
            };
          }
        } catch (error) {
          console.error(`Error fetching servidor ${membro.servidorId}:`, error);
          return {
            ...membro,
            servidor: {
              id: membro.servidorId,
              nome: 'Erro ao carregar',
              email: 'N/A',
              cargo: 'N/A'
            }
          };
        }
      })
    );

    return {
      ...comissao,
      membrosDetalhados
    };
  }

  /**
   * Check if comissão name is unique within organization
   */
  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    let query = this.getCollection().where('nomeDaComissao', '==', name);
    
    const snapshot = await query.get();
    
    if (excludeId) {
      // Exclude the current document when updating
      return snapshot.docs.every(doc => doc.id === excludeId);
    }
    
    return snapshot.empty;
  }

  /**
   * Add member to comissão
   */
  async adicionarMembro(comissaoId: string, membro: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>): Promise<void> {
    const docRef = this.getDocRef(comissaoId);
    
    const novoMembro: MembroComissao = {
      ...membro,
      dataDeIngresso: new Date(),
      ativo: true
    };

    await docRef.update({
      membros: FieldValue.arrayUnion(this.prepareForStorage(novoMembro)),
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  /**
   * Remove member from comissão
   */
  async removerMembro(comissaoId: string, servidorId: string): Promise<void> {
    const comissao = await this.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    const membrosAtualizados = comissao.membros.filter(m => m.servidorId !== servidorId);
    
    await this.update(comissaoId, {
      membros: membrosAtualizados
    } as UpdateComissaoRequest);
  }

  /**
   * Update member in comissão
   */
  async atualizarMembro(
    comissaoId: string, 
    servidorId: string, 
    updates: Partial<Pick<MembroComissao, 'papel' | 'observacoes' | 'ativo' | 'dataDeSaida'>>
  ): Promise<void> {
    const comissao = await this.findById(comissaoId);
    if (!comissao) {
      throw new Error('Comissão não encontrada');
    }

    const membroIndex = comissao.membros.findIndex(m => m.servidorId === servidorId);
    if (membroIndex === -1) {
      throw new Error('Membro não encontrado na comissão');
    }

    const membrosAtualizados = [...comissao.membros];
    membrosAtualizados[membroIndex] = {
      ...membrosAtualizados[membroIndex],
      ...updates
    };

    await this.update(comissaoId, {
      membros: membrosAtualizados
    } as UpdateComissaoRequest);
  }

  /**
   * Get comissões by servidor ID
   */
  async findByServidorId(servidorId: string): Promise<Comissao[]> {
    const query = this.getCollection()
      .where('membros', 'array-contains-any', [{ servidorId }]);
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const docData = this.convertTimestamps(doc.data());
      return this.validate({ id: doc.id, ...docData });
    });
  }

  /**
   * Get active comissões
   */
  async findActive(): Promise<Comissao[]> {
    const query = this.getCollection()
      .where('status', '==', StatusComissao.ATIVA)
      .orderBy('dataDeCriacao', 'desc');
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const docData = this.convertTimestamps(doc.data());
      return this.validate({ id: doc.id, ...docData });
    });
  }

  /**
   * Get comissões expiring soon (for temporárias)
   */
  async findExpiringSoon(days: number = 30): Promise<Comissao[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const query = this.getCollection()
      .where('tipo', '==', TipoComissao.TEMPORARIA)
      .where('status', '==', StatusComissao.ATIVA)
      .where('dataDeEncerramento', '<=', futureDate)
      .orderBy('dataDeEncerramento', 'asc');
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const docData = this.convertTimestamps(doc.data());
      return this.validate({ id: doc.id, ...docData });
    });
  }

  /**
   * Get statistics for organization
   */
  async getOrganizationStats(): Promise<{
    total: number;
    ativas: number;
    permanentes: number;
    temporarias: number;
    membrosTotal: number;
  }> {
    const snapshot = await this.getCollection().get();
    
    let total = 0;
    let ativas = 0;
    let permanentes = 0;
    let temporarias = 0;
    let membrosTotal = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      total++;
      
      if (data.status === StatusComissao.ATIVA) {
        ativas++;
      }
      
      if (data.tipo === TipoComissao.PERMANENTE) {
        permanentes++;
      } else {
        temporarias++;
      }
      
      if (data.membros && Array.isArray(data.membros)) {
        membrosTotal += data.membros.filter((m: any) => m.ativo).length;
      }
    });

    return {
      total,
      ativas,
      permanentes,
      temporarias,
      membrosTotal
    };
  }
}