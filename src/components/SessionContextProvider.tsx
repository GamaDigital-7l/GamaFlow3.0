import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userRole: string | null;
  clientIds: string[] | null; // Alterado para array de IDs
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientIds, setClientIds] = useState<string[] | null>(null); // Novo estado para array

  // Função para buscar a role e o client_ids do usuário
  const fetchUserRoleAndClient = async (userId: string) => {
    console.log(`[DEBUG] Tentando buscar perfil para ID: ${userId}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('role, client_ids')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || (error as any).status === 406) { 
        console.warn(`[DEBUG] Perfil não encontrado ou RLS bloqueou leitura. Usando role padrão: user`);
        return { role: 'user', clientIds: null };
      }
      
      console.error('Erro ao buscar o role/client_ids do usuário:', error);
      return { role: 'user', clientIds: null };
    }
    
    if (data) {
        // Garante que client_ids seja um array de strings (UUIDs) ou null
        const ids = Array.isArray(data.client_ids) && data.client_ids.length > 0 ? data.client_ids : null;
        return { 
            role: data.role || 'user', 
            clientIds: ids
        };
    }
    
    return { role: 'user', clientIds: null };
  };

  useEffect(() => {
    let isMounted = true;

    const handleSession = async (currentSession: Session | null) => {
      if (!isMounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        const { role, clientIds } = await fetchUserRoleAndClient(currentUser.id);
        if (isMounted) {
          setUserRole(role);
          setClientIds(clientIds);
        }
      } else {
        setUserRole(null);
        setClientIds(null);
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    // 1. Monitorar mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
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
    <SessionContext.Provider value={{ session, user, isLoading, userRole, clientIds }}>
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