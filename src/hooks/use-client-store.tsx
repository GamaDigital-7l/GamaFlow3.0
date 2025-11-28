import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Client, Post, KanbanColumn, KanbanColumnId, ClientStatus, ClientType } from '@/types/client';
import { DropResult } from 'react-beautiful-dnd';
import { showSuccess, showError } from '@/utils/toast';
import { format, parseISO, isSameMonth, isSameYear } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramNotifications } from './use-telegram-notifications';
import { useWhatsappNotifications } from './use-whatsapp-notifications'; // NOVO
import { PostgrestError } from '@supabase/supabase-js';

const CLIENTS_QUERY_KEY = 'allClients';
const DELETE_CLIENT_FUNCTION_URL = 'https://lgxexrjpemietutfalbp.supabase.co/functions/v1/delete-client-data';

const columnOrder: KanbanColumnId[] = [
  'Produção',
  'Aprovação',
  'Edição',
  'Aprovado',
  'Publicado',
  'Material Off', // NOVO
];

// Função auxiliar para obter a URL base
const getBaseUrl = () => {
    // 1. Tenta usar a URL do navegador (ambiente de desenvolvimento ou acesso direto)
    if (typeof window !== 'undefined' && window.location.origin) {
        return window.location.origin;
    }
    // 2. Usa a variável de ambiente VITE_PUBLIC_URL (ambiente de produção/Docker)
    return import.meta.env.VITE_PUBLIC_URL || 'http://localhost:5173';
};


// --- Mapeamento e Conversão ---

// Mapeia snake_case do DB para camelCase do frontend
const mapSupabaseClientToClient = (data: any): Client => ({
    id: data.id,
    name: data.name,
    logoUrl: data.logo_url || undefined,
    status: data.status as ClientStatus,
    type: data.type as ClientType,
    color: data.color,
    phone: data.phone || undefined,
    whatsappNumber: data.whatsapp_number || undefined, // ATUALIZADO
    email: data.email || undefined,
    cnpj: data.cnpj || undefined,
    monthlyPostGoal: data.monthly_post_goal,
    // Converte posts JSONB de volta para o formato de frontend, garantindo que as datas sejam objetos Date
    posts: (data.posts || []).map((post: any) => ({
        ...post,
        dueDate: new Date(post.dueDate),
        completedAt: post.completedAt ? new Date(post.completedAt) : undefined,
    })) as Post[],
});

// Mapeia camelCase do frontend para snake_case do DB
const mapClientToSupabase = (client: Omit<Client, 'posts'> & { posts?: Post[] }) => ({
    id: client.id,
    name: client.name,
    logo_url: client.logoUrl || null,
    status: client.status,
    type: client.type,
    color: client.color,
    phone: client.phone || null,
    whatsapp_number: client.whatsappNumber || null, // ATUALIZADO
    email: client.email || null,
    cnpj: client.cnpj || null,
    monthly_post_goal: client.monthlyPostGoal,
    // Posts são armazenados como JSONB. As datas devem ser strings ISO para serialização correta.
    posts: (client.posts || []).map(post => ({
        ...post,
        dueDate: post.dueDate.toISOString(),
        completedAt: post.completedAt?.toISOString() || null,
    })),
});


// --- Funções de Interação com o Supabase ---

const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    if (error.status === 403 || error.status === 401) {
        console.warn("RLS/Auth Error fetching clients. Returning empty list.");
        return [];
    }
    throw new Error(error.message);
  }
  
  const origin = getBaseUrl(); // Usa a função robusta

  return data.map(dbClient => {
    const client = mapSupabaseClientToClient(dbClient);
    
    // Garante que o link de aprovação seja gerado corretamente
    client.posts = client.posts.map(post => {
        const newPost = { ...post };
        // Se o link não estiver no formato correto, regenera
        if (!newPost.approvalLink || !newPost.approvalLink.includes(`/approval/${client.id}/`)) {
            newPost.approvalLink = `${origin}/approval/${client.id}/${post.id}`;
        }
        return newPost;
    });
    
    return client;
  });
};

// Função para adicionar/atualizar cliente no DB
const upsertClientToDB = async (clientData: Omit<Client, 'posts'> & { posts?: Post[] }): Promise<Client> => {
    // Garante que o ID exista se for uma atualização, ou gera um novo se for criação
    const clientWithId = {
        ...clientData,
        id: clientData.id || uuidv4(),
    };
    
    const payload = mapClientToSupabase(clientWithId);
    
    const { data, error } = await supabase
        .from('clients')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return mapSupabaseClientToClient(data);
};

// Função para deletar cliente (chama a Edge Function)
const deleteClientData = async (clientId: string): Promise<void> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Sessão de admin necessária.");

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
        throw new Error(result.error || 'Failed to delete client data via Edge Function.');
    }
    
    // Deleta o cliente do DB (após deletar usuários Auth)
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) throw new Error(`Failed to delete client from DB: ${error.message}`);
};

