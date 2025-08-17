import { Shield, Clock, Users, TrendingUp, Award } from 'lucide-react';
import type { FeatureItem, StatItem } from './types';

export const FEATURES: FeatureItem[] = [
  { icon: Shield, text: 'Conformidade total com Lei 14.133/2021' },
  { icon: Clock, text: 'Análise completa em até 24 horas' },
  { icon: Users, text: 'Equipe especializada certificada' },
  { icon: TrendingUp, text: 'Redução de 90% em impugnações' },
  { icon: Award, text: 'Garantia de qualidade institucional' }
];

export const STATS: StatItem[] = [
  { value: 99.9, suffix: '%', label: 'Disponibilidade', duration: 2000 },
  { value: 50, suffix: '+', label: 'Órgãos Atendidos', duration: 2500 },
  { value: 24, suffix: 'h', label: 'Suporte', duration: 1800 }
];

export const FONTS = {
  RAWLINE: 'Rawline, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

export const GRADIENTS = {
  GOVBR_BACKGROUND: 'bg-gradient-to-br from-[#1e3a5f] via-[#2c5282] via-[#553c9a] to-[#6b46c1]',
  CTA_BUTTON: 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
};