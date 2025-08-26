/**
 * Comissões Types - Type definitions for Comissões module
 * LicitaReview Cloud Functions
 */
import { z } from "zod";
import { WithId, WithTimestamp, ApiResponse, PaginatedResponse } from "./index";
export declare enum TipoComissao {
    PERMANENTE = "Permanente",
    TEMPORARIA = "Temporaria"
}
export declare enum StatusComissao {
    ATIVA = "Ativa",
    INATIVA = "Inativa",
    SUSPENSA = "Suspensa",
    ENCERRADA = "Encerrada"
}
export declare enum PapelMembro {
    PRESIDENTE = "Presidente",
    VICE_PRESIDENTE = "Vice-Presidente",
    SECRETARIO = "Secretario",
    MEMBRO = "Membro",
    SUPLENTE = "Suplente"
}
export declare const TipoComissaoSchema: z.ZodNativeEnum<typeof TipoComissao>;
export declare const StatusComissaoSchema: z.ZodNativeEnum<typeof StatusComissao>;
export declare const PapelMembroSchema: z.ZodNativeEnum<typeof PapelMembro>;
export interface MembroComissao {
    servidorId: string;
    papel: PapelMembro;
    dataDeIngresso: Date;
    dataDeSaida?: Date;
    ativo: boolean;
    observacoes?: string;
}
export declare const MembroComissaoSchema: z.ZodObject<{
    servidorId: z.ZodString;
    papel: z.ZodNativeEnum<typeof PapelMembro>;
    dataDeIngresso: z.ZodDate;
    dataDeSaida: z.ZodOptional<z.ZodDate>;
    ativo: z.ZodBoolean;
    observacoes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    servidorId: string;
    papel: PapelMembro;
    dataDeIngresso: Date;
    ativo: boolean;
    dataDeSaida?: Date | undefined;
    observacoes?: string | undefined;
}, {
    servidorId: string;
    papel: PapelMembro;
    dataDeIngresso: Date;
    ativo: boolean;
    dataDeSaida?: Date | undefined;
    observacoes?: string | undefined;
}>;
export interface ConfiguracoesComissao {
    requererQuorum: boolean;
    quorumMinimo?: number;
    permitirSubstituicoes: boolean;
    notificarMembros: boolean;
}
export declare const ConfiguracoesComissaoSchema: z.ZodObject<{
    requererQuorum: z.ZodBoolean;
    quorumMinimo: z.ZodOptional<z.ZodNumber>;
    permitirSubstituicoes: z.ZodBoolean;
    notificarMembros: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    requererQuorum: boolean;
    permitirSubstituicoes: boolean;
    notificarMembros: boolean;
    quorumMinimo?: number | undefined;
}, {
    requererQuorum: boolean;
    permitirSubstituicoes: boolean;
    notificarMembros: boolean;
    quorumMinimo?: number | undefined;
}>;
export interface Comissao extends WithId<{}>, WithTimestamp<{}> {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: Date;
    dataDeEncerramento?: Date;
    descricao?: string;
    objetivo?: string;
    membros: MembroComissao[];
    status: StatusComissao;
    organizationId: string;
    createdBy: string;
    lastModifiedBy?: string;
    configuracoes?: ConfiguracoesComissao;
}
export declare const ComissaoSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    nomeDaComissao: z.ZodString;
    tipo: z.ZodNativeEnum<typeof TipoComissao>;
    dataDeCriacao: z.ZodDate;
    dataDeEncerramento: z.ZodOptional<z.ZodDate>;
    descricao: z.ZodOptional<z.ZodString>;
    objetivo: z.ZodOptional<z.ZodString>;
    membros: z.ZodArray<z.ZodObject<{
        servidorId: z.ZodString;
        papel: z.ZodNativeEnum<typeof PapelMembro>;
        dataDeIngresso: z.ZodDate;
        dataDeSaida: z.ZodOptional<z.ZodDate>;
        ativo: z.ZodBoolean;
        observacoes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }, {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }>, "many">;
    status: z.ZodNativeEnum<typeof StatusComissao>;
    organizationId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    createdBy: z.ZodString;
    lastModifiedBy: z.ZodOptional<z.ZodString>;
    configuracoes: z.ZodOptional<z.ZodObject<{
        requererQuorum: z.ZodBoolean;
        quorumMinimo: z.ZodOptional<z.ZodNumber>;
        permitirSubstituicoes: z.ZodBoolean;
        notificarMembros: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: StatusComissao;
    organizationId: string;
    id: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: Date;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    lastModifiedBy?: string | undefined;
    dataDeEncerramento?: Date | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}, {
    status: StatusComissao;
    organizationId: string;
    id: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: Date;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    lastModifiedBy?: string | undefined;
    dataDeEncerramento?: Date | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}>, {
    status: StatusComissao;
    organizationId: string;
    id: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: Date;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    lastModifiedBy?: string | undefined;
    dataDeEncerramento?: Date | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}, {
    status: StatusComissao;
    organizationId: string;
    id: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: Date;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeIngresso: Date;
        ativo: boolean;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    lastModifiedBy?: string | undefined;
    dataDeEncerramento?: Date | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}>;
