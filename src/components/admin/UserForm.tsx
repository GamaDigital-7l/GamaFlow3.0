import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useClientStore } from '@/hooks/use-client-store';
import { showError } from '@/utils/toast';
import { Checkbox } from "@/components/ui/checkbox";
import { HorizontalRadioSelect } from '../HorizontalRadioSelect';
import { MultiSelect } from '../MultiSelect'; // Componente MultiSelect necessário

interface UserFormProps {
  onSubmit: (data: { email: string, password: string, client_ids: string[] }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
  const { clients, isLoading } = useClientStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]); // Array de IDs

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || selectedClientIds.length === 0) {
      showError('Preencha e-mail, senha e selecione pelo menos um cliente.');
      return;
    }
    
    if (password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres.');
        return;
    }

    onSubmit({ email: email.trim(), password: password.trim(), client_ids: selectedClientIds });
  };
  
  const clientOptions = clients.map(client => ({ value: client.id, label: client.name }));

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">E-mail de Acesso</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@equipe.com"
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
      
      {/* Seleção Múltipla de Clientes */}
      <div className="grid gap-2">
        <Label>Workspaces Vinculados (Role: Equipe)</Label>
        {isLoading ? (
          <p>Carregando clientes...</p>
        ) : (
          <MultiSelect
            options={clientOptions}
            selected={selectedClientIds}
            onSelectChange={setSelectedClientIds}
            placeholder="Selecione clientes..."
            disabled={isSubmitting}
          />
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting || isLoading}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Criar Usuário Equipe'}
        </Button>
      </div>
    </form>
  );
};