import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientFeedback } from '@/hooks/use-client-feedback';
import { useClientStore } from '@/hooks/use-client-store';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export const RecentFeedbackList: React.FC = () => {
  const { feedback, isLoading } = useClientFeedback();
  const { clients } = useClientStore();

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const getClientName = (clientId: string) => {
    return clientMap.get(clientId) || 'Cliente Desconhecido';
  };
  
  // Exibe apenas os 5 feedbacks mais recentes
  const recentFeedback = useMemo(() => feedback.slice(0, 5), [feedback]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-dyad-500" />
          <span>Feedbacks Recentes</span>
        </CardTitle>
        <Link to="/admin/feedback" className="text-sm text-dyad-500 hover:underline flex items-center">
            Ver Todos <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </CardHeader>
      <CardContent className="flex-grow">
        {isLoading ? (
          <div className="text-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
          </div>
        ) : recentFeedback.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground border rounded-lg">
            Nenhum feedback recente.
          </div>
        ) : (
          <div className="space-y-3">
            {recentFeedback.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex justify-between items-start mb-1">
                  <Badge className={cn(
                    "text-xs",
                    item.type === 'praise' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  )}>
                    {item.type === 'praise' ? <ThumbsUp className="h-3 w-3 mr-1" /> : <ThumbsDown className="h-3 w-3 mr-1" />}
                    {item.type === 'praise' ? 'Elogio' : 'Melhoria'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
                <p className="text-sm font-medium line-clamp-2">{item.feedback}</p>
                <p className="text-xs text-dyad-500 mt-1">
                  Cliente: {getClientName(item.client_id)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};