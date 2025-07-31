
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary, ConsoleInterceptor } from "@/components/error";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import DocumentReview from "./pages/DocumentReview";
import NotFound from "./pages/NotFound";

function App() {
  const queryClient = new QueryClient();

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
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/documentos" element={<DocumentReview />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
