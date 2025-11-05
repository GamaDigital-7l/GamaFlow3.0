import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export const PlaybookContentSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Título e Botão de Edição */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Blocos de Conteúdo */}
      <div className="space-y-4">
        {/* Bloco 1: Título */}
        <Skeleton className="h-6 w-full" />
        
        {/* Bloco 2: Texto */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        
        {/* Bloco 3: Vídeo Placeholder */}
        <Card className="p-4 border-l-4 border-dyad-500/50">
            <Skeleton className="aspect-video w-full" />
        </Card>
        
        {/* Bloco 4: Texto */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
};