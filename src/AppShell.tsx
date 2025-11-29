"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Users, FileText, BarChart3, Settings, MessageSquare, ClipboardList, Target, Briefcase, DollarSign, Send, Notebook } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "./SessionContextProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useTheme } from "next-themes";

// Define os itens de navegação com ícones
const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'user'] },
  { name: "Tarefas", href: "/tasks", icon: ListTodo, roles: ['admin', 'user'] },
  { name: "Clientes", href: "/clients", icon: Users, roles: ['admin'] },
  { name: "CRM", href: "/crm", icon: Briefcase, roles: ['admin'] },
  { name: "Propostas", href: "/proposals", icon: Send, roles: ['admin'] },
  { name: "Briefings", href: "/briefings", icon: ClipboardList, roles: ['admin'] },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, roles: ['admin'] },
  { name: "Metas", href: "/goals", icon: Target, roles: ['admin', 'user'] },
  { name: "Feedbacks", href: "/admin/feedback", icon: MessageSquare, roles: ['admin'] },
  { name: "Relatórios", href: "/reports", icon: BarChart3, roles: ['admin'] },
  { name: "Gerenciar Usuários", href: "/admin/users", icon: UserCog, roles: ['admin'] },
  { name: "Configurações App", href: "/admin/settings", icon: Settings, roles: ['admin'] },
  { name: "Anotações", href: "/notes", icon: Notebook, roles: ['admin', 'user'] },
];

export const AppShell: React.FC = () => {
  const { user, userRole, clientId } = useSession();
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  const location = useLocation();
  const isMobile = useIsMobile();

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário';
  const userLastName = user?.user_metadata?.last_name || '';
  const userInitials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  
  const isAdmin = userRole === 'admin';
  const isClient = userRole === 'client';
  
  const homeLink = isClient && clientId ? `/playbook/${clientId}` : "/";
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar (Icon-Based) */}
      <aside className="w-16 flex-shrink-0 bg-card border-r border-border shadow-lg flex flex-col items-center py-4">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center justify-center p-3 rounded-lg transition-colors duration-200",
              "hover:bg-muted hover:text-foreground",
              location.pathname.startsWith(item.href)
                ? "bg-dyad-100 text-dyad-500 shadow-md"
                : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
          </Link>
        ))}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow transition-all duration-300 ease-in-out w-full">
        
        {/* Header/Top Bar (Unified) */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
          
          <div className="flex items-center space-x-4">
            
            {/* Logo do App (Link para Dashboard ou Playbook) */}
            <Link to={homeLink} className={cn(
              "h-8 flex items-center transition-opacity hover:opacity-80",
            )}>
              {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
                <img 
                  src={finalLogoUrl} 
                  alt="Gama Creative Logo" 
                  className="h-full object-contain" 
                />
              ) : (
                <h1 className="text-xl font-bold text-dyad-500">Gama Creative</h1>
              )}
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            
            {/* Ícone de Anotações Pessoais (Notebook) */}
            <Link to="/notes">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Notebook className="h-5 w-5 text-muted-foreground hover:text-dyad-500" />
                </Button>
            </Link>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={userFirstName} />}
                    <AvatarFallback className="bg-dyad-500 text-white text-sm">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userFirstName} {userLastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {userRole && (
                      <p className="text-xs leading-none text-dyad-500 mt-1">
                        Role: {userRole.toUpperCase()}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Wrapper (Ajustando para a regra dos 98% e centralizando) */}
        <main className="flex-grow p-2 md:p-4">
          <div className="w-full max-w-[98vw] mx-auto h-full"> {/* Re-adicionado container mx-auto para largura limitada */}
            <Outlet /> {/* Renders the child route content here */}
          </div>
        </main>
      </div>
    </div>
  );
};