import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';

interface UserProfileFormProps {
  onCancel: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onCancel }) => {
  const { user } = useSession();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // Tentativa de ler dados do perfil (se o SessionContextProvider estiver lendo o perfil)
      // Como o SessionContextProvider não expõe first_name/last_name do perfil, vamos buscar aqui.
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      showError('Nome e sobrenome são obrigatórios.');
      return;
    }
    
    setIsSubmitting(true);

    // 1. Atualizar a tabela profiles (onde o SessionContextProvider busca a role/client_id)
    const profileUpdates = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      avatar_url: avatarUrl.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (profileError) {
      showError(`Erro ao atualizar o perfil: ${profileError.message}`);
      setIsSubmitting(false);
      return;
    }
    
    // 2. Opcional: Atualizar o metadata do auth.users (para consistência, mas não é estritamente necessário se o profiles for a fonte primária)
    const { error: authError } = await supabase.auth.updateUser({
        data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            avatar_url: avatarUrl.trim(),
        }
    });
    
    if (authError) {
        console.warn("Aviso: Falha ao atualizar metadata do Auth User, mas o perfil foi salvo.", authError);
    }

    showSuccess('Perfil atualizado com sucesso!');
    setIsSubmitting(false);
    onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="firstName">Nome</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Seu nome"
          disabled={isSubmitting}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Sobrenome</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Seu sobrenome"
          disabled={isSubmitting}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="avatarUrl">URL do Avatar</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="URL do seu avatar"
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};