import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { cn } from '../../lib/utils';
import {
  ComissaoFormProps,
  CreateComissaoRequest,
  UpdateComissaoRequest
} from '../../types/comissao';

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
  // Data de encerramento deve ser posterior à data de criação
  if (data.dataDeEncerramento && data.dataDeEncerramento <= data.dataDeCriacao) {
    return false;
  }
  return true;
}, {
  message: 'Data de encerramento é obrigatória para comissões temporárias e deve ser posterior à data de criação',
  path: ['dataDeEncerramento']
});

type ComissaoFormData = z.infer<typeof comissaoSchema>;

// Componente DatePicker personalizado
interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder: string;
  minDate?: Date;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder,
  minDate,
  disabled
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          disabled={(date) => minDate ? date < minDate : false}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

// Componente principal do formulário
const ComissaoForm: React.FC<ComissaoFormProps> = ({
  comissao,
  organizationId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const form = useForm<ComissaoFormData>({
    resolver: zodResolver(comissaoSchema),
    defaultValues: comissao ? {
      nomeDaComissao: comissao.nomeDaComissao,
      tipo: comissao.tipo,
      dataDeCriacao: new Date(comissao.dataDeCriacao),
      dataDeEncerramento: comissao.dataDeEncerramento ? new Date(comissao.dataDeEncerramento) : undefined,
      descricao: comissao.descricao || '',
      objetivo: comissao.objetivo || '',
      configuracoes: {
        requererQuorum: comissao.configuracoes?.requererQuorum || false,
        quorumMinimo: comissao.configuracoes?.quorumMinimo,
        permitirSubstituicoes: comissao.configuracoes?.permitirSubstituicoes ?? true,
        notificarMembros: comissao.configuracoes?.notificarMembros ?? true
      }
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

  const handleSubmit = async (data: ComissaoFormData) => {
    try {
      const submitData: CreateComissaoRequest | UpdateComissaoRequest = {
        nomeDaComissao: data.nomeDaComissao,
        tipo: data.tipo,
        dataDeCriacao: data.dataDeCriacao,
        dataDeEncerramento: data.dataDeEncerramento,
        descricao: data.descricao || undefined,
        objetivo: data.objetivo || undefined,
        configuracoes: data.configuracoes
      };
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  const tipoSelecionado = form.watch('tipo');
  const requererQuorum = form.watch('configuracoes.requererQuorum');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
          {tipoSelecionado === 'Temporaria' && (
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

            {requererQuorum && (
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
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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

export default ComissaoForm;