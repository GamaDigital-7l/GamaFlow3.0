import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userRole: string | null;
  clientId: string | null; // Adicionando clientId
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null); // Novo estado

  // Função para buscar a role e o client_id do usuário
  const fetchUserRoleAndClient = async (userId: string) => {
    console.log(`[DEBUG] Tentando buscar perfil para ID: ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role, client_id')
      .eq('id', userId)
      .single(); // Usando single() para garantir um único resultado

    if (error) {
      // PGRST116 = No rows found (Perfil não existe)
      // 406 = Not Acceptable (Geralmente RLS, mas pode ser tratado como perfil não encontrado se a query for single)
      if (error.code === 'PGRST116' || error.status === 406) { 
        console.log(`[DEBUG] Perfil não encontrado ou RLS bloqueou leitura (Status: ${error.status || 'N/A'}). Usando role padrão: user`);
        return { role: 'user', clientId: null };
      }
      
      console.error('Erro ao buscar o role/client_id do usuário:', error);
      return { role: 'user', clientId: null };
    }
    
    if (data) {
        console.log(`[DEBUG] Perfil encontrado. Role: ${data.role}, Client ID: ${data.client_id}`);
        return { 
            role: data.role || 'user', 
            clientId: data.client_id || null 
        };
    }
    
    // Fallback caso o data seja nulo por algum motivo
    return { role: 'user', clientId: null };
  };

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (currentSession: Session | null) => {
      if (!isMounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        console.log(`[DEBUG] Usuário logado. Email: ${currentUser.email}, ID: ${currentUser.id}`);
        const { role, clientId } = await fetchUserRoleAndClient(currentUser.id);
        if (isMounted) {
          setUserRole(role);
          setClientId(clientId);
        }
      } else {
        console.log('[DEBUG] Usuário deslogado.');
        setUserRole(null);
        setClientId(null);
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    // 1. Monitorar mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        showSuccess('Login realizado com sucesso!');
      } else if (event === 'SIGNED_OUT') {
        showSuccess('Logout realizado.');
      }
      handleSession(session);
    });

    // 2. Fetch inicial da sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
        handleSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, isLoading, userRole, clientId }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};