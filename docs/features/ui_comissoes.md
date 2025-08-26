# Feature: Interface de Usuário para Comissões
**Documento de Planejamento Frontend**

---

## 📋 Visão Geral

### Objetivo
Criar uma interface de usuário moderna e intuitiva para o gerenciamento de comissões, incluindo componentes de listagem, formulários de criação/edição e visualização detalhada.

### Contexto
Este documento define o plano para o **@Frontend-React** implementar os componentes de UI necessários para o módulo de Comissões, seguindo o design system existente e as melhores práticas de UX.

### Componentes Principais
1. **Tabela de Listagem** - Para visualizar e gerenciar comissões
2. **Formulário de Comissão** - Para criar e editar comissões
3. **Visualização Detalhada** - Para ver informações completas
4. **Gerenciamento de Membros** - Para adicionar/remover membros

---

## 🎨 Design System e Padrões

### Componentes Base Utilizados
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` - Listagem
- `Dialog`, `DialogContent`, `DialogHeader` - Modais
- `Form`, `FormField`, `FormItem`, `FormLabel` - Formulários
- `Input`, `Select`, `DatePicker`, `Textarea` - Campos de entrada
- `Button`, `Badge`, `Card`, `Tabs` - Elementos de interface
- `Avatar`, `AvatarImage`, `AvatarFallback` - Exibição de usuários

### Paleta de Cores para Status
```typescript
const statusColors = {
  'Ativa': 'bg-green-100 text-green-800',
  'Inativa': 'bg-gray-100 text-gray-800',
  'Suspensa': 'bg-yellow-100 text-yellow-800',
  'Encerrada': 'bg-red-100 text-red-800'
};

const tipoColors = {
  'Permanente': 'bg-blue-100 text-blue-800',
  'Temporaria': 'bg-purple-100 text-purple-800'
};
```

---

## 📊 Componente 1: Tabela de Comissões

### Arquivo: `src/components/comissoes/ComissoesTable.tsx`

### Funcionalidades

#### Estrutura da Tabela
```typescript
interface ComissoesTableProps {
  organizationId: string;
  onEdit: (comissao: Comissao) => void;
  onDelete: (comissaoId: string) => void;
  onView: (comissao: Comissao) => void;
}

// Colunas da tabela
const columns = [
  {
    key: 'nomeDaComissao',
    label: 'Nome da Comissão',
    sortable: true
  },
  {
    key: 'tipo',
    label: 'Tipo',
    sortable: true,
    render: (value: string) => (
      <Badge className={tipoColors[value]}>{value}</Badge>
    )
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value: string) => (
      <Badge className={statusColors[value]}>{value}</Badge>
    )
  },
  {
    key: 'membros',
    label: 'Membros',
    render: (membros: MembroComissao[]) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        <span>{membros.filter(m => m.ativo).length}</span>
      </div>
    )
  },
  {
    key: 'dataDeCriacao',
    label: 'Data de Criação',
    sortable: true,
    render: (date: Date) => format(date, 'dd/MM/yyyy')
  },
  {
    key: 'actions',
    label: 'Ações',
    render: (_, comissao: Comissao) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onView(comissao)}>
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(comissao)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(comissao.id)}
            className="text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
];
```

#### Funcionalidades de Filtro e Busca
```typescript
interface FilterState {
  search: string;
  tipo: TipoComissao | 'all';
  status: StatusComissao | 'all';
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// Componente de filtros
const TableFilters = ({ filters, onFiltersChange }) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="flex-1">
      <Input
        placeholder="Buscar comissões..."
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="max-w-sm"
      />
    </div>
    <Select
      value={filters.tipo}
      onValueChange={(value) => onFiltersChange({ ...filters, tipo: value })}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por tipo" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os tipos</SelectItem>
        <SelectItem value="Permanente">Permanente</SelectItem>
        <SelectItem value="Temporaria">Temporária</SelectItem>
      </SelectContent>
    </Select>
    <Select
      value={filters.status}
      onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filtrar por status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os status</SelectItem>
        <SelectItem value="Ativa">Ativa</SelectItem>
        <SelectItem value="Inativa">Inativa</SelectItem>
        <SelectItem value="Suspensa">Suspensa</SelectItem>
        <SelectItem value="Encerrada">Encerrada</SelectItem>
      </SelectContent>
    </Select>
  </div>
);
```

#### Estados de Loading e Erro
```typescript
// Loading state
const TableSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <Skeleton className="h-12 w-full" />
      </div>
    ))}
  </div>
);

