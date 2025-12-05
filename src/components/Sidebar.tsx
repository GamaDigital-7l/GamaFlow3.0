import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Menu,
  X,
  ListTodo,
  UserCog,
  Settings,
  MessageSquare,
  ClipboardList,
  Target,
  Briefcase, // Import Briefcase for CRM
  DollarSign, // Import DollarSign for Financeiro
  Send, // Using Send for Propostas
  Notebook, // Import Notebook for Notes
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "./SessionContextProvider";
import { useIsMobile } from "@/hooks/use-mobile"; // Importando o hook useIsMobile
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Importando Avatar

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  finalLogoUrl: string; // NEW
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'user', 'equipe'], isMain: true },
  { name: "Tarefas", href: "/tasks", icon: ListTodo, roles: ['admin', 'user', 'equipe'], isMain: false },
  { name: "Clientes", href: "/clients", icon: Users, roles: ['admin'], isMain: true },
  { name: "CRM", href: "/crm", icon: Briefcase, roles: ['admin'], isMain: true },
  { name: "Propostas", href: "/proposals", icon: Send, roles: ['admin'], isMain: false },
  { name: "Briefings", href: "/briefings", icon: ClipboardList, roles: ['admin'], isMain: false },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, roles: ['admin'], isMain: true },
  { name: "Metas", href: "/goals", icon: Target, roles: ['admin', 'user', 'equipe'], isMain: false },
  { name: "Feedbacks", href: "/admin/feedback", icon: MessageSquare, roles: ['admin'], isMain: false },
  { name: "Relatórios", href: "/reports", icon: BarChart3, roles: ['admin'], isMain: false },
  { name: "Gerenciar Usuários", href: "/admin/users", icon: UserCog, roles: ['admin'], isMain: false },
  { name: "Configurações App", href: "/admin/settings", icon: Settings, roles: ['admin'], isMain: false },
  { name: "Anotações", href: "/notes", icon: Notebook, roles: ['admin', 'user', 'equipe'], isMain: true }, // Adicionando Anotações
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, finalLogoUrl }) => {
  const { user, userRole, clientIds } = useSession(); // Get user details and clientIds
  const location = useLocation(); // Use useLocation to check active path
  const isMobile = useIsMobile(); // Usando o hook para detectar mobile
  
  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  
  const mainItems = filteredNavItems.filter(item => item.isMain);
  const secondaryItems = filteredNavItems.filter(item => !item.isMain);
  
  const userFirstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'U';
  const userLastName = user?.user_metadata?.last_name || '';
  const userInitials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  
  const isClientOrEquipe = userRole === 'client' || userRole === 'equipe';
  const firstClientId = clientIds?.[0];
  const homeLink = isClientOrEquipe && firstClientId ? `/playbook/${firstClientId}` : "/";
  
  // Renderiza um item de navegação
  const renderNavItem = (item: typeof navItems[0], isExpanded: boolean) => (
    <Link
      key={item.name}
      to={item.href}
      className={cn(
        "flex items-center p-3 rounded-lg transition-colors duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        location.pathname.startsWith(item.href)
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
          : "text-sidebar-foreground",
        isExpanded ? "justify-start" : "justify-center"
      )}
      onClick={() => setIsOpen(false)} // Close on click
      title={item.name} // Adiciona o nome como tooltip
    >
      <item.icon className={cn("h-5 w-5", isExpanded && "mr-3")} /> 
      {isExpanded && <span>{item.name}</span>}
    </Link>
  );

  // Renderiza a barra lateral no modo COMPACTO (Desktop)
  const renderCompactSidebar = () => {
    const clientPlaybookLink = firstClientId ? `/playbook/${firstClientId}` : '/login';
    
    return (
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex-shrink-0",
          "w-20 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
          "hidden md:flex flex-col p-4 space-y-4", // Apenas desktop
          // Se o menu expandido estiver aberto, esconde a barra compacta
          isOpen && "hidden" 
        )}
      >
        {/* Logo Compacto (Usando favicon.svg) */}
        <div className="flex justify-center mb-4">
          <Link to="/" title="Dashboard" className="h-10 w-10 flex items-center justify-center">
            <img 
              src="/favicon.svg" 
              alt="Logo" 
              className="max-h-full max-w-full object-contain" 
            />
          </Link>
        </div>
        
        {/* Itens Principais */}
        <nav className="flex flex-col space-y-2">
          {mainItems.map(item => renderNavItem(item, false))}
          
          {/* Link do Playbook para Clientes/Equipe (se for o caso) */}
          {isClientOrEquipe && (
              <Link
                  to={clientPlaybookLink}
                  className={cn(
                      "flex items-center p-3 rounded-lg transition-colors duration-200 justify-center",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      location.pathname.startsWith('/playbook')
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                          : "text-sidebar-foreground",
                  )}
                  title="Portal do Cliente"
              >
                  <FileText className="h-5 w-5" />
              </Link>
          )}
          
          {/* Botão para Abrir Menu Completo (Apenas para Admin/User/Equipe) */}
          {(!isClientOrEquipe || userRole === 'equipe') && (
              <Button
                  variant="ghost"
                  size="icon"
                  className="text-sidebar-foreground hover:bg-sidebar-accent mt-4"
                  onClick={() => setIsOpen(true)}
                  title="Menu Completo"
              >
                  <Menu className="h-6 w-6" />
              </Button>
          )}
        </nav>
      </aside>
    );
  };

  // Renderiza a barra lateral no modo EXPANDIDO (Mobile ou Modal Desktop)
  const renderExpandedSidebar = () => {
    const clientPlaybookLink = firstClientId ? `/playbook/${firstClientId}` : '/login';
    const isExpandedView = isOpen; // Renomeado para clareza

    return (
      <>
        {/* Overlay para Mobile/Modal Desktop */}
        {isExpandedView && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden" // Esconde o overlay no desktop
            onClick={() => setIsOpen(false)}
          />
        )}
        
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
            "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
            isMobile ? "w-64" : "w-80", // Largura maior no modo expandido
            isExpandedView ? "translate-x-0" : "-translate-x-full",
            // No desktop, o menu expandido é fixo na posição 0, mas só aparece se isOpen for true
            !isMobile && "md:left-0 md:flex md:flex-col md:p-4 md:space-y-4" 
          )}
        >
          <div className="flex h-full flex-col p-4">
            {/* Header e Close Button */}
            <div className="flex items-center justify-between mb-6">
              {/* Logo Expandido (Usando finalLogoUrl) */}
              <Link to="/" title="Dashboard" className="h-10 flex items-center transition-opacity hover:opacity-80">
                {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
                  <img 
                    src={finalLogoUrl} 
                    alt="Logo" 
                    className="h-full w-auto object-contain" 
                  />
                ) : (
                  <h2 className="text-xl font-bold text-dyad-500">Gama Creative</h2>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navegação Completa */}
            <nav className="flex-grow space-y-2 overflow-y-auto">
              {filteredNavItems.map((item) => renderNavItem(item, true))}
              
              {isClientOrEquipe && (
                  <Link
                      to={clientPlaybookLink}
                      className={cn(
                          "flex items-center p-3 rounded-lg transition-colors duration-200 justify-start",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          location.pathname.startsWith('/playbook')
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                              : "text-sidebar-foreground",
                      )}
                      onClick={() => setIsOpen(false)}
                      title="Portal do Cliente"
                  >
                      <FileText className="h-5 w-5 mr-3" />
                      <span>Portal do Cliente</span>
                  </Link>
              )}
            </nav>
          </div>
        </aside>
      </>
    );
  };

  // Lógica de renderização:
  // 1. Se for mobile, renderiza apenas o modal expandido (controlado por `isOpen`).
  if (isMobile) {
    return renderExpandedSidebar();
  }
  
  // 2. Se for desktop:
  return (
    <>
      {/* Renderiza o modo compacto (se o expandido estiver fechado) */}
      {!isOpen && renderCompactSidebar()}
      
      {/* Renderiza o modo expandido (se estiver aberto) */}
      {isOpen && renderExpandedSidebar()}
    </>
  );
};