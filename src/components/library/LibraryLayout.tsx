import React, { useState, useEffect } from "react";
import { Menu, LogOut, User, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import { Link, Outlet } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LibrarySidebar } from "./LibrarySidebar";
import { cn } from "@/lib/utils";

export const LibraryLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useSession();
  const isMobile = useIsMobile();

  // Efeito para controlar o overflow do corpo no mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
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

  return (
    <div className="flex min-h-screen bg-background">
      
      {/* Sidebar (Visível no desktop, overlay no mobile) */}
      <LibrarySidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-grow transition-all duration-300 ease-in-out w-full">
        
        {/* Header/Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
          
          <div className="flex items-center space-x-4">
            {/* Menu Button (Visível no mobile) */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="text-foreground"
              >
                <Menu className="h-6 w-6" />
              </Button>
            )}
            
            <h1 className="text-xl font-bold text-dyad-500">Gama Library</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Botão de Busca (Simulado) */}
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Search className="h-5 w-5 text-muted-foreground hover:text-dyad-500" />
            </Button>
            
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

        {/* Content Wrapper */}
        <main className="flex-grow p-4 md:p-8">
          <div className="w-full max-w-[98vw] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};