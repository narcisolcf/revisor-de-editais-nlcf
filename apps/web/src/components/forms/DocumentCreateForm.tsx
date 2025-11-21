/**
 * DocumentCreateForm - Exemplo Completo de Formulário com Validação
 *
 * Demonstra:
 * - React Hook Form + Zod Schema Validation
 * - Validação em tempo real
 * - Mensagens de erro customizadas
 * - Form states (loading, success, error)
 * - Componentes shadcn/ui Form
 * - TypeScript type safety
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentSchema, type DocumentFormData } from '@/lib/validations/schemas';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Save } from 'lucide-react';

interface DocumentCreateFormProps {
  onSuccess?: (data: DocumentFormData) => void;
  defaultValues?: Partial<DocumentFormData>;
}

export function DocumentCreateForm({ onSuccess, defaultValues }: DocumentCreateFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize form with React Hook Form + Zod
  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      number: defaultValues?.number || '',
      type: defaultValues?.type || 'licitacao',
      description: defaultValues?.description || '',
      value: defaultValues?.value,
      deadline: defaultValues?.deadline
    },
    mode: 'onChange' // Valida enquanto digita
  });

  // Submit handler
  const onSubmit = async (data: DocumentFormData) => {
    try {
      setIsSubmitting(true);

      // Simula chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('📄 Documento criado:', data);

      toast({
        title: 'Sucesso!',
        description: 'Documento criado com sucesso.'
      });

      // Callback de sucesso
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate('/documentos');
      }

      // Reset form
      form.reset();
    } catch (error) {
      console.error('Erro ao criar documento:', error);

      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao criar o documento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Criar Novo Documento
        </CardTitle>
        <CardDescription>
          Preencha os campos abaixo para criar um novo documento/edital.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Pregão Eletrônico nº 001/2025"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome completo do documento ou edital
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Número e Tipo (lado a lado) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Edital *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 001/2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="licitacao">Licitação</SelectItem>
                        <SelectItem value="pregao">Pregão</SelectItem>
                        <SelectItem value="dispensa">Dispensa</SelectItem>
                        <SelectItem value="inexigibilidade">
                          Inexigibilidade
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva resumidamente o objeto do edital..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informações adicionais sobre o documento (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de Ação */}
            <div className="flex gap-4 justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Criar Documento
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default DocumentCreateForm;
