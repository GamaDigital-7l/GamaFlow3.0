import React from 'react';
import { Task, TaskPriority } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, CheckCircle, AlertTriangle, Edit, Trash2, Loader2 } from 'lucide-react';
import { formatDateTime, isTaskOverdue, getDaysOverdue } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/hooks/use-task-store'; // Importando useTaskStore

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'Alta':
      // Rosa Dyad
      return 'bg-dyad-500 text-white';
    case 'Média':
      // Cinza Escuro/Neutro
      return 'bg-gray-600 text-white dark:bg-gray-700 dark:text-gray-200';
    case 'Baixa':
      // Cinza Claro/Neutro
      return 'bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-100';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onEdit }) => {
  const { deleteTask, isDeleting, isUpdating } = useTaskStore();
  
  const isOverdue = isTaskOverdue(task.dueDate) && task.status === 'Pendente';
  const isCompleted = task.status === 'Concluída';
  
  const priorityBadgeClass = getPriorityColor(task.priority);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      deleteTask(task.id);
    }
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };
  
  const handleCompleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete(task.id);
  };
  
  // Se qualquer mutação (update ou delete) estiver pendente, desabilitamos as ações
  const isDisabled = isDeleting || isUpdating;

  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md p-2 border cursor-pointer", // Reduzindo o padding
      isOverdue && "border-red-500 border-2", 
      // Novo fundo para concluídas: Cinza mais escuro no light, cinza mais claro no dark
      isCompleted && "opacity-70 bg-gray-200/50 dark:bg-gray-700/50" 
    )} onClick={handleEditClick}>
      <CardContent className="p-0 space-y-1">
        
        {/* Linha 1: Título e Ações */}
        <div className="flex justify-between items-center space-x-2">
          <h4 className={cn(
            "text-sm font-semibold leading-snug line-clamp-2 flex-grow", // Título menor
            isCompleted && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
          
          {/* Ações (Compactadas e no topo) */}
          <div className="flex space-x-0.5 flex-shrink-0">
            {/* 1. Concluir (Se não estiver concluída) */}
            {!isCompleted && (
              <Button 
                size="icon" 
                className="h-6 w-6 bg-dyad-500 hover:bg-dyad-600"
                onClick={handleCompleteClick}
                title="Concluir Tarefa"
                disabled={isDisabled}
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
              </Button>
            )}
            {/* 2. Editar */}
            <Button 
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-muted" // Alterado para cinza
              onClick={handleEditClick}
              title="Editar Tarefa"
              disabled={isDisabled}
            >
              <Edit className="h-3 w-3" />
            </Button>
            {/* 3. Excluir (Cinza e menos proeminente) */}
            <Button 
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-muted" // Mantido cinza
              onClick={handleDeleteClick}
              title="Excluir Tarefa"
              disabled={isDisabled}
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Linha 2: Detalhes (Data, Prioridade, Cliente, Atraso) */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          
          {/* Data e Prioridade */}
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-white h-4 px-1.5 text-[10px] font-bold", priorityBadgeClass)}>
              {task.priority}
            </Badge>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{formatDateTime(task.dueDate)}</span>
            </div>
          </div>
          
          {/* Cliente e Atraso */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            {task.clientName && (
              <Badge variant="secondary" className="text-dyad-500 font-medium h-5 text-xs">
                {task.clientName}
              </Badge>
            )}
            {isOverdue && (
              <div className="flex items-center text-red-600 dark:text-red-400 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                {getDaysOverdue(task.dueDate)} dia(s) atraso
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};