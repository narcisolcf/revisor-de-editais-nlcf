/**
 * LicitaReview - Main Application Component
 * 
 * This is the root component that handles routing, global state,
 * error boundaries, and app-wide providers.
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';

import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { LoadingFallback } from '@/components/shared/LoadingFallback';
import { AppProvider } from '@/app/providers/AppProvider';

// Lazy load pages for better performance
const LandingPage = React.lazy(() => import('@/pages/LandingPage'));
const DocumentReview = React.lazy(() => import('@/pages/DocumentReview'));
const ConfigurationPage = React.lazy(() => import('@/pages/ConfigurationPage'));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * App Component
 * 
 * Features:
 * - React Query for server state management
 * - Error boundaries for graceful error handling
 * - Lazy loading for code splitting
 * - Toast notifications
 * - Development tools in dev mode
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <Router>
            <div className="min-h-screen bg-background font-sans antialiased">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  
                  {/* Protected Routes */}
                  <Route path="/review" element={<DocumentReview />} />
                  <Route path="/config" element={<ConfigurationPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  
                  {/* Redirects */}
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/analysis" element={<Navigate to="/review" replace />} />
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
          
          {/* Global UI Components */}
          <Toaster 
            position="top-right"
            expand={true}
            richColors
            closeButton
          />
          
          {/* Development Tools */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;