// Empty state
const EmptyState = ({ onCreateNew }) => (
  <div className="text-center py-12">
    <Users className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">
      Nenhuma comissão encontrada
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Comece criando sua primeira comissão.
    </p>
    <div className="mt-6">
      <Button onClick={onCreateNew}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Comissão
      </Button>
    </div>
  </div>
);
```

---

## 📝 Componente 2: Formulário de Comissão

### Arquivo: `src/components/comissoes/ComissaoForm.tsx`

### Estrutura do Formulário

```typescript
interface ComissaoFormProps {
  comissao?: Comissao; // undefined para criação, preenchido para edição
  organizationId: string;
  onSubmit: (data: CreateComissaoRequest | UpdateComissaoRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// Schema de validação com Zod
const comissaoSchema = z.object({
  nomeDaComissao: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  tipo: z.enum(['Permanente', 'Temporaria']),
  dataDeCriacao: z.date({
    required_error: 'Data de criação é obrigatória'
  }),
  dataDeEncerramento: z.date().optional(),
  descricao: z.string().optional(),
  objetivo: z.string().optional(),
  configuracoes: z.object({
    requererQuorum: z.boolean().default(false),
    quorumMinimo: z.number().min(1).optional(),
    permitirSubstituicoes: z.boolean().default(true),
    notificarMembros: z.boolean().default(true)
  }).optional()
}).refine((data) => {
  // Validação condicional: se tipo é Temporária, data de encerramento é obrigatória
  if (data.tipo === 'Temporaria' && !data.dataDeEncerramento) {
    return false;
  }
  return true;
}, {
  message: 'Data de encerramento é obrigatória para comissões temporárias',
  path: ['dataDeEncerramento']
});
```

### Layout do Formulário

```typescript
const ComissaoForm = ({ comissao, organizationId, onSubmit, onCancel, isLoading }) => {
  const form = useForm<z.infer<typeof comissaoSchema>>({
    resolver: zodResolver(comissaoSchema),
    defaultValues: comissao ? {
      nomeDaComissao: comissao.nomeDaComissao,
      tipo: comissao.tipo,
      dataDeCriacao: comissao.dataDeCriacao,
      dataDeEncerramento: comissao.dataDeEncerramento,
      descricao: comissao.descricao,
      objetivo: comissao.objetivo,
      configuracoes: comissao.configuracoes
    } : {
      tipo: 'Permanente',
      dataDeCriacao: new Date(),
      configuracoes: {
        requererQuorum: false,
        permitirSubstituicoes: true,
        notificarMembros: true
      }
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seção: Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Básicas</h3>
          
          <FormField
            control={form.control}
            name="nomeDaComissao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Comissão *</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Comissão de Licitação" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Permanente">Permanente</SelectItem>
                      <SelectItem value="Temporaria">Temporária</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataDeCriacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Criação *</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder="Selecione a data"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Data de encerramento - condicional */}
          {form.watch('tipo') === 'Temporaria' && (
            <FormField
              control={form.control}
              name="dataDeEncerramento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Encerramento *</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder="Selecione a data de encerramento"
                      minDate={form.getValues('dataDeCriacao')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Seção: Descrição e Objetivo */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Descrição e Objetivo</h3>
          
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva brevemente a comissão..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objetivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Objetivo</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Qual o objetivo desta comissão?"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Seção: Configurações */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Configurações</h3>
          
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="configuracoes.requererQuorum"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requerer Quórum</FormLabel>
                    <FormDescription>
                      Exigir número mínimo de membros para decisões
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('configuracoes.requererQuorum') && (
              <FormField
                control={form.control}
                name="configuracoes.quorumMinimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quórum Mínimo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Ex: 3"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="configuracoes.permitirSubstituicoes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Permitir Substituições</FormLabel>
                    <FormDescription>
                      Permitir substituição de membros durante o período
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="configuracoes.notificarMembros"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notificar Membros</FormLabel>
                    <FormDescription>
                      Enviar notificações por email para os membros
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {comissao ? 'Atualizar' : 'Criar'} Comissão
          </Button>
        </div>
      </form>
    </Form>
  );
};
```

---

## 👥 Componente 3: Gerenciamento de Membros

### Arquivo: `src/components/comissoes/MembrosManager.tsx`

### Funcionalidades

```typescript
interface MembrosManagerProps {
  comissaoId: string;
  organizationId: string;
  membros: MembroComissao[];
  onMembrosChange: (membros: MembroComissao[]) => void;
  readonly?: boolean;
}

// Componente para adicionar novo membro
const AdicionarMembroDialog = ({ onAdd, servidoresDisponiveis }) => {
  const [open, setOpen] = useState(false);
  const [selectedServidor, setSelectedServidor] = useState('');
  const [papel, setPapel] = useState<PapelMembro>('Membro');
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = () => {
    if (!selectedServidor) return;
    
    const novoMembro: MembroComissao = {
      servidorId: selectedServidor,
      papel,
      dataDeIngresso: new Date(),
      ativo: true,
      observacoes: observacoes || undefined
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
            <Select value={selectedServidor} onValueChange={setSelectedServidor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um servidor" />
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
            <Button onClick={handleSubmit} disabled={!selectedServidor}>
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Lista de membros
const ListaMembros = ({ membros, onEdit, onRemove, readonly }) => {
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
                    {membro.servidor?.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{membro.servidor?.nome}</h4>
                    <Badge className={papelColors[membro.papel]}>
                      <Icon className="h-3 w-3 mr-1" />
                      {membro.papel}
                    </Badge>
                    {!membro.ativo && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{membro.servidor?.cargo}</p>
                  <p className="text-xs text-gray-400">
                    Ingresso: {format(membro.dataDeIngresso, 'dd/MM/yyyy')}
                    {membro.dataDeSaida && (
                      <> • Saída: {format(membro.dataDeSaida, 'dd/MM/yyyy')}</>
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
```

---

## 📱 Componente 4: Visualização Detalhada

### Arquivo: `src/components/comissoes/ComissaoDetails.tsx`

```typescript
interface ComissaoDetailsProps {
  comissao: Comissao;
  onEdit: () => void;
  onClose: () => void;
}

const ComissaoDetails = ({ comissao, onEdit, onClose }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{comissao.nomeDaComissao}</h2>
          <div className="flex items-center space-x-2 mt-2">
            <Badge className={tipoColors[comissao.tipo]}>
              {comissao.tipo}
            </Badge>
            <Badge className={statusColors[comissao.status]}>
              {comissao.status}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs de conteúdo */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="membros">Membros</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Criação</Label>
                  <p className="text-sm">{format(comissao.dataDeCriacao, 'dd/MM/yyyy')}</p>
                </div>
                {comissao.dataDeEncerramento && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Encerramento</Label>
                    <p className="text-sm">{format(comissao.dataDeEncerramento, 'dd/MM/yyyy')}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Criado por</Label>
                  <p className="text-sm">{comissao.createdBy}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Última modificação</Label>
                  <p className="text-sm">{format(comissao.updatedAt, 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              
              {comissao.descricao && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-sm mt-1">{comissao.descricao}</p>
                </div>
              )}
              
              {comissao.objetivo && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Objetivo</Label>
                  <p className="text-sm mt-1">{comissao.objetivo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações */}
          {comissao.configuracoes && (
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requerer Quórum</span>
                    <Badge variant={comissao.configuracoes.requererQuorum ? 'default' : 'secondary'}>
                      {comissao.configuracoes.requererQuorum ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  {comissao.configuracoes.requererQuorum && comissao.configuracoes.quorumMinimo && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quórum Mínimo</span>
                      <span className="text-sm font-medium">{comissao.configuracoes.quorumMinimo} membros</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Permitir Substituições</span>
                    <Badge variant={comissao.configuracoes.permitirSubstituicoes ? 'default' : 'secondary'}>
                      {comissao.configuracoes.permitirSubstituicoes ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notificar Membros</span>
                    <Badge variant={comissao.configuracoes.notificarMembros ? 'default' : 'secondary'}>
                      {comissao.configuracoes.notificarMembros ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="membros">
          <MembrosManager
            comissaoId={comissao.id}
            organizationId={comissao.organizationId}
            membros={comissao.membros}
            onMembrosChange={() => {}} // Read-only na visualização
            readonly
          />
        </TabsContent>

        <TabsContent value="historico">
          {/* Componente de histórico será implementado posteriormente */}
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Histórico em desenvolvimento
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                O histórico de alterações será implementado em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

---

## 🔗 Integração e Hooks

### Hook Personalizado: `useComissoes`

```typescript
// src/hooks/useComissoes.ts
interface UseComissoesOptions {
  organizationId: string;
  filters?: {
    search?: string;
    tipo?: TipoComissao | 'all';
    status?: StatusComissao | 'all';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export const useComissoes = (options: UseComissoesOptions) => {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const fetchComissoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await comissoesService.list(options);
      setComissoes(response.data);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comissões');
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchComissoes();
  }, [fetchComissoes]);

  const createComissao = async (data: CreateComissaoRequest) => {
    const response = await comissoesService.create(options.organizationId, data);
    await fetchComissoes(); // Recarregar lista
    return response;
  };

  const updateComissao = async (id: string, data: UpdateComissaoRequest) => {
    const response = await comissoesService.update(options.organizationId, id, data);
    await fetchComissoes(); // Recarregar lista
    return response;
  };

  const deleteComissao = async (id: string) => {
    await comissoesService.delete(options.organizationId, id);
    await fetchComissoes(); // Recarregar lista
  };

  return {
    comissoes,
    loading,
    error,
    pagination,
    createComissao,
    updateComissao,
    deleteComissao,
    refetch: fetchComissoes
  };
};
```

---

## 📄 Página Principal

### Arquivo: `src/pages/Comissoes.tsx`

```typescript
const ComissoesPage = () => {
  const { user } = useAuth();
  const [selectedComissao, setSelectedComissao] = useState<Comissao | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tipo: 'all' as const,
    status: 'all' as const
  });

  const {
    comissoes,
    loading,
    error,
    pagination,
    createComissao,
    updateComissao,
    deleteComissao
  } = useComissoes({
    organizationId: user.organizationId,
    filters,
    pagination: { page: 1, limit: 20 }
  });

  const handleCreateNew = () => {
    setSelectedComissao(null);
    setShowForm(true);
  };

  const handleEdit = (comissao: Comissao) => {
    setSelectedComissao(comissao);
    setShowForm(true);
  };

  const handleView = (comissao: Comissao) => {
    setSelectedComissao(comissao);
    setShowDetails(true);
  };

  const handleFormSubmit = async (data: CreateComissaoRequest | UpdateComissaoRequest) => {
    try {
      if (selectedComissao) {
        await updateComissao(selectedComissao.id, data as UpdateComissaoRequest);
        toast.success('Comissão atualizada com sucesso!');
      } else {
        await createComissao(data as CreateComissaoRequest);
        toast.success('Comissão criada com sucesso!');
      }
      setShowForm(false);
    } catch (error) {
      toast.error('Erro ao salvar comissão');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta comissão?')) {
      try {
        await deleteComissao(id);
        toast.success('Comissão excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir comissão');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="text-muted-foreground">
            Gerencie as comissões da sua organização
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Comissão
        </Button>
      </div>

      {/* Tabela */}
      <ComissoesTable
        organizationId={user.organizationId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* Modal de Formulário */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedComissao ? 'Editar Comissão' : 'Nova Comissão'}
            </DialogTitle>
          </DialogHeader>
          <ComissaoForm
            comissao={selectedComissao}
            organizationId={user.organizationId}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedComissao && (
            <ComissaoDetails
              comissao={selectedComissao}
              onEdit={() => {
                setShowDetails(false);
                setShowForm(true);
              }}
              onClose={() => setShowDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComissoesPage;
```

---

## 🎯 Próximos Passos para Implementação

### Fase 1: Componentes Base
1. Criar `ComissoesTable.tsx` com funcionalidades de listagem
2. Implementar `ComissaoForm.tsx` com validações
3. Desenvolver `MembrosManager.tsx` para gestão de membros
4. Criar `ComissaoDetails.tsx` para visualização

### Fase 2: Integração
1. Implementar hook `useComissoes`
2. Criar serviço de API `comissoesService`
3. Integrar com sistema de autenticação
4. Adicionar tratamento de erros

### Fase 3: UX/UI
1. Implementar estados de loading
2. Adicionar animações e transições
3. Otimizar para dispositivos móveis
4. Implementar temas claro/escuro

### Fase 4: Funcionalidades Avançadas
1. Implementar busca avançada
2. Adicionar exportação de dados
3. Criar sistema de notificações
4. Implementar histórico de alterações

---

*Documento criado em: $(date)*
*Versão: 1.0*
*Próxima revisão: $(date +30 days)*