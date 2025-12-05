import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SessionContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  userRole: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });
  }, []);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        } else {
          setUserRole(data?.is_admin ? 'admin' : 'user');
        }
      } else {
        setUserRole(null);
      }
    };

    if (!isLoading) {
      fetchRole();
    }
  }, [user, isLoading]);

  return (
    <SessionContext.Provider value={{ session, user, isLoading, userRole }}>
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