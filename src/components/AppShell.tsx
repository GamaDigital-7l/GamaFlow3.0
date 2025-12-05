"use client";

import React, { useState, useEffect } from "react";
import { Menu, LogOut, User, Settings, Notebook, LayoutDashboard, Users, FileText, BarChart3, ListTodo, UserCog, MessageSquare, ClipboardList, Target, Briefcase, DollarSign, Send } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "./SessionContextProvider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Link, Outlet } from "react-router-dom";
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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  finalLogoUrl: string; // Adicionando prop
}

export const AppShell: React.FC = () => {
  // isOpen now controls the state of the menu expanded (modal)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const { user, userRole, clientIds } = useSession(); // Usando clientIds
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  // Efeito para prevenir a rolagem do corpo quando a sidebar está aberta no mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, isMobile]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Erro ao fazer logout.');
    }
  };

  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Usuário';
  const userLastName = user?.user_metadata?.last_name || '';
  const userInitials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  
  const isAdminOrUser = userRole === 'admin' || userRole === 'user';
  const isClientOrEquipe = userRole === 'client' || userRole === 'equipe';
  const firstClientId = clientIds?.[0];
  
  const homeLink = isClientOrEquipe && firstClientId ? `/playbook/${firstClientId}` : "/";
  
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';

  // Calcula a margem esquerda para o conteúdo principal no desktop
  // Sidebar Compacta: 80px (w-20)
  // Sidebar Expandida: 320px (w-80)
  const contentMarginClass = isSidebarOpen ? "md:ml-80" : "md:ml-20"; 

  return (
    <div className="flex w-full bg-background"> {/* Removido min-h-screen */}
      
      {/* Sidebar (Compacta no Desktop, Modal no Mobile/Expandido) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} finalLogoUrl={finalLogoUrl} />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex flex-col flex-grow transition-all duration-300 ease-in-out w-full overflow-x-hidden min-h-screen", // Adicionado min-h-screen de volta ao main
          // Aplica a margem dinâmica apenas no desktop
          !isMobile && contentMarginClass
        )}
      >
        
        {/* Header/Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
          
          <div className="flex items-center space-x-4">
            
            {/* Menu Button (Visível para Admin/User/Equipe) */}
            {(!isClientOrEquipe || userRole === 'equipe') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            {/* Logo do App (Link para Dashboard ou Playbook) - AGORA USA finalLogoUrl */}
            <Link to={homeLink} className={cn(
              "h-8 flex items-center transition-opacity hover:opacity-80",
            )}>
              {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
                <img 
                  src={finalLogoUrl} 
                  alt="Logo" 
                  className="h-full w-auto object-contain" 
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

        {/* Content Wrapper - Adicionando padding */}
        <div className="p-4 md:p-8"> 
          <Outlet />
        </div>
      </main>
    </div>
  );
};