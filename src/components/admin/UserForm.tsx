import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Checkbox } from 'lucide-react';
import { useClientStore } from '@/hooks/use-client-store';
import { showError } from '@/utils/toast';

interface UserFormProps {
  onSubmit: (data: { email: string, password: string, client_id: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const { clients, isLoading } = useClientStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientId, setClientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !clientId) {
      showError('Preencha todos os campos e selecione um cliente.');
      return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    onSubmit({ email: email.trim(), password: password.trim(), client_id: clientId });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail de Acesso</Label>
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
        <Label htmlFor="password">Senha Temporária</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
          required
          disabled={isSubmitting}
        />
      </div>
      
      {/* Lista de Clientes com Checkboxes */}
      <div className="grid gap-2">
        <Label>Workspace Vinculado</Label>
        {isLoading ? (
          <p>Carregando clientes...</p>
        ) : (
          <div className="flex flex-col space-y-2">
            {clients.map(client => (
              <div key={client.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`client-${client.id}`}
                  checked={clientId === client.id}
                  onCheckedChange={(checked) => setClientId(checked ? client.id : '')}
                  disabled={isSubmitting}
                />
                <Label htmlFor={`client-${client.id}`} className="cursor-pointer">
                  {client.name}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting || !clientId}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Criar Usuário Cliente'}
        </Button>
      </div>
    </form>
  );
};