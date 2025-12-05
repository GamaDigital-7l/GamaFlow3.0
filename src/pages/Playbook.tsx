import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientStore } from '@/hooks/use-client-store';
import { PlaybookLayout } from '@/components/playbook/PlaybookLayout';
import { Loader2, LogOut } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { Client } from '@/types/client';
import { showError } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useTheme } from 'next-themes';
import { Link, Navigate } from 'react-router-dom'; // Adicionado Navigate

const Playbook: React.FC = () => {
  const { clientId: urlClientId } = useParams<{ clientId: string }>(); // ID do cliente na URL
  const navigate = useNavigate();
  const { isLoading: isLoadingClients, getClientById } = useClientStore();
  const { userRole, clientIds: sessionClientIds, isLoading: isLoadingSession } = useSession(); // Usando clientIds
  const { settings } = useAppSettings();
  const { theme } = useTheme();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showError('Erro ao fazer logout.');
    }
  };
  
  // Busca o cliente apenas se o ID da URL for válido
  const client = urlClientId ? getClientById(urlClientId) : undefined;

  if (isLoadingSession || isLoadingClients) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-dyad-500" />
        <p className="ml-4 mt-4 text-lg text-muted-foreground">Carregando dados do cliente...</p>
      </div>
    );
  }
  
  // 1. Verificação de ID na URL
  if (!urlClientId) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold">Erro de Acesso</h2>
        <p className="text-muted-foreground mt-2">ID do cliente ausente na URL.</p>
        <Button onClick={handleLogout} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
            <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    );
  }
  
  // 2. Verificação de Acesso para Clientes e Equipe
  if (userRole === 'client' || userRole === 'equipe') {
    if (!sessionClientIds || sessionClientIds.length === 0) {
        // Usuário logado, mas sem client_id no perfil (erro de configuração)
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="p-8 text-center text-red-500 border rounded-lg shadow-lg max-w-md">
              <h2 className="text-xl font-bold">Conta Não Vinculada</h2>
              <p className="text-muted-foreground mt-2">Sua conta não está associada a nenhum portal de cliente. Por favor, entre em contato com o administrador.</p>
              <Button onClick={handleLogout} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          </div>
        );
    }
    
    if (!sessionClientIds.includes(urlClientId)) {
        // Usuário tentando acessar um portal ao qual não está vinculado
        showError('Acesso negado. Você só pode visualizar os portais aos quais está vinculado.');
        // Redireciona para o primeiro portal que ele tem acesso
        return <Navigate to={`/playbook/${sessionClientIds[0]}`} replace />;
    }
  }
  
  // 3. Verificação de Cliente Existente
  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="p-8 text-center text-red-500 border rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-bold">Cliente não encontrado</h2>
          <p className="text-muted-foreground mt-2">O cliente com o ID fornecido não foi localizado ou você não tem permissão para acessá-lo.</p>
          <Button onClick={handleLogout} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </div>
    );
  }
  
  // Determina qual logo usar
  const logoUrl = theme === 'dark' ? settings.logoDarkUrl : settings.logoLightUrl;
  const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : '/placeholder.svg';


  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Cabeçalho Fixo (Top Bar) */}
      <header className="sticky top-0 z-30 flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
        <Link to="/" className="h-8 flex items-center transition-opacity hover:opacity-80">
            {finalLogoUrl && finalLogoUrl !== '/placeholder.svg' ? (
              <img 
                src={finalLogoUrl} 
                alt="Gama Creative Logo" 
                className="h-full object-contain" 
              />
            ) : (
              <h1 className="text-xl font-bold text-dyad-500">Gama Creative</h1>
            )}
        </Link>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-muted-foreground hover:bg-muted"
              title="Sair"
          >
              <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* Conteúdo Principal (PlaybookLayout) */}
      <main className="flex-grow">
        <PlaybookLayout clientId={urlClientId} />
      </main>
    </div>
  );
};

export default Playbook;