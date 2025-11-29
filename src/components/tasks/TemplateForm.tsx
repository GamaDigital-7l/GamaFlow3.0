import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskTemplate, TaskPriority, TargetBoard, DayOfWeek, TaskCategory, TaskType } from '@/types/task';
import { Loader2, Checkbox } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

interface TemplateFormProps {
  initialData?: TaskTemplate;
  onSubmit: (template: TaskTemplate | Omit<TaskTemplate, 'id' | 'user_id' | 'created_at'>> => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TARGET_BOARD_OPTIONS: { value: TargetBoard, label: string }[] = [
  { value: 'todayHigh', label: 'Hoje — Prioridade Alta' },
  { value: 'todayMedium', label: 'Hoje — Prioridade Média' },
  { value: 'thisWeekLow', label: 'Esta Semana — Baixa' },
  { value: 'woeTasks', label: 'WOE Comunicação' },
  { value: 'clientTasks', label: 'Tarefas de Cliente' },
  { value: 'agencyTasks', label: 'Gama Creative (Agência)' },
];

const DAY_OPTIONS: { value: DayOfWeek, label: string }[] = [
  { value: 'Mon', label: 'Seg' },
  { value: 'Tue', label: 'Ter' },
  { value: 'Wed', label: 'Qua' },
  { value: 'Thu', label: 'Qui' },
  { value: 'Fri', label: 'Sex' },
  { value: 'Sat', label: 'Sáb' },
  { value: 'Sun', label: 'Dom' },
];

const CATEGORY_OPTIONS: TaskCategory[] = ['Geral', 'WOE', 'Clientes', 'Agência']; // Hábitos são tratados separadamente
const TASK_TYPE_OPTIONS: TaskType[] = ['standard', 'recurrent'];

export const TemplateForm: React.FC<TemplateFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetBoard, setTargetBoard] = useState<TargetBoard>(initialData?.targetBoard || 'todayHigh');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(initialData?.daysOfWeek || []);
  // Garante que timeOfDay seja HH:mm (substring(0, 5))
  const [timeOfDay, setTimeOfDay] = useState(initialData?.timeOfDay?.substring(0, 5) || ''); 
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority || 'Média');
  const [clientName, setClientName] = useState(initialData?.clientName || '');
  const [category, setCategory] = useState<TaskCategory>(initialData?.category || 'Geral'); // Novo estado
  const [taskType, setTaskType] = useState<TaskType>(initialData?.taskType || 'recurrent'); // Novo estado

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setTargetBoard(initialData.targetBoard);
      setDaysOfWeek(initialData.daysOfWeek);
      setTimeOfDay(initialData.timeOfDay?.substring(0, 5) || '');
      setPriority(initialData.priority);
      setClientName(initialData.clientName || '');
      setCategory(initialData.category || 'Geral');
      setTaskType(initialData.taskType || 'recurrent');
    }
  }, [initialData]);

  const handleSubmit = (e: React.Event<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim() || daysOfWeek.length === 0) {
        showError('Título e dias da semana são obrigatórios.');
        return;
    }

    const templateData = {
      id: initialData?.id,
      title: title.trim(),
      description: description.trim(),
      targetBoard: targetBoard,
      daysOfWeek: daysOfWeek,
      // Garante que o formato seja HH:mm:ss para o banco de dados, se houver valor
      timeOfDay: timeOfDay ? `${timeOfDay}:00` : undefined, 
      priority: priority,
      clientName: clientName.trim() || undefined,
      category: category, // Inclui a categoria
      taskType: taskType, // Inclui o tipo de tarefa
    } as TaskTemplate | Omit<TaskTemplate, 'id' | 'user_id' | 'created_at'>;

    onSubmit(templateData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="targetBoard">Quadro de Destino</Label>
          <Select value={targetBoard} onValueChange={(value) => setTargetBoard(value as TargetBoard)} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o quadro" />
            </SelectTrigger>
            <SelectContent>
              {TARGET_BOARD_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} disabled={isSubmitting}>
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
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="taskType">Tipo de Tarefa</Label>
          <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskType)} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Dias da Semana para Recorrência</Label>
        <ToggleGroup 
          type="multiple" 
          value={daysOfWeek} 
          onValueChange={(value: DayOfWeek[]) => setDaysOfWeek(value)}
          className="justify-start flex-wrap"
          disabled={isSubmitting}
        >
          {DAY_OPTIONS.map(day => (
            <ToggleGroupItem 
              key={day.value} 
              value={day.value} 
              aria-label={`Toggle ${day.label}`}
              className={cn(
                "w-10 h-10",
                daysOfWeek.includes(day.value) ? "bg-dyad-500 text-white hover:bg-dyad-600" : "bg-muted hover:bg-muted/80"
              )}
            >
              {day.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="timeOfDay">Horário (Opcional)</Label>
        <Input 
          id="timeOfDay" 
          type="time" 
          value={timeOfDay} 
          onChange={(e) => setTimeOfDay(e.target.value)} 
          disabled={isSubmitting} 
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="clientName">Cliente Associado (Opcional)</Label>
        <Input 
          id="clientName" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)} 
          placeholder="Nome do Cliente"
          disabled={isSubmitting} 
        />
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Template'}
        </Button>
      </div>
    </form>
  );
};