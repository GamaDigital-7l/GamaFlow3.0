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