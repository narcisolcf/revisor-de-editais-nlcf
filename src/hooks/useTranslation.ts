import { ptBR } from '@/translations/pt-br';

export function useTranslation() {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = ptBR;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return { t };
}