import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Home, FileText, MessageSquare, Users, Settings, Loader2, 
  AlertTriangle, CheckCircle, Image, Link as LinkIcon, Lock, Clock, Plus, Menu, X, Folder, ClipboardList 
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
import MediaPage from '../../pages/playbook/MediaPage'; // Importando MediaPage
import { useIsMobile } from '@/hooks/use-mobile'; 

type PlaybookSection = 
  'briefing' | 'pending_approval' | 'approved_materials' | 
  'visual_identity' | 'useful_links' | 'logins' | 'demand_history' | 
  'request_demand' | 'contracts' | 'media' | 'onboarding'; // Adicionado 'onboarding'

interface PlaybookLayoutProps {
  clientId: string;
}

// Componente de Onboarding (para clientes)
const ClientOnboardingPage: React.FC<{ clientId: string }> = ({ clientId }) => {
  // Importa o componente OnboardingPage diretamente
  const OnboardingPage = React.lazy(() => import('../../pages/OnboardingPage'));
  return (
    <React.Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />}>
      <OnboardingPage />
    </React.Suspense>
  );
};


const sectionComponents: Record<PlaybookSection, React.FC<{ clientId: string }>> = {
  onboarding: ClientOnboardingPage, // Usando o novo componente
  pending_approval: PendingApprovalPage,
  approved_materials: ApprovedMaterialsPage,
  request_demand: RequestDemandPage,
  demand_history: DemandHistoryPage,
  visual_identity: VisualIdentityPage,
  media: MediaPage,
  useful_links: LinksPage,
  logins: LoginsPage,
  contracts: ContractsPage,
  briefing: PlaybookBriefingSection,
};

const navItems: { id: PlaybookSection; label: string; icon: React.ElementType }[] = [
  { id: 'onboarding', label: 'Checklist Inicial', icon: ClipboardList }, // Novo item de navegação
  { id: 'pending_approval', label: 'Material para Aprovação', icon: AlertTriangle },
  { id: 'approved_materials', label: 'Materiais Aprovados', icon: CheckCircle },
  { id: 'request_demand', label: 'Solicitar Nova Demanda', icon: Plus },
  { id: 'demand_history', label: 'Histórico de Demandas', icon: Clock },
  { id: 'visual_identity', label: 'Identidade Visual', icon: Image },
  { id: 'media', label: 'Mídias e Drives', icon: Folder },
  { id: 'useful_links', label: 'Links Úteis', icon: LinkIcon },
  { id: 'logins', label: 'Logins', icon: Lock },
  { id: 'contracts', label: 'Contratos', icon: FileText },
  { id: 'briefing', label: 'Briefing', icon: FileText }, 
];

export const PlaybookLayout: React.FC<PlaybookLayoutProps> = ({ clientId }) => {
  // Definindo 'onboarding' como a seção inicial
  const [activeSection, setActiveSection] = useState<PlaybookSection>('onboarding');
  const [isPlaybookSidebarOpen, setIsPlaybookSidebarOpen] = useState(false); 
  const { getClientById, isLoading } = useClientStore();
  const isMobile = useIsMobile(); 

  const client = getClientById(clientId);

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
        isMobile ? "fixed inset-y-0 left-0 z-40 w-full transform transition-transform duration-300 ease-in-out" : "relative", // Mobile overlay
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
              className="justify-start"
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
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaybookSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        )}
        {/* Renderiza o componente da seção ativa, passando o clientId */}
        <ActiveComponent clientId={clientId} />
      </main>
    </div>
  );
};