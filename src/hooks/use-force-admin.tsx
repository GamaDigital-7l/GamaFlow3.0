import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { USERS_QUERY_KEY } from './use-user-management'; // Importando a chave de query
import { useSession } from '@/components/SessionContextProvider'; // Importando useSession

const FORCE_ADMIN_FUNCTION_URL = 'https://cxntiszohzgntyhbagga.supabase.co/functions/v1/force-admin';

const callForceAdmin = async (userId: string): Promise<void> => {
  // Garante que a sessão mais recente seja obtida
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) throw new Error(`Erro ao obter sessão: ${sessionError.message}`);
  if (!session) throw new Error("Usuário não logado.");

  const response = await fetch(FORCE_ADMIN_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // Ainda enviamos o token para autenticação básica
    },
    body: JSON.stringify({ userId }), // Enviamos o ID do usuário
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Falha ao forçar role de admin.');
  }
};

export const useForceAdmin = () => {
  const queryClient = useQueryClient();
  const { user } = useSession(); // Obtém o usuário logado

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
  
  const forceAdmin = () => {
      if (!user?.id) {
          showError("Usuário não logado. Não é possível forçar a role.");
          return;
      }
      mutation.mutate(user.id);
  };

  return {
    forceAdmin,
    isForcing: mutation.isPending,
  };
};