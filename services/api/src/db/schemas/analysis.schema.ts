/**
 * Firestore Schema: Analysis Collection
 * 
 * Collection: /analyses/{analysisId}/
 * Structure for independent analysis records and history
 */

import { z } from 'zod';

// Analysis Schema for independent analysis records
export const AnalysisSchema = z.object({
  // Basic Information
  id: z.string(),
  documentId: z.string(),
  organizationId: z.string(),
  userId: z.string(), // User who requested the analysis
  
  // Analysis Configuration
  analysisType: z.enum(['FULL', 'QUICK', 'CUSTOM', 'COMPLIANCE_ONLY']),
  configurationId: z.string(), // Custom parameters used
  templateId: z.string().optional(),
  
  // Analysis Request Details
  request: z.object({
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
    options: z.object({
      includeAI: z.boolean(),
      generateRecommendations: z.boolean(),
      detailedMetrics: z.boolean(),
      customRules: z.array(z.string()) // Rule IDs
    }),
    webhook: z.string().url().optional(),
    timeout: z.number().int().positive().default(300) // seconds
  }),
  
  // Processing Information
  processing: z.object({
    status: z.enum(['PENDING', 'INITIALIZING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT']),
    progress: z.number().min(0).max(100),
    currentStep: z.string().optional(),
    estimatedTimeRemaining: z.number().optional(), // seconds
    
    // Timestamps
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    
    // Processing Metrics
    metrics: z.object({
      totalProcessingTime: z.number().optional(), // milliseconds
      preprocessingTime: z.number().optional(),
      analysisTime: z.number().optional(),
      postprocessingTime: z.number().optional(),
      
      // Resource Usage
      cpuTime: z.number().optional(),
      memoryUsed: z.number().optional(), // bytes
      apiCallsCount: z.number().int().min(0).optional(),
      
      // Analysis Specific
      rulesProcessed: z.number().int().min(0).optional(),
      sectionsAnalyzed: z.number().int().min(0).optional(),
      patternsMatched: z.number().int().min(0).optional()
    }).optional(),
    
    // Error Information
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
      stack: z.string().optional(),
      retryCount: z.number().int().min(0).default(0)
    }).optional()
  }),
  
  // Analysis Results (when completed)
  results: z.object({
    // Overall Scores
    scores: z.object({
      overall: z.number().min(0).max(100),
      
      // Category Scores
      structural: z.number().min(0).max(100),
      legal: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      abnt: z.number().min(0).max(100),
      
      // Weighted Scores (using organization weights)
      weightedStructural: z.number().min(0).max(100),
      weightedLegal: z.number().min(0).max(100),
      weightedClarity: z.number().min(0).max(100),
      weightedAbnt: z.number().min(0).max(100),
      
      // Confidence Metrics
      confidence: z.number().min(0).max(1),
      reliability: z.number().min(0).max(1).optional()
    }),
    
    // Problems Found
    problems: z.array(z.object({
      id: z.string(),
      ruleId: z.string().optional(),
      category: z.enum(['ESTRUTURAL', 'JURIDICO', 'CLAREZA', 'ABNT', 'CONFORMIDADE', 'COMPLETUDE']),
      severity: z.enum(['CRITICA', 'ALTA', 'MEDIA', 'BAIXA']),
      
      // Problem Details
      title: z.string(),
      description: z.string(),
      suggestion: z.string().optional(),
      
      // Location Information
      location: z.object({
        page: z.number().int().positive().optional(),
        paragraph: z.number().int().positive().optional(),
        section: z.string().optional(),
        startPosition: z.number().int().optional(),
        endPosition: z.number().int().optional(),
        context: z.string().optional() // Surrounding text
      }).optional(),
      
      // Impact and Confidence
      impact: z.number().min(0).max(10),
      confidence: z.number().min(0).max(1),
      autoFixAvailable: z.boolean().default(false),
      
      // Status
      status: z.enum(['OPEN', 'ACKNOWLEDGED', 'FIXED', 'IGNORED', 'FALSE_POSITIVE']).default('OPEN'),
      resolvedBy: z.string().optional(),
      resolvedAt: z.date().optional(),
      resolution: z.string().optional()
    })),
    
    // Recommendations
    recommendations: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      category: z.string(),
      
      // Action Information
      actionRequired: z.string(),
      estimatedEffort: z.string().optional(), // "5 minutes", "1 hour", etc.
      
      // Expected Impact
      expectedImprovement: z.number().min(0).max(100).optional(),
      complianceImprovement: z.boolean().default(false)
    })),
    
    // Compliance Information
    compliance: z.object({
      overallCompliance: z.number().min(0).max(100),
      requiredItems: z.array(z.object({
        item: z.string(),
        present: z.boolean(),
        location: z.string().optional(),
        notes: z.string().optional()
      })),
      missingRequirements: z.array(z.string()),
      additionalNotes: z.string().optional()
    }).optional(),
    
    // Quality Metrics
    quality: z.object({
      readability: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
      completeness: z.number().min(0).max(100),
      clarity: z.number().min(0).max(100),
      
      // Text Statistics
      averageSentenceLength: z.number().optional(),
      complexWordsPercentage: z.number().min(0).max(100).optional(),
      passiveVoicePercentage: z.number().min(0).max(100).optional(),
      
      // Document Statistics
      wordCount: z.number().int().min(0),
      sentenceCount: z.number().int().min(0),
      paragraphCount: z.number().int().min(0)
    }).optional(),
    
    // Executive Summary
    executiveSummary: z.object({
      overallAssessment: z.string(),
      keyFindings: z.array(z.string()),
      keyRisks: z.array(z.string()),
      priorityRecommendations: z.array(z.string()),
      nextSteps: z.array(z.string()),
      conclusion: z.string()
    }).optional()
  }).optional(),
  
  // Analysis Engine Information
  engine: z.object({
    name: z.string().default('licitareview-v2'),
    version: z.string().default('2.0.0'),
    cloudRunEndpoint: z.string().url().optional(),
    fallbackUsed: z.boolean().default(false),
    cacheHit: z.boolean().default(false)
  }),
  
  // Audit and Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(),
  
  // Additional Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([])
});

