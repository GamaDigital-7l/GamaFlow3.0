import React, { useState } from 'react';
import { Post, KanbanColumnId } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Upload } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { showSuccess, showError } from '@/utils/toast';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload'; // Importando o hook de upload

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Novo estado para o arquivo selecionado
  const [status, setStatus] = useState<KanbanColumnId>(post?.status || 'Produção');
  const { uploadFile, isUploading } = usePlaybookUpload(''); // Usando o hook de upload, clientId vazio aqui

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageUrl(URL.createObjectURL(file)); // Cria um URL local para a imagem
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
      imageUrl: finalImageUrl,
      status: status,
      subtasks: [],
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
        <div className="flex space-x-2">
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
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
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isUploading}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isUploading}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};