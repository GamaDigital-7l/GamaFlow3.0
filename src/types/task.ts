export type TaskPriority = 'Alta' | 'Média' | 'Baixa';
export type TaskStatus = 'Pendente' | 'Concluída' | 'Atrasada';
export type TaskCategory = 'Geral' | 'Agência' | 'WOE' | 'Hábito'; // Removido 'Clientes', 'Agência' antes de 'WOE'
export type TaskType = 'standard' | 'recurrent' | 'habit'; // NEW: Define TaskType

export interface Task {
  id: string;
  user_id: string; // NEW
  assigneeId?: string; // NEW
  title: string;
  description: string;
  dueDate: Date; // Data e hora de vencimento
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  isRecurrent: boolean;
  clientName?: string; // Para tarefas da categoria 'Clientes'
  completedAt?: Date; // Novo campo para rastrear quando foi concluída
  taskType?: TaskType; // NEW
  subtasks: string[]; // NOVO: Lista de subtarefas
}

// Tipos para a nova página "Tarefas"

export type TargetBoard = 'todayHigh' | 'todayMedium' | 'thisWeekLow' | 'woeTasks' | 'clientTasks' | 'agencyTasks';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  targetBoard: TargetBoard;
  daysOfWeek: DayOfWeek[];
  timeOfDay?: string; // Formato HH:mm:ss
  priority: TaskPriority;
  clientName?: string;
  user_id: string;
  created_at: string;
  category: TaskCategory; // NEW
  taskType?: TaskType; // NEW
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completion_date: string; // YYYY-MM-DD
}