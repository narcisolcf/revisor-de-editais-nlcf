import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, TipoObjeto, ModalidadePrincipal, Subtipo, TipoDocumento, ClassificationNode } from '@/types/document';
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
  type LocalClassification = {
    tipoObjeto?: ClassificationNode;
    modalidadePrincipal?: ClassificationNode;
    subtipo?: ClassificationNode;
    tipoDocumento?: ClassificationNode;
  };

  const [currentClassification, setCurrentClassification] = useState<LocalClassification>({});
  const [openTipo, setOpenTipo] = useState(false);

  // Tipos de Objeto vindos do Firebase com fallback local
  const { data: tiposObjeto = [], isLoading: loadingTipos } = useTiposObjeto();

  // Normaliza a classificação vinda por props (string ou objeto) para objetos completos
  useEffect(() => {
    if (!tiposObjeto || tiposObjeto.length === 0) return;

    const incoming: any = classification ?? {};
    const next: LocalClassification = {};

    let tipoKey: string | undefined;
    if (incoming?.tipoObjeto) {
      if (typeof incoming.tipoObjeto === 'string') {
        next.tipoObjeto = tiposObjeto.find((t) => t.key === incoming.tipoObjeto);
        tipoKey = incoming.tipoObjeto;
      } else if (typeof incoming.tipoObjeto === 'object') {
        next.tipoObjeto = incoming.tipoObjeto;
        tipoKey = incoming.tipoObjeto?.key;
      }
    }

    const modalidadesList = tipoKey ? getModalidadesByTipo(tipoKey as TipoObjeto) : [];
    if (incoming?.modalidadePrincipal) {
      if (typeof incoming.modalidadePrincipal === 'string') {
        next.modalidadePrincipal = modalidadesList.find((m) => m.key === incoming.modalidadePrincipal);
      } else if (typeof incoming.modalidadePrincipal === 'object') {
        next.modalidadePrincipal = incoming.modalidadePrincipal;
      }
    }

    const modalidadeKey = next.modalidadePrincipal?.key;
    const subtiposList =
      tipoKey && modalidadeKey
        ? getSubtiposByModalidade(tipoKey as TipoObjeto, modalidadeKey as ModalidadePrincipal)
        : [];
    if (incoming?.subtipo) {
      if (typeof incoming.subtipo === 'string') {
        next.subtipo = subtiposList.find((s) => s.key === incoming.subtipo);
      } else if (typeof incoming.subtipo === 'object') {
        next.subtipo = incoming.subtipo;
      }
    }

    const subtipoKey = next.subtipo?.key;
    const documentosList =
      tipoKey && modalidadeKey && subtipoKey
        ? getDocumentosBySubtipo(
            tipoKey as TipoObjeto,
            modalidadeKey as ModalidadePrincipal,
            subtipoKey as Subtipo
          )
        : [];
    if (incoming?.tipoDocumento) {
      if (typeof incoming.tipoDocumento === 'string') {
        next.tipoDocumento = documentosList.find((d) => d.key === incoming.tipoDocumento);
      } else if (typeof incoming.tipoDocumento === 'object') {
        next.tipoDocumento = incoming.tipoDocumento;
      }
    }

    setCurrentClassification(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification, tiposObjeto]);

  const tipoKey = currentClassification.tipoObjeto?.key as TipoObjeto | undefined;
  const modalidadeKey = currentClassification.modalidadePrincipal?.key as ModalidadePrincipal | undefined;
  const subtipoKey = currentClassification.subtipo?.key as Subtipo | undefined;

  const modalidades = tipoKey ? getModalidadesByTipo(tipoKey) : [];
  const subtipos = tipoKey && modalidadeKey ? getSubtiposByModalidade(tipoKey, modalidadeKey) : [];
  const documentos =
    tipoKey && modalidadeKey && subtipoKey ? getDocumentosBySubtipo(tipoKey, modalidadeKey, subtipoKey) : [];


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
  
  // Debug logs
  console.log('🔍 Classification Debug:', {
    currentClassification,
    subtipos: subtipos.length,
    documentos: documentos.length,
    isValid
  });

  useEffect(() => {
    onValidationChange(isValid);
  }, [isValid, onValidationChange]);

  useEffect(() => {
    const outgoing: Partial<DocumentClassification> = {
      tipoObjeto: currentClassification.tipoObjeto?.key as TipoObjeto,
      modalidadePrincipal: currentClassification.modalidadePrincipal?.key as ModalidadePrincipal,
      subtipo: currentClassification.subtipo?.key as Subtipo,
      tipoDocumento: currentClassification.tipoDocumento?.key as TipoDocumento,
    };
    onClassificationChange(outgoing);
  }, [currentClassification, onClassificationChange]);

  // Handlers
  const handleTipoObjetoChange = (value: string) => {
    const selectedTipo = tiposObjeto.find((tipo) => tipo.key === value);
    setCurrentClassification({
      tipoObjeto: selectedTipo,
      modalidadePrincipal: undefined,
      subtipo: undefined,
      tipoDocumento: undefined,
    });
  };

  const handleModalidadeChange = (value: string) => {
    const selected = modalidades.find((m) => m.key === value);
    setCurrentClassification((prev) => ({
      ...prev,
      modalidadePrincipal: selected,
      subtipo: undefined,
      tipoDocumento: undefined,
    }));
  };

  const handleSubtipoChange = (value: string) => {
    const selected = subtipos.find((s) => s.key === value);
    setCurrentClassification((prev) => ({
      ...prev,
      subtipo: selected,
      tipoDocumento: undefined,
    }));
  };

  const handleDocumentoChange = (value: string) => {
    const selected = documentos.find((d) => d.key === value);
    setCurrentClassification((prev) => ({
      ...prev,
      tipoDocumento: selected,
    }));
  };
  const breadcrumb = getClassificationBreadcrumb(
    currentClassification.tipoObjeto?.key as TipoObjeto,
    currentClassification.modalidadePrincipal?.key as ModalidadePrincipal,
    currentClassification.subtipo?.key as Subtipo,
    currentClassification.tipoDocumento?.key as TipoDocumento
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
              <div key={`breadcrumb-${index}`} className="flex items-center gap-2">
                <span>{item}</span>
                {index < breadcrumb.length - 1 && <ChevronRight className="h-4 w-4" />}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nível 1: Tipo de Objeto */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('classification.tipoObjeto')}</label>
          <Select
            open={openTipo}
            onOpenChange={setOpenTipo}
            value={currentClassification.tipoObjeto?.key || ''} // Ajuste para ler a propriedade 'key' do objeto
            onValueChange={handleTipoObjetoChange}
            disabled={loadingTipos}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTipos ? t('common.loading') : t('classification.selectTipoObjeto')} />
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
            value={currentClassification.modalidadePrincipal?.key || ''} // Ajuste para ler a propriedade 'key' do objeto
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
              value={currentClassification.subtipo?.key || ''} // Ajuste para ler a propriedade 'key' do objeto
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
              value={currentClassification.tipoDocumento?.key || ''} // Ajuste para ler a propriedade 'key' do objeto
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