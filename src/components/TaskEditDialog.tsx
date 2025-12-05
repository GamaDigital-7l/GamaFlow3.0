import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskCategory } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, Plus, X, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTaskStore } from '@/hooks/use-task-store';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HorizontalRadioSelect } from './HorizontalRadioSelect'; // Importando HorizontalRadioSelect

interface TaskEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSave: (post: Task) => void;
  onDelete: (post: Task) => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority, label: string }[] = [
    { value: 'Alta', label: 'Alta' },
    { value: 'Média', label: 'Média' },
    { value: 'Baixa', label: 'Baixa' },
];
const CATEGORY_OPTIONS: { value: TaskCategory, label: string }[] = [
    { value: 'Geral', label: 'Geral' },
    { value: 'Agência', label: 'Agência' },
    { value: 'WOE', label: 'WOE' },
    { value: 'Hábito', label: 'Hábito' },
];
const STATUS_OPTIONS: { value: Task['status'], label: string }[] = [
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Concluída', label: 'Concluída' },
];


// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ isOpen, onOpenChange, task, onSave, onDelete }) => {
  const { isUpdating } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate);
  const [dueTime, setDueTime] = useState(getInitialTime(task.dueDate));
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [isRecurrent, setIsRecurrent] = useState(task.isRecurrent);
  const [status, setStatus] = useState(task.status);
  const [clientName, setClientName] = useState(task.clientName || '');
  const [subtasks, setSubtasks] = useState<string[]>(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    // Sincroniza o estado interno quando a tarefa externa muda (ex: ao abrir o modal)
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setDueTime(getInitialTime(task.dueDate));
    setPriority(task.priority);
    setCategory(task.category);
    setIsRecurrent(task.isRecurrent);
    setStatus(task.status);
    setClientName(task.clientName || '');
    setSubtasks(task.subtasks || []);
    setNewSubtask(''); // Limpa o input de nova subtarefa
  }, [task]);

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
      showError('A data de vencimento não pode estar vazia.');
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


    const updatedTask: Task = {
      ...task,
      title: title.trim(),
      description: description.trim(),
      dueDate: finalDueDate,
      priority: priority,
      category: category,
      isRecurrent: isRecurrent,
      status: status,
      clientName: clientName.trim() || undefined,
      subtasks: subtasks,
      completedAt: status === 'Concluída' && task.status !== 'Concluída' ? new Date() : task.completedAt,
    };

    onSave(updatedTask);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o post "${title}"?`)) {
      onDelete(task);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 w-[98%]">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              disabled={isUpdating}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da tarefa"
              disabled={isUpdating}
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
                    disabled={isUpdating}
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
              <Label htmlFor="dueTime">Horário</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={handleTimeChange}
                disabled={isUpdating}
              />
            </div>
          </div>
          
          {/* Nome do Cliente */}
          <div className="grid gap-2">
            <Label htmlFor="clientName">Cliente Associado (Opcional)</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do Cliente"
              disabled={isUpdating}
            />
          </div>
          
          {/* Prioridade (HorizontalRadioSelect) */}
          <HorizontalRadioSelect
            label="Prioridade"
            options={PRIORITY_OPTIONS}
            value={priority}
            onValueChange={(value) => setPriority(value as TaskPriority)}
            disabled={isUpdating}
          />
          
          {/* Categoria (HorizontalRadioSelect) */}
          <HorizontalRadioSelect
            label="Categoria"
            options={CATEGORY_OPTIONS}
            value={category}
            onValueChange={(value) => setCategory(value as TaskCategory)}
            disabled={isUpdating}
          />
          
          {/* Status (HorizontalRadioSelect) */}
          <HorizontalRadioSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value as Task['status'])}
            disabled={isUpdating}
          />
          
          {/* Subtarefas Section */}
          <div className="grid gap-2">
            <Label>Subtarefas (Opcional)</Label>
            <div className="space-y-2">
              {subtasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={task} readOnly className="bg-muted/50" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveSubtask(index)} disabled={isUpdating}>
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
                disabled={isUpdating}
              />
              <Button type="button" onClick={handleAddSubtaskClick} size="icon" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUpdating || !newSubtask.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <Label htmlFor="isRecurrent" className="font-medium">Recorrente?</Label>
            <Switch
              id="isRecurrent"
              checked={isRecurrent}
              onCheckedChange={setIsRecurrent}
              disabled={isUpdating}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button variant="destructive" onClick={handleDelete} disabled={isUpdating}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir Tarefa
            </Button>
            <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};