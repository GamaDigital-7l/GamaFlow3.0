import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesProposal, ProposalStatus, ProposalSection, ProposalBranding } from '@/types/proposal';
import { showSuccess, showError } from '@/utils/toast';
import { v4 as uuidv4 } from 'uuid';

const PROPOSALS_QUERY_KEY = 'salesProposals';

// --- Mapeamento e Conversão ---

const mapSupabaseProposalToProposal = (data: any): SalesProposal => ({
  id: data.id,
  user_id: data.user_id,
  title: data.title,
  client_name: data.client_name,
  status: data.status as ProposalStatus,
  sections: data.sections as ProposalSection[],
  branding_config: data.branding_config as ProposalBranding,
  ai_summary: data.ai_summary || undefined,
  public_link_id: data.public_link_id,
  created_at: data.created_at,
});

// --- Funções CRUD ---

const fetchProposals = async (): Promise<SalesProposal[]> => {
  // RLS garante que apenas admins vejam todas as propostas
  const { data, error } = await supabase
    .from('sales_proposals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseProposalToProposal);
};

const upsertProposalToDB = async (proposal: Omit<SalesProposal, 'user_id' | 'created_at' | 'public_link_id'> & { id?: string }): Promise<SalesProposal> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    id: proposal.id || uuidv4(),
    user_id: user.id,
    title: proposal.title,
    client_name: proposal.client_name,
    status: proposal.status,
    sections: proposal.sections,
    branding_config: proposal.branding_config,
    ai_summary: proposal.ai_summary || null,
    // public_link_id é gerado por default no DB se for novo
  };

  const { data, error } = await supabase
    .from('sales_proposals')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseProposalToProposal(data);
};

const deleteProposalFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('sales_proposals').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const useProposals = () => {
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<SalesProposal[], Error>({
    queryKey: [PROPOSALS_QUERY_KEY],
    queryFn: fetchProposals,
    staleTime: 300000, // 5 minutes of cache
  });

  const upsertMutation = useMutation({
    mutationFn: upsertProposalToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] });
      showSuccess('Proposta salva com sucesso!');
    },
    onError: (err) => {
      showError(`Erro ao salvar proposta: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProposalFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROPOSALS_QUERY_KEY] });
      showSuccess('Proposta excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir proposta: ${err.message}`);
    },
  });
  
  const getProposalByPublicId = (publicId: string) => {
      return proposals.find(p => p.public_link_id === publicId);
  };

  return {
    proposals,
    isLoading,
    upsertProposal: upsertMutation.mutate,
    deleteProposal: deleteMutation.mutate,
    isMutating: upsertMutation.isPending || deleteMutation.isPending,
    getProposalByPublicId,
  };
};
</dyad-file>
```

```typescript
<dyad-write path="src/hooks/use-task-templates.tsx" description="Increasing the staleTime to 5 minutes.">
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskTemplate, TaskCategory, TaskType } from '@/types/task';
import { showSuccess, showError } from '@/utils/toast';

const TEMPLATES_QUERY_KEY = 'taskTemplates';

// Mapeamento de snake_case para camelCase
const mapSupabaseTemplateToTemplate = (data: any): TaskTemplate => ({
  id: data.id,
  title: data.title,
  description: data.description || undefined,
  targetBoard: data.target_board,
  daysOfWeek: data.days_of_week || [], // Corrigido para garantir array
  timeOfDay: data.time_of_day || undefined,
  priority: data.priority,
  clientName: data.client_name || undefined,
  user_id: data.user_id,
  created_at: data.created_at,
  category: data.category as TaskCategory, // NEW
  taskType: data.task_type as TaskType || undefined, // NEW
});

// 1. Buscar Templates
const fetchTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const { data, error } = await supabase
    .from('task_templates')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data.map(mapSupabaseTemplateToTemplate);
};

// 2. Adicionar Template
const addTaskTemplateToDB = async (template: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at'>): Promise<TaskTemplate> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('task_templates')
    .insert({
      user_id: user.id,
      title: template.title,
      description: template.description,
      target_board: template.targetBoard,
      days_of_week: template.daysOfWeek,
      time_of_day: template.timeOfDay,
      priority: template.priority,
      client_name: template.clientName,
      category: template.category, // NEW
      task_type: template.taskType, // NEW
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTemplateToTemplate(data);
};

// 3. Atualizar Template
const updateTaskTemplateInDB = async (template: TaskTemplate): Promise<TaskTemplate> => {
  const { id, title, description, targetBoard, daysOfWeek, timeOfDay, priority, clientName, category, taskType } = template;

  const { data, error } = await supabase
    .from('task_templates')
    .update({
      title,
      description,
      target_board: targetBoard,
      days_of_week: daysOfWeek,
      time_of_day: timeOfDay,
      priority,
      client_name: clientName,
      category, // NEW
      task_type: taskType, // NEW
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTemplateToTemplate(data);
};

// 4. Deletar Template
const deleteTaskTemplateFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('task_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

export const useTaskTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error } = useQuery<TaskTemplate[], Error>({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: fetchTaskTemplates,
    staleTime: 300000, // 5 minutes of cache
  });

  const addMutation = useMutation({
    mutationFn: addTaskTemplateToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      showSuccess('Template de tarefa adicionado!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar template: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskTemplateInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      showSuccess('Template de tarefa atualizado!');
    },
    onError: (err) => {
      showError(`Erro ao atualizar template: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskTemplateFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TEMPLATES_QUERY_KEY] });
      showSuccess('Template de tarefa excluído!');
    },
    onError: (err) => {
      showError(`Erro ao excluir template: ${err.message}`);
    },
  });

  return {
    templates,
    isLoading,
    error,
    addTemplate: addMutation.mutate,
    updateTemplate: updateMutation.mutate,
    deleteTemplate: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};