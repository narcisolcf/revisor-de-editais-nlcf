/**
 * Exemplo Completo de Uso do API Client
 *
 * Este componente demonstra todos os recursos do sistema de API:
 * - GET com loading imediato
 * - POST com validação
 * - Retry manual
 * - Error handling customizado
 */

import React, { useState } from 'react';
import { useGet, usePost } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
}

interface CreateUserPayload {
  name: string;
  email: string;
}

/**
 * Exemplo 1: GET com loading automático
 */
export function UserListExample() {
  const { data, loading, error, retry } = useGet<User[]>('/api/users', {
    immediate: true, // Carrega automaticamente
    showErrorToast: true
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar usuários</AlertTitle>
        <AlertDescription>
          {error.message}
          <Button
            onClick={retry}
            size="sm"
            variant="outline"
            className="ml-4"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Tentar Novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
        <CardDescription>{data?.length || 0} usuários cadastrados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.map((user) => (
            <div
              key={user.id}
              className="p-4 border rounded-lg hover:bg-accent/50 transition"
            >
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo 2: POST com formulário e validação
 */
export function CreateUserExample() {
  const [formData, setFormData] = useState<CreateUserPayload>({
    name: '',
    email: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { execute, loading, error, data } = usePost<User>('/api/users', {
    onSuccess: (data) => {
      console.log('Usuário criado:', data);
      // Limpa formulário
      setFormData({ name: '', email: '' });
      setValidationErrors({});
    },
    onError: (error) => {
      // Tratamento customizado de erro 422 (validação)
      if (error.status === 422 && error.responseBody) {
        const errors = (error.responseBody as any).errors || {};
        setValidationErrors(errors);
      }
    },
    successMessage: 'Usuário criado com sucesso!',
    showSuccessToast: true,
    showErrorToast: false // Desabilita toast para tratar manualmente
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validação client-side
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = 'Nome é obrigatório';
    if (!formData.email) errors.email = 'Email é obrigatório';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Executa requisição
    await execute({ body: formData });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Usuário</CardTitle>
        <CardDescription>Preencha os dados abaixo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite o nome"
              disabled={loading}
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">{validationErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Digite o email"
              disabled={loading}
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive">{validationErrors.email}</p>
            )}
          </div>

          {/* Erro geral (não de validação) */}
          {error && error.status !== 422 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao criar usuário</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {data && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Usuário criado!</AlertTitle>
              <AlertDescription>
                {data.name} foi adicionado com sucesso.
              </AlertDescription>
            </Alert>
          )}

          {/* Botão */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Usuário'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Exemplo 3: Integração completa com retry e estados
 */
export function CompleteExample() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Exemplos de Uso da API</h1>
        <p className="text-muted-foreground">
          Demonstração de GET, POST, error handling e retry
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UserListExample />
        <CreateUserExample />
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Testar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Sucesso:</strong> Configure a API base URL corretamente no .env
          </p>
          <p>
            <strong>Erro 422:</strong> Tente criar usuário sem preencher os campos
          </p>
          <p>
            <strong>Erro de rede:</strong> Desative sua internet e tente carregar usuários
          </p>
          <p>
            <strong>Retry:</strong> Clique no botão "Tentar Novamente" após um erro
          </p>
          <p>
            <strong>Loading:</strong> Observe os skeletons durante carregamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompleteExample;
