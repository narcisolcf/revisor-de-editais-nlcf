/**
 * AppLayout - Layout Principal da Aplicação
 *
 * Layout responsivo com sidebar navigation para páginas protegidas.
 * Inclui header, sidebar colapsável e área de conteúdo principal.
 */

import * as React from 'react';
import { Outlet } from 'react-router-dom';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { DynamicBreadcrumbs } from './DynamicBreadcrumbs';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AppLayout() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    return currentUser?.email?.substring(0, 2).toUpperCase() || '??';
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />

          {/* Breadcrumbs */}
          <div className="flex-1">
            <DynamicBreadcrumbs />
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md p-2 hover:bg-accent">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">
                    {userProfile?.displayName || currentUser?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {userProfile?.role || 'user'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/configuracoes')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AppLayout;
