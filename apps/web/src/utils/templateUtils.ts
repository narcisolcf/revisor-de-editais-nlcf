import { 
  FileText, 
  Shield, 
  Target, 
  MapPin, 
  FileCode 
} from 'lucide-react';
import { TemplateStructure } from '@/types/template';

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'edital':
      return FileText;
    case 'tr':
      return Target;
    case 'etp':
      return Shield;
    case 'mapa_risco':
      return MapPin;
    case 'minuta':
      return FileCode;
    default:
      return FileText;
  }
};

export const getCategoryLabel = (category: string) => {
  const labels = {
    edital: 'Edital',
    tr: 'Termo de Referência',
    etp: 'ETP',
    mapa_risco: 'Mapa de Risco',
    minuta: 'Minuta'
  };
  return labels[category as keyof typeof labels] || category;
};

export const getStatusBadgeVariant = (template: TemplateStructure) => {
  if (!template.metadata.isActive) {
    return 'secondary';
  }
  if (template.metadata.isPublic) {
    return 'default';
  }
  return 'outline';
};

export const getStatusBadgeText = (template: TemplateStructure) => {
  if (!template.metadata.isActive) {
    return 'Inativo';
  }
  if (template.metadata.isPublic) {
    return 'Público';
  }
  return 'Privado';
};

export const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'error':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
};

export const getSeverityBadgeConfig = (severity: string) => {
  const severityMap = {
    error: { color: 'destructive', label: 'Erro' },
    warning: { color: 'default', label: 'Aviso' },
    info: { color: 'secondary', label: 'Info' }
  };

  return severityMap[severity as keyof typeof severityMap] || severityMap.info;
};

export const getImpactBadgeConfig = (impact: string) => {
  const impactMap = {
    low: { color: 'outline', label: 'Baixo' },
    medium: { color: 'secondary', label: 'Médio' },
    high: { color: 'default', label: 'Alto' },
    critical: { color: 'destructive', label: 'Crítico' }
  };

  return impactMap[impact as keyof typeof impactMap] || impactMap.low;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const calculateTemplateScore = (template: TemplateStructure) => {
  // Lógica para calcular score baseado em validações e seções
  let score = 0;
  let totalWeight = 0;
  
  template.sections.forEach(section => {
    if (section.required) {
      score += section.scoringWeight;
      totalWeight += section.scoringWeight;
    }
  });
  
  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
};

export const getTemplateStats = (template: TemplateStructure) => {
  const requiredSections = template.sections.filter(s => s.required).length;
  const optionalSections = template.sections.filter(s => !s.required).length;
  const totalValidationRules = template.validationRules.length;
  const activeValidationRules = template.validationRules.filter(r => r.enabled).length;
  
  return {
    requiredSections,
    optionalSections,
    totalValidationRules,
    activeValidationRules,
    totalSections: template.sections.length
  };
};
