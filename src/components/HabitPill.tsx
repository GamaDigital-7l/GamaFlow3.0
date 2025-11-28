import React, { useState } from 'react';
import { Habit } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHabits } from '@/hooks/use-habits';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HabitPillProps {
  habit: Habit & { isCompletedToday: boolean, currentStreak: number, maxStreak: number, totalCompleted: number };
}

export const HabitPill: React.FC<HabitPillProps> = ({ habit }) => {
  const { completeHabit, uncompleteHabit, isUpdating } = useHabits();
  const [isPending, setIsPending] = useState(false);

  const handleToggleCompletion = async () => {
    if (isPending) return;
    
    setIsPending(true);
    
    if (habit.isCompletedToday) {
      // Desfazer conclusão
      uncompleteHabit(habit.id, {
        onSettled: () => setIsPending(false),
      });
    } else {
      // Concluir
      completeHabit(habit.id, {
        onSettled: () => setIsPending(false),
      });
    }
  };

  const cardClasses = cn(
    "p-3 border shadow-sm transition-all duration-300 flex flex-col justify-between h-full",
    habit.isCompletedToday 
      ? "border-dyad-500/20 bg-muted/50" // Destaque sutil na conclusão
      : "border-border bg-card hover:shadow-md"
  );

  const buttonClasses = cn(
    "w-full h-8 px-3 text-xs",
    "bg-dyad-500 hover:bg-dyad-600" // Botão sempre Dyad Pink
  );
  
  const titleClasses = cn(
    "text-sm font-semibold leading-tight line-clamp-2",
    habit.isCompletedToday ? "line-through text-muted-foreground" : "text-foreground"
  );

  const tooltipContent = (
    <div className="text-xs space-y-1">
      <p>Sequência Atual: <span className="font-bold text-dyad-300">{habit.currentStreak} dias</span></p>
      <p>Maior Sequência: <span className="font-bold text-dyad-300">{habit.maxStreak} dias</span></p>
      <p>Total Concluído: {habit.totalCompleted} vezes</p>
      {habit.description && <p className="mt-1 border-t border-gray-700 pt-1 italic">{habit.description}</p>}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className={cardClasses}>
          <CardContent className="p-0 space-y-2">
            
            {/* Título e Status */}
            <div className="flex justify-between items-start space-x-2">
              <h4 className={titleClasses}>
                {habit.title}
              </h4>
              {/* Ícone Zap sempre Dyad Pink */}
              <Zap className="h-4 w-4 text-dyad-500 flex-shrink-0" />
            </div>

            {/* Streak */}
            <div className="text-xs text-muted-foreground">
              {habit.currentStreak > 0 ? (
                <span className="font-medium text-dyad-500">🔥 {habit.currentStreak} dias seguidos</span>
              ) : (
                <span>Inicie sua sequência!</span>
              )}
            </div>
          </CardContent>
          
          {/* Ação */}
          <div className="pt-3 border-t mt-3 border-border/50">
            <Button 
              size="sm" 
              className={buttonClasses}
              onClick={handleToggleCompletion}
              disabled={isPending || isUpdating}
            >
              {isPending || isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {habit.isCompletedToday ? 'Desfazer' : 'Concluir'}
                </>
              )}
            </Button>
          </div>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
};