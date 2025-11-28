import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Target, Filter, Search, Briefcase } from 'lucide-react';
import { useGoals } from '@/hooks/use-goals';
import { Goal, GoalCategory, GoalStatus, PortfolioGoalType, PortfolioCategory } from '@/types/goals';
import { GoalForm } from '@/components/goals/GoalForm';
import { GoalCard } from '@/components/goals/GoalCard';
import { Separator } from '@/components/ui/separator';
import { useClientStore } from '@/hooks/use-client-store';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface GoalFormProps {
  initialData?: Goal;
  onSubmit: (goal: Omit<Goal, 'id' | 'user_id' | 'createdAt'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const CATEGORY_OPTIONS: GoalCategory[] = ['Financeiro', 'Pessoal', 'Profissional', 'Saúde', 'Clientes', 'Agência', 'Outros'];
const STATUS_OPTIONS: GoalStatus[] = ['Em Andamento', 'Concluída', 'Atrasada'];
const PORTFOLIO_TYPE_OPTIONS: PortfolioGoalType[] = ['Projeto Real', 'Projeto Conceito', 'Estudo Pessoal'];
const PORTFOLIO_CATEGORY_OPTIONS: PortfolioCategory[] = ['Design', '3D', 'Vídeo', 'Landing Page', 'Social Media', 'Outro'];

const GoalsPage: React.FC = () => {
  const { goals, isLoading, addGoal, updateGoal, deleteGoal, isAdding, isUpdating, isDeleting } = useGoals();
  const { clients } = useClientStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string>('Todas');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [portfolioCategoryFilter, setPortfolioCategoryFilter] = useState<string>('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'geral' | 'portfolio'>('geral');

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingGoal(undefined);
  };

  const handleSubmit = (goalData: Omit<Goal, 'id' | 'user_id' | 'createdAt'>) => {
    if (editingGoal) {
      // Update
      updateGoal({ ...editingGoal, ...goalData });
    } else {
      // Add
      addGoal(goalData);
    }
    handleCloseDialog();
  };

  const filteredGoals = useMemo(() => {
    let filtered = goals;

    // 1. Filtro por Aba (Geral vs Portfólio)
    if (activeTab === 'portfolio') {
        filtered = filtered.filter(g => g.isPortfolioGoal);
    } else {
        filtered = filtered.filter(g => !g.isPortfolioGoal);
    }

    // 2. Filtro por Status
    if (statusFilter !== 'Todas') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // 3. Filtro por Categoria (Geral)
    if (activeTab === 'geral' && categoryFilter !== 'Todas') {
      filtered = filtered.filter(g => g.category === categoryFilter);
    }
    
    // 4. Filtro por Categoria (Portfólio)
    if (activeTab === 'portfolio' && portfolioCategoryFilter !== 'Todas') {
        filtered = filtered.filter(g => g.portfolioCategory === portfolioCategoryFilter);
    }

    // 5. Busca por Título
    if (searchTerm.trim()) {
      const lowerCaseSearch = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(g => 
        g.title.toLowerCase().includes(lowerCaseSearch) ||
        g.description?.toLowerCase().includes(lowerCaseSearch)
      );
    }
    
    // Ordenação: Atrasadas > Em Andamento > Concluídas, e por data de vencimento
    return filtered.sort((a, b) => {
        const statusOrder: Record<GoalStatus, number> = { 'Atrasada': 1, 'Em Andamento': 2, 'Concluída': 3 };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        
        return a.dueDate.getTime() - b.dueDate.getTime();
    });

  }, [goals, statusFilter, categoryFilter, portfolioCategoryFilter, searchTerm, activeTab]);
  
  // Resumo de Metas do Mês (Geral)
  const monthlySummary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtra metas que estão ativas ou que venceram/concluíram neste mês
    const relevantGoals = goals.filter(g => 
        g.startDate.getMonth() === currentMonth && 
        g.startDate.getFullYear() === currentYear &&
        !g.isPortfolioGoal
    );
    
    const inProgress = relevantGoals.filter(g => g.status === 'Em Andamento').length;
    const completed = relevantGoals.filter(g => g.status === 'Concluída').length;
    const overdue = relevantGoals.filter(g => g.status === 'Atrasada').length;
    
    return { inProgress, completed, overdue, total: relevantGoals.length };
  }, [goals]);
  
  // Resumo de Metas de Portfólio
  const portfolioSummary = useMemo(() => {
    const portfolioGoals = goals.filter(g => g.isPortfolioGoal);
    
    const inProgress = portfolioGoals.filter(g => g.status === 'Em Andamento').length;
    const completed = portfolioGoals.filter(g => g.status === 'Concluída').length;
    const overdue = portfolioGoals.filter(g => g.status === 'Atrasada').length;
    
    return { inProgress, completed, overdue, total: portfolioGoals.length };
  }, [goals]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Target className="h-7 w-7 text-dyad-500" />
          <span>Metas e Objetivos</span>
        </h1>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isAdding || isUpdating || isDeleting}
        >
          <Plus className="h-4 w-4 mr-2" /> Nova Meta
        </Button>
      </div>
      
      <p className="text-muted-foreground">Acompanhe seu progresso em objetivos pessoais, profissionais e de portfólio.</p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'geral' | 'portfolio')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geral" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Metas Gerais (Clientes, Financeiro, Pessoal)</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center space-x-2">
            <Briefcase className="h-4 w-4" />
            <span>Metas de Portfólio ({portfolioSummary.total})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral" className="mt-4 space-y-6">
            {/* Resumo de Metas do Mês (Geral) */}
            <Card className="p-4 border-l-4 border-dyad-500/50 shadow-md">
                <CardTitle className="text-lg mb-2">Metas Gerais do Mês</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <span className="text-dyad-500">{monthlySummary.inProgress} em andamento</span>
                    <span className="text-green-500">{monthlySummary.completed} concluída(s)</span>
                    <span className="text-red-500">{monthlySummary.overdue} atrasada(s)</span>
                </div>
            </Card>
        </TabsContent>
        
        <TabsContent value="portfolio" className="mt-4 space-y-6">
            {/* Resumo de Metas de Portfólio */}
            <Card className="p-4 border-l-4 border-blue-500/50 shadow-md">
                <CardTitle className="text-lg mb-2">Estatísticas de Portfólio</CardTitle>
                <div className="flex flex-wrap gap-4 text-sm font-medium">
                    <span className="text-dyad-500">{portfolioSummary.inProgress} em andamento</span>
                    <span className="text-green-500">{portfolioSummary.completed} concluída(s)</span>
                    <span className="text-red-500">{portfolioSummary.overdue} atrasada(s)</span>
                </div>
            </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Filtros e Busca */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="grid gap-2 w-full sm:w-auto flex-grow sm:flex-grow-0">
          <Label htmlFor="search">Buscar por Título/Descrição</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              id="search"
              placeholder="Buscar meta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="grid gap-2 w-full sm:w-40">
          <Label htmlFor="statusFilter">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger id="statusFilter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {activeTab === 'geral' && (
            <div className="grid gap-2 w-full sm:w-40">
              <Label htmlFor="categoryFilter">Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="categoryFilter">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        )}
        
        {activeTab === 'portfolio' && (
            <div className="grid gap-2 w-full sm:w-40">
              <Label htmlFor="portfolioCategoryFilter">Categoria Criativa</Label>
              <Select value={portfolioCategoryFilter} onValueChange={setPortfolioCategoryFilter}>
                <SelectTrigger id="portfolioCategoryFilter">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {PORTFOLIO_CATEGORY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        )}
      </div>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {filteredGoals.length === 0 ? (
          <p className="col-span-full text-center p-8 text-muted-foreground border rounded-lg">
            Nenhuma meta encontrada com os filtros aplicados.
          </p>
        ) : (
          filteredGoals.map(goal => (
            <GoalCard 
              key={goal.id} 
              goal={goal} 
              onEdit={handleOpenEdit} 
              onDelete={deleteGoal}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>

      {/* Diálogo de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
          </DialogHeader>
          <GoalForm 
            initialData={editingGoal}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isSubmitting={isAdding || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GoalsPage;