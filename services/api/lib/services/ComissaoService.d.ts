/**
 * Comissão Service - Business logic for Comissões
 * LicitaReview Cloud Functions
 */
import { Firestore } from 'firebase-admin/firestore';
import { Comissao, CreateComissaoRequest, UpdateComissaoRequest, ComissaoDetalhada, ComissoesQueryOptions, AdicionarMembroRequest, AtualizarMembroRequest, ComissaoStats, ComissaoHistoryEntry } from '../types';
export declare class ComissaoService {
    private repository;
    private db;
    private organizationId;
    constructor(db: Firestore, organizationId: string);
    /**
     * List comissões with filtering and pagination
     */
    listComissoes(options: ComissoesQueryOptions): Promise<{
        data: Comissao[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    /**
     * Get comissão by ID with detailed member information
     */
    getComissaoById(id: string): Promise<ComissaoDetalhada | null>;
    /**
     * Create new comissão
     */
    createComissao(data: CreateComissaoRequest, createdBy: string): Promise<Comissao>;
    /**
     * Update comissão
     */
    updateComissao(id: string, data: UpdateComissaoRequest, updatedBy: string): Promise<Comissao | null>;
    /**
     * Delete comissão
     */
    deleteComissao(id: string, deletedBy: string): Promise<void>;
    /**
     * Add member to comissão
     */
    adicionarMembro(comissaoId: string, data: AdicionarMembroRequest, addedBy: string): Promise<void>;
    /**
     * Remove member from comissão
     */
    removerMembro(comissaoId: string, servidorId: string, removedBy: string): Promise<void>;
    /**
     * Update member in comissão
     */
    atualizarMembro(comissaoId: string, servidorId: string, data: AtualizarMembroRequest, updatedBy: string): Promise<void>;
    /**
     * Get comissão statistics
     */
    getComissaoStats(comissaoId: string): Promise<ComissaoStats>;
    /**
     * Get comissão history
     */
    getComissaoHistory(comissaoId: string, page?: number, limit?: number): Promise<{
        data: ComissaoHistoryEntry[];
        total: number;
        hasMore: boolean;
    }>;
    private validateCreateRequest;
    private validateUpdateRequest;
    private validateAddMember;
    private validateMemberRole;
    private validateMembers;
    private validateServidorExists;
    private logHistory;
}
