import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useClientStore } from '@/hooks/use-client-store';
import { showError } from '@/utils/toast';
import { UserProfile } from '@/hooks/use-user-management';

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onSubmit: (data: { id: string, email: string, role: string, client_id: string | null, password?: string }) => void;
  isSubmitting: boolean;
}

const ROLE_OPTIONS = ['admin', 'user', 'client'];

export const UserEditDialog: React.FC<UserEditDialogProps> = ({ isOpen, onOpenChange, user, onSubmit, isSubmitting }) => {
  const { clients } = useClientStore();
  
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [clientId, setClientId] = useState(user.client_id || 'none');
  const [password, setPassword] = useState(''); // Para reset de senha opcional

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
      setClientId(user.client_id || 'none');
      setPassword('');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      showError('O e-mail é obrigatório.');
      return;
    }
    
    if (password.trim() && password.length < 6) {
        showError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    const finalClientId = clientId === 'none' ? null : clientId;
    
    // Se a role for 'admin' ou 'user', o client_id deve ser nulo
    const client_id_to_submit = (role === 'admin' || role === 'user') ? null : finalClientId;
    
    // Se a role for 'client', o client_id é obrigatório
    if (role === 'client' && !client_id_to_submit) {
        showError('Usuários clientes devem ser vinculados a um cliente.');
        return;
    }

    onSubmit({ 
        id: user.id, 
        email: email.trim(), 
        role, 
        client_id: client_id_to_submit,
        password: password.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário: {user.email}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@cliente.com"
              required
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r} value={r}>{r.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {role === 'client' && (
            <div className="grid gap-2">
              <Label htmlFor="client">Workspace Vinculado</Label>
              <Select value={clientId} onValueChange={setClientId} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="password">Nova Senha (Opcional)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Deixe vazio para não alterar"
              disabled={isSubmitting}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};