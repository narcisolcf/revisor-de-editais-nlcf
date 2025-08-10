import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import { DocumentClassification, TipoObjeto, ModalidadePrincipal, Subtipo, TipoDocumento } from '@/types/document';
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
  onClassificationChange: (classification: Partial<{ [K in keyof DocumentClassification]: string | undefined }>) => void;
  onValidationChange: (isValid: boolean) => void;
}

// Definição local para usar objetos completos no estado
type LocalClassification = {
  tipoObjeto?: TipoObjeto;
  modalidadePrincipal?: ModalidadePrincipal;
  subtipo?: Subtipo;
  tipoDocumento?: TipoDocumento;
}

export function HierarchicalClassification({ 
  classification = {}, 
  onClassificationChange, 
  onValidationChange 
}: HierarchicalClassificationProps) {
  const { t } = useTranslation();
  const [currentClassification, setCurrentClassification] = useState<LocalClassification>({});
  const [openTipo, setOpenTipo] = useState(false);

  const { data: tiposObjeto = [], isLoading: loadingTipos } = useTiposObjeto();

  // DERIVAÇÃO DE DADOS: Sempre a partir do estado atual com objetos completos
  const modalidades = currentClassification.tipoObjeto ? 
    getModalidadesByTipo(currentClassification.tipoObjeto) : [];
    
  const subtipos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal ? 
    getSubtiposByModalidade(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal) : [];

  const documentos = currentClassification.tipoObjeto && currentClassification.modalidadePrincipal && currentClassification.subtipo ? 
    getDocumentosBySubtipo(currentClassification.tipoObjeto, currentClassification.modalidadePrincipal, currentClassification.subtipo) : [];

  // FUNÇÕES DE ATUALIZAÇÃO DE ESTADO: Garantem que sempre salvamos o objeto completo
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

  // EFEITOS COLATERAIS: Notificam o componente pai sobre mudanças
  useEffect(() => {
    const isValid = !!(currentClassification.tipoObjeto && currentClassification.modalidadePrincipal);
    onValidationChange(isValid);
  }, [currentClassification, onValidationChange]);

  useEffect(() => {
    // Envia apenas as 'keys' para o componente pai, para manter o contrato original
    const outgoing = {
      tipoObjeto: currentClassification.tipoObjeto?.key,
      modalidadePrincipal: currentClassification.modalidadePrincipal?.key,
      subtipo: currentClassification.subtipo?.key,
      tipoDocumento: currentClassification.tipoDocumento?.key,
    };
    onClassificationChange(outgoing);
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
            open={openTipo}
            onOpenChange={setOpenTipo}
            value={currentClassification.tipoObjeto?.key || ''}
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
            value={currentClassification.modalidadePrincipal?.key || ''}
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
        
        {/* Renderiza os próximos níveis se houver dados */}
      </CardContent>
    </Card>
  );
}