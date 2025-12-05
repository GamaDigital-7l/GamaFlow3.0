import React, { useState, useMemo } from "react";
import { TaskBoard } from "@/components/TaskBoard";
import { useTaskStore } from "@/hooks/use-task-store";
import { useHabits } from "@/hooks/use-habits";
import { TaskCard } from "@/components/TaskCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ListPlus, Loader2, ChevronLeft, ChevronRight, Zap, Briefcase } from 'lucide-react';
import { TaskPriority, TaskCategory, Task } from '@/types/task';
import { TaskEditDialog } from "@/components/TaskEditDialog";
import { ProductivityMetrics } from "@/components/ProductivityMetrics";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { OverdueTaskPill } from "@/components/OverdueTaskPill";
import { HabitPill } from "@/components/HabitPill";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionContextProvider";
import { RecentFeedbackList } from "@/components/RecentFeedbackList";
import { ClientProgressTable } from "@/components/ClientProgressTable";
import { GoalProgressSummary } from "@/components/goals/GoalProgressSummary";
import { Link } from "react-router-dom";
import { TaskDetailedForm } from "@/components/tasks/TaskDetailedForm";

// Novo componente para renderizar o quadro de Hábitos
interface HabitBoardProps {
  habits: any[]; // Usamos 'any' pois são Habit & Status
}

const HabitBoard: React.FC<HabitBoardProps> = ({ habits }) => {
  return (
    <div className={cn("space-y-3 p-4 bg-card border rounded-xl shadow-sm")}>
      <h3 className="text-lg font-bold text-foreground/90 border-b pb-2 mb-2 flex items-center space-x-2">
        <Zap className="h-5 w-5 text-dyad-500" />
        <span>Hábitos de Hoje ({habits.length})</span>
      </h3>
      
      {/* Botão para adicionar novo hábito (Redireciona para a página de configuração) */}
      <Button 
        variant="ghost" 
        size="sm" 
        asChild
        className="h-8 px-2 text-sm text-dyad-500 hover:bg-dyad-50 dark:hover:bg-dyad-950/50"
      >
        <Link to="/tasks">
          <ListPlus className="h-4 w-4 mr-1" /> Gerenciar Hábitos
        </Link>
      </Button>
      
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md text-center">
            Nenhum hábito esperado para hoje.
          </p>
        ) : (
          habits.map(habit => (
            <HabitPill key={habit.id} habit={habit} />
          ))
        )}
      </div>
    </div>
  );
};


const Index = () => {
  const { 
    overdue, 
    todayHigh, 
    todayMedium, 
    thisWeekLow, 
    woeTasks, 
    agencyTasks,
    generalTasks, // NOVO: Tarefas gerais/backlog
    completed,
    completeTask,
    updateTask,
    deleteTask,
    isLoading: isLoadingTasks,
  } = useTaskStore();
  
  const { habits: allHabits, isLoading: isLoadingHabits, habitAlerts } = useHabits();
  const { userRole } = useSession();

  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailedFormOpen, setIsDetailedFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null); 
  
  const [formDefaults, setFormDefaults] = useState<{ category: TaskCategory, priority: TaskPriority }>({
    category: 'Geral',
    priority: 'Baixa',
  });

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  };

  const handleOpenDetailedForm = (category: TaskCategory = 'Geral', priority: TaskPriority = 'Baixa') => {
    setFormDefaults({ category, priority });
    setIsDetailedFormOpen(true);
  };

  const handleCloseDetailedForm = () => {
    setIsDetailedFormOpen(false);
  };
  
  // Wrapper para deleteTask que recebe o objeto Task e extrai o ID
  const handleDeleteTaskWrapper = (task: Task) => {
    deleteTask(task.id);
  };

  // Filtra hábitos ativos que são esperados para hoje
  const activeHabitsToday = useMemo(() => {
    return allHabits.filter(h => h.isExpectedToday && !h.isCompletedToday);
  }, [allHabits]);

  const taskBoards = useMemo(() => [
    { 
      title: "Prioridade Alta", 
      tasks: todayHigh, 
      className: "",
      defaultCategory: 'Geral' as TaskCategory, 
      defaultPriority: 'Alta' as TaskPriority 
    },
    { 
      title: "Prioridade Média", 
      tasks: todayMedium, 
      className: "",
      defaultCategory: 'Geral' as TaskCategory, 
      defaultPriority: 'Média' as TaskPriority 
    },
    { 
      title: "Gama Creative (Agência)", 
      tasks: agencyTasks, 
      className: "bg-dyad-50/50 dark:bg-dyad-950/50",
      defaultCategory: 'Agência' as TaskCategory, 
      defaultPriority: 'Alta' as TaskPriority 
    },
    { 
      title: "WOE Comunicação", 
      tasks: woeTasks, 
      className: "bg-blue-50/50 dark:bg-blue-950/50",
      defaultCategory: 'WOE' as TaskCategory, 
      defaultPriority: 'Média' as TaskPriority 
    },
    { 
      title: "Esta Semana (Baixa)", 
      tasks: thisWeekLow, 
      className: "",
      defaultCategory: 'Geral' as TaskCategory, 
      defaultPriority: 'Baixa' as TaskPriority 
    },
    // REMOVIDO: { 
    //   title: "Geral / Backlog", 
    //   tasks: generalTasks, 
    //   className: "bg-muted/50",
    //   defaultCategory: 'Geral' as TaskCategory, 
    //   defaultPriority: 'Baixa' as TaskPriority 
    // },
    { 
      title: "Concluídas",
      tasks: completed, 
      className: "opacity-80",
      defaultCategory: 'Geral' as TaskCategory, 
      defaultPriority: 'Baixa' as TaskPriority 
    },
  ], [todayHigh, todayMedium, woeTasks, agencyTasks, thisWeekLow, generalTasks, completed]);

  const scrollOverdue = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = scrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth',
      });
    }
  };

  const OverdueSection = (
    overdue.length > 0 ? (
      <Card className="p-4 shadow-lg bg-card border">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-bold text-foreground">
            Tarefas Atrasadas ({overdue.length})
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Resolva-as o mais rápido possível.
        </p>
        
        <div className="relative">
          <ScrollArea className="w-full whitespace-nowrap pb-2" ref={scrollRef}>
            <div className="flex space-x-4">
              {overdue.map(task => (
                <div key={task.id} className="w-[280px] flex-shrink-0">
                  <OverdueTaskPill task={task} onEdit={handleEditTask} />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </Card>
    ) : null
  );

  if (isLoadingTasks || isLoadingHabits) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 mobile-container">
      {/* Alerta de Quebra de Hábito no Topo */}
      {habitAlerts.length > 0 && (
        <Alert className="bg-red-50 border-red-500/50 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-200 p-4 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertTitle className="font-bold text-lg">Alerta de Hábito Quebrado!</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            {habitAlerts.map((alert, index) => (
              <p key={index} className="text-sm">{alert.message}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Título e Botão de Adição Detalhada Global */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Tarefas</h1>
        <Button 
          onClick={() => handleOpenDetailedForm()}
          className="bg-dyad-500 hover:bg-dyad-600"
        >
          <ListPlus className="h-4 w-4 mr-2" /> Adicionar Tarefa
        </Button>
      </div>

      {/* Mobile: Atrasadas vêm primeiro */}
      {isMobile && OverdueSection}

      {/* Desktop: Atrasadas vêm depois do título */}
      {!isMobile && OverdueSection}

      <Separator />
      
      {/* 1. Organização dos Quadros (Grid Responsivo) */}
      {/* Ajuste: Grid de 1 coluna no mobile, 2 no md, 3 no lg, 4 no xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Renderiza os quadros de tarefas normais */}
        {taskBoards.map(section => (
          <TaskBoard 
            key={section.title}
            title={section.title}
            tasks={section.tasks}
            onComplete={completeTask}
            onEdit={handleEditTask}
            className={section.className}
            defaultCategory={section.defaultCategory}
            defaultPriority={section.defaultPriority}
            onOpenDetailedForm={() => handleOpenDetailedForm(section.defaultCategory, section.defaultPriority)}
          />
        ))}
        
        {/* Quadro de Hábitos de Hoje (Penúltimo) */}
        <HabitBoard 
          habits={allHabits.filter(h => h.isExpectedToday)} // Mostra todos os esperados, mesmo os concluídos
        />
      </div>

      <Separator />
      
      {/* 2. Métricas de Produtividade (Substituindo o Resumo de IA) */}
      <ProductivityMetrics />
      
      {/* 3. Progresso de Clientes e Feedbacks (RODAPÉ) */}
      {userRole === 'admin' && (
        <div className="space-y-6">
            {/* ClientProgressTable já é responsivo internamente */}
            <ClientProgressTable />
            {/* RecentFeedbackList: Ocupa a largura total no mobile */}
            <RecentFeedbackList />
        </div>
      )}
      
      {/* Diálogo de Edição */}
      {selectedTask && (
        <TaskEditDialog
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          task={selectedTask}
          onSave={updateTask}
          onDelete={handleDeleteTaskWrapper}
        />
      )}

      {/* Diálogo de Adição Detalhada */}
      <Dialog open={isDetailedFormOpen} onOpenChange={setIsDetailedFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tarefa Detalhada</DialogTitle>
          </DialogHeader>
          {/* USANDO O NOVO COMPONENTE TaskDetailedForm */}
          <TaskDetailedForm 
            onCancel={handleCloseDetailedForm} 
            initialCategory={formDefaults.category}
            initialPriority={formDefaults.priority}
          />
        </DialogContent>
      </Dialog>
      
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Gama Creative Design Studio ®
        </p>
      </div>
    </div>
  );
};

export default Index;