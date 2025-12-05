import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Subscription, RecurrenceFrequency } from '@/types/finance';
import { showError } from '@/utils/toast'; // Importando showError
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Importando RadioGroup
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando HorizontalRadioSelect

interface SubscriptionFormProps {
  initialData?: Subscription;
  onSubmit: (subscription: Omit<Subscription, 'user_id'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency, label: string }[] = [
    { value: 'monthly', label: 'Mensal' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'annual', label: 'Anual' },
];

const CATEGORY_OPTIONS = ['Software', 'Marketing', 'Serviços', 'Aluguel', 'Outros'];
const PAYMENT_METHODS = ['Nubank', 'C6', 'Inter', 'Boleto', 'Outro'];

export const SubscriptionForm: React.FC<SubscriptionFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(initialData?.frequency || 'monthly');
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>(initialData?.nextDueDate || new Date());
  // Garante que o estado inicial seja uma string vazia se for nulo/indefinido
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setAmount(initialData.amount.toString());
      setFrequency(initialData.frequency);
      setNextDueDate(initialData.nextDueDate);
      setPaymentMethod(initialData.paymentMethod || '');
      setCategory(initialData.category || '');
      setIsActive(initialData.isActive);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);

    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !nextDueDate) {
      showError('Nome, valor e próxima data de vencimento são obrigatórios.');
      return;
    }
    
    const finalPaymentMethod = paymentMethod === 'N/A_METHOD' ? undefined : paymentMethod;
    const finalCategory = category === 'N/A_CATEGORY' ? undefined : category;

    const subscriptionData: Omit<Subscription, 'user_id'> & { id?: string } = {
      id: initialData?.id,
      name: name.trim(),
      amount: parsedAmount,
      frequency,
      nextDueDate,
      paymentMethod: finalPaymentMethod,
      category: finalCategory,
      isActive,
    };

    onSubmit(subscriptionData);
  };
  
  const categoryOptions = [
    { value: 'N/A_CATEGORY', label: 'Nenhuma' },
    ...CATEGORY_OPTIONS.map(cat => ({ value: cat, label: cat }))
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 w-[98%]">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do Serviço / Recorrência</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input 
            id="amount" 
            type="number" 
            step="0.01"
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            placeholder="0.00"
            required
            disabled={isSubmitting} 
          />
        </div>
        {/* Frequência (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Frequência"
            options={FREQUENCY_OPTIONS}
            value={frequency}
            onValueChange={(value) => setFrequency(value as RecurrenceFrequency)}
            disabled={isSubmitting}
            className="col-span-2 md:col-span-1"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Próximo Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !nextDueDate && "text-muted-foreground"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {nextDueDate ? format(nextDueDate, "dd/MM/yyyy") : "Selecione a data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={nextDueDate}
                onSelect={setNextDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Cartão/Método" />
            </SelectTrigger>
            <SelectContent>
              {/* Usando um valor não-vazio para 'Nenhum' */}
              <SelectItem value="N/A_METHOD">Nenhum</SelectItem> 
              {PAYMENT_METHODS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Categoria (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Categoria"
        options={categoryOptions}
        value={category}
        onValueChange={setCategory}
        disabled={isSubmitting}
      />

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Recorrência'}
        </Button>
      </div>
    </form>
  );
};