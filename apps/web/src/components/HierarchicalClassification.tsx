import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, ClassificationNode } from '@/types/document';
import { useClassificationTree } from '@/hooks/useClassificationData';
import { useTranslation } from '@/hooks/useTranslation';

// Componente gerencia estado interno - interface removida

export function HierarchicalClassification() {
  const { t } = useTranslation();
  const [selectedNodes, setSelectedNodes] = useState<{
    tipoObjeto?: ClassificationNode;
    modalidadePrincipal?: ClassificationNode;
    subtipo?: ClassificationNode;
    tipoDocumento?: ClassificationNode;
  }>({});
  
  const { data: classificationTree = [], isLoading: loadingTree, error } = useClassificationTree();

  // Debug logging (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 HierarchicalClassification state:', {
        loadingTree,
        hasError: !!error,
        treeLength: classificationTree.length,
        selectedNodes: Object.keys(selectedNodes).reduce((acc, key) => {
          acc[key] = selectedNodes[key as keyof typeof selectedNodes]?.nome || 'none';
          return acc;
        }, {} as Record<string, string>)
      });
    }
  }, [classificationTree, loadingTree, error, selectedNodes]);

  // Estrutura hierárquica simplificada - navegar diretamente pelos filhos
  const modalidades = selectedNodes.tipoObjeto?.filhos || [];
  const subtipos = selectedNodes.modalidadePrincipal?.filhos || [];
  const documentos = selectedNodes.subtipo?.filhos || [];

  // Inicialização básica quando os dados do Firebase estão disponíveis
  useEffect(() => {
    // Componente aguarda interação do usuário para seleção
  }, [classificationTree]);

  // Handlers simplificados com debounce e guards robustos
  const handleTipoObjetoChange = (key: string) => {
    if (!key || !classificationTree.length || loadingTree) return;
    
    // Aguardar próximo tick para garantir que DOM está estável
    setTimeout(() => {
      const selected = classificationTree.find(item => item.key === key);
      if (!selected) {
        console.warn(`TipoObjeto not found for key: ${key}`);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log('Selected tipoObjeto:', { key, nome: selected.nome, filhosCount: selected.filhos.length });
      }
      
      setSelectedNodes({
        tipoObjeto: selected,
        modalidadePrincipal: undefined,
        subtipo: undefined,
        tipoDocumento: undefined,
      });
    }, 0);
  };

  const handleModalidadeChange = (key: string) => {
    if (!key || !modalidades.length || !selectedNodes.tipoObjeto) return;
    
    setTimeout(() => {
      const selected = modalidades.find(item => item.key === key);
      if (!selected) {
        console.warn(`Modalidade not found for key: ${key}`);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log('Selected modalidade:', { key, nome: selected.nome, filhosCount: selected.filhos.length });
      }
      
      setSelectedNodes(prev => ({ 
        ...prev, 
        modalidadePrincipal: selected, 
        subtipo: undefined, 
        tipoDocumento: undefined 
      }));
    }, 0);
  };

  const handleSubtipoChange = (key: string) => {
    if (!key || !subtipos.length || !selectedNodes.modalidadePrincipal) return;
    
    setTimeout(() => {
      const selected = subtipos.find(item => item.key === key);
      if (!selected) {
        console.warn(`Subtipo not found for key: ${key}`);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log('Selected subtipo:', { key, nome: selected.nome, filhosCount: selected.filhos.length });
      }
      
      setSelectedNodes(prev => ({ 
        ...prev, 
        subtipo: selected, 
        tipoDocumento: undefined 
      }));
    }, 0);
  };

  const handleDocumentoChange = (key: string) => {
    if (!key || !documentos.length || !selectedNodes.subtipo) return;
    
    setTimeout(() => {
      const selected = documentos.find(item => item.key === key);
      if (!selected) {
        console.warn(`Documento not found for key: ${key}`);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log('Selected documento:', { key, nome: selected.nome });
      }
      
      setSelectedNodes(prev => ({ ...prev, tipoDocumento: selected }));
    }, 0);
  };
  
  // Validacao interna removida - não é utilizada

  // Callback de classificação removido - componente gerencia estado interno
  useEffect(() => {
    // Log interno para debug (desenvolvimento)
    if (import.meta.env.DEV) {
      const outgoing: Partial<DocumentClassification> = {};
      
      if (selectedNodes.tipoObjeto?.key) {
        outgoing.tipoObjeto = selectedNodes.tipoObjeto.key as DocumentClassification['tipoObjeto'];
      }
      if (selectedNodes.modalidadePrincipal?.key) {
        outgoing.modalidadePrincipal = selectedNodes.modalidadePrincipal.key as DocumentClassification['modalidadePrincipal'];
      }
      if (selectedNodes.subtipo?.key) {
        outgoing.subtipo = selectedNodes.subtipo.key as DocumentClassification['subtipo'];
      }
      if (selectedNodes.tipoDocumento?.key) {
        outgoing.tipoDocumento = selectedNodes.tipoDocumento.key as DocumentClassification['tipoDocumento'];
      }
      
      console.log('🏷️ Classification updated:', outgoing);
    }
  }, [selectedNodes]);

  // Criar breadcrumb diretamente dos nós selecionados
  const breadcrumb = [
    selectedNodes.tipoObjeto?.nome,
    selectedNodes.modalidadePrincipal?.nome,
    selectedNodes.subtipo?.nome,
    selectedNodes.tipoDocumento?.nome
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('classification.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível 1: Tipo de Objeto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoObjeto')}</label>
          <Select
            key={`tipo-${classificationTree.length}`}
            value={selectedNodes.tipoObjeto?.key || ''}
            onValueChange={handleTipoObjetoChange}
            disabled={loadingTree || classificationTree.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTree ? t('common.loading') : t('classification.selectTipoObjeto')} />
            </SelectTrigger>
            <SelectContent>
              {classificationTree.map((tipo) => (
                <SelectItem key={`tipo-item-${tipo.key}`} value={tipo.key}>
                  {tipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 2: Modalidade Principal */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.modalidadePrincipal')}</label>
          <Select 
            key={`modalidade-${selectedNodes.tipoObjeto?.key || 'none'}-${modalidades.length}`}
            value={selectedNodes.modalidadePrincipal?.key || ''}
            onValueChange={handleModalidadeChange}
            disabled={!selectedNodes.tipoObjeto || modalidades.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectModalidade')} />
            </SelectTrigger>
            <SelectContent>
              {modalidades.map((modalidade) => (
                <SelectItem key={`modalidade-item-${modalidade.key}`} value={modalidade.key}>
                  {modalidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Nível 3: Subtipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.subtipo')}</label>
          <Select 
            key={`subtipo-${selectedNodes.modalidadePrincipal?.key || 'none'}-${subtipos.length}`}
            value={selectedNodes.subtipo?.key || ''}
            onValueChange={handleSubtipoChange}
            disabled={!selectedNodes.modalidadePrincipal || subtipos.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectSubtipo')} />
            </SelectTrigger>
            <SelectContent>
              {subtipos.map((subtipo) => (
                <SelectItem key={`subtipo-item-${subtipo.key}`} value={subtipo.key}>
                  {subtipo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 4: Tipo de Documento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoDocumento')}</label>
          <Select 
            key={`documento-${selectedNodes.subtipo?.key || 'none'}-${documentos.length}`}
            value={selectedNodes.tipoDocumento?.key || ''}
            onValueChange={handleDocumentoChange}
            disabled={!selectedNodes.subtipo || documentos.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectDocumento')} />
            </SelectTrigger>
            <SelectContent>
              {documentos.map((documento) => (
                <SelectItem key={`documento-item-${documento.key}`} value={documento.key}>
                  {documento.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-4 p-3 bg-muted/50 rounded-lg">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <span>{item}</span>
                {index < breadcrumb.length - 1 && <ChevronRight className="w-4 h-4" />}
              </React.Fragment>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}