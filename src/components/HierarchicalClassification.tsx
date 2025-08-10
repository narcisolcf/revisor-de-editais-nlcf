import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification } from '@/types/document';
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

export function HierarchicalClassification({ 
  classification = {}, 
  onClassificationChange, 
  onValidationChange 
}: HierarchicalClassificationProps) {
  const { t } = useTranslation();
  
  // O estado guarda apenas as chaves (strings), como foi originalmente desenhado.
  const [currentClassification, setCurrentClassification] = useState<Partial<DocumentClassification>>(classification);
  
  const { data: tiposObjeto = [], isLoading: loadingTipos } = useTiposObjeto();

  // As funções de derivação agora funcionam, pois o estado contém as chaves que elas esperam.
  const modalidades = currentClassification.tipoObjeto ? 
    getModalidadesByTipo(currentClassification.tipoObjeto) : [];
    
  const subtipos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal ? 
    getSubtiposByModalidade(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal) : [];

  const documentos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal && currentClassification.subtipo ? 
    getDocumentosBySubtipo(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal, currentClassification.subtipo) : [];

  // As funções de 'change' voltam a ser simples: apenas salvam a chave (string) no estado.
  const handleTipoObjetoChange = (value: string) => {
    setCurrentClassification({
      tipoObjeto: value,
      modalidadePrincipal: undefined,
      subtipo: undefined,
      tipoDocumento: undefined,
    });
  };

  const handleModalidadeChange = (value: string) => {
    setCurrentClassification(prev => ({ ...prev, modalidadePrincipal: value, subtipo: undefined, tipoDocumento: undefined }));
  };

  const handleSubtipoChange = (value: string) => {
    setCurrentClassification(prev => ({ ...prev, subtipo: value, tipoDocumento: undefined }));
  };

  const handleDocumentoChange = (value: string) => {
    setCurrentClassification(prev => ({ ...prev, tipoDocumento: value }));
  };
  
  // Efeitos para notificar o componente pai
  useEffect(() => {
    const isValid = !!(currentClassification.tipoObjeto && currentClassification.modalidadePrincipal);
    onValidationChange(isValid);
  }, [currentClassification, onValidationChange]);

  useEffect(() => {
    onClassificationChange(currentClassification);
  }, [currentClassification, onClassificationChange]);

  const breadcrumb = getClassificationBreadcrumb(
    currentClassification.tipoObjeto,
    currentClassification.modalidadePrincipal,
    currentClassification.subtipo,
    currentClassification.tipoDocumento
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('classification.title')}</CardTitle>
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <span>{item}</span>
                {index < breadcrumb.length - 1 && <ChevronRight className="h-4 w-4" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível 1: Tipo de Objeto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoObjeto')}</label>
          <Select
            value={currentClassification.tipoObjeto || ''}
            onValueChange={handleTipoObjetoChange}
            disabled={loadingTipos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTipos ? t('common.loading') : t('classification.selectTipoObjeto')} />
            </SelectTrigger>
            <SelectContent>
              {tiposObjeto.map((tipo) => (
                <SelectItem key={tipo.key} value={tipo.key}>
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
            value={currentClassification.modalidadePrincipal || ''}
            onValueChange={handleModalidadeChange}
            disabled={!currentClassification.tipoObjeto || modalidades.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectModalidade')} />
            </SelectTrigger>
            <SelectContent>
              {modalidades.map((modalidade) => (
                <SelectItem key={modalidade.key} value={modalidade.key}>
                  {modalidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Adicione os outros níveis (Subtipo, Documento) aqui se necessário, seguindo o mesmo padrão */}

      </CardContent>
    </Card>
  );
}