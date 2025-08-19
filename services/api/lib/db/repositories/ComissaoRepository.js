"use strict";
/**
 * Comissão Repository - Data access layer for Comissões
 * LicitaReview Cloud Functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComissaoRepository = void 0;
const firestore_1 = require("firebase-admin/firestore");
const BaseRepository_1 = require("./BaseRepository");
const types_1 = require("../../types");
class ComissaoRepository extends BaseRepository_1.BaseRepository {
    constructor(db, organizationId) {
        super(db, `organizations/${organizationId}/comissoes`, types_1.ComissaoSchema);
    }
    /**
     * Find comissões with advanced filtering
     */
    async findWithFilters(options) {
        let query = this.getCollection();
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
            return this.validate(Object.assign({ id: doc.id }, docData));
        });
        // Get total count for pagination
        let countQuery = this.getCollection();
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
    async findByIdDetailed(id) {
        const comissao = await this.findById(id);
        if (!comissao) {
            return null;
        }
        // Get detailed member information
        const membrosDetalhados = await Promise.all(comissao.membros.map(async (membro) => {
            try {
                // Get servidor details from servidores collection
                const servidorDoc = await this.db
                    .collection(`organizations/${comissao.organizationId}/servidores`)
                    .doc(membro.servidorId)
                    .get();
                if (servidorDoc.exists) {
                    const servidorData = servidorDoc.data();
                    return Object.assign(Object.assign({}, membro), { servidor: {
                            id: servidorDoc.id,
                            nome: servidorData.nome || 'Nome não disponível',
                            email: servidorData.email || 'Email não disponível',
                            cargo: servidorData.cargo || 'Cargo não disponível'
                        } });
                }
                else {
                    // Servidor not found, return with placeholder data
                    return Object.assign(Object.assign({}, membro), { servidor: {
                            id: membro.servidorId,
                            nome: 'Servidor não encontrado',
                            email: 'N/A',
                            cargo: 'N/A'
                        } });
                }
            }
            catch (error) {
                console.error(`Error fetching servidor ${membro.servidorId}:`, error);
                return Object.assign(Object.assign({}, membro), { servidor: {
                        id: membro.servidorId,
                        nome: 'Erro ao carregar',
                        email: 'N/A',
                        cargo: 'N/A'
                    } });
            }
        }));
        return Object.assign(Object.assign({}, comissao), { membrosDetalhados });
    }
    /**
     * Check if comissão name is unique within organization
     */
    async isNameUnique(name, excludeId) {
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
    async adicionarMembro(comissaoId, membro) {
        const docRef = this.getDocRef(comissaoId);
        const novoMembro = Object.assign(Object.assign({}, membro), { dataDeIngresso: new Date(), ativo: true });
        await docRef.update({
            membros: firestore_1.FieldValue.arrayUnion(this.prepareForStorage(novoMembro)),
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
    }
    /**
     * Remove member from comissão
     */
    async removerMembro(comissaoId, servidorId) {
        const comissao = await this.findById(comissaoId);
        if (!comissao) {
            throw new Error('Comissão não encontrada');
        }
        const membrosAtualizados = comissao.membros.filter(m => m.servidorId !== servidorId);
        await this.update(comissaoId, {
            membros: membrosAtualizados
        });
    }
    /**
     * Update member in comissão
     */
    async atualizarMembro(comissaoId, servidorId, updates) {
        const comissao = await this.findById(comissaoId);
        if (!comissao) {
            throw new Error('Comissão não encontrada');
        }
        const membroIndex = comissao.membros.findIndex(m => m.servidorId === servidorId);
        if (membroIndex === -1) {
            throw new Error('Membro não encontrado na comissão');
        }
        const membrosAtualizados = [...comissao.membros];
        membrosAtualizados[membroIndex] = Object.assign(Object.assign({}, membrosAtualizados[membroIndex]), updates);
        await this.update(comissaoId, {
            membros: membrosAtualizados
        });
    }
    /**
     * Get comissões by servidor ID
     */
    async findByServidorId(servidorId) {
        const query = this.getCollection()
            .where('membros', 'array-contains-any', [{ servidorId }]);
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const docData = this.convertTimestamps(doc.data());
            return this.validate(Object.assign({ id: doc.id }, docData));
        });
    }
    /**
     * Get active comissões
     */
    async findActive() {
        const query = this.getCollection()
            .where('status', '==', types_1.StatusComissao.ATIVA)
            .orderBy('dataDeCriacao', 'desc');
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const docData = this.convertTimestamps(doc.data());
            return this.validate(Object.assign({ id: doc.id }, docData));
        });
    }
    /**
     * Get comissões expiring soon (for temporárias)
     */
    async findExpiringSoon(days = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        const query = this.getCollection()
            .where('tipo', '==', types_1.TipoComissao.TEMPORARIA)
            .where('status', '==', types_1.StatusComissao.ATIVA)
            .where('dataDeEncerramento', '<=', futureDate)
            .orderBy('dataDeEncerramento', 'asc');
        const snapshot = await query.get();
        return snapshot.docs.map(doc => {
            const docData = this.convertTimestamps(doc.data());
            return this.validate(Object.assign({ id: doc.id }, docData));
        });
    }
    /**
     * Get statistics for organization
     */
    async getOrganizationStats() {
        const snapshot = await this.getCollection().get();
        let total = 0;
        let ativas = 0;
        let permanentes = 0;
        let temporarias = 0;
        let membrosTotal = 0;
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            total++;
            if (data.status === types_1.StatusComissao.ATIVA) {
                ativas++;
            }
            if (data.tipo === types_1.TipoComissao.PERMANENTE) {
                permanentes++;
            }
            else {
                temporarias++;
            }
            if (data.membros && Array.isArray(data.membros)) {
                membrosTotal += data.membros.filter((m) => m.ativo).length;
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
exports.ComissaoRepository = ComissaoRepository;
//# sourceMappingURL=ComissaoRepository.js.map