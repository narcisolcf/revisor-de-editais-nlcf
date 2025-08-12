import { debounce } from 'lodash-es';
import { AnalysisWeights, ProblemSeverity } from '@licitareview/types';
import { ANALYSIS_THRESHOLDS, CATEGORY_COLORS } from './constants';

/**
 * 🚀 CORE DIFFERENTIATOR: Calculate weighted score based on organization config
 */
export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: AnalysisWeights
): number {
  const structuralScore = scores.structural || 0;
  const legalScore = scores.legal || 0;
  const clarityScore = scores.clarity || 0;
  const abntScore = scores.abnt || 0;

  return (
    (structuralScore * weights.structural / 100) +
    (legalScore * weights.legal / 100) +
    (clarityScore * weights.clarity / 100) +
    (abntScore * weights.abnt / 100)
  );
}

/**
 * Get score category based on thresholds
 */
export function getScoreCategory(score: number): string {
  if (score >= ANALYSIS_THRESHOLDS.EXCELLENT) return 'Excelente';
  if (score >= ANALYSIS_THRESHOLDS.GOOD) return 'Bom';
  if (score >= ANALYSIS_THRESHOLDS.ACCEPTABLE) return 'Aceitável';
  if (score >= ANALYSIS_THRESHOLDS.POOR) return 'Insatisfatório';
  return 'Crítico';
}

/**
 * Get color for analysis category
 */
export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || '#6b7280';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely get nested object property
 */
export function get(obj: any, path: string, defaultValue: any = undefined): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

/**
 * Create debounced function
 */
export function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  return debounce(func, delay) as T;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Convert severity enum to display text
 */
export function severityToText(severity: ProblemSeverity): string {
  const severityMap: Record<ProblemSeverity, string> = {
    [ProblemSeverity.CRITICA]: 'Crítica',
    [ProblemSeverity.ALTA]: 'Alta',
    [ProblemSeverity.MEDIA]: 'Média',
    [ProblemSeverity.BAIXA]: 'Baixa'
  };
  
  return severityMap[severity] || severity;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: ProblemSeverity): string {
  const colorMap: Record<ProblemSeverity, string> = {
    [ProblemSeverity.CRITICA]: '#dc2626',
    [ProblemSeverity.ALTA]: '#ea580c',
    [ProblemSeverity.MEDIA]: '#d97706',
    [ProblemSeverity.BAIXA]: '#059669'
  };
  
  return colorMap[severity] || '#6b7280';
}

/**
 * Format analysis duration
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if file extension is allowed
 */
export function isAllowedFileType(filename: string, allowedExtensions: string[]): boolean {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return allowedExtensions.includes(extension);
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
}

/**
 * Generate random color
 */
export function generateRandomColor(): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#6366f1', '#14b8a6', '#eab308', '#ec4899'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}