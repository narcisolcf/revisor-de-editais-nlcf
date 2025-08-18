import { useState, useCallback } from 'react';
import { DocumentService, UploadProgress } from '@/services/documentService';
import { DocumentClassification, DocumentUpload } from '@/types/document';
import { useToast } from '@/components/ui/use-toast';

export interface FileUploadState {
  id: string;
  file: File;
  progress?: UploadProgress;
  uploadedDocument?: DocumentUpload;
  error?: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
}

export interface UseDocumentUploadOptions {
  prefeituraId: string;
  onUploadSuccess?: (document: DocumentUpload) => void;
  onUploadError?: (error: string, file: File) => void;
  maxConcurrentUploads?: number;
}

export const useDocumentUpload = ({
  prefeituraId,
  onUploadSuccess,
  onUploadError,
  maxConcurrentUploads = 3
}: UseDocumentUploadOptions) => {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const { toast } = useToast();

  // Adicionar arquivos à lista
  const addFiles = useCallback((newFiles: File[]) => {
    const fileStates: FileUploadState[] = newFiles.map(file => {
      const validation = DocumentService.validateFile(file);
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: validation.valid ? 'pending' : 'error',
        error: validation.valid ? undefined : validation.error
      };
    });

    setFiles(prev => [...prev, ...fileStates]);
    return fileStates;
  }, []);

  // Remover arquivo
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadQueue(prev => prev.filter(id => id !== fileId));
  }, []);

  // Limpar todos os arquivos
  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploadQueue([]);
  }, []);

  // Atualizar progresso do arquivo
  const updateFileProgress = useCallback((fileId: string, progress: UploadProgress) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, progress, status: 'uploading' }
        : f
    ));
  }, []);

  // Marcar arquivo como concluído
  const markFileCompleted = useCallback((fileId: string, document: DocumentUpload) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, uploadedDocument: document, status: 'completed', progress: undefined }
        : f
    ));
  }, []);

  // Marcar arquivo com erro
  const markFileError = useCallback((fileId: string, error: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, error, status: 'error', progress: undefined }
        : f
    ));
  }, []);

  // Upload de um arquivo específico
  const uploadSingleFile = useCallback(async (
    fileState: FileUploadState,
    classification: DocumentClassification,
    description?: string
  ) => {
    try {
      const document = await DocumentService.uploadDocument(
        fileState.file,
        prefeituraId,
        classification,
        description,
        (progress) => updateFileProgress(fileState.id, progress)
      );

      markFileCompleted(fileState.id, document);
      onUploadSuccess?.(document);
      
      toast({
        title: 'Sucesso',
        description: `${fileState.file.name} enviado com sucesso!`
      });

      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      markFileError(fileState.id, errorMessage);
      onUploadError?.(errorMessage, fileState.file);
      
      toast({
        title: 'Erro no Upload',
        description: `Falha ao enviar ${fileState.file.name}: ${errorMessage}`,
        variant: 'destructive'
      });
      
      throw error;
    }
  }, [prefeituraId, updateFileProgress, markFileCompleted, markFileError, onUploadSuccess, onUploadError, toast]);

  // Upload de múltiplos arquivos com controle de concorrência
  const uploadFiles = useCallback(async (
    classification: DocumentClassification,
    description?: string
  ) => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum arquivo pendente para upload',
        variant: 'default'
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload com controle de concorrência
      const uploadPromises: Promise<DocumentUpload>[] = [];
      const results: DocumentUpload[] = [];
      
      for (let i = 0; i < pendingFiles.length; i += maxConcurrentUploads) {
        const batch = pendingFiles.slice(i, i + maxConcurrentUploads);
        
        const batchPromises = batch.map(fileState => 
          uploadSingleFile(fileState, classification, description)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          }
        });
      }
      
      toast({
        title: 'Upload Concluído',
        description: `${results.length} de ${pendingFiles.length} arquivos enviados com sucesso`
      });
      
      return results;
    } finally {
      setIsUploading(false);
    }
  }, [files, maxConcurrentUploads, uploadSingleFile, toast]);

  // Retry upload de arquivo com erro
  const retryUpload = useCallback(async (
    fileId: string,
    classification: DocumentClassification,
    description?: string
  ) => {
    const fileState = files.find(f => f.id === fileId);
    if (!fileState) return;

    // Reset status
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', error: undefined, progress: undefined }
        : f
    ));

    return uploadSingleFile(fileState, classification, description);
  }, [files, uploadSingleFile]);

  // Estatísticas dos uploads
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    completed: files.filter(f => f.status === 'completed').length,
    errors: files.filter(f => f.status === 'error').length,
    hasErrors: files.some(f => f.status === 'error'),
    allCompleted: files.length > 0 && files.every(f => f.status === 'completed'),
    canUpload: files.some(f => f.status === 'pending')
  };

  return {
    files,
    isUploading,
    stats,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    uploadSingleFile,
    retryUpload
  };
};

export default useDocumentUpload;