import React from 'react';
import { BriefingField, FieldType, FieldOption } from '@/types/briefing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Upload, Link as LinkIcon, Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface BriefingFieldRendererProps {
  field: BriefingField;
  value: any;
  onChange: (value: any) => void;
  allResponses: Record<string, any>;
}

const BriefingFieldRenderer: React.FC<BriefingFieldRendererProps> = ({ field, value, onChange, allResponses }) => {
  
  // Lógica Condicional: Verifica se o campo deve ser exibido
  const isConditionalMet = () => {
    const logic = field.conditionalLogic;
    if (!logic) return true;
    
    const targetValue = allResponses[logic.fieldId];
    
    // Verifica se o valor alvo está vazio/indefinido
    const isTargetValueEmpty = targetValue === undefined || targetValue === null || (typeof targetValue === 'string' && targetValue.trim() === '') || (Array.isArray(targetValue) && targetValue.length === 0);
    
    if (isTargetValueEmpty) return false;
    
    const expected = Array.isArray(logic.expectedValue) ? logic.expectedValue : [logic.expectedValue];
    
    if (Array.isArray(targetValue)) {
        // Se o valor alvo for um array (ex: select_multiple), verifica se algum item corresponde
        return targetValue.some(v => expected.includes(v));
    }
    
    // Se o valor alvo for uma string/número (ex: select_single, dropdown, text)
    return expected.includes(targetValue);
  };
  
  if (!isConditionalMet()) {
    return null;
  }
  
  // Renderiza o rótulo e o indicador de obrigatoriedade
  const renderLabel = (isTypeform: boolean = false) => (
    <Label 
        htmlFor={field.id} 
        className={cn(
            "font-semibold mb-2 block",
            isTypeform ? "text-2xl md:text-3xl text-foreground" : "text-lg text-foreground/90"
        )}
    >
      {field.label}
      {field.isRequired && <span className="text-dyad-500 ml-1">*</span>}
    </Label>
  );

  // Determina se estamos no modo Typeform (para aplicar estilos maiores)
  const isTypeformMode = field.type !== 'section' && field.type !== 'description' && field.type !== 'select_multiple';

  switch (field.type) {
    case 'section':
      return (
        <div className="py-4 border-b border-border/50 mb-4">
          <h2 className="text-2xl font-bold text-dyad-500">{field.label}</h2>
        </div>
      );
    case 'description':
      return (
        <div className="py-2 mb-4">
          <p className="text-base text-muted-foreground whitespace-pre-wrap">{field.label}</p>
        </div>
      );
    case 'text_short':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Input
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className={cn(isTypeformMode && "h-12 text-lg")}
          />
        </div>
      );
    case 'text_long':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Textarea
            id={field.id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={isTypeformMode ? 6 : 4}
            required={field.isRequired}
            className={cn(isTypeformMode && "text-lg")}
          />
        </div>
      );
    case 'number':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Input
            id={field.id}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.isRequired}
            className={cn(isTypeformMode && "h-12 text-lg")}
          />
        </div>
      );
    case 'email': // NOVO
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.id}
              type="email"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'seu.email@exemplo.com'}
              required={field.isRequired}
              className={cn(isTypeformMode && "h-12 text-lg", "pl-10")}
            />
          </div>
        </div>
      );
    case 'login': // NOVO
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.id}
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'Nome de usuário ou ID'}
              required={field.isRequired}
              className={cn(isTypeformMode && "h-12 text-lg", "pl-10")}
            />
          </div>
        </div>
      );
    case 'link':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id={field.id}
              type="url"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || 'https://exemplo.com'}
              required={field.isRequired}
              className={cn(isTypeformMode && "h-12 text-lg", "pl-10")}
            />
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  isTypeformMode && "h-12 text-lg"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "dd/MM/yyyy") : field.placeholder || "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    case 'select_single':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <RadioGroup 
            value={value || ''} 
            onValueChange={onChange}
            required={field.isRequired}
            className={cn(isTypeformMode && "space-y-4")}
          >
            <div className="flex flex-col space-y-2">
              {field.options?.map(opt => (
                <div key={opt.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={opt.value} id={opt.id} className={cn(isTypeformMode && "h-5 w-5")} />
                  <Label htmlFor={opt.id} className={cn("font-normal cursor-pointer", isTypeformMode && "text-lg")}>{opt.label}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      );
    case 'select_multiple':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <div className="flex flex-col space-y-2">
            {field.options?.map(opt => (
              <div key={opt.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={opt.id}
                  checked={(value || []).includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      onChange([...currentValues, opt.value]);
                    } else {
                      onChange(currentValues.filter(v => v !== opt.value));
                    }
                  }}
                  className={cn(isTypeformMode && "h-5 w-5")}
                />
                <Label htmlFor={opt.id} className={cn("font-normal cursor-pointer", isTypeformMode && "text-lg")}>{opt.label}</Label>
              </div>
            ))}
          </div>
          {field.isRequired && (!value || value.length === 0) && (
            <p className="text-xs text-red-500">Selecione pelo menos uma opção.</p>
          )}
        </div>
      );
    case 'dropdown':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Select value={value || ''} onValueChange={onChange} required={field.isRequired}>
            <SelectTrigger className={cn(isTypeformMode && "h-12 text-lg")}>
              <SelectValue placeholder={field.placeholder || "Selecione uma opção"} />
            </SelectTrigger>
            <SelectContent>
              {/* Item com valor não-vazio para representar o placeholder/opção nula */}
              <SelectItem value="N/A_PLACEHOLDER" className="text-muted-foreground italic">
                {field.placeholder || "Selecione uma opção"}
              </SelectItem> 
              {field.options
                ?.map(opt => {
                    // VERIFICAÇÃO DE SEGURANÇA: Garante que o valor não seja uma string vazia
                    // Se o valor for vazio, usa o ID da opção como fallback
                    const itemValue = opt.value && opt.value.trim() !== '' ? opt.value : opt.id;
                    return (
                        <SelectItem key={opt.id} value={itemValue}>{opt.label}</SelectItem>
                    );
                })}
            </SelectContent>
          </Select>
        </div>
      );
    case 'upload':
      return (
        <div className="grid gap-3">
          {renderLabel(isTypeformMode)}
          <Input
            id={field.id}
            type="file"
            onChange={(e) => onChange(e.target.files ? Array.from(e.target.files) : null)}
            required={field.isRequired}
            className="file:text-dyad-500 file:font-medium"
          />
          {value && Array.isArray(value) && value.length > 0 && (
            <p className="text-xs text-muted-foreground">{value.length} arquivo(s) selecionado(s).</p>
          )}
        </div>
      );
    default:
      return (
        <div className="p-4 border border-red-500 rounded-lg">
          <p className="text-red-500">Tipo de campo desconhecido: {field.type}</p>
        </div>
      );
  }
};

export default BriefingFieldRenderer;