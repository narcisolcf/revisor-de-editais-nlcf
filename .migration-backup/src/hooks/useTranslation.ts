import { ptBR } from '@/translations/pt-br';

export function useTranslation() {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: Record<string, unknown> = ptBR;
    
    for (const k of keys) {
      value = value?.[k] as Record<string, unknown>;
    }
    
    return (typeof value === 'string' ? value : key);
  };

  return { t };
}