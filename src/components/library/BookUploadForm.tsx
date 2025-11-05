import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { FileType } from '@/types/book';
import { useLibrary } from '@/hooks/use-library';

interface BookUploadFormProps {
  onCancel: () => void;
}

const FILE_TYPE_OPTIONS: FileType[] = ['pdf', 'epub', 'mobi'];

export const BookUploadForm: React.FC<BookUploadFormProps> = ({ onCancel }) => {
  const { upsertBook, isSaving } = useLibrary();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>('pdf');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !file) {
      showError('Título e arquivo são obrigatórios.');
      return;
    }

    // Simulação de upload para Supabase Storage (você precisará implementar isso)
    const fileUrl = 'https://exemplo.com/uploads/' + file.name; // Simulação
    
    const newBook = {
      title: title.trim(),
      author: author.trim(),
      cover_url: coverUrl.trim(),
      file_url: fileUrl,
      file_type: fileType,
      description: description.trim(),
      page_count: 0, // Você precisará extrair isso do arquivo
      tags: [],
      category: 'Geral',
      rating: 0,
    };

    upsertBook(newBook);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      showSuccess('Arquivo selecionado para upload.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título do Livro</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSaving} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="author">Autor</Label>
        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isSaving} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSaving} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="coverUrl">URL da Capa</Label>
        <Input id="coverUrl" type="url" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." disabled={isSaving} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fileType">Tipo de Arquivo</Label>
          <Select value={fileType} onValueChange={(value) => setFileType(value as FileType)} disabled={isSaving}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {FILE_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="file">Arquivo</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileChange}
            required
            disabled={isSaving}
            className="file:text-dyad-500 file:font-medium"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSaving || !file}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Livro'}
        </Button>
      </div>
    </form>
  );
};