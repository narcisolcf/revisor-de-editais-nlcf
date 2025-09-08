import React, { useState, useEffect } from 'react';
import { Plus, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import ComissoesTable from '../components/comissoes/ComissoesTable';
import ComissaoForm from '../components/comissoes/ComissaoForm';
import ComissaoDetails from '../components/comissoes/ComissaoDetails';
import { useComissoes } from '../hooks/useComissoes';
import {
  Comissao,
  CreateComissaoRequest,
  UpdateComissaoRequest,
  ComissaoFilters
} from '../types/comissao';
import { useToast } from '../components/ui/use-toast';

// Mock do organizationId - em um app real, isso viria do contexto de autenticação
const ORGANIZATION_ID = 'org-123';

const Comissoes: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingComissao, setEditingComissao] = useState<Comissao | null>(null);
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [filters, setFilters] = useState<ComissaoFilters>({});

  const {
    comissoes,
    loading,
    error,
    pagination,
    createComissao,
    updateComissao,
    deleteComissao,
    refetch: fetchComissoes
  } = useComissoes({
    organizationId: ORGANIZATION_ID,
    filters,
    pagination: {
      page: 1,
      limit: 20
    }
  });
  const { toast } = useToast();

  // Carrega as comissões na inicialização
  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  // Estatísticas calculadas
  const stats = {
    total: comissoes.length,
    ativas: comissoes.filter(c => c.status === 'Ativa').length,
    temporarias: comissoes.filter(c => c.tipo === 'Temporaria').length,
    membrosTotal: comissoes.reduce((acc, c) => acc + (c.membros?.filter(m => m.ativo).length || 0), 0)
  };

  const handleCreateComissao = async (data: CreateComissaoRequest) => {
    try {
      await createComissao(data);
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Comissão criada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar comissão",
        variant: "destructive"
      });
    }
  };

  const handleUpdateComissao = async (data: UpdateComissaoRequest) => {
    if (!editingComissao) return;
    
    try {
      const updated = await updateComissao(editingComissao.id, data);
      setEditingComissao(null);
      setShowForm(false);
      
      // Se a comissão atualizada está sendo visualizada, atualiza os detalhes
      if (selectedComissao && selectedComissao.id === editingComissao.id) {
        setSelectedComissao(updated);
      }
      
      toast({
        title: "Sucesso",
        description: "Comissão atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar comissão",
        variant: "destructive"
      });
    }
  };

  const handleDeleteComissao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta comissão?')) {
      return;
    }
    
    try {
      await deleteComissao(id);
      
      // Se a comissão excluída estava sendo visualizada, fecha os detalhes
      if (selectedComissao && selectedComissao.id === id) {
        setSelectedComissao(null);
        setShowDetails(false);
      }
      
      toast({
        title: "Sucesso",
        description: "Comissão excluída com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir comissão",
        variant: "destructive"
      });
    }
  };

  const handleViewComissao = (comissao: Comissao) => {
    setSelectedComissao(comissao);
    setShowDetails(true);
  };

  const handleEditComissao = (comissao: Comissao) => {
    setEditingComissao(comissao);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingComissao(null);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedComissao(null);
  };

  const handleComissaoUpdate = (updatedComissao: Comissao) => {
    // Atualiza a comissão na lista local
    const updatedComissoes = comissoes.map(c => 
      c.id === updatedComissao.id ? updatedComissao : c
    );
    // Note: Em um hook real, isso seria feito através do estado do hook
    // Aqui é apenas para demonstrar a integração
  };

  const handleFiltersChange = (newFilters: ComissaoFilters) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Erro ao carregar comissões</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button onClick={fetchComissoes} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comissões</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as comissões da sua organização
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Comissões</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comissões Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ativas}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temporárias</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.temporarias}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.membrosTotal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comissões */}
      <ComissoesTable
        organizationId={ORGANIZATION_ID}
        onView={handleViewComissao}
        onEdit={handleEditComissao}
        onDelete={handleDeleteComissao}
      />

      {/* Modal do Formulário */}
      <Dialog open={showForm} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingComissao ? 'Editar Comissão' : 'Nova Comissão'}
            </DialogTitle>
          </DialogHeader>
          <ComissaoForm
            comissao={editingComissao}
            organizationId={ORGANIZATION_ID}
            onSubmit={editingComissao ? handleUpdateComissao : handleCreateComissao}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      {showDetails && selectedComissao && (
        <ComissaoDetails
          comissao={selectedComissao}
          onEdit={() => handleEditComissao(selectedComissao)}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default Comissoes;