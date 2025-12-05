import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface NewDemandFormProps {
  clientId: string;
  clientName: string;
  onSubmit: (data: { title: string, description: string, attachments: File[] }) => void;
  isSubmitting: boolean;
}

export const NewDemandForm: React.FC<NewDemandFormProps> = ({ clientId, clientName, onSubmit, isSubmitting }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Limita a 5 arquivos
      const newFiles = Array.from(e.target.files).slice(0, 5);
      setAttachments(newFiles);
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      showError('Título e descrição são obrigatórios.');
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      attachments,
    });
    
    // Limpar formulário após submissão (se bem-sucedida, a página pai fará isso)
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Título da Demanda</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Criação de 3 posts para a próxima semana"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição Detalhada</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhe o objetivo, referências e prazos desejados."
          rows={5}
          required
          disabled={isSubmitting}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="attachments">Anexos (Imagens, Vídeos, PDFs)</Label>
        <Input
          id="attachments"
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isSubmitting}
          className="file:text-dyad-500 file:font-medium"
        />
        
        {attachments.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium">Arquivos anexados:</p>
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-xs text-muted-foreground bg-muted p-2 rounded">
                <span>{file.name}</span>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-red-500"
                    onClick={() => handleRemoveAttachment(index)}
                >
                    <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Enviar Solicitação'}
        </Button>
      </div>
    </form>
  );
};