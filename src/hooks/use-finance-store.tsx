import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Transaction, Subscription, TransactionType, RecurrenceFrequency } from '@/types/finance';
import { showSuccess, showError } from '@/utils/toast';
import { useMemo, useCallback } from 'react';
import { format, parseISO, isSameMonth, isSameYear, getDay, addMonths, addWeeks, addYears, isPast } from 'date-fns';

const TRANSACTIONS_QUERY_KEY = 'financeTransactions';
const SUBSCRIPTIONS_QUERY_KEY = 'financeSubscriptions';

// --- Mapeamento e Conversão ---

const mapSupabaseTransactionToTransaction = (data: any): Transaction => ({
  id: data.id,
  user_id: data.user_id,
  client_id: data.client_id || undefined,
  description: data.description,
  amount: parseFloat(data.amount),
  type: data.type as TransactionType,
  category: data.category || undefined,
  transactionDate: new Date(data.transaction_date),
});

const mapSupabaseSubscriptionToSubscription = (data: any): Subscription => ({
  id: data.id,
  user_id: data.user_id,
  name: data.name,
  amount: parseFloat(data.amount),
  frequency: data.frequency as RecurrenceFrequency,
  nextDueDate: parseISO(data.next_due_date),
  paymentMethod: data.payment_method || undefined,
  category: data.category || undefined,
  isActive: data.is_active,
});

// --- Funções CRUD ---

// Transações
const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseTransactionToTransaction);
};

const upsertTransactionToDB = async (transaction: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string }): Promise<Transaction> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    ...transaction,
    user_id: user.id,
    amount: transaction.amount,
    client_id: transaction.client_id || null,
    transaction_date: new Date().toISOString(), // Sempre usa a data atual para novas transações/updates
  };

  const { data, error } = await supabase
    .from('transactions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseTransactionToTransaction(data);
};

const deleteTransactionFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// Assinaturas
const fetchSubscriptions = async (): Promise<Subscription[]> => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('next_due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return data.map(mapSupabaseSubscriptionToSubscription);
};

const upsertSubscriptionToDB = async (subscription: Omit<Subscription, 'user_id'> & { id?: string }): Promise<Subscription> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const payload = {
    ...subscription,
    user_id: user.id,
    amount: subscription.amount,
    next_due_date: format(subscription.nextDueDate, 'yyyy-MM-dd'),
  };

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSupabaseSubscriptionToSubscription(data);
};

const deleteSubscriptionFromDB = async (id: string): Promise<void> => {
  const { error } = await supabase.from('subscriptions').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

// --- Lógica de Recorrência ---

const calculateNextDueDate = (currentDate: Date, frequency: RecurrenceFrequency): Date => {
    let nextDate = currentDate;
    const now = new Date();
    
    // Avança a data até que seja no futuro
    while (isPast(nextDate) || isSameDay(nextDate, now)) {
        if (frequency === 'monthly') {
            nextDate = addMonths(nextDate, 1);
        } else if (frequency === 'weekly') {
            nextDate = addWeeks(nextDate, 1);
        } else if (frequency === 'annual') {
            nextDate = addYears(nextDate, 1);
        } else {
            break;
        }
    }
    return nextDate;
};

// --- Hook Principal ---

export const useFinanceStore = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[], Error>({
    queryKey: [TRANSACTIONS_QUERY_KEY],
    queryFn: fetchTransactions,
  });

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useQuery<Subscription[], Error>({
    queryKey: [SUBSCRIPTIONS_QUERY_KEY],
    queryFn: fetchSubscriptions,
  });
  
  const isLoading = isLoadingTransactions || isLoadingSubscriptions;

  // Mutations
  const transactionMutation = useMutation({
    mutationFn: upsertTransactionToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
      showSuccess('Transação salva com sucesso!');
    },
    onError: (err) => showError(`Erro ao salvar transação: ${err.message}`),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: deleteTransactionFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSACTIONS_QUERY_KEY] });
      showSuccess('Transação excluída.');
    },
    onError: (err) => showError(`Erro ao excluir transação: ${err.message}`),
  });
  
  const subscriptionMutation = useMutation({
    mutationFn: upsertSubscriptionToDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_QUERY_KEY] });
      showSuccess('Assinatura salva com sucesso!');
    },
    onError: (err) => showError(`Erro ao salvar assinatura: ${err.message}`),
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: deleteSubscriptionFromDB,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTIONS_QUERY_KEY] });
      showSuccess('Assinatura excluída.');
    },
    onError: (err) => showError(`Erro ao excluir assinatura: ${err.message}`),
  });
  
  // Função para renovar uma assinatura (avançar a data de vencimento)
  const renewSubscription = useCallback((subscription: Subscription) => {
    const nextDueDate = calculateNextDueDate(subscription.nextDueDate, subscription.frequency);
    
    subscriptionMutation.mutate({
        ...subscription,
        nextDueDate,
    });
  }, [subscriptionMutation]);


  // --- Cálculos e Resumos (useMemo) ---

  const calculateMonthlySummary = useCallback((targetDate: Date) => {
    const monthlyTransactions = transactions.filter(t => 
      isSameMonth(t.transactionDate, targetDate) && isSameYear(t.transactionDate, targetDate)
    );

    const totalRevenue = monthlyTransactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const netProfit = totalRevenue - totalExpense;
    
    // Distribuição de despesas por categoria
    const expenseDistribution = monthlyTransactions
        .filter(t => t.type === 'expense' && t.category)
        .reduce((acc, t) => {
            acc[t.category!] = (acc[t.category!] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);
        
    const expenseChartData = Object.entries(expenseDistribution).map(([name, value]) => ({
        name,
        value,
    }));

    return {
      totalRevenue,
      totalExpense,
      netProfit,
      expenseChartData,
      monthlyTransactions,
    };
  }, [transactions]);
  
  // Dados de Cartões (Simulados, pois não temos tabela de Cartões)
  const cards = useMemo(() => {
    // Agrupa assinaturas por método de pagamento
    const subscriptionsByCard = subscriptions.reduce((acc, sub) => {
        if (sub.paymentMethod) {
            acc[sub.paymentMethod] = acc[sub.paymentMethod] || [];
            acc[sub.paymentMethod].push(sub);
        }
        return acc;
    }, {} as Record<string, Subscription[]>);
    
    // Simulação de dados de cartão
    const simulatedCards: Card[] = [
        { id: 'c1', name: 'Nubank (Roxo)', limit: 15000, used: 4500, closingDate: 25, dueDate: 7, subscriptions: subscriptionsByCard['Nubank'] || [] },
        { id: 'c2', name: 'C6 (Amarelo)', limit: 8000, used: 1200, closingDate: 10, dueDate: 20, subscriptions: subscriptionsByCard['C6'] || [] },
    ];
    
    return simulatedCards;
  }, [subscriptions]);


  return {
    transactions,
    subscriptions,
    cards,
    isLoading,
    calculateMonthlySummary,
    addTransaction: transactionMutation.mutate,
    updateTransaction: transactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    addSubscription: subscriptionMutation.mutate,
    updateSubscription: subscriptionMutation.mutate,
    deleteSubscription: deleteSubscriptionMutation.mutate,
    renewSubscription,
    isMutating: transactionMutation.isPending || subscriptionMutation.isPending,
  };
};