import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Loader2, Plus, X, Zap, Edit, Trash2 } from 'lucide-react';
import { TaskTemplate, TaskPriority, TargetBoard, DayOfWeek, TaskCategory, TaskType, Habit } from '@/types/task';
import { TemplateForm } from '@/components/tasks/TemplateForm';
import { HabitForm } from '@/components/tasks/HabitForm'; // Importando HabitForm
import { withRole } from '@/components/withRole';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Importando Tabs
import { useTaskTemplates } from '@/hooks/use-task-templates';
import { useHabits } from '@/hooks/use-habits';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Mapeamento de TargetBoard para Título
const TARGET_BOARD_TITLES: Record<TargetBoard, string> = {
  todayHigh: 'Hoje — Prioridade Alta',
  todayMedium: 'Hoje — Prioridade Média',
  thisWeekLow: 'Esta Semana — Baixa',
  woeTasks: 'WOE Comunicação',
  clientTasks: 'Tarefas de Cliente',
  agencyTasks: 'Gama Creative (Agência)',
};

const DAY_LABEL_MAP: Record<DayOfWeek, string> = {
    Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb', Sun: 'Dom'
};

// --- Componente de Listagem de Templates ---

interface TemplateListProps {
  templates: TaskTemplate[];
  onEdit: (template: TaskTemplate) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const TemplateList: React.FC<TemplateListProps> = ({ templates, onEdit, onDelete, isDeleting }) => (
  <div className="space-y-3">
    {templates.length === 0 ? (
      <p className="text-muted-foreground text-center p-4 border rounded-lg">Nenhum template de tarefa padrão cadastrado.</p>
    ) : (
      templates.map(template => (
        <Card key={template.id} className="p-4 flex justify-between items-center transition-shadow flex-wrap gap-2">
          <div className="space-y-1 min-w-0 flex-grow pr-4">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold truncate">{template.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground truncate">{template.description}</p>
            <div className="flex flex-wrap items-center text-xs space-x-2 pt-1">
              <Badge variant="secondary" className="text-dyad-500">{TARGET_BOARD_TITLES[template.targetBoard]}</Badge>
              <Badge className={cn("text-white", template.priority === 'Alta' ? 'bg-red-500' : template.priority === 'Média' ? 'bg-yellow-500' : 'bg-green-500')}>
                {template.priority}
              </Badge>
              {template.clientName && <Badge variant="outline">{template.clientName}</Badge>}
              <Badge variant="outline">{template.category}</Badge>
              <Badge variant="outline">{template.taskType}</Badge>
              <span className="text-xs text-gray-500">
                {(template.daysOfWeek || []).map(d => DAY_LABEL_MAP[d]).join(', ')}
                {template.timeOfDay && ` às ${template.timeOfDay.substring(0, 5)}`}
              </span>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(template.id)} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </Card>
      ))
    )}
  </div>
);

// --- Componente de Listagem de Hábitos ---

interface HabitListProps {
  habits: Habit[];
  onEdit: (habit: Habit) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const HabitList: React.FC<HabitListProps> = ({ habits, onEdit, onDelete, isDeleting }) => (
  <div className="space-y-3">
    {habits.length === 0 ? (
      <p className="text-muted-foreground text-center p-4 border rounded-lg">Nenhum hábito cadastrado.</p>
    ) : (
      habits.map(habit => (
        <Card key={habit.id} className="p-4 flex justify-between items-center transition-shadow flex-wrap gap-2">
          <div className="space-y-1 min-w-0 flex-grow pr-4">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold truncate">{habit.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground truncate">{habit.description}</p>
            <div className="flex flex-wrap items-center text-xs space-x-2 pt-1">
              <Badge className="bg-dyad-500 text-white">Hábito</Badge>
              <span className="text-xs text-gray-500">
                Frequência: {habit.frequency === 'daily' ? 'Diária' : habit.frequency.split(',').map(d => DAY_LABEL_MAP[d as DayOfWeek]).join(', ')}
              </span>
            </div>
          </div>
          <div className="flex space-x-2 flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => onEdit(habit)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(habit.id)} disabled={isDeleting}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </Card>
      ))
    )}
  </div>
);


const TasksConfigPage: React.FC = () => {
  const { templates, isLoading: isLoadingTemplates, addTemplate, updateTemplate, deleteTemplate, isAdding: isAddingTemplate, isUpdating: isUpdatingTemplate, isDeleting: isDeletingTemplate } = useTaskTemplates();
  const { habits, isLoading: isLoadingHabits, addHabit, updateHabit, deleteHabit, isAdding: isAddingHabit, isUpdating: isUpdatingHabit, isDeleting: isDeletingHabit } = useHabits();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | undefined>(undefined);
  
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  
  const [activeTab, setActiveTab] = useState('templates');

  const handleOpenEditTemplate = (template: TaskTemplate) => {
    setEditingTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  const handleCloseTemplateDialog = () => {
    setIsTemplateDialogOpen(false);
    setEditingTemplate(undefined);
  };
  
  const handleOpenEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsHabitDialogOpen(true);
  };

  const handleCloseHabitDialog = () => {
    setIsHabitDialogOpen(false);
    setEditingHabit(undefined);
  };
  
  const handleHabitSubmit = (habitData: Habit | Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
    if ('id' in habitData && habitData.id) {
        updateHabit(habitData as Habit);
    } else {
        addHabit(habitData as Omit<Habit, 'id' | 'user_id' | 'created_at'>);
    }
    handleCloseHabitDialog();
  };

  const isLoading = isLoadingTemplates || isLoadingHabits;
  const isMutating = isAddingTemplate || isUpdatingTemplate || isDeletingTemplate || isAddingHabit || isUpdatingHabit || isDeletingHabit;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuração de Tarefas</h1>
        <Button 
          onClick={() => activeTab === 'templates' ? setIsTemplateDialogOpen(true) : setIsHabitDialogOpen(true)} 
          className="bg-dyad-500 hover:bg-dyad-600"
          disabled={isMutating}
        >
          <Plus className="h-4 w-4 mr-2" /> Novo {activeTab === 'templates' ? 'Template' : 'Hábito'}
        </Button>
      </div>
      
      <p className="text-muted-foreground">Gerencie templates de tarefas automáticas e hábitos recorrentes.</p>

      <Tabs defaultValue="templates" onValueChange={setActiveTab}>
        {/* Ajuste para TabsList responsivo */}
        <TabsList className="grid w-full grid-cols-2 h-auto flex-wrap">
          <TabsTrigger value="templates">Templates de Tarefas</TabsTrigger>
          <TabsTrigger value="habits" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Hábitos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {isLoadingTemplates ? (
                <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" /></div>
              ) : (
                <TemplateList 
                  templates={templates} 
                  onEdit={handleOpenEditTemplate} 
                  onDelete={deleteTemplate}
                  isDeleting={isDeletingTemplate}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="habits" className="mt-4">
          <Card>
            <CardContent className="p-6">
              {isLoadingHabits ? (
                <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" /></div>
              ) : (
                <HabitList 
                  habits={habits} 
                  onEdit={handleOpenEditHabit} 
                  onDelete={deleteHabit}
                  isDeleting={isDeletingHabit}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo de Criação/Edição de Template */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={handleCloseTemplateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Editar Template' : 'Novo Template'}</DialogTitle>
          </DialogHeader>
          <TemplateForm 
            initialData={editingTemplate}
            onSubmit={editingTemplate ? updateTemplate : addTemplate}
            onCancel={handleCloseTemplateDialog}
            isSubmitting={isAddingTemplate || isUpdatingTemplate}
          />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Criação/Edição de Hábito */}
      <Dialog open={isHabitDialogOpen} onOpenChange={handleCloseHabitDialog}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingHabit ? 'Editar Hábito' : 'Novo Hábito Recorrente'}</DialogTitle>
          </DialogHeader>
          <HabitForm 
            initialData={editingHabit}
            onSubmit={handleHabitSubmit}
            onCancel={handleCloseHabitDialog}
            isSubmitting={isAddingHabit || isUpdatingHabit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default withRole(TasksConfigPage, 'admin');