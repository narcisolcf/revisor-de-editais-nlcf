/**
 * AppSidebar - Navegação Lateral da Aplicação
 *
 * Sidebar com menu de navegação, active states e suporte a roles.
 */

import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LucideIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  requiredRole?: 'admin' | 'manager' | 'analyst' | 'user';
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    title: 'Documentos',
    href: '/documentos',
    icon: FileText
  },
  {
    title: 'Análise',
    href: '/analise',
    icon: BarChart3
  },
  {
    title: 'Comissões',
    href: '/comissoes',
    icon: Users
  },
  {
    title: 'QA Classification',
    href: '/qa/classification',
    icon: Settings,
    requiredRole: 'analyst'
  }
];

const secondaryItems: NavItem[] = [
  {
    title: 'Ajuda',
    href: '/ajuda',
    icon: HelpCircle
  }
];

export function AppSidebar() {
  const location = useLocation();
  const { userProfile } = useAuth();

  // Role hierarchy for checking permissions
  const roleHierarchy = {
    'user': 1,
    'analyst': 2,
    'manager': 3,
    'admin': 4
  };

  const hasPermission = (requiredRole?: NavItem['requiredRole']) => {
    if (!requiredRole || !userProfile) return true;

    const userRoleLevel = roleHierarchy[userProfile.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  const isActive = (href: string) => {
    // Exact match for home/dashboard
    if (href === '/dashboard' || href === '/') {
      return location.pathname === href;
    }
    // Prefix match for other routes
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">LicitaReview</span>
            <span className="text-xs text-muted-foreground">Revisor de Editais</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems
                .filter(item => hasPermission(item.requiredRole))
                .map((item) => {
                  const active = isActive(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                      >
                        <Link to={item.href} className={cn(
                          'flex items-center gap-3',
                          active && 'font-semibold'
                        )}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Suporte</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          v1.0.0 · © 2025 LicitaReview
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
