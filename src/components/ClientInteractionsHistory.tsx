import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientInteractions, ClientInteraction } from '@/hooks/use-client-interactions';
import { Loader2, MessageSquare, Edit, Clock } from 'lucide-react';
import { formatDateTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ClientInteractionsHistoryProps {
  clientId: string;
  clientName: string;
}

const InteractionItem: React.FC<{ interaction: ClientInteraction }> = ({ interaction }) => {
    const isFeedback = interaction.interaction_type === 'feedback';
    
    return (
        <div className="p-3 border rounded-lg bg-muted/30 space-y-1">
            <div className="flex justify-between items-center">
                <Badge className={cn(
                    "text-xs",
                    isFeedback ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
                )}>
                    {isFeedback ? 'Feedback' : 'Pedido de Edição'}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(interaction.created_at)}</span>
                </span>
            </div>
            <p className="text-sm whitespace-pre-wrap pt-1">{interaction.content}</p>
        </div>
    );
};

export const ClientInteractionsHistory: React.FC<ClientInteractionsHistoryProps> = ({ clientId, clientName }) => {
  const { interactions, isLoading } = useClientInteractions(clientId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground text-center">Carregando histórico...</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-dyad-500" />
          <span>Histórico de Interações ({clientName})</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Feedbacks e pedidos de edição registrados pelo cliente.</p>
      </CardHeader>
      <CardContent className="flex-grow max-h-[60vh] overflow-y-auto">
        {interactions.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground border rounded-lg">
            Nenhuma interação registrada ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.map((item) => (
              <InteractionItem key={item.id} interaction={item} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};