import React from 'react';
import { Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HabitPill } from './HabitPill';
import { Card } from '@/components/ui/card';

interface HabitBoardProps {
  habits: any[]; // Habit & Status
  onOpenDetailedForm: () => void;
}

export const HabitBoard: React.FC<HabitBoardProps> = ({ habits, onOpenDetailedForm }) => {
  return (
    <div className={cn("space-y-3 p-4 bg-card border rounded-lg shadow-sm")}>
      <h3 className="text-lg font-bold text-foreground/90 border-b pb-2 mb-2 flex items-center space-x-2">
        <Zap className="h-5 w-5 text-dyad-500" />
        <span>Hábitos de Hoje ({habits.length})</span>
      </h3>
      
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md text-center">
            Nenhum hábito esperado para hoje.
          </p>
        ) : (
          habits.map(habit => (
            <HabitPill key={habit.id} habit={habit} />
          ))
        )}
      </div>
    </div>
  );
};