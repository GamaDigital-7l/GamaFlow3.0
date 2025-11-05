import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  Folder,
  Tag,
  Settings,
  User,
  X,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionContextProvider";

interface LibrarySidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { name: "Home (Netflix)", href: "/library", icon: Home },
  { name: "Minha Biblioteca", href: "/library/my-books", icon: BookOpen },
  { name: "Coleções", href: "/library/collections", icon: Folder },
  { name: "Categorias", href: "/library/categories", icon: Tag },
  { name: "Estatísticas", href: "/library/stats", icon: LayoutDashboard },
];

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { userRole } = useSession();
  const isAdmin = userRole === 'admin';

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
          "bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-lg",
          "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:translate-x-0 md:flex md:flex-col md:flex-shrink-0" // Desktop: sempre visível
        )}
      >
        <div className="flex h-full flex-col p-4">
          {/* Header e Botão de Fechar (Mobile) */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dyad-500">Gama Library</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent md:hidden"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navegação */}
          <nav className="flex-grow space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center p-3 rounded-lg transition-colors duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  location.pathname.startsWith(item.href) && item.href !== '/library'
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : location.pathname === '/library' && item.href === '/library'
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            
            {/* Links de Configuração e Perfil */}
            <div className="pt-4 border-t border-sidebar-border mt-4 space-y-2">
                <Link
                    to="/profile"
                    className={cn(
                        "flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        location.pathname === '/profile' && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    )}
                    onClick={() => setIsOpen(false)}
                >
                    <User className="h-5 w-5 mr-3" />
                    <span className="font-medium">Perfil</span>
                </Link>
                {isAdmin && (
                    <Link
                        to="/admin/settings"
                        className={cn(
                            "flex items-center p-3 rounded-lg transition-colors duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            location.pathname === '/admin/settings' && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        )}
                        onClick={() => setIsOpen(false)}
                    >
                        <Settings className="h-5 w-5 mr-3" />
                        <span className="font-medium">Configurações Admin</span>
                    </Link>
                )}
            </div>
            
            {/* Link de Volta ao Dashboard Principal (Apenas para Admin/User) */}
            {userRole !== 'client' && (
                <div className="pt-4 border-t border-sidebar-border mt-4">
                    <Link
                        to="/"
                        className="flex items-center p-3 rounded-lg transition-colors duration-200 text-muted-foreground hover:bg-sidebar-accent"
                        onClick={() => setIsOpen(false)}
                    >
                        <LayoutDashboard className="h-5 w-5 mr-3" />
                        <span className="font-medium">Voltar ao Dashboard</span>
                    </Link>
                </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};