// Função para registrar interação
const registerInteraction = async (clientId: string, type: 'feedback' | 'edit_request', content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Não registra se não houver usuário logado (ex: aprovação pública)
    
    const { error } = await supabase
        .from('client_interactions')
        .insert({
            client_id: clientId,
            user_id: user.id,
            interaction_type: type,
            content: content,
        });
        
    if (error) {
        console.error("Failed to register client interaction:", error);
    }
};


export function useClientStore() {
  const queryClient = useQueryClient();
  const { notifyClientAction: notifyTelegram } = useTelegramNotifications();
  const { notifyClientAction: notifyWhatsapp } = useWhatsappNotifications(); // NOVO

  // 1. Query Principal para buscar todos os clientes
  const { data: clients = [], isLoading } = useQuery<Client[], Error>({
    queryKey: [CLIENTS_QUERY_KEY],
    queryFn: fetchClients,
    staleTime: 300000, // 5 minutos de cache
  });


  // --- Funções Auxiliares (Não Mutáveis) ---

  const getClientById = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId);
  }, [clients]);

  const getPostById = useCallback((clientId: string, postId: string) => {
    const client = getClientById(clientId);
    return client?.posts.find(p => p.id === postId);
  }, [getClientById]);

  const getKanbanData = useCallback((clientId: string, monthYear: string) => {
    const client = getClientById(clientId);
    if (!client) return { columns: {}, columnOrder: [] as KanbanColumnId[], postsMap: {} };

    const monthlyPosts = client.posts.filter(p => p.monthYear === monthYear);

    const postsMap = monthlyPosts.reduce((acc, post) => {
      acc[post.id] = post;
      return acc;
    }, {} as Record<string, Post>);

    const columns: Record<KanbanColumnId, KanbanColumn> = columnOrder.reduce((acc, columnId) => {
      acc[columnId] = {
        id: columnId,
        title: columnId,
        postIds: monthlyPosts
          .filter(post => post.status === columnId)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
          .map(post => post.id),
      };
      return acc;
    }, {} as Record<KanbanColumnId, KanbanColumn>);

    return { columns, columnOrder, postsMap };
  }, [getClientById]);

  const getAllApprovedOrPublishedPosts = useMemo(() => {
    const approvedStatuses: KanbanColumnId[] = ['Aprovado', 'Publicado'];
    
    const allPosts = clients.flatMap(client => 
      client.posts.map(post => ({
        ...post,
        clientName: client.name,
      }))
    );

    return allPosts
      .filter(post => approvedStatuses.includes(post.status))
      .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
  }, [clients]);
  
  const clientsWithProgress = useMemo(() => {
    const currentMonthYear = format(new Date(), 'yyyy-MM');
    
    return clients.map(client => {
      const completedPostsThisMonth = client.posts.filter(post => 
        (post.status === 'Aprovado' || post.status === 'Publicado') && 
        post.monthYear === currentMonthYear
      );
      
      const completedCount = completedPostsThisMonth.length;
      const goal = client.monthlyPostGoal || 0;
      const percentage = goal > 0 ? Math.min(100, Math.round((completedCount / goal) * 100)) : 0;
      
      let status: 'Atingida' | 'Em Progresso' = 'Em Progresso';
      if (completedCount >= goal && goal > 0) {
        status = 'Atingida';
      }

      return {
        ...client,
        completedPostsThisMonth,
        completedCount,
        goal,
        percentage,
        progressStatus: status,
      };
    });
  }, [clients]);


  // --- Funções de Mutação (CRUD) ---

  // Mutação para adicionar/atualizar clientes
  const clientMutation = useMutation({
    mutationFn: upsertClientToDB,
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
      showSuccess(`Cliente "${newClient.name}" salvo com sucesso!`);
      // Retorna o ID do cliente para ser usado no mutateAsync
      return newClient.id; 
    },
    onError: (err) => {
      showError(`Erro ao salvar cliente: ${err.message}`);
      // Retorna null ou lança erro para o mutateAsync
      throw err; 
    },
  });

  // Mutação para deletar clientes
  const deleteClientMutation = useMutation({
    mutationFn: deleteClientData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CLIENTS_QUERY_KEY] });
      showSuccess('Cliente e todos os dados associados excluídos com sucesso.');
    },
    onError: (err) => {
      showError(`Erro ao excluir cliente: ${err.message}`);
    },
  });

  // Mutação para adicionar/atualizar/deletar posts
  const postMutation = useMutation({
    mutationFn: async (action: { type: 'add' | 'update' | 'delete', clientId: string, payload: any }) => {
      const client = getClientById(action.clientId);
      if (!client) throw new Error("Cliente não encontrado.");
      
      let posts = [...client.posts];
      let successMessage = '';
      let postTitle = '';
      
      if (action.type === 'add') {
        const newPostData = action.payload as Omit<Post, 'id' | 'approvalLink'> & { monthYear: string };
        const postId = `p${Date.now()}`;
        const origin = getBaseUrl(); // Usa a função robusta
        const approvalLink = `${origin}/approval/${action.clientId}/${postId}`;

        const newPost: Post = {
          ...newPostData,
          id: postId,
          approvalLink: approvalLink,
          status: newPostData.status, 
          monthYear: newPostData.monthYear,
        };
        posts = [...posts, newPost];
        successMessage = `Post "${newPost.title}" adicionado ao Kanban.`;
        postTitle = newPost.title;
        
        if (newPost.status === 'Aprovação') {
            // Notificação Telegram
            notifyTelegram(client.name, 'LINK GERADO', postTitle, `Aprovação em: ${format(newPost.dueDate, 'dd/MM/yyyy')}`);
            
            // Notificação WhatsApp
            if (client.whatsappNumber) {
                notifyWhatsapp(client.whatsappNumber, client.name, 'LINK GERADO', postTitle, `Acesse para aprovar: ${newPost.approvalLink}`);
            }
        }
        
      } else if (action.type === 'update') {
        const updatedPost = action.payload as Post;
        const oldPost = posts.find(p => p.id === updatedPost.id);
        postTitle = updatedPost.title;
        
        if (oldPost && oldPost.status === 'Aprovação' && updatedPost.status === 'Aprovado') {
            // Notificação Telegram
            notifyTelegram(client.name, 'APROVOU', postTitle);
            // Notificação WhatsApp
            if (client.whatsappNumber) {
                notifyWhatsapp(client.whatsappNumber, client.name, 'APROVOU', postTitle);
            }
            
            // REGISTRA INTERAÇÃO: Aprovação
            await registerInteraction(client.id, 'feedback', `Aprovação do post: ${postTitle}`);
        } else if (oldPost && oldPost.status === 'Aprovação' && updatedPost.status === 'Edição') {
            const details = updatedPost.description.includes('EDIÇÃO SOLICITADA') 
                ? updatedPost.description.split('--- Descrição Original ---')[0].trim()
                : 'Verifique a descrição do post para detalhes.';
            
            // Notificação Telegram
            notifyTelegram(client.name, 'PEDIU EDIÇÃO', postTitle, details);
            // Notificação WhatsApp
            if (client.whatsappNumber) {
                notifyWhatsapp(client.whatsappNumber, client.name, 'PEDIU EDIÇÃO', postTitle, details);
            }
            
            // REGISTRA INTERAÇÃO: Pedido de Edição
            await registerInteraction(client.id, 'edit_request', `Pedido de edição para o post: ${postTitle}. Detalhes: ${details}`);
        }
        
        posts = posts.map(p => p.id === updatedPost.id ? updatedPost : p);
        successMessage = `Post "${updatedPost.title}" atualizado.`;
      } else if (action.type === 'delete') {
        const postId = action.payload as string;
        posts = posts.filter(p => p.id !== postId);
        successMessage = 'Post excluído com sucesso.';
      }
      
      // Atualiza o cliente no DB com a nova lista de posts
      const updatedClientData = { ...client, posts };
      const result = await upsertClientToDB(updatedClientData);
      
      return { updatedClient: result, successMessage };
    },
    onSuccess: ({ updatedClient, successMessage }) => {
      // Atualiza o cache localmente para refletir a mudança
      queryClient.setQueryData<Client[]>([CLIENTS_QUERY_KEY], (oldClients) => {
        return oldClients?.map(c => c.id === updatedClient.id ? updatedClient : c) || [];
      });
      showSuccess(successMessage);
    },
    onError: (err) => {
      showError(`Erro na operação do post: ${err.message}`);
    },
  });


  // --- Funções de Ação Expostas ---

  const addClient = (newClientData: Omit<Client, 'id' | 'posts'>) => {
    // Retorna o ID do novo cliente
    return clientMutation.mutateAsync({ ...newClientData, posts: [] });
  };
  
  const updateClient = (updatedClient: Omit<Client, 'posts'>) => {
    clientMutation.mutate(updatedClient);
  };

  const deleteClient = (clientId: string) => {
    return deleteClientMutation.mutateAsync(clientId);
  };

  const addPost = (clientId: string, newPostData: Omit<Post, 'id' | 'approvalLink'> & { monthYear: string }) => {
    postMutation.mutate({ type: 'add', clientId, payload: newPostData });
  };

  const updatePost = (clientId: string, updatedPost: Post) => {
    return postMutation.mutateAsync({ type: 'update', clientId, payload: updatedPost });
  };
  
  const deletePost = (clientId: string, postId: string) => {
    postMutation.mutate({ type: 'delete', clientId, payload: postId });
  };

  const handleDragEnd = useCallback((result: DropResult, clientId: string) => {
    const { destination, draggableId } = result;

    if (!destination) return;

    const postToMove = getPostById(clientId, draggableId);
    if (!postToMove) return;

    const newStatus = destination.droppableId as KanbanColumnId;

    const updatedPost: Post = {
      ...postToMove,
      status: newStatus,
    };

    updatePost(clientId, updatedPost);
  }, [getPostById, updatePost]);


  return {
    clients: clientsWithProgress,
    getClientById,
    getPostById,
    updatePost,
    addPost,
    deletePost,
    handleDragEnd,
    getKanbanData,
    columnOrder,
    getAllApprovedOrPublishedPosts,
    addClient, 
    updateClient,
    deleteClient,
    isLoading,
    isMutating: clientMutation.isPending || postMutation.isPending || deleteClientMutation.isPending,
  };
}