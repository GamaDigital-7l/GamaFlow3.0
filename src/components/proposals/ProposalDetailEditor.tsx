import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { ProposalSection, BudgetItem, GoalItem } from '@/types/proposal';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando HorizontalRadioSelect

interface ProposalDetailEditorProps {
  section: ProposalSection;
  onDetailChange: (sectionId: string, detailId: string, key: string, value: any) => void;
  onAddDetail: (sectionId: string) => void;
  onRemoveDetail: (sectionId: string, detailId: string) => void;
  isSubmitting: boolean;
}

const RECURRENCE_OPTIONS = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'one-time', label: 'Única' },
];

const ProposalDetailEditor: React.FC<ProposalDetailEditorProps> = ({
  section,
  onDetailChange,
  onAddDetail,
  onRemoveDetail,
  isSubmitting,
}) => {
  const isDetailSubmitting = isSubmitting;

  switch (section.type) {
    case 'budget':
      const budgetItems = section.details as BudgetItem[] || [];
      return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <h4 className="font-semibold">Itens de Orçamento</h4>
          {budgetItems.map((item) => (
            <Card key={item.id} className="p-3 flex flex-wrap items-center gap-2">
              <Input
                value={item.service}
                onChange={(e) => onDetailChange(section.id, item.id, 'service', e.target.value)}
                placeholder="Serviço"
                disabled={isDetailSubmitting}
                className="w-full sm:w-1/3"
              />
              <Input
                value={item.price}
                type="number"
                step="0.01"
                onChange={(e) => onDetailChange(section.id, item.id, 'price', parseFloat(e.target.value))}
                placeholder="Preço"
                disabled={isDetailSubmitting}
                className="w-full sm:w-1/6"
              />
              {/* Usando HorizontalRadioSelect para Recorrência */}
              <div className="flex-shrink-0">
                <HorizontalRadioSelect
                    label="Recorrência"
                    options={RECURRENCE_OPTIONS}
                    value={item.recurrence}
                    onValueChange={(value) => onDetailChange(section.id, item.id, 'recurrence', value)}
                    disabled={isDetailSubmitting}
                    className="!gap-1"
                />
              </div>
              <Input
                value={item.description}
                onChange={(e) => onDetailChange(section.id, item.id, 'description', e.target.value)}
                placeholder="Descrição"
                disabled={isDetailSubmitting}
                className="flex-grow"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveDetail(section.id, item.id)} disabled={isDetailSubmitting}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onAddDetail(section.id)} disabled={isDetailSubmitting}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Item
          </Button>
        </div>
      );

    case 'goals':
      const goals = section.details as GoalItem[] || [];
      return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <h4 className="font-semibold">Metas e KPIs</h4>
          {goals.map((item) => (
            <Card key={item.id} className="p-3 flex flex-wrap items-center gap-2">
              <Input
                value={item.metric}
                onChange={(e) => onDetailChange(section.id, item.id, 'metric', e.target.value)}
                placeholder="Métrica (Ex: Engajamento)"
                disabled={isDetailSubmitting}
                className="w-full sm:w-1/3"
              />
              <Input
                value={item.target}
                onChange={(e) => onDetailChange(section.id, item.id, 'target', e.target.value)}
                placeholder="Alvo (Ex: 20%)"
                disabled={isDetailSubmitting}
                className="w-full sm:w-1/4"
              />
              <Input
                value={item.indicator}
                onChange={(e) => onDetailChange(section.id, item.id, 'indicator', e.target.value)}
                placeholder="Indicador (Ex: Taxa de Conversão)"
                disabled={isDetailSubmitting}
                className="flex-grow"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveDetail(section.id, item.id)} disabled={isDetailSubmitting}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onAddDetail(section.id)} disabled={isDetailSubmitting}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Meta
          </Button>
        </div>
      );

    case 'timeline':
      const steps = section.details?.steps || [];
      return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <h4 className="font-semibold">Etapas do Cronograma</h4>
          {steps.map((step: any) => (
            <Card key={step.id} className="p-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  value={step.title}
                  onChange={(e) => onDetailChange(section.id, step.id, 'title', e.target.value)}
                  placeholder="Título da Etapa"
                  disabled={isDetailSubmitting}
                  className="flex-grow font-medium"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveDetail(section.id, step.id)} disabled={isDetailSubmitting}>
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <Textarea
                value={step.description}
                onChange={(e) => onDetailChange(section.id, step.id, 'description', e.target.value)}
                placeholder="Descrição da etapa"
                rows={2}
                disabled={isDetailSubmitting}
              />
            </Card>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => onAddDetail(section.id)} disabled={isDetailSubmitting}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Etapa
          </Button>
        </div>
      );

    case 'portfolio':
      const links = section.details?.links || [];
      const [newLink, setNewLink] = useState('');

      const handleAddLink = () => {
        if (newLink.trim()) {
          onDetailChange(section.id, 'links', 'links', [...links, newLink.trim()]);
          setNewLink('');
        }
      };

      const handleRemoveLink = (linkToRemove: string) => {
        onDetailChange(section.id, 'links', 'links', links.filter((link: string) => link !== linkToRemove));
      };

      return (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <h4 className="font-semibold">Links de Portfólio</h4>
          {links.map((link: string, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <Input value={link} readOnly className="bg-muted/50" />
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveLink(link)} disabled={isDetailSubmitting}>
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
          <div className="flex space-x-2">
            <Input
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="Adicionar link (URL)"
              disabled={isDetailSubmitting}
            />
            <Button type="button" onClick={handleAddLink} size="icon" disabled={isDetailSubmitting || !newLink.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default ProposalDetailEditor;