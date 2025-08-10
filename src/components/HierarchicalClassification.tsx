import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, ClassificationNode, TipoObjeto, ModalidadePrincipal, Subtipo, TipoDocumento } from '@/types/document';
import {
  getModalidadesByTipo,
  getSubtiposByModalidade,
  getDocumentosBySubtipo,
  getClassificationBreadcrumb
} from '@/data/classification';
import { useTiposObjeto } from '@/hooks/useClassificationData';
import { useTranslation } from '@/hooks/useTranslation';

interface HierarchicalClassificationProps {
  classification?: Partial<DocumentClassification>;
  onClassificationChange: (classification: Partial<DocumentClassification>) => void;
  onValidationChange: (isValid: boolean) => void;
}

// Usamos um tipo local para o nosso estado, que armazena os objetos completos
type LocalClassificationState = {
  tipoObjeto?: ClassificationNode;
  modalidadePrincipal?: ClassificationNode;
  subtipo?: ClassificationNode;
  tipoDocumento?: ClassificationNode;
}

export function HierarchicalClassification({ 
  classification = {}, 
  onClassificationChange, 
  onValidationChange 
}: HierarchicalClassificationProps) {
  const { t } = useTranslation();
  const [currentClassification, setCurrentClassification] = useState<LocalClassificationState>({});
  
  const { data: tiposObjeto = [], isLoading: loadingTipos } = useTiposObjeto();

  // **AQUI ESTÁ A LÓGICA CORRETA**
  // Derivamos as listas passando a CHAVE (.key) do objeto guardado no estado para as funções de dados.
  const modalidades = currentClassification.tipoObjeto
    ? getModalidadesByTipo(currentClassification.tipoObjeto.key as TipoObjeto)
    : [];
    
  const subtipos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal
    ? getSubtiposByModalidade(currentClassification.tipoObjeto.key as TipoObjeto, currentClassification.modalidadePrincipal.key as ModalidadePrincipal)
    : [];

  const documentos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal && currentClassification.subtipo
    ? getDocumentosBySubtipo(currentClassification.tipoObjeto.key as TipoObjeto, currentClassification.modalidadePrincipal.key as ModalidadePrincipal, currentClassification.subtipo.key as Subtipo)
    : [];

  // Os 'handlers' encontram o objeto completo e o salvam no estado.
  const handleTipoObjetoChange = (key: string) => {
    const selected = tiposObjeto.find(item => item.key === key);
    setCurrentClassification({
      tipoObjeto: selected,
      modalidadePrincipal: undefined,
      subtipo: undefined,
      tipoDocumento: undefined,
    });
  };

  const handleModalidadeChange = (key: string) => {
    const selected = modalidades.find(item => item.key === key);
    setCurrentClassification(prev => ({ ...prev, modalidadePrincipal: selected, subtipo: undefined, tipoDocumento: undefined }));
  };

  const handleSubtipoChange = (key: string) => {
    const selected = subtipos.find(item => item.key === key);
    setCurrentClassification(prev => ({ ...prev, subtipo: selected, tipoDocumento: undefined }));
  };

  const handleDocumentoChange = (key: string) => {
    const selected = documentos.find(item => item.key === key);
    setCurrentClassification(prev => ({ ...prev, tipoDocumento: selected }));
  };
  
  // Efeitos para notificar o componente pai, enviando apenas as chaves para manter o contrato.
  useEffect(() => {
    const isValid = !!(currentClassification.tipoObjeto && currentClassification.modalidadePrincipal);
    onValidationChange(isValid);
  }, [currentClassification, onValidationChange]);

  useEffect(() => {
    const outgoing: Partial<DocumentClassification> = {
      tipoObjeto: currentClassification.tipoObjeto?.key as TipoObjeto,
      modalidadePrincipal: currentClassification.modalidadePrincipal?.key as ModalidadePrincipal,
      subtipo: currentClassification.subtipo?.key as Subtipo,
      tipoDocumento: currentClassification.tipoDocumento?.key as TipoDocumento,
    };
    onClassificationChange(outgoing);
  }, [currentClassification, onClassificationChange]);

  const breadcrumb = getClassificationBreadcrumb(
    currentClassification.tipoObjeto?.key as TipoObjeto,
    currentClassification.modalidadePrincipal?.key as ModalidadePrincipal,
    currentClassification.subtipo?.key as Subtipo,
    currentClassification.tipoDocumento?.key as TipoDocumento
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('classification.title')}</CardTitle>
        {breadcrumb.length > 0 && null}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível 1: Tipo de Objeto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoObjeto')}</label>
          <Select
            value={currentClassification.tipoObjeto?.key || ''}
            onValueChange={handleTipoObjetoChange}
            disabled={loadingTipos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTipos ? t('common.loading') : t('classification.selectTipoObjeto')} />
            </SelectTrigger>
            <SelectContent>
              {tiposObjeto.map((tipo) => (<SelectItem key={tipo.key} value={tipo.key}>{tipo.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 2: Modalidade Principal */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.modalidadePrincipal')}</label>
          <Select 
            value={currentClassification.modalidadePrincipal?.key || ''}
            onValueChange={handleModalidadeChange}
            disabled={!currentClassification.tipoObjeto || modalidades.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectModalidade')} />
            </SelectTrigger>
            <SelectContent>
              {modalidades.map((modalidade) => (<SelectItem key={modalidade.key} value={modalidade.key}>{modalidade.nome}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        
        {/* ...outros níveis... */}

      </CardContent>
    </Card>
  );
}