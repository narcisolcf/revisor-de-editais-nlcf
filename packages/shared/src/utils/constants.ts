/**
 * Application constants and configuration values
 */

// File upload constraints
export const FILE_UPLOAD = {
  MAX_SIZE: 52428800, // 50MB in bytes
  ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx']
} as const;

// Analysis scoring thresholds
export const ANALYSIS_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  ACCEPTABLE: 60,
  POOR: 40,
  CRITICAL: 25
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env['VITE_API_URL'] || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
} as const;

// Regional settings
export const LOCALE_CONFIG = {
  LANGUAGE: 'pt-BR',
  CURRENCY: 'BRL',
  TIMEZONE: 'America/Sao_Paulo',
  DATE_FORMAT: 'dd/MM/yyyy',
  DATETIME_FORMAT: 'dd/MM/yyyy HH:mm',
  NUMBER_FORMAT: {
    decimal: ',',
    thousands: '.'
  }
} as const;

// Analysis categories
export const ANALYSIS_CATEGORIES = {
  STRUCTURAL: 'ESTRUTURAL',
  LEGAL: 'JURIDICO',
  CLARITY: 'CLAREZA',
  ABNT: 'ABNT',
  CONFORMITY: 'CONFORMIDADE',
  COMPLETENESS: 'COMPLETUDE'
} as const;

// Problem severity levels
export const PROBLEM_SEVERITY = {
  CRITICAL: 'CRITICA',
  HIGH: 'ALTA',
  MEDIUM: 'MEDIA',
  LOW: 'BAIXA'
} as const;

// Document types
export const DOCUMENT_TYPES = {
  EDITAL: 'EDITAL',
  TERMO_REFERENCIA: 'TERMO_REFERENCIA',
  ATA_SESSAO: 'ATA_SESSAO',
  CONTRATO: 'CONTRATO',
  PROJETO_BASICO: 'PROJETO_BASICO',
  RECURSO: 'RECURSO',
  IMPUGNACAO: 'IMPUGNACAO',
  ESCLARECIMENTO: 'ESCLARECIMENTO'
} as const;

// Analysis presets
export const ANALYSIS_PRESETS = {
  RIGOROUS: 'RIGOROUS',
  STANDARD: 'STANDARD',
  TECHNICAL: 'TECHNICAL',
  FAST: 'FAST',
  CUSTOM: 'CUSTOM'
} as const;

// Status constants
export const DOCUMENT_STATUS = {
  PENDING: 'PENDENTE',
  PROCESSING: 'PROCESSANDO',
  ANALYZED: 'ANALISADO',
  APPROVED: 'APROVADO',
  REJECTED: 'REJEITADO',
  ARCHIVED: 'ARQUIVADO'
} as const;

// Color theme for analysis categories
export const CATEGORY_COLORS = {
  ESTRUTURAL: '#3b82f6', // blue
  JURIDICO: '#dc2626',   // red
  CLAREZA: '#059669',    // green
  ABNT: '#d97706',       // amber
  CONFORMIDADE: '#7c3aed', // purple
  COMPLETUDE: '#0891b2'    // cyan
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  ANALYSIS_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  CONFIG_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  USER_CACHE_TTL: 15 * 60 * 1000 // 15 minutes
} as const;