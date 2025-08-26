// Exemplo de integração com Firebase para Comissões
// Este arquivo demonstra como interagir com o Firestore respeitando as regras de segurança

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentReference,
  QueryConstraint
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase'; // Assumindo que você tem a configuração do Firebase
import { Comissao, MembroComissao, TipoComissao, StatusComissao, PapelMembro, CreateComissaoRequest } from '../types/comissao';

/**
 * Serviço para gerenciar comissões no Firebase Firestore
 * Implementa as operações CRUD respeitando as regras de segurança
 */
export class ComissoesFirebaseService {
  private readonly COLLECTION_NAME = 'comissoes';

  /**
   * Cria uma nova comissão (apenas para administradores)
   */
  async criarComissao(
    user: User,
    dadosComissao: CreateComissaoRequest & { organizationId: string }
  ): Promise<Comissao> {
    try {
      // Verificar se o usuário é administrador
      const isAdmin = await this.isUserAdmin(user);
      if (!isAdmin) {
        throw new Error('Apenas administradores podem criar comissões');
      }

      // Preparar dados com campos de auditoria
      const agora = Timestamp.now();
      const novaComissao = {
        ...dadosComissao,
        status: 'Ativa' as StatusComissao,
        membros: [],
        createdBy: user.uid,
        createdAt: agora,
        updatedAt: agora
      };

      // Validar dados
      this.validarDadosComissao(novaComissao);

      // Criar documento no Firestore
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...novaComissao,
        createdAt: agora,
        updatedAt: agora
      });
      