export interface CreateComissaoRequest {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: string;
    dataDeEncerramento?: string;
    descricao?: string;
    objetivo?: string;
    membros: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>[];
    configuracoes?: ConfiguracoesComissao;
}
export declare const CreateComissaoRequestSchema: z.ZodEffects<z.ZodObject<{
    nomeDaComissao: z.ZodString;
    tipo: z.ZodNativeEnum<typeof TipoComissao>;
    dataDeCriacao: z.ZodString;
    dataDeEncerramento: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodString>;
    objetivo: z.ZodOptional<z.ZodString>;
    membros: z.ZodArray<z.ZodObject<{
        servidorId: z.ZodString;
        papel: z.ZodNativeEnum<typeof PapelMembro>;
        dataDeSaida: z.ZodOptional<z.ZodDate>;
        observacoes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }, {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }>, "many">;
    configuracoes: z.ZodOptional<z.ZodObject<{
        requererQuorum: z.ZodBoolean;
        quorumMinimo: z.ZodOptional<z.ZodNumber>;
        permitirSubstituicoes: z.ZodBoolean;
        notificarMembros: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: string;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}, {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: string;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}>, {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: string;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}, {
    nomeDaComissao: string;
    tipo: TipoComissao;
    dataDeCriacao: string;
    membros: {
        servidorId: string;
        papel: PapelMembro;
        dataDeSaida?: Date | undefined;
        observacoes?: string | undefined;
    }[];
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}>;
export interface UpdateComissaoRequest {
    nomeDaComissao?: string;
    tipo?: TipoComissao;
    dataDeEncerramento?: string;
    descricao?: string;
    objetivo?: string;
    status?: StatusComissao;
    configuracoes?: ConfiguracoesComissao;
}
export declare const UpdateComissaoRequestSchema: z.ZodObject<{
    nomeDaComissao: z.ZodOptional<z.ZodString>;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoComissao>>;
    dataDeEncerramento: z.ZodOptional<z.ZodString>;
    descricao: z.ZodOptional<z.ZodString>;
    objetivo: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof StatusComissao>>;
    configuracoes: z.ZodOptional<z.ZodObject<{
        requererQuorum: z.ZodBoolean;
        quorumMinimo: z.ZodOptional<z.ZodNumber>;
        permitirSubstituicoes: z.ZodBoolean;
        notificarMembros: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }, {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status?: StatusComissao | undefined;
    nomeDaComissao?: string | undefined;
    tipo?: TipoComissao | undefined;
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}, {
    status?: StatusComissao | undefined;
    nomeDaComissao?: string | undefined;
    tipo?: TipoComissao | undefined;
    dataDeEncerramento?: string | undefined;
    descricao?: string | undefined;
    objetivo?: string | undefined;
    configuracoes?: {
        requererQuorum: boolean;
        permitirSubstituicoes: boolean;
        notificarMembros: boolean;
        quorumMinimo?: number | undefined;
    } | undefined;
}>;
export interface AdicionarMembroRequest {
    servidorId: string;
    papel: PapelMembro;
    observacoes?: string;
}
export declare const AdicionarMembroRequestSchema: z.ZodObject<{
    servidorId: z.ZodString;
    papel: z.ZodNativeEnum<typeof PapelMembro>;
    observacoes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    servidorId: string;
    papel: PapelMembro;
    observacoes?: string | undefined;
}, {
    servidorId: string;
    papel: PapelMembro;
    observacoes?: string | undefined;
}>;
export interface AtualizarMembroRequest {
    papel?: PapelMembro;
    observacoes?: string;
    ativo?: boolean;
}
export declare const AtualizarMembroRequestSchema: z.ZodObject<{
    papel: z.ZodOptional<z.ZodNativeEnum<typeof PapelMembro>>;
    observacoes: z.ZodOptional<z.ZodString>;
    ativo: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    papel?: PapelMembro | undefined;
    ativo?: boolean | undefined;
    observacoes?: string | undefined;
}, {
    papel?: PapelMembro | undefined;
    ativo?: boolean | undefined;
    observacoes?: string | undefined;
}>;
export interface ComissaoDetalhada extends Comissao {
    membrosDetalhados: (MembroComissao & {
        servidor: {
            id: string;
            nome: string;
            email: string;
            cargo: string;
        };
    })[];
}
export interface ComissaoStats {
    totalMembros: number;
    membrosAtivos: number;
    membrosInativos: number;
    distribuicaoPorPapel: Record<PapelMembro, number>;
    tempoMedioParticipacao: number;
    ultimaAlteracao: Date;
}
export interface ComissaoHistoryEntry {
    id: string;
    comissaoId: string;
    action: 'created' | 'updated' | 'member_added' | 'member_removed' | 'member_updated' | 'status_changed';
    changes: Record<string, unknown>;
    performedBy: string;
    timestamp: Date;
    details?: string;
}
export type ListComissoesResponse = PaginatedResponse<Comissao>;
export type GetComissaoResponse = ApiResponse<ComissaoDetalhada>;
export type CreateComissaoResponse = ApiResponse<Comissao>;
export type UpdateComissaoResponse = ApiResponse<Comissao>;
export type DeleteComissaoResponse = ApiResponse<{
    message: string;
}>;
export type ComissaoStatsResponse = ApiResponse<ComissaoStats>;
export type ComissaoHistoryResponse = PaginatedResponse<ComissaoHistoryEntry>;
export interface ComissoesQueryOptions {
    page?: number;
    limit?: number;
    tipo?: TipoComissao;
    status?: StatusComissao;
    search?: string;
    sortBy?: 'nomeDaComissao' | 'dataDeCriacao' | 'status' | 'tipo';
    sortOrder?: 'asc' | 'desc';
}
export declare const ComissoesQueryOptionsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    tipo: z.ZodOptional<z.ZodNativeEnum<typeof TipoComissao>>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof StatusComissao>>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["nomeDaComissao", "dataDeCriacao", "status", "tipo"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "status" | "nomeDaComissao" | "tipo" | "dataDeCriacao";
    sortOrder: "asc" | "desc";
    status?: StatusComissao | undefined;
    tipo?: TipoComissao | undefined;
    search?: string | undefined;
}, {
    status?: StatusComissao | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    tipo?: TipoComissao | undefined;
    search?: string | undefined;
    sortBy?: "status" | "nomeDaComissao" | "tipo" | "dataDeCriacao" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
//# sourceMappingURL=comissoes.types.d.ts.map