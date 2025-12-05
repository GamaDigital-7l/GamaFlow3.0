import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';

export const USERS_QUERY_KEY = 'allUsers';

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  client_ids?: string[] | null; // Alterado para array
  first_name?: string;
  last_name?: string;
}

// URL da Edge Function para listar usuários
const LIST_USERS_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/list-users';
// URL da Edge Function para criar usuários
const CREATE_USER_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/create-client-user';
// URL da Edge Function para deletar usuários
const DELETE_USER_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/delete-client-user';


// Função para buscar todos os usuários (incluindo e-mail) via Edge Function
const fetchAllUserProfiles = async (page: number, pageSize: number): Promise<UserProfile[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão de admin necessária.");

  // Use URLSearchParams for GET request parameters
  const url = new URL(LIST_USERS_FUNCTION_URL);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('pageSize', pageSize.toString());

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    // Body removed for GET request
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to fetch users via Edge Function.');
  }
  
  // Filtra o usuário 'supabase_admin' que pode ser retornado pela listUsers
  return (result as any).users.filter((user: UserProfile) => user.email !== 'supabase_admin');
};

// Função para criar usuário (chama a Edge Function)
const createClientUser = async (data: { email: string, password: string, client_ids: string[] }): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessão de admin necessária.");

  const response = await fetch(CREATE_USER_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create user via Edge Function.');
  }
};

// Função para atualizar usuário (chama a Edge Function)
const updateUserInDB = async (data: { id: string, email: string, role: string, client_ids: string[] | null, password?: string }): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de admin necessária.");
    
    // Edge Function URL para atualização
    const UPDATE_USER_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/update-client-user';
    
    const response = await fetch(UPDATE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to update user via Edge Function.');
    }
};


// Função para deletar usuário (chama a Edge Function)
const deleteUserFromDB = async (userId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de admin necessária.");

    const response = await fetch(DELETE_USER_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user via Edge Function.');
    }
};


export const useUserManagement = () => {
  const queryClient = useQueryClient();
  const { userRole } = useSession();
  
  const isAdmin = userRole === 'admin';
  
  const pageSize = 10; // Define o tamanho da página
  const { data: users = [], isLoading } = useQuery<UserProfile[], Error>({
    queryKey: [USERS_QUERY_KEY],
    queryFn: () => fetchAllUserProfiles(1, pageSize), // Página inicial = 1
    enabled: isAdmin,
    staleTime: 3600000, // 1 hora de cache
  });

  const createMutation = useMutation({
    mutationFn: createClientUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      showSuccess('Usuário cliente criado e vinculado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar usuário: ${err.message}`);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateUserInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      showSuccess('Usuário atualizado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao atualizar usuário: ${err.message}`);
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteUserFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      showSuccess('Usuário excluído com sucesso.');
    },
    onError: (err) => {
      showError(`Erro ao excluir usuário: ${err.message}`);
    },
  });


  return {
    users,
    isLoading,
    createUser: createMutation.mutate,
    updateUser: updateMutation.mutate,
    deleteUser: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};