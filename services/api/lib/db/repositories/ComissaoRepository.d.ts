/**
 * Comissão Repository - Data access layer for Comissões
 * LicitaReview Cloud Functions
 */
import { Firestore } from 'firebase-admin/firestore';
import { BaseRepository } from './BaseRepository';
import { Comissao, CreateComissaoRequest, UpdateComissaoRequest, MembroComissao, ComissoesQueryOptions, ComissaoDetalhada } from '../../types';
export declare class ComissaoRepository extends BaseRepository<Comissao, CreateComissaoRequest, UpdateComissaoRequest> {
    constructor(db: Firestore, organizationId: string);
    /**
     * Find comissões with advanced filtering
     */
    findWithFilters(options: ComissoesQueryOptions): Promise<{
        data: Comissao[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get comissão with detailed member information
     */
    findByIdDetailed(id: string): Promise<ComissaoDetalhada | null>;
    /**
     * Check if comissão name is unique within organization
     */
    isNameUnique(name: string, excludeId?: string): Promise<boolean>;
    /**
     * Add member to comissão
     */
    adicionarMembro(comissaoId: string, membro: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>): Promise<void>;
    /**
     * Remove member from comissão
     */
    removerMembro(comissaoId: string, servidorId: string): Promise<void>;
    /**
     * Update member in comissão
     */
    atualizarMembro(comissaoId: string, servidorId: string, updates: Partial<Pick<MembroComissao, 'papel' | 'observacoes' | 'ativo' | 'dataDeSaida'>>): Promise<void>;
    /**
     * Get comissões by servidor ID
     */
    findByServidorId(servidorId: string): Promise<Comissao[]>;
    /**
     * Get active comissões
     */
    findActive(): Promise<Comissao[]>;
    /**
     * Get comissões expiring soon (for temporárias)
     */
    findExpiringSoon(days?: number): Promise<Comissao[]>;
    /**
     * Get statistics for organization
     */
    getOrganizationStats(): Promise<{
        total: number;
        ativas: number;
        permanentes: number;
        temporarias: number;
        membrosTotal: number;
    }>;
}
