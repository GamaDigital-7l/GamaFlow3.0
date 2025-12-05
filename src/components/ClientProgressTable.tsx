import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientStore } from '@/hooks/use-client-store';
import { Loader2, Target, CheckCircle, AlertTriangle } from 'lucide-react';
import { ClientProgressCard } from './ClientProgressCard';
import { cn } from '@/lib/utils';

export const ClientProgressTable: React.FC = () => {
  // O hook useClientStore já retorna os clientes com os dados de progresso calculados
  const { clients, isLoading } = useClientStore();

  const activeClients = clients.filter(c => c.status === 'Ativo' || c.status === 'Pausado');

  if (isLoading) {
    return (
      <Card className="p-6">
        <Loader2 className="h-6 w-6 animate-spin text-dyad-500 mx-auto" />
        <p className="mt-2 text-muted-foreground text-center">Calculando progresso dos clientes...</p>
      </Card>
    );
  }
  
  if (activeClients.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">Nenhum cliente ativo para monitorar o progresso.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center space-x-2">
          <Target className="h-5 w-5 text-dyad-500" />
          <span>Progresso Mensal de Clientes</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Acompanhe o status de posts concluídos vs. meta contratada no mês atual.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClients.map(client => (
            // Usamos o ClientProgressCard, mas desabilitamos o clique para evitar modais aninhados no Dashboard
            <ClientProgressCard 
                key={client.id} 
                client={client as any} 
                isClickable={true} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};