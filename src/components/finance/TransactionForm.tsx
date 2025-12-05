import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Transaction, TransactionType } from '@/types/finance';
import { showError } from '@/utils/toast';
import { useClientStore } from '@/hooks/use-client-store';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HorizontalRadioSelect } from '../HorizontalRadioSelect'; // Importando o novo componente

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (transaction: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TRANSACTION_TYPES: { value: TransactionType, label: string }[] = [
    { value: 'revenue', label: 'Receita (Entrada)' },
    { value: 'expense', label: 'Despesa (Saída)' },
];
const REVENUE_CATEGORIES = ['Contrato Fixo', 'Job Avulso', 'Outras Entradas'];
const EXPENSE_CATEGORIES = ['Assinaturas', 'Marketing', 'Equipamentos', 'Salário', 'Impostos', 'Outras Despesas'];

export const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { clients } = useClientStore();
  
  // Mapeia clientId nulo/vazio para 'none' para o Select
  const getInitialClientId = (id?: string) => id || 'none';
  
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || 'revenue');
  const [category, setCategory] = useState(initialData?.category || '');
  const [clientId, setClientId] = useState(getInitialClientId(initialData?.client_id));

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setType(initialData.type);
      setCategory(initialData.category || '');
      setClientId(getInitialClientId(initialData.client_id));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);

    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      showError('Descrição e valor válidos são obrigatórios.');
      return;
    }
    
    const finalClientId = clientId === 'none' ? undefined : clientId;
    // Se a categoria for vazia, salva como undefined
    const finalCategory = category === '' ? undefined : category;

    const transactionData: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string } = {
      id: initialData?.id,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category: finalCategory,
      client_id: finalClientId,
    };

    onSubmit(transactionData);
  };
  
  const availableCategories = type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;
  const categoryOptions = [
    { value: '', label: 'Nenhuma' }, // Opção para categoria nula
    ...availableCategories.map(cat => ({ value: cat, label: cat }))
  ];
  
  const clientOptions = [
    { value: 'none', label: 'Nenhum' },
    ...clients.map(client => ({ value: client.id, label: client.name }))
  ];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 w-[98%]">
      {/* Tipo (HorizontalRadioSelect) */}
      <HorizontalRadioSelect
        label="Tipo"
        options={TRANSACTION_TYPES}
        value={type}
        onValueChange={(value) => { setType(value as TransactionType); setCategory(''); }}
        disabled={isSubmitting}
      />
      
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
      
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required disabled={isSubmitting} />
      </div>

      <div className="grid gap-4">
        {/* Categoria (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Categoria"
            options={categoryOptions}
            value={category}
            onValueChange={setCategory}
            disabled={isSubmitting}
        />
        
        {/* Cliente Associado (HorizontalRadioSelect) */}
        <HorizontalRadioSelect
            label="Cliente Associado (Opcional)"
            options={clientOptions}
            value={clientId}
            onValueChange={setClientId}
            disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-dyad-500 hover:bg-dyad-600" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Transação'}
        </Button>
      </div>
    </form>
  );
};