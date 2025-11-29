import React from 'react';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TaskBoardProps {
  title: string;
  tasks: Task[];
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  className?: string;
  allowQuickAdd: boolean;
  defaultCategory?: TaskCategory;
  defaultPriority?: TaskPriority;
  onOpenDetailedForm: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  title, 
  tasks, 
  onComplete, 
  onEdit,
  className,
  allowQuickAdd,
  defaultCategory = 'Geral',
  defaultPriority = 'Baixa',
  onOpenDetailedForm
}) => {
  return (
    <div className={cn("space-y-3 p-4 bg-card border rounded-lg shadow-sm", className)}>
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <h3 className="text-lg font-bold text-foreground/90">
          {title} ({tasks.length})
        </h3>
        {allowQuickAdd && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onOpenDetailedForm}
            className="h-8 px-2 text-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar tarefa
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md text-center">
            Nenhuma tarefa nesta seção.
          </p>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onComplete={onComplete} 
              onEdit={onEdit} 
            />
          ))
        )}
      </div>
    </div>
  );
};