// Analysis History Entry Schema
export const AnalysisHistoryEntrySchema = z.object({
  id: z.string(),
  analysisId: z.string(),
  documentId: z.string(),
  organizationId: z.string(),
  
  // Change Information
  changeType: z.enum(['STATUS_CHANGE', 'PROGRESS_UPDATE', 'ERROR_OCCURRED', 'RESULT_UPDATED', 'CANCELLED']),
  previousValue: z.any().optional(),
  newValue: z.any().optional(),
  
  // Context
  description: z.string(),
  triggeredBy: z.string(), // User ID or system
  
  // Timestamps
  timestamp: z.date(),
  
  // Additional Data
  metadata: z.record(z.any()).optional()
});

// Analysis Statistics Schema
export const AnalysisStatisticsSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  
  // Time Range
  startDate: z.date(),
  endDate: z.date(),
  
  // Analysis Counts
  totalAnalyses: z.number().int().min(0),
  completedAnalyses: z.number().int().min(0),
  failedAnalyses: z.number().int().min(0),
  cancelledAnalyses: z.number().int().min(0),
  
  // Performance Metrics
  averageProcessingTime: z.number().min(0), // seconds
  averageScore: z.number().min(0).max(100),
  
  // Score Distribution
  scoreDistribution: z.object({
    excellent: z.number().int().min(0), // 90-100
    good: z.number().int().min(0),      // 75-89
    acceptable: z.number().int().min(0), // 60-74
    poor: z.number().int().min(0),      // 40-59
    critical: z.number().int().min(0)   // 0-39
  }),
  
  // Common Issues
  commonProblems: z.array(z.object({
    category: z.string(),
    type: z.string(),
    count: z.number().int().min(0),
    percentage: z.number().min(0).max(100)
  })),
  
  // Usage Patterns
  analysisTypeDistribution: z.record(z.number().int().min(0)),
  peakUsageHours: z.array(z.number().int().min(0).max(23)),
  
  // Generated timestamp
  generatedAt: z.date(),
  
  // Metadata
  metadata: z.record(z.any()).optional()
});

// Type exports
export type Analysis = z.infer<typeof AnalysisSchema>;
export type AnalysisHistoryEntry = z.infer<typeof AnalysisHistoryEntrySchema>;
export type AnalysisStatistics = z.infer<typeof AnalysisStatisticsSchema>;

// Collection constants
export const ANALYSIS_COLLECTIONS = {
  ANALYSES: 'analyses',
  HISTORY: 'analysis_history',
  STATISTICS: 'analysis_statistics'
} as const;