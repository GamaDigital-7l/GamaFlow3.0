import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientFeedback } from '@/hooks/use-client-feedback';
import { useClientStore } from '@/hooks/use-client-store';
import { Loader2, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/date';
import { cn } from '@/lib/utils';

const ClientFeedbackPage: React.FC = () => {
  const { feedback, isLoading } = useClientFeedback();
  const { clients } = useClientStore();

  const clientMap = useMemo(() => {
    return new Map(clients.map(c => [c.id, c.name]));
  }, [clients]);

  const getClientName = (clientId: string) => {
    return clientMap.get(clientId) || 'Cliente Desconhecido';
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground">Carregando feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
        <MessageSquare className="h-7 w-7 text-dyad-500" />
        <span>Feedbacks de Clientes</span>
      </h1>
      <p className="text-muted-foreground">Visualize as opiniões dos clientes sobre o processo de aprovação.</p>

      <Card>
        <CardHeader>
          <CardTitle>Total de Feedbacks ({feedback.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Tipo</TableHead>
                  <TableHead className="w-[200px]">Cliente</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead className="w-[180px]">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum feedback registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  feedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge className={cn(
                          item.type === 'praise' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        )}>
                          {item.type === 'praise' ? <ThumbsUp className="h-3 w-3 mr-1" /> : <ThumbsDown className="h-3 w-3 mr-1" />}
                          {item.type === 'praise' ? 'Elogio' : 'Melhoria'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{getClientName(item.client_id)}</TableCell>
                      <TableCell className="whitespace-pre-wrap max-w-lg">{item.feedback}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDateTime(item.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFeedbackPage;