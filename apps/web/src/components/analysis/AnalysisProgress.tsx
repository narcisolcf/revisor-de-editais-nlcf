import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Brain,
  Target,
  X,
  Loader2
} from 'lucide-react';
import { DocumentAnalysis } from '@/types/document';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  duration?: number;
  icon: React.ElementType;
}

interface AnalysisProgressProps {
  documentId: string;
  isAnalyzing: boolean;
  onCancel?: () => void;
  onComplete?: (analysis: DocumentAnalysis) => void;
  className?: string;
}

const defaultSteps: AnalysisStep[] = [
  {
    id: 'document-processing',
    title: 'Processamento do Documento',
    description: 'Extraindo texto e estrutura do documento',
    status: 'pending',
    progress: 0,
    icon: FileText
  },
  {
    id: 'classification',
    title: 'Classificação Hierárquica',
    description: 'Identificando tipo e modalidade do documento',
    status: 'pending',
    progress: 0,
    icon: Target
  },
  {
    id: 'content-analysis',
    title: 'Análise de Conteúdo',
    description: 'Verificando cláusulas e requisitos obrigatórios',
    status: 'pending',
    progress: 0,
    icon: Search
  },
  {
    id: 'compliance-check',
    title: 'Verificação de Conformidade',
    description: 'Aplicando regras específicas e validações',
    status: 'pending',
    progress: 0,
    icon: CheckCircle
  },
  {
    id: 'problem-detection',
    title: 'Detecção de Problemas',
    description: 'Identificando inconsistências e não conformidades',
    status: 'pending',
    progress: 0,
    icon: AlertTriangle
  },
  {
    id: 'ai-analysis',
    title: 'Análise com IA',
    description: 'Aplicando modelos de machine learning',
    status: 'pending',
    progress: 0,
    icon: Brain
  },
  {
    id: 'report-generation',
    title: 'Geração do Relatório',
    description: 'Compilando resultados e recomendações',
    status: 'pending',
    progress: 0,
    icon: Zap
  }
];

interface StepItemProps {
  step: AnalysisStep;
  isActive: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ step, isActive }) => {
  const getStatusColor = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-400 bg-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'running':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'error':
        return <X className="w-5 h-5" />;
      default:
        return <step.icon className="w-5 h-5" />;
    }
  };

  return (
    <div className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-200 ${
      isActive ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
    }`}>
      <div className={`p-2 rounded-lg ${getStatusColor(step.status)}`}>
        {getStatusIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-gray-900">{step.title}</h3>
          <div className="flex items-center space-x-2">
            {step.duration && (
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {step.duration}s
              </div>
            )}
            <Badge 
              className={`text-xs ${
                step.status === 'completed' ? 'bg-green-100 text-green-800' :
                step.status === 'running' ? 'bg-blue-100 text-blue-800' :
                step.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-600'
              }`}
            >
              {step.status === 'completed' ? 'Concluído' :
               step.status === 'running' ? 'Executando' :
               step.status === 'error' ? 'Erro' :
               'Pendente'}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
        
        {(step.status === 'running' || step.status === 'completed') && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progresso</span>
              <span>{step.progress}%</span>
            </div>
            <Progress value={step.progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
};

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  documentId,
  isAnalyzing,
  onCancel,
  onComplete,
  className = ''
}) => {
  const [steps, setSteps] = useState<AnalysisStep[]>(defaultSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Simular progresso da análise
  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    setStartTime(new Date());
    
    const simulateAnalysis = async () => {
      for (let i = 0; i < steps.length; i++) {
        const stepStartTime = Date.now();
        
        // Marcar step como executando
        setSteps(prev => prev.map((step, index) => 
          index === i ? { ...step, status: 'running' as const } : step
        ));
        setCurrentStepIndex(i);

        // Simular progresso do step
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          
          setSteps(prev => prev.map((step, index) => 
            index === i ? { ...step, progress } : step
          ));
          
          // Atualizar progresso geral
          const totalProgress = ((i * 100) + progress) / steps.length;
          setOverallProgress(totalProgress);
        }

        // Marcar step como concluído
        const stepDuration = Math.round((Date.now() - stepStartTime) / 1000);
        setSteps(prev => prev.map((step, index) => 
          index === i ? { 
            ...step, 
            status: 'completed' as const, 
            progress: 100,
            duration: stepDuration
          } : step
        ));

        // Pequena pausa entre steps
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Análise concluída
      if (onComplete) {
        // Simular resultado da análise
        const mockAnalysis: DocumentAnalysis = {
          id: `analysis-${documentId}-${Date.now()}`,
          documentoId: documentId,
          textoExtraido: 'Texto extraído do documento...',
          scoreConformidade: 85.5,
          classification: {
            tipoObjeto: 'obra_servicos_eng',
            modalidadePrincipal: 'processo_licitatorio',
            subtipo: 'processo_licitatorio',
            tipoDocumento: 'edital'
          },
          problemasEncontrados: [
            {
              tipo: 'prazo_inadequado',
              descricao: 'Prazo de entrega das propostas inferior ao mínimo legal',
              gravidade: 'alta',
              categoria: 'juridico',
              localizacao: 'Seção 3.2',
              sugestaoCorrecao: 'Alterar prazo para no mínimo 30 dias corridos'
            }
          ],
          recomendacoes: [
            'Revisar cláusulas de habilitação técnica',
            'Incluir critérios de sustentabilidade'
          ],
          metricas: {
            totalClauses: 45,
            validClauses: 38,
            missingClauses: 3,
            inconsistencies: 4,
            processingTime: Math.round(elapsedTime)
          },
          specificAnalysis: {
            prazosAdequados: false,
            modalidadeCorreta: true,
            criteriosHabilitacaoClaros: true,
            especificacoesDetalhadas: true
          },
          createdAt: new Date()
        };
        
        onComplete(mockAnalysis);
      }
    };

    simulateAnalysis();
  }, [isAnalyzing, documentId, onComplete, steps.length]);

  // Atualizar tempo decorrido
  useEffect(() => {
    if (!startTime || !isAnalyzing) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isAnalyzing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise em Progresso</h2>
          <p className="text-gray-600">
            Analisando documento • {completedSteps}/{steps.length} etapas concluídas
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Tempo decorrido</div>
            <div className="font-mono text-lg font-medium">{formatTime(elapsedTime)}</div>
          </div>
          
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progresso Geral</span>
            <span className="text-lg font-mono">{overallProgress.toFixed(1)}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Iniciado</span>
            <span className="font-medium">
              {isAnalyzing ? 'Analisando...' : 'Concluído'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Etapas */}
      <Card>
        <CardHeader>
          <CardTitle>Etapas da Análise</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-2 p-6">
            {steps.map((step, index) => (
              <StepItem 
                key={step.id} 
                step={step} 
                isActive={index === currentStepIndex && isAnalyzing}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status de Erro */}
      {hasErrors && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-medium text-red-900">Erro na Análise</h3>
                <p className="text-red-700">
                  Ocorreu um erro durante o processamento. Verifique o documento e tente novamente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisProgress;