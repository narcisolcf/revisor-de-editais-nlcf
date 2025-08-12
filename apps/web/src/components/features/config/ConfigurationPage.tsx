/**
 * LicitaReview - Configuration Page
 * 
 * 🚀 CORE DIFFERENTIATOR: Main interface for managing organizational
 * analysis parameters, custom rules, and templates.
 */

import React, { useState } from 'react';
import { Save, RefreshCw, AlertCircle, CheckCircle, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { ParameterWeights } from './ParameterWeights';
import { CustomRulesEditor } from './CustomRulesEditor';
import { TemplateManager } from './TemplateManager';
import { PresetSelector } from './PresetSelector';
import { ConfigPreview } from './ConfigPreview';

import { useConfig } from '@/app/providers/ConfigProvider';
import { useAuth } from '@/app/providers/AuthProvider';

/**
 * Configuration Page Component
 * 
 * 🚀 CORE FEATURE: Allows organizations to customize their analysis
 * parameters, including:
 * - Analysis weights (structural, legal, clarity, ABNT)
 * - Custom validation rules with regex patterns
 * - Document templates for different types
 * - Preset configurations for different org types
 */
export const ConfigurationPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    currentConfig, 
    isLoading, 
    error, 
    isDirty, 
    saveConfig, 
    resetConfig 
  } = useConfig();
  
  const [activeTab, setActiveTab] = useState('weights');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSave = async () => {
    try {
      await saveConfig();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      resetConfig();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load configuration: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!currentConfig) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No configuration found for your organization. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Analysis Configuration
            </h1>
            <p className="text-muted-foreground">
              Customize analysis parameters for <strong>{currentConfig.organizationName}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="px-3">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={!isDirty}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={!isDirty}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {currentConfig.isActive && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            This configuration is currently <strong>active</strong> and being used 
            for document analysis in your organization.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration Tabs */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="weights">Analysis Weights</TabsTrigger>
              <TabsTrigger value="rules">Custom Rules</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>

            {/* Analysis Weights Tab - 🚀 CORE FEATURE */}
            <TabsContent value="weights">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Weight Configuration</CardTitle>
                  <CardDescription>
                    🚀 <strong>Core Differentiator:</strong> Customize the importance 
                    of each analysis category for your organization. Weights must sum to 100%.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ParameterWeights />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Custom Rules Tab */}
            <TabsContent value="rules">
              <Card>
                <CardHeader>
                  <CardTitle>Custom Validation Rules</CardTitle>
                  <CardDescription>
                    Define organization-specific rules using regex patterns 
                    to validate document content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CustomRulesEditor />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle>Document Templates</CardTitle>
                  <CardDescription>
                    Manage templates for different document types to ensure 
                    consistent structure and content.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TemplateManager />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Presets Tab */}
            <TabsContent value="presets">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Presets</CardTitle>
                  <CardDescription>
                    Quick setup using predefined configurations optimized 
                    for different organization types.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PresetSelector />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Configuration Preview Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ConfigPreview />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPage;