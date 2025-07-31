import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDate, formatFileSize } from "@/utils/formatters";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Upload, FileText, CheckCircle, AlertTriangle, Clock, FileCheck } from "lucide-react";
import { DocumentService } from "@/services/documentService";
import { DocumentUpload, DocumentAnalysis, DocumentClassification, DocumentSpecificFields } from "@/types/document";
import { HierarchicalClassification } from "@/components/HierarchicalClassification";

// Mock licitação analysis data
const mockAnalysisResults = {
  conformidade: [
    { name: "Conforme", value: 75, color: "#22C55E" },
    { name: "Atenção", value: 15, color: "#F59E0B" },
    { name: "Não Conforme", value: 10, color: "#EF4444" }
  ],
  problemas: [
    { categoria: "Prazos", quantidade: 3, gravidade: "alta", color: "#EF4444" },
    { categoria: "Cláusulas", quantidade: 5, gravidade: "media", color: "#F59E0B" },
    { categoria: "Critérios", quantidade: 2, gravidade: "baixa", color: "#22C55E" },
    { categoria: "Documentação", quantidade: 1, gravidade: "critica", color: "#DC2626" }
  ],
  scoreGeral: 78,
  recomendacoes: [
    "Revisar prazos de entrega especificados no edital",
    "Incluir cláusula sobre garantia dos produtos",
    "Detalhar critérios de julgamento técnico",
    "Verificar documentação de habilitação exigida"
  ]
};

export default function DocumentReview() {
  const [uploadedDocument, setUploadedDocument] = useState<DocumentUpload | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [classification, setClassification] = useState<Partial<DocumentClassification>>({});
  const [isClassificationValid, setIsClassificationValid] = useState(false);
  const [specificFields, setSpecificFields] = useState<DocumentSpecificFields>({});
  const { toast } = useToast();
  const { t } = useTranslation();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Validation
    if (!isClassificationValid) {
      toast({
        title: t('upload.error'),
        description: t('upload.completeClassification'),
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
    if (!uploadedDocument) return;
    
    setAnalyzing(true);
    
    try {
      // Simular análise (em produção chamaria API do Firebase Functions)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockAnalysis: DocumentAnalysis = {
        id: 'analysis_' + Date.now(),
        documentoId: uploadedDocument.id,
        classification: uploadedDocument.classification,
        textoExtraido: 'Texto extraído do documento...',
        scoreConformidade: mockAnalysisResults.scoreGeral,
        specificAnalysis: {},
        problemasEncontrados: [
          {
            tipo: 'prazo_inadequado',
            descricao: 'Prazo de entrega muito curto para o tipo de produto',
            gravidade: 'alta',
            localizacao: 'Cláusula 5.2',
            sugestaoCorrecao: 'Aumentar prazo para 30 dias'
          },
          {
            tipo: 'clausula_faltante',
            descricao: 'Falta especificação de garantia mínima',
            gravidade: 'media',
            localizacao: 'Seção de especificações técnicas'
          }
        ],
        recomendacoes: mockAnalysisResults.recomendacoes,
        metricas: {
          totalClauses: 45,
          validClauses: 35,
          missingClauses: 5,
          inconsistencies: 5,
          processingTime: 2.5
        },
        createdAt: new Date()
      };
      
      setAnalysis(mockAnalysis);
      
      toast({
        title: t('common.success'),
        description: t('documents.analysisComplete'),
      });
    } catch (error) {
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
          <HierarchicalClassification
            classification={classification}
            onClassificationChange={setClassification}
            onValidationChange={setIsClassificationValid}
          />

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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Conformidade Chart */}
                      <div>
                        <h4 className="font-semibold mb-2">Distribuição de Conformidade</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={mockAnalysisResults.conformidade}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}%`}
                              >
                                {mockAnalysisResults.conformidade.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Problems Chart */}
                      <div>
                        <h4 className="font-semibold mb-2">Problemas por Categoria</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockAnalysisResults.problemas}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="categoria" />
                              <YAxis />
                              <Tooltip />
                              <Bar dataKey="quantidade" fill="#8884d8">
                                {mockAnalysisResults.problemas.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Problems Found */}
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        Problemas Encontrados
                      </h4>
                      <div className="space-y-2">
                        {analysis.problemasEncontrados.map((problema, index) => (
                          <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                problema.gravidade === 'critica' ? 'bg-red-600 text-white' :
                                problema.gravidade === 'alta' ? 'bg-red-500 text-white' :
                                problema.gravidade === 'media' ? 'bg-orange-500 text-white' :
                                'bg-yellow-500 text-white'
                              }`}>
                                {problema.gravidade}
                              </span>
                              <div>
                                <p className="font-medium text-red-800">{problema.descricao}</p>
                                {problema.localizacao && (
                                  <p className="text-sm text-red-600">Local: {problema.localizacao}</p>
                                )}
                                {problema.sugestaoCorrecao && (
                                  <p className="text-sm text-green-700 mt-1">💡 {problema.sugestaoCorrecao}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-semibold mb-2">Recomendações</h4>
                      <ul className="space-y-1">
                        {analysis.recomendacoes.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-government-500 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Document History */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 {t('documents.documentHistory')}
              </CardTitle>
              <CardDescription>
                {t('documents.historyDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Em breve você poderá visualizar o histórico completo de documentos analisados.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}