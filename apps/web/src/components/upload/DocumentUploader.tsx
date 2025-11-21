import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Trash2,
  Brain,
  Zap
} from 'lucide-react';
import { DocumentService, UploadProgress } from '@/services/documentService';
import { DocumentClassification, DocumentUpload } from '@/types/document';
import { HierarchicalClassification } from '@/components/HierarchicalClassification';
import { useSmartClassification } from '@/hooks/useSmartClassification';
import { useToast } from '@/components/ui/use-toast';
import { safeOpen } from '@/lib/browser-utils';

interface DocumentUploaderProps {
  prefeituraId: string;
  onUploadSuccess?: (document: DocumentUpload) => void;
  onClose?: () => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  uploadProgress?: UploadProgress;
  uploadedDocument?: DocumentUpload;
  error?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  prefeituraId,
  onUploadSuccess,
  onClose,
  maxFiles = 5,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [classification, setClassification] = useState<DocumentClassification | null>(null);
  const [description, setDescription] = useState('');
  const [autoClassifyEnabled, setAutoClassifyEnabled] = useState(true);
  
  // Hook para classificação automática
  const { 
    classifyDocument, 
    isClassifying, 
    result: classificationResult, 
    error: classificationError,
    autoApplied,
    clearClassification,
    getConfidenceText,
    getConfidenceColor,
    isHighConfidence
  } = useSmartClassification();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuração do dropzone
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Processar arquivos rejeitados
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      setUploadErrors(errors);
    }

    // Processar arquivos aceitos
    const newFiles: FileWithPreview[] = acceptedFiles.map(file => {
      const validation = DocumentService.validateFile(file);
      
      return {
        ...file,
        id: Math.random().toString(36).substr(2, 9),
        preview: file.type === 'application/pdf' ? undefined : URL.createObjectURL(file),
        error: validation.valid ? undefined : validation.error
      };
    });

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, maxFiles);
    });

    // Classificação automática para o primeiro arquivo válido
    if (autoClassifyEnabled && acceptedFiles.length > 0) {
      const firstValidFile = acceptedFiles.find(file => 
        DocumentService.validateFile(file).valid
      );
      
      if (firstValidFile) {
        // Extrair texto do arquivo para classificação
        // Classificação automática baseada no nome do arquivo
        const fileName = firstValidFile.name.toLowerCase();
        let tipoDocumento = 'edital'; // padrão
        
        if (fileName.includes('termo') && fileName.includes('referencia')) {
          tipoDocumento = 'tr';
        } else if (fileName.includes('contrato')) {
          tipoDocumento = 'minuta_contrato';
        } else if (fileName.includes('ata')) {
          tipoDocumento = 'etp';
        } else if (fileName.includes('proposta')) {
          tipoDocumento = 'projeto_basico';
        }
        
        setClassification({
            tipoObjeto: 'aquisicao',
            modalidadePrincipal: 'processo_licitatorio',
            subtipo: 'processo_licitatorio',
            tipoDocumento: tipoDocumento as any
          });
      }
    }
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles,
    multiple: true
  });

  // Remover arquivo
  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      // Limpar preview URLs
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return updated;
    });
  };

  // Upload de arquivos
  const handleUpload = async () => {
    if (!classification) {
      toast({
        title: 'Erro',
        description: 'Selecione a classificação do documento',
        variant: 'destructive'
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um arquivo',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploadErrors([]);

    try {
      // Upload sequencial dos arquivos
      for (const file of files) {
        if (file.error || file.uploadedDocument) continue;

        try {
          const uploadedDoc = await DocumentService.uploadDocument(
            file,
            prefeituraId,
            classification,
            description,
            (progress) => {
              setFiles(prev => prev.map(f => 
                f.id === file.id 
                  ? { ...f, uploadProgress: progress }
                  : f
              ));
            }
          );

          // Marcar arquivo como enviado
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, uploadedDocument: uploadedDoc, uploadProgress: undefined }
              : f
          ));

          onUploadSuccess?.(uploadedDoc);

          toast({
            title: 'Sucesso',
            description: `${file.name} enviado com sucesso!`
          });
        } catch (error) {
          console.error('Erro no upload:', error);
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, error: 'Erro no upload', uploadProgress: undefined }
              : f
          ));
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Preview do arquivo
  const previewFile = (file: FileWithPreview) => {
    if (file.uploadedDocument?.urlStorage) {
      safeOpen(file.uploadedDocument.urlStorage, '_blank');
    } else if (file.preview) {
      safeOpen(file.preview, '_blank');
    }
  };

  // Download do arquivo
  const downloadFile = (file: FileWithPreview) => {
    if (file.uploadedDocument?.urlStorage) {
      const link = document.createElement('a');
      link.href = file.uploadedDocument.urlStorage;
      link.download = file.name;
      link.click();
    }
  };

  // Limpar todos os arquivos
  const clearAllFiles = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadErrors([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Upload de Documentos</h2>
          <p className="text-gray-600">Envie documentos para análise automática</p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Configuração da Classificação Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Classificação Automática com IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Detectar tipo automaticamente</span>
            </div>
            <Button
              variant={autoClassifyEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoClassifyEnabled(!autoClassifyEnabled)}
            >
              {autoClassifyEnabled ? 'Ativado' : 'Desativado'}
            </Button>
          </div>

          {/* Resultados da Classificação */}
          {classificationResult && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="font-medium text-sm">Tipo detectado:</span>
                <Badge variant="secondary">{classificationResult.documentType}</Badge>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">Confiança:</span>
                <Badge 
                  variant={isHighConfidence(classificationResult.confidence) ? "default" : "outline"}
                  className={getConfidenceColor(classificationResult.confidence)}
                >
                  {getConfidenceText(classificationResult.confidence)}
                </Badge>
                <span className="text-xs text-gray-500">
                  ({(classificationResult.confidence * 100).toFixed(1)}%)
                </span>
              </div>
              {classificationResult.alternatives && classificationResult.alternatives.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span>Alternativas: </span>
                  {classificationResult.alternatives.slice(0, 2).map((alt, idx) => (
                    <Badge key={idx} variant="outline" className="mr-1">
                      {alt.type} ({(alt.confidence * 100).toFixed(0)}%)
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Erro na Classificação */}
          {classificationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-700">
                Erro na classificação automática: {classificationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Indicador de Processamento */}
          {isClassifying && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Analisando documento...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Classificação */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação do Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <HierarchicalClassification
            classification={classification || undefined}
            onClassificationChange={(newClassification) => {
              if (newClassification.tipoObjeto && newClassification.modalidadePrincipal && 
                  newClassification.subtipo && newClassification.tipoDocumento) {
                setClassification(newClassification as DocumentClassification);
              }
            }}
            onValidationChange={(isValid) => {
              // Callback para validação se necessário
            }}
          />
        </CardContent>
      </Card>

      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Arquivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive 
                ? 'Solte os arquivos aqui...' 
                : 'Arraste arquivos ou clique para selecionar'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              Suporta PDF e DOCX até 10MB cada • Máximo {maxFiles} arquivos
            </p>
            <Button variant="outline" type="button">
              Selecionar Arquivos
            </Button>
          </div>

          {/* Descrição */}
          <div className="mt-4">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Adicione uma descrição para os documentos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Arquivos Selecionados ({files.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={clearAllFiles}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Todos
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium truncate">{file.name}</p>
                      <Badge variant="outline">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                      
                      {/* Status badges */}
                      {file.uploadedDocument && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Enviado
                        </Badge>
                      )}
                      {file.error && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Erro
                        </Badge>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {file.uploadProgress && (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>{file.uploadProgress.message}</span>
                          <span>{file.uploadProgress.percentage}%</span>
                        </div>
                        <Progress value={file.uploadProgress.percentage} className="h-2" />
                      </div>
                    )}
                    
                    {/* Error message */}
                    {file.error && (
                      <p className="text-sm text-red-600 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {(file.preview || file.uploadedDocument) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => previewFile(file)}
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {file.uploadedDocument && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadFile(file)}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      title="Remover"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erros de Upload */}
      {uploadErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {uploadErrors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0 || !classification}
          className="min-w-[120px]"
        >
          {isUploading ? 'Enviando...' : `Enviar ${files.length} arquivo${files.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
};

export default DocumentUploader;