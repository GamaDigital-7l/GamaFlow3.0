import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/client';
import { CheckCircle, FileText, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { ProgressProps } from "@radix-ui/react-progress";
import { useNavigate } from 'react-router-dom';

interface ClientProgressModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  clientId: string;
  goal: number;
  completedCount: number;
  percentage: number;
  completedPosts: Post[];
  progressStatus: 'Atingida' | 'Em Progresso'; // Removido 'Atrasada'
}

export const ClientProgressModal: React.FC<ClientProgressModalProps> = ({
  isOpen,
  onOpenChange,
  clientName,
  clientId,
  goal,
  completedCount,
  percentage,
  completedPosts,
  progressStatus,
}) => {
  const navigate = useNavigate();
  const remaining = Math.max(0, goal - completedCount);
  
  const getStatusColorClass = () => {
    if (progressStatus === 'Atingida') return 'bg-green-500';
    return 'bg-dyad-500';
  };
  
  const getBorderColorClass = () => {
    if (progressStatus === 'Atingida') return 'border-green-500/50';
    return 'border-dyad-500/50';
  };

  const handleViewKanban = () => {
    onOpenChange(false);
    navigate(`/clients/${clientId}`);
  };
  
  const statusColorClass = getStatusColorClass();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Progresso Mensal: {clientName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          
          {/* Resumo do Progresso */}
          <Card className={cn("p-4 border-l-4", getBorderColorClass())}>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Meta: {goal} posts</h3>
              <span className={cn("text-sm font-bold px-3 py-1 rounded-full text-white", statusColorClass)}>
                {progressStatus}
              </span>
            </div>
            <p className="text-4xl font-extrabold text-dyad-500">
              {completedCount} / {goal}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {remaining > 0 ? `${remaining} posts restantes para atingir a meta.` : 'Meta mensal atingida!'}
            </p>
            <Progress 
              value={percentage} 
              className={cn("mt-3 h-2", statusColorClass)}
            />
          </Card>
          
          {/* Lista de Posts Concluídos */}
          <h3 className="text-xl font-semibold pt-4 border-t">Posts Concluídos no Mês ({completedCount})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2">
            {completedPosts.length === 0 ? (
              <p className="text-muted-foreground col-span-2 text-center p-4">Nenhum post concluído neste mês.</p>
            ) : (
              completedPosts.map(post => (
                <Card key={post.id} className="p-3 flex items-center space-x-3 bg-muted/50">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">Concluído em: {formatDate(post.dueDate)}</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleViewKanban}>
            <FileText className="h-4 w-4 mr-2" /> Ver Kanban do Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};