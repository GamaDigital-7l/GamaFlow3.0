import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Edit } from 'lucide-react'; // Usando Edit em vez de Repeat
import { Post } from '@/types/client';

interface RequestEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onSubmit: (postId: string, feedback: string) => void;
  isSubmitting: boolean;
}

export const RequestEditDialog: React.FC<RequestEditDialogProps> = ({ isOpen, onOpenChange, post, onSubmit, isSubmitting }) => {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setFeedback('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !feedback.trim()) return;

    onSubmit(post.id, feedback.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Solicitar Edição</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Por favor, descreva detalhadamente as alterações necessárias para o post: 
            <span className="font-semibold block mt-1">{post?.title}</span>
          </p>
          
          <div className="grid gap-2">
            <Label htmlFor="feedback">Feedback de Edição</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex: Mudar a cor do texto para azul e ajustar a data de vencimento para a próxima semana."
              rows={5}
              required
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || !feedback.trim()} 
              // Estilo Solicitar Edição: Fundo escuro, texto branco
              className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-900 dark:hover:bg-gray-950 text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit className="h-4 w-4 mr-2" />} 
              Enviar para Edição
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};