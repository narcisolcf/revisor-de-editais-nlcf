import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, ClassificationNode } from '@/types/document';
import { useClassificationTree } from '@/hooks/useClassificationData';
import { useTranslation } from '@/hooks/useTranslation';

interface HierarchicalClassificationProps {
  classification?: Partial<DocumentClassification>;
  onClassificationChange: (classification: Partial<DocumentClassification>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function HierarchicalClassification({ 
  classification,
  onClassificationChange, 
  onValidationChange 
}: HierarchicalClassificationProps) {
  const { t } = useTranslation();
  const [selectedNodes, setSelectedNodes] = useState<{
    tipoObjeto?: ClassificationNode;
    modalidadePrincipal?: ClassificationNode;
    subtipo?: ClassificationNode;
    tipoDocumento?: ClassificationNode;
  }>({});
  
  const { data: classificationTree = [], isLoading: loadingTree } = useClassificationTree();

  // Estrutura hierárquica simplificada - navegar diretamente pelos filhos
  const modalidades = selectedNodes.tipoObjeto?.filhos || [];
  const subtipos = selectedNodes.modalidadePrincipal?.filhos || [];
  const documentos = selectedNodes.subtipo?.filhos || [];

  // Hidratacao inicial a partir de props.classification e dados do Firebase
  useEffect(() => {
    if (!classification || !classificationTree?.length) return;
    setSelectedNodes((prev) => {
      let next = { ...prev };
      // Nivel 1: tipoObjeto
      if (!prev.tipoObjeto && classification.tipoObjeto) {
        const tipo = classificationTree.find((n) => n.key === classification.tipoObjeto);
        if (tipo) {
          next = { tipoObjeto: tipo, modalidadePrincipal: undefined, subtipo: undefined, tipoDocumento: undefined };
        }
      }
      // Nivel 2: modalidadePrincipal
      if (!prev.modalidadePrincipal && next.tipoObjeto && classification.modalidadePrincipal) {
        const modalidade = next.tipoObjeto.filhos?.find((n) => n.key === classification.modalidadePrincipal);
        if (modalidade) {
          next = { ...next, modalidadePrincipal: modalidade, subtipo: undefined, tipoDocumento: undefined };
        }
      }
      // Nivel 3: subtipo
      if (!prev.subtipo && next.modalidadePrincipal && classification.subtipo) {
        const subtipo = next.modalidadePrincipal.filhos?.find((n) => n.key === classification.subtipo);
        if (subtipo) {
          next = { ...next, subtipo, tipoDocumento: undefined };
        }
      }
      // Nivel 4: tipoDocumento
      if (!prev.tipoDocumento && next.subtipo && classification.tipoDocumento) {
        const documento = next.subtipo.filhos?.find((n) => n.key === classification.tipoDocumento);
        if (documento) {
          next = { ...next, tipoDocumento: documento };
        }
      }
      return next;
    });
  }, [classificationTree, classification]);

  // Handlers simplificados
  const handleTipoObjetoChange = (key: string) => {
    const selected = classificationTree.find(item => item.key === key);
    setSelectedNodes({
      tipoObjeto: selected,
      modalidadePrincipal: undefined,
      subtipo: undefined,
      tipoDocumento: undefined,
    });
  };

  const handleModalidadeChange = (key: string) => {
    const selected = modalidades.find(item => item.key === key);
    setSelectedNodes(prev => ({ 
      ...prev, 
      modalidadePrincipal: selected, 
      subtipo: undefined, 
      tipoDocumento: undefined 
    }));
  };

  const handleSubtipoChange = (key: string) => {
    const selected = subtipos.find(item => item.key === key);
    setSelectedNodes(prev => ({ 
      ...prev, 
      subtipo: selected, 
      tipoDocumento: undefined 
    }));
  };

  const handleDocumentoChange = (key: string) => {
    const selected = documentos.find(item => item.key === key);
    setSelectedNodes(prev => ({ ...prev, tipoDocumento: selected }));
  };
  
  // Efeitos para notificar o componente pai
  useEffect(() => {
    const consistent = (
      (!selectedNodes.modalidadePrincipal || selectedNodes.tipoObjeto?.filhos?.some(n => n.key === selectedNodes.modalidadePrincipal?.key)) &&
      (!selectedNodes.subtipo || selectedNodes.modalidadePrincipal?.filhos?.some(n => n.key === selectedNodes.subtipo?.key)) &&
      (!selectedNodes.tipoDocumento || selectedNodes.subtipo?.filhos?.some(n => n.key === selectedNodes.tipoDocumento?.key))
    );
    const isValid = !!(selectedNodes.tipoObjeto && selectedNodes.modalidadePrincipal && consistent);
    onValidationChange(isValid);
  }, [selectedNodes, onValidationChange]);

  useEffect(() => {
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
    
    onClassificationChange(outgoing);
  }, [selectedNodes, onClassificationChange]);

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
            value={selectedNodes.tipoObjeto?.key || ''}
            onValueChange={handleTipoObjetoChange}
            disabled={loadingTree}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTree ? t('common.loading') : t('classification.selectTipoObjeto')} />
            </SelectTrigger>
            <SelectContent>
              {classificationTree.map((tipo) => (<SelectItem key={tipo.key} value={tipo.key}>{tipo.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 2: Modalidade Principal */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.modalidadePrincipal')}</label>
          <Select 
            value={selectedNodes.modalidadePrincipal?.key || ''}
            onValueChange={handleModalidadeChange}
            disabled={!selectedNodes.tipoObjeto || modalidades.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectModalidade')} />
            </SelectTrigger>
            <SelectContent>
              {modalidades.map((modalidade) => (<SelectItem key={modalidade.key} value={modalidade.key}>{modalidade.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Nível 3: Subtipo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.subtipo')}</label>
          <Select 
            value={selectedNodes.subtipo?.key || ''}
            onValueChange={handleSubtipoChange}
            disabled={!selectedNodes.modalidadePrincipal || subtipos.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectSubtipo')} />
            </SelectTrigger>
            <SelectContent>
              {subtipos.map((subtipo) => (<SelectItem key={subtipo.key} value={subtipo.key}>{subtipo.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 4: Tipo de Documento */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoDocumento')}</label>
          <Select 
            value={selectedNodes.tipoDocumento?.key || ''}
            onValueChange={handleDocumentoChange}
            disabled={!selectedNodes.subtipo || documentos.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectDocumento')} />
            </SelectTrigger>
            <SelectContent>
              {documentos.map((documento) => (<SelectItem key={documento.key} value={documento.key}>{documento.nome}</SelectItem>))}
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