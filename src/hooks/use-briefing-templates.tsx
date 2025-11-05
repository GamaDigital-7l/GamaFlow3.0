import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BriefingTemplate, BriefingField } from '@/types/briefing';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

const TEMPLATES_QUERY_KEY = 'briefingTemplates';

// --- Mapeamento e Conversão ---

const mapSupabaseTemplateToTemplate = (data: any): BriefingTemplate => ({
    id: data.id,
    name: data.name,
    description: data.description || '',
    blocks: data.blocks,
});

// --- Funções CRUD (Supabase) ---

const fetchBriefingTemplates = async (): Promise<BriefingTemplate[]> => {
  const { data, error } = await supabase
    .from('briefing_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseTemplateToTemplate);
};

const upsertBriefingTemplate = async (template: Omit<BriefingTemplate, 'id'> & { id?: string }): Promise<BriefingTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");
  
  const payload = {
    id: template.id,
    name: template.name,
    description: template.description,
    blocks: template.blocks,
  };

  const { data, error } = await supabase
    .from('briefing_templates')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseTemplateToTemplate(data);
};

const deleteBriefingTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase.from('briefing_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
};


export const useBriefingTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery<BriefingTemplate[], Error>({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: fetchBriefingTemplates,
  });

  const upsertMutation = useMutation({
    mutationFn: upsertBriefingTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      showSuccess('Template de Briefing salvo!');
    },
    onError: (err) => {
      showError(`Erro ao salvar template: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBriefingTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      showSuccess('Template excluído!');
    },
    onError: (err) => {
      showError(`Erro ao excluir template: ${err.message}`);
    },
  });
  
  const getTemplateById = (templateId: string) => templates.find(t => t.id === templateId);

  return {
    templates,
    isLoading,
    upsertTemplate: upsertMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    isMutating: upsertMutation.isPending || deleteMutation.isPending,
    getTemplateById,
  };
};