import React, { useState } from 'react';
import { Client, Post } from '@/types/client';
import { Progress } from '@/components/ui/progress';
import { ProgressProps } from "@radix-ui/react-progress";
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Target, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientProgressModal } from './ClientProgressModal';

// Tipo estendido do cliente com dados de progresso
interface ClientWithProgress extends Client {
  completedPostsThisMonth: Post[];
  completedCount: number;
  goal: number;
  percentage: number;
  progressStatus: 'Atingida' | 'Em Progresso'; // Removido 'Atrasada'
}

interface ClientProgressCardProps {
  client: ClientWithProgress;
  isClickable?: boolean;
}

export const ClientProgressCard: React.FC<ClientProgressCardProps> = ({ client, isClickable = true }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusColorClass = () => {
    if (client.progressStatus === 'Atingida') return 'bg-green-500';
    // Usando a cor primária Dyad para "Em Progresso"
    return 'bg-dyad-500'; 
  };
  
  const getIcon = () => {
    if (client.progressStatus === 'Atingida') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Target className="h-4 w-4 text-dyad-500" />;
  };

  // Classes para o card principal (usado no Dashboard)
  const dashboardCardClasses = cn(
    "p-4 space-y-3 transition-shadow",
    isClickable ? "cursor-pointer hover:shadow-lg" : "shadow-md"
  );

  // Conteúdo Minimalista (Usado na página Clients)
  const MinimalProgressContent = (
    <div className="space-y-1">
        <div className="flex justify-between text-xs font-medium">
            <span className="text-muted-foreground">Progresso Mensal:</span>
            <span className={cn(client.progressStatus === 'Atingida' ? 'text-green-500' : 'text-foreground')}>
              {client.completedCount} / {client.goal} posts
            </span>
        </div>
        <Progress 
          value={client.percentage} 
          className={cn("h-1.5", getStatusColorClass())}
        />
    </div>
  );
  
  // Se não for clicável, retorna o conteúdo minimalista
  if (!isClickable) {
    return MinimalProgressContent;
  }
  
  // Se for clicável (Dashboard), renderiza o card completo e abre o modal
  return (
      <>
        <Card 
          className={dashboardCardClasses}
          onClick={() => setIsModalOpen(true)}
        >
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold truncate">{client.name}</CardTitle>
            <div className="flex items-center space-x-1 text-sm">
                {getIcon()}
                <span className={cn(
                    "font-semibold text-xs",
                    client.progressStatus === 'Atingida' ? 'text-green-500' : 'text-dyad-500'
                )}>
                    {client.progressStatus}
                </span>
            </div>
          </CardHeader>
          
          <CardContent className="p-0 space-y-3">
            
            {/* Linha de Progresso */}
            <div className="flex justify-between text-sm font-medium">
              <span className="text-muted-foreground">Concluídos:</span>
              <span className="text-foreground">
                {client.completedCount} / {client.goal} posts
              </span>
            </div>
            
            <Progress 
              value={client.percentage} 
              className={cn("h-2", getStatusColorClass())}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{client.percentage}%</span>
              <span className="text-dyad-500 flex items-center hover:underline">
                  Ver Detalhes <ArrowRight className="h-3 w-3 ml-1" />
              </span>
            </div>
          </CardContent>
        </Card>
        
        <ClientProgressModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          clientName={client.name}
          clientId={client.id}
          goal={client.goal}
          completedCount={client.completedCount}
          percentage={client.percentage}
          completedPosts={client.completedPostsThisMonth}
          progressStatus={client.progressStatus}
        />
      </>
  );
};