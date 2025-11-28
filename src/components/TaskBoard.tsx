import React from 'react';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { QuickTaskAdd } from './QuickTaskAdd'; // Importando o QuickTaskAdd

interface TaskBoardProps {
  title: string;
  tasks: Task[];
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void; // Mantendo onEdit para que o TaskCard possa abrir o modal de edição na página Index
  className?: string;
  
  // Props para Adição Rápida
  allowQuickAdd: boolean;
  defaultCategory?: TaskCategory;
  defaultPriority?: TaskPriority;
  onOpenDetailedForm: () => void;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  title, 
  tasks, 
  onComplete, 
  onEdit, // Mantendo onEdit
  className,
  allowQuickAdd,
  defaultCategory = 'Geral',
  defaultPriority = 'Baixa',
  onOpenDetailedForm
}) => {
  return (
    <div className={cn("space-y-3 p-4 bg-card border rounded-lg shadow-sm", className)}>
      <h3 className="text-lg font-bold text-foreground/90 border-b pb-2 mb-2">
        {title} ({tasks.length})
      </h3>
      
      {/* Adição Rápida no Topo do Quadro */}
      {allowQuickAdd && (
        <QuickTaskAdd 
          defaultCategory={defaultCategory}
          defaultPriority={defaultPriority}
          onOpenDetailedForm={onOpenDetailedForm}
        />
      )}

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
              // onDelete não é mais passado, pois TaskCard usa o hook
            />
          ))
        )}
      </div>
    </div>
  );
};