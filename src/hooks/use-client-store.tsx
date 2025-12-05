import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client, Post, KanbanColumn, KanbanColumnId, ClientStatus, ClientType } from '@/types/client';
import { DropResult } from 'react-beautiful-dnd';
import { showSuccess, showError } from '@/utils/toast';
import { format, parseISO, isSameMonth, isSameYear } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useTelegramNotifications } from './use-telegram-notifications';
import { useSession } from '@/components/SessionContextProvider';
import { PostgrestError } from '@supabase/supabase-js';
import { useWhatsappNotifications } from './use-whatsapp-notifications';

const DELETE_CLIENT_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/delete-client-data';

// Kanban Column Order
const KANBAN_COLUMN_ORDER: KanbanColumnId[] = [
  'Produção',
  'Aprovação',
  'Edição',
  'Aprovado',
  'Publicado',
  'Material Off',
];

// Data de vencimento padrão muito futura (para posts sem data definida)
const DEFAULT_FUTURE_DATE = new Date(2099, 11, 31, 23, 59, 59, 999);
const DEFAULT_FUTURE_MONTH_YEAR = '2099-12';

// Helper function to ensure date is a Date object
const ensureDate = (date: Date | string): Date => {
    // Check if it's already a Date object and valid, otherwise create a new Date
    if (date instanceof Date && !isNaN(date.getTime())) return date;
    try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return parsed;
    } catch {}
    return DEFAULT_FUTURE_DATE; // Fallback para a data futura padrão
};

// Função auxiliar para verificar se a data é a data futura padrão
const isDefaultFutureDate = (date: Date): boolean => {
    return date.getFullYear() === 2099 && date.getMonth() === 11 && date.getDate() === 31;
};


// --- Mapeamento e Conversão ---

const mapSupabaseClientToClient = (data: any): Client => ({
  id: data.id,
  name: data.name,
  logoUrl: data.logo_url || '',
  status: data.status as ClientStatus,
  type: data.type as ClientType,
  color: data.color,
  phone: data.phone || undefined,
  whatsappNumber: data.whatsapp_number || undefined,
  email: data.email || undefined,
  cnpj: data.cnpj || undefined,
  monthlyPostGoal: data.monthly_post_goal,
  // CRÍTICO: Mapeia posts, garantindo que as datas sejam objetos Date
  posts: (data.posts || []).map((post: any) => {
      const dueDate = ensureDate(post.dueDate);
      return {
          ...post,
          dueDate: dueDate,
          completedAt: post.completedAt ? ensureDate(post.completedAt) : undefined,
          // Garante que monthYear exista, usando o padrão se a data for a futura
          monthYear: post.monthYear || format(dueDate, 'yyyy-MM'),
      };
  }) || [], 
});

// --- Funções CRUD (Interação com Supabase) ---

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data.map(mapSupabaseClientToClient);
};

const addClientToDB = async (client: Omit<Client, 'id' | 'posts'>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: client.name,
      logo_url: client.logoUrl,
      status: client.status,
      type: client.type,
      color: client.color,
      phone: client.phone,
      whatsapp_number: client.whatsappNumber,
      email: client.email,
      cnpj: client.cnpj,
      monthly_post_goal: client.monthlyPostGoal,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseClientToClient(data);
};

