import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, LeadOrigin, LeadContactInfo } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { cn } from '@/lib/utils';
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando HorizontalRadioSelect

interface LeadFormProps {
  initialData?: Lead;
  onSubmit: (lead: Omit<Lead, 'id' | 'user_id' | 'createdAt' | 'firstContactDate' | 'notes'> & { notes: any[] }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const STATUS_OPTIONS: { value: LeadStatus, label: string }[] = [
    { value: 'Prospectando', label: 'Prospectando' },
    { value: 'Contato Feito', label: 'Contato Feito' },
    { value: 'Reunião Agendada', label: 'Reunião Agendada' },
    { value: 'Proposta Enviada', label: 'Proposta Enviada' },
];
const ORIGIN_OPTIONS: { value: LeadOrigin, label: string }[] = [
    { value: 'Indicação', label: 'Indicação' },
    { value: 'Tráfego Pago', label: 'Tráfego Pago' },
    { value: 'Orgânico', label: 'Orgânico' },
    { value: 'Outro', label: 'Outro' },
];

export const LeadForm: React.FC<LeadFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<LeadStatus>(initialData?.status || 'Prospectando');
  const [potentialValue, setPotentialValue] = useState(initialData?.potentialValue?.toString() || '');
  const [origin, setOrigin] = useState<LeadOrigin>(initialData?.origin || 'Orgânico');
  const [phone, setPhone] = useState(initialData?.contactInfo.phone || '');
  const [email, setEmail] = useState(initialData?.contactInfo.email || '');
  const [instagram, setInstagram] = useState(initialData?.contactInfo.instagram || '');
  const [observations, setObservations] = useState(''); // Inicializado corretamente
  const [nextActionDate, setNextActionDate] = useState(initialData?.nextActionDate ? format(initialData.nextActionDate, 'yyyy-MM-dd') : '');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStatus(initialData.status);
      setPotentialValue(initialData.potentialValue?.toString() || '');
      setOrigin(initialData.origin);
      setPhone(initialData.contactInfo.phone || '');
      setEmail(initialData.contactInfo.email || '');
      setInstagram(initialData.contactInfo.instagram || '');
      setNextActionDate(initialData.nextActionDate ? format(initialData.nextActionDate, 'yyyy-MM-dd') : '');
      
      // Se for edição, as observações são as notas mais recentes
      if (initialData.notes.length > 0) {
          setObservations(initialData.notes[initialData.notes.length - 1].text);
      } else {
          setObservations('');
      }
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('O nome do lead é obrigatório.');
      return;
    }
    
    const parsedValue = potentialValue ? parseFloat(potentialValue) : undefined;
    if (potentialValue && (isNaN(parsedValue) || parsedValue < 0)) {
        showError('Valor potencial deve ser um número válido.');
        return;
    }
    
    const contactInfo: LeadContactInfo = {
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        instagram: instagram.trim() || undefined,
    };
    
    // Adiciona a observação como uma nota inicial se for criação ou se o texto mudou
    const notes: any[] = initialData?.notes || [];
    if (observations.trim() && (!initialData || observations.trim() !== initialData.notes[initialData.notes.length - 1]?.text)) {
        notes.push({ date: new Date().toISOString(), text: observations.trim() });
    }
    
    const leadData = {
      name: name.trim(),
      contactInfo,
      status,
      potentialValue: parsedValue,
      origin,
      notes,
      nextActionDate: nextActionDate ? new Date(nextActionDate) : undefined,
    };

    onSubmit(leadData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 w-[98%]">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome da Empresa / Cliente</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
      </div>
      
      {/* Status Inicial (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Status Inicial"
        options={STATUS_OPTIONS}
        value={status}
        onValueChange={(value) => setStatus(value as LeadStatus)}
        disabled={isSubmitting}
      />
      
      {/* Origem (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Origem"
        options={ORIGIN_OPTIONS}
        value={origin}
        onValueChange={(value) => setOrigin(value as LeadOrigin)}
        disabled={isSubmitting}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="potentialValue">Valor Potencial (R$)</Label>
          <Input 
            id="potentialValue" 
            type="number" 
            step="0.01"
            value={potentialValue} 
            onChange={(e) => setPotentialValue(e.target.value)} 
            placeholder="Ex: 1500.00"
            disabled={isSubmitting} 
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nextActionDate">Próxima Ação (Data)</Label>
          <Input 
            id="nextActionDate" 
            type="date" 
            value={nextActionDate} 
            onChange={(e) => setNextActionDate(e.target.value)} 
            disabled={isSubmitting} 
          />
        </div>
      </div>
      
      <div className="grid gap-2">
        <Label>Contatos</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefone" disabled={isSubmitting} />
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" disabled={isSubmitting} />
        <Input id="instagram" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram (@)" disabled={isSubmitting} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="observations">Observações / Nota Rápida</Label>
        <Textarea id="observations" value={observations} onChange={(e) => setObservations(e.target.value)} rows={3} disabled={isSubmitting} />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Lead'}
        </Button>
      </div>
    </form>
  );
};