import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UsefulLink } from '@/types/playbook';

interface LinkFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (link: Omit<UsefulLink, 'id' | 'created_at' | 'user_id' | 'client_id'> & { client_id: string }) => void;
  isLoading: boolean;
}

export const LinkFormDialog: React.FC<LinkFormDialogProps> = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;

    // O client_id é injetado na função handleAddLink da página LinksPage.tsx
    onSubmit({
      title: title.trim(),
      url: url.trim(),
      client_id: '', // Será sobrescrito pelo valor real
    });
    setTitle('');
    setUrl('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Link Útil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Google Drive do Cliente"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-dyad-500 hover:bg-dyad-600">
              {isLoading ? 'Adicionando...' : 'Adicionar Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};