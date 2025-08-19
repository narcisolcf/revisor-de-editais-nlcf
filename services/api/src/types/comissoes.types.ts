/**
 * Comissões Types - Type definitions for Comissões module
 * LicitaReview Cloud Functions
 */

import { z } from "zod";
import { WithId, WithTimestamp, ApiResponse, PaginatedResponse } from "./index";

// Enums
/* eslint-disable no-unused-vars */
export enum TipoComissao {
  PERMANENTE = "Permanente",
  TEMPORARIA = "Temporaria"
}

export enum StatusComissao {
  ATIVA = "Ativa",
  INATIVA = "Inativa",
  SUSPENSA = "Suspensa",
  ENCERRADA = "Encerrada"
}

export enum PapelMembro {
  PRESIDENTE = "Presidente",
  VICE_PRESIDENTE = "Vice-Presidente",
  SECRETARIO = "Secretario",
  MEMBRO = "Membro",
  SUPLENTE = "Suplente"
}
/* eslint-enable no-unused-vars */

// Schemas for validation
export const TipoComissaoSchema = z.nativeEnum(TipoComissao);
export const StatusComissaoSchema = z.nativeEnum(StatusComissao);
export const PapelMembroSchema = z.nativeEnum(PapelMembro);

// Membro Comissão Interface
export interface MembroComissao {
  servidorId: string; // FK para entidade Servidor
  papel: PapelMembro;
  dataDeIngresso: Date;
  dataDeSaida?: Date;
  ativo: boolean;
  observacoes?: string;
}

export const MembroComissaoSchema = z.object({
  servidorId: z.string().min(1, "ID do servidor é obrigatório"),
  papel: PapelMembroSchema,
  dataDeIngresso: z.date(),
  dataDeSaida: z.date().optional(),
  ativo: z.boolean(),
  observacoes: z.string().optional()
});

// Configurações da Comissão
export interface ConfiguracoesComissao {
  requererQuorum: boolean;
  quorumMinimo?: number;
  permitirSubstituicoes: boolean;
  notificarMembros: boolean;
}

export const ConfiguracoesComissaoSchema = z.object({
  requererQuorum: z.boolean(),
  quorumMinimo: z.number().min(1).optional(),
  permitirSubstituicoes: z.boolean(),
  notificarMembros: z.boolean()
});

// Comissão Interface
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

export const ComissaoSchema = z.object({
  id: z.string(),
  nomeDaComissao: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  tipo: TipoComissaoSchema,
  dataDeCriacao: z.date(),
  dataDeEncerramento: z.date().optional(),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  membros: z.array(MembroComissaoSchema).min(1, "Deve ter pelo menos 1 membro"),
  status: StatusComissaoSchema,
  organizationId: z.string().min(1, "ID da organização é obrigatório"),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().min(1, "Criador é obrigatório"),
  lastModifiedBy: z.string().optional(),
  configuracoes: ConfiguracoesComissaoSchema.optional()
}).refine((data) => {
  // Se for temporária, deve ter data de encerramento
  if (data.tipo === TipoComissao.TEMPORARIA && !data.dataDeEncerramento) {
    return false;
  }
  // Data de encerramento deve ser posterior à criação
  if (data.dataDeEncerramento && data.dataDeEncerramento <= data.dataDeCriacao) {
    return false;
  }
  // Máximo 1 presidente
  const presidentes = data.membros.filter(m => m.papel === PapelMembro.PRESIDENTE);
  if (presidentes.length > 1) {
    return false;
  }
  return true;
}, {
  message: "Validação de regras de negócio falhou"
});

// Request/Response Types
export interface CreateComissaoRequest {
  nomeDaComissao: string;
  tipo: TipoComissao;
  dataDeCriacao: string; // ISO date
  dataDeEncerramento?: string; // ISO date
  descricao?: string;
  objetivo?: string;
  membros: Omit<MembroComissao, 'dataDeIngresso' | 'ativo'>[];
  configuracoes?: ConfiguracoesComissao;
}

export const CreateComissaoRequestSchema = z.object({
  nomeDaComissao: z.string().min(3).max(100),
  tipo: TipoComissaoSchema,
  dataDeCriacao: z.string().datetime(),
  dataDeEncerramento: z.string().datetime().optional(),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  membros: z.array(z.object({
    servidorId: z.string().min(1),
    papel: PapelMembroSchema,
    dataDeSaida: z.date().optional(),
    observacoes: z.string().optional()
  })).min(1),
  configuracoes: ConfiguracoesComissaoSchema.optional()
}).refine((data) => {
  // Se for temporária, deve ter data de encerramento
  if (data.tipo === TipoComissao.TEMPORARIA && !data.dataDeEncerramento) {
    return false;
  }
  // Máximo 1 presidente
  const presidentes = data.membros.filter(m => m.papel === PapelMembro.PRESIDENTE);
  if (presidentes.length > 1) {
    return false;
  }
  return true;
}, {
  message: "Validação de regras de negócio falhou"
});

export interface UpdateComissaoRequest {
  nomeDaComissao?: string;
  tipo?: TipoComissao;
  dataDeEncerramento?: string;
  descricao?: string;
  objetivo?: string;
  status?: StatusComissao;
  configuracoes?: ConfiguracoesComissao;
}

export const UpdateComissaoRequestSchema = z.object({
  nomeDaComissao: z.string().min(3).max(100).optional(),
  tipo: TipoComissaoSchema.optional(),
  dataDeEncerramento: z.string().datetime().optional(),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  status: StatusComissaoSchema.optional(),
  configuracoes: ConfiguracoesComissaoSchema.optional()
});

// Membro Management Types
export interface AdicionarMembroRequest {
  servidorId: string;
  papel: PapelMembro;
  observacoes?: string;
}

export const AdicionarMembroRequestSchema = z.object({
  servidorId: z.string().min(1, "ID do servidor é obrigatório"),
  papel: PapelMembroSchema,
  observacoes: z.string().optional()
});

export interface AtualizarMembroRequest {
  papel?: PapelMembro;
  observacoes?: string;
  ativo?: boolean;
}

export const AtualizarMembroRequestSchema = z.object({
  papel: PapelMembroSchema.optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().optional()
});

// Response Types
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
  tempoMedioParticipacao: number; // em dias
  ultimaAlteracao: Date;
}

export interface ComissaoHistoryEntry {
  id: string;
  comissaoId: string;
  action: 'created' | 'updated' | 'member_added' | 'member_removed' | 'member_updated' | 'status_changed';
  changes: Record<string, any>;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

// API Response Types
export type ListComissoesResponse = PaginatedResponse<Comissao>;
export type GetComissaoResponse = ApiResponse<ComissaoDetalhada>;
export type CreateComissaoResponse = ApiResponse<Comissao>;
export type UpdateComissaoResponse = ApiResponse<Comissao>;
export type DeleteComissaoResponse = ApiResponse<{ message: string }>;
export type ComissaoStatsResponse = ApiResponse<ComissaoStats>;
export type ComissaoHistoryResponse = PaginatedResponse<ComissaoHistoryEntry>;

// Query Options
export interface ComissoesQueryOptions {
  page?: number;
  limit?: number;
  tipo?: TipoComissao;
  status?: StatusComissao;
  search?: string;
  sortBy?: 'nomeDaComissao' | 'dataDeCriacao' | 'status' | 'tipo';
  sortOrder?: 'asc' | 'desc';
}

export const ComissoesQueryOptionsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  tipo: TipoComissaoSchema.optional(),
  status: StatusComissaoSchema.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['nomeDaComissao', 'dataDeCriacao', 'status', 'tipo']).default('dataDeCriacao'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});