import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProposalBranding, ProposalStatus } from '@/types/proposal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Briefcase } from 'lucide-react';
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando o novo componente

interface ProposalBrandingFormProps {
  title: string;
  clientName: string;
  status: ProposalStatus;
  branding: ProposalBranding;
  isSubmitting: boolean;
  onTitleChange: (value: string) => void;
  onClientNameChange: (value: string) => void;
  onStatusChange: (value: ProposalStatus) => void;
  onBrandingChange: (branding: ProposalBranding) => void;
}

const STATUS_OPTIONS: { value: ProposalStatus, label: string }[] = [
    { value: 'Draft', label: 'Rascunho' },
    { value: 'Sent', label: 'Enviada' },
    { value: 'Accepted', label: 'Aceita' },
    { value: 'Rejected', label: 'Rejeitada' },
];

export const ProposalBrandingForm: React.FC<ProposalBrandingFormProps> = ({
  title,
  clientName,
  status,
  branding,
  isSubmitting,
  onTitleChange,
  onClientNameChange,
  onStatusChange,
  onBrandingChange,
}) => {
  return (
    <Card className="p-4 space-y-4">
      <CardHeader className="p-0 pb-2">
        <CardTitle className="text-xl flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-dyad-500" />
            <span>Informações Básicas e Branding</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Título da Proposta</Label>
            <Input id="title" value={title} onChange={(e) => onTitleChange(e.target.value)} required disabled={isSubmitting} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="clientName">Nome do Cliente</Label>
            <Input id="clientName" value={clientName} onChange={(e) => onClientNameChange(e.target.value)} required disabled={isSubmitting} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status (HorizontalRadioSelect) */}
            <HorizontalRadioSelect
                label="Status"
                options={STATUS_OPTIONS}
                value={status}
                onValueChange={onStatusChange}
                disabled={isSubmitting}
            />
            <div className="grid gap-2">
                <Label htmlFor="primaryColor">Cor Primária (Branding)</Label>
                <div className="flex items-center space-x-2">
                    <Input 
                        id="primaryColor" 
                        type="color" 
                        value={branding.primaryColor} 
                        onChange={(e) => onBrandingChange({ ...branding, primaryColor: e.target.value })}
                        disabled={isSubmitting}
                        className="w-10 h-10 p-0 border-none cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={branding.primaryColor}
                        onChange={(e) => onBrandingChange({ ...branding, primaryColor: e.target.value })}
                        placeholder="#ED1857"
                        className="flex-grow"
                        disabled={isSubmitting}
                    />
                </div>
            </div>
        </div>
        
        <div className="grid gap-2">
            <Label htmlFor="logoUrl">URL do Logo</Label>
            <Input 
                id="logoUrl" 
                value={branding.logoUrl} 
                onChange={(e) => onBrandingChange({ ...branding, logoUrl: e.target.value })}
                placeholder="URL do logo do cliente/agência"
                disabled={isSubmitting}
            />
        </div>
      </CardContent>
    </Card>
  );
};