export type GoalCategory = 'Financeiro' | 'Pessoal' | 'Profissional' | 'Saúde' | 'Clientes' | 'Agência' | 'Outros';
export type GoalStatus = 'Em Andamento' | 'Concluída' | 'Atrasada';
export type PortfolioGoalType = 'Projeto Real' | 'Projeto Conceito' | 'Estudo Pessoal';
export type PortfolioCategory = 'Design' | '3D' | 'Vídeo' | 'Landing Page' | 'Social Media' | 'Outro';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  startDate: Date;
  dueDate: Date;
  targetValue?: number;
  currentValue: number;
  isRecurrent: boolean;
  status: GoalStatus;
  clientId?: string; // Para vincular a clientes
  createdAt: string;
  
  // Campos de Metas de Portfólio
  isPortfolioGoal?: boolean;
  portfolioType?: PortfolioGoalType;
  portfolioCategory?: PortfolioCategory;
  portfolioLinks?: string[]; // Links diretos (Behance, etc.)
}