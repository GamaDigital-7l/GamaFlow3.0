import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, CheckCircle, ListTodo } from 'lucide-react';
import { useAiSummary } from '@/hooks/use-ai-summary';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

export const DailySummaryCard: React.FC = () => {
  const { summary, isLoading, isAiEnabled, tasksCompletedToday, tasksPendingToday } = useAiSummary();
  const today = format(new Date(), 'EEEE, dd/MM', { locale: ptBR });

  if (!isAiEnabled) {
    return (
        <Card className="p-4 border-l-4 border-gray-500/50 shadow-md">
            <CardHeader className="flex items-center space-x-2 pb-2">
                <Brain className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">Resumo Diário (IA Desativada)</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2 text-sm text-muted-foreground">
                Ative o Resumo Diário por IA nas Configurações do App para ver a análise de produtividade.
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="p-4 border-l-4 border-dyad-500/50 shadow-md">
      <CardHeader className="flex items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold flex items-center space-x-2">
          <Brain className="h-5 w-5 text-dyad-500" />
          <span>Resumo Diário de Produtividade</span>
        </CardTitle>
        <span className="text-sm text-muted-foreground capitalize">{today}</span>
      </CardHeader>
      <CardContent className="p-0 pt-2 space-y-3">
        {isLoading ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
            <p className="mt-2 text-sm text-muted-foreground">Gerando análise de IA...</p>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap text-foreground/90">{summary}</p>
        )}
        
        <Separator />
        
        <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-1" /> Concluídas Hoje
            </span>
            <span className="font-bold">{tasksCompletedToday.length}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
            <span className="flex items-center text-red-500">
              <ListTodo className="h-4 w-4 mr-1" /> Pendentes (Total)
            </span>
            <span className="font-bold">{tasksPendingToday.length}</span>
        </div>
      </CardContent>
    </Card>
  );
};