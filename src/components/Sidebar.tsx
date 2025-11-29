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

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

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
  { name: "Anotações", href: "/notes", icon: Notebook, roles: ['admin', 'user'] }, // Adicionando Anotações
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { userRole, clientId } = useSession(); // Get clientId from session
  const location = useLocation(); // Use useLocation to check active path
  const isMobile = useIsMobile(); // Usando o hook para detectar mobile
  
  // Filter navigation items based on role
  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  
  // If it's a client, the only internal navigation is the Profile (which is in the Dropdown)
  // The client's main navigation is the Playbook, which is the index of the protected route.
  const clientNavItems = userRole === 'client' ? [] : filteredNavItems;

  // Determine the client's playbook link
  const clientPlaybookLink = clientId ? `/playbook/${clientId}` : '/login'; // Fallback to login if no client ID

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
      <item.icon className="h-5 w-5 mx-auto" /> 
    </Link>
  );

  // Renderiza a barra lateral no modo COMPACTO (Desktop)
  const renderCompactSidebar = () => (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex-shrink-0",
        "w-20 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
        "hidden md:flex flex-col p-4 space-y-4", // Apenas desktop
        isOpen && "hidden" // Esconde quando o menu expandido está aberto
      )}
    >
      {/* Logo/Título Compacto */}
      <div className="flex justify-center mb-4">
        <h2 className="text-xl font-bold text-dyad-500">GC</h2>
      </div>
      
      {/* Itens Principais */}
      <nav className="flex flex-col space-y-2">
        {mainItems.map(item => renderNavItem(item, false))}
        
        {/* Link do Playbook para Clientes (se for o caso) */}
        {isClient && (
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
        
        {/* Botão para Abrir Menu Completo (Apenas para Admin/User) */}
        {!isClient && (
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

  // Renderiza a barra lateral no modo EXPANDIDO (Mobile ou Modal Desktop)
  const renderExpandedSidebar = () => (
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
          "md:hidden" // Esconde no desktop, pois o modo compacto é fixo
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Header e Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dyad-500">Menu Completo</h2>
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
            
            {isClient && (
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

  // Renderiza o modo compacto no desktop e o modo expandido no mobile
  if (!isMobile) {
    return (
      <>
        {renderCompactSidebar()}
        {/* Renderiza o modal expandido no desktop, mas apenas se isOpen for true */}
        {isOpen && (
            <aside
                className={cn(
                    "fixed inset-y-0 left-20 z-50 transform transition-transform duration-300 ease-in-out",
                    "w-80 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-2xl",
                    "hidden md:flex flex-col p-4 space-y-4"
                )}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-dyad-500">Menu Completo</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-sidebar-foreground hover:bg-sidebar-accent"
                        onClick={() => setIsOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex-grow space-y-2 overflow-y-auto">
                    {filteredNavItems.map((item) => renderNavItem(item, true))}
                </nav>
            </aside>
        )}
      </>
    );
  }
  
  // Renderiza apenas o modo expandido (modal) no mobile
  return renderExpandedSidebar();
};