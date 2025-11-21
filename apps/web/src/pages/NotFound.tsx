import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md px-6">
        {/* 404 Animation */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 animate-pulse">404</h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Página não encontrada
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            A página que você está procurando não existe ou foi movida.
          </p>
          <p className="text-sm text-gray-500 font-mono bg-gray-200 px-3 py-1 rounded inline-block">
            {location.pathname}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <Link to="/">
            <Button className="flex items-center gap-2 w-full">
              <Home className="w-4 h-4" />
              Ir para Home
            </Button>
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600 mb-3">Você pode tentar:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/documentos" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
              Documentos
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/analise" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
              Análise
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
