import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, FileText, MessageSquare, Users, Settings, Loader2, 
  AlertTriangle, CheckCircle, Image, Link as LinkIcon, Lock, Clock, Plus, Menu, X, Folder, ClipboardList, LayoutDashboard 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientStore } from '@/hooks/use-client-store';
import { PlaybookBriefingSection } from './PlaybookBriefingSection';
import PendingApprovalPage from '../../pages/playbook/PendingApprovalPage';
import ApprovedMaterialsPage from '../../pages/playbook/ApprovedMaterialsPage';
import VisualIdentityPage from '../../pages/playbook/VisualIdentityPage';
import LinksPage from '../../pages/playbook/LinksPage';
import LoginsPage from '../../pages/playbook/LoginsPage';
import DemandHistoryPage from '../../pages/playbook/DemandHistoryPage';
import RequestDemandPage from '../../pages/playbook/RequestDemandPage';
import ContractsPage from '../../pages/playbook/ContractsPage';
import { useIsMobile } from '@/hooks/use-mobile'; 
import { useSession } from '../SessionContextProvider'; // Importando useSession
import ClientWorkspace from '../kanban/ClientWorkspace'; // Importando o Kanban

type PlaybookSection = 
  'kanban' | 'briefing' | 'pending_approval' | 'approved_materials' | 
  'visual_identity' | 'useful_links' | 'logins' | 'demand_history' | 
  'request_demand' | 'contracts';

interface PlaybookLayoutProps {
  clientId: string;
}

// Componente Wrapper para o Kanban (para manter a interface de props)
const PlaybookKanbanPage: React.FC<{ clientId: string }> = ({ clientId }) => (
    <ClientWorkspace clientId={clientId} />
);

const sectionComponents: Record<PlaybookSection, React.FC<{ clientId: string }>> = {
  kanban: PlaybookKanbanPage, // Novo
  pending_approval: PendingApprovalPage,
  approved_materials: ApprovedMaterialsPage,
  request_demand: RequestDemandPage,
  demand_history: DemandHistoryPage,
  visual_identity: VisualIdentityPage,
  useful_links: LinksPage,
  logins: LoginsPage,
  contracts: ContractsPage,
  briefing: PlaybookBriefingSection,
};

const baseNavItems: { id: PlaybookSection; label: string; icon: React.ElementType, roles: string[] }[] = [
  // Kanban visível apenas para Equipe
  { id: 'kanban', label: 'Kanban do Cliente', icon: LayoutDashboard, roles: ['equipe'] }, 
  
  // Itens para Cliente/Equipe
  { id: 'pending_approval', label: 'Material para Aprovação', icon: AlertTriangle, roles: ['client', 'equipe'] },
  { id: 'approved_materials', label: 'Materiais Aprovados', icon: CheckCircle, roles: ['client', 'equipe'] },
  { id: 'request_demand', label: 'Solicitar Nova Demanda', icon: Plus, roles: ['client', 'equipe'] },
  { id: 'demand_history', label: 'Histórico de Demandas', icon: Clock, roles: ['client', 'equipe'] },
  { id: 'briefing', label: 'Briefing', icon: FileText, roles: ['client', 'equipe'] }, 
  
  // Itens para Equipe (e talvez Cliente, dependendo da permissão)
  { id: 'visual_identity', label: 'Identidade Visual', icon: Image, roles: ['client', 'equipe'] },
  { id: 'useful_links', label: 'Links Úteis', icon: LinkIcon, roles: ['client', 'equipe'] },
  { id: 'logins', label: 'Logins', icon: Lock, roles: ['client', 'equipe'] },
  { id: 'contracts', label: 'Contratos', icon: FileText, roles: ['client', 'equipe'] },
];

export const PlaybookLayout: React.FC<PlaybookLayoutProps> = ({ clientId }) => {
  const { userRole } = useSession();
  // Definindo 'pending_approval' como a seção inicial, a menos que seja equipe, que deve ver o kanban
  const initialSection: PlaybookSection = userRole === 'equipe' ? 'kanban' : 'pending_approval';
  
  const [activeSection, setActiveSection] = useState<PlaybookSection>(initialSection);
  const [isPlaybookSidebarOpen, setIsPlaybookSidebarOpen] = useState(false); 
  const { getClientById, isLoading } = useClientStore();
  const isMobile = useIsMobile(); 

  const client = getClientById(clientId);
  
  // Filtra itens de navegação baseados na role
  const navItems = baseNavItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Loader2 className="h-10 w-10 animate-spin text-dyad-500" />
      </div>
    );
  }

  if (!client) {
    return <div className="p-8 text-center text-red-500">Cliente não encontrado.</div>;
  }

  const ActiveComponent = sectionComponents[activeSection];

  return (
    <div className="flex h-full bg-muted/40">
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isPlaybookSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50"
          onClick={() => setIsPlaybookSidebarOpen(false)}
        />
      )}

      {/* Sidebar de Navegação do Playbook */}
      <aside className={cn(
        "flex-shrink-0 bg-card border-r p-4 flex flex-col",
        "md:w-64", // Desktop width
        isMobile ? "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out" : "relative", // Mobile overlay
        isMobile && (isPlaybookSidebarOpen ? "translate-x-0" : "-translate-x-full"), // Mobile toggle
      )}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{client.name}</h2>
          {isMobile && ( // Close button for mobile sidebar
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaybookSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">Portal do Cliente</p> 
        <nav className="flex flex-col space-y-2 flex-grow overflow-y-auto"> 
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "justify-start",
                activeSection === item.id && "bg-dyad-500 text-white hover:bg-dyad-600" // Destaque Dyad Pink
              )}
              onClick={() => {
                setActiveSection(item.id);
                if (isMobile) setIsPlaybookSidebarOpen(false); 
              }}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8"> 
        {isMobile && ( // Hamburger menu button for mobile
          <div className="flex justify-start mb-4">
            <Button
              variant="outline" // Usando outline para ser mais visível
              size="sm"
              onClick={() => setIsPlaybookSidebarOpen(true)}
              className="text-dyad-500 border-dyad-500/50"
            >
              <Menu className="h-5 w-5 mr-2" /> Menu
            </Button>
          </div>
        )}
        {/* Renderiza o componente da seção ativa, passando o clientId */}
        <ActiveComponent clientId={clientId} />
      </main>
    </div>
  );
};