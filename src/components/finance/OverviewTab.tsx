"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Clock, Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { format, parseISO, subMonths, addMonths, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction } from '@/types/finance';
import { TransactionForm } from '@/components/finance/TransactionForm';

// Gera uma lista de meses (6 meses passados, 6 meses futuros)
const generateMonthOptions = () => {
  const options: { value: string; label: string }[] = [];
  const today = new Date();
  
  for (let i = -6; i <= 6; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
    options.push({
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM/yyyy', { locale: ptBR }),
    });
  }
  
  const uniqueOptions = Array.from(new Map(options.map(item => [item.value, item])).values());
  return uniqueOptions.sort((a, b) => a.value.localeCompare(b.value)).reverse();
};

const COLORS = ['#FF0059', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-200 rounded-md shadow-md">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-gray-600">
          Tarefas Concluídas: {payload[0].value}
        </p>
      </div>
    );
  }

  return null;
};

const OverviewTab: React.FC = () => {
  const { calculateMonthlySummary, isLoading, transactions, addTransaction, isMutating } = useFinanceStore();
  
  const currentMonthYear = format(new Date(), 'yyyy-MM');
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false); // Novo estado

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  
  const targetDate = useMemo(() => parseISO(selectedMonthYear + '-01'), [selectedMonthYear]);
  const { totalRevenue, totalExpense, netProfit, expenseChartData, monthlyTransactions } = calculateMonthlySummary(targetDate);

  // Dados para o gráfico de barras (Ganhos vs Gastos)
  const barChartData = useMemo(() => [
    { name: 'Receita', valor: totalRevenue, cor: COLORS[0] },
    { name: 'Despesa', valor: totalExpense, cor: COLORS[4] },
  ], [totalRevenue, totalExpense]);
  
  // Cálculo de Totais a Receber e Gastos Fixos (Simulação)
  const totalToReceive = useMemo(() => {
    // Simula entradas futuras (ex: contratos fixos que ainda não venceram)
    return transactions
        .filter(t => t.type === 'revenue' && t.category === 'Contrato Fixo' && t.transactionDate > new Date())
        .reduce((sum, t) => sum + t.amount, 0) + 5000; // Valor fixo simulado
  }, [transactions]);
  
  const totalFixedExpenses = useMemo(() => {
    // Simula despesas fixas (assinaturas, etc.)
    return transactions
        .filter(t => t.type === 'expense' && t.category === 'Assinaturas')
        .reduce((sum, t) => sum + t.amount, 0) + 1500; // Valor fixo simulado
  }, [transactions]);
  
  // NOVO: Comparativo Mensal (Últimos 6 meses)
  const monthlyComparisonData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i);
        const summary = calculateMonthlySummary(monthDate);
        
        data.push({
            name: format(monthDate, 'MMM/yy', { locale: ptBR }),
            Receita: summary.totalRevenue,
            Despesa: summary.totalExpense,
            Lucro: summary.netProfit,
        });
    }
    return data;
  }, [transactions, calculateMonthlySummary]);
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' as 'BRL' });
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'user_id' | 'transactionDate'> & { id?: string }) => {
    addTransaction(transactionData);
    setIsTransactionDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Visão Geral Mensal</h2>
        <div className="flex space-x-2">
            <Select value={selectedMonthYear} onValueChange={setSelectedMonthYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
                size="sm" 
                onClick={() => setIsTransactionDialogOpen(true)} 
                className="bg-dyad-500 hover:bg-dyad-600"
                disabled={isMutating}
            >
                <Plus className="h-4 w-4 mr-2" /> Adicionar Transação
            </Button>
        </div>
      </div>

      {/* Resumo Principal */}
      <Card className={cn(
        "p-6 border-l-4",
        netProfit >= 0 ? "border-green-500/50" : "border-red-500/50"
      )}>
        <CardHeader className="text-xl mb-4">Resumo de {format(targetDate, 'MMMM/yyyy', { locale: ptBR })}</CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Despesa Total</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className={cn("text-2xl font-bold", netProfit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido no Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">+15% vs Mês Anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <Clock className="h-4 w-4 text-dyad-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalToReceive)}</div>
            <p className="text-xs text-muted-foreground">Meta: 2.0 dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gastos Fixos</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalFixedExpenses)}</div>
            <p className="text-xs text-muted-foreground">Foco em resolver</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Final do Mês (Projetado)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit + totalToReceive - totalFixedExpenses)}</div>
            <p className="text-xs text-muted-foreground">Ótimo resultado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ganhos vs. Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="valor" fill="#8884d8" name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader><CardTitle>Distribuição de Despesas por Categoria</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expenseChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {expenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* NOVO GRÁFICO: Comparativo Mensal */}
      <Card>
        <CardHeader><CardTitle>Lucro Líquido Mensal (Últimos 6 Meses)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyComparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => formatCurrency(v as number)} />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Line type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Lucro" stroke="#FF0059" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Diálogo de Adição de Transação */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Transação</DialogTitle>
          </DialogHeader>
          <TransactionForm 
            onSubmit={handleAddTransaction}
            onCancel={() => setIsTransactionDialogOpen(false)}
            isSubmitting={isMutating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OverviewTab;