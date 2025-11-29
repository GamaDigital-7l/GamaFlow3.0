import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BriefingForm, BriefingResponse } from '@/types/briefing';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { useTelegramNotifications } from './use-telegram-notifications'; // Importando o hook de notificação
import { useClientStore } from './use-client-store'; // Para obter o nome do cliente
import { supabase } from '@/integrations/supabase/client';

const BRIEFINGS_QUERY_KEY = 'briefingForms';
const RESPONSES_QUERY_KEY = 'briefingResponses';

// --- Mapeamento e Conversão ---

const mapSupabaseFormToForm = (data: any): BriefingForm => ({
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    description: data.description || undefined,
    clientId: data.client_id || undefined,
    displayMode: data.display_mode,
    fields: data.fields,
    isPublic: data.is_public,
    createdAt: data.created_at,
});

const mapSupabaseResponseToResponse = (data: any): BriefingResponse => ({
    id: data.id,
    form_id: data.form_id,
    client_id: data.client_id || undefined,
    response_data: data.response_data,
    submitted_at: data.submitted_at,
});

// --- Funções CRUD (Supabase) ---

// Forms
const fetchBriefingForms = async (): Promise<BriefingForm[]> => {
  const { data, error } = await supabase
    .from('briefing_forms')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseFormToForm);
};

const upsertBriefingForm = async (form: Omit<BriefingForm, 'user_id' | 'createdAt'> & { id?: string }): Promise<BriefingForm> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  
  const payload = {
    id: form.id,
    user_id: user.id,
    title: form.title,
    description: form.description,
    client_id: form.clientId || null,
    display_mode: form.displayMode,
    fields: form.fields,
    is_public: form.isPublic,
  };

  const { data, error } = await supabase
    .from('briefing_forms')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseFormToForm(data);
};

const deleteBriefingForm = async (id: string): Promise<void> => {
  const { error } = await supabase.from('briefing_forms').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// Responses
const fetchBriefingResponses = async (): Promise<BriefingResponse[]> => {
    // Nota: A RLS permite que apenas admins leiam todas as respostas
    const { data, error } = await supabase
        .from('briefing_responses')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(mapSupabaseResponseToResponse);
};

const addBriefingResponse = async (response: Omit<BriefingResponse, 'id' | 'submitted_at'>): Promise<BriefingResponse> => {
    const payload = {
        form_id: response.form_id,
        client_id: response.client_id || null,
        response_data: response.response_data,
    };
    
    // Nota: A RLS permite INSERT público (true)
    const { data, error } = await supabase
        .from('briefing_responses')
        .insert(payload)
        .select()
        .single();
        
    if (error) throw new Error(error.message);
    return mapSupabaseResponseToResponse(data);
};

const deleteBriefingResponse = async (responseId: string): Promise<void> => {
    const { error } = await supabase.from('briefing_responses').delete().eq('id', responseId);
    if (error) throw new Error(error.message);
};


export const useBriefings = () => {
  const queryClient = useQueryClient();
  const { notifyClientAction } = useTelegramNotifications();
  const { getClientById } = useClientStore();

  const { data: forms = [], isLoading: isLoadingForms } = useQuery<BriefingForm[], Error>({
    queryKey: [BRIEFINGS_QUERY_KEY],
    queryFn: fetchBriefingForms,
  });
  
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery<BriefingResponse[], Error>({
    queryKey: [RESPONSES_QUERY_KEY],
    queryFn: fetchBriefingResponses,
  });
  
  const isLoading = isLoadingForms || isLoadingResponses;

  const upsertMutation = useMutation({
    mutationFn: upsertBriefingForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRIEFINGS_QUERY_KEY] });
      showSuccess('Formulário de Briefing salvo!');
    },
    onError: (err) => {
      showError(`Erro ao salvar formulário: ${err.message}`);
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: deleteBriefingForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRIEFINGS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [RESPONSES_QUERY_KEY] });
      showSuccess('Formulário excluído!');
    },
    onError: (err) => {
      showError(`Erro ao excluir formulário: ${err.message}`);
    },
  });
  
  const addResponseMutation = useMutation({
    mutationFn: addBriefingResponse,
    onSuccess: (newResponse) => {
      queryClient.invalidateQueries({ queryKey: [RESPONSES_QUERY_KEY] });
      
      // Notificação Telegram
      const form = getFormById(newResponse.form_id);
      const clientName = newResponse.client_id ? getClientById(newResponse.client_id)?.name : 'Público';
      
      if (form) {
          const message = `Novo Briefing Recebido: *${form.title}*`;
          notifyClientAction(clientName || 'Desconhecido', 'NOVO BRIEFING', form.title, message);
      }
      // O toast de sucesso é tratado no componente público
    },
    onError: (err) => {
      showError(`Erro ao enviar resposta: ${err.message}`);
    },
  });
  
  const deleteResponseMutation = useMutation({
    mutationFn: deleteBriefingResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RESPONSES_QUERY_KEY] });
      showSuccess('Resposta excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir resposta: ${err.message}`);
    },
  });
  
  const getFormById = (formId: string) => forms.find(f => f.id === formId);
  const getResponsesByFormId = (formId: string) => responses.filter(r => r.form_id === formId);

  return {
    forms,
    responses,
    isLoading,
    upsertForm: upsertMutation.mutate,
    deleteForm: deleteFormMutation.mutate,
    addResponse: addResponseMutation.mutate,
    deleteResponse: deleteResponseMutation.mutate,
    isMutating: upsertMutation.isPending || deleteFormMutation.isPending || addResponseMutation.isPending || deleteResponseMutation.isPending,
    getFormById,
    getResponsesByFormId,
  };
};