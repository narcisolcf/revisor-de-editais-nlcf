import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, TipoObjeto, ModalidadePrincipal, Subtipo, TipoDocumento } from '@/types/document';
import { 
  getTiposObjeto, 
  getModalidadesByTipo, 
  getSubtiposByModalidade, 
  getDocumentosBySubtipo,
  getClassificationBreadcrumb
} from '@/data/classification';
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
  const [currentClassification, setCurrentClassification] = useState<Partial<DocumentClassification>>(classification);

  const tiposObjeto = getTiposObjeto();
  const modalidades = currentClassification.tipoObjeto ? 
    getModalidadesByTipo(currentClassification.tipoObjeto) : [];
  const subtipos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal ? 
    getSubtiposByModalidade(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal) : [];
  const documentos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal && currentClassification.subtipo ? 
    getDocumentosBySubtipo(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal, currentClassification.subtipo) : [];

  // Validação mais inteligente: verifica se o caminho é válido baseado na estrutura disponível
  const isComplete = () => {
    if (!currentClassification.tipoObjeto || !currentClassification.modalidadePrincipal) {
      return false;
    }
    
    // Se não há subtipo selecionado, verifica se há subtipos disponíveis
    if (!currentClassification.subtipo) {
      return subtipos.length === 0; // Se não há subtipos, está completo no nível 2
    }
    
    // Se há subtipo mas não há documento, verifica se há documentos disponíveis
    if (!currentClassification.tipoDocumento) {
      return documentos.length === 0; // Se não há documentos, está completo no nível 3
    }
    
    // Se chegou aqui, tem todos os 4 níveis
    return true;
  };

  const isValid = isComplete();

  useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  useEffect(() => {
    onClassificationChange(currentClassification);
  }, [currentClassification, onClassificationChange]);

  const handleTipoObjetoChange = (value: TipoObjeto) => {
    setCurrentClassification({
      tipoObjeto: value,
      modalidadePrincipal: undefined,
      subtipo: undefined,
      tipoDocumento: undefined
    });
  };

  const handleModalidadeChange = (value: ModalidadePrincipal) => {
    setCurrentClassification(prev => ({
      ...prev,
      modalidadePrincipal: value,
      subtipo: undefined,
      tipoDocumento: undefined
    }));
  };

  const handleSubtipoChange = (value: Subtipo) => {
    setCurrentClassification(prev => ({
      ...prev,
      subtipo: value,
      tipoDocumento: undefined
    }));
  };

  const handleDocumentoChange = (value: TipoDocumento) => {
    setCurrentClassification(prev => ({
      ...prev,
      tipoDocumento: value
    }));
  };

  const breadcrumb = getClassificationBreadcrumb(
    currentClassification.tipoObjeto,
    currentClassification.modalidadePrincipal,
    currentClassification.subtipo,
    currentClassification.tipoDocumento
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('classification.title')}
          {isValid && <Badge variant="secondary">{t('classification.complete')}</Badge>}
        </CardTitle>
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
          <Select value={currentClassification.tipoObjeto || ''} onValueChange={handleTipoObjetoChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectTipoObjeto')} />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
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
            disabled={!currentClassification.tipoObjeto}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('classification.selectModalidade')} />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {modalidades.map((modalidade) => (
                <SelectItem key={modalidade.key} value={modalidade.key}>
                  {modalidade.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nível 3: Subtipo */}
        {subtipos.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('classification.subtipo')}</label>
            <Select 
              value={currentClassification.subtipo || ''} 
              onValueChange={handleSubtipoChange}
              disabled={!currentClassification.modalidadePrincipal}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('classification.selectSubtipo')} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {subtipos.map((subtipo) => (
                  <SelectItem key={subtipo.key} value={subtipo.key}>
                    {subtipo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Nível 4: Tipo de Documento */}
        {documentos.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('classification.tipoDocumento')}</label>
            <Select 
              value={currentClassification.tipoDocumento || ''} 
              onValueChange={handleDocumentoChange}
              disabled={!currentClassification.subtipo}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('classification.selectDocumento')} />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {documentos.map((documento) => (
                  <SelectItem key={documento.key} value={documento.key}>
                    {documento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}