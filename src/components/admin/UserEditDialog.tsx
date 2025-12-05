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
import { HorizontalRadioSelect } from '../HorizontalRadioSelect';
import { MultiSelect } from '../MultiSelect'; // Importando MultiSelect

interface UserEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile;
  onSubmit: (data: { id: string, email: string, role: string, client_ids: string[] | null, password?: string }) => void;
  isSubmitting: boolean;
}

const ROLE_OPTIONS = [
    { value: 'admin', label: 'ADMIN' },
    { value: 'user', label: 'USER' },
    { value: 'equipe', label: 'EQUIPE' }, // Novo Role
    { value: 'client', label: 'CLIENT' },
];

export const UserEditDialog: React.FC<UserEditDialogProps> = ({ isOpen, onOpenChange, user, onSubmit, isSubmitting }) => {
  const { clients } = useClientStore();
  
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  // clientIds é um array, mas para o role 'client' só terá 1 elemento
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(user.client_ids || []); 
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
      setSelectedClientIds(user.client_ids || []);
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
    
    let client_ids_to_submit: string[] | null = null;
    
    if (role === 'client') {
        // Cliente deve ter exatamente 1 ID
        if (selectedClientIds.length !== 1) {
            showError('Usuários clientes devem ser vinculados a exatamente um cliente.');
            return;
        }
        client_ids_to_submit = selectedClientIds;
    } else if (role === 'equipe') {
        // Equipe pode ter 1 ou mais IDs
        if (selectedClientIds.length === 0) {
            showError('Usuários da equipe devem ser vinculados a pelo menos um cliente.');
            return;
        }
        client_ids_to_submit = selectedClientIds;
    }
    // Se a role for 'admin' ou 'user', client_ids_to_submit permanece null.

    onSubmit({ 
        id: user.id, 
        email: email.trim(), 
        role, 
        client_ids: client_ids_to_submit,
        password: password.trim() || undefined,
    });
  };
  
  const clientOptions = clients.map(client => ({ value: client.id, label: client.name }));
  
  // Determina se deve usar MultiSelect ou SingleSelect (para o role 'client')
  const isMultiSelect = role === 'equipe';
  const isClientRole = role === 'client';
  const isClientOrEquipe = isMultiSelect || isClientRole;

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
          
          {/* Role (HorizontalRadioSelect) */}
          <HorizontalRadioSelect
            label="Role"
            options={ROLE_OPTIONS}
            value={role}
            onValueChange={setRole}
            disabled={isSubmitting}
          />
          
          {isClientOrEquipe && (
            <div className="grid gap-2">
                <Label>Workspaces Vinculados</Label>
                {isMultiSelect ? (
                    <MultiSelect
                        options={clientOptions}
                        selected={selectedClientIds}
                        onSelectChange={setSelectedClientIds}
                        placeholder="Selecione clientes..."
                        disabled={isSubmitting}
                    />
                ) : (
                    <Select 
                        value={selectedClientIds[0] || 'none'} 
                        onValueChange={(value) => setSelectedClientIds(value === 'none' ? [] : [value])}
                        disabled={isSubmitting}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {clientOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
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