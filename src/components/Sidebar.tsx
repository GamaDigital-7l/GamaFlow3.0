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
  Briefcase,
  DollarSign,
  Send,
  Notebook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "./SessionContextProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean; // Controla se o modo expandido (modal) está aberto
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'user'], isMain: true },
  { name: "Clientes", href: "/clients", icon: Users, roles: ['admin'], isMain: true },
  { name: "CRM", href: "/crm", icon: Briefcase, roles: ['admin'], isMain: true },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign, roles: ['admin'], isMain: true },
  { name: "Anotações", href: "/notes", icon: Notebook, roles: ['admin', 'user'], isMain: true },
  
  // Itens Secundários (Apenas no menu expandido)
  { name: "Tarefas", href: "/tasks", icon: ListTodo, roles: ['admin', 'user'], isMain: false },
  { name: "Propostas", href: "/proposals", icon: Send, roles: ['admin'], isMain: false },
  { name: "Briefings", href: "/briefings", icon: ClipboardList, roles: ['admin'], isMain: false },
  { name: "Metas", href: "/goals", icon: Target, roles: ['admin', 'user'], isMain: false },
  { name: "Feedbacks", href: "/admin/feedback", icon: MessageSquare, roles: ['admin'], isMain: false },
  { name: "Relatórios", href: "/reports", icon: BarChart3, roles: ['admin'], isMain: false },
  { name: "Gerenciar Usuários", href: "/admin/users", icon: UserCog, roles: ['admin'], isMain: false },
  { name: "Configurações App", href: "/admin/settings", icon: Settings, roles: ['admin'], isMain: false },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { userRole, clientId } = useSession();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );
  
  const mainItems = filteredNavItems.filter(item => item.isMain);
  const secondaryItems = filteredNavItems.filter(item => !item.isMain);

  // Se for cliente, o único item principal é o Playbook
  const clientPlaybookLink = clientId ? `/playbook/${clientId}` : '/login';
  const isClient = userRole === 'client';
  
  // O modo de exibição é expandido se estiver no mobile OU se o 'isOpen' for true (no desktop, é o modal)
  const isExpandedView = isMobile || isOpen;
  
  // Renderiza um item de navegação
  const renderNavItem = (item: typeof navItems[0], isExpanded: boolean) => (
    <Link
      key={item.name}
      to={item.href}
      className={cn(
        "flex items-center p-3 rounded-lg transition-colors duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        location.pathname.startsWith(item.href) && item.href !== '/'
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
          : location.pathname === '/' && item.href === '/'
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
          : "text-sidebar-foreground",
        isExpanded ? "justify-start" : "justify-center"
      )}
      onClick={() => isMobile && setIsOpen(false)}
      title={item.name}
    >
      <item.icon className={cn("h-5 w-5", isExpanded && "mr-3")} />
      {isExpanded && <span>{item.name}</span>}
    </Link>
  );

  // Renderiza a barra lateral no modo COMPACTO (Desktop)
  const renderCompactSidebar = () => (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex-shrink-0",
        "w-20 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
        "hidden md:flex flex-col p-4 space-y-4" // Apenas desktop
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