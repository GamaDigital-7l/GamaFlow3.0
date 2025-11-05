import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskCategory, TaskStatus, TaskPriority, TaskTemplate, Habit, TaskType, DayOfWeek } from '@/types/task';
import { isTaskOverdue } from '@/utils/date';
import { showSuccess, showError } from '@/utils/toast';
import { isToday, isThisWeek, isFuture, format, getDay, isSameDay, isBefore, differenceInMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo, useEffect } from 'react';
import { useTelegramNotifications } from './use-telegram-notifications';
import { useSession } from '@/components/SessionContextProvider';
import { PostgrestError } from '@supabase/supabase-js';

const TASKS_QUERY_KEY = 'userTasks';
const TEMPLATES_QUERY_KEY = 'taskTemplates';

// Mapeamento de snake_case para camelCase para o frontend
const mapSupabaseTaskToTask = (data: any): Task => ({
  id: data.id,
  user_id: data.user_id,
  assigneeId: data.assignee_id || undefined, 
  title: data.title,
  description: data.description || '',
  dueDate: new Date(data.due_date),
  priority: data.priority as TaskPriority,
  category: data.category as TaskCategory,
  status: data.status as TaskStatus,
  isRecurrent: data.is_recurrent,
  clientName: data.client_name || undefined,
  completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
  taskType: data.task_type as TaskType || undefined, 
});

// --- Funções de Interação com o Supabase ---

const fetchTasks = async (): Promise<Task[]> => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    if ((error as PostgrestError).code === '406' || (error as PostgrestError).code === '403') return [];
    throw new Error(error.message);
  }
  return data.map(mapSupabaseTaskToTask);
};

const addTaskToDB = async (newTask: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'> & { assigneeId?: string }): Promise<Task> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id, 
      assignee_id: newTask.assigneeId || user.id, 
      title: newTask.title,
      description: newTask.description,
      due_date: newTask.dueDate.toISOString(),
      priority: newTask.priority,
      category: newTask.category,
      is_recurrent: newTask.isRecurrent,
      client_name: newTask.clientName,
      task_type: newTask.taskType, 
      status: 'Pendente',
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTaskToTask(data);
};

const updateTaskInDB = async (updatedTask: Task): Promise<Task> => {
  const { id, title, description, dueDate, priority, category, isRecurrent, clientName, status, completedAt, assigneeId, taskType } = updatedTask;

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
      assignee_id: assigneeId || null, 
      task_type: taskType || null, 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseTaskToTask(data);
};

const deleteTaskFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

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
        taskType: template.taskType, 
        assigneeId: currentUserId, 
      });
    }
  });
};


// --- Hook Principal ---