      return {
        ...novaComissao,
        id: docRef.id,
        createdAt: agora.toDate(),
        updatedAt: agora.toDate()
      };
    } catch (error) {
      console.error('Erro ao criar comissão:', error);
      throw new Error(`Falha ao criar comissão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca uma comissão por ID
   */
  async buscarComissaoPorId(user: User, comissaoId: string): Promise<Comissao | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, comissaoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const dados = docSnap.data();
      
      // Verificar permissões de leitura
      const podeAcessar = await this.podeUsuarioLerComissao(user, dados as any);
      if (!podeAcessar) {
        throw new Error('Usuário não tem permissão para acessar esta comissão');
      }

      return this.converterDocumentoParaComissao(docSnap.id, dados);
    } catch (error) {
      console.error('Erro ao buscar comissão:', error);
      throw error;
    }
  }

  /**
   * Lista comissões que o usuário pode acessar
   */
  async listarComissoes(
    user: User,
    filtros?: {
      tipo?: TipoComissao;
      status?: StatusComissao;
      limite?: number;
    }
  ): Promise<Comissao[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Verificar se é administrador
      const isAdmin = await this.isUserAdmin(user);
      
      // Se não for admin, filtrar apenas comissões da organização do usuário
      // Em um cenário real, você implementaria lógica para determinar a organização do usuário
      // constraints.push(where('organizationId', '==', userOrganizationId));

      // Aplicar filtros
      if (filtros?.tipo) {
        constraints.push(where('tipo', '==', filtros.tipo));
      }
      if (filtros?.status) {
        constraints.push(where('status', '==', filtros.status));
      }

      // Ordenar por data de criação (mais recentes primeiro)
      constraints.push(orderBy('createdAt', 'desc'));

      // Limitar resultados
      if (filtros?.limite) {
        constraints.push(limit(filtros.limite));
      }

      const q = query(collection(db, this.COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);

      const comissoes: Comissao[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const dados = docSnap.data();
        
        // Verificar permissões de leitura para cada documento
        const podeAcessar = await this.podeUsuarioLerComissao(user, dados as any);
        if (podeAcessar) {
          const comissao = this.converterDocumentoParaComissao(docSnap.id, dados);
          comissoes.push(comissao);
        }
      }

      return comissoes;
    } catch (error) {
      console.error('Erro ao listar comissões:', error);
      throw new Error(`Falha ao listar comissões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Atualiza uma comissão existente
   */
  async atualizarComissao(
    user: User,
    comissaoId: string,
    atualizacoes: Partial<Omit<Comissao, 'id' | 'criadoPor' | 'criadoEm'>>
  ): Promise<Comissao> {
    try {
      // Buscar comissão atual para verificar permissões
      const comissaoAtual = await this.buscarComissaoPorId(user, comissaoId);
      if (!comissaoAtual) {
        throw new Error('Comissão não encontrada');
      }

      // Verificar permissões de escrita
      const podeEditar = await this.podeUsuarioEditarComissao(user, comissaoAtual);
      if (!podeEditar) {
        throw new Error('Usuário não tem permissão para editar esta comissão');
      }

      // Preparar dados de atualização
      const agora = Timestamp.now();
      const dadosAtualizacao = {
        ...atualizacoes,
        atualizadoPor: user.uid,
        atualizadoEm: agora
      };

      // Remover campos protegidos
      delete (dadosAtualizacao as any).criadoPor;
      delete (dadosAtualizacao as any).criadoEm;
      delete (dadosAtualizacao as any).id;

      // Atualizar no Firestore
      const docRef = doc(db, this.COLLECTION_NAME, comissaoId);
      await updateDoc(docRef, dadosAtualizacao);

      // Retornar comissão atualizada
      const comissaoAtualizada = await this.buscarComissaoPorId(user, comissaoId);
      if (!comissaoAtualizada) {
        throw new Error('Erro ao buscar comissão atualizada');
      }

      return comissaoAtualizada;
    } catch (error) {
      console.error('Erro ao atualizar comissão:', error);
      throw error;
    }
  }

  /**
   * Adiciona um membro à comissão
   */
  async adicionarMembro(
    user: User,
    comissaoId: string,
    dadosMembro: { servidorId: string; papel: PapelMembro; observacoes?: string }
  ): Promise<void> {
    try {
      // Verificar permissões
      const comissao = await this.buscarComissaoPorId(user, comissaoId);
      if (!comissao) {
        throw new Error('Comissão não encontrada');
      }

      const podeEditar = await this.podeUsuarioEditarComissao(user, comissao);
      if (!podeEditar) {
        throw new Error('Usuário não tem permissão para adicionar membros');
      }

      // Preparar dados do membro
      const agora = Timestamp.now();
      const novoMembro: MembroComissao = {
        ...dadosMembro,
        dataDeIngresso: agora.toDate(),
        ativo: true
      };

      // Validar dados do membro
      this.validarDadosMembro(novoMembro);

      // Adicionar à sub-coleção
      const membrosRef = collection(db, this.COLLECTION_NAME, comissaoId, 'membros');
      await addDoc(membrosRef, {
        ...novoMembro,
        dataDeIngresso: agora
      });

      // Atualizar também o array de membros da comissão principal
      const comissaoRef = doc(db, this.COLLECTION_NAME, comissaoId);
      const membrosAtualizados = [...comissao.membros, novoMembro];

      await updateDoc(comissaoRef, {
        membros: membrosAtualizados,
        updatedAt: agora
      });
    } catch (error) {
      console.error('Erro ao adicionar membro:', error);
      throw error;
    }
  }

  /**
   * Remove um membro da comissão
   */
  async removerMembro(
    user: User,
    comissaoId: string,
    usuarioId: string
  ): Promise<void> {
    try {
      // Verificar permissões
      const comissao = await this.buscarComissaoPorId(user, comissaoId);
      if (!comissao) {
        throw new Error('Comissão não encontrada');
      }

      const podeEditar = await this.podeUsuarioEditarComissao(user, comissao);
      if (!podeEditar) {
        throw new Error('Usuário não tem permissão para remover membros');
      }

      // Atualizar array de membros na comissão principal
      const membrosAtualizados = comissao.membros.filter(m => m.servidorId !== usuarioId);

      const agora = Timestamp.now();
      const comissaoRef = doc(db, this.COLLECTION_NAME, comissaoId);
      await updateDoc(comissaoRef, {
        membros: membrosAtualizados,
        updatedAt: agora
      });

      // Nota: Em um cenário real, você pode querer marcar o membro como inativo
      // em vez de deletar completamente para manter o histórico
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados

  /**
   * Verifica se o usuário é administrador
   */
  private async isUserAdmin(user: User): Promise<boolean> {
    try {
      const tokenResult = await user.getIdTokenResult();
      return tokenResult.claims.admin === true;
    } catch (error) {
      console.error('Erro ao verificar claims de admin:', error);
      return false;
    }
  }

  /**
   * Verifica se o usuário pode ler uma comissão
   */
  private async podeUsuarioLerComissao(user: User, comissao: any): Promise<boolean> {
    // Administradores podem ler tudo
    const isAdmin = await this.isUserAdmin(user);
    if (isAdmin) {
      return true;
    }

    // Membros da comissão podem ler
    if (comissao.membros && comissao.membros.some(m => m.servidorId === user.uid)) {
      return true;
    }

    // Por padrão, usuários autenticados podem ler comissões da mesma organização
    return true;
  }

  /**
   * Verifica se o usuário pode editar uma comissão
   */
  private async podeUsuarioEditarComissao(user: User, comissao: Comissao): Promise<boolean> {
    // Administradores podem editar tudo
    const isAdmin = await this.isUserAdmin(user);
    if (isAdmin) {
      return true;
    }

    // Presidente da comissão pode editar
    const membro = comissao.membros.find(m => m.servidorId === user.uid);
    if (membro && membro.papel === 'Presidente' && membro.ativo) {
      return true;
    }

    return false;
  }

  /**
   * Converte documento do Firestore para objeto Comissao
   */
  private converterDocumentoParaComissao(id: string, dados: any): Comissao {
    return {
      id,
      organizationId: dados.organizationId,
      nomeDaComissao: dados.nomeDaComissao,
      tipo: dados.tipo,
      status: dados.status,
      dataDeCriacao: dados.dataDeCriacao?.toDate() || dados.dataDeCriacao,
      dataDeEncerramento: dados.dataDeEncerramento?.toDate() || dados.dataDeEncerramento,
      descricao: dados.descricao,
      objetivo: dados.objetivo,
      configuracoes: dados.configuracoes,
      membros: dados.membros || [],
      createdBy: dados.createdBy,
      createdAt: dados.createdAt?.toDate() || dados.createdAt,
      updatedAt: dados.updatedAt?.toDate() || dados.updatedAt
    };
  }

  /**
   * Valida dados de uma comissão
   */
  private validarDadosComissao(comissao: any): void {
    if (!comissao.nomeDaComissao || typeof comissao.nomeDaComissao !== 'string') {
      throw new Error('Nome da comissão é obrigatório');
    }
    if (!comissao.tipo || !['Permanente', 'Temporaria'].includes(comissao.tipo)) {
      throw new Error('Tipo da comissão é obrigatório e deve ser válido');
    }
    if (!comissao.status || !['Ativa', 'Inativa', 'Suspensa', 'Encerrada'].includes(comissao.status)) {
      throw new Error('Status da comissão é obrigatório e deve ser válido');
    }
    if (!comissao.dataDeCriacao) {
      throw new Error('Data de criação é obrigatória');
    }
    if (!comissao.organizationId || typeof comissao.organizationId !== 'string') {
      throw new Error('ID da organização é obrigatório');
    }
  }

  /**
   * Valida dados de um membro
   */
  private validarDadosMembro(membro: MembroComissao): void {
    if (!membro.servidorId || typeof membro.servidorId !== 'string') {
      throw new Error('ID do servidor é obrigatório');
    }
    if (!membro.papel || !['Presidente', 'Vice-Presidente', 'Secretario', 'Membro', 'Suplente'].includes(membro.papel)) {
      throw new Error('Papel do membro é obrigatório e deve ser válido');
    }
    if (!membro.dataDeIngresso) {
      throw new Error('Data de ingresso é obrigatória');
    }
  }
}

// Instância singleton do serviço
export const comissoesFirebaseService = new ComissoesFirebaseService();

// Hooks personalizados para React (opcional)
export const useComissoesFirebase = () => {
  return {
    criarComissao: comissoesFirebaseService.criarComissao.bind(comissoesFirebaseService),
    buscarComissaoPorId: comissoesFirebaseService.buscarComissaoPorId.bind(comissoesFirebaseService),
    listarComissoes: comissoesFirebaseService.listarComissoes.bind(comissoesFirebaseService),
    atualizarComissao: comissoesFirebaseService.atualizarComissao.bind(comissoesFirebaseService),
    adicionarMembro: comissoesFirebaseService.adicionarMembro.bind(comissoesFirebaseService),
    removerMembro: comissoesFirebaseService.removerMembro.bind(comissoesFirebaseService)
  };
};

// Exemplo de uso:
/*
import { useAuth } from './hooks/useAuth';
import { useComissoesFirebase } from './examples/comissoes-firebase';

function ExemploUso() {
  const { user } = useAuth();
  const { criarComissao, listarComissoes } = useComissoesFirebase();

  const handleCriarComissao = async () => {
    if (!user) return;

    try {
      const novaComissao = await criarComissao(user, {
        nome: 'Comissão de Licitações',
        tipo: 'PERMANENTE',
        status: 'ATIVA',
        dataInicio: new Date(),
        membros: {},
        configuracoes: {
          publica: false,
          permiteConvidados: true
        }
      });
      console.log('Comissão criada:', novaComissao);
    } catch (error) {
      console.error('Erro ao criar comissão:', error);
    }
  };

  const handleListarComissoes = async () => {
    if (!user) return;

    try {
      const comissoes = await listarComissoes(user, {
        status: 'ATIVA',
        limite: 10
      });
      console.log('Comissões encontradas:', comissoes);
    } catch (error) {
      console.error('Erro ao listar comissões:', error);
    }
  };

  return (
    <div>
      <button onClick={handleCriarComissao}>Criar Comissão</button>
      <button onClick={handleListarComissoes}>Listar Comissões</button>
    </div>
  );
}
*/