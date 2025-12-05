import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Habit, DayOfWeek } from '@/types/task';
import { Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';

interface HabitFormProps {
  initialData?: Habit;
  onSubmit: (habit: Omit<Habit, 'id' | 'user_id' | 'created_at'> | Habit) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const DAY_OPTIONS: { value: DayOfWeek, label: string }[] = [
  { value: 'Mon', label: 'Seg' },
  { value: 'Tue', label: 'Ter' },
  { value: 'Wed', label: 'Qua' },
  { value: 'Thu', label: 'Qui' },
  { value: 'Fri', label: 'Sex' },
  { value: 'Sat', label: 'Sáb' },
  { value: 'Sun', label: 'Dom' },
];

// Converte a string de frequência (ex: "Mon,Wed,Fri" ou "daily") para um array de dias
const frequencyToDays = (frequency: string): DayOfWeek[] => {
  if (frequency === 'daily') {
    return DAY_OPTIONS.map(d => d.value);
  }
  return frequency.split(',').filter(d => d) as DayOfWeek[];
};

// Converte o array de dias para a string de frequência
const daysToFrequency = (days: DayOfWeek[]): string => {
  if (days.length === DAY_OPTIONS.length) {
    return 'daily';
  }
  return days.join(',');
};

export const HabitForm: React.FC<HabitFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  
  // Estado interno para gerenciar os dias selecionados
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    initialData ? frequencyToDays(initialData.frequency) : DAY_OPTIONS.map(d => d.value) // Padrão: daily
  );

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setSelectedDays(frequencyToDays(initialData.frequency));
    }
  }, [initialData]);

  const handleToggleDaily = (isDaily: boolean) => {
    if (isDaily) {
      setSelectedDays(DAY_OPTIONS.map(d => d.value));
    } else {
      // Se desmarcar "Todos os Dias", mantém a seleção anterior ou define como vazio se estava "daily"
      if (daysToFrequency(selectedDays) === 'daily') {
        setSelectedDays([]);
      }
    }
  };
  
  const handleDayChange = (value: DayOfWeek[]) => {
    setSelectedDays(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
        showError('O título do hábito é obrigatório.');
        return;
    }
    if (selectedDays.length === 0) {
        showError('Selecione pelo menos um dia para a recorrência.');
        return;
    }

    const frequencyString = daysToFrequency(selectedDays);

    const habitData = {
      id: initialData?.id,
      title: title.trim(),
      description: description.trim(),
      frequency: frequencyString,
    } as Habit | Omit<Habit, 'id' | 'user_id' | 'created_at'>;

    onSubmit(habitData);
  };

  const isDailySelected = selectedDays.length === DAY_OPTIONS.length;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título do Hábito</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição / Dica Pessoal</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isSubmitting} />
      </div>

      <div className="grid gap-2">
        <Label>Frequência de Recorrência</Label>
        
        {/* Opção Todos os Dias */}
        <div className="flex items-center space-x-2 mb-2">
          <input
            type="checkbox"
            id="daily"
            checked={isDailySelected}
            onChange={(e) => handleToggleDaily(e.target.checked)}
            className="h-4 w-4 text-dyad-500 border-gray-300 rounded focus:ring-dyad-500"
            disabled={isSubmitting}
          />
          <Label htmlFor="daily">Todos os Dias</Label>
        </div>

        {/* Seleção de Dias Específicos */}
        <ToggleGroup 
          type="multiple" 
          value={selectedDays} 
          onValueChange={handleDayChange}
          className="justify-start flex-wrap"
          disabled={isSubmitting || isDailySelected}
        >
          {DAY_OPTIONS.map(day => (
            <ToggleGroupItem 
              key={day.value} 
              value={day.value} 
              aria-label={`Toggle ${day.label}`}
              className={cn(
                "w-10 h-10",
                selectedDays.includes(day.value) ? "bg-dyad-500 text-white hover:bg-dyad-600" : "bg-muted hover:bg-muted/80"
              )}
            >
              {day.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Hábito'}
        </Button>
      </div>
    </form>
  );
};