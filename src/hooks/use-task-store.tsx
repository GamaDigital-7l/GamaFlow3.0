import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskCategory, TaskStatus, TaskPriority, TaskTemplate, Habit, TaskType, DayOfWeek } from '@/types/task';
import { isTaskOverdue } from '@/utils/date';
import { showSuccess, showError } from '@/utils/toast';
import { isToday, isThisWeek, isFuture, format, getDay, isSameDay, isBefore } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo, useEffect } from 'react';
import { useTelegramNotifications } from './use-telegram-notifications';
import { useSession } from '@/components/SessionContextProvider';
import { PostgrestError } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const TASKS_QUERY_KEY = 'userTasks';
const TEMPLATES_QUERY_KEY = 'taskTemplates';

// Mapeamento de snake_case para camelCase para o frontend
const mapSupabaseTaskToTask = (data: any): Task => ({
  id: data.id,
  user_id: data.user_id,
  assigneeId: data.assignee_id || undefined, // NOVO
  title: data.title,
  description: data.description || '',
  dueDate: new Date(data.due_date),
  priority: data.priority as TaskPriority,
  category: data.category as TaskCategory,
  status: data.status as TaskStatus,
  isRecurrent: data.is_recurrent,
  clientName: data.client_name || undefined,
  completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  taskType: data.task_type as TaskType || undefined, // NOVO
  subtasks: data.subtasks || [], // NOVO
});

// --- Funções de Interação com o Supabase ---

// 1. Buscar Tarefas (RLS agora filtra por user_id OU assignee_id)
const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    // Se for erro de RLS, retorna vazio (o RLS deve garantir que o usuário veja apenas o que lhe é devido)
    if ((error as any).code === '406' || (error as any).code === '403') return [];
    throw new Error(error.message);
  }
  return data.map(mapSupabaseTaskToTask);
};

// 2. Adicionar Tarefa
const addTaskToDB = async (newTask: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'> & { assigneeId?: string }): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      assignee_id: newTask.assigneeId || user.id, // Quem é responsável (padrão: o criador)
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.dueDate.toISOString(),
      priority: newTask.priority,
      category: newTask.category,
      is_recurrent: newTask.isRecurrent,
      client_name: newTask.clientName,
      task_type: newTask.taskType, // NOVO
      status: 'Pendente',
      subtasks: newTask.subtasks, // NOVO
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTaskToTask(data);
};

