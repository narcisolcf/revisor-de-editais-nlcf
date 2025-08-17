// Componentes do Sistema de Templates
export { TemplateManager } from './TemplateManager';
export { TemplateUploader } from './TemplateUploader';
export { TemplateEditor } from './TemplateEditor';
export { TemplatePreview } from './TemplatePreview';
export { TemplateAnalytics } from './TemplateAnalytics';
export { TemplateVersioning } from './TemplateVersioning';

// Componentes Refatorados
export { TemplateCard } from './TemplateCard';
export { TemplateFilters } from './TemplateFilters';
export { CategoryOverview } from './CategoryOverview';

// Tipos e interfaces
export type {
  TemplateSection,
  ValidationRule,
  TemplateMetadata,
  TemplateStructure,
  TemplateComparison,
  ValidationResult,
  TemplateSuggestion
} from '@/types/template';
