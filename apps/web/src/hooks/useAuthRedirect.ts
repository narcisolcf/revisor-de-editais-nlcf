/**
 * useAuthRedirect Hook
 *
 * Gerencia redirects automáticos após login/logout.
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export interface UseAuthRedirectOptions {
  /** Rota para redirecionar após login */
  loginRedirect?: string;
  /** Rota para redirecionar após logout */
  logoutRedirect?: string;
  /** Se deve usar query param 'redirect' */
  useRedirectParam?: boolean;
  /** Lista de rotas públicas que não requerem autenticação */
  publicRoutes?: string[];
}

const DEFAULT_PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

/**
 * Hook para gerenciar redirects de autenticação
 */
export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const {
    loginRedirect = '/dashboard',
    logoutRedirect = '/login',
    useRedirectParam = true,
    publicRoutes = DEFAULT_PUBLIC_ROUTES
  } = options;

  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Não faz nada enquanto está carregando
    if (loading) return;

    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Se usuário está logado e está na página de login
    if (currentUser && location.pathname === '/login') {
      // Verifica se tem redirect param
      const searchParams = new URLSearchParams(location.search);
      const redirectTo = searchParams.get('redirect');

      if (useRedirectParam && redirectTo) {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(loginRedirect, { replace: true });
      }
      return;
    }

    // Se usuário não está logado e não está em páginas públicas
    if (!currentUser && !isPublicRoute) {
      // Salva rota atual para redirect após login
      const from = location.pathname + location.search;
      navigate(`${logoutRedirect}?redirect=${encodeURIComponent(from)}`, {
        replace: true
      });
      return;
    }
  }, [
    currentUser,
    loading,
    location.pathname,
    location.search,
    navigate,
    loginRedirect,
    logoutRedirect,
    useRedirectParam,
    publicRoutes
  ]);
}

/**
 * Hook simplificado para páginas de login
 */
export function useLoginRedirect() {
  return useAuthRedirect({
    loginRedirect: '/dashboard',
    useRedirectParam: true
  });
}

/**
 * Hook simplificado para logout
 */
export function useLogoutRedirect() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return handleLogout;
}

export default useAuthRedirect;
