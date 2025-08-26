import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Edit,
  X,
  Calendar,
  Users,
  FileText,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  ComissaoDetailsProps,
  Comissao,
  StatusComissao,
  TipoComissao
} from '../../types/comissao';
import MembrosManager from './MembrosManager';
import { useToast } from '../ui/use-toast';
import { comissoesService } from '../../services/comissoesService';

// Cores para status
const statusColors = {
  'Ativa': 'bg-green-100 text-green-800',
  'Inativa': 'bg-gray-100 text-gray-800',
  'Suspensa': 'bg-yellow-100 text-yellow-800',
  'Encerrada': 'bg-red-100 text-red-800'
};

// Ícones para status
const statusIcons = {
  'Ativa': CheckCircle,
  'Inativa': Clock,
  'Suspensa': AlertCircle,
  'Encerrada': X
};

// Cores para tipos
const tipoColors = {
  'Permanente': 'bg-blue-100 text-blue-800',
  'Temporaria': 'bg-purple-100 text-purple-800'
};

const ComissaoDetails: React.FC<ComissaoDetailsProps> = ({
  comissao: initialComissao,
  organizationId,
  onEdit,
  onClose,
  onUpdate
}) => {
  const [comissao, setComissao] = useState<Comissao>(initialComissao);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Atualiza o estado local quando a prop muda
  useEffect(() => {
    setComissao(initialComissao);
  }, [initialComissao]);

  const handleFecharComissao = async () => {
    if (!confirm('Tem certeza que deseja encerrar esta comissão?')) {
      return;
    }

    try {
      setLoading(true);
      await comissoesService.update(organizationId, comissao.id, {
        status: 'Encerrada' as StatusComissao,
        dataDeEncerramento: new Date()
      });
      
      const comissaoAtualizada = {
        ...comissao,
        status: 'Encerrada' as StatusComissao,
        dataDeEncerramento: new Date()
      };
      
      setComissao(comissaoAtualizada);
      onUpdate?.(comissaoAtualizada);
      
      toast({
        title: "Sucesso",
        description: "Comissão encerrada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao encerrar comissão",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMembrosChange = (novosMembros: any[]) => {
    const comissaoAtualizada = {
      ...comissao,
      membros: novosMembros
    };
    setComissao(comissaoAtualizada);
    onUpdate?.(comissaoAtualizada);
  };

  const StatusIcon = statusIcons[comissao.status];

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <DialogTitle className="text-xl">{comissao.nome}</DialogTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={tipoColors[comissao.tipo]}>
                    {comissao.tipo}
                  </Badge>
                  <Badge className={statusColors[comissao.status]}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {comissao.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(comissao)}
                disabled={comissao.status === 'Encerrada'}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
              
              {comissao.status === 'Ativa' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleFecharComissao}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Encerrar
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="informacoes" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informacoes">
              <FileText className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="membros">
              <Users className="h-4 w-4 mr-2" />
              Membros ({comissao.membros?.filter(m => m.ativo).length || 0})
            </TabsTrigger>
            <TabsTrigger value="historico">
              <Clock className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="informacoes" className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="mt-1">{comissao.tipo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">{comissao.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Criação</label>
                    <p className="mt-1">
                      {format(new Date(comissao.dataDeCriacao), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  {comissao.dataDeEncerramento && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Data de Encerramento</label>
                      <p className="mt-1">
                        {format(new Date(comissao.dataDeEncerramento), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}
                </div>
                
                {comissao.descricao && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Descrição</label>
                      <p className="mt-1 text-gray-700">{comissao.descricao}</p>
                    </div>
                  </>
                )}
                
                {comissao.objetivo && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Objetivo</label>
                      <p className="mt-1 text-gray-700">{comissao.objetivo}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Configurações */}
            {comissao.configuracoes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Requer Quórum</label>
                      <p className="mt-1">
                        {comissao.configuracoes.requererQuorum ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    {comissao.configuracoes.requererQuorum && comissao.configuracoes.quorumMinimo && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quórum Mínimo</label>
                        <p className="mt-1">{comissao.configuracoes.quorumMinimo}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Permite Substituições</label>
                      <p className="mt-1">
                        {comissao.configuracoes.permitirSubstituicoes ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notificar Membros</label>
                      <p className="mt-1">
                        {comissao.configuracoes.notificarMembros ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="membros">
            <MembrosManager
              comissaoId={comissao.id}
              organizationId={organizationId}
              membros={comissao.membros || []}
              onMembrosChange={handleMembrosChange}
              readonly={comissao.status === 'Encerrada'}
            />
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Histórico de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Histórico em desenvolvimento
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    O histórico de atividades será implementado em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ComissaoDetails;