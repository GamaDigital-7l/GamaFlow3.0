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

interface TransactionFormProps {
  initialData?: Transaction;
  onSubmit: (transaction: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const TRANSACTION_TYPES: TransactionType[] = ['revenue', 'expense'];
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

    const transactionData: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string } = {
      id: initialData?.id,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category: category || undefined,
      client_id: finalClientId,
    };

    onSubmit(transactionData);
  };
  
  const availableCategories = type === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={(value) => { setType(value as TransactionType); setCategory(''); }} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Receita (Entrada)</SelectItem>
              <SelectItem value="expense">Despesa (Saída)</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required disabled={isSubmitting} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              {/* Garante que o placeholder tenha um valor não vazio */}
              <SelectItem value="N/A_CATEGORY_PLACEHOLDER">Nenhuma</SelectItem> 
              {availableCategories.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="clientId">Cliente Associado (Opcional)</Label>
          <Select value={clientId} onValueChange={setClientId} disabled={isSubmitting}>
            <SelectTrigger>
              <SelectValue placeholder="Nenhum Cliente" />
            </SelectTrigger>
            <SelectContent>
              {/* CORRIGIDO: Usando 'none' em vez de "" */}
              <SelectItem value="none">Nenhum</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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