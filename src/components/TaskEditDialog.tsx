import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskCategory } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTaskStore } from '@/hooks/use-task-store'; // Importando useTaskStore

interface TaskEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  // onSave removido
}

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({ isOpen, onOpenChange, task }) => {
  const { updateTask, isUpdating } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate);
  const [dueTime, setDueTime] = useState(getInitialTime(task.dueDate)); // Novo estado para hora
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [isRecurrent, setIsRecurrent] = useState(task.isRecurrent);
  const [status, setStatus] = useState(task.status); // Permitir edição de status
  const [clientName, setClientName] = useState(task.clientName || ''); // Novo estado para clientName

  useEffect(() => {
    // Sincroniza o estado interno quando a tarefa externa muda (ex: ao abrir o modal)
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.dueDate);
    setDueTime(getInitialTime(task.dueDate)); // Sincroniza a hora
    setPriority(task.priority);
    setCategory(task.category);
    setIsRecurrent(task.isRecurrent);
    setStatus(task.status);
    setClientName(task.clientName || '');
  }, [task]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Usa a hora atual do estado dueTime para definir a hora na nova data
      const [hours, minutes] = dueTime.split(':').map(Number);
      
      const newDate = new Date(date);
      // Se dueTime for vazio ou inválido, usa o final do dia (23:59)
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
        // Se o usuário apagar a hora, define para o final do dia (se houver data)
        const newDate = new Date(dueDate);
        newDate.setHours(23, 59, 59, 999);
        setDueDate(newDate);
    }
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
    
    // Garante que a hora seja aplicada se o usuário só mudou a data
    let finalDueDate = dueDate;
    if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(hours, minutes, 0, 0);
    } else {
        // Se a hora não foi definida, define para o final do dia
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
      clientName: clientName.trim() || undefined, // Salva o nome do cliente
      // Se o status for alterado para Concluída, atualiza completedAt
      completedAt: status === 'Concluída' && task.status !== 'Concluída' ? new Date() : task.completedAt,
    };

    // Usando a mutação do store
    updateTask(updatedTask, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
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
                    {/* Exibe apenas a data */}
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} disabled={isUpdating}>
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
              <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)} disabled={isUpdating}>
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
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as Task['status'])} disabled={isUpdating}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="checkbox"
              id="isRecurrent"
              checked={isRecurrent}
              onChange={(e) => setIsRecurrent(e.target.checked)}
              disabled={isUpdating}
            />
            <Label htmlFor="isRecurrent">Recorrente</Label>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};