const updateClientInDB = async (client: Omit<Client, 'posts'>): Promise<Client> => {
  const { id, name, logoUrl, status, type, color, phone, whatsappNumber, email, cnpj, monthlyPostGoal } = client;

  const { data, error } = await supabase
    .from('clients')
    .update({
      name,
      logo_url: logoUrl,
      status,
      type,
      color,
      phone,
      whatsapp_number: whatsappNumber,
      email,
      cnpj,
      monthly_post_goal: monthlyPostGoal,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseClientToClient(data);
};

const deleteClientFromDB = async (clientId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de admin necessária.");

    // 1. Deletar usuários Auth vinculados via Edge Function (Service Role Key)
    const response = await fetch(DELETE_CLIENT_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ clientId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete client users via Edge Function.');
    }
    
    // 2. Deletar o registro principal do cliente (Isso deve acionar o CASCADE para outras tabelas)
    const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

    if (deleteError) {
        throw new Error(deleteError.message);
    }
};

const addPostToClient = async (clientId: string, post: Omit<Post, 'id' | 'approvalLink'>): Promise<Post> => {
  if (!clientId) throw new Error("Client ID is missing.");
  
  const { data: clientData, error: fetchError } = await supabase
    .from('clients')
    .select('posts')
    .eq('id', clientId)
    .single();
    
  if (fetchError || !clientData) {
      console.error("Fetch client error:", fetchError);
      throw new Error("Client not found or failed to fetch current posts.");
  }
  
  const currentPosts = clientData.posts || [];

  const newPost: Post = {
    ...post,
    id: uuidv4(), // Generate unique ID
    approvalLink: `/approval/${clientId}/${uuidv4()}`, // Generate unique approval link
    // CRÍTICO: Garante que monthYear seja calculado a partir da dueDate (que pode ser 2099)
    monthYear: format(ensureDate(post.dueDate), 'yyyy-MM'),
  };

  const { error } = await supabase
    .from('clients')
    .update({
      posts: [...currentPosts, newPost],
    })
    .eq('id', clientId);

  if (error) {
    throw new Error(error.message);
  }
  return newPost;
};

const updatePostInClient = async (clientId: string, updatedPost: Post): Promise<Post> => {
  if (!clientId) throw new Error("Client ID is missing.");
  
  const { data: clientData, error: fetchError } = await supabase
    .from('clients')
    .select('posts')
    .eq('id', clientId)
    .single();
    
  if (fetchError || !clientData) {
      console.error("Fetch client error:", fetchError);
      throw new Error("Client not found or failed to fetch current posts.");
  }
  
  const currentPosts = clientData.posts || [];
  
  const isCompletedStatus = updatedPost.status === 'Publicado';
  const completedAt = isCompletedStatus ? (updatedPost.completedAt || new Date()) : undefined;
  
  const postWithMonthYear: Post = {
      ...updatedPost,
      // CRÍTICO: Recalcula monthYear com base na nova dueDate
      monthYear: format(ensureDate(updatedPost.dueDate), 'yyyy-MM'),
      completedAt: completedAt, // Define completedAt se for Publicado
  };

  const { error } = await supabase
    .from('clients')
    .update({
      posts: currentPosts.map(p => (p.id === updatedPost.id ? postWithMonthYear : p)),
    })
    .eq('id', clientId);

  if (error) {
    throw new Error(error.message);
  }
  return postWithMonthYear;
};

const deletePostFromClient = async (clientId: string, postId: string): Promise<void> => {
  if (!clientId) throw new Error("Client ID is missing.");
  
  const { data: clientData, error: fetchError } = await supabase
    .from('clients')
    .select('posts')
    .eq('id', clientId)
    .single();
    
  if (fetchError || !clientData) {
      console.error("Fetch client error:", fetchError);
      throw new Error("Client not found or failed to fetch current posts.");
  }
  
  const currentPosts = clientData.posts || [];

  const { error } = await supabase
    .from('clients')
    .update({
      posts: currentPosts.filter(p => p.id !== postId),
    })
    .eq('id', clientId);

  if (error) {
    throw new Error(error.message);
  }
  return;
};

// --- Hook Principal ---

export function useClientStore() {
  const queryClient = useQueryClient();
  const { notifyTaskAction } = useTelegramNotifications();
  const { notifyClientAction: notifyClientTelegram } = useTelegramNotifications();
  const { notifyClientAction: notifyClientWhatsapp } = useWhatsappNotifications(); 
  const { userRole } = useSession();

  const { data: clients = [], isLoading, error } = useQuery<Client[], Error>({
    queryKey: ['allClients'],
    queryFn: fetchClients,
    staleTime: 300000, // 5 minutos de cache
  });

  // --- Mutations ---

  const addMutation = useMutation({
    mutationFn: addClientToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      showSuccess('Novo cliente adicionado!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar cliente: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateClientInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      showSuccess('Cliente atualizado!');
    },
    onError: (err) => {
      showError(`Erro ao atualizar cliente: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClientFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      showSuccess('Cliente excluído.');
    },
    onError: (err) => {
      showError(`Erro ao excluir cliente: ${err.message}`);
    },
  });
  
  const addPostMutation = useMutation({
    mutationFn: ({ clientId, newPost }: { clientId: string, newPost: Omit<Post, 'id' | 'approvalLink'> }) => addPostToClient(clientId, newPost),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      
      // Notifica apenas se a data não for a data futura padrão
      if (!isDefaultFutureDate(ensureDate(newPost.dueDate))) {
          notifyTaskAction(newPost.title, 'LINK GERADO', 'Clientes', `Aprovação em: ${format(ensureDate(newPost.dueDate), 'dd/MM HH:mm')}`);
      }
      
      showSuccess('Post adicionado ao Kanban!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar post: ${err.message}`);
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ clientId, updatedPost }: { clientId: string, updatedPost: Post }) => updatePostInClient(clientId, updatedPost),
    onSuccess: (updatedPost, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      
      if (updatedPost.status === 'Aprovado' || updatedPost.status === 'Edição') {
          const client = getClientById(variables.clientId);
          const clientName = client?.name || 'Cliente Desconhecido';
          const clientNumber = client?.whatsappNumber || '';
          const action = updatedPost.status === 'Aprovado' ? 'APROVOU' : 'SOLICITOU EDIÇÃO';
          
          notifyClientTelegram(clientName, action, updatedPost.title);
          
          if (clientNumber) {
              notifyClientWhatsapp(clientNumber, clientName, action, updatedPost.title, updatedPost.description);
          }
      }
      
      showSuccess(`Post "${updatedPost.title}" atualizado!`);
    },
    onError: (err) => {
      showError(`Erro ao atualizar post: ${err.message}`);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: ({ clientId, postId }: { clientId: string, postId: string }) => deletePostFromClient(clientId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClients'] });
      showSuccess('Post excluído.');
    },
    onError: (err) => {
      showError(`Erro ao excluir post: ${err.message}`);
    },
  });

  // --- Exposed Getters (useCallback) ---

  const getClientById = useCallback((clientId: string) => {
    return clients.find(client => client.id === clientId);
  }, [clients]);

  const getPostById = useCallback((clientId: string, postId: string) => {
    const client = getClientById(clientId);
    return client?.posts.find(post => post.id === postId);
  }, [getClientById]);

  // --- Exposed Actions (useCallback) ---

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'posts'>): Promise<string> => {
    const newClient = await addMutation.mutateAsync(clientData);
    return newClient.id;
  }, [addMutation]);

  const updateClient = updateMutation.mutate;
  const deleteClient = deleteMutation.mutate;
  const addPost = addPostMutation.mutate;
  const updatePost = updatePostMutation.mutate;
  const deletePost = deletePostMutation.mutate;

  // --- Kanban Logic ---

  const getKanbanData = useCallback((clientId: string, selectedMonthYear: string) => {
    const client = getClientById(clientId);
    
    const posts = client?.posts.filter(post => {
        // Usa o monthYear já calculado no mapeamento
        return post.monthYear === selectedMonthYear;
    }) || [];

    const postsMap = posts.reduce((acc, post) => {
      acc[post.id] = post;
      return acc;
    }, {} as Record<string, Post>);

    const columns: Record<KanbanColumnId, KanbanColumn> = KANBAN_COLUMN_ORDER.reduce((acc, status) => {
      acc[status] = {
        id: status,
        title: status,
        postIds: posts
          .filter(post => post.status === status)
          .sort((a, b) => {
            const aTime = ensureDate(a.dueDate).getTime();
            const bTime = ensureDate(b.dueDate).getTime();
            return aTime - bTime;
          })
          .map(post => post.id),
      };
      return acc;
    }, {} as Record<KanbanColumnId, KanbanColumn>);

    return { columns, columnOrder: KANBAN_COLUMN_ORDER, postsMap };
  }, [getClientById]);

  const handleDragEnd = useCallback((result: DropResult, clientId: string) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const postToMove = getPostById(clientId, draggableId);
    if (!postToMove) return;

    const newStatus = destination.droppableId as KanbanColumnId;

    if (postToMove.status !== newStatus) {
      const completedAt = newStatus === 'Publicado' ? new Date() : undefined;
      
      updatePost({
        clientId,
        updatedPost: {
          ...postToMove,
          status: newStatus,
          completedAt: completedAt,
        }
      });
    }
  }, [getPostById, updatePost]);

  // --- Progress Calculation ---

  const calculateClientProgress = useCallback((client: Client) => {
    const today = new Date();
    const currentMonthYear = format(today, 'yyyy-MM');
    
    const completedPostsThisMonth = client.posts.filter(post => {
      // Verifica se o status é 'Publicado' E se o monthYear corresponde ao mês atual
      return post.status === 'Publicado' && 
             post.monthYear === currentMonthYear;
    });
    
    const completedCount = completedPostsThisMonth.length;
    const goal = client.monthlyPostGoal;
    const percentage = goal > 0 ? Math.min(100, Math.round((completedCount / goal) * 100)) : 0;
    
    const progressStatus: 'Atingida' | 'Em Progresso' = percentage >= 100 ? 'Atingida' : 'Em Progresso';
    
    return { completedPostsThisMonth, completedCount, goal, percentage, progressStatus };
  }, []);

  const clientsWithProgress = useMemo(() => {
    return clients.map(client => {
      const { completedPostsThisMonth, completedCount, goal, percentage, progressStatus } = calculateClientProgress(client);
      return {
        ...client,
        completedPostsThisMonth,
        completedCount,
        goal,
        percentage,
        progressStatus,
      };
    });
  }, [clients, calculateClientProgress]);

  return {
    clients: clientsWithProgress,
    isLoading,
    error,
    getClientById,
    getPostById,
    addClient,
    updateClient,
    deleteClient,
    addPost,
    updatePost,
    deletePost,
    getKanbanData,
    handleDragEnd,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending || addPostMutation.isPending || deletePostMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}