import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { PostgrestError } from '@supabase/supabase-js';

export interface ClientFeedback {
  id: string;
  client_id: string;
  feedback: string;
  type: 'praise' | 'improvement';
  created_at: string;
}

const FEEDBACK_QUERY_KEY = 'clientFeedback';

const fetchClientFeedback = async (): Promise<ClientFeedback[]> => {
  // Nota: A política RLS permite que usuários autenticados leiam todos os feedbacks.
  const { data, error } = await supabase
    .from('client_feedback')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientFeedback[];
};

export const useClientFeedback = () => {
  const { data: feedback = [], isLoading, error } = useQuery<ClientFeedback[], Error>({
    queryKey: [FEEDBACK_QUERY_KEY],
    queryFn: fetchClientFeedback,
  });

  if (error) {
    showError(`Erro ao carregar feedbacks: ${error.message}`);
  }

  return {
    feedback,
    isLoading,
    error,
  };
};