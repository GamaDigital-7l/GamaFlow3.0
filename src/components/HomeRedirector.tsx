import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Loader2 } from 'lucide-react';
import Index from '@/pages/Index';
import { withRole } from './withRole';
import { AppShell } from './AppShell'; // Importando AppShell

// Define o componente Dashboard protegido por role localmente
const AdminDashboard = withRole(Index, ["admin", "user"]);

export const HomeRedirector: React.FC = () => {
  const { userRole, clientIds, isLoading } = useSession();
  
  if (isLoading) {
    // Renderiza um estado de carregamento mínimo enquanto a sessão carrega
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-dyad-500" /></div>;
  }

  const firstClientId = clientIds?.[0];
  
  // 1. Verifica se o usuário é cliente ou equipe E tem um ID de cliente vinculado
  if ((userRole === 'client' || userRole === 'equipe') && firstClientId) {
    // Redireciona imediatamente para o Playbook
    return <Navigate to={`/playbook/${firstClientId}`} replace />;
  }
  
  // 2. Se for admin, user, ou um cliente/equipe sem ID (fallback), renderiza o Dashboard.
  // Como esta rota está fora do AppShell, precisamos renderizar o AppShell aqui para manter o layout.
  return (
    <AppShell>
      <AdminDashboard />
    </AppShell>
  );
};