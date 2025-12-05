import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlaybookContent, UsefulLink, ClientLogin } from '@/types/playbook';
import { showSuccess, showError } from '@/utils/toast';

const CONTENT_QUERY_KEY = 'playbookContent';

// Função para buscar o conteúdo de uma seção específica para um cliente
const fetchPlaybookContent = async (clientId: string, section: string): Promise<PlaybookContent | null> => {
  // Adiciona validação para clientId: só busca se for um UUID válido (não vazio)
  if (!clientId || clientId.trim() === '') {
    console.warn("clientId é inválido ou vazio. Pulando busca de playbook_content.");
    return null;
  }
  
  console.log(`[DEBUG] fetchPlaybookContent - clientId: ${clientId}, section: ${section}`);

  const { data, error } = await supabase
    .from('playbook_content')
    .select('*')
    .eq('client_id', clientId)
    .eq('section', section)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
    throw new Error(error.message);
  }
  
  // Garante que 'content' e 'briefing_responses' sejam inicializados corretamente
  return data ? {
    ...data,
    content: data.content || {}, // Simplificado para objeto vazio
    briefing_responses: data.briefing_responses || [], // Simplificado para array vazio
  } as PlaybookContent : null;
};

// Função para salvar ou atualizar o conteúdo
const upsertPlaybookContent = async (contentData: { clientId: string, section: string, content: any, briefingResponses?: any[] }): Promise<PlaybookContent> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const upsertData = {
    client_id: contentData.clientId,
    section: contentData.section,
    content: contentData.content, 
    briefing_responses: contentData.briefingResponses || [], 
  };

  const { data, error } = await supabase
    .from('playbook_content')
    .upsert(upsertData, { onConflict: 'client_id, section' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  // Retorna o objeto PlaybookContent completo
  return {
    ...data,
    content: data.content || {},
    briefing_responses: data.briefing_responses || [],
  } as PlaybookContent;
};

export const usePlaybookContent = (clientId: string, section: string) => {
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery<PlaybookContent | null, Error>({
    queryKey: [CONTENT_QUERY_KEY, clientId, section],
    queryFn: () => fetchPlaybookContent(clientId, section),
    staleTime: 300000, // 5 minutos de cache
    enabled: !!clientId && clientId.trim() !== '', // Habilita a query apenas se clientId for válido
  });

  const upsertMutation = useMutation({
    mutationFn: upsertPlaybookContent,
    onSuccess: () => {
      // Invalida a query para forçar a re-leitura após salvar
      queryClient.invalidateQueries({ queryKey: [CONTENT_QUERY_KEY, clientId, section] });
      showSuccess('Conteúdo atualizado com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao salvar conteúdo: ${err.message}`);
    },
  });

  // Função para salvar o conteúdo e as respostas do briefing
  const saveContent = (section: string, content: any, briefingResponses?: any[]) => {
    upsertMutation.mutate({ clientId, section, content, briefingResponses });
  };

  return {
    content: content,
    isLoading,
    error,
    saveContent,
    isSaving: upsertMutation.isPending,
  };
};