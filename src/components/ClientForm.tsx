import React, { useState } from 'react';
import { Client, ClientStatus, ClientType } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from './ClientAvatar'; // Importando o novo componente
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Definindo o tipo de dados que o formulário retorna (sem id e posts)
type ClientFormData = Omit<Client, 'id' | 'posts'>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: ClientFormData) => void;
  onCancel: () from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from './ClientAvatar'; // Importando o novo componente
import { Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Definindo o tipo de dados que o formulário retorna (sem id e posts)
type ClientFormData = Omit<Client, 'id' | 'posts'>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: ClientFormData) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onCancel }) => {
  const [name, setName] = useState(client?.name || '');
  const [logoUrl, setLogoUrl] = useState(client?.logoUrl || '');
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'Ativo');
  const [type, setType] = useState<ClientType>(client?.type || 'Fixo');
  const [color, setColor] = useState(client?.color || '#ED1857');
  
  // Novos campos
  const [phone, setPhone] = useState(client?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(client?.whatsappNumber || ''); // NOVO ESTADO
  const [email, setEmail] = useState(client?.email || '');
  const [cnpj, setCnpj] = useState(client?.cnpj || '');
  const [monthlyPostGoal, setMonthlyPostGoal] = useState(client?.monthlyPostGoal.toString() || '8'); // Novo estado
  
  // Estado para o arquivo de upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Cria um URL temporário para o preview imediato
      const tempUrl = URL.createObjectURL(file);
      setLogoUrl(tempUrl);
      showSuccess('Arquivo selecionado para upload. Clique em Salvar para persistir.');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('O nome do cliente não pode estar vazio.');
      return;
    }
    
    const goal = parseInt(monthlyPostGoal);
    if (isNaN(goal) || goal < 0) {
        showError('A meta mensal deve ser um número válido.');
        return;
    }
    
    let finalLogoUrl = logoUrl;

    const newClient: ClientFormData = {
      name: name.trim(),
      logoUrl: finalLogoUrl.trim(),
      status: status,
      type: type,
      color: color,
      phone: phone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined, // NOVO CAMPO
      email: email.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      monthlyPostGoal: goal, // Incluindo a meta
    };

    onSubmit(newClient);
  };
  
  const isSubmittingForm = isUploading; // Usamos isUploading para desabilitar o botão

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="flex items-center space-x-4">
        <ClientAvatar name={name} logoUrl={logoUrl} className="w-16 h-16 flex-shrink-0" />
        <div className="grid gap-2 flex-grow">
          <Label htmlFor="name">Nome do Cliente</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do cliente"
            required
            disabled={isSubmittingForm}
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="logoUrl">URL do Logo / Upload</Label>
        <div className="flex space-x-2">
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => { setLogoUrl(e.target.value); setSelectedFile(null); }} // Limpa o arquivo se a URL for editada manualmente
            placeholder="URL do logo do cliente"
            className="flex-grow"
            disabled={isSubmittingForm}
          />
          <Input 
            id="fileUpload" 
            type="file" 
            accept=".jpg, .png, .webp" 
            onChange={handleFileChange} 
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon" 
            onClick={() => document.getElementById('fileUpload')?.click()}
            disabled={isSubmittingForm}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(99) 99999-9999" disabled={isSubmittingForm} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contato@cliente.com" disabled={isSubmittingForm} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
          <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" disabled={isSubmittingForm} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whatsappNumber">Número/ID WhatsApp (Notificações)</Label>
          <Input id="whatsappNumber" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="5511999999999 ou ID do Grupo" disabled={isSubmittingForm} />
        </div>
      </div>
      
      {/* Novo Campo: Meta Mensal */}
      <div className="grid gap-2">
        <Label htmlFor="monthlyPostGoal">Posts Mensais Contratados (Meta)</Label>
        <Input
          id="monthlyPostGoal"
          type="number"
          min="0"
          value={monthlyPostGoal}
          onChange={(e) => setMonthlyPostGoal(e.target.value)}
          placeholder="Ex: 8"
          required
          disabled={isSubmittingForm}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={(value) => setType(value as ClientType)} disabled={isSubmittingForm}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fixo">Fixo</SelectItem>
              <SelectItem value="Freela">Freela</SelectItem>
              <SelectItem value="Avulso">Avulso</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as ClientStatus)} disabled={isSubmittingForm}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Pausado">Pausado</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="color">Cor de Destaque</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-10 h-10 p-0 border-none cursor-pointer"
            disabled={isSubmittingForm}
          />
          <Input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#ED1857"
            className="flex-grow"
            disabled={isSubmittingForm}
          />
        </div>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmittingForm}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmittingForm}>
          {isSubmittingForm ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};