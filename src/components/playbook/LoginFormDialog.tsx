import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ClientLogin } from '@/types/playbook';

interface LoginFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (login: Omit<ClientLogin, 'id' | 'created_at' | 'user_id' | 'client_id'> & { client_id: string }) => void;
  isLoading: boolean;
}

export const LoginFormDialog: React.FC<LoginFormDialogProps> = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const [title, setTitle] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !login.trim()) return;

    // O client_id é injetado na função handleAddLogin da página LoginsPage.tsx
    onSubmit({
      title: title.trim(),
      login: login.trim(),
      password: password.trim() || undefined,
      notes: notes.trim() || undefined,
      client_id: '', // Será sobrescrito pelo valor real
    });
    setTitle('');
    setLogin('');
    setPassword('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título (Ex: Acesso Instagram)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="login">Login/Usuário</Label>
            <Input
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Nome de usuário ou email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Senha (Opcional)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre o acesso"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="bg-dyad-500 hover:bg-dyad-600">
              {isLoading ? 'Adicionando...' : 'Adicionar Login'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};