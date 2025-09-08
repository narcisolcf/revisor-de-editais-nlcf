/**
 * LicitaReview - Configuration Provider
 * 
 * 🚀 CORE DIFFERENTIATOR: Manages organizational configuration
 * including personalized analysis parameters, custom rules,
 * and templates.
 */

import React, { createContext, useContext, useReducer } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  OrganizationConfig,
  AnalysisWeights,
  CustomRule,
  AnalysisPreset
} from '@/types/config';
import { configService } from '@/services/configService';
import { useAuth } from './AuthProvider';

// Configuration State
interface ConfigState {
  currentConfig: OrganizationConfig | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
}

// Configuration Actions
type ConfigAction = 
  | { type: 'SET_CONFIG'; payload: OrganizationConfig }
  | { type: 'UPDATE_WEIGHTS'; payload: AnalysisWeights }
  | { type: 'ADD_RULE'; payload: CustomRule }
  | { type: 'UPDATE_RULE'; payload: { id: string; rule: Partial<CustomRule> } }
  | { type: 'REMOVE_RULE'; payload: string }
  | { type: 'SET_PRESET'; payload: AnalysisPreset }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'MARK_SAVED' };

// Configuration Context
interface ConfigContextType {
  state: ConfigState;
  currentConfig: OrganizationConfig | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  
  // Configuration Actions
  // eslint-disable-next-line no-unused-vars
  updateWeights: (weights: AnalysisWeights) => void;
  // eslint-disable-next-line no-unused-vars
  addCustomRule: (rule: CustomRule) => void;
  // eslint-disable-next-line no-unused-vars
  updateCustomRule: (id: string, rule: Partial<CustomRule>) => void;
  // eslint-disable-next-line no-unused-vars
  removeCustomRule: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  setPreset: (preset: AnalysisPreset) => void;
  saveConfig: () => Promise<void>;
  resetConfig: () => void;
  // eslint-disable-next-line no-unused-vars
  validateWeights: (weights: AnalysisWeights) => Promise<boolean>;
  // eslint-disable-next-line no-unused-vars
  testRule: (pattern: string, text: string) => Promise<boolean>;
  
  // Utility functions
  // eslint-disable-next-line no-unused-vars
  getPresetWeights: (preset: AnalysisPreset) => AnalysisWeights;
  // eslint-disable-next-line no-unused-vars
  calculateWeightedScore: (baseScores: Record<string, number>) => number;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Configuration Reducer
const configReducer = (state: ConfigState, action: ConfigAction): ConfigState => {
  switch (action.type) {
    case 'SET_CONFIG':
      return {
        ...state,
        currentConfig: action.payload,
        isLoading: false,
        error: null,
        isDirty: false,
        lastSaved: new Date(),
      };

    case 'UPDATE_WEIGHTS':
      if (!state.currentConfig) return state;
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          weights: action.payload,
        },
        isDirty: true,
      };

    case 'ADD_RULE':
      if (!state.currentConfig) return state;
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          customRules: [...state.currentConfig.customRules, action.payload],
        },
        isDirty: true,
      };

    case 'UPDATE_RULE':
      if (!state.currentConfig) return state;
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          customRules: state.currentConfig.customRules.map(rule =>
            rule.id === action.payload.id 
              ? { ...rule, ...action.payload.rule }
              : rule
          ),
        },
        isDirty: true,
      };

    case 'REMOVE_RULE':
      if (!state.currentConfig) return state;
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          customRules: state.currentConfig.customRules.filter(
            rule => rule.id !== action.payload
          ),
        },
        isDirty: true,
      };

    case 'SET_PRESET':
      if (!state.currentConfig) return state;
      return {
        ...state,
        currentConfig: {
          ...state.currentConfig,
          preset: action.payload,
          weights: getPresetWeights(action.payload),
        },
        isDirty: true,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload };

    case 'MARK_SAVED':
      return { 
        ...state, 
        isDirty: false, 
        lastSaved: new Date(),
        error: null 
      };

    default:
      return state;
  }
};

