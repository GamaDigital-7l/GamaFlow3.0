"use client";

import React from 'react';
import { BriefingField, FieldType, FieldOption } from '@/types/briefing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface FieldEditorProps {
  field: BriefingField;
  onChange: (updatedField: BriefingField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  allFields: BriefingField[];
  dragHandleProps?: any;
}

const QUESTION_TYPE_OPTIONS: { value: FieldType, label: string }[] = [
  { value: 'text_short', label: 'Texto Curto' },
  { value: 'text_long', label: 'Texto Longo' },
  { value: 'select_single', label: 'Seleção Única (Radio)' },
  { value: 'select_multiple', label: 'Múltipla Escolha (Checkbox)' },
  { value: 'dropdown', label: 'Lista Suspensa (Dropdown)' },
  { value: 'upload', label: 'Upload de Arquivo' },
  { value: 'link', label: 'Link' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'section', label: 'Seção / Título' },
  { value: 'description', label: 'Descrição (Texto Info)' },
];

export const FieldEditor: React.FC<FieldEditorProps> = ({ field, onChange, onDelete, onDuplicate, allFields, dragHandleProps }) => {
  const handleUpdate = (key: keyof BriefingField, value: any) => {
    onChange({ ...field, [key]: value });
  };

  const handleOptionChange = (optionId: string, newLabel: string) => {
    const updatedOptions = (field.options || []).map(opt =>
      opt.id === optionId ? { ...opt, label: newLabel, value: newLabel } : opt
    );
    handleUpdate('options', updatedOptions);
  };

  const handleAddOption = () => {
    const newOption: FieldOption = {
      id: Date.now().toString(),
      label: `Opção ${field.options ? field.options.length + 1 : 1}`,
      value: `Opção ${field.options ? field.options.length + 1 : 1}`,
    };
    handleUpdate('options', [...(field.options || []), newOption]);
  };

  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = (field.options || []).filter(opt => opt.id !== optionId);
    handleUpdate('options', updatedOptions);
  };

  const renderOptions = () => {
    return (
      <div className="space-y-2">
        <Label>Opções</Label>
        <div className="space-y-2">
          {(field.options || []).map((opt) => (
            <div key={opt.id} className="flex items-center space-x-2">
              <Input value={opt.label} onChange={(e) => handleOptionChange(opt.id, e.target.value)} />
              <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(opt.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Opção
        </Button>
      </div>
    );
  };

  return (
    <Card className="p-4 space-y-4 bg-card shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <Select value={field.type} onValueChange={(value) => handleUpdate('type', value as FieldType)}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Tipo de Campo" />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onDuplicate}>Duplicar</Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-2">
        <Label htmlFor="label">Rótulo / Pergunta</Label>
        <Input id="label" value={field.label} onChange={(e) => handleUpdate('label', e.target.value)} />
      </div>

      {['text_short', 'text_long', 'number', 'link', 'dropdown'].includes(field.type) && (
        <div className="grid gap-2">
          <Label htmlFor="placeholder">Texto de Exemplo (Placeholder)</Label>
          <Input id="placeholder" value={field.placeholder || ''} onChange={(e) => handleUpdate('placeholder', e.target.value)} />
        </div>
      )}

      {['select_single', 'select_multiple', 'dropdown'].includes(field.type) && renderOptions()}

      <Separator />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-options">
          <AccordionTrigger>Opções Avançadas</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {field.type !== 'section' && field.type !== 'description' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="required">Obrigatório</Label>
                <Switch id="required" checked={field.isRequired} onCheckedChange={(checked) => handleUpdate('isRequired', checked)} />
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};