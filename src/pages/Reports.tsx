import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaskStore } from '@/hooks/use-task-store';
import { useHabits } from '@/hooks/use-habits'; // Usando completions do useHabits
import { isToday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction } from '@/types/finance';
import { TransactionForm } from '@/components/finance/TransactionForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from '@/utils/date';
import { CheckCircle, ListTodo, Zap } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Client } from '@/types/client';
import { useClientStore } from '@/hooks/use-client-store'; // Importando useClientStore
import { HorizontalRadioSelect } from '@/components/HorizontalRadioSelect'; // Importando HorizontalRadioSelect

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

const Reports: React.FC = () => {
  const { tasks } = useTaskStore();
  const { habits, completions } = useHabits();
  const { clients } = useClientStore(); // Destructuring clients
  const [clientFilterId, setClientFilterId] = useState<string>('all'); // Usando ID para o filtro
  const [periodFilter, setPeriodFilter] = useState<string>('30');

  const metrics = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // 1. Tarefas Comuns Concluídas Hoje (baseado em completedAt)
    const completedTasksToday = tasks.filter(t => t.status === 'Concluída' && t.completedAt && isToday(t.completedAt)).length;
    
    // 2. Hábitos Concluídos Hoje (baseado em habit_completions)
    const completedHabitsToday = completions.filter(c => c.completion_date === todayStr).length;
    
    const totalCompletedToday = completedTasksToday + completedHabitsToday;
    
    const totalPending = tasks.filter(t => t.status === 'Pendente').length;
    
    // Pontos de Produtividade: 10 pontos por tarefa + 1 ponto por hábito (exemplo)
    const productivityPoints = (completedTasksToday * 10) + (completedHabitsToday * 1);

    return {
      completedToday: totalCompletedToday,
      totalPending,
      productivityPoints,
    };
  }, [tasks, completions]);

  const clientPerformanceData = [];

  const filteredOverdueTasks = useMemo(() => {
    const periodDays = parseInt(periodFilter, 10) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const clientName = clients.find(c => c.id === clientFilterId)?.name;

    return tasks.filter(task => {
        const isWithinPeriod = task.dueDate >= cutoffDate;
        const matchesClient = clientFilterId === 'all' || task.clientName === clientName;
        
        return isWithinPeriod && matchesClient && task.status === 'Pendente' && isTaskOverdue(task.dueDate);
    });
  }, [tasks, periodFilter, clientFilterId, clients]);
  
  const clientFilterOptions = useMemo(() => [
    { value: 'all', label: 'Todos' },
    ...clients.map((clientItem: Client) => ({ value: clientItem.id, label: clientItem.name }))
  ], [clients]);


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Resultados e Relatórios</h1>
      <p className="text-muted-foreground">Análise automática de performance, atrasos e eficiência.</p>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Métricas de Performance Geral</h2>
        
        {/* Ajuste do grid para 1 coluna no mobile, 3 no md */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pontos de Produtividade (Dyad Pink) */}
          <Card className="border"> {/* Borda neutra */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pontos de Produtividade</CardTitle>
              <Zap className="h-4 w-4 text-dyad-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.productivityPoints} pts</div>
              <p className="text-xs text-muted-foreground">Baseado em tarefas e hábitos concluídos hoje</p>
            </CardContent>
          </Card>
          {/* Itens Concluídos Hoje (Neutro) */}
          <Card className="border"> {/* Borda neutra */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Concluídos Hoje</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" /> {/* Ícone cinza */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedToday}</div>
              <p className="text-xs text-muted-foreground">Ótimo trabalho!</p>
            </CardContent>
          </Card>
          {/* Total de Tarefas Pendentes (Neutro) */}
          <Card className="border"> {/* Borda neutra */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Tarefas Pendentes</CardTitle>
              <ListTodo className="h-4 w-4 text-gray-500" /> {/* Ícone cinza */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPending}</div>
              <p className="text-xs text-muted-foreground">Foco na organização</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="completed" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Relatório de Atrasos</h2>

        {/* Filtros: Empilhados no mobile */}
        <div className="flex flex-col sm:flex-row items-end space-y-4 sm:space-y-0 sm:space-x-3">
          <div className="w-full sm:w-auto flex-grow">
            <HorizontalRadioSelect
                label="Cliente"
                options={clientFilterOptions}
                value={clientFilterId}
                onValueChange={setClientFilterId}
            />
          </div>
          <div className="grid gap-2 w-full sm:w-auto flex-shrink-0">
            <Label htmlFor="period">Período (Dias)</Label>
            <Input
              type="number"
              id="period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Tarefas Atrasadas (Últimos {periodFilter} dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Tabela com rolagem horizontal no mobile */}
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableCaption>A lista de tarefas que estão atrasadas.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Tarefa</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data de Vencimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOverdueTasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">{task.title}</TableCell>
                        <TableCell>{task.clientName || 'Geral'}</TableCell>
                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Reports;