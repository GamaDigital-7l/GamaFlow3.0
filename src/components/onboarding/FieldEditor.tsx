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

export interface FieldEditorProps {
  field: any;
  onChange: (updatedField: any) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  allFields: any[];
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
  const handleUpdate = (key: string, value: any) => {
    onChange({ ...field, data: { ...field.data, [key]: value } });
  };

  const renderTypeSpecificFields = () => {
    switch (field.type) {
      case 'mediaLink':
        return (
          <>
            <div className="grid gap-2">
              <Label htmlFor="linkTitle">Título do Link</Label>
              <Input
                id="linkTitle"
                value={field.data.linkTitle || ''}
                onChange={(e) => handleUpdate('linkTitle', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="linkUrl">URL do Link</Label>
              <Input
                id="linkUrl"
                type="url"
                value={field.data.linkUrl || ''}
                onChange={(e) => handleUpdate('linkUrl', e.target.value)}
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-card shadow-md">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          {/* Select para o tipo de bloco */}
          <Select value={field.type} onValueChange={(value) => onChange({ ...field, type: value })}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Tipo de Bloco" />
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

      {/* Campos comuns a todos os blocos */}
      <div className="grid gap-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={field.data.title || ''}
          onChange={(e) => handleUpdate('title', e.target.value)}
        />
      </div>

      {/* Campos específicos do tipo de bloco */}
      {renderTypeSpecificFields()}
    </Card>
  );
};

export default FieldEditor;