export function useTaskStore() {
  const queryClient = useQueryClient();
  const { notifyTaskAction } = useTelegramNotifications();
  const { user, isLoading: isLoadingSession } = useSession();
  
  const currentUserId = user?.id;

  const { data: tasks = [], isLoading: isLoadingTasks, error } = useQuery<Task[], Error>({
    queryKey: [TASKS_QUERY_KEY],
    queryFn: fetchTasks,
    enabled: !!currentUserId && !isLoadingSession,
    staleTime: 5000, 
  });

  const { data: templates = [] } = useQuery<TaskTemplate[], Error>({
    queryKey: [TEMPLATES_QUERY_KEY],
    queryFn: async () => {
      const { data } = await supabase.from('task_templates').select('*');
      return data as TaskTemplate[] || [];
    },
    staleTime: Infinity, 
  });

  const addMutation = useMutation({
    mutationFn: addTaskToDB,
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY], (oldTasks) => {
        return oldTasks ? [newTask, ...oldTasks] : [newTask];
      });
      
      if (newTask.priority === 'Alta' && !newTask.isRecurrent) {
          notifyTaskAction(newTask.title, 'PRIORIDADE ALTA', newTask.category, `Vencimento: ${format(newTask.dueDate, 'dd/MM HH:mm')}`);
      }
    },
    onError: (err) => {
      console.error(`Erro ao adicionar tarefa (recorrente): ${err.message}`);
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
    onSuccess: (_, id) => {
      queryClient.setQueryData<Task[]>([TASKS_QUERY_KEY], (oldTasks) => {
        return oldTasks?.filter(t => t.id !== id) || [];
      });
      showSuccess('Tarefa excluída.');
    },
    onError: (err) => {
      showError(`Erro ao excluir tarefa: ${err.message}`);
    },
  });

  useEffect(() => {
    if (!isLoadingTasks && tasks.length > 0 && currentUserId) {
      generateRecurrentTasks(templates, tasks, addMutation.mutate, currentUserId);
    }
  }, [isLoadingTasks, tasks, templates, addMutation.mutate, currentUserId]);
  
  
  useEffect(() => {
    if (isLoadingTasks) return;
    
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    const checkNotifications = () => {
        tasks.filter(t => t.status === 'Pendente').forEach(task => {
            
            if (isTaskOverdue(task.dueDate)) {
                const overdueNotificationKey = `task-overdue-${task.id}-${todayStr}`;
                
                if (!localStorage.getItem(overdueNotificationKey)) {
                    notifyTaskAction(task.title, 'ATRASADA', task.category, `Venceu em: ${format(task.dueDate, 'dd/MM HH:mm')}`);
                    localStorage.setItem(overdueNotificationKey, 'true');
                }
            }
            
            const timeDifference = differenceInMinutes(task.dueDate, now);
            const hasTime = task.dueDate.getHours() !== 23 || task.dueDate.getMinutes() !== 59;
            
            if (hasTime && timeDifference > 0 && timeDifference <= 30) {
                const reminderNotificationKey = `task-reminder-${task.id}`;
                
                if (!localStorage.getItem(reminderNotificationKey)) {
                    notifyTaskAction(task.title, 'LEMBRETE', task.category, `Faltam ${timeDifference} minutos para o vencimento.`);
                    localStorage.setItem(reminderNotificationKey, 'true');
                }
            }
        });
        
        tasks.filter(t => t.status === 'Concluída' || isBefore(t.dueDate, now)).forEach(task => {
            localStorage.removeItem(`task-reminder-${task.id}`);
        });
    };
    
    const intervalId = setInterval(checkNotifications, 5 * 60 * 1000);
    checkNotifications();

    return () => clearInterval(intervalId);
  }, [tasks, isLoadingTasks, notifyTaskAction]);


  const completeTask = useCallback((id: string) => {
    const taskToComplete = tasks.find(t => t.id === id);
    if (taskToComplete) {
      updateMutation.mutate({ 
        ...taskToComplete, 
        status: 'Concluída' as TaskStatus, 
        completedAt: new Date() 
      });
    }
  }, [tasks, updateMutation]);

  const addTask = (newTask: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'>, options?: any) => {
    const taskWithAssignee = {
        ...newTask,
        user_id: user?.id,
        assigneeId: newTask.assigneeId || currentUserId,
    };
    addMutation.mutate(taskWithAssignee, options);
  };
  
  const updateTask = updateMutation.mutate;

  const deleteTask = deleteMutation.mutate;


  // OTIMIZAÇÃO: Centralizar a filtragem e ordenação em um único useMemo
  const filteredTasks = useMemo(() => {
    
    const nonHabitTasks = tasks.filter(t => t.category !== 'Hábito');
    
    const allPending = nonHabitTasks.filter(t => t.status === 'Pendente');
    const completed = nonHabitTasks.filter(t => t.status === 'Concluída');
    
    // Função de ordenação otimizada
    const sortTasks = (taskList: Task[]) => {
      return [...taskList].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    };

    const overdue = sortTasks(allPending.filter(t => isTaskOverdue(t.dueDate)));
    const nonOverduePending = allPending.filter(t => !isTaskOverdue(t.dueDate));

    // Filtros de categoria e prioridade
    const filterBy = (isTodayCheck: boolean, priority: TaskPriority | null, category: TaskCategory) => {
        return sortTasks(nonOverduePending.filter(t => {
            const isCorrectDay = isTodayCheck ? isToday(t.dueDate) : true;
            const isCorrectPriority = priority ? t.priority === priority : true;
            const isCorrectCategory = t.category === category;
            
            // Filtro especial para 'Esta Semana - Baixa'
            if (category === 'Geral' && priority === 'Baixa' && !isTodayCheck) {
                return isThisWeek(t.dueDate, { weekStartsOn: 1 }) && t.priority === 'Baixa' && !isToday(t.dueDate);
            }
            
            return isCorrectDay && isCorrectPriority && isCorrectCategory;
        }));
    };

    const todayHigh = filterBy(true, 'Alta', 'Geral');
    const todayMedium = filterBy(true, 'Média', 'Geral');
    const thisWeekLow = filterBy(false, 'Baixa', 'Geral'); // Usa a lógica especial dentro do filterBy
    const woeTasks = filterBy(false, null, 'WOE');
    const clientTasks = filterBy(false, null, 'Clientes');
    const agencyTasks = filterBy(false, null, 'Agência');

    return {
      overdue,
      todayHigh,
      todayMedium,
      thisWeekLow,
      woeTasks,
      clientTasks,
      agencyTasks,
      completed: sortTasks(completed).reverse(),
    };
  }, [tasks]);

  return {
    ...filteredTasks,
    tasks,
    isLoading: isLoadingTasks || isLoadingSession,
    error,
    addTask,
    completeTask,
    updateTask,
    deleteTask,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}