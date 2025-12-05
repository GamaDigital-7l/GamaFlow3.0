import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/hooks/use-client-store';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { Loader2, DollarSign, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { ClientAvatar } from '@/components/ClientAvatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from '@/utils/date';
import { Transaction } from '@/types/finance';
import { isSameMonth } from 'date-fns';

const ClientsTab: React.FC = () => {
  const { clients } = useClientStore();
  const { transactions, isLoading } = useFinanceStore();
  
  // Agrupa transações por cliente
  const transactionsByClient = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.client_id) {
        acc[t.client_id] = acc[t.client_id] || [];
        acc[t.client_id].push(t);
      }
      return acc;
    }, {} as Record<string, Transaction[]>);
  }, [transactions]);
  
  // Calcula o progresso da meta de receita (simulado)
  const clientsWithFinancials = useMemo(() => {
    return clients.map(client => {
      const clientTransactions = transactionsByClient[client.id] || [];
      
      // Simula uma meta de receita mensal (ex: 3x a meta de posts)
      const revenueGoal = client.monthlyPostGoal * 500; 
      
      const currentRevenue = clientTransactions
        .filter(t => t.type === 'revenue' && isSameMonth(t.transactionDate, new Date()))
        .reduce((sum, t) => sum + t.amount, 0);
        
      const percentage = revenueGoal > 0 ? Math.min(100, Math.round((currentRevenue / revenueGoal) * 100)) : 0;
      
      return {
        ...client,
        currentRevenue,
        revenueGoal,
        percentage,
        recentTransactions: clientTransactions.slice(0, 5),
      };
    });
  }, [clients, transactionsByClient]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  if (isLoading) {
    return <div className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Clientes e Metas de Receita</h2>
      <p className="text-muted-foreground">Acompanhe o desempenho financeiro e as transações recentes de cada cliente.</p>

      <div className="space-y-8">
        {clientsWithFinancials.map(client => (
          <Card key={client.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-3">
                <ClientAvatar name={client.name} logoUrl={client.logoUrl} className="h-10 w-10" />
                <CardTitle className="text-xl">{client.name}</CardTitle>
                <Badge className={cn(client.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500')}>{client.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Progresso da Meta */}
              <div className="lg:col-span-1 space-y-3 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold flex items-center space-x-2"><Target className="h-4 w-4 text-dyad-500" /> Meta de Receita Mensal</h3>
                <p className="text-3xl font-bold text-dyad-500">
                  {formatCurrency(client.currentRevenue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {client.percentage}% de {formatCurrency(client.revenueGoal)}
                </p>
                <Progress value={client.percentage} className="h-2" indicatorClassName={client.percentage >= 100 ? 'bg-green-500' : 'bg-dyad-500'} />
              </div>
              
              {/* Transações Recentes */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-semibold border-b pb-1">Transações Recentes</h3>
                {/* Tabela com rolagem horizontal no mobile */}
                <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {client.recentTransactions.length === 0 ? (
                          <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Nenhuma transação recente.</TableCell></TableRow>
                        ) : (
                          client.recentTransactions.map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="text-sm">{t.description}</TableCell>
                              <TableCell className={cn("font-medium", t.type === 'revenue' ? 'text-green-600' : 'text-red-600')}>
                                {t.type === 'revenue' ? '+' : '-'} {formatCurrency(t.amount)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.transactionDate)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientsTab;