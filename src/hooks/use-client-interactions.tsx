import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

export interface ClientInteraction {
  id: string;
  client_id: string;
  user_id: string;
  interaction_type: 'feedback' | 'edit_request';
  content: string;
  created_at: string;
}

const INTERACTIONS_QUERY_KEY = 'clientInteractions';

const fetchClientInteractions = async (clientId: string): Promise<ClientInteraction[]> => {
  if (!clientId) return [];
  
  // RLS permite que usuários autenticados leiam todas as interações (para admin)
  const { data, error } = await supabase
    .from('client_interactions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientInteraction[];
};

export const useClientInteractions = (clientId: string) => {
  const { data: interactions = [], isLoading, error } = useQuery<ClientInteraction[], Error>({
    queryKey: [INTERACTIONS_QUERY_KEY, clientId],
    queryFn: () => fetchClientInteractions(clientId),
    enabled: !!clientId,
  });

  if (error) {
    showError(`Erro ao carregar interações: ${error.message}`);
  }

  return {
    interactions,
    isLoading,
    error,
  };
};