import React from "react";
import { Link, useLocation } from "react-router-dom"; // Import useLocation
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

  return (
    <>
      {/* Overlay for mobile/tablet/desktop when open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar (Always fixed and off-screen, appears on click) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
          isMobile ? "w-full" : "w-20", // Largura total no mobile, 20 no desktop
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Header and Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dyad-500">GC</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-grow space-y-2">
            {clientNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  // Style for active item (simply checking the route)
                  location.pathname.startsWith(item.href)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground",
                )}
                onClick={() => setIsOpen(false)} // Close on click
              >
                <item.icon className="h-5 w-5 mr-0" /> {/* Removido o espaçamento */}
                {/* Removido o texto */}
              </Link>
            ))}
            
            {/* If it's a client, add a direct link to the Playbook (which is the index route) */}
            {userRole === 'client' && (
                <Link
                    to={clientPlaybookLink} // Use the dynamic clientPlaybookLink
                    className={cn(
                        "flex items-center p-3 rounded-lg transition-colors duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        location.pathname.startsWith('/playbook') // Check if any playbook route is active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                            : "text-sidebar-foreground",
                    )}
                    onClick={() => setIsOpen(false)}
                >
                    <FileText className="h-5 w-5 mr-0" /> {/* Removido o espaçamento */}
                </Link>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};