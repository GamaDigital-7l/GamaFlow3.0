import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UsefulLink } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';

const LINKS_QUERY_KEY = 'usefulLinks';

// Função para buscar todos os links para um cliente específico
const fetchUsefulLinks = async (clientId: string): Promise<UsefulLink[]> => {
  const { data, error } = await supabase
    .from('useful_links')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as UsefulLink[];
};

// Função para adicionar um novo link
const addUsefulLink = async (link: Omit<UsefulLink, 'id' | 'created_at' | 'user_id'>): Promise<UsefulLink> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const linkWithUser = {
    ...link,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('useful_links')
    .insert(linkWithUser)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as UsefulLink;
};

// Função para deletar um link
const deleteUsefulLink = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('useful_links')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useUsefulLinks = (clientId: string) => {
  const queryClient = useQueryClient();

  const { data: links, isLoading, error } = useQuery<UsefulLink[], Error>({
    queryKey: [LINKS_QUERY_KEY, clientId],
    queryFn: () => fetchUsefulLinks(clientId),
  });

  const addMutation = useMutation({
    mutationFn: addUsefulLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINKS_QUERY_KEY, clientId] });
      showSuccess('Link adicionado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar link: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsefulLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LINKS_QUERY_KEY, clientId] });
      showSuccess('Link excluído com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao excluir link: ${err.message}`);
    },
  });

  return {
    links: links || [],
    isLoading,
    error,
    addLink: addMutation.mutate,
    deleteLink: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};