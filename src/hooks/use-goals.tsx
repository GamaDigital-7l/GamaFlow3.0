import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Goal, GoalCategory, GoalStatus } from '@/types/goals';
import { showSuccess, showError } from '@/utils/toast';
import { isPast, isBefore } from 'date-fns';
import { useMemo } from 'react';

const GOALS_QUERY_KEY = 'userGoals';

// Mapeamento de snake_case para camelCase
const mapSupabaseGoalToGoal = (data: any): Goal => ({
  id: data.id,
  user_id: data.user_id,
  title: data.title,
  description: data.description || undefined,
  category: data.category as GoalCategory,
  startDate: new Date(data.start_date),
  dueDate: new Date(data.due_date),
  targetValue: data.target_value ? parseFloat(data.target_value) : undefined,
  currentValue: parseFloat(data.current_value || 0),
  isRecurrent: data.is_recurrent,
  status: data.status as GoalStatus,
  clientId: data.client_id || undefined,
  createdAt: data.created_at,
  // Campos de Portfólio
  isPortfolioGoal: data.is_portfolio_goal || false,
  portfolioType: data.portfolio_type || undefined,
  portfolioCategory: data.portfolio_category || undefined,
  portfolioLinks: data.portfolio_links || undefined,
});

// 1. Buscar Metas
const fetchGoals = async (): Promise<Goal[]> => {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data.map(mapSupabaseGoalToGoal);
};

// 2. Adicionar Meta
const addGoalToDB = async (goal: Omit<Goal, 'id' | 'user_id' | 'createdAt' | 'status' | 'currentValue'>): Promise<Goal> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      start_date: goal.startDate.toISOString(),
      due_date: goal.dueDate.toISOString(),
      target_value: goal.targetValue,
      is_recurrent: goal.isRecurrent,
      client_id: goal.clientId,
      // Portfolio fields
      is_portfolio_goal: goal.isPortfolioGoal,
      portfolio_type: goal.portfolioType,
      portfolio_category: goal.portfolioCategory,
      portfolio_links: goal.portfolioLinks,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseGoalToGoal(data);
};

// 3. Atualizar Meta
const updateGoalInDB = async (goal: Goal): Promise<Goal> => {
  const { id, title, description, category, startDate, dueDate, targetValue, currentValue, isRecurrent, status, clientId, isPortfolioGoal, portfolioType, portfolioCategory, portfolioLinks } = goal;

  const { data, error } = await supabase
    .from('goals')
    .update({
      title,
      description,
      category,
      start_date: startDate.toISOString(),
      due_date: dueDate.toISOString(),
      target_value: targetValue,
      current_value: currentValue,
      is_recurrent: isRecurrent,
      status,
      client_id: clientId,
      // Portfolio fields
      is_portfolio_goal: isPortfolioGoal,
      portfolio_type: portfolioType,
      portfolio_category: portfolioCategory,
      portfolio_links: portfolioLinks,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSupabaseGoalToGoal(data);
};

// 4. Deletar Meta
const deleteGoalFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

// Função para calcular o progresso e status
const calculateGoalStatus = (goal: Goal) => {
    let percentage = 0;
    let status: GoalStatus = goal.status;
    const now = new Date();

    if (goal.targetValue && goal.targetValue > 0) {
        percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
    } else if (goal.currentValue > 0) {
        // Se não há valor alvo, mas há valor atual, assumimos 100% se já foi iniciado
        percentage = 100;
    }

    if (status === 'Concluída') {
        percentage = 100;
    } else if (isPast(goal.dueDate) && isBefore(goal.dueDate, now)) {
        status = 'Atrasada';
    } else if (percentage === 100) {
        status = 'Concluída';
    } else {
        status = 'Em Andamento';
    }
    
    return { percentage, status };
};


export const useGoals = () => {
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery<Goal[], Error>({
    queryKey: [GOALS_QUERY_KEY],
    queryFn: fetchGoals,
    staleTime: 300000, // 5 minutos de cache
  });

  const goalsWithStatus = useMemo(() => {
    return goals.map(goal => {
      const { percentage, status } = calculateGoalStatus(goal);
      return {
        ...goal,
        percentage,
        status,
      };
    });
  }, [goals]);

  const addMutation = useMutation({
    mutationFn: addGoalToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
      showSuccess('Meta adicionada!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar meta: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateGoalInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
      showSuccess('Meta atualizada!');
    },
    onError: (err) => {
      showError(`Erro ao atualizar meta: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoalFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [GOALS_QUERY_KEY] });
      showSuccess('Meta excluída!');
    },
    onError: (err) => {
      showError(`Erro ao excluir meta: ${err.message}`);
    },
  });
  
  // Função para incrementar o valor atual de uma meta (usada para integração)
  const incrementGoalValue = (goalId: string, amount: number = 1) => {
    const goal = goalsWithStatus.find(g => g.id === goalId);
    if (goal && goal.status === 'Em Andamento') {
        const newCurrentValue = goal.currentValue + amount;
        const newStatus: GoalStatus = (goal.targetValue && newCurrentValue >= goal.targetValue) ? 'Concluída' : 'Em Andamento';
        
        updateMutation.mutate({
            ...goal,
            currentValue: newCurrentValue,
            status: newStatus,
        });
    }
  };

  return {
    goals: goalsWithStatus,
    isLoading,
    addGoal: addMutation.mutate,
    updateGoal: updateMutation.mutate,
    deleteGoal: deleteMutation.mutate,
    incrementGoalValue,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};