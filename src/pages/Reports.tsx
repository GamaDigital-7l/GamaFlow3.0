import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTaskStore } from "@/hooks/use-task-store";
import { useClientStore } from "@/hooks/use-client-store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/utils/date"; // Importando formatDate

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

const Reports = () => {
  const [clientFilter, setClientFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('30');
  const { tasks } = useTaskStore();
  const { clients } = useClientStore();

  const completedTasks = useMemo(() => tasks.filter(task => task.status === 'Concluída'), [tasks]);
  const overdueTasks = useMemo(() => tasks.filter(task => task.status === 'Pendente' && new Date(task.dueDate) < new Date()), [tasks]);

  // Calculate some metrics
  const completedTasksThisMonth = completedTasks.filter(task => {
    const now = new Date();
    // Usamos completedAt para saber quando foi concluída, se disponível, senão usamos dueDate
    const taskDate = task.completedAt || task.dueDate; 
    return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
  });

  const averageDeliveryTime = useMemo(() => {
    // Calcula o tempo médio entre a data de criação (simulada pelo ID) e a data de conclusão.
    const tasksWithCompletionTime = completedTasks.filter(task => task.completedAt);
    
    if (tasksWithCompletionTime.length === 0) return 0;
    
    const totalDays = tasksWithCompletionTime.reduce((acc, task) => {
      // Tentativa de extrair timestamp do ID (se for um ID baseado em tempo, como 'p1721930000000')
      // Se o ID for um UUID, este cálculo será impreciso, mas é o melhor que temos sem um campo 'createdAt' explícito.
      const creationTimestampMatch = task.id.match(/p(\d+)/);
      let createdDate: Date;
      
      if (creationTimestampMatch) {
        createdDate = new Date(parseInt(creationTimestampMatch[1]));
      } else {
        // Fallback: Se não for um ID baseado em tempo, assumimos que foi criado 7 dias antes do vencimento (chute)
        createdDate = new Date(task.dueDate.getTime() - 7 * 86400000);
      }
      
      const completedDate = task.completedAt!;
      
      // Calcula a diferença em milissegundos e converte para dias
      const diffTime = completedDate.getTime() - createdDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      // Garante que o tempo de entrega não seja negativo (se a data de criação for posterior à conclusão)
      return acc + Math.max(0, diffDays);
    }, 0);
    
    return totalDays / tasksWithCompletionTime.length;
  }, [completedTasks]);

  const clientPerformanceData = useMemo(() => {
    return clients.map(client => {
      const clientTasks = tasks.filter(task => task.clientName === client.name);
      const clientCompletedTasks = clientTasks.filter(task => task.status === 'Concluída');
      return {
        name: client.name,
        completed: clientCompletedTasks.length,
      };
    });
  }, [clients, tasks]);

  const filteredOverdueTasks = useMemo(() => {
    let filteredTasks = [...overdueTasks];

    if (clientFilter !== 'all') {
      // Filtra pelo ID do cliente, mas compara com o nome da tarefa (clientName)
      const clientName = clients.find(client => client.id === clientFilter)?.name;
      if (clientName) {
        filteredTasks = filteredTasks.filter(task => task.clientName === clientName);
      }
    }

    const period = parseInt(periodFilter);
    if (!isNaN(period) && period > 0) {
      filteredTasks = filteredTasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        const diffTime = now.getTime() - dueDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        return diffDays <= period;
      });
    }

    return filteredTasks;
  }, [overdueTasks, clientFilter, periodFilter, clients]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Resultados e Relatórios</h1>
      <p className="text-muted-foreground">Análise automática de performance, atrasos e eficiência.</p>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Métricas de Performance Geral</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts Concluídos (Mês)</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasksThisMonth.length}</div>
              <p className="text-xs text-muted-foreground">+15% vs Mês Anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio de Entrega</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageDeliveryTime.toFixed(1)} dias</div>
              <p className="text-xs text-muted-foreground">Meta: 2.0 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Revisão</CardTitle>
              <BarChart3 className="h-4 w-4 text-dyad-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2 revisões/post</div>
              <p className="text-xs text-muted-foreground">Ótimo resultado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Atrasadas (Total)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueTasks.length}</div>
              <p className="text-xs text-muted-foreground">Foco em resolver</p>
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

        <div className="flex items-center space-x-4 mb-4">
          <div>
            <Label htmlFor="client">Cliente</Label>
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
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
            <Table>
              <TableCaption>A lista de tarefas que estão atrasadas.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Tarefa</TableHead>
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Reports;