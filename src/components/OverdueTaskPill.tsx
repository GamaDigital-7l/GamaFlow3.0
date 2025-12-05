import React from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Calendar, Clock, Loader2, Edit } from 'lucide-react';
import { formatDateTime, getDaysOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/hooks/use-task-store';

interface OverdueTaskPillProps {
  task: Task;
  onEdit: (task: Task) => void; // Adicionando prop onEdit
}

const getPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'Alta':
      // Rosa Dyad
      return 'bg-dyad-500 hover:bg-dyad-600';
    case 'Média':
      // Cinza Escuro/Neutro
      return 'bg-gray-600 hover:bg-gray-700';
    case 'Baixa':
      // Cinza Claro/Neutro
      return 'bg-gray-400 hover:bg-gray-500';
    default:
      return 'bg-gray-600 hover:bg-gray-700';
  }
};

export const OverdueTaskPill: React.FC<OverdueTaskPillProps> = ({ task, onEdit }) => {
  const { completeTask, isUpdating } = useTaskStore();
  const daysOverdue = getDaysOverdue(task.dueDate);
  const priorityColor = getPriorityColor(task.priority);
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };

  return (
    <Card 
      className="p-3 border bg-card shadow-md flex flex-col justify-between h-full w-full cursor-pointer hover:shadow-lg transition-shadow" 
      onClick={() => onEdit(task)} // Clique no card abre a edição
    >
      <CardContent className="p-0 space-y-2">
        
        {/* Título e Atraso */}
        <div className="flex justify-between items-start space-x-2">
          <h4 className="text-sm font-semibold leading-tight line-clamp-2 text-foreground">
            {task.title}
          </h4>
          <Badge className="text-xs font-medium h-5 flex-shrink-0 bg-gray-700 text-white dark:bg-gray-600 dark:text-gray-100">
            {daysOverdue} dia(s) atraso
          </Badge>
        </div>

        {/* Detalhes */}
        <div className="space-y-1">
          {task.clientName && (
            <p className="text-xs text-muted-foreground truncate">Cliente: {task.clientName}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Badge className={cn("text-white h-4 px-1.5", priorityColor)}>{task.priority}</Badge>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDateTime(task.dueDate)}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Ações */}
      <div className="pt-3 border-t mt-3 border-border/50 flex space-x-2">
        <Button 
          size="sm" 
          className="flex-1 h-8 px-3 bg-dyad-500 hover:bg-dyad-600"
          onClick={handleComplete}
          disabled={isUpdating}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
          Concluir
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="h-8 w-8 flex-shrink-0"
          onClick={handleEdit}
          disabled={isUpdating}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};