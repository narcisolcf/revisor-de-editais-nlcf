import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { DocumentUpload, DocumentAnalysis, Prefeitura, DocumentType } from '@/types/document';

export class DocumentService {
  // Upload de documento
  static async uploadDocument(
    file: File, 
    prefeituraId: string, 
    documentType: DocumentType,
    descricao?: string
  ): Promise<DocumentUpload> {
    try {
      // Upload do arquivo para Storage
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `documentos/${prefeituraId}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Salvar metadados no Firestore
      const documentData = {
        prefeituraId,
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'PDF' as const : 'DOCX' as const,
        documentType,
        tamanho: file.size,
        urlStorage: downloadURL,
        status: 'pendente' as const,
        descricao,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'documentos'), documentData);
      
      return {
        id: docRef.id,
        ...documentData
      };
    } catch (error) {
      console.error('Erro ao fazer upload do documento:', error);
      throw new Error('Falha no upload do documento');
    }
  }

  // Buscar documentos de uma prefeitura
  static async getDocumentosByPrefeitura(prefeituraId: string): Promise<DocumentUpload[]> {
    try {
      const q = query(
        collection(db, 'documentos'),
        where('prefeituraId', '==', prefeituraId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as DocumentUpload));
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      throw new Error('Falha ao buscar documentos');
    }
  }

  // Atualizar status do documento
  static async updateDocumentStatus(
    documentId: string, 
    status: DocumentUpload['status']
  ): Promise<void> {
    try {
      const docRef = doc(db, 'documentos', documentId);
      await updateDoc(docRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw new Error('Falha ao atualizar status do documento');
    }
  }

  // Buscar análise de um documento
  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const q = query(
        collection(db, 'analises'),
        where('documentoId', '==', documentId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as DocumentAnalysis;
    } catch (error) {
      console.error('Erro ao buscar análise:', error);
      return null;
    }
  }
}