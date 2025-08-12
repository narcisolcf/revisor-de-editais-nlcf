import { z } from 'zod';
import { AnalysisWeights, WeightValidationResult, RuleTestResult } from '@licitareview/types';

/**
 * 🚀 CORE DIFFERENTIATOR: Weight validation utilities
 */
export function validateAnalysisWeights(weights: AnalysisWeights): WeightValidationResult {
  const total = weights.structural + weights.legal + weights.clarity + weights.abnt;
  const errors: string[] = [];

  if (Math.abs(total - 100) >= 0.01) {
    errors.push(`Total weights must equal 100%, got ${total.toFixed(2)}%`);
  }

  if (weights.structural < 0 || weights.structural > 100) {
    errors.push('Structural weight must be between 0% and 100%');
  }

  if (weights.legal < 0 || weights.legal > 100) {
    errors.push('Legal weight must be between 0% and 100%');
  }

  if (weights.clarity < 0 || weights.clarity > 100) {
    errors.push('Clarity weight must be between 0% and 100%');
  }

  if (weights.abnt < 0 || weights.abnt > 100) {
    errors.push('ABNT weight must be between 0% and 100%');
  }

  return {
    isValid: errors.length === 0,
    total,
    errors
  };
}

/**
 * Test a regex pattern against sample text
 */
export function testRulePattern(pattern: string, testText: string): RuleTestResult {
  const startTime = performance.now();
  
  try {
    const regex = new RegExp(pattern, 'gi');
    const matches = testText.match(regex) || [];
    const executionTime = performance.now() - startTime;

    return {
      matches: matches.length > 0,
      matchCount: matches.length,
      executionTime
    };
  } catch (error) {
    const executionTime = performance.now() - startTime;
    
    return {
      matches: false,
      matchCount: 0,
      executionTime,
      error: error instanceof Error ? error.message : 'Unknown regex error'
    };
  }
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Validate Brazilian CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  
  // Check for invalid patterns
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;
  
  // Calculate check digits
  let sum = 0;
  let multiplier = 5;
  
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  
  const remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCNPJ[12]) !== digit1) return false;
  
  sum = 0;
  multiplier = 6;
  
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * multiplier;
    multiplier = multiplier === 2 ? 9 : multiplier - 1;
  }
  
  const remainder2 = sum % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return parseInt(cleanCNPJ[13]) === digit2;
}

/**
 * Validate Brazilian CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Check for invalid patterns
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  
  const remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF[9]) !== digit1) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  
  const remainder2 = sum % 11;
  const digit2 = remainder2 < 2 ? 0 : 11 - remainder2;
  
  return parseInt(cleanCPF[10]) === digit2;
}