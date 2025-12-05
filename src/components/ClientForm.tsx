import React, { useState } from 'react';
import { Client, ClientStatus, ClientType } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';
import { ClientAvatar } from './ClientAvatar';
import { Upload, Loader2 } from 'lucide-react';
import { usePlaybookUpload } from '@/hooks/use-playbook-upload'; // Importando o hook de upload
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { HorizontalRadioSelect } from './HorizontalRadioSelect'; // Importando HorizontalRadioSelect

type ClientFormData = Omit<Client, 'id' | 'posts'>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (client: ClientFormData) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: ClientStatus, label: string }[] = [
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Pausado', label: 'Pausado' },
    { value: 'Finalizado', label: 'Finalizado' },
];

const TYPE_OPTIONS: { value: ClientType, label: string }[] = [
    { value: 'Fixo', label: 'Fixo' },
    { value: 'Freela', label: 'Freela' },
    { value: 'Avulso', label: 'Avulso' },
];

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSubmit, onCancel }) => {
  const [name, setName] = useState(client?.name || '');
  const [logoUrl, setLogoUrl] = useState(client?.logoUrl || '');
  const [status, setStatus] = useState<ClientStatus>(client?.status || 'Ativo');
  const [type, setType] = useState<ClientType>(client?.type || 'Fixo');
  const [color, setColor] = useState(client?.color || '#ED1857');
  const [phone, setPhone] = useState(client?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(client?.whatsappNumber || '');
  const [email, setEmail] = useState(client?.email || '');
  const [cnpj, setCnpj] = useState(client?.cnpj || '');
  const [monthlyPostGoal, setMonthlyPostGoal] = useState(client?.monthlyPostGoal?.toString() || '8');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { uploadFile, isUploading } = usePlaybookUpload(client?.id || ''); // Usando o hook de upload

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Se um arquivo foi selecionado, faça o upload
      const uploadResult = await uploadFile(file);
      if (uploadResult) {
          setLogoUrl(uploadResult.url);
      } else {
          showError('Falha ao fazer upload da imagem.');
          return;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('O nome do cliente não pode estar vazio.');
      return;
    }

    const goal = parseInt(monthlyPostGoal || '0');
    if (isNaN(goal) || goal < 0) {
      showError('A meta mensal deve ser um número válido.');
      return;
    }

    const newClient: ClientFormData = {
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      status: status,
      type: type,
      color: color,
      phone: phone.trim() || undefined,
      whatsappNumber: whatsappNumber.trim() || undefined,
      email: email.trim() || undefined,
      cnpj: cnpj.trim() || undefined,
      monthlyPostGoal: goal,
    };

    console.log("Client data being submitted:", newClient); // Adicionando log
    onSubmit(newClient);
  };

  const isSubmittingForm = isUploading;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 w-[98%]">
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
            onChange={(e) => { setLogoUrl(e.target.value); setSelectedFile(null); }}
            placeholder="URL do logo do cliente"
            className="flex-grow"
            disabled={isSubmittingForm}
          />
          <Input
            id="fileUpload"
            type="file"
            accept="image/*"
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
        {/* Tipo (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Tipo"
            options={TYPE_OPTIONS}
            value={type}
            onValueChange={(value) => setType(value as ClientType)}
            disabled={isSubmittingForm}
        />
        {/* Status (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onValueChange={(value) => setStatus(value as ClientStatus)}
            disabled={isSubmittingForm}
        />
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