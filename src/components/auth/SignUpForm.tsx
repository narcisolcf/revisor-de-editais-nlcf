
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { validateCNPJ, formatCNPJ } from "@/utils/formatters";
import { UserPlus, Building, Mail, Lock, FileText } from "lucide-react";

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    prefectureName: "",
    email: "",
    cnpj: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordsDontMatch'),
        variant: "destructive",
      });
      return;
    }

    if (!validateCNPJ(formData.cnpj)) {
      toast({
        title: t('common.error'),
        description: t('auth.invalidCnpj'),
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual signup logic
    toast({
      title: t('common.success'),
      description: t('auth.accountCreatedDesc'),
    });
    navigate("/login");
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setFormData({ ...formData, cnpj: formatted });
  };

  return (
    <Card className="w-full max-w-md p-8 space-y-6 bg-white/80 backdrop-blur-lg border border-gray-100 rounded-xl shadow-lg animate-fadeIn">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">{t('auth.createAccount')}</h2>
        <p className="text-gray-500">{t('auth.createAccountDescription')}</p>
      </div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="relative">
          <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t('auth.prefectureName')}
            value={formData.prefectureName}
            onChange={(e) => setFormData({ ...formData, prefectureName: e.target.value })}
            className="pl-10"
            required
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="email"
            placeholder={t('auth.email')}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pl-10"
            required
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t('auth.cnpj')}
            value={formData.cnpj}
            onChange={handleCnpjChange}
            className="pl-10"
            maxLength={18}
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder={t('auth.password')}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="pl-10"
            required
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            type="password"
            placeholder={t('auth.confirmPassword')}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="pl-10"
            required
          />
        </div>
        <Button type="submit" className="w-full bg-government-500 hover:bg-government-600 text-white">
          <UserPlus className="mr-2 h-4 w-4" /> {t('auth.signUp')}
        </Button>
      </form>
      <div className="text-center">
        <button
          onClick={() => navigate("/login")}
          className="text-government-600 hover:text-government-700 text-sm transition-colors"
        >
          {t('auth.alreadyHaveAccount')}
        </button>
      </div>
    </Card>
  );
}
