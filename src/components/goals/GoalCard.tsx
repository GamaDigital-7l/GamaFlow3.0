import React from 'react';
import { Goal, GoalStatus } from '@/types/goals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Target, Clock, CheckCircle, AlertTriangle, Loader2, Link as LinkIcon, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';

// Tipo estendido do Goal com o campo percentage
interface GoalWithProgress extends Goal {
  percentage: number;
}

interface GoalCardProps {
  goal: GoalWithProgress;
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const getCategoryColor = (category: Goal['category']) => {
  switch (category) {
    case 'Financeiro': return 'bg-green-600 hover:bg-green-700';
    case 'Pessoal': return 'bg-blue-600 hover:bg-blue-700';
    case 'Profissional': return 'bg-purple-600 hover:bg-purple-700';
    case 'Saúde': return 'bg-red-600 hover:bg-red-700';
    case 'Clientes': return 'bg-yellow-600 hover:bg-yellow-700';
    case 'Agência': return 'bg-dyad-500 hover:bg-dyad-600';
    default: return 'bg-gray-500 hover:bg-gray-600';
  }
};

const getProgressColor = (status: GoalStatus) => {
  switch (status) {
    case 'Concluída': return 'bg-green-500';
    case 'Atrasada': return 'bg-red-500';
    case 'Em Andamento': return 'bg-dyad-500';
    default: return 'bg-gray-500';
  }
};

const formatValue = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    // Formatação simples para números grandes
    if (value >= 1000) {
        return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }
    return value.toString();
};

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, isDeleting }) => {
  const progressColor = getProgressColor(goal.status);
  const categoryColor = getCategoryColor(goal.category);
  
  const isOverdue = goal.status === 'Atrasada';
  const isCompleted = goal.status === 'Concluída';
  const isPortfolio = goal.isPortfolioGoal;

  return (
    <Card className={cn(
      "p-4 space-y-3 transition-shadow hover:shadow-lg flex flex-col justify-between",
      isOverdue && "border-red-500 border-2",
      isCompleted && "opacity-80 border-green-500/50",
      isPortfolio && "border-l-4 border-blue-500/50" // Destaque para metas de portfólio
    )}>
      <CardHeader className="p-0 pb-2 border-b border-border/50">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold line-clamp-2 pr-4">{goal.title}</CardTitle>
          <div className="flex flex-col items-end space-y-1">
            <Badge className={cn("text-white text-xs flex-shrink-0", categoryColor)}>
              {goal.category}
            </Badge>
            {isPortfolio && (
                <Badge variant="secondary" className="text-xs flex items-center space-x-1">
                    <Briefcase className="h-3 w-3" />
                    <span>Portfólio</span>
                </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>
      </CardHeader>
      
      <CardContent className="p-0 space-y-3 flex-grow">
        
        {/* Progresso */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-muted-foreground">Progresso:</span>
            <span className={cn("font-semibold", isCompleted ? 'text-green-500' : isOverdue ? 'text-red-500' : 'text-dyad-500')}>
              {goal.percentage}%
            </span>
          </div>
          <Progress value={goal.percentage} className="h-2" className={progressColor} />
          
          {goal.targetValue !== undefined && (
            <p className="text-xs text-muted-foreground text-right pt-1">
              {formatValue(goal.currentValue)} / {formatValue(goal.targetValue)}
            </p>
          )}
        </div>
        
        {/* Detalhes do Portfólio */}
        {isPortfolio && (
            <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-xs font-semibold text-foreground/80">Detalhes do Projeto:</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{goal.portfolioType}</Badge>
                    <Badge variant="outline">{goal.portfolioCategory}</Badge>
                </div>
                {goal.portfolioLinks && goal.portfolioLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {goal.portfolioLinks.map((link, index) => (
                            <Button key={index} variant="link" size="sm" asChild className="h-6 p-0 text-xs text-blue-500">
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    <LinkIcon className="h-3 w-3 mr-1" /> Link {index + 1}
                                </a>
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        )}
        
        {/* Status e Data */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center space-x-1">
            {isCompleted ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : isOverdue ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 text-dyad-500" />
            )}
            <span className={cn("font-medium", isCompleted ? 'text-green-500' : isOverdue ? 'text-red-500' : 'text-foreground/80')}>
              {goal.status}
            </span>
          </div>
          <div className="text-xs">
            {goal.dueDate && `Prazo: ${formatDate(goal.dueDate)}`}
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={() => onEdit(goal)} disabled={isDeleting}>
            <Edit className="h-4 w-4 mr-2" /> Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(goal.id)} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};