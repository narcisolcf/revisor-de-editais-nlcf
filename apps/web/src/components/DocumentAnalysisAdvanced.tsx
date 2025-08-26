/**
 * Componente avançado para análise de documentos com integração Cloud Run
 * Funcionalidades de alta prioridade implementadas
 */

import React, { useState, useEffect } from 'react';
import { DocumentUpload, DocumentAnalysis } from '@/types/document';
import { DocumentAnalysisService } from '@/services/documentAnalysisService';
import { useSmartClassification } from '@/hooks/useSmartClassification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  BarChart3, 
  Settings, 
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle,

  Brain,
  Zap
} from 'lucide-react';

interface AnalysisProgress {
  stage: 'uploading' | 'extracting' | 'analyzing' | 'validating' | 'completing';
  progress: number;
  message: string;
  estimated_time?: number;
}

interface AnalysisStatistics {
  totalAnalyses: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  commonProblems: Array<{ type: string; count: number }>;
  processingTimes: { average: number; min: number; max: number };
}

const DocumentAnalysisAdvanced: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyses, setAnalyses] = useState<DocumentAnalysis[]>([]);
  const [, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [statistics, setStatistics] = useState<AnalysisStatistics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setIsBatchMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [autoClassifyEnabled, setAutoClassifyEnabled] = useState(true);
  
  // Hook para classificação automática
  const { 
    classifyDocument, 
    result: classificationResult, 
    error: classificationError,
    autoApplied,
    getConfidenceText,
    getConfidenceColor
  } = useSmartClassification();

  // Carregar estatísticas ao montar o componente
  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const stats = await DocumentAnalysisService.getAnalysisStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError(null);
  };

  const analyzeDocument = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setProgress({ stage: 'uploading', progress: 0, message: 'Preparando análise...' });

      // Extrair texto do arquivo
      const extractionResult = await DocumentAnalysisService.extractTextFromFile(file);
      
      // Classificação automática com ML (se habilitada)
      let smartClassification = null;
      if (autoClassifyEnabled && extractionResult.text) {
        setProgress({ stage: 'analyzing', progress: 20, message: 'Classificando documento com IA...' });
        
        try {
          smartClassification = await classifyDocument(extractionResult.text, {
            autoApply: true,
            onApplied: (result) => {
              console.log('Classificação aplicada automaticamente:', result);
            },
            onSuggestion: (result) => {
              console.log('Sugestão de classificação:', result);
            }
          });
        } catch (classError) {
          console.warn('Erro na classificação automática:', classError);
          // Continua com a análise mesmo se a classificação falhar
        }
      }
      
      // Criar documento mock para análise
      const document: DocumentUpload = {
        id: `doc_${Date.now()}`,
        prefeituraId: 'mock_prefeitura',
        nome: file.name,
        tipo: file.name.endsWith('.pdf') ? 'PDF' : 'DOCX',
        classification: {
          tipoObjeto: smartClassification?.documentType || 'aquisicao',
          modalidadePrincipal: 'processo_licitatorio',
          subtipo: 'processo_licitatorio',
          tipoDocumento: smartClassification?.documentType || 'edital'
        },
        tamanho: file.size,
        urlStorage: '',
        status: 'processando',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Análise em tempo real com progresso
      const analysis = await DocumentAnalysisService.analyzeDocumentRealTime(
        document,
        extractionResult.text,
        setProgress
      );

      setCurrentAnalysis(analysis);
      setAnalyses(prev => [analysis, ...prev]);
      setActiveTab('results');
      
      // Atualizar estatísticas
      await loadStatistics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro na análise');
    } finally {
      setIsAnalyzing(false);
      setProgress(null);
    }
  };

  const analyzeBatch = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsAnalyzing(true);
      setIsBatchMode(true);
      setError(null);

      // Preparar documentos para análise em lote
      const documentsToAnalyze = [];
      
      for (const file of selectedFiles) {
        const extractionResult = await DocumentAnalysisService.extractTextFromFile(file);
        
        const document: DocumentUpload = {
          id: `doc_${Date.now()}_${Math.random()}`,
          prefeituraId: 'mock_prefeitura',
          nome: file.name,
          tipo: file.name.endsWith('.pdf') ? 'PDF' : 'DOCX',
          classification: {
            tipoObjeto: 'aquisicao',
            modalidadePrincipal: 'processo_licitatorio',
            subtipo: 'processo_licitatorio',
            tipoDocumento: 'edital'
          },
          tamanho: file.size,
          urlStorage: '',
          status: 'processando',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        documentsToAnalyze.push({ document, extractedText: extractionResult.text });
      }

      // Executar análise em lote
      const batchResults = await DocumentAnalysisService.analyzeBatch(documentsToAnalyze);
      
      setAnalyses(prev => [...batchResults, ...prev]);
      setActiveTab('results');
      
      // Atualizar estatísticas
      await loadStatistics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro na análise em lote');
    } finally {
      setIsAnalyzing(false);
      setIsBatchMode(false);
    }
  };

  const reanalyzeDocument = async (documentId: string) => {
    try {
      setIsAnalyzing(true);
      const newAnalysis = await DocumentAnalysisService.reanalyzeDocument(documentId);
      
      setAnalyses(prev => prev.map(analysis => 
        analysis.documentoId === documentId ? newAnalysis : analysis
      ));
      
      setCurrentAnalysis(newAnalysis);
      await loadStatistics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao reprocessar');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
    if (score >= 70) return <Badge className="bg-blue-100 text-blue-800">Bom</Badge>;
    if (score >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
    return <Badge className="bg-red-100 text-red-800">Ruim</Badge>;
  };

  const formatProcessingTime = (time: number) => {
    return time < 1 ? `${Math.round(time * 1000)}ms` : `${time.toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Avançada de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="analysis">Análise</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
              <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis" className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Selecione documentos para análise
                      </span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.docx"
                        className="sr-only"
                        onChange={handleFileSelect}
                        disabled={isAnalyzing}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Arquivos selecionados:</h3>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Configuração de Classificação Automática */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Classificação Automática com IA</h4>
                    <p className="text-sm text-blue-700">Detecta automaticamente o tipo de documento usando machine learning</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoClassifyEnabled}
                      onChange={(e) => setAutoClassifyEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {/* Resultado da Classificação */}
              {classificationResult && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Classificação Automática</h4>
                    {autoApplied && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aplicada
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tipo detectado:</span>
                      <Badge className={`${getConfidenceColor(classificationResult.confidence)} text-white`}>
                        {classificationResult.documentType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confiança:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getConfidenceColor(classificationResult.confidence)}`}
                            style={{ width: `${classificationResult.confidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {(classificationResult.confidence * 100).toFixed(1)}% ({getConfidenceText(classificationResult.confidence)})
                        </span>
                      </div>
                    </div>
                    {classificationResult.alternatives.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Alternativas:</span>
                        <div className="flex gap-1 mt-1">
                          {classificationResult.alternatives.slice(0, 3).map((alt, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {alt.type} ({(alt.confidence * 100).toFixed(0)}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {classificationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Erro na classificação automática: {classificationError}
                  </AlertDescription>
                </Alert>
              )}

              {progress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{progress.message}</span>
                    <span className="text-sm text-gray-500">{progress.progress}%</span>
                  </div>
                  <Progress value={progress.progress} className="w-full" />
                  {progress.estimated_time && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Tempo estimado: {progress.estimated_time}s
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => selectedFiles.length === 1 ? analyzeDocument(selectedFiles[0]) : analyzeBatch()}
                  disabled={selectedFiles.length === 0 || isAnalyzing}
                  className="flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {selectedFiles.length === 1 ? 'Analisar Documento' : `Analisar Lote (${selectedFiles.length})`}
                </Button>
                
                {analyses.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={loadStatistics}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Atualizar
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma análise realizada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <Card key={analysis.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Análise: {analysis.documentoId}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            {getScoreBadge(analysis.scoreConformidade)}
                            <span className={`font-bold ${getScoreColor(analysis.scoreConformidade)}`}>
                              {analysis.scoreConformidade}%
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Métricas
                            </h4>
                            <div className="text-sm space-y-1">
                              <div>Total de cláusulas: {analysis.metricas.totalClauses}</div>
                              <div>Cláusulas válidas: {analysis.metricas.validClauses}</div>
                              <div>Tempo de processamento: {formatProcessingTime(analysis.metricas.processingTime)}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              Problemas ({analysis.problemasEncontrados.length})
                            </h4>
                            <div className="text-sm space-y-1">
                              {analysis.problemasEncontrados.slice(0, 3).map((problem, index) => (
                                <div key={index} className="text-gray-600">
                                  • {problem.descricao}
                                </div>
                              ))}
                              {analysis.problemasEncontrados.length > 3 && (
                                <div className="text-gray-500">
                                  +{analysis.problemasEncontrados.length - 3} mais...
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Ações</h4>
                            <div className="space-y-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => reanalyzeDocument(analysis.documentoId)}
                                disabled={isAnalyzing}
                                className="w-full"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reprocessar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Exportar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-4">
              {statistics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold">{statistics.totalAnalyses}</div>
                      <div className="text-sm text-gray-600">Total de Análises</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {statistics.averageScore.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Score Médio</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {statistics.processingTimes.average.toFixed(2)}s
                      </div>
                      <div className="text-sm text-gray-600">Tempo Médio</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        {statistics.commonProblems.length}
                      </div>
                      <div className="text-sm text-gray-600">Tipos de Problemas</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Distribuição de Scores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(statistics.scoreDistribution).map(([range, count]) => (
                          <div key={range} className="flex justify-between">
                            <span className="text-sm">{range}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Problemas Mais Comuns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {statistics.commonProblems.slice(0, 5).map((problem, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm">{problem.type}</span>
                            <span className="font-medium">{problem.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Carregando estatísticas...
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações de Análise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Parâmetros de Análise</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Configure os pesos e thresholds para personalizar a análise.
                      </p>
                      <Button variant="outline">
                        Configurar Parâmetros
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Cache</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Gerencie o cache de análises para melhorar a performance.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={() => DocumentAnalysisService.clearAnalysisCache()}
                      >
                        Limpar Cache
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Exportar Configurações</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Exporte suas configurações personalizadas.
                      </p>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentAnalysisAdvanced;