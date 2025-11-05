import React, { useEffect, useState } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ClientWorkspace } from '@/components/kanban/ClientWorkspace';
import { useClientStore } from '@/hooks/use-client-store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Loader2, Edit, ClipboardList, MessageSquare, Notebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { ClientInteractionsHistory } from '@/components/ClientInteractionsHistory';
import ClientNotesSection from '@/components/ClientNotesSection';
import OnboardingConfigPage from './playbook/OnboardingConfigPage'; // Importando OnboardingConfigPage

const navItems = [
  { path: '', title: 'Kanban', icon: LayoutDashboard, roles: ['admin'] },
  { path: 'interacoes', title: 'Interações', icon: MessageSquare, roles: ['admin'] },
  { path: 'notas', title: 'Notas', icon: Notebook, roles: ['admin'] },
  { path: 'onboarding-config', title: 'Onboarding', icon: ClipboardList, roles: ['admin'] }, // NOVO ITEM
];

const ClientWorkspacePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  // Usamos isLoading diretamente do store
  const { getClientById, isLoading: isLoadingClientStore } = useClientStore(); 
  const { userRole, isLoading: isLoadingSession } = useSession();
  
  const client = getClientById(clientId || '');
  
  // Removemos isInitialLoadComplete, confiando nos hooks de carregamento

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  // Lógica de verificação de acesso e redirecionamento
  useEffect(() => {
    if (isLoadingSession || isLoadingClientStore) return;

    if (userRole !== 'admin') {
        // Se não for admin, redireciona para o dashboard
        navigate('/', { replace: true });
        return;
    }
    
    // Se o cliente não for encontrado APÓS o carregamento, redireciona
    if (!clientId || !client) {
        // Se o store terminou de carregar e o cliente ainda não está lá
        if (!isLoadingClientStore) {
            showError('Cliente não encontrado ou ID inválido.');
            navigate('/clients', { replace: true });
        }
        return;
    }
    
  }, [client, clientId, isLoadingSession, isLoadingClientStore, userRole, navigate]);


  if (isLoadingSession || isLoadingClientStore) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Buscando cliente...</p>
      </div>
    );
  }
  
  // Se o carregamento terminou e o cliente ainda é nulo, o useEffect já tentou redirecionar.
  // Se chegamos aqui, é porque o cliente foi encontrado.
  if (!client) return null; 

  const basePath = `/clients/${clientId}`;
  
  return (
    <div className="h-full space-y-6">
      
      {/* Header do Workspace com Ações */}
      <div className="flex justify-between items-center border-b pb-2">
        <nav className="flex space-x-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={`${basePath}/${item.path}`}
              className={cn(
                "flex items-center p-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === `${basePath}/${item.path}` || 
                (location.pathname === basePath && item.path === '')
                  ? "bg-dyad-500 text-white hover:bg-dyad-600"
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.title}
            </Link>
          ))}
        </nav>
        
        {/* Botão de Acesso ao Playbook (Para Admin) */}
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(`/playbook/${clientId}`, '_blank')}
            className="border-input text-foreground hover:bg-muted/80"
        >
            <FileText className="h-4 w-4 mr-2" /> Ver Portal do Cliente
        </Button>
      </div>

      {/* Conteúdo Aninhado */}
      <Routes>
        {/* Rota principal do workspace (Kanban) */}
        <Route index element={<ClientWorkspace clientId={clientId} />} />
        
        {/* Rota de Interações */}
        <Route path="interacoes" element={<ClientInteractionsHistory clientId={clientId} clientName={client.name} />} />
        
        {/* Rota de Notas do Cliente */}
        <Route path="notas" element={<ClientNotesSection clientId={clientId} clientName={client.name} />} />
        
        {/* Rota de Configuração de Onboarding */}
        <Route path="onboarding-config" element={<OnboardingConfigPage clientId={clientId} />} /> {/* NOVA ROTA */}
        
        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to={basePath} replace />} />
      </Routes>
      
    </div>
  );
};

export default ClientWorkspacePage;