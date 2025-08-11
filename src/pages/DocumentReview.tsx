import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate, formatFileSize } from "@/utils/formatters";
import { Upload, FileText, CheckCircle, Clock } from "lucide-react";
import { DocumentService } from "@/services/documentService";
import { DocumentAnalysisService } from "@/services/documentAnalysisService";
import { DocumentUpload, DocumentAnalysis, DocumentClassification, DocumentSpecificFields } from "@/types/document";
import { HierarchicalClassification } from "@/components/HierarchicalClassification";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import AnalysisCharts from '@/components/documents/AnalysisCharts';
import ProblemsList from '@/components/documents/ProblemsList';
import { GovCollapseItem } from '@/components/ui/gov-collapse';
import { History, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

// Dados de mock movidos para src/data/mockAnalysis.ts

export default function DocumentReview() {
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUpload | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState<Partial<DocumentClassification>>({});
  const [isClassificationValid, setIsClassificationValid] = useState(false);
  const [specificFields, setSpecificFields] = useState<DocumentSpecificFields>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Validation
    if (!isClassificationValid) {
      toast({
        title: t('common.error'),
        description: t('documents.completeClassification'),
        variant: "destructive",
      });
      return;
    }
    
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('common.error'),
        description: t('documents.invalidFileType'),
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('documents.fileTooBig'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Simular upload (em produção usaria DocumentService.uploadDocument)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockDocument: DocumentUpload = {
        id: 'doc_' + Date.now(),
        prefeituraId: 'mombaca_001',
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'PDF' : 'DOCX',
        tamanho: file.size,
        urlStorage: 'mock-url',
        status: 'concluido',
        classification: classification as DocumentClassification,
        descricao: `${file.name} - ${formatFileSize(file.size)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setUploadedFile(file);
      setUploadedDocument(mockDocument);
      
      toast({
        title: t('common.success'),
        description: t('documents.uploadSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('documents.uploadError'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, classification, isClassificationValid, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: !isClassificationValid || loading
  });

  const handleAnalyze = async () => {
    if (!uploadedDocument || !uploadedFile) {
      toast({
        title: t('common.error'),
        description: t('documents.uploadError'),
        variant: "destructive",
      });
      return;
    }
    
    setAnalyzing(true);
    
    try {
      // Extract text from document (arquivo real)
      const textResult = await DocumentAnalysisService.extractTextFromFile(uploadedFile);
      
      // Analyze document
      const analysisResult = await DocumentAnalysisService.analyzeDocument(uploadedDocument, textResult.text);
      
      setAnalysis(analysisResult);
      
      // Update document status
      await DocumentService.updateDocumentStatus(uploadedDocument.id, 'concluido');
      setUploadedDocument(prev => prev ? {
        ...prev,
        status: 'concluido'
      } : null);
      
      toast({
        title: t('common.success'),
        description: `Análise concluída! Score: ${analysisResult.scoreConformidade}%`,
      });
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: t('common.error'),
        description: t('documents.analysisError'),
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-government-50 to-government-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('documents.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('documents.subtitle')}
          </p>
        </div>

        <div className="grid lg:grid-cols-1 gap-8">
          {/* Document Classification Section */}
          <ErrorBoundary
            onError={(error, errorInfo) => {
              console.error('Error in HierarchicalClassification:', error, errorInfo);
              // Opcional: Enviar erro para serviço de monitoramento
              // reportError('HierarchicalClassification', error, errorInfo);
            }}
          >
            <HierarchicalClassification
              classification={classification}
              onClassificationChange={setClassification}
              onValidationChange={setIsClassificationValid}
            />
          </ErrorBoundary>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {t('documents.uploadArea')}
                </CardTitle>
                <CardDescription>
                  {t('documents.supportedFormats')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-government-500 bg-government-50' 
                      : !isClassificationValid
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                      : 'border-gray-300 hover:border-government-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <FileText className="h-full w-full" />
                    </div>
                    {loading ? (
                      <div className="space-y-2">
                        <Clock className="h-6 w-6 mx-auto animate-spin text-government-500" />
                        <p className="text-government-600 font-medium">{t('common.loading')}</p>
                      </div>
                    ) : !isClassificationValid ? (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-400">
                          {t('documents.uploadArea')}
                        </p>
                        <p className="text-sm text-gray-400">
                          Complete a classificação hierárquica do documento primeiro
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-900">
                          {isDragActive ? 'Solte o arquivo aqui' : t('documents.uploadArea')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('documents.supportedFormats')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {uploadedDocument && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{uploadedDocument.nome}</p>
                        <p className="text-sm text-green-600">
                          {uploadedDocument.tipo} • {formatFileSize(uploadedDocument.tamanho)}
                        </p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="w-full mt-3"
                    >
                      {analyzing ? t('documents.analyzing') : t('documents.analyze')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 {t('documents.analysisResults')}
                  </CardTitle>
                  <CardDescription>
                    {t('documents.conformityScore')}: {analysis.scoreConformidade}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Score Overview */}
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl font-bold text-government-600 mb-1">
                        {analysis.scoreConformidade}%
                      </div>
                      <div className="text-sm text-gray-600">Conformidade Geral</div>
                    </div>
                    
                    {/* Expandable Sections using DSGov Collapse Pattern */}
                    <div className="space-y-4">
                      <GovCollapseItem
                        variant="card"
                        title="Gráficos de Análise"
                        subtitle="Visualizações detalhadas dos resultados"
                        icon={<TrendingUp className="h-5 w-5 text-government-500" />}
                        content={<AnalysisCharts />}
                        defaultOpen={true}
                      />

                      <GovCollapseItem
                        variant="card"
                        title="Problemas Encontrados"
                        subtitle={`${analysis.problemasEncontrados.length} problemas identificados`}
                        icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
                        content={<ProblemsList problems={analysis.problemasEncontrados} />}
                        defaultOpen={true}
                      />

                      <GovCollapseItem
                        variant="card"
                        title="Recomendações"
                        subtitle="Sugestões para melhorar a conformidade"
                        icon={<Lightbulb className="h-5 w-5 text-government-500" />}
                        content={
                          <ul className="space-y-2">
                            {analysis.recomendacoes.map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm">
                                <span className="text-government-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        }
                        defaultOpen={false}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Document History with DSGov Collapse */}
          <div className="mt-8">
            <GovCollapseItem
              variant="card"
              title={t('documents.documentHistory')}
              subtitle={t('documents.historyDesc')}
              icon={<History className="h-5 w-5 text-government-500" />}
              content={
                <div className="space-y-4">
                  <p className="text-gray-500">
                    Em breve você poderá visualizar o histórico completo de documentos analisados.
                  </p>
                  {uploadedDocument && (
                    <div className="p-4 bg-government-50 border border-government-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-government-600" />
                        <div>
                          <p className="font-medium text-government-800">{uploadedDocument.nome}</p>
                          <p className="text-sm text-government-600">
                            Analisado em {formatDate(uploadedDocument.updatedAt)} • {uploadedDocument.tipo} • {formatFileSize(uploadedDocument.tamanho)}
                          </p>
                          {analysis && (
                            <p className="text-sm text-government-600 mt-1">
                              Score de Conformidade: {analysis.scoreConformidade}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              }
              defaultOpen={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}