/**
 * DynamicBreadcrumbs - Breadcrumbs Dinâmicos
 *
 * Gera breadcrumbs automaticamente baseado na rota atual.
 * Suporta rotas personalizadas e tradução de nomes.
 */

import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Home } from 'lucide-react';

// Mapa de traduções para nomes de rotas
const routeNames: Record<string, string> = {
  '/': 'Início',
  '/dashboard': 'Dashboard',
  '/documentos': 'Documentos',
  '/analise': 'Análise',
  '/comissoes': 'Comissões',
  '/qa': 'QA',
  '/classification': 'Classificação',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil',
  '/ajuda': 'Ajuda'
};

// Função para obter nome legível de um segmento
function getSegmentName(segment: string): string {
  // Primeiro, tenta buscar no mapa
  const mapped = routeNames[`/${segment}`];
  if (mapped) return mapped;

  // Se não encontrar, formata o segmento
  // Remove hífens e capitaliza
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function DynamicBreadcrumbs() {
  const location = useLocation();

  // Divide o pathname em segmentos
  const pathSegments = location.pathname
    .split('/')
    .filter(segment => segment !== '');

  // Se estiver na home, não mostra breadcrumbs
  if (pathSegments.length === 0) {
    return null;
  }

  // Constrói os breadcrumbs
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const name = getSegmentName(segment);
    const isLast = index === pathSegments.length - 1;

    return {
      path,
      name,
      isLast
    };
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Separador */}
        {breadcrumbs.length > 0 && <BreadcrumbSeparator />}

        {/* Breadcrumb items */}
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!crumb.isLast && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default DynamicBreadcrumbs;
