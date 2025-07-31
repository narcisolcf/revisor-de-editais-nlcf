import supabase from '@/lib/supabase';
import { DocumentUpload, DocumentAnalysis, DocumentClassification } from '@/types/document';

export class DocumentService {
  
  static async uploadDocument(
    file: File, 
    prefeituraId: string, 
    classification: DocumentClassification, 
    descricao?: string
  ): Promise<DocumentUpload> {
    try {
      const timestamp = Date.now();
      const fileName = `${prefeituraId}/${timestamp}_${file.name}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      const documentData = {
        prefeitura_id: prefeituraId,
        nome: file.name,
        tipo: file.type.includes('pdf') ? 'PDF' as const : 'DOCX' as const,
        classification,
        tamanho: file.size,
        url_storage: publicUrl,
        status: 'pendente' as const,
        descricao: descricao || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('documents')
        .insert([documentData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      return {
        id: data.id,
        prefeituraId: data.prefeitura_id,
        nome: data.nome,
        tipo: data.tipo,
        classification: data.classification,
        tamanho: data.tamanho,
        urlStorage: data.url_storage,
        status: data.status,
        descricao: data.descricao,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      throw new Error('Falha ao fazer upload do documento');
    }
  }

  static async getDocumentosByPrefeitura(prefeituraId: string): Promise<DocumentUpload[]> {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('prefeitura_id', prefeituraId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      return data.map(doc => ({
        id: doc.id,
        prefeituraId: doc.prefeitura_id,
        nome: doc.nome,
        tipo: doc.tipo,
        classification: doc.classification,
        tamanho: doc.tamanho,
        urlStorage: doc.url_storage,
        status: doc.status,
        descricao: doc.descricao,
        createdAt: new Date(doc.created_at),
        updatedAt: new Date(doc.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Falha ao buscar documentos');
    }
  }

  static async updateDocumentStatus(documentId: string, status: DocumentUpload['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', documentId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating document status:', error);
      throw new Error('Falha ao atualizar status do documento');
    }
  }

  static async getAnalysisById(documentId: string): Promise<DocumentAnalysis | null> {
    try {
      const { data, error } = await supabase
        .from('document_analyses')
        .select('*')
        .eq('document_id', documentId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        documentoId: data.document_id,
        classification: data.classification,
        textoExtraido: data.extracted_text,
        scoreConformidade: data.conformity_score,
        problemasEncontrados: data.problems,
        recomendacoes: data.recommendations,
        metricas: data.metrics,
        specificAnalysis: data.specific_analysis,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw new Error('Falha ao buscar análise');
    }
  }
}