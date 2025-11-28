import React, { useState, useEffect } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Upload, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';

interface PostEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSave: (post: Post) => void;
  onDelete: (post: Post) => void;
}

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date) return '';
    return format(date, 'HH:mm');
};

export const PostEditDialog: React.FC<PostEditDialogProps> = ({ isOpen, onOpenChange, post, onSave, onDelete }) => {
  const [editedPost, setEditedPost] = useState<Post>(post);
  const [newSubtask, setNewSubtask] = useState('');
  const [dueTime, setDueTime] = useState(getInitialTime(post.dueDate));

  useEffect(() => {
    // Garante que o estado interno seja sincronizado quando o post externo mudar
    setEditedPost(post);
    setDueTime(getInitialTime(post.dueDate));
  }, [post]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setEditedPost(prev => ({ ...prev, [id]: value }));
  };

  const handleStatusChange = (value: string) => {
    setEditedPost(prev => ({ ...prev, status: value as KanbanColumnId }));
  };

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
      
      setEditedPost(prev => ({ ...prev, dueDate: newDate }));
    } else {
      setEditedPost(prev => ({ 
        ...prev, 
        dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Data futura padrão
      }));
      setDueTime('');
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setDueTime(newTime);
    
    if (editedPost.dueDate && newTime) {
        const [hours, minutes] = newTime.split(':').map(Number);
        const newDate = new Date(editedPost.dueDate);
        newDate.setHours(hours, minutes, 0, 0);
        setEditedPost(prev => ({ ...prev, dueDate: newDate }));
    } else if (editedPost.dueDate && !newTime) {
        // Se o usuário apagar a hora, define para o final do dia (se houver data)
        const newDate = new Date(editedPost.dueDate);
        newDate.setHours(23, 59, 59, 999);
        setEditedPost(prev => ({ ...prev, dueDate: newDate }));
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setEditedPost(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, newSubtask.trim()],
      }));
      setNewSubtask('');
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setEditedPost(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!editedPost.title.trim()) {
      showError("O título é obrigatório.");
      return;
    }
    
    // Garante que o monthYear seja atualizado se a data de vencimento mudou
    const updatedPost: Post = {
        ...editedPost,
        monthYear: format(editedPost.dueDate, 'yyyy-MM'),
    };
    
    onSave(updatedPost);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o post "${editedPost.title}"?`)) {
      onDelete(editedPost);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Post: {post.title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={editedPost.title} onChange={handleChange} />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Legenda)</Label>
            <Textarea id="description" value={editedPost.description} onChange={handleChange} />
          </div>

          {/* Data/Hora e Status */}
          <div className="grid grid-cols-3 gap-4">
            {/* Data */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="dueDate">Data de Vencimento (Opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editedPost.dueDate || format(editedPost.dueDate, 'yyyy') === '2099' ? "text-muted-foreground" : ""
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedPost.dueDate && format(editedPost.dueDate, 'yyyy') !== '2099' ? format(editedPost.dueDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editedPost.dueDate && format(editedPost.dueDate, 'yyyy') !== '2099' ? editedPost.dueDate : undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="dueTime">Horário</Label>
              <Input
                id="dueTime"
                type="time"
                value={editedPost.dueDate && format(editedPost.dueDate, 'yyyy') !== '2099' ? dueTime : ''}
                onChange={handleTimeChange}
                disabled={!editedPost.dueDate || format(editedPost.dueDate, 'yyyy') === '2099'}
              />
            </div>
          </div>
          
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={editedPost.status} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
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

          {/* Imagem/Link */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Link/Upload de Imagem (1080x1350)</Label>
            <div className="flex space-x-2">
                <Input id="imageUrl" placeholder="URL da imagem" value={editedPost.imageUrl} onChange={handleChange} />
                <Button variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                </Button>
            </div>
          </div>

          {/* Subtarefas */}
          <div className="space-y-2">
            <Label>Subtarefas</Label>
            <div className="space-y-2">
              {editedPost.subtasks.map((task, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={task} disabled className="bg-muted/50" />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveSubtask(index)}>
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
              />
              <Button type="button" onClick={handleAddSubtask} size="icon" className="bg-dyad-500 hover:bg-dyad-600">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

        </div>
        <DialogFooter className="sm:justify-between flex-col-reverse sm:flex-row gap-2">
          {/* O link de aprovação em massa é gerado no ClientWorkspace */}
          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir Post
            </Button>
            <Button type="submit" onClick={handleSave} className="bg-dyad-500 hover:bg-dyad-600">
              Salvar Alterações
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};