import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  UserPlus,
  Edit,
  UserMinus,
  MoreHorizontal,
  Crown,
  Shield,
  FileText,
  User,
  UserCheck
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  MembrosManagerProps,
  MembroComissao,
  PapelMembro,
  ServidorDisponivel
} from '../../types/comissao';
import { comissoesService } from '../../services/comissoesService';
import { useToast } from '../ui/use-toast';

// Ícones e cores para papéis
const papelIcons = {
  'Presidente': Crown,
  'Vice-Presidente': Shield,
  'Secretario': FileText,
  'Membro': User,
  'Suplente': UserCheck
};

const papelColors = {
  'Presidente': 'bg-yellow-100 text-yellow-800',
  'Vice-Presidente': 'bg-blue-100 text-blue-800',
  'Secretario': 'bg-green-100 text-green-800',
  'Membro': 'bg-gray-100 text-gray-800',
  'Suplente': 'bg-purple-100 text-purple-800'
};

// Componente para adicionar novo membro
interface AdicionarMembroDialogProps {
  organizationId: string;
  onAdd: (membro: MembroComissao) => void;
}

const AdicionarMembroDialog: React.FC<AdicionarMembroDialogProps> = ({
  organizationId,
  onAdd
}) => {
  const [open, setOpen] = useState(false);
  const [selectedServidor, setSelectedServidor] = useState('');
  const [papel, setPapel] = useState<PapelMembro>('Membro');
  const [observacoes, setObservacoes] = useState('');
  const [servidoresDisponiveis, setServidoresDisponiveis] = useState<ServidorDisponivel[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadServidoresDisponiveis();
    }
  }, [open]);

  const loadServidoresDisponiveis = async () => {
    try {
      setLoading(true);
      const servidores = await comissoesService.getServidoresDisponiveis(organizationId);
      setServidoresDisponiveis(servidores);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar servidores disponíveis",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedServidor) {
      toast({
        title: "Erro",
        description: "Selecione um servidor",
        variant: "destructive"
      });
      return;
    }
    
    const servidor = servidoresDisponiveis.find(s => s.id === selectedServidor);
    if (!servidor) return;

    const novoMembro: MembroComissao = {
      servidorId: selectedServidor,
      papel,
      dataDeIngresso: new Date(),
      ativo: true,
      observacoes: observacoes || undefined,
      servidor: {
        id: servidor.id,
        nome: servidor.nome,
        email: servidor.email,
        cargo: servidor.cargo,
        avatar: servidor.avatar
      }
    };
    
    onAdd(novoMembro);
    setOpen(false);
    // Reset form
    setSelectedServidor('');
    setPapel('Membro');
    setObservacoes('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Membro</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="servidor">Servidor *</Label>
            <Select value={selectedServidor} onValueChange={setSelectedServidor} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um servidor"} />
              </SelectTrigger>
              <SelectContent>
                {servidoresDisponiveis.map((servidor) => (
                  <SelectItem key={servidor.id} value={servidor.id}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={servidor.avatar} />
                        <AvatarFallback>
                          {servidor.nome.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{servidor.nome}</div>
                        <div className="text-sm text-gray-500">{servidor.cargo}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="papel">Papel na Comissão *</Label>
            <Select value={papel} onValueChange={(value: PapelMembro) => setPapel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Presidente">Presidente</SelectItem>
                <SelectItem value="Vice-Presidente">Vice-Presidente</SelectItem>
                <SelectItem value="Secretario">Secretário</SelectItem>
                <SelectItem value="Membro">Membro</SelectItem>
                <SelectItem value="Suplente">Suplente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a participação..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedServidor || loading}>
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Lista de membros
interface ListaMembrosProps {
  membros: MembroComissao[];
  onEdit: (membro: MembroComissao) => void;
  onRemove: (servidorId: string) => void;
  readonly?: boolean;
}

const ListaMembros: React.FC<ListaMembrosProps> = ({
  membros,
  onEdit,
  onRemove,
  readonly = false
}) => {
  if (membros.length === 0) {
    return (
      <Card className="p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Nenhum membro adicionado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Adicione membros para formar a comissão.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {membros.map((membro) => {
        const Icon = papelIcons[membro.papel];
        
        return (
          <Card key={membro.servidorId} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={membro.servidor?.avatar} />
                  <AvatarFallback>
                    {membro.servidor?.nome.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{membro.servidor?.nome || 'Nome não disponível'}</h4>
                    <Badge className={papelColors[membro.papel]}>
                      <Icon className="h-3 w-3 mr-1" />
                      {membro.papel}
                    </Badge>
                    {!membro.ativo && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{membro.servidor?.cargo || 'Cargo não disponível'}</p>
                  <p className="text-xs text-gray-400">
                    Ingresso: {format(new Date(membro.dataDeIngresso), 'dd/MM/yyyy')}
                    {membro.dataDeSaida && (
                      <> • Saída: {format(new Date(membro.dataDeSaida), 'dd/MM/yyyy')}</>
                    )}
                  </p>
                  {membro.observacoes && (
                    <p className="text-xs text-gray-600 mt-1">
                      {membro.observacoes}
                    </p>
                  )}
                </div>
              </div>

              {!readonly && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onEdit(membro)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onRemove(membro.servidorId)}
                      className="text-red-600"
                    >
                      <UserMinus className="h-4 w-4 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// Componente principal
const MembrosManager: React.FC<MembrosManagerProps> = ({
  comissaoId,
  organizationId,
  membros,
  onMembrosChange,
  readonly = false
}) => {
  const { toast } = useToast();

  const handleAddMembro = async (novoMembro: MembroComissao) => {
    try {
      await comissoesService.addMembro(organizationId, comissaoId, {
        servidorId: novoMembro.servidorId,
        papel: novoMembro.papel,
        observacoes: novoMembro.observacoes
      });
      
      const novosMembros = [...membros, novoMembro];
      onMembrosChange(novosMembros);
      
      toast({
        title: "Sucesso",
        description: "Membro adicionado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar membro",
        variant: "destructive"
      });
    }
  };

  const handleEditMembro = (_membro: MembroComissao) => {
    // TODO: Implementar modal de edição
    console.log('Editar membro:', _membro);
  };

  const handleRemoveMembro = async (servidorId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) {
      return;
    }

    try {
      await comissoesService.removeMembro(organizationId, comissaoId, servidorId);
      
      const novosMembros = membros.filter(m => m.servidorId !== servidorId);
      onMembrosChange(novosMembros);
      
      toast({
        title: "Sucesso",
        description: "Membro removido com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover membro",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Membros da Comissão</h3>
          <p className="text-sm text-gray-500">
            {membros.filter(m => m.ativo).length} membro(s) ativo(s)
          </p>
        </div>
        {!readonly && (
          <AdicionarMembroDialog
            organizationId={organizationId}
            onAdd={handleAddMembro}
          />
        )}
      </div>

      {/* Lista de membros */}
      <ListaMembros
        membros={membros}
        onEdit={handleEditMembro}
        onRemove={handleRemoveMembro}
        readonly={readonly}
      />
    </div>
  );
};

export default MembrosManager;