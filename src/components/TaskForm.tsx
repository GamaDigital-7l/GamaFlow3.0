import React, { useState } from 'react';
import { Task, KanbanColumnId, TaskPriority, TaskCategory } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Plus, X } from 'lucide-react';
import { useTaskStore } from '@/hooks/use-task-store'; // Importando useTaskStore

interface TaskFormProps {
  post?: Task; // Renomeado de Post para Task para consistência
  onSubmit?: (task: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'>) => void; // Removido se usar useTaskStore
  onCancel: () => void;
  // Novos props para defaults
  initialCategory?: TaskCategory;
  initialPriority?: TaskPriority;
}

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const TaskForm: React.FC<TaskFormProps> = ({ post, onSubmit, onCancel, initialCategory = 'Geral', initialPriority = 'Média' }) => {
  const { addTask, isAdding } = useTaskStore();
  
  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(post?.dueDate || undefined);
  const [dueTime, setDueTime] = useState(getInitialTime(post?.dueDate));
  const [priority, setPriority] = useState<TaskPriority>(post?.priority || initialPriority);
  const [category, setCategory] = useState<TaskCategory>(post?.category || initialCategory);
  const [clientName, setClientName] = useState(post?.clientName || '');
  const [isRecurrent, setIsRecurrent] = useState(post?.isRecurrent || false);
  
  // Removido subtasks e imageUrl, pois este é o formulário de Tarefas, não Posts.

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Mantém a hora atual se a data for alterada
      const currentHours = dueDate?.getHours() || 23;
      const currentMinutes = dueDate?.getMinutes() || 59;
      
      const newDate = new Date(date);
      newDate.setHours(currentHours, currentMinutes, 0, 0);
      
      setDueDate(newDate);
    } else {
      setDueDate(undefined);
      setDueTime(''); // Limpa a hora se a data for removida
    }
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setDueTime(newTime);
    
    if (dueDate && newTime) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(dueDate);
        newDate.setHours(hours, minutes, 0, 0);
        setDueDate(newDate);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('O título da tarefa não pode estar vazio.');
      return;
    }
    
    let finalDueDate = dueDate;
    if (!finalDueDate) {
        showError('A data de vencimento é obrigatória.');
        return;
    } else if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(hours, minutes, 0, 0);
    } else {
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(23, 59, 59, 999);
    }

    const newTask: Omit<Task, 'id' | 'status' | 'completedAt' | 'user_id'> = {
      title: title.trim(),
      description: description.trim(),
      dueDate: finalDueDate,
      priority: priority,
      category: category,
      isRecurrent: isRecurrent,
      clientName: clientName.trim() || undefined,
    };

    // Se onSubmit for fornecido (para uso externo), chame-o. Caso contrário, use o hook.
    if (onSubmit) {
        onSubmit(newTask);
    } else {
        addTask(newTask, {
            onSuccess: () => onCancel(),
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da tarefa"
          disabled={isAdding}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição da tarefa"
          disabled={isAdding}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Seleção de Data */}
        <div className="grid gap-2 col-span-2">
          <Label>Data de Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
                disabled={isAdding}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Seleção de Hora */}
        <div className="grid gap-2">
          <Label htmlFor="dueTime">Horário (Opcional)</Label>
          <Input
            id="dueTime"
            type="time"
            value={dueDate ? dueTime : ''} 
            onChange={handleTimeChange}
            placeholder="HH:mm"
            disabled={isAdding || !dueDate}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="clientName">Cliente Associado (Opcional)</Label>
        <Input
          id="clientName"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Nome do Cliente"
          disabled={isAdding}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} disabled={isAdding}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)} disabled={isAdding}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Geral">Geral</SelectItem>
              <SelectItem value="WOE">WOE</SelectItem>
              <SelectItem value="Clientes">Clientes</SelectItem>
              <SelectItem value="Agência">Agência</SelectItem>
              <SelectItem value="Hábito">Hábito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isRecurrent"
          checked={isRecurrent}
          onChange={(e) => setIsRecurrent(e.target.checked)}
          className="h-4 w-4 text-dyad-500 border-gray-300 rounded focus:ring-dyad-500"
          disabled={isAdding}
        />
        <Label htmlFor="isRecurrent">Recorrente (Apenas para referência)</Label>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isAdding}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isAdding}>
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Tarefa'}
        </Button>
      </div>
    </form>
  );
};