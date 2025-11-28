import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Clock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useGoals } from '@/hooks/use-goals';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const GoalProgressSummary: React.FC = () => {
  const { goals, isLoading } = useGoals();

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtra metas que estão ativas ou que venceram/concluíram neste mês
    const relevantGoals = goals.filter(g => 
        g.startDate.getMonth() === currentMonth && 
        g.startDate.getFullYear() === currentYear
    );
    
    const inProgress = relevantGoals.filter(g => g.status === 'Em Andamento').length;
    const completed = relevantGoals.filter(g => g.status === 'Concluída').length;
    const overdue = relevantGoals.filter(g => g.status === 'Atrasada').length;
    
    return { inProgress, completed, overdue, total: relevantGoals.length };
  }, [goals]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="h-5 w-5 animate-spin text-dyad-500 mx-auto" />
      </Card>
    );
  }
  
  if (summary.total === 0) {
      return null; // Não exibe se não houver metas relevantes no mês
  }

  return (
    <Link to="/goals" className="block">
      <Card className="p-4 border-l-4 border-dyad-500/50 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center space-x-2">
            <Target className="h-5 w-5 text-dyad-500" />
            <span>Metas do Mês</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 pt-2 space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center text-dyad-500">
              <Clock className="h-4 w-4 mr-1" /> Em Andamento
            </span>
            <span className="font-bold">{summary.inProgress}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-1" /> Concluída(s)
            </span>
            <span className="font-bold">{summary.completed}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center text-red-500">
              <AlertTriangle className="h-4 w-4 mr-1" /> Atrasada(s)
            </span>
            <span className="font-bold">{summary.overdue}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};