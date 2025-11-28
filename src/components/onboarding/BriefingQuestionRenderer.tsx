import React from 'react';
import { BriefingQuestion } from '@/types/playbook';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface BriefingQuestionRendererProps {
  question: BriefingQuestion;
  value: any; // O valor atual da resposta
  onChange: (value: any) => void; // Callback para atualizar a resposta
  readOnly?: boolean;
}

export const BriefingQuestionRenderer: React.FC<BriefingQuestionRendererProps> = ({ question, value, onChange, readOnly = false }) => {
  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            id={question.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            disabled={readOnly}
          />
        );
      case 'textarea':
        return (
          <Textarea
            id={question.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            required={question.required}
            disabled={readOnly}
          />
        );
      case 'number':
        return (
          <Input
            id={question.id}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            required={question.required}
            disabled={readOnly}
          />
        );
      case 'link':
        return (
          <Input
            id={question.id}
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder || 'https://exemplo.com'}
            required={question.required}
            disabled={readOnly}
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
                disabled={readOnly}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "dd/MM/yyyy") : question.placeholder || "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
                disabled={readOnly}
              />
            </PopoverContent>
          </Popover>
        );
      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange} required={question.required} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue placeholder={question.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option, index) => (
                <SelectItem key={index} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'checkbox':
        return (
          <div className="flex flex-col space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter(v => v !== option));
                    }
                  }}
                  disabled={readOnly}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
            {question.required && (!value || value.length === 0) && (
              <p className="text-xs text-red-500">Selecione pelo menos uma opção.</p>
            )}
          </div>
        );
      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange} required={question.required} disabled={readOnly}>
            <div className="flex flex-col space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                  <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );
      default:
        return <p className="text-red-500">Tipo de pergunta desconhecido: {question.type}</p>;
    }
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor={question.id} className="font-semibold">
        {question.label}
        {question.required && <span className="text-dyad-500 ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
};