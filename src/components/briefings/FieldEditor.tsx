import React from 'react';
import { BriefingField, FieldType, FieldOption, ConditionalLogic } from '@/types/briefing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';

interface FieldEditorProps {
  field: BriefingField;
  onChange: (updatedField: BriefingField) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  allFields: BriefingField[];
  dragHandleProps?: any;
}

const FIELD_TYPE_OPTIONS: { value: FieldType, label: string }[] = [
  { value: 'text_short', label: 'Texto Curto' },
  { value: 'text_long', label: 'Texto Longo' },
  { value: 'number', label: 'Número' },
  { value: 'email', label: 'E-mail' }, // NOVO
  { value: 'login', label: 'Login/Usuário' }, // NOVO
  { value: 'link', label: 'Link/URL' },
  { value: 'date', label: 'Data' },
  { value: 'select_single', label: 'Seleção Única (Radio)' },
  { value: 'select_multiple', label: 'Múltipla Escolha (Checkbox)' },
  { value: 'dropdown', label: 'Lista Suspensa (Dropdown)' },
  { value: 'upload', label: 'Upload de Arquivo' },
  { value: 'section', label: 'Seção / Título' },
  { value: 'description', label: 'Descrição (Texto Info)' },
];

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onChange, onDelete, onDuplicate, allFields, dragHandleProps }) => {
  
  const handleUpdate = (key: keyof BriefingField, value: any) => {
    onChange({ ...field, [key]: value });
  };
  
  const handleOptionChange = (optionId: string, newLabel: string) => {
    const updatedOptions = (field.options || []).map(opt => {
      if (opt.id === optionId) {
        // Se o novo rótulo for vazio, o valor não pode ser uma string vazia.
        const newValue = newLabel.trim() === '' ? opt.id : newLabel;
        return { ...opt, label: newLabel, value: newValue };
      }
      return opt;
    });
    handleUpdate('options', updatedOptions);
  };
  
  const handleAddOption = () => {
    const newId = Date.now().toString();
    const newOption: FieldOption = {
      id: newId,
      label: `Opção ${field.options ? field.options.length + 1 : 1}`,
      value: `Opção ${field.options ? field.options.length + 1 : 1}`,
    };
    handleUpdate('options', [...(field.options || []), newOption]);
  };
  
  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = (field.options || []).filter(opt => opt.id !== optionId);
    handleUpdate('options', updatedOptions);
  };
  
  const supportsOptions = ['select_single', 'select_multiple', 'dropdown'].includes(field.type);
  const supportsPlaceholder = ['text_short', 'text_long', 'number', 'link', 'email', 'login', 'dropdown'].includes(field.type);
  const supportsRequired = field.type !== 'section' && field.type !== 'description';
  
  const availableConditionFields = allFields
    .filter(f => f.id !== field.id && f.options && f.options.length > 0)
    .map(f => ({ id: f.id, label: f.label, options: f.options }));

  const handleConditionalLogicChange = (key: keyof ConditionalLogic, value: any) => {
    const currentLogic = field.conditionalLogic || { fieldId: '', expectedValue: '' };
    handleUpdate('conditionalLogic', { ...currentLogic, [key]: value });
  };
  
  const handleToggleConditionalLogic = (enabled: boolean) => {
    if (enabled) {
        const defaultField = availableConditionFields[0];
        if (defaultField) {
            handleUpdate('conditionalLogic', {
                fieldId: defaultField.id,
                expectedValue: defaultField.options[0].value,
            });
        }
    } else {
        handleUpdate('conditionalLogic', undefined);
    }
  };
  
  const currentConditionField = availableConditionFields.find(f => f.id === field.conditionalLogic?.fieldId);
  
  // Garante que expectedValue seja uma string para o Select
  const expectedValueString = Array.isArray(field.conditionalLogic?.expectedValue) 
    ? field.conditionalLogic?.expectedValue[0] || '' 
    : field.conditionalLogic?.expectedValue || '';


  return (
    <Card className="p-4 space-y-4 bg-card shadow-md">
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <div {...dragHandleProps} className="cursor-grab">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Select 
                value={field.type} 
                onValueChange={(value) => handleUpdate('type', value as FieldType)}
            >
                <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Tipo de Campo" />
                </SelectTrigger>
                <SelectContent>
                    {FIELD_TYPE_OPTIONS.map(opt => (
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
        <Label htmlFor={`label-${field.id}`}>Rótulo / Pergunta</Label>
        <Input 
          id={`label-${field.id}`}
          value={field.label} 
          onChange={(e) => handleUpdate('label', e.target.value)} 
        />
      </div>

      {supportsPlaceholder && (
        <div className="grid gap-2">
          <Label htmlFor={`placeholder-${field.id}`}>Texto de Exemplo (Placeholder)</Label>
          <Input 
            id={`placeholder-${field.id}`}
            value={field.placeholder || ''} 
            onChange={(e) => handleUpdate('placeholder', e.target.value)} 
          />
        </div>
      )}

      {supportsOptions && (
        <div className="space-y-2">
          <Label>Opções</Label>
          <div className="space-y-2">
            {(field.options || []).map((opt) => (
              <div key={opt.id} className="flex items-center space-x-2">
                <Input 
                  value={opt.label} 
                  onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                />
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
      )}

      <Separator />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-options">
          <AccordionTrigger>Opções Avançadas</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {supportsRequired && (
              <div className="flex items-center justify-between">
                <Label htmlFor={`required-${field.id}`}>Obrigatório</Label>
                <Switch 
                  id={`required-${field.id}`}
                  checked={field.isRequired} 
                  onCheckedChange={(checked) => handleUpdate('isRequired', checked)}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Label htmlFor={`conditional-${field.id}`}>Lógica Condicional</Label>
              <Switch 
                id={`conditional-${field.id}`}
                checked={!!field.conditionalLogic} 
                onCheckedChange={handleToggleConditionalLogic}
                disabled={availableConditionFields.length === 0}
              />
            </div>

            {field.conditionalLogic && (
              <Card className="p-3 bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Exibir este campo se:</p>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={field.conditionalLogic.fieldId}
                    onValueChange={(fieldId) => handleConditionalLogicChange('fieldId', fieldId)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um campo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableConditionFields.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <span className="text-sm">for</span>

                  <Select 
                    value={expectedValueString} // Usando a string garantida
                    onValueChange={(value) => handleConditionalLogicChange('expectedValue', value)}
                    disabled={!currentConditionField}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um valor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentConditionField?.options.map(opt => (
                        // Garante que o valor do SelectItem não seja vazio
                        <SelectItem key={opt.id} value={opt.value && opt.value.trim() !== '' ? opt.value : opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

export default FieldEditor;