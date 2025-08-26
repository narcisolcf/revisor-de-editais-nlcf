/**
 * LicitaReview - App Provider
 * 
 * Centralizes all application providers for better organization
 * and easier testing.
 */

import React from 'react';
import { AuthProvider } from './AuthProvider';
import { ConfigProvider } from './ConfigProvider';
import { AnalysisProvider } from './AnalysisProvider';
import { ThemeProvider } from './ThemeProvider';

interface AppProviderProps {
  children: React.ReactNode;
}

/**
 * App Provider Component
 * 
 * Provides all necessary context providers for the application:
 * - Theme context (light/dark mode)
 * - Authentication context
 * - Configuration context (organizational settings)
 * - Analysis context (document analysis state)
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfigProvider>
          <AnalysisProvider>
            {children}
          </AnalysisProvider>
        </ConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default AppProvider;