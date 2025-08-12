import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { monitoringService } from '@/services/monitoringService';
import { ErrorSeverity } from '@/types/error';

export interface ErrorReportData {
  errorId: string;
  error?: Error;
  userFeedback: {
    description: string;
    stepsToReproduce?: string;
    userEmail?: string;
    severity: ErrorSeverity;
  };
}

export function useErrorReport() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submitReport = async (reportData: ErrorReportData): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      await monitoringService.submitUserReport(reportData);
      
      toast({
        title: "Relatório enviado com sucesso",
        description: "Obrigado pelo seu feedback! Nossa equipe analisará o problema.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      
      toast({
        variant: "destructive",
        title: "Erro ao enviar relatório",
        description: "Não foi possível enviar o relatório. Tente novamente mais tarde.",
      });
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitReport,
    isSubmitting,
  };
}