// 3. Atualizar Tarefa
const updateTaskInDB = async (updatedTask: Task): Promise<Task> => {
  const { id, title, description, dueDate, priority, category, isRecurrent, clientName, status, completedAt, assigneeId, taskType, subtasks } = updatedTask;

  const { data, error } = await supabase
    .from('tasks')
    .update({
      title,
      description,
      due_date: dueDate.toISOString(),
      priority,
      category,
      is_recurrent: isRecurrent,
      client_name: clientName,
      status,
      completed_at: completedAt ? completedAt.toISOString() : null,
      assignee_id: assigneeId || null, // NOVO
      task_type: taskType || null, // NOVO
      subtasks: subtasks, // NOVO
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTaskToTask(data);
};

// 4. Deletar Tarefa (mantido)
const deleteTaskFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// --- Lógica de Geração de Tarefas Recorrentes (Templates Apenas) ---

const DAY_MAP: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

const generateRecurrentTasks = async (
  templates: TaskTemplate[], 
  existingTasks: Task[],
  addTaskMutation: (task: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'> & { assigneeId?: string }) => void,
  currentUserId: string
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayName = DAY_MAP[getDay(today)];

  const existingTodayRecurrentTasks = existingTasks.filter(t => 
    t.isRecurrent && isSameDay(t.dueDate, today)
  );

  // 1. Gerar Tarefas de Templates
  templates.filter(t => (t.daysOfWeek || []).includes(todayDayName as DayOfWeek)).forEach(template => {
    const alreadyExists = existingTodayRecurrentTasks.some(t => 
      t.title === template.title
    );

    if (!alreadyExists) {
      const dueDate = new Date();
      dueDate.setFullYear(today.getFullYear(), today.getMonth(), today.getDate()); 
      
      if (template.timeOfDay) {
        const [hours, minutes] = template.timeOfDay.split(':').map(Number);
        dueDate.setHours(hours, minutes, 0, 0);
      } else {
        dueDate.setHours(23, 59, 59, 999);
      }

      addTaskMutation({
        title: template.title,
        description: template.description || 'Tarefa gerada automaticamente.',
        dueDate: dueDate,
        priority: template.priority,
        category: template.category,
        isRecurrent: true,
        clientName: template.clientName,
        taskType: template.taskType, // NOVO
        assigneeId: currentUserId, // Atribui ao usuário logado (padrão)
        subtasks: [], // NOVO: Subtarefas vazias por padrão
      });
    }
  });
};


export const useTaskStore = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading, error } = useQuery<Task[], Error>({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: fetchTasks,
    staleTime: 5000, // Dados frescos por 5 segundos
  });

  const addMutation = useMutation({
    mutationFn: addTaskToDB,
    onSuccess: (newTask) => {
      // Atualiza o cache do react-query para incluir a nova tarefa
      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY], (oldTasks) => {
        // Se oldTasks for undefined, retorna um array com a nova tarefa
        return oldTasks ? [newTask, ...oldTasks] : [newTask];
      });
      showSuccess('Nova tarefa adicionada!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar tarefa: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTaskInDB,
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY], (oldTasks) => {
        return oldTasks?.map(t => t.id === updatedTask.id ? updatedTask : t) || [];
      });
      showSuccess(`Tarefa "${updatedTask.title}" atualizada!`);
    },
    onError: (err) => {
      showError(`Erro ao atualizar tarefa: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTaskFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
      showSuccess('Tarefa excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir tarefa: ${err.message}`);
    },
  });
  
  const addTask = (newTask: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'>, options?: any) => {
    // Garante que subtasks seja um array, mesmo que não seja fornecido
    const taskWithSubtasks = { ...newTask, subtasks: newTask.subtasks || [] };
    addMutation.mutate(taskWithSubtasks, options);
  };

  const completeTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        updateMutation.mutate({
            ...task,
            status: 'Concluída',
            completedAt: new Date(),
        });
    }
  };
  
  const updateTask = updateMutation.mutate;
  const deleteTask = deleteMutation.mutate;

  const getTaskById = (taskId: string) => {
    return tasks.find(t => t.id === taskId);
  };

  // --- Lógica de Filtragem (useMemo) ---

  const filteredTasks = useMemo(() => {
    const today = new Date();
    
    // 1. Tarefas Ativas (Não concluídas e não hábitos)
    let activeTasks = tasks.filter(t => 
        t.status !== 'Concluída' && 
        t.category !== 'Hábito'
    );
    
    // 2. Atrasadas (Overdue) - Mantém todas as tarefas, mas marca as atrasadas
    const overdue = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.isOverdue); // Filtra apenas as atrasadas
    
    // 3. Prioridade Alta (Due Today, High Priority)
    const todayHigh = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.priority === 'Alta' && t.category === 'Geral');

    // 4. Prioridade Média (Due Today, Medium Priority)
    const todayMedium = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.priority === 'Média' && t.category === 'Geral');

    // 5. Prioridade Baixa (Due This Week, Low Priority)
    const thisWeekLow = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.priority === 'Baixa' && t.category === 'Geral');
    
    // 6. Categorias Específicas (Tarefas que não são 'Geral' e não foram classificadas acima)
    const agencyTasks = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.category === 'Agência');
    
    const woeTasks = activeTasks.map(task => ({
        ...task,
        isOverdue: isTaskOverdue(task.dueDate),
    })).filter(t => t.category === 'WOE');
    
    // 7. Concluídas
    const completed = tasks.filter(t => t.status === 'Concluída');

    return {
      overdue,
      todayHigh,
      todayMedium,
      thisWeekLow,
      woeTasks,
      agencyTasks,
      generalTasks: [], // Removido
      completed,
    };
  }, [tasks]);

  return {
    ...filteredTasks,
    tasks,
    isLoading,
    error,
    addTask,
    completeTask,
    updateTask,
    deleteTask,
    getTaskById,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};