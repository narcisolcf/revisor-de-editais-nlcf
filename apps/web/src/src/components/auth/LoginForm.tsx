
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { LogIn, Shield, FileCheck, History } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email && password) {
      toast({
        title: t('common.success'),
        description: t('auth.loginSuccess'),
      });
      navigate("/documentos");
    } else {
      toast({
        title: t('common.error'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Features */}
      <div className="w-full lg:w-1/2 bg-gradient-to-br from-government-50 to-government-100 p-8 lg:p-16 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40"
            alt="Government Technology"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        <div className="max-w-xl mx-auto relative z-10">
          <h1 className="text-4xl font-bold text-government-700 mb-4">{t('features.title')}</h1>
          <p className="text-government-600 mb-12">
            {t('features.subtitle')}
          </p>

          <div className="space-y-8">
            <div className="flex items-start space-x-4 bg-white/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="p-2 bg-government-100 rounded-lg">
                <Shield className="h-6 w-6 text-government-500" />
              </div>
              <div>
                <h3 className="font-semibold text-government-700 mb-1">{t('features.advancedSecurity')}</h3>
                <p className="text-government-600">{t('features.advancedSecurityDesc')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="p-2 bg-government-100 rounded-lg">
                <FileCheck className="h-6 w-6 text-government-500" />
              </div>
              <div>
                <h3 className="font-semibold text-government-700 mb-1">{t('features.automaticAnalysis')}</h3>
                <p className="text-government-600">{t('features.automaticAnalysisDesc')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white/80 p-4 rounded-lg backdrop-blur-sm">
              <div className="p-2 bg-government-100 rounded-lg">
                <History className="h-6 w-6 text-government-500" />
              </div>
              <div>
                <h3 className="font-semibold text-government-700 mb-1">{t('features.completeHistory')}</h3>
                <p className="text-government-600">{t('features.completeHistoryDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
            alt="Technology Background"
            className="w-full h-full object-cover opacity-5"
          />
        </div>
        <Card className="w-full max-w-md p-8 space-y-6 relative z-10 bg-white/90 backdrop-blur-sm">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.welcome')}</h2>
            <p className="text-gray-500">{t('auth.welcomeDescription')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-government-500 hover:bg-government-600 text-white">
              <LogIn className="mr-2 h-4 w-4" /> {t('auth.login')}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate("/signup")}
              className="text-government-600 hover:text-government-700 text-sm transition-colors"
            >
              {t('auth.noAccount')}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
