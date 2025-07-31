import React from 'react';
import { DocumentType, ModalidadeLicitacao, DocumentSpecificFields } from '@/types/document';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';

interface DocumentTypeFormProps {
  documentType: DocumentType;
  specificFields: DocumentSpecificFields;
  modalidade?: ModalidadeLicitacao;
  onSpecificFieldsChange: (fields: DocumentSpecificFields) => void;
  onModalidadeChange: (modalidade: ModalidadeLicitacao) => void;
}

export const DocumentTypeForm: React.FC<DocumentTypeFormProps> = ({
  documentType,
  specificFields,
  modalidade,
  onSpecificFieldsChange,
  onModalidadeChange
}) => {
  const { t } = useTranslation();

  const handleFieldChange = (field: keyof DocumentSpecificFields, value: any) => {
    onSpecificFieldsChange({
      ...specificFields,
      [field]: value
    });
  };

  const renderEditalFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="modalidade">{t('documents.modalidade')} *</Label>
        <Select value={modalidade} onValueChange={onModalidadeChange}>
          <SelectTrigger>
            <SelectValue placeholder={t('documents.modalidades.pregao_eletronico')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pregao_eletronico">{t('documents.modalidades.pregao_eletronico')}</SelectItem>
            <SelectItem value="pregao_presencial">{t('documents.modalidades.pregao_presencial')}</SelectItem>
            <SelectItem value="concorrencia">{t('documents.modalidades.concorrencia')}</SelectItem>
            <SelectItem value="tomada_precos">{t('documents.modalidades.tomada_precos')}</SelectItem>
            <SelectItem value="convite">{t('documents.modalidades.convite')}</SelectItem>
            <SelectItem value="concurso">{t('documents.modalidades.concurso')}</SelectItem>
            <SelectItem value="leilao">{t('documents.modalidades.leilao')}</SelectItem>
            <SelectItem value="rdc">{t('documents.modalidades.rdc')}</SelectItem>
            <SelectItem value="dispensa">{t('documents.modalidades.dispensa')}</SelectItem>
            <SelectItem value="inexigibilidade">{t('documents.modalidades.inexigibilidade')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objetoLicitacao">{t('documents.specificFields.objetoLicitacao')}</Label>
        <Textarea
          id="objetoLicitacao"
          value={specificFields.objetoLicitacao || ''}
          onChange={(e) => handleFieldChange('objetoLicitacao', e.target.value)}
          placeholder="Descreva o objeto da licitação..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="criterioJulgamento">{t('documents.specificFields.criterioJulgamento')}</Label>
        <Select 
          value={specificFields.criterioJulgamento} 
          onValueChange={(value) => handleFieldChange('criterioJulgamento', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o critério" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="menor_preco">{t('documents.criteriosJulgamento.menor_preco')}</SelectItem>
            <SelectItem value="melhor_tecnica">{t('documents.criteriosJulgamento.melhor_tecnica')}</SelectItem>
            <SelectItem value="tecnica_preco">{t('documents.criteriosJulgamento.tecnica_preco')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const renderTermoReferenciaFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="especificacoesTecnicas">{t('documents.specificFields.especificacoesTecnicas')}</Label>
        <Textarea
          id="especificacoesTecnicas"
          value={specificFields.especificacoesTecnicas || ''}
          onChange={(e) => handleFieldChange('especificacoesTecnicas', e.target.value)}
          placeholder="Descreva as especificações técnicas..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="justificativa">{t('documents.specificFields.justificativa')}</Label>
        <Textarea
          id="justificativa"
          value={specificFields.justificativa || ''}
          onChange={(e) => handleFieldChange('justificativa', e.target.value)}
          placeholder="Justifique a necessidade da contratação..."
          rows={3}
        />
      </div>
    </>
  );

  const renderMinutaContratoFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="vigenciaContrato">{t('documents.specificFields.vigenciaContrato')}</Label>
        <Input
          id="vigenciaContrato"
          type="number"
          value={specificFields.vigenciaContrato || ''}
          onChange={(e) => handleFieldChange('vigenciaContrato', parseInt(e.target.value))}
          placeholder="12"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="clausulasPenalidades"
          checked={specificFields.clausulasPenalidades || false}
          onCheckedChange={(checked) => handleFieldChange('clausulasPenalidades', checked)}
        />
        <Label htmlFor="clausulasPenalidades">{t('documents.specificFields.clausulasPenalidades')}</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="garantiaContratual">{t('documents.specificFields.garantiaContratual')}</Label>
        <Input
          id="garantiaContratual"
          type="number"
          value={specificFields.garantiaContratual || ''}
          onChange={(e) => handleFieldChange('garantiaContratual', parseFloat(e.target.value))}
          placeholder="5"
          step="0.1"
        />
      </div>
    </>
  );

  const renderProjetoBasicoFields = () => (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="memorialDescritivo"
          checked={specificFields.memorialDescritivo || false}
          onCheckedChange={(checked) => handleFieldChange('memorialDescritivo', checked)}
        />
        <Label htmlFor="memorialDescritivo">{t('documents.specificFields.memorialDescritivo')}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="planilhaOrcamentaria"
          checked={specificFields.planilhaOrcamentaria || false}
          onCheckedChange={(checked) => handleFieldChange('planilhaOrcamentaria', checked)}
        />
        <Label htmlFor="planilhaOrcamentaria">{t('documents.specificFields.planilhaOrcamentaria')}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="cronogramaExecucao"
          checked={specificFields.cronogramaExecucao || false}
          onCheckedChange={(checked) => handleFieldChange('cronogramaExecucao', checked)}
        />
        <Label htmlFor="cronogramaExecucao">{t('documents.specificFields.cronogramaExecucao')}</Label>
      </div>
    </>
  );

  const renderAtaRegistroFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="validadeAta">{t('documents.specificFields.validadeAta')}</Label>
        <Input
          id="validadeAta"
          type="number"
          value={specificFields.validadeAta || ''}
          onChange={(e) => handleFieldChange('validadeAta', parseInt(e.target.value))}
          placeholder="12"
        />
      </div>
    </>
  );

  const renderParecerFields = () => (
    <>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="fundamentacaoLegal"
          checked={specificFields.fundamentacaoLegal || false}
          onCheckedChange={(checked) => handleFieldChange('fundamentacaoLegal', checked)}
        />
        <Label htmlFor="fundamentacaoLegal">{t('documents.specificFields.fundamentacaoLegal')}</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="conclusaoObjetiva"
          checked={specificFields.conclusaoObjetiva || false}
          onCheckedChange={(checked) => handleFieldChange('conclusaoObjetiva', checked)}
        />
        <Label htmlFor="conclusaoObjetiva">{t('documents.specificFields.conclusaoObjetiva')}</Label>
      </div>
    </>
  );

  const renderSpecificFields = () => {
    switch (documentType) {
      case 'edital':
        return renderEditalFields();
      case 'termo_referencia':
        return renderTermoReferenciaFields();
      case 'minuta_contrato':
        return renderMinutaContratoFields();
      case 'projeto_basico':
        return renderProjetoBasicoFields();
      case 'ata_registro_precos':
        return renderAtaRegistroFields();
      case 'parecer_juridico':
      case 'parecer_tecnico':
        return renderParecerFields();
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">
          {t(`documents.documentTypes.${documentType}`)} - {t('documents.specificFields.title') || 'Campos Específicos'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderSpecificFields()}
      </CardContent>
    </Card>
  );
};