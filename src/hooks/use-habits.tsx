import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Habit, HabitCompletion, DayOfWeek } from '@/types/task';
import { showSuccess, showError } from '@/utils/toast';
import { format, subDays, isSameDay, parseISO, differenceInDays, getDay, isYesterday } from 'date-fns';
import { useMemo, useEffect } from 'react';
import { useTelegramNotifications } from './use-telegram-notifications';

const HABITS_QUERY_KEY = 'habits';
const COMPLETIONS_QUERY_KEY = 'habitCompletions';

// Mapeamento de número do dia da semana (0=Dom, 1=Seg...) para DayOfWeek
const DAY_MAP: Record<number, DayOfWeek> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat'
};

// --- Funções de Busca e Mutação ---

const fetchHabits = async (): Promise<Habit[]> => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as Habit[];
};

const fetchCompletions = async (): Promise<HabitCompletion[]> => {
  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .order('completion_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data as HabitCompletion[];
};

const addHabitToDB = async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'>): Promise<Habit> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      title: habit.title,
      description: habit.description,
      frequency: habit.frequency,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Habit;
};

const updateHabitInDB = async (habit: Habit): Promise<Habit> => {
  const { id, title, description, frequency } = habit;

  const { data, error } = await supabase
    .from('habits')
    .update({ 
      title, 
      description, 
      frequency, 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Habit;
};

const deleteHabitFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

const completeHabitToday = async (habitId: string): Promise<HabitCompletion> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('habit_completions')
    .insert({
      habit_id: habitId,
      user_id: user.id,
      completion_date: today,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { 
        throw new Error('Hábito já concluído hoje!');
    }
    throw new Error(error.message);
  }
  return data as HabitCompletion;
};

const uncompleteHabitToday = async (habitId: string): Promise<void> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const { error } = await supabase
    .from('habit_completions')
    .delete()
    .eq('habit_id', habitId)
    .eq('completion_date', today);

  if (error) {
    throw new Error(error.message);
  }
};

// Verifica se o hábito é esperado para ser feito em uma determinada data
const isHabitExpectedOnDate = (habit: Habit, date: Date): boolean => {
    if (habit.frequency === 'daily') {
        return true;
    }
    // date-fns getDay retorna 0 para Domingo, 1 para Segunda...
    const dayName = DAY_MAP[getDay(date)]; 
    const expectedDays = habit.frequency.split(',');
    return expectedDays.includes(dayName);
};

// Lógica de cálculo de Streak (mantida)
const calculateStreaks = (habitId: string, completions: HabitCompletion[]) => {
    const habitCompletions = completions
        .filter(c => c.habit_id === habitId)
        .map(c => format(parseISO(c.completion_date), 'yyyy-MM-dd'))
        .sort()
        .reverse(); 

    let currentStreak = 0;
    let maxStreak = 0;
    let totalCompleted = habitCompletions.length;
    let consecutiveDays = 0;
    let lastDate: Date | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Verifica se o hábito foi feito hoje
    const completedToday = habitCompletions.some(dateStr => isSameDay(parseISO(dateStr), today));
    
    if (completedToday) {
        currentStreak = 1;
        lastDate = today;
    } else {
        const yesterday = subDays(today, 1);
        if (habitCompletions.some(dateStr => isSameDay(parseISO(dateStr), yesterday))) {
            lastDate = yesterday;
        }
    }

    for (const dateStr of habitCompletions) {
        const completionDate = parseISO(dateStr);
        completionDate.setHours(0, 0, 0, 0);

        if (lastDate) {
            const diff = differenceInDays(lastDate, completionDate);
            
            if (diff === 1) {
                consecutiveDays++;
                lastDate = completionDate;
            } else if (diff > 1) {
                break; 
            }
        }
    }
    
    if (completedToday) {
        currentStreak = consecutiveDays + 1;
    } else if (consecutiveDays > 0) {
        currentStreak = consecutiveDays;
    } else {
        currentStreak = 0;
    }

    maxStreak = Math.max(currentStreak, ...habitCompletions.map((_, index) => {
        let tempStreak = 0;
        let tempLastDate: Date | null = parseISO(habitCompletions[index]);
        tempLastDate.setHours(0, 0, 0, 0);
        
        for (let i = index + 1; i < habitCompletions.length; i++) {
            const prevDate = parseISO(habitCompletions[i]);
            prevDate.setHours(0, 0, 0, 0);
            if (differenceInDays(tempLastDate, prevDate) === 1) {
                tempStreak++;
                tempLastDate = prevDate;
            } else {
                break; 
            }
        }
        return tempStreak + 1;
    }));


    return { currentStreak, maxStreak, totalCompleted };
};


// --- Hook Principal ---

export const useHabits = () => {
  const queryClient = useQueryClient();
  const { notifyTaskAction } = useTelegramNotifications();

  const { data: habits = [], isLoading: isLoadingHabits } = useQuery<Habit[], Error>({
    queryKey: [HABITS_QUERY_KEY],
    queryFn: fetchHabits,
    staleTime: 300000, // 5 minutos de cache
  });

  const { data: completions = [], isLoading: isLoadingCompletions } = useQuery<HabitCompletion[], Error>({
    queryKey: [COMPLETIONS_QUERY_KEY],
    queryFn: fetchCompletions,
    staleTime: 5000, // Completions são mais voláteis
  });

  const addMutation = useMutation({
    mutationFn: addHabitToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
      showSuccess('Hábito adicionado!');
    },
    onError: (err) => {
      showError(`Erro ao adicionar hábito: ${err.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateHabitInDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
      showSuccess('Hábito atualizado!');
    },
    onError: (err) => {
      showError(`Erro ao atualizar hábito: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHabitFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [HABITS_QUERY_KEY] });
      showSuccess('Hábito excluído!');
    },
    onError: (err) => {
      showError(`Erro ao excluir hábito: ${err.message}`);
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeHabitToday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPLETIONS_QUERY_KEY] });
      showSuccess('Hábito concluído hoje!');
    },
    onError: (err) => {
      if (err.message.includes('Hábito já concluído hoje!')) {
        showError(err.message);
      } else {
        showError(`Erro ao concluir hábito: ${err.message}`);
      }
    },
  });
  
  const uncompleteMutation = useMutation({
    mutationFn: uncompleteHabitToday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COMPLETIONS_QUERY_KEY] });
      showSuccess('Conclusão desfeita.');
    },
    onError: (err) => {
      showError(`Erro ao desfazer conclusão: ${err.message}`);
    },
  });

  // Mapeia o status de conclusão e as streaks para cada hábito
  const habitsWithStatus = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    today.setHours(0, 0, 0, 0);
    
    return habits.map(habit => {
      const isCompletedToday = completions.some(c => 
        c.habit_id === habit.id && c.completion_date === todayStr
      );
      
      const { currentStreak, maxStreak, totalCompleted } = calculateStreaks(habit.id, completions);
      const isExpectedToday = isHabitExpectedOnDate(habit, today);

      return {
        ...habit,
        isCompletedToday,
        currentStreak,
        maxStreak,
        totalCompleted,
        isExpectedToday,
      };
    });
  }, [habits, completions]);

  // Lógica de Alerta (2 dias seguidos sem fazer)
  const habitAlerts = useMemo(() => {
    const alerts: { habitId: string, title: string, message: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    habitsWithStatus.forEach(habit => {
      // Só verifica se o hábito é esperado hoje E não foi concluído
      if (habit.isExpectedToday && !habit.isCompletedToday) {
        
        const completedDates = completions
            .filter(c => c.habit_id === habit.id)
            .map(c => parseISO(c.completion_date));

        const yesterday = subDays(today, 1);
        const dayBeforeYesterday = subDays(today, 2);
        
        const wasExpectedYesterday = isHabitExpectedOnDate(habit, yesterday);
        const wasExpectedDayBefore = isHabitExpectedOnDate(habit, dayBeforeYesterday);
        
        const completedYesterday = completedDates.some(date => isSameDay(date, yesterday));
        const completedDayBefore = completedDates.some(date => isSameDay(date, dayBeforeYesterday));

        // Se era esperado ontem E não foi concluído ontem, E era esperado anteontem E não foi concluído anteontem
        if (wasExpectedYesterday && !completedYesterday && wasExpectedDayBefore && !completedDayBefore) {
            alerts.push({
                habitId: habit.id,
                title: habit.title,
                message: `Você quebrou seu hábito: "${habit.title}" por 2 dias seguidos que eram esperados.`,
            });
        }
      }
    });

    return alerts;
  }, [habitsWithStatus, completions]);
  
  // --- Notificação de Hábito Recorrente Não Concluído (Verifica o dia anterior) ---
  useEffect(() => {
    if (isLoadingHabits || isLoadingCompletions) return;
    
    const checkMissedHabits = () => {
        const yesterday = subDays(new Date(), 1);
        const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
        
        habitsWithStatus.forEach(habit => {
            const wasExpectedYesterday = isHabitExpectedOnDate(habit, yesterday);
            
            const completedYesterday = completions.some(c => 
                c.habit_id === habit.id && c.completion_date === yesterdayStr
            );
            
            if (wasExpectedYesterday && !completedYesterday) {
                const notificationId = `missed-habit-${habit.id}-${yesterdayStr}`;
                
                if (!localStorage.getItem(notificationId)) {
                    notifyTaskAction(
                        habit.title, 
                        'RECORRENTE NÃO CONCLUÍDA', 
                        'Hábitos', 
                        `Deveria ter sido concluído em: ${format(yesterday, 'dd/MM')}`
                    );
                    localStorage.setItem(notificationId, 'true');
                }
            }
        });
    };
    
    checkMissedHabits();
    
  }, [habitsWithStatus, completions, isLoadingHabits, isLoadingCompletions, notifyTaskAction]);


  return {
    habits: habitsWithStatus,
    completions,
    isLoading: isLoadingHabits || isLoadingCompletions,
    addHabit: addMutation.mutate,
    updateHabit: updateMutation.mutate,
    deleteHabit: deleteMutation.mutate,
    completeHabit: completeMutation.mutate,
    uncompleteHabit: uncompleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending || completeMutation.isPending || uncompleteMutation.isPending,
    isDeleting: deleteMutation.isPending,
    habitAlerts,
  };
};