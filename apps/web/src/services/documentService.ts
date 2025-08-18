import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, getDocs, doc, updateDoc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { DocumentUpload, DocumentAnalysis, DocumentClassification } from '@/types/document';

export interface UploadProgress {
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  percentage: number;
  message: string;
  bytesTransferred?: number;
  totalBytes?: number;
}

export class DocumentService {
  
  /**
   * Upload de documento com progresso em tempo real
   */
  static async uploadDocument(
    file: File, 
    prefeituraId: string, 
    classification: DocumentClassification, 
    descricao?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUpload> {
    try {
      const timestamp = Date.now();
      const fileName = `documents/${prefeituraId}/${timestamp}_${file.name}`;
      
      // Criar referência no Firebase Storage
      const storageRef = ref(storage, fileName);
      
      // Configurar upload com progresso
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            // Progresso do upload
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.({
              stage: 'uploading',
              percentage: Math.round(progress),
              message: `Enviando arquivo... ${Math.round(progress)}%`,
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes
            });
          },
          (error) => {
            console.error('Erro no upload:', error);
            onProgress?.({
              stage: 'error',
              percentage: 0,
              message: 'Erro no upload do arquivo'
            });
            reject(new Error('Falha ao fazer upload do documento'));
          },
          async () => {
            try {
              // Upload concluído, obter URL de download
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              onProgress?.({
                stage: 'processing',
                percentage: 100,
                message: 'Processando documento...'
              });
              
              // Salvar metadados no Firestore
              const documentData = {
                prefeitura_id: prefeituraId,
                nome: file.name,
                tipo: file.type.includes('pdf') ? 'PDF' as const : 'DOCX' as const,
                classification,
                tamanho: file.size,
                url_storage: downloadURL,
                storage_path: fileName,
                status: 'pendente' as const,
                descricao: descricao || '',
                created_at: new Date(),
                updated_at: new Date()
              };
              
              const docRef = await addDoc(collection(db, 'documents'), documentData);
              
              onProgress?.({
                stage: 'complete',
                percentage: 100,
                message: 'Upload concluído com sucesso!'
              });
              
              resolve({
                id: docRef.id,
                prefeituraId: documentData.prefeitura_id,
                nome: documentData.nome,
                tipo: documentData.tipo,
                classification: documentData.classification,
                tamanho: documentData.tamanho,
                urlStorage: documentData.url_storage,
                status: documentData.status,
                descricao: documentData.descricao,
                createdAt: documentData.created_at,
                updatedAt: documentData.updated_at
              });
            } catch (error) {
              console.error('Erro ao salvar metadados:', error);
              onProgress?.({
                stage: 'error',
                percentage: 0,
                message: 'Erro ao processar documento'
              });
              reject(new Error('Falha ao processar documento'));
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Falha ao fazer upload do documento');
    }
  }

  /**
   * Buscar documentos por prefeitura
   */
  static async getDocumentosByPrefeitura(prefeituraId: string): Promise<DocumentUpload[]> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('prefeitura_id', '==', prefeituraId),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          prefeituraId: data.prefeitura_id,
          nome: data.nome,
          tipo: data.tipo,
          classification: data.classification,
          tamanho: data.tamanho,
          urlStorage: data.url_storage,
          status: data.status,
          descricao: data.descricao,
          createdAt: data.created_at.toDate(),
          updatedAt: data.updated_at.toDate()
        };
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Falha ao buscar documentos');
    }
  }

  /**
   * Atualizar status do documento
   */
  static async updateDocumentStatus(documentId: string, status: DocumentUpload['status']): Promise<void> {
    try {
      const docRef = doc(db, 'documents', documentId);
      await updateDoc(docRef, { 
        status, 
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error('Falha ao atualizar status do documento');
    }
  }

  /**
   * Buscar análise por ID do documento
   */
  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const q = query(
        collection(db, 'document_analyses'),
        where('documento_id', '==', documentId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const data = querySnapshot.docs[0].data();
      
      return {
        id: querySnapshot.docs[0].id,
        documentoId: data.documento_id,
        classification: data.classification,
        textoExtraido: data.extracted_text,
        scoreConformidade: data.conformity_score,
        problemasEncontrados: data.problems,
        recomendacoes: data.recommendations,
        metricas: data.metrics,
        specificAnalysis: data.specific_analysis,
        createdAt: data.created_at.toDate()
      };
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw new Error('Falha ao buscar análise');
    }
  }

  /**
   * Deletar documento (arquivo e metadados)
   */
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      // Buscar documento para obter o caminho do storage
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Documento não encontrado');
      }
      
      const data = docSnap.data();
      
      // Deletar arquivo do storage
      if (data.storage_path) {
        const fileRef = ref(storage, data.storage_path);
        await deleteObject(fileRef);
      }
      
      // Deletar metadados do Firestore
      await updateDoc(docRef, {
        status: 'deletado',
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Falha ao deletar documento');
    }
  }

  /**
   * Obter documento por ID
   */
  static async getDocumentById(documentId: string): Promise<DocumentUpload | null> {
    try {
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      
      return {
        id: docSnap.id,
        prefeituraId: data.prefeitura_id,
        nome: data.nome,
        tipo: data.tipo,
        classification: data.classification,
        tamanho: data.tamanho,
        urlStorage: data.url_storage,
        status: data.status,
        descricao: data.descricao,
        createdAt: data.created_at.toDate(),
        updatedAt: data.updated_at.toDate()
      };
    } catch (error) {
      console.error('Error fetching document:', error);
      throw new Error('Falha ao buscar documento');
    }
  }

  /**
   * Validar arquivo antes do upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      return { valid: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não suportado. Use PDF ou DOCX' };
    }
    
    return { valid: true };
  }

  /**
   * Obter estatísticas de documentos
   */
  static async getDocumentStats(prefeituraId: string): Promise<{
    total: number;
    pendentes: number;
    processando: number;
    concluidos: number;
    erros: number;
  }> {
    try {
      const q = query(
        collection(db, 'documents'),
        where('prefeitura_id', '==', prefeituraId)
      );
      
      const querySnapshot = await getDocs(q);
      
      const stats = {
        total: 0,
        pendentes: 0,
        processando: 0,
        concluidos: 0,
        erros: 0
      };
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        stats.total++;
        
        switch (data.status) {
          case 'pendente':
            stats.pendentes++;
            break;
          case 'processando':
            stats.processando++;
            break;
          case 'concluido':
            stats.concluidos++;
            break;
          case 'erro':
            stats.erros++;
            break;
        }
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching document stats:', error);
      throw new Error('Falha ao buscar estatísticas');
    }
  }
}