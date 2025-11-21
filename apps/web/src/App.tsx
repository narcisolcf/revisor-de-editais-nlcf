
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary, ConsoleInterceptor } from "@/components/error";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import DocumentReview from "./pages/DocumentReview";
import DocumentAnalysisPage from "./pages/DocumentAnalysisPage";
import NotFound from "./pages/NotFound";
import QAClassification from "./pages/QAClassification";
import LandingPage from "./pages/LandingPage";
import Comissoes from "./pages/Comissoes";
import Servicos from "./pages/Servicos";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import { initializeApiClient } from "@/lib/api-config";

function App() {
  const queryClient = new QueryClient();

  // Inicializa API Client com interceptors e retry logic
  useEffect(() => {
    initializeApiClient();
  }, []);

  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Future: Send to monitoring service
    console.error('🚨 Global Error Caught:', { error, errorInfo });
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <ConsoleInterceptor />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/servicos" element={<Servicos />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="/contato" element={<Contato />} />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Navigate to="/documentos" replace />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/documentos" 
                  element={
                    <ProtectedRoute>
                      <DocumentReview />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/analise" 
                  element={
                    <ProtectedRoute>
                      <DocumentAnalysisPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/qa/classification" 
                  element={
                    <ProtectedRoute requiredRole="analyst">
                      <QAClassification />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/comissoes" 
                  element={
                    <ProtectedRoute>
                      <Comissoes />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
