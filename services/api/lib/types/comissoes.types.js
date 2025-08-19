"use strict";
/**
 * Comissões Types - Type definitions for Comissões module
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComissoesQueryOptionsSchema = exports.AtualizarMembroRequestSchema = exports.AdicionarMembroRequestSchema = exports.UpdateComissaoRequestSchema = exports.CreateComissaoRequestSchema = exports.ComissaoSchema = exports.ConfiguracoesComissaoSchema = exports.MembroComissaoSchema = exports.PapelMembroSchema = exports.StatusComissaoSchema = exports.TipoComissaoSchema = exports.PapelMembro = exports.StatusComissao = exports.TipoComissao = void 0;
const zod_1 = require("zod");
// Enums
var TipoComissao;
(function (TipoComissao) {
    TipoComissao["PERMANENTE"] = "Permanente";
    TipoComissao["TEMPORARIA"] = "Temporaria";
})(TipoComissao || (exports.TipoComissao = TipoComissao = {}));
var StatusComissao;
(function (StatusComissao) {
    StatusComissao["ATIVA"] = "Ativa";
    StatusComissao["INATIVA"] = "Inativa";
    StatusComissao["SUSPENSA"] = "Suspensa";
    StatusComissao["ENCERRADA"] = "Encerrada";
})(StatusComissao || (exports.StatusComissao = StatusComissao = {}));
var PapelMembro;
(function (PapelMembro) {
    PapelMembro["PRESIDENTE"] = "Presidente";
    PapelMembro["VICE_PRESIDENTE"] = "Vice-Presidente";
    PapelMembro["SECRETARIO"] = "Secretario";
    PapelMembro["MEMBRO"] = "Membro";
    PapelMembro["SUPLENTE"] = "Suplente";
})(PapelMembro || (exports.PapelMembro = PapelMembro = {}));
// Schemas for validation
exports.TipoComissaoSchema = zod_1.z.nativeEnum(TipoComissao);
exports.StatusComissaoSchema = zod_1.z.nativeEnum(StatusComissao);
exports.PapelMembroSchema = zod_1.z.nativeEnum(PapelMembro);
exports.MembroComissaoSchema = zod_1.z.object({
    servidorId: zod_1.z.string().min(1, "ID do servidor é obrigatório"),
    papel: exports.PapelMembroSchema,
    dataDeIngresso: zod_1.z.date(),
    dataDeSaida: zod_1.z.date().optional(),
    ativo: zod_1.z.boolean(),
    observacoes: zod_1.z.string().optional()
});
exports.ConfiguracoesComissaoSchema = zod_1.z.object({
    requererQuorum: zod_1.z.boolean(),
    quorumMinimo: zod_1.z.number().min(1).optional(),
    permitirSubstituicoes: zod_1.z.boolean(),
    notificarMembros: zod_1.z.boolean()
});
exports.ComissaoSchema = zod_1.z.object({
    id: zod_1.z.string(),
    nomeDaComissao: zod_1.z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
    tipo: exports.TipoComissaoSchema,
    dataDeCriacao: zod_1.z.date(),
    dataDeEncerramento: zod_1.z.date().optional(),
    descricao: zod_1.z.string().optional(),
    objetivo: zod_1.z.string().optional(),
    membros: zod_1.z.array(exports.MembroComissaoSchema).min(1, "Deve ter pelo menos 1 membro"),
    status: exports.StatusComissaoSchema,
    organizationId: zod_1.z.string().min(1, "ID da organização é obrigatório"),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date(),
    createdBy: zod_1.z.string().min(1, "Criador é obrigatório"),
    lastModifiedBy: zod_1.z.string().optional(),
    configuracoes: exports.ConfiguracoesComissaoSchema.optional()
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
exports.CreateComissaoRequestSchema = zod_1.z.object({
    nomeDaComissao: zod_1.z.string().min(3).max(100),
    tipo: exports.TipoComissaoSchema,
    dataDeCriacao: zod_1.z.string().datetime(),
    dataDeEncerramento: zod_1.z.string().datetime().optional(),
    descricao: zod_1.z.string().optional(),
    objetivo: zod_1.z.string().optional(),
    membros: zod_1.z.array(zod_1.z.object({
        servidorId: zod_1.z.string().min(1),
        papel: exports.PapelMembroSchema,
        dataDeSaida: zod_1.z.date().optional(),
        observacoes: zod_1.z.string().optional()
    })).min(1),
    configuracoes: exports.ConfiguracoesComissaoSchema.optional()
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
exports.UpdateComissaoRequestSchema = zod_1.z.object({
    nomeDaComissao: zod_1.z.string().min(3).max(100).optional(),
    tipo: exports.TipoComissaoSchema.optional(),
    dataDeEncerramento: zod_1.z.string().datetime().optional(),
    descricao: zod_1.z.string().optional(),
    objetivo: zod_1.z.string().optional(),
    status: exports.StatusComissaoSchema.optional(),
    configuracoes: exports.ConfiguracoesComissaoSchema.optional()
});
exports.AdicionarMembroRequestSchema = zod_1.z.object({
    servidorId: zod_1.z.string().min(1, "ID do servidor é obrigatório"),
    papel: exports.PapelMembroSchema,
    observacoes: zod_1.z.string().optional()
});
exports.AtualizarMembroRequestSchema = zod_1.z.object({
    papel: exports.PapelMembroSchema.optional(),
    observacoes: zod_1.z.string().optional(),
    ativo: zod_1.z.boolean().optional()
});
exports.ComissoesQueryOptionsSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(20),
    tipo: exports.TipoComissaoSchema.optional(),
    status: exports.StatusComissaoSchema.optional(),
    search: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum(['nomeDaComissao', 'dataDeCriacao', 'status', 'tipo']).default('dataDeCriacao'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
});
//# sourceMappingURL=comissoes.types.js.map