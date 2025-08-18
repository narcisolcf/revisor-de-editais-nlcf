import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileText,
  BarChart3,
  Settings,
  History,
  Plus,
  RefreshCw,
  Download,
  Share
} from 'lucide-react';
import { DocumentUploader } from '@/components/upload/DocumentUploader';
// import { DocumentDashboard } from '@/components/upload/DocumentDashboard'; // TODO: Implementar
import { AnalysisResults } from '@/components/analysis/AnalysisResults';
import { AnalysisProgress } from '@/components/analysis/AnalysisProgress';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis';
import { DocumentUpload, DocumentAnalysis } from '@/types/document';

interface DocumentAnalysisPageProps {
  prefeituraId?: string;
}

export const DocumentAnalysisPage: React.FC<DocumentAnalysisPageProps> = ({
  prefeituraId = 'default-prefeitura'
}) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedDocument, setSelectedDocument] = useState<DocumentUpload | null>(null);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<DocumentAnalysis | null>(null);

  // Hooks para gerenciar upload e análise
  const {
    files,
    isUploading,
    stats: uploadStats,
    addFiles,
    removeFile,
    clearFiles
  } = useDocumentUpload({
    prefeituraId,
    onUploadSuccess: (document) => {
      console.log('Upload concluído:', document);
    }
  });

  const {
    analyses,
    currentAnalysis: analysisState,
    isLoading: isLoadingAnalysis,
    isAnalyzing,
    error: analysisError,
    startAnalysis,
    cancelAnalysis,
    loadAnalysesByPrefeitura,
    setCurrentAnalysis: setAnalysisState,
    clearError: clearAnalysisError,
    getAnalysisStats
  } = useDocumentAnalysis({ autoRefresh: true });

  // Carregar análises da prefeitura ao montar o componente
  useEffect(() => {
    if (prefeituraId) {
      loadAnalysesByPrefeitura(prefeituraId);
    }
  }, [prefeituraId, loadAnalysesByPrefeitura]);

  // Handlers para upload
  const handleUploadSuccess = async (document: DocumentUpload) => {
    console.log('Upload concluído:', document);
    
    // Mudar para a aba de documentos após upload
    setActiveTab('documents');
    
    // Iniciar análise automaticamente
    setSelectedDocument(document);
    await handleStartAnalysis(document.id);
  };

  // Handlers para análise
  const handleStartAnalysis = async (documentId: string) => {
    try {
      setShowAnalysisProgress(true);
      setActiveTab('analysis');
      await startAnalysis(documentId);
    } catch (error) {
      console.error('Erro ao iniciar análise:', error);
    }
  };

  const handleCancelAnalysis = async () => {
    if (selectedDocument) {
      await cancelAnalysis(selectedDocument.id);
      setShowAnalysisProgress(false);
    }
  };

  const handleAnalysisComplete = (analysis: DocumentAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisState(analysis);
    setShowAnalysisProgress(false);
    setActiveTab('results');
  };

  const handleDocumentSelect = (document: DocumentUpload) => {
    setSelectedDocument(document);
  };

  const handleViewAnalysis = (analysis: DocumentAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisState(analysis);
    setActiveTab('results');
  };

  // Handlers para exportação e compartilhamento
  const handleExportReport = () => {
    if (currentAnalysis) {
      // Implementar exportação de relatório
      console.log('Exportando relatório:', currentAnalysis.id);
    }
  };

  const handleShareResults = () => {
    if (currentAnalysis) {
      // Implementar compartilhamento de resultados
      console.log('Compartilhando resultados:', currentAnalysis.id);
    }
  };

  // Estatísticas
  const analysisStats = getAnalysisStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Análise de Documentos
              </h1>
              <p className="text-gray-600 mt-1">
                Upload, análise e revisão de editais e documentos licitatórios
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => loadAnalysesByPrefeitura(prefeituraId)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              
              <Button onClick={() => setActiveTab('upload')}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Análises</p>
                  <p className="text-2xl font-bold">{analysisStats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{analysisStats.completed}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Em Progresso</p>
                  <p className="text-2xl font-bold text-blue-600">{analysisStats.inProgress}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Score Médio</p>
                  <p className="text-2xl font-bold">{analysisStats.averageScore.toFixed(1)}%</p>
                </div>
                <History className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertas de Erro */}
        {uploadStats.hasErrors && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Erro no Upload:</strong> Alguns arquivos falharam no upload
            </AlertDescription>
          </Alert>
        )}
        
        {analysisError && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Erro na Análise:</strong> {analysisError}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAnalysisError}
                className="ml-2"
              >
                Fechar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Análise</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Resultados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload de Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentUploader
                  prefeituraId={prefeituraId}
                  onUploadSuccess={handleUploadSuccess}
                  maxFiles={5}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Dashboard de Documentos
                </h3>
                <p className="text-gray-600 mb-4">
                  Funcionalidade em desenvolvimento. Use a aba "Upload" para enviar documentos.
                </p>
                <Button onClick={() => setActiveTab('upload')}>
                  Fazer Upload
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            {showAnalysisProgress && selectedDocument ? (
              <AnalysisProgress
                documentId={selectedDocument.id}
                isAnalyzing={isAnalyzing}
                onCancel={handleCancelAnalysis}
                onComplete={handleAnalysisComplete}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma análise em progresso
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Selecione um documento na aba "Documentos" para iniciar uma análise.
                  </p>
                  <Button onClick={() => setActiveTab('documents')}>
                    Ver Documentos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-6">
            {currentAnalysis ? (
              <AnalysisResults
                analysis={currentAnalysis}
                onExportReport={handleExportReport}
                onShareResults={handleShareResults}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum resultado disponível
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Complete uma análise para visualizar os resultados detalhados.
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    Fazer Upload
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DocumentAnalysisPage;