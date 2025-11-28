import React, { useState } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
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

interface PostFormProps {
  post?: Post;
  onSubmit: (post: Omit<Post, 'id' | 'approvalLink'>) => void;
  onCancel: () => void;
}

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const PostForm: React.FC<PostFormProps> = ({ post, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(post?.dueDate || undefined);
  const [dueTime, setDueTime] = useState(getInitialTime(post?.dueDate));
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');
  const [status, setStatus] = useState<KanbanColumnId>(post?.status || 'Produção');
  const [subtasks, setSubtasks] = useState<string[]>(post?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks.splice(index, 1);
    setSubtasks(newSubtasks);
  };
  
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
      showError('O título do post não pode estar vazio.');
      return;
    }
    
    // Data de vencimento agora é opcional. Se não houver data, usamos uma data futura padrão (ex: 1 ano)
    let finalDueDate = dueDate;
    if (!finalDueDate) {
        // Se não houver data, define uma data muito futura para fins de ordenação e evitar erros de tipo Date
        finalDueDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    } else if (dueTime) {
        const [hours, minutes] = dueTime.split(':').map(Number);
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(hours, minutes, 0, 0);
    } else {
        // Se a hora não for definida, define para o final do dia
        finalDueDate = new Date(dueDate);
        finalDueDate.setHours(23, 59, 59, 999);
    }

    const newPost = {
      title: title.trim(),
      description: description.trim(),
      dueDate: finalDueDate,
      imageUrl: imageUrl.trim(),
      status: status,
      subtasks: subtasks,
    };

    onSubmit(newPost as Omit<Post, 'id' | 'approvalLink'>);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título do post"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (Legenda)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrição/Legenda do post"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Seleção de Data */}
        <div className="grid gap-2 col-span-2">
          <Label>Data de Vencimento (Opcional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
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
            value={dueDate ? dueTime : ''} // Limpa a hora se não houver data
            onChange={handleTimeChange}
            placeholder="HH:mm"
            disabled={!dueDate}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">URL da Imagem (Capa 1080x1350)</Label>
        <Input
          id="imageUrl"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL da imagem do post"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="status">Status Inicial</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as KanbanColumnId)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Produção">Produção</SelectItem>
            <SelectItem value="Aprovação">Aprovação</SelectItem>
            <SelectItem value="Edição">Edição</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Publicado">Publicado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="subtasks">Subtarefas</Label>
        {subtasks.map((subtask, index) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <Input
              type="text"
              value={subtask}
              readOnly
              className="bg-muted/50"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSubtask(index)}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            placeholder="Nova subtarefa"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSubtask();
              }
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleAddSubtask}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600">
          Salvar
        </Button>
      </div>
    </form>
  );
};