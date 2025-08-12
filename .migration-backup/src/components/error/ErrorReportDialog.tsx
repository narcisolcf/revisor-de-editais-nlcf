import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useErrorReport } from '@/hooks/useErrorReport';
import { ErrorSeverity } from '@/types/error';

const reportSchema = z.object({
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  stepsToReproduce: z.string().optional(),
  userEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  severity: z.enum(['low', 'medium', 'high', 'critical'] as const),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ErrorReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errorId: string;
  error?: Error;
}

const ErrorReportDialog: React.FC<ErrorReportDialogProps> = ({
  open,
  onOpenChange,
  errorId,
  error,
}) => {
  const { submitReport, isSubmitting } = useErrorReport();

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: '',
      stepsToReproduce: '',
      userEmail: '',
      severity: 'medium',
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    const success = await submitReport({
      errorId,
      error,
      userFeedback: {
        description: data.description,
        stepsToReproduce: data.stepsToReproduce || undefined,
        userEmail: data.userEmail || undefined,
        severity: data.severity,
      },
    });

    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Problema</DialogTitle>
          <DialogDescription>
            Nos ajude a melhorar a aplicação reportando este erro. 
            Suas informações nos ajudarão a identificar e corrigir o problema rapidamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição do Problema *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o que estava fazendo quando o erro ocorreu..."
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
              name="stepsToReproduce"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Passos para Reproduzir (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. Cliquei em...&#10;2. Preenchi o campo...&#10;3. Pressionei o botão..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a severidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baixa - Não afeta o uso</SelectItem>
                        <SelectItem value="medium">Média - Dificulta o uso</SelectItem>
                        <SelectItem value="high">Alta - Impede algumas funcionalidades</SelectItem>
                        <SelectItem value="critical">Crítica - Aplicação inutilizável</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Informações Técnicas (coletadas automaticamente)
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ID do Erro:</span>
                  <Badge variant="outline" className="font-mono">
                    {errorId}
                  </Badge>
                </div>
                {error && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline">{error.name}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Categoria:</span>
                      <Badge 
                        variant="outline"
                        className={getSeverityColor(form.watch('severity'))}
                      >
                        {form.watch('severity')}
                      </Badge>
                    </div>
                  </>
                )}
                <div className="text-xs text-muted-foreground">
                  URL, User Agent, Timestamp e Stack Trace são coletados automaticamente
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Relatório'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ErrorReportDialog;