// Helper function to get preset weights
const getPresetWeights = (preset: AnalysisPreset): AnalysisWeights => {
  const presetWeights = {
    [AnalysisPreset.STRICT]: { structural: 0.15, legal: 0.6, clarity: 0.2, abnt: 0.05, budgetary: 0, formal: 0, general: 0 },
    [AnalysisPreset.BALANCED]: { structural: 0.2, legal: 0.3, clarity: 0.2, abnt: 0.1, budgetary: 0.1, formal: 0.05, general: 0.05 },
    [AnalysisPreset.LENIENT]: { structural: 0.25, legal: 0.25, clarity: 0.25, abnt: 0.25, budgetary: 0, formal: 0, general: 0 },
    [AnalysisPreset.CUSTOM]: { structural: 0.25, legal: 0.25, clarity: 0.25, abnt: 0.25, budgetary: 0, formal: 0, general: 0 },
  };
  return presetWeights[preset];
};

// Initial state
const initialState: ConfigState = {
  currentConfig: null,
  isLoading: true,
  error: null,
  isDirty: false,
  lastSaved: null,
};

/**
 * Configuration Provider Component
 * 
 * 🚀 CORE DIFFERENTIATOR: Provides organizational configuration
 * management for personalized analysis parameters.
 */
export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, dispatch] = useReducer(configReducer, initialState);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current organization config
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['config', 'current', user?.uid],
    queryFn: () => configService.getCurrentConfig(),
    enabled: !!user?.uid,


  });

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: (config: OrganizationConfig) => 
      configService.updateConfig(config.id, config),
    onSuccess: (savedConfig) => {
      dispatch({ type: 'SET_CONFIG', payload: savedConfig });
      queryClient.invalidateQueries({ queryKey: ['config'] });
      toast.success('Configuration saved successfully');
    },
    onError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast.error('Failed to save configuration');
    },
  });

  // Validate weights mutation
  const validateWeightsMutation = useMutation({
    mutationFn: (weights: AnalysisWeights) => 
      configService.validateWeights(weights),
  });

  // Test rule mutation
  const testRuleMutation = useMutation({
    mutationFn: ({ pattern, text }: { pattern: string; text: string }) => 
      configService.testRule(pattern, text),
  });

  // Context value
  const contextValue: ConfigContextType = {
    state,
    currentConfig: state.currentConfig,
    isLoading: isLoading || state.isLoading,
    error: error?.message || state.error,
    isDirty: state.isDirty,

    // Configuration Actions
    updateWeights: (weights: AnalysisWeights) => {
      dispatch({ type: 'UPDATE_WEIGHTS', payload: weights });
    },

    addCustomRule: (rule: CustomRule) => {
      dispatch({ type: 'ADD_RULE', payload: rule });
    },

    updateCustomRule: (id: string, rule: Partial<CustomRule>) => {
      dispatch({ type: 'UPDATE_RULE', payload: { id, rule } });
    },

    removeCustomRule: (id: string) => {
      dispatch({ type: 'REMOVE_RULE', payload: id });
    },

    setPreset: (preset: AnalysisPreset) => {
      dispatch({ type: 'SET_PRESET', payload: preset });
    },

    saveConfig: async () => {
      if (!state.currentConfig) {
        throw new Error('No configuration to save');
      }
      await saveConfigMutation.mutateAsync(state.currentConfig);
    },

    resetConfig: () => {
      if (config) {
        dispatch({ type: 'SET_CONFIG', payload: config });
      }
    },

    validateWeights: async (weights: AnalysisWeights): Promise<boolean> => {
      const result = await validateWeightsMutation.mutateAsync(weights);
      return (result as any).isValid;
    },

    testRule: async (pattern: string, text: string): Promise<boolean> => {
      const result = await testRuleMutation.mutateAsync({ pattern, text });
      return (result as any).matches;
    },

    // Utility functions
    getPresetWeights,

    calculateWeightedScore: (baseScores: Record<string, number>): number => {
      if (!state.currentConfig) return 0;
      const weights = state.currentConfig.weights;
      return (
        (baseScores.structural * weights.structural / 100) +
        (baseScores.legal * weights.legal / 100) +
        (baseScores.clarity * weights.clarity / 100) +
        (baseScores.abnt * weights.abnt / 100)
      );
    },
  };

  return (
    <ConfigContext.Provider value={contextValue}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Hook to use Configuration Context
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export default ConfigProvider;