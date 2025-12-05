import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Loader2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Goal, GoalCategory, GoalStatus, PortfolioGoalType, PortfolioCategory } from '@/types/goals';
import { showError } from '@/utils/toast';
import { useClientStore } from '@/hooks/use-client-store';
import { Separator } from '@/components/ui/separator'; // Importação adicionada
import { useGoals } from '@/hooks/use-goals';
import { GoalCard } from '@/components/goals/GoalCard';
import { GoalForm } from '@/components/goals/GoalForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const GoalsPage: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const { goals, addGoal, updateGoal, deleteGoal, isAdding, isUpdating, isDeleting } = useGoals();

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
      updateGoal({ ...editingGoal, ...goalData });
    } else {
      addGoal(goalData);
    }
    handleCloseDialog();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Metas e Objetivos</h1>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-dyad-500 hover:bg-dyad-600">
          <Plus className="h-4 w-4 mr-2" /> Nova Meta
        </Button>
      </div>
      <p className="text-muted-foreground">Defina e acompanhe suas metas pessoais e profissionais.</p>

      {/* Ajuste do grid para 1 coluna no mobile, 2 no md, 3 no lg */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(goal => (
          <GoalCard 
            key={goal.id} 
            goal={goal} 
            onEdit={handleOpenEdit} 
            onDelete={deleteGoal}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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