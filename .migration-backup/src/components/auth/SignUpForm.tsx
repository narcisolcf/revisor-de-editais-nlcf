
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Building2, Mail, Lock, UserCheck, ArrowRight } from "lucide-react";
import { validateCNPJ, formatCNPJ } from "@/utils/formatters";

const signUpSchema = z.object({
  prefectureName: z.string().min(1, "Nome da prefeitura é obrigatório"),
  email: z.string().email("Email inválido"),
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos").refine(validateCNPJ, "CNPJ inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUpForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      prefectureName: "",
      email: "",
      cnpj: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      // TODO: Implement actual signup logic with Supabase
      console.log("Dados do cadastro:", data);
      
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Você será redirecionado para a página de login.",
      });
      
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro no cadastro",
        description: "Houve um problema ao criar sua conta. Tente novamente.",
      });
    }
  };

  const handleCnpjChange = (value: string) => {
    const formatted = formatCNPJ(value);
    form.setValue("cnpj", formatted);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-bold text-government-700">
          {t('auth.createAccount')}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {t('auth.createAccountDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="prefectureName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {t('auth.prefectureName')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome da prefeitura" 
                      error={!!form.formState.errors.prefectureName}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('auth.email')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="Digite seu email institucional" 
                      error={!!form.formState.errors.email}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Use o email oficial da prefeitura
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    CNPJ da Prefeitura
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00.000.000/0000-00"
                      error={!!form.formState.errors.cnpj}
                      {...field}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                    />
                  </FormControl>
                  <FormDescription>
                    CNPJ oficial registrado da prefeitura
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('auth.password')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Digite uma senha segura" 
                      error={!!form.formState.errors.password}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Mínimo de 6 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('auth.confirmPassword')}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="Confirme sua senha" 
                      error={!!form.formState.errors.confirmPassword}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              variant="government" 
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Criando conta..." : t('auth.signUp')}
              {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline font-medium"
            >
              Faça login
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
