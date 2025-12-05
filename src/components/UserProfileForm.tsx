import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useUserAvatarUpload } from '@/hooks/use-user-avatar-upload'; // Importando o novo hook
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Loader2, User } from 'lucide-react';

interface UserProfileFormProps {
  onCancel: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onCancel }) => {
  const { user } = useSession();
  const userId = user?.id || '';
  const { uploadAvatar, isUploading } = useUserAvatarUpload(userId);
  
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
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newUrl = await uploadAvatar(file);
      if (newUrl) {
        setAvatarUrl(newUrl);
      }
    }
  };

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
      avatar_url: avatarUrl.trim() || null, // Salva a URL do avatar
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
            avatar_url: avatarUrl.trim() || null,
        }
    });
    
    if (authError) {
        console.warn("Aviso: Falha ao atualizar metadata do Auth User, mas o perfil foi salvo.", authError);
    }

    showSuccess('Perfil atualizado com sucesso!');
    setIsSubmitting(false);
    onCancel();
  };
  
  const isFormDisabled = isSubmitting || isUploading;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      
      {/* Seção de Avatar */}
      <div className="flex flex-col items-center space-y-3 p-4 border rounded-lg bg-muted/50">
        <Avatar className="h-20 w-20">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : <AvatarFallback className="bg-dyad-500 text-white text-2xl"><User className="h-8 w-8" /></AvatarFallback>}
        </Avatar>
        
        <div className="flex space-x-2">
            <Input
                id="fileUpload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isFormDisabled}
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('fileUpload')?.click()}
                disabled={isFormDisabled}
            >
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? 'Enviando...' : 'Mudar Avatar'}
            </Button>
            {avatarUrl && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl('')}
                    disabled={isFormDisabled}
                    className="text-red-500 hover:bg-red-500/10"
                >
                    Remover
                </Button>
            )}
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="firstName">Nome</Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Seu nome"
          disabled={isFormDisabled}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Sobrenome</Label>
        <Input
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Seu sobrenome"
          disabled={isFormDisabled}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="avatarUrl">URL do Avatar (Manual)</Label>
        <Input
          id="avatarUrl"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="URL do seu avatar"
          disabled={isFormDisabled}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onCancel} disabled={isFormDisabled}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isFormDisabled}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};