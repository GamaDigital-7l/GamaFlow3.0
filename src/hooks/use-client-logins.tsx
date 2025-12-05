import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientLogin } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';

const LOGINS_QUERY_KEY = 'clientLogins';

// Função para buscar todos os logins para um cliente específico
const fetchClientLogins = async (clientId: string): Promise<ClientLogin[]> => {
  const { data, error } = await supabase
    .from('client_logins')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientLogin[];
};

// Função para adicionar um novo login
const addClientLogin = async (login: Omit<ClientLogin, 'id' | 'created_at' | 'user_id'>): Promise<ClientLogin> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const loginWithUser = {
    ...login,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('client_logins')
    .insert(loginWithUser)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as ClientLogin;
};

// Função para deletar um login
const deleteClientLogin = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('client_logins')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useClientLogins = (clientId: string) => {
  const queryClient = useQueryClient();

  const { data: logins, isLoading, error } = useQuery<ClientLogin[], Error>({
    queryKey: [LOGINS_QUERY_KEY, clientId],
    queryFn: () => fetchClientLogins(clientId),
  });

  const addMutation = useMutation({
    mutationFn: addClientLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOGINS_QUERY_KEY, clientId] });
      showSuccess('Login adicionado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar login: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientLogin,
    onSuccess: () => {
      // A invalidação usa o clientId do hook, garantindo que a lista correta seja atualizada.
      queryClient.invalidateQueries({ queryKey: [LOGINS_QUERY_KEY, clientId] });
      showSuccess('Login excluído com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao excluir login: ${err.message}`);
    },
  });

  return {
    logins: logins || [],
    isLoading,
    error,
    addLogin: addMutation.mutate,
    deleteLogin: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};