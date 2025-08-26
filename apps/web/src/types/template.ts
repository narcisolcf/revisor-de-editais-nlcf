export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  validationRules: ValidationRule[];
  scoringWeight: number;
  keywords: string[];
  patterns: string[];
  examples: string[];
}

export interface ValidationRule {
  id: string;
  type: 'presence' | 'format' | 'length' | 'regex' | 'custom';
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: 'edital' | 'tr' | 'etp' | 'mapa_risco' | 'minuta';
  subcategory: string;
  version: string;
  author: string;
  organizationId: string;
  tags: string[];
  isPublic: boolean;
  isActive: boolean;
  usageCount: number;
  rating: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  requiredFields: string[];
  scoringWeights: Record<string, number>;
  validationRules: ValidationRule[];
  metadata: TemplateMetadata;
}

export interface TemplateComparison {
  templateId: string;
  documentId: string;
  matchScore: number;
  missingSections: string[];
  extraSections: string[];
  validationResults: ValidationResult[];
  suggestions: string[];
}

export interface ValidationResult {
  sectionId: string;
  ruleId: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface TemplateSuggestion {
  id: string;
  type: 'structure' | 'validation' | 'scoring' | 'content';
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  implementation: string;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  status: 'draft' | 'review' | 'approved' | 'published' | 'deprecated';
  changes: VersionChange[];
  approvalStatus: ApprovalStatus;
  isCurrent: boolean;
  parentVersion?: string;
  branchName?: string;
  commitHash?: string;
}

export interface VersionChange {
  id: string;
  type: 'added' | 'modified' | 'removed' | 'deprecated';
  section: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  details: string;
}

export interface ApprovalStatus {
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedAt?: Date;
  comments?: string;
  requirements?: string[];
}

export interface TemplateUsageData {
  templateId: string;
  templateName: string;
  category: string;
  usageCount: number;
  averageScore: number;
  lastUsed: Date;
  rating: number;
  successRate: number;
}

export interface CategoryAnalytics {
  category: string;
  totalTemplates: number;
  activeTemplates: number;
  totalUsage: number;
  averageRating: number;
  averageScore: number;
}

export interface TimeSeriesData {
  date: string;
  usage: number;
  score: number;
  templates: number;
}

export interface ExtractedSection {
  name: string;
  content: string;
  confidence: number;
  suggestedKeywords: string[];
  suggestedPatterns: string[];
}

export interface UploadProgress {
  stage: 'uploading' | 'processing' | 'extracting' | 'analyzing' | 'complete';
  progress: number;
  message: string;
}
