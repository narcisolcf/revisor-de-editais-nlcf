import { collection, addDoc, getDocs, updateDoc, doc, getDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { DocumentUpload, DocumentAnalysis, DocumentClassification } from '@/types/document';

export class DocumentService {
  private static documentsCollection = 'documentos';
  private static analysisCollection = 'analises';

  static async uploadDocument(
    file: File, 
    prefeituraId: string, 
    classification: DocumentClassification, 
    descricao?: string
  ): Promise<DocumentUpload> {
    try {
      const timestamp = Date.now();
      const fileName = `${prefeituraId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, `documents/${fileName}`);
      
      const uploadResult = await uploadBytes(storageRef, file);
      const urlStorage = await getDownloadURL(uploadResult.ref);
      
      const documentData = {
        prefeituraId,
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'PDF' as const : 'DOCX' as const,
        classification,
        tamanho: file.size,
        urlStorage,
        status: 'pendente' as const,
        descricao: descricao || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.documentsCollection), documentData);
      
      return {
        id: docRef.id,
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Falha ao fazer upload do documento');
    }
  }

  static async getDocumentosByPrefeitura(prefeituraId: string): Promise<DocumentUpload[]> {
    try {
      const q = query(
        collection(db, this.documentsCollection),
        where('prefeituraId', '==', prefeituraId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const documents: DocumentUpload[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as DocumentUpload);
      });
      
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Falha ao buscar documentos');
    }
  }

  static async updateDocumentStatus(documentId: string, status: DocumentUpload['status']): Promise<void> {
    try {
      const docRef = doc(db, this.documentsCollection, documentId);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error('Falha ao atualizar status do documento');
    }
  }

  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const docRef = doc(db, this.analysisCollection, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt.toDate()
        } as DocumentAnalysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw new Error('Falha ao buscar análise');
    }
  }
}