import React, { useState, useEffect } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload'; // Importando o hook de upload
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { HorizontalRadioSelect } from './HorizontalRadioSelect'; // Importando HorizontalRadioSelect

interface PostFormProps {
  post?: Post;
  onSubmit: (post: Omit<Post, 'id' | 'approvalLink'>) => void;
  onCancel: () => void;
  clientId: string; // Adding clientId prop
}

// Data de vencimento padrão muito futura (para posts sem data definida)
const DEFAULT_FUTURE_DATE = new Date(2099, 11, 31, 23, 59, 59, 999); // 31/12/2099

// Função auxiliar para formatar a hora inicial (HH:mm)
const getInitialTime = (date?: Date): string => {
    if (!date || date.getFullYear() === 2099) return '';
    return format(date, 'HH:mm');
};

// Função auxiliar para verificar se a data é a data futura padrão
const isDefaultFutureDate = (date?: Date): boolean => {
    if (!date) return false;
    return date.getFullYear() === 2099;
};

const STATUS_OPTIONS: { value: KanbanColumnId, label: string }[] = [
    { value: 'Produção', label: 'Produção' },
    { value: 'Aprovação', label: 'Aprovação' },
    { value: 'Edição', label: 'Edição' },
    { value: 'Aprovado', label: 'Aprovado' },
    { value: 'Publicado', label: 'Publicado' },
];


export const PostForm: React.FC<PostFormProps> = ({ post, onSubmit, onCancel, clientId }) => {
  const [title, setTitle] = useState(post?.title || '');
  const [description, setDescription] = useState(post?.description || '');
  
  // Se for um post existente com data válida, usa a data. Se for novo, usa hoje.
  const [dueDate, setDueDate] = useState<Date | undefined>(
    post 
      ? (!isDefaultFutureDate(post.dueDate) ? post.dueDate : undefined) 
      : new Date() // Default to today for new posts
  );
  
  const [dueTime, setDueTime] = useState(getInitialTime(post?.dueDate));
  const [imageUrl, setImageUrl] = useState(post?.imageUrl || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Novo estado para o arquivo selecionado
  const [status, setStatus] = useState<KanbanColumnId>(post?.status || 'Produção');
  const { uploadFile, isUploading } = usePlaybookUpload(clientId); // Usando o hook de upload

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Se um arquivo foi selecionado, faça o upload
      const uploadResult = await uploadFile(file);
      if (uploadResult) {
          setImageUrl(uploadResult.url);
      } else {
          showError('Falha ao fazer upload da imagem.');
          return;
      }
    }
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
      
      setDueDate(newDate);
    } else {
      setDueDate(undefined);
      setDueTime(''); // Limpa a hora se não houver data
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showError('O título do post não pode estar vazio.');
      return;
    }
    
    let finalImageUrl = imageUrl;
    
    if (selectedFile) {
        // Se um arquivo foi selecionado, faça o upload
        const uploadResult = await uploadFile(selectedFile);
        if (uploadResult) {
            finalImageUrl = uploadResult.url;
        } else {
            showError('Falha ao fazer upload da imagem.');
            return;
        }
    }

    // Data de vencimento: Se não houver data (usuário limpou), usa a data futura padrão (2099)
    let finalDueDate = dueDate;
    if (!finalDueDate) {
        finalDueDate = DEFAULT_FUTURE_DATE;
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
      imageUrl: finalImageUrl,
      status: status,
      subtasks: [],
    };

    onSubmit(newPost as Omit<Post, 'id' | 'approvalLink'>);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    if (id === 'title') {
      setTitle(value);
    } else if (id === 'description') {
      setDescription(value);
    } else if (id === 'imageUrl') {
      setImageUrl(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={handleChange}
          placeholder="Título do post"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição (Legenda)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={handleChange}
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
        
        {/* Hora */}
        <div className="grid gap-2">
          <Label htmlFor="dueTime">Horário</Label>
          <Input
            id="dueTime"
            type="time"
            value={dueDate ? dueTime : ''}
            onChange={handleTimeChange}
            placeholder="HH:mm"
            disabled={!dueDate}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="imageUrl">URL da Imagem (Capa 1080x1350)</Label>
        <div className="flex space-x-2">
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={handleChange}
            placeholder="URL da imagem do post"
            className="flex-grow"
            disabled={isUploading}
          />
          <Input
            id="fileUpload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => document.getElementById('fileUpload')?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid gap-2">
        {/* Status (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Status Inicial"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value as KanbanColumnId)}
            disabled={isUploading}
        />
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};