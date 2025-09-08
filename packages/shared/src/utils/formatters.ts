/**
 * Utilitários de formatação
 */

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatação de documentos brasileiros
export const formatCPF = (cpf: string): string => {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return cpf;
  return cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatCNPJ = (cnpj: string): string => {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  if (cleanCnpj.length !== 14) return cnpj;
  return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

export const formatCEP = (cep: string): string => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return cep;
  return cleanCep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Formatação de telefone
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // Telefone fixo: (11) 1234-5678
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    // Celular: (11) 91234-5678
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

export const formatPhoneInternational = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // Telefone fixo: +55 11 1234-5678
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '+55 $1 $2-$3');
  } else if (cleanPhone.length === 11) {
    // Celular: +55 11 91234-5678
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '+55 $1 $2-$3');
  }
  
  return phone;
};

// Formatação de números
export const formatCurrency = (value: number, currency = 'BRL'): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency
  }).format(value);
};

export const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat('pt-BR', options).format(value);
};

export const formatPercentage = (value: number, decimals = 1): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

// Formatação de tamanho de arquivo
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Formatação de datas
export const formatDate = (date: Date | string, pattern = 'dd/MM/yyyy'): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

export const formatDateTimeFull = (date: Date | string): string => {
  return formatDate(date, 'dd/MM/yyyy HH:mm:ss');
};

export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: ptBR 
  });
};

// Formatação de texto
export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .filter(part => part.length > 0)
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

export const formatName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};

export const formatFullName = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

// Formatação de endereço
export const formatAddress = (address: {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}): string => {
  const parts = [
    `${address.street}, ${address.number}`,
    address.complement,
    address.neighborhood,
    `${address.city} - ${address.state}`,
    formatCEP(address.zipCode)
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatAddressShort = (address: {
  city: string;
  state: string;
}): string => {
  return `${address.city} - ${address.state}`;
};

// Formatação de status
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Ativo',
    inactive: 'Inativo',
    suspended: 'Suspenso',
    pending: 'Pendente',
    pending_verification: 'Aguardando Verificação',
    draft: 'Rascunho',
    published: 'Publicado',
    archived: 'Arquivado',
    deleted: 'Excluído',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
    cancelled: 'Cancelado'
  };
  
  return statusMap[status] || status;
};

// Formatação de prioridade
export const formatPriority = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica'
  };
  
  return priorityMap[priority] || priority;
};

// Formatação de tipo de organização
export const formatOrganizationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    government: 'Governo',
    private_company: 'Empresa Privada',
    university: 'Universidade',
    ngo: 'ONG',
    cooperative: 'Cooperativa'
  };
  
  return typeMap[type] || type;
};

// Formatação de papel de usuário
export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin: 'Administrador',
    manager: 'Gerente',
    analyst: 'Analista',
    viewer: 'Visualizador'
  };
  
  return roleMap[role] || role;
};

// Formatação de contexto de usuário
export const formatUserContext = (context: string): string => {
  const contextMap: Record<string, string> = {
    government: 'Governo',
    private: 'Privado',
    academic: 'Acadêmico',
    ngo: 'ONG'
  };
  
  return contextMap[context] || context;
};

// Utilitário para truncar texto
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// Utilitário para destacar texto em busca
export const highlightSearchText = (text: string, search: string): string => {
  if (!search.trim()) return text;
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};