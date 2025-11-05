import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ListTodo, Zap } from 'lucide-react';
import { useTaskStore } from '@/hooks/use-task-store';
import { useHabits } from '@/hooks/use-habits'; // Importando useHabits
import { isToday, format } from 'date-fns';

export const ProductivityMetrics: React.FC = () => {
  const { tasks } = useTaskStore();
  const { completions } = useHabits(); // Usando completions do useHabits

  const metrics = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // 1. Tarefas Comuns Concluídas Hoje (baseado em completedAt)
    const completedTasksToday = tasks.filter(t => t.status === 'Concluída' && t.completedAt && isToday(t.completedAt)).length;
    
    // 2. Hábitos Concluídos Hoje (baseado em habit_completions)
    const completedHabitsToday = completions.filter(c => c.completion_date === todayStr).length;
    
    const totalCompletedToday = completedTasksToday + completedHabitsToday;
    
    const totalPending = tasks.filter(t => t.status === 'Pendente').length;
    
    // Pontos de Produtividade: 10 pontos por tarefa + 1 ponto por hábito (exemplo)
    const productivityPoints = (completedTasksToday * 10) + (completedHabitsToday * 1);

    return {
      completedToday: totalCompletedToday,
      totalPending,
      productivityPoints,
    };
  }, [tasks, completions]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Pontos de Produtividade (Dyad Pink) */}
      <Card className="border"> {/* Borda neutra */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pontos de Produtividade</CardTitle>
          <Zap className="h-4 w-4 text-dyad-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.productivityPoints} pts</div>
          <p className="text-xs text-muted-foreground">Baseado em tarefas e hábitos concluídos hoje</p>
        </CardContent>
      </Card>
      {/* Itens Concluídos Hoje (Neutro) */}
      <Card className="border"> {/* Borda neutra */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens Concluídos Hoje</CardTitle>
          <CheckCircle className="h-4 w-4 text-gray-500" /> {/* Ícone cinza */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completedToday}</div>
          <p className="text-xs text-muted-foreground">Ótimo trabalho!</p>
        </CardContent>
      </Card>
      {/* Total de Tarefas Pendentes (Neutro) */}
      <Card className="border"> {/* Borda neutra */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Tarefas Pendentes</CardTitle>
          <ListTodo className="h-4 w-4 text-gray-500" /> {/* Ícone cinza */}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalPending}</div>
          <p className="text-xs text-muted-foreground">Foco na organização</p>
        </CardContent>
      </Card>
    </div>
  );
};