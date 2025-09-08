import { OrganizationConfig, AnalysisWeights, CustomRule, AnalysisPreset } from '@/types/config';

class ConfigService {
  private baseUrl = process.env.VITE_API_URL || 'http://localhost:3001';

  async getCurrentConfig(): Promise<OrganizationConfig> {
    // Mock implementation - replace with actual API call
    return {
      id: '1',
      organizationId: 'org-1',
      weights: {
        structural: 0.2,
        legal: 0.3,
        clarity: 0.2,
        abnt: 0.1,
        budgetary: 0.1,
        formal: 0.05,
        general: 0.05
      },
      customRules: [],
      preset: AnalysisPreset.BALANCED,
      enabledFeatures: ['analysis', 'templates', 'reports'],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateConfig(id: string, config: Partial<OrganizationConfig>): Promise<OrganizationConfig> {
    // Mock implementation - replace with actual API call
    const currentConfig = await this.getCurrentConfig();
    return {
      ...currentConfig,
      ...config,
      updatedAt: new Date()
    };
  }

  async validateWeights(weights: AnalysisWeights): Promise<{ isValid: boolean }> {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    return {
      isValid: Math.abs(total - 1.0) < 0.001
    };
  }

  async testRule(pattern: string, text: string): Promise<{ matches: boolean }> {
    try {
      const regex = new RegExp(pattern, 'i');
      return {
        matches: regex.test(text)
      };
    } catch (error) {
      return {
        matches: false
      };
    }
  }

  async createCustomRule(rule: Omit<CustomRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomRule> {
    return {
      ...rule,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateCustomRule(id: string, rule: Partial<CustomRule>): Promise<CustomRule> {
    // Mock implementation
    return {
      id,
      name: rule.name || 'Rule',
      pattern: rule.pattern || '',
      severity: rule.severity || 'medium',
      category: rule.category || 'general',
      description: rule.description || '',
      enabled: rule.enabled ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async deleteCustomRule(id: string): Promise<void> {
    // Mock implementation
    console.log('Deleting rule:', id);
  }
}

export const configService = new ConfigService();
export { ConfigService };