import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskCategory } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { useTaskStore } from '@/hooks/use-task-store';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando o novo componente

interface TaskDetailedFormProps {
  initialCategory?: TaskCategory;
  initialPriority?: TaskPriority;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: { value: TaskCategory, label: string }[] = [
    { value: 'Geral', label: 'Geral' },
    { value: 'Agência', label: 'Agência' },
    { value: 'WOE', label: 'WOE' },
    // 'Clientes' foi removido conforme solicitado
];
const PRIORITY_OPTIONS: { value: TaskPriority, label: string }[] = [
    { value: 'Alta', label: 'Alta' },
    { value: 'Média', label: 'Média' },
    { value: 'Baixa', label: 'Baixa' },
];

// Helper to format time
const formatTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const TaskDetailedForm: React.FC<TaskDetailedFormProps> = ({ initialCategory = 'Geral', initialPriority = 'Média', onCancel }) => {
  const { addTask, isAdding } = useTaskStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [dueTime, setDueTime] = useState(formatTime(new Date()));
  const [priority, setPriority] = useState<TaskPriority>(initialPriority);
  const [category, setCategory] = useState<TaskCategory>(initialCategory);
  const [clientName, setClientName] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    setPriority(initialPriority);
    setCategory(initialCategory);
  }, [initialPriority, initialCategory]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = dueTime.split(':').map(Number);
      const newDate = new Date(date);
      
      if (isNaN(hours) || isNaN(minutes)) {
        newDate.setHours(23, 59, 59, 999);
      } else {
        newDate.setHours(hours, minutes, 0, 0);
      }
      setDueDate(newDate);
    } else {
      setDueDate(undefined);
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
    } else if (dueDate && !newTime) {
        const newDate = new Date(dueDate);
        newDate.setHours(23, 59, 59, 999);
        setDueDate(newDate);
    }
  };
  
  const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubtask.trim()) {
      e.preventDefault();
      setSubtasks(prev => [...prev, newSubtask.trim()]);
      setNewSubtask('');
    }
  };
  
  const handleAddSubtaskClick = () => {
    if (newSubtask.trim()) {
      setSubtasks(prev => [...prev, newSubtask.trim()]);
      setNewSubtask('');
    }
  };
  
  const handleRemoveSubtask = (index: number) => {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('O título da tarefa não pode estar vazio.');
      return;
    }

    if (!dueDate) {
      showError('A data de vencimento é obrigatória.');
      return;
    }
    
    let finalDueDate = dueDate;
    if (dueTime) {
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
      isRecurrent: false,
      clientName: clientName.trim() || undefined,
      subtasks: subtasks, // ADICIONADO
    };

    addTask(newTask, {
      onSuccess: () => {
        onCancel();
      }
    });
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
          required
          disabled={isAdding}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição detalhada da tarefa"
          disabled={isAdding}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Data */}
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
        
        {/* Hora */}
        <div className="grid gap-2">
          <Label htmlFor="dueTime">Horário (Opcional)</Label>
          <Input
            id="dueTime"
            type="time"
            value={dueTime}
            onChange={handleTimeChange}
            disabled={isAdding}
          />
        </div>
      </div>
      
      {/* Prioridade (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Prioridade"
        options={PRIORITY_OPTIONS}
        value={priority}
        onValueChange={(value) => setPriority(value as TaskPriority)}
        disabled={isAdding}
      />
      
      {/* Categoria (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Categoria"
        options={CATEGORY_OPTIONS}
        value={category}
        onValueChange={(value) => setCategory(value as TaskCategory)}
        disabled={isAdding}
      />
      
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
      
      {/* Subtarefas Section */}
      <div className="grid gap-2">
        <Label>Subtarefas (Opcional)</Label>
        <div className="space-y-2">
          {subtasks.map((task, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input value={task} readOnly className="bg-muted/50" />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveSubtask(index)} disabled={isAdding}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input 
            placeholder="Nova subtarefa" 
            value={newSubtask} 
            onChange={(e) => setNewSubtask(e.target.value)} 
            onKeyDown={handleAddSubtask}
            disabled={isAdding}
          />
          <Button type="button" onClick={handleAddSubtaskClick} size="icon" className="bg-dyad-500 hover:bg-dyad-600" disabled={isAdding || !newSubtask.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isAdding}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isAdding}>
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Criar Tarefa'}
        </Button>
      </div>
    </form>
  );
};