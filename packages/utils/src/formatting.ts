import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format currency in Brazilian Real
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Format date to Brazilian format
 */
export function formatDate(date: string | Date, pattern: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
}

/**
 * Format datetime to Brazilian format with time
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * Format relative time (e.g., "há 2 horas")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `há ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'agora mesmo';
}

/**
 * Format CNPJ with mask
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/[^\d]/g, '');
  if (cleaned.length !== 14) return cnpj;
  
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Format CPF with mask
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/[^\d]/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Format phone number with mask
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format document type for display
 */
export function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'EDITAL': 'Edital',
    'TERMO_REFERENCIA': 'Termo de Referência',
    'ATA_SESSAO': 'Ata de Sessão',
    'CONTRATO': 'Contrato',
    'PROJETO_BASICO': 'Projeto Básico',
    'RECURSO': 'Recurso',
    'IMPUGNACAO': 'Impugnação',
    'ESCLARECIMENTO': 'Esclarecimento'
  };
  
  return typeMap[type] || type;
}