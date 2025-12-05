import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { USERS_QUERY_KEY } from './use-user-management'; // Importando a chave de query

const FORCE_ADMIN_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/force-admin';

const callForceAdmin = async (): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuário não logado.");

  const response = await fetch(FORCE_ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Falha ao forçar role de admin.');
  }
};

export const useForceAdmin = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: callForceAdmin,
    onSuccess: () => {
      showSuccess('Role de administrador forçada com sucesso! Atualizando sessão...');
      // Invalida a sessão e a lista de usuários para forçar a re-leitura
      queryClient.invalidateQueries({ queryKey: ['supabaseSession'] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      // Força o refresh da página para que o SessionContextProvider recarregue
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (err) => {
      showError(`Erro ao forçar admin: ${err.message}`);
    },
  });

  return {
    forceAdmin: mutation.mutate,
    isForcing: mutation.isPending,
  };
};