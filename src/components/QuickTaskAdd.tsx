import React, { useState } from 'react';
import { Plus, ListPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '@/hooks/use-task-store';
import { TaskCategory, TaskPriority } from '@/types/task';
import { showSuccess, showError } from '@/utils/toast';

interface QuickTaskAddProps {
  // Props para definir onde a tarefa será categorizada
  defaultCategory: TaskCategory;
  defaultPriority: TaskPriority;
  // Função para abrir o formulário detalhado (Shift+Enter)
  onOpenDetailedForm: () => void;
}

export const QuickTaskAdd: React.FC<QuickTaskAddProps> = ({ defaultCategory, defaultPriority, onOpenDetailedForm }) => {
  const [title, setTitle] = useState('');
  const { addTask, isAdding } = useTaskStore();

  const handleAddTask = () => {
    if (!title.trim()) {
      showError('O título da tarefa não pode estar vazio.');
      return;
    }

    // A data de vencimento é definida com base na categoria/prioridade:
    // Se for 'Hoje', a data é hoje (fim do dia). Se for 'Esta Semana', a data é o fim da semana.
    let dueDate = new Date(new Date().setHours(23, 59, 59, 999));
    
    // Lógica simplificada para data de vencimento (mantendo o comportamento anterior)
    if (defaultCategory === 'Geral' && defaultPriority === 'Baixa') {
        // Se for "Esta Semana - Baixa", definimos para o final da semana (ex: Domingo)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        dueDate = new Date(today.getTime() + daysUntilSunday * 86400000);
        dueDate.setHours(23, 59, 59, 999);
    }


    const newTask = {
      title: title.trim(),
      description: 'Adicionada rapidamente.',
      dueDate: dueDate,
      priority: defaultPriority, // USANDO A PRIORIDADE DA COLUNA
      category: defaultCategory, // USANDO A CATEGORIA DA COLUNA
      isRecurrent: false,
      subtasks: [],
    };

    addTask(newTask, {
      onSuccess: () => {
        setTitle('');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter abre o formulário detalhado
        onOpenDetailedForm();
      } else {
        // Enter adiciona a tarefa rápida
        handleAddTask();
      }
    }
  };

  return (
    <div className="flex space-x-2 mb-3">
      <Input
        placeholder="Adicionar tarefa rápida (Shift+Enter para detalhes)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow h-9 text-sm"
        disabled={isAdding}
      />
      <Button 
        size="icon" 
        onClick={handleAddTask}
        className="h-9 w-9 bg-dyad-500 hover:bg-dyad-600 flex-shrink-0"
        disabled={isAdding}
      >
        {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
};