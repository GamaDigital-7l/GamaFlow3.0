import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Loader2 } from 'lucide-react';
import Index from '@/pages/Index';
import { AppShell } from './AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export const HomeRedirector: React.FC = () => {
  const { userRole, clientIds, isLoading } = useSession();
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        showError('Erro ao fazer logout.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-dyad-500" /></div>;
  }

  const firstClientId = clientIds?.[0];
  
  // 1. Usuário é Cliente ou Equipe E tem um ID de cliente vinculado
  if ((userRole === 'client' || userRole === 'equipe') && firstClientId) {
    // Redireciona imediatamente para o Playbook
    return <Navigate to={`/playbook/${firstClientId}`} replace />;
  }
  
  // 2. Usuário é Admin ou User (Pode ver o Dashboard)
  if (userRole === 'admin' || userRole === 'user') {
    // Renderiza o Dashboard dentro do AppShell
    // Nota: O AppShell já contém o Outlet, mas como esta é a rota '/', 
    // precisamos renderizar o Index diretamente aqui, ou usar o AppShell com Outlet e mover o Index para a rota '/' dentro do AppShell.
    // Como o AppShell é o layout, vamos renderizar o Index diretamente.
    return (
        <AppShell>
            <Index />
        </AppShell>
    );
  }
  
  // 3. Usuário é Cliente ou Equipe, mas NÃO tem clientIds (Erro de Configuração)
  if (userRole === 'client' || userRole === 'equipe') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <Card className="p-8 text-center text-red-500 border rounded-lg shadow-lg max-w-md">
              <CardTitle className="text-xl font-bold">Conta Não Vinculada</CardTitle>
              <CardContent className="p-0 pt-4">
                <p className="text-muted-foreground mt-2">Sua conta ({userRole}) não está associada a nenhum portal de cliente. Por favor, entre em contato com o administrador.</p>
                <Button onClick={handleLogout} className="mt-6 bg-dyad-500 hover:bg-dyad-600">
                  <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
              </CardContent>
            </Card>
        </div>
    );
  }
  
  // 4. Outras roles ou fallback (deve ser tratado pelo ProtectedRoute, mas por segurança)
  return <Navigate to="/login" replace />;
};