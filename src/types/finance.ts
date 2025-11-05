export type TransactionType = 'revenue' | 'expense';
export type RecurrenceFrequency = 'monthly' | 'weekly' | 'annual';

export interface Transaction {
  id: string;
  user_id: string;
  client_id?: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string;
  transactionDate: Date;
}

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: RecurrenceFrequency;
  nextDueDate: Date;
  paymentMethod?: string;
  category?: string;
  isActive: boolean;
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  used: number;
  closingDate: number; // Dia do mês (1-31)
  dueDate: number; // Dia do mês (1-31)
  subscriptions: Subscription[];
}