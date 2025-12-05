import React from 'react';
import { Task, TaskCategory, TaskPriority } from '@/types/task';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle } from 'lucide-react';
import { QuickTaskAdd } from './QuickTaskAdd'; // Import QuickTaskAdd

interface TaskBoardProps {
  title: string;
  tasks: Task[];
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  className?: string;
  defaultCategory?: TaskCategory;
  defaultPriority?: TaskPriority;
  // A função onOpenDetailedForm é passada sem argumentos aqui, pois o QuickTaskAdd já tem os defaults
  onOpenDetailedForm: () => void; 
}

// Função para obter a cor do ponto (baseado na prioridade ou status)
const getDotColor = (title: string) => {
    switch (title) {
        case 'Prioridade Alta': return 'text-red-500';
        case 'Prioridade Média': return 'text-yellow-500';
        case 'Prioridade Baixa': return 'text-blue-500';
        case 'Concluídas': return 'text-green-500';
        default: return 'text-gray-500';
    }
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  title, 
  tasks, 
  onComplete, 
  onEdit,
  className,
  defaultCategory = 'Geral',
  defaultPriority = 'Baixa',
  onOpenDetailedForm
}) => {
  
  const isCompletedBoard = title === 'Concluídas';
  const dotColor = getDotColor(title);

  return (
    <div className={cn("space-y-3 p-4 bg-card border rounded-xl shadow-sm", className)}>
      
      {/* Título e Contador */}
      <div className="flex items-center space-x-2 pb-2 border-b border-border/50">
        {isCompletedBoard ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
            <div className={cn("h-3 w-3 rounded-full", dotColor.replace('text-', 'bg-'))} />
        )}
        <h3 className="text-lg font-bold text-foreground/90">
          {title} ({tasks.length})
        </h3>
      </div>

      {/* Quick Add Input */}
      {!isCompletedBoard && (
        <QuickTaskAdd 
          defaultCategory={defaultCategory}
          defaultPriority={defaultPriority}
          onOpenDetailedForm={onOpenDetailedForm}
        />
      )}

      {/* Lista de Tarefas */}
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">
            Nenhuma